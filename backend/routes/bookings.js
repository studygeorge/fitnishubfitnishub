const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  cancelBooking,
  cancelBookingByClub,
  getUserBookings, 
  getUserHistory, 
  addRating, 
  completeBooking,
  getClubBookings,
  getBookingDetailsForNotification
} = require('../models/bookingModel');
const { getClassById } = require('../models/scheduleModel');
const { createPayment } = require('../models/transactionModel');
const auth = require('../middleware/auth');
const { getClubsByOwnerId, getClubOwnerTelegramId } = require('../models/clubModel');

// Подключение Telegram бота
let telegramBot;
try {
  telegramBot = require('../services/telegramBot');
} catch (error) {
  console.warn('Telegram бот не подключен:', error.message);
  telegramBot = null;
}

// ФУНКЦИЯ: Корректное форматирование времени для Telegram (БЕЗ корректировки)
function formatTimeForTelegram(timeString) {
  try {
    if (!timeString) return 'Не указано';
    
    // Если это объект Date
    if (timeString instanceof Date) {
      return timeString.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    }
    
    // Если это строка времени
    if (typeof timeString === 'string') {
      // Если уже в формате HH:MM
      if (timeString.match(/^\d{2}:\d{2}$/)) {
        return timeString; // Возвращаем как есть
      }
      
      // Если это ISO строка или timestamp
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit'
        });
      }
    }
    
    return timeString; // Возвращаем как есть, если не смогли обработать
  } catch (error) {
    console.error('Ошибка форматирования времени:', error);
    return timeString;
  }
}

// Создание бронирования - ОБНОВЛЕННАЯ ВЕРСИЯ
router.post('/', auth, async (req, res) => {
  try {
    const { schedule_id, visit_code } = req.body;
    const user_id = req.userId;
    
    console.log('📝 Создание бронирования:', { schedule_id, user_id, visit_code });
    
    const classInfo = await getClassById(schedule_id);
    if (!classInfo) {
      return res.status(404).json({ error: 'Занятие не найдено' });
    }
    
    const booking = await createBooking(req.userId, schedule_id, visit_code);
    
    console.log('✅ Создано бронирование:', booking);
    
    await createPayment(
      req.userId,
      classInfo.club_id,
      classInfo.price,
      booking.id,
      `Оплата занятия: ${classInfo.class_name}`
    );

    // НОВОЕ: Отправляем уведомление пользователю о записи
    let userNotificationSent = false;
    
    if (telegramBot && telegramBot.sendUserBookingNotification) {
      try {
        console.log('📱 Отправляем Telegram уведомление пользователю о записи...');
        
        // Получаем детальную информацию для уведомления
        const bookingDetails = await getBookingDetailsForNotification(booking.id);
        
        if (bookingDetails) {
          // ИСПРАВЛЕНО: НЕ корректируем время, форматируем как есть
          const classStartTime = bookingDetails.class_start_time || classInfo.start_time;
          const telegramTime = formatTimeForTelegram(classStartTime || classInfo.time);

          userNotificationSent = await telegramBot.sendUserBookingNotification(user_id, {
            class_name: bookingDetails.class_name || classInfo.class_name,
            class_date: classStartTime || classInfo.start_time,
            class_time: telegramTime, // ИСПРАВЛЕНО: реальное время без корректировки
            club_name: bookingDetails.club_name || classInfo.club_name,
            club_address: bookingDetails.club_address || classInfo.club_address,
            trainer: bookingDetails.trainer || classInfo.instructor,
            price: classInfo.price,
            visit_code: visit_code,
            duration: classInfo.duration || 60
          });
          
          console.log('📱 Результат отправки уведомления пользователю:', userNotificationSent);
          console.log('📱 Время отправлено в Telegram:', telegramTime);
        }
      } catch (userNotificationError) {
        console.error('❌ Ошибка отправки уведомления пользователю о записи:', userNotificationError);
        userNotificationSent = false;
      }
    } else {
      console.log('⚠️ Telegram бот не доступен для отправки уведомлений пользователю');
    }

    // Отправляем уведомление владельцу клуба (как было раньше)
    if (telegramBot && telegramBot.sendBookingNotification) {
      try {
        const bookingDetails = await getBookingDetailsForNotification(booking.id);
        console.log('📱 Детали бронирования для уведомления владельца:', bookingDetails);
        
        if (bookingDetails && bookingDetails.owner_id) {
          const telegramId = await getClubOwnerTelegramId(bookingDetails.owner_id);
          if (telegramId) {
            // ИСПРАВЛЕНО: НЕ корректируем время для владельца
            const ownerTelegramTime = formatTimeForTelegram(bookingDetails.class_start_time);

            await telegramBot.sendBookingNotification(bookingDetails.owner_id, {
              user_name: bookingDetails.user_name,
              user_phone: bookingDetails.user_phone,
              class_name: bookingDetails.class_name,
              class_date: bookingDetails.class_start_time,
              class_time: ownerTelegramTime, // ИСПРАВЛЕНО: реальное время
              price: classInfo.price,
              visit_code: visit_code
            });
            console.log(`📱 Telegram уведомление отправлено владельцу клуба ${bookingDetails.owner_id}`);
            console.log('📱 Время отправлено владельцу:', ownerTelegramTime);
          } else {
            console.log(`📱 Владелец клуба ${bookingDetails.owner_id} не подключил Telegram уведомления`);
          }
        }
      } catch (notificationError) {
        console.error('❌ Ошибка отправки Telegram уведомления владельцу:', notificationError);
      }
    }
    
    // Возвращаем результат с информацией о Telegram
    res.status(201).json({
      ...booking,
      visit_code: booking.visit_code,
      telegram_sent: userNotificationSent // НОВОЕ: информация о статусе отправки
    });
  } catch (err) {
    console.error('❌ Ошибка при создании бронирования:', err);
    
    if (err.message === 'Вы уже записаны на это занятие') {
      return res.status(400).json({ error: err.message });
    }
    
    if (err.message === 'На занятии нет свободных мест' || 
        err.message === 'Недостаточно средств на балансе') {
      return res.status(400).json({ error: err.message });
    }
    
    res.status(500).json({ error: 'Ошибка при создании бронирования' });
  }
});

// Отмена бронирования пользователем
router.delete('/:id', auth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const result = await cancelBooking(bookingId, req.userId);
    
    // ИСПРАВЛЕНО: Используем правильный метод
    if (telegramBot && telegramBot.sendMessage) {
      try {
        const bookingDetails = await getBookingDetailsForNotification(bookingId);
        if (bookingDetails && bookingDetails.owner_id) {
          const telegramId = await getClubOwnerTelegramId(bookingDetails.owner_id);
          if (telegramId) {
            const classDate = new Date(result.class_start_time);
            
            // ИСПРАВЛЕНО: НЕ корректируем время для отмены
            const cancelTelegramTime = formatTimeForTelegram(result.class_start_time);
            
            const cancelMessage = `
🚫 <b>Отмена бронирования</b>

👤 <b>Клиент:</b> ${result.user_name}
🏋️‍♂️ <b>Занятие:</b> ${result.class_name}
📅 <b>Дата:</b> ${classDate.toLocaleDateString('ru-RU', {
  year: 'numeric',
  month: 'long', 
  day: 'numeric',
  weekday: 'long'
})}
⏰ <b>Время:</b> ${cancelTelegramTime}
🏢 <b>Клуб:</b> ${result.club_name}

${result.refunded ? 
  `💰 <b>Средства возвращены клиенту:</b> ${result.refund_amount} ₽` : 
  '⏱️ <b>Отмена менее чем за 12 часов - средства не возвращены</b>'
}

📝 <b>ID бронирования:</b> #${bookingId}
⏰ <b>Отменено за:</b> ${Math.abs(result.hours_before_class).toFixed(1)} ч до начала
            `.trim();
            
            await telegramBot.sendMessage(telegramId, cancelMessage, { parse_mode: 'HTML' });
            console.log(`Telegram уведомление об отмене отправлено владельцу ${bookingDetails.owner_id}`);
          }
        }
      } catch (notificationError) {
        console.error('Ошибка отправки уведомления об отмене:', notificationError);
      }
    }
    
    res.json(result);
  } catch (err) {
    console.error('Ошибка при отмене бронирования:', err);
    if (err.message === 'Бронирование не найдено или у вас нет прав на его отмену' ||
        err.message === 'Бронирование уже отменено') {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: 'Ошибка при отмене бронирования' });
  }
});

// ИСПРАВЛЕННЫЙ МАРШРУТ: Отмена бронирования клубом
router.delete('/:id/club-cancel', auth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { reason = '' } = req.body || {};
    
    console.log(`Запрос на отмену бронирования ${bookingId} от пользователя ${req.userId}`);
    console.log('Причина отмены:', reason);
    
    // Проверяем права: пользователь должен быть владельцем клуба этого бронирования
    const bookingDetails = await getBookingDetailsForNotification(bookingId);
    if (!bookingDetails) {
      return res.status(404).json({ error: 'Бронирование не найдено' });
    }
    
    console.log('Детали бронирования:', bookingDetails);
    
    // Проверяем, является ли текущий пользователь владельцем клуба
    if (bookingDetails.owner_id !== req.userId) {
      return res.status(403).json({ error: 'У вас нет прав для отмены этого бронирования' });
    }
    
    console.log(`Владелец ${req.userId} отменяет бронирование ${bookingId}`);
    
    // ИСПРАВЛЕНО: передаем ownerId и reason
    const result = await cancelBookingByClub(bookingId, req.userId, reason);
    
    console.log('Результат отмены:', result);
    
    // ИСПРАВЛЕННЫЙ БЛОК: Используем sendCancellationNotification
    if (telegramBot && telegramBot.sendCancellationNotification && result.user_id) {
      try {
        console.log('📱 Отправка Telegram уведомления пользователю ID:', result.user_id);
        
        // ИСПРАВЛЕНО: НЕ корректируем время для отмены клубом
        const cancellationTelegramTime = formatTimeForTelegram(result.class_start_time);
        
        const sent = await telegramBot.sendCancellationNotification(
          result.user_id, // Передаем user_id, а не telegram_id
          {
            club_name: result.club_name,
            class_name: result.class_name,
            class_date: result.class_start_time,
            class_time: cancellationTelegramTime, // ИСПРАВЛЕНО: реальное время
            refund_amount: result.refund_amount,
            cancellation_reason: result.cancellation_reason
          }
        );
        
        if (sent) {
          console.log(`✅ Уведомление об отмене отправлено пользователю ${result.user_id}`);
          console.log('📱 Время отправлено пользователю:', cancellationTelegramTime);
        } else {
          console.log(`📱 Пользователь ${result.user_id} не подключил Telegram уведомления`);
        }
      } catch (notificationError) {
        console.error('❌ Ошибка отправки уведомления:', notificationError);
      }
    } else {
      console.log('📱 Telegram уведомление не отправлено:', {
        botAvailable: !!telegramBot,
        hasSendCancellationNotification: !!(telegramBot && telegramBot.sendCancellationNotification),
        userId: result.user_id
      });
    }
    
    res.json({
      success: true,
      message: 'Бронирование успешно отменено',
      refunded: true,
      refund_amount: result.refund_amount,
      cancelled_by: result.cancelled_by,
      cancellation_reason: result.cancellation_reason
    });
  } catch (error) {
    console.error('Ошибка отмены бронирования клубом:', error);
    
    if (error.message.includes('не найдено')) {
      return res.status(404).json({ error: 'Бронирование не найдено' });
    }
    
    if (error.message.includes('права')) {
      return res.status(403).json({ error: 'У вас нет прав для отмены этого бронирования' });
    }
    
    res.status(500).json({
      error: 'Не удалось отменить бронирование',
      details: error.message
    });  
  }
});

// Получение списка предстоящих бронирований пользователя
router.get('/user', auth, async (req, res) => {
  try {
    const bookings = await getUserBookings(req.userId);
    res.json(bookings);
  } catch (err) {
    console.error('Ошибка при загрузке бронирований:', err);
    res.status(500).json({ error: 'Ошибка при загрузке бронирований' });
  }
});

// Получение истории посещений пользователя
router.get('/history', auth, async (req, res) => {
  try {
    const history = await getUserHistory(req.userId);
    res.json(history);
  } catch (err) {
    console.error('Ошибка при загрузке истории посещений:', err);
    res.status(500).json({ error: 'Ошибка при загрузке истории посещений' });
  }
});

// Добавление оценки и отзыва к посещению
router.post('/:id/rating', auth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { rating, feedback } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Оценка должна быть от 1 до 5' });
    }
    
    const result = await addRating(bookingId, req.userId, rating, feedback);
    res.json(result);
  } catch (err) {
    console.error('Ошибка при добавлении оценки:', err);
    if (err.message === 'Бронирование не найдено или у вас нет прав на его оценку') {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: 'Ошибка при добавлении оценки' });
  }
});

// Получение бронирований для клуба
router.get('/club/:clubId', auth, async (req, res) => {
  try {
    const clubId = req.params.clubId;
    
    // Проверка прав доступа: пользователь должен быть владельцем клуба
    const userClubs = await getClubsByOwnerId(req.userId);
    const isOwner = userClubs.some(club => club.id.toString() === clubId);
    
    if (!isOwner) {
      return res.status(403).json({ error: 'У вас нет прав для просмотра бронирований этого клуба' });
    }
    
    const bookings = await getClubBookings(clubId);
    res.json(bookings);
  } catch (err) {
    console.error('Ошибка при получении бронирований клуба:', err);
    res.status(500).json({ error: 'Ошибка при загрузке бронирований клуба' });
  }
});

// Отметка посещения как завершенное (для владельцев клубов)
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    // Дополнительная проверка прав: только владелец клуба может отмечать посещения
    const bookingDetails = await getBookingDetailsForNotification(bookingId);
    if (!bookingDetails) {
      return res.status(404).json({ error: 'Бронирование не найдено' });
    }
    
    // Проверяем, является ли текущий пользователь владельцем клуба
    if (bookingDetails.owner_id !== req.userId) {
      return res.status(403).json({ error: 'У вас нет прав для выполнения этого действия' });
    }
    
    const result = await completeBooking(bookingId);
    res.json(result);
  } catch (err) {
    console.error('Ошибка при отметке посещения:', err);
    res.status(500).json({ error: 'Ошибка при отметке посещения' });
  }
});

// Получение деталей бронирования (для владельцев клубов)
router.get('/:id/details', auth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    const bookingDetails = await getBookingDetailsForNotification(bookingId);
    if (!bookingDetails) {
      return res.status(404).json({ error: 'Бронирование не найдено' });
    }
    
    // Проверяем права доступа
    if (bookingDetails.owner_id !== req.userId) {
      return res.status(403).json({ error: 'У вас нет прав для просмотра деталей этого бронирования' });
    }
    
    res.json(bookingDetails);
  } catch (err) {
    console.error('Ошибка при получении деталей бронирования:', err);
    res.status(500).json({ error: 'Ошибка при получении деталей бронирования' });
  }
});

// Получение статистики бронирований для клуба
router.get('/club/:clubId/stats', auth, async (req, res) => {
  try {
    const clubId = req.params.clubId;
    
    // Проверка прав доступа
    const userClubs = await getClubsByOwnerId(req.userId);
    const isOwner = userClubs.some(club => club.id.toString() === clubId);
    
    if (!isOwner) {
      return res.status(403).json({ error: 'У вас нет прав для просмотра статистики этого клуба' });
    }
    
    const bookings = await getClubBookings(clubId);
    
    // Вычисляем статистику
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const stats = {
      total: bookings.length,
      today: bookings.filter(b => new Date(b.created_at) >= today).length,
      thisWeek: bookings.filter(b => new Date(b.created_at) >= weekAgo).length,
      thisMonth: bookings.filter(b => new Date(b.created_at) >= monthAgo).length,
      completed: bookings.filter(b => b.status === 'completed').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      cancelled: bookings.filter(b => 
        b.status === 'cancelled' || b.status === 'cancelled_by_club'
      ).length,
      cancelled_by_user: bookings.filter(b => 
        b.status === 'cancelled' && b.cancelled_by === 'user'
      ).length,
      cancelled_by_club: bookings.filter(b => 
        b.status === 'cancelled_by_club'
      ).length,
      upcoming: bookings.filter(b => 
        b.status === 'confirmed' && new Date(b.start_time) > now
      ).length
    };
    
    res.json(stats);
  } catch (err) {
    console.error('Ошибка при получении статистики бронирований:', err);
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
});

module.exports = router;