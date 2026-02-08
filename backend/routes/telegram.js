const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { 
  generateVerificationCode, 
  getTelegramConnectionStatus,
  disconnectTelegram,
  generateUserVerificationCode,
  getUserTelegramConnectionStatus,
  disconnectUserTelegram,
  linkUserTelegram,
  checkUserLinkingStatus
} = require('../models/clubModel');
const auth = require('../middleware/auth');
const { getClubsByOwnerId } = require('../models/clubModel');

// ========== СУЩЕСТВУЮЩИЕ МЕТОДЫ ДЛЯ ВЛАДЕЛЬЦЕВ КЛУБОВ ==========

// Генерация кода верификации для подключения Telegram
router.post('/generate-code', auth, async (req, res) => {
  try {
    // Проверяем, является ли пользователь владельцем клуба
    const userClubs = await getClubsByOwnerId(req.userId);
    
    if (userClubs.length === 0) {
      return res.status(403).json({ 
        error: 'Только владельцы клубов могут подключить Telegram уведомления' 
      });
    }
    
    const verificationCode = await generateVerificationCode(req.userId);
    
    res.json({ 
      success: true,
      verificationCode,
      botUsername: process.env.TELEGRAM_BOT_USERNAME || 'YourBotUsername',
      clubName: userClubs[0].name,
      instructions: {
        step1: `Перейдите в Telegram к боту @${process.env.TELEGRAM_BOT_USERNAME || 'YourBotUsername'}`,
        step2: `Отправьте команду: /start ${verificationCode}`,
        step3: 'Дождитесь подтверждения подключения',
        note: 'Код действителен в течение 24 часов'
      }
    });
  } catch (err) {
    console.error('Ошибка генерации кода верификации:', err);
    res.status(500).json({ 
      error: 'Ошибка при генерации кода верификации',
      details: err.message 
    });
  }
});

// Проверка статуса подключения Telegram
router.get('/status', auth, async (req, res) => {
  try {
    const status = await getTelegramConnectionStatus(req.userId);
    
    // Получаем информацию о клубе для дополнительного контекста
    const userClubs = await getClubsByOwnerId(req.userId);
    const isClubOwner = userClubs.length > 0;
    
    res.json({
      ...status,
      isClubOwner,
      clubName: isClubOwner ? userClubs[0].name : null,
      botUsername: process.env.TELEGRAM_BOT_USERNAME || 'YourBotUsername'
    });
  } catch (err) {
    console.error('Ошибка проверки статуса Telegram:', err);
    res.status(500).json({ 
      error: 'Ошибка при проверке статуса',
      details: err.message 
    });
  }
});

// Отключение Telegram уведомлений
router.post('/disconnect', auth, async (req, res) => {
  try {
    const success = await disconnectTelegram(req.userId);
    
    if (success) {
      res.json({ 
        success: true,
        message: 'Telegram уведомления успешно отключены' 
      });
    } else {
      res.status(404).json({ 
        error: 'Подключение не найдено или уже отключено' 
      });
    }
  } catch (err) {
    console.error('Ошибка отключения Telegram:', err);
    res.status(500).json({ 
      error: 'Ошибка при отключении Telegram',
      details: err.message 
    });
  }
});

// ========== МЕТОДЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ==========

// Генерация кода верификации для пользователя
router.post('/user/generate-code', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await generateUserVerificationCode(userId);
    
    res.json({
      success: true,
      code: result.code,
      expiresAt: result.expiresAt,
      botUsername: process.env.TELEGRAM_BOT_USERNAME || 'YourBotUsername',
      instructions: {
        step1: `Перейдите в Telegram к боту @${process.env.TELEGRAM_BOT_USERNAME || 'YourBotUsername'}`,
        step2: `Отправьте команду: /link ${result.code}`,
        step3: 'Дождитесь подтверждения привязки',
        note: 'Код действителен 10 минут'
      }
    });
  } catch (error) {
    console.error('Ошибка генерации кода для пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при генерации кода верификации'
    });
  }
});

// Проверка привязки Telegram для пользователя
router.get('/user/check/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      'SELECT telegram_id, telegram_username, telegram_linked_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }
    
    const user = result.rows[0];
    const isLinked = !!user.telegram_id;
    
    res.json({
      success: true,
      isLinked,
      telegramUsername: user.telegram_username,
      linkedAt: user.telegram_linked_at
    });
    
  } catch (error) {
    console.error('Ошибка проверки привязки Telegram:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка сервера' 
    });
  }
});

// Проверка статуса привязки пользователя (с auth middleware)
router.get('/user/status', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await getUserTelegramConnectionStatus(userId);
    
    res.json({
      success: true,
      ...result,
      botUsername: process.env.TELEGRAM_BOT_USERNAME || 'YourBotUsername'
    });
  } catch (error) {
    console.error('Ошибка проверки статуса пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при проверке статуса'
    });
  }
});

// Привязка Telegram аккаунта пользователя
router.post('/user/link', auth, async (req, res) => {
  try {
    const { telegramId, telegramUsername } = req.body;
    const userId = req.userId;

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        message: 'Не указан Telegram ID'
      });
    }

    const result = await linkUserTelegram(userId, telegramId, telegramUsername);
    
    res.json(result);
  } catch (error) {
    console.error('Ошибка привязки Telegram:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при привязке Telegram аккаунта'
    });
  }
});

// Отвязка Telegram аккаунта пользователя
router.delete('/user/unlink', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await disconnectUserTelegram(userId);
    
    res.json(result);
  } catch (error) {
    console.error('Ошибка отвязки Telegram:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при отвязке Telegram аккаунта'
    });
  }
});

// Проверка статуса привязки пользователя по коду
router.post('/user/check-linking', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.userId;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Код не предоставлен'
      });
    }
    
    const result = await checkUserLinkingStatus(userId, code);
    
    res.json(result);
  } catch (error) {
    console.error('Ошибка проверки привязки:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при проверке статуса привязки'
    });
  }
});

// Повторная отправка кода верификации (если предыдущий истек)
router.post('/regenerate-code', auth, async (req, res) => {
  try {
    const userClubs = await getClubsByOwnerId(req.userId);
    
    if (userClubs.length === 0) {
      return res.status(403).json({ 
        error: 'Только владельцы клубов могут подключить Telegram уведомления' 
      });
    }
    
    // Проверяем текущий статус
    const currentStatus = await getTelegramConnectionStatus(req.userId);
    if (currentStatus.connected) {
      return res.status(400).json({
        error: 'Telegram уже подключен к вашему аккаунту'
      });
    }
    
    const verificationCode = await generateVerificationCode(req.userId);
    
    res.json({ 
      success: true,
      verificationCode,
      message: 'Новый код верификации сгенерирован',
      botUsername: process.env.TELEGRAM_BOT_USERNAME || 'YourBotUsername'
    });
  } catch (err) {
    console.error('Ошибка регенерации кода верификации:', err);
    res.status(500).json({ 
      error: 'Ошибка при генерации нового кода',
      details: err.message 
    });
  }
});

// Проверка доступности Telegram бота
router.get('/bot-status', async (req, res) => {
  try {
    let telegramBot;
    let botStatus = false;
    
    try {
      telegramBot = require('../services/telegramBot');
      botStatus = telegramBot && telegramBot.isConnected ? telegramBot.isConnected() : false;
    } catch (error) {
      console.warn('Telegram бот не подключен:', error.message);
    }
    
    res.json({
      botActive: botStatus,
      botUsername: process.env.TELEGRAM_BOT_USERNAME || null,
      message: botStatus ? 
        'Telegram бот активен и готов к работе' : 
        'Telegram бот не активен или не настроен'
    });
  } catch (err) {
    console.error('Ошибка проверки статуса бота:', err);
    res.status(500).json({ 
      error: 'Ошибка при проверке статуса бота',
      details: err.message 
    });
  }
});

module.exports = router;