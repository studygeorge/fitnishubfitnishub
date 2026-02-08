const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail, findUserById, updatePassword } = require('../models/userModel');
const clubModel = require('../models/clubModel'); // Добавьте эту строку
const auth = require('../middleware/auth');

require('dotenv').config();

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, preferences } = req.body;
    
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    
    const user = await createUser({
      email,
      password,
      first_name,
      last_name,
      phone,
      preferences
    });
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '365d',
    });
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

// Авторизация
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '365d',
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        balance: user.balance,
        is_club_owner: user.is_club_owner
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера при входе в систему' });
  }
});

// Авторизация администратора
router.post('/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Проверяем учетные данные администратора
      // Обычно это сравнение с env переменными или специальной записью в БД
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminUsername || !adminPassword) {
        return res.status(500).json({ error: 'Учетные данные администратора не настроены' });
      }
      
      if (username !== adminUsername || password !== adminPassword) {
        return res.status(401).json({ error: 'Неверное имя пользователя или пароль администратора' });
      }
      
      // Создаем токен для администратора
      const token = jwt.sign(
        { 
          isAdmin: true,
          username: adminUsername 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '365d' }
      );
      
      res.json({
        token,
        username: adminUsername
      });
    } catch (err) {
      console.error('Ошибка при входе администратора:', err);
      res.status(500).json({ error: 'Ошибка сервера при входе администратора' });
    }
  });

// Авторизация для владельцев клубов
router.post('/club/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const result = await clubModel.authenticateClubOwner(email, password);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      // Создаем JWT токен с данными о клубе и пользователе
      const token = jwt.sign({
        userId: result.userId,
        clubId: result.clubId,
        isClubOwner: true
      }, process.env.JWT_SECRET, {
        expiresIn: '365d'
      });
      
      res.json({
        token,
        user: result.userDetails,
        clubId: result.clubId,
        clubName: result.clubName,
        balance: result.balance
      });
    } catch (err) {
      console.error('Ошибка при авторизации клуба:', err);
      res.status(500).json({ error: 'Ошибка сервера при авторизации' });
    }
  });

  
// Получение данных текущего пользователя
router.get('/me', auth, async (req, res) => {
  try {
    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      preferences: user.preferences,
      profile_image: user.profile_image,
      balance: user.balance,
      is_club_owner: user.is_club_owner
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Изменение пароля
router.put('/password', auth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    // Проверка текущего пароля
    const user = await findUserByEmail(req.user.email);
    const isMatch = await bcrypt.compare(current_password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Текущий пароль указан неверно' });
    }
    
    // Обновление пароля
    await updatePassword(req.userId, new_password);
    
    res.json({ message: 'Пароль успешно изменен' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера при обновлении пароля' });
  }
});

module.exports = router;
