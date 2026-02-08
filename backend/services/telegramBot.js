const TelegramBot = require('node-telegram-bot-api');
const { 
  saveClubOwnerTelegramId, 
  getClubOwnerTelegramId,
  saveUserTelegramId,
  getUserTelegramId 
} = require('../models/clubModel');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN не установлен. Telegram бот не будет работать.');
  module.exports = null;
} else {
  const bot = new TelegramBot(token, { polling: true });

  console.log('🤖 Telegram бот запущен');

  // Обработчик команды /start для владельцев клубов
  bot.onText(/\/start (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const verificationCode = match[1];
    const username = msg.from.username;

    console.log(`Получена команда /start с кодом: ${verificationCode} от пользователя ${username}`);

    try {
      // Пытаемся привязать как владельца клуба
      const clubResult = await saveClubOwnerTelegramId(verificationCode, chatId.toString());
      
      if (clubResult.success) {
        await bot.sendMessage(chatId, 
          `✅ Отлично! Telegram уведомления подключены для клуба "${clubResult.clubName}".\n\n` +
          `Теперь вы будете получать уведомления о новых записях клиентов.\n\n` +
          `Владелец: ${clubResult.ownerName}`
        );
        return;
      }

      // Если не получилось как владелец клуба, отправляем ошибку
      await bot.sendMessage(chatId, 
        `❌ Ошибка верификации\n\n` +
        `Код верификации недействителен или истек\n\n` +
        `🔍 Возможные причины:\n` +
        `• Код введен неправильно\n` +
        `• Срок действия кода истек\n` +
        `• Код уже был использован\n` +
        `Получите новый код в панели управления клубом.`
      );

    } catch (error) {
      console.error('Ошибка при обработке команды /start:', error);
      await bot.sendMessage(chatId, 
        `❌ Произошла ошибка при подключении уведомлений.\n\n` +
        `Попробуйте еще раз или обратитесь в техподдержку.`
      );
    }
  });

  // НОВАЯ КОМАНДА /link для пользователей
  bot.onText(/\/link (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const verificationCode = match[1];
    const username = msg.from.username;

    console.log(`Получена команда /link с кодом: ${verificationCode} от пользователя ${username}`);

    try {
      // Привязываем пользователя
      const userResult = await saveUserTelegramId(verificationCode, chatId.toString(), username);
      
      if (userResult.success) {
        await bot.sendMessage(chatId, 
          `✅ Отлично! Telegram уведомления подключены.\n\n` +
          `Привет, ${userResult.userName}!\n\n` +
          `Теперь вы будете получать уведомления:\n` +
          `🎉 О подтверждении записи на занятия\n` +
          `🎫 Код посещения для каждого занятия\n` +
          `😞 Об отмене занятий клубом с возвратом средств\n\n` +
          `🔔 Типы уведомлений:\n` +
          `• Подтверждение записи\n` +
          `• Код посещения\n` +
          `• Отмена занятий клубом\n` +
          `• Возврат средств`
        );
        return;
      }

      // Если не получилось привязать
      await bot.sendMessage(chatId, 
        `❌ Ошибка верификации\n\n` +
        `${userResult.message}\n\n` +
        `🔍 Возможные причины:\n` +
        `• Код введен неправильно\n` +
        `• Срок действия кода истек\n` +
        `• Код уже был использован\n` +
        `Получите новый код в личном кабинете на сайте.`
      );

    } catch (error) {
      console.error('Ошибка при обработке команды /link:', error);
      await bot.sendMessage(chatId, 
        `❌ Произошла ошибка при подключении уведомлений.\n\n` +
        `Попробуйте еще раз или обратитесь в техподдержку.`
      );
    }
  });

  // Обработчик команды /start без параметров
  bot.onText(/^\/start$/, async (msg) => {
    const chatId = msg.chat.id;
    
    await bot.sendMessage(chatId, 
      `👋 Добро пожаловать в FitnessHub бот!\n\n` +
      `Этот бот предназначен для уведомлений о фитнес занятиях.\n\n` +
      `📋 Доступные команды:\n` +
      `• /start [код] - подключить уведомления для владельца клуба\n` +
      `• /link [код] - подключить уведомления для пользователя\n` +
      `• /status - проверить статус подключения\n` +
      `• /help - получить справку\n\n` +
      `Для подключения уведомлений получите код в личном кабинете на сайте.`
    );
  });

  // Обработчик команды /help
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    
    await bot.sendMessage(chatId,
      `📖 Справка по FitnessHub боту\n\n` +
      `🏃‍♂️ Для пользователей:\n` +
      `1. Зайдите в свой профиль на сайте fitneshub.ru\n` +
      `2. Нажмите "Подключить уведомления"\n` +
      `3. Скопируйте команду /link [ваш_код]\n` +
      `4. Отправьте её мне\n` +
      `5. Готово! Теперь вы будете получать уведомления о записях и отменах\n\n` +
      `🏢 Для владельцев клубов:\n` +
      `1. Зайдите в панель управления клубом\n` +
      `2. Перейдите в настройки Telegram\n` +
      `3. Получите код верификации\n` +
      `4. Отправьте мне команду /start [ваш_код]\n` +
      `5. Готово! Теперь вы будете получать уведомления о новых записях\n\n` +
      `❓ Нужна помощь? Обратитесь в техподдержку на сайте.`
    );
  });

  // Обработчик команды /status
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      // Проверяем, подключен ли как владелец клуба
      const clubOwnerId = await getClubOwnerTelegramId(chatId.toString());
      if (clubOwnerId) {
        await bot.sendMessage(chatId, 
          `✅ Статус: Подключен как владелец клуба\n\n` +
          `Вы получаете уведомления о новых записях клиентов.`
        );
        return;
      }

      // Проверяем, подключен ли как пользователь
      const userId = await getUserTelegramId(chatId.toString());
      if (userId) {
        await bot.sendMessage(chatId, 
          `✅ Статус: Подключен как пользователь\n\n` +
          `Вы получаете уведомления о записях и отменах занятий.`
        );
        return;
      }

      // Если не подключен
      await bot.sendMessage(chatId, 
        `❌ Статус: Не подключен\n\n` +
        `Для подключения уведомлений:\n` +
        `• Пользователи: используйте /link [код] из личного кабинета\n` +
        `• Владельцы клубов: используйте /start [код] из панели управления`
      );

    } catch (error) {
      console.error('Ошибка при проверке статуса:', error);
      await bot.sendMessage(chatId, 
        `❌ Ошибка при проверке статуса подключения.\n\n` +
        `Попробуйте еще раз позже.`
      );
    }
  });

  // Обработчик неизвестных команд
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Игнорируем обработанные команды
    if (text && (
      text.startsWith('/start') ||
      text.startsWith('/link') ||
      text.startsWith('/help') ||
      text.startsWith('/status')
    )) {
      return;
    }

    // Отвечаем на неизвестные сообщения
    if (text && text.startsWith('/')) {
      await bot.sendMessage(chatId,
        `❓ Неизвестная команда.\n\n` +
        `Используйте:\n` +
        `• /start [код] - для подключения владельца клуба\n` +
        `• /link [код] - для подключения пользователя\n` +
        `• /help - для получения справки\n` +
        `• /status - для проверки статуса`
      );
    } else if (text && !text.startsWith('/')) {
      await bot.sendMessage(chatId,
        `👋 Привет! Я бот для уведомлений FitnessHub.\n\n` +
        `Отправьте /help для получения инструкций по подключению уведомлений.`
      );
    }
  });

  // Функция для отправки уведомления владельцу клуба о новой записи
  async function sendBookingNotification(ownerId, bookingDetails) {
    try {
      const telegramChatId = await getClubOwnerTelegramId(ownerId);
      
      if (!telegramChatId) {
        console.log(`Владелец клуба ${ownerId} не подключил Telegram уведомления`);
        return false;
      }

      const message = 
        `🎉 Новая запись в клубе!\n\n` +
        `👤 Клиент: ${bookingDetails.user_name}\n` +
        `📞 Телефон: ${bookingDetails.user_phone || 'не указан'}\n` +
        `🏃‍♂️ Занятие: ${bookingDetails.class_name}\n` +
        `📅 Дата: ${new Date(bookingDetails.class_date).toLocaleDateString('ru-RU')}\n` +
        `⏰ Время: ${bookingDetails.class_time}\n` +
        `💰 Сумма: ${bookingDetails.price} ₽\n` +
        `🎫 Код посещения: ${bookingDetails.visit_code}`;

      await bot.sendMessage(telegramChatId, message);
      console.log(`Уведомление о записи отправлено владельцу клуба ${ownerId}`);
      return true;
      
    } catch (error) {
      console.error(`Ошибка отправки Telegram уведомления владельцу ${ownerId}:`, error);
      return false;
    }
  }

  // НОВАЯ ФУНКЦИЯ: Отправка уведомления пользователю о записи на занятие
  async function sendUserBookingNotification(userId, bookingDetails) {
    try {
      console.log(`🔍 Ищем telegram_id для пользователя ${userId} (уведомление о записи)`);
      
      // Получаем Telegram ID пользователя
      const userTelegramId = await getUserTelegramId(userId);
      
      console.log(`📱 Найден telegram_id для уведомления о записи:`, userTelegramId);
      
      if (!userTelegramId) {
        console.log(`Пользователь ${userId} не подключил Telegram уведомления`);
        return false;
      }

      // Форматируем дату и время
      const classDate = new Date(bookingDetails.class_date);
      const formattedDate = classDate.toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const message = 
        `🎉 Вы успешно записались на занятие!\n\n` +
        `🏢 Клуб: ${bookingDetails.club_name}\n` +
        `🏃‍♂️ Занятие: ${bookingDetails.class_name}\n` +
        `📅 Дата: ${formattedDate}\n` +
        `⏰ Время: ${bookingDetails.class_time}\n` +
        `⏱️ Длительность: ${bookingDetails.duration} мин\n` +
        `${bookingDetails.trainer ? `👨‍🏫 Тренер: ${bookingDetails.trainer}\n` : ''}` +
        `📍 Адрес: ${bookingDetails.club_address || 'уточните в клубе'}\n` +
        `💰 Стоимость: ${bookingDetails.price} ₽\n\n` +
        `🎫 Ваш код посещения: ${bookingDetails.visit_code}\n\n` +
        `📝 Важно:\n` +
        `• Приходите за 10-15 минут до начала\n` +
        `• Имейте при себе код посещения\n` +
        `• Отмена за 12+ часов — полный возврат\n` +
        `• Отмена менее 12 часов — средства не возвращаются\n\n` +
        `Удачной тренировки! 💪`;

      console.log(`📤 Отправляем уведомление о записи на telegram_id: ${userTelegramId}`);
      
      await bot.sendMessage(userTelegramId, message);
      console.log(`✅ Уведомление о записи отправлено пользователю ${userId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Ошибка отправки Telegram уведомления о записи пользователю ${userId}:`, error);
      return false;
    }
  }

  // Функция для отправки уведомления пользователю об отмене занятия
  async function sendCancellationNotification(userId, cancellationDetails) {
    try {
      console.log(`🔍 Ищем telegram_id для пользователя ${userId}`);
      
      // ИСПРАВЛЕНО: используем правильную функцию
      const userTelegramId = await getUserTelegramId(userId);
      
      console.log(`📱 Найден telegram_id:`, userTelegramId);
      
      if (!userTelegramId) {
        console.log(`Пользователь ${userId} не подключил Telegram уведомления`);
        return false;
      }
  
      const message = 
        `😞 К сожалению, ваше занятие отменено\n\n` +
        `🏢 Клуб: ${cancellationDetails.club_name}\n` +
        `🏃‍♂️ Занятие: ${cancellationDetails.class_name}\n` +
        `📅 Дата: ${new Date(cancellationDetails.class_date).toLocaleDateString('ru-RU')}\n` +
        `⏰ Время: ${cancellationDetails.class_time}\n\n` +
        `💰 Деньги автоматически возвращены на ваш счет.\n\n` +
        `🔄 Вы можете:\n` +
        `• Перенести запись на другое время\n` +
        `• Выбрать занятие в другом клубе\n` +
        `• Оставить средства на счету для будущих записей\n\n` +
        `${cancellationDetails.cancellation_reason ? `📝 Причина: ${cancellationDetails.cancellation_reason}\n\n` : ''}` +
        `Перейти к расписанию: fitneshub.ru/schedule`;
  
      console.log(`📤 Отправляем уведомление на telegram_id: ${userTelegramId}`);
      
      await bot.sendMessage(userTelegramId, message);
      console.log(`✅ Уведомление об отмене отправлено пользователю ${userId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Ошибка отправки Telegram уведомления пользователю ${userId}:`, error);
      return false;
    }
  }

  // Функция для проверки подключения бота
  function isConnected() {
    try {
      return bot && bot.isPolling();
    } catch (error) {
      return false;
    }
  }

  // Экспортируем функции
  module.exports = {
    sendBookingNotification,
    sendCancellationNotification,
    sendUserBookingNotification, // НОВАЯ ФУНКЦИЯ
    isConnected,
    bot,
    // ДОБАВЛЕНО: экспорт метода sendMessage
    sendMessage: async (chatId, text, options = {}) => {
      try {
        if (!bot) {
          throw new Error('Telegram бот не инициализирован');
        }
        return await bot.sendMessage(chatId, text, options);
      } catch (error) {
        console.error('Ошибка отправки Telegram сообщения:', error);
        throw error;
      }
    }
  };
}