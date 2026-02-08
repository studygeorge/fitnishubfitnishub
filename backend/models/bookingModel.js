const { pool } = require('../db');

async function createBooking(userId, scheduleId, visitCode = null) {
  // Проверяем, не записан ли уже пользователь на это занятие
  const existingBooking = await pool.query(
    'SELECT id FROM bookings WHERE user_id = $1 AND schedule_id = $2 AND status != $3',
    [userId, scheduleId, 'cancelled']
  );
  
  if (existingBooking.rows.length > 0) {
    throw new Error('Вы уже записаны на это занятие');
  }
  
  // Проверяем, есть ли еще места
  const classInfo = await pool.query(
    'SELECT capacity, booked FROM schedule WHERE id = $1',
    [scheduleId]
  );
  
  if (classInfo.rows.length === 0) {
    throw new Error('Занятие не найдено');
  }
  
  const { capacity, booked } = classInfo.rows[0];
  if (booked >= capacity) {
    throw new Error('На занятии нет свободных мест');
  }
  
  // Если код не передан с фронтенда, генерируем на сервере
  const finalVisitCode = visitCode || Math.floor(1000 + Math.random() * 9000).toString();
  
  console.log('Создание бронирования с кодом посещения:', finalVisitCode);
  
  // Начинаем транзакцию
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Создаем бронирование с кодом посещения
    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id, schedule_id, status, visit_code)
       VALUES ($1, $2, 'confirmed', $3)
       RETURNING *`,
      [userId, scheduleId, finalVisitCode]
    );
    
    // Обновляем счетчик занятых мест
    await client.query(
      'UPDATE schedule SET booked = booked + 1 WHERE id = $1',
      [scheduleId]
    );
    
    await client.query('COMMIT');
    
    console.log('Бронирование создано:', bookingResult.rows[0]);
    return bookingResult.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function cancelBooking(id, userId) {
  // Получаем информацию о бронировании и времени занятия БЕЗ преобразования временной зоны
  const bookingInfo = await pool.query(
    `SELECT b.schedule_id, b.status, s.start_time, s.price, s.club_id, s.class_name,
            u.first_name, u.last_name, c.name as club_name
     FROM bookings b 
     JOIN schedule s ON b.schedule_id = s.id 
     JOIN users u ON b.user_id = u.id
     JOIN clubs c ON s.club_id = c.id
     WHERE b.id = $1 AND b.user_id = $2`,
    [id, userId]
  );
  
  if (bookingInfo.rows.length === 0) {
    throw new Error('Бронирование не найдено или у вас нет прав на его отмену');
  }

  const booking = bookingInfo.rows[0];
  const { schedule_id, start_time, price, club_id, class_name, first_name, last_name, club_name } = booking;
  
  // Проверяем статус
  if (booking.status === 'cancelled') {
    throw new Error('Бронирование уже отменено');
  }
  
  // Вычисляем разницу во времени
  const now = new Date();
  const classStart = new Date(start_time);
  const hoursUntilClass = (classStart.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  console.log(`Отмена бронирования: ${hoursUntilClass} часов до начала`);
  console.log(`Текущее время: ${now}`);
  console.log(`Время занятия: ${classStart}`);
  
  // Определяем, нужно ли возвращать деньги
  const shouldRefund = hoursUntilClass >= 12;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Обновляем статус бронирования
    const result = await client.query(
      `UPDATE bookings 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    // Уменьшаем счетчик занятых мест
    await client.query(
      'UPDATE schedule SET booked = booked - 1 WHERE id = $1',
      [schedule_id]
    );
    
    let refundMessage = '';
    
    if (shouldRefund) {
      // Возвращаем деньги на счет пользователя
      await client.query(
        'UPDATE users SET balance = balance + $1 WHERE id = $2',
        [price, userId]
      );
      
      // Списываем с баланса клуба
      await client.query(
        'UPDATE clubs SET balance = balance - $1 WHERE id = $2',
        [price, club_id]
      );
      
      // Создаем запись о возврате средств
      await client.query(
        `INSERT INTO transactions
         (user_id, club_id, type, amount, description, booking_id)
         VALUES ($1, $2, 'refund', $3, 'Возврат средств за отмененное занятие', $4)`,
        [userId, club_id, price, id]
      );
      
      refundMessage = `Деньги (${price} ₽) возвращены на ваш счет. `;
    }
    
    await client.query('COMMIT');
    
    // Формируем сообщение для пользователя
    const message = shouldRefund 
      ? `${refundMessage}Хотите перенести занятие на другой день или выбрать другое?`
      : 'Ваше занятие отменено.';
    
    return {
      ...result.rows[0],
      refunded: shouldRefund,
      refund_amount: shouldRefund ? price : 0,
      message: message,
      hours_before_class: Math.round(hoursUntilClass * 100) / 100,
      // Данные для Telegram уведомления
      class_name,
      user_name: `${first_name} ${last_name}`.trim(),
      club_name,
      class_start_time: classStart
    };
    
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// ИСПРАВЛЕННАЯ ФУНКЦИЯ: Отмена бронирования клубом
// ИСПРАВЛЕННАЯ ФУНКЦИЯ: Отмена бронирования клубом
// ИСПРАВЛЕННАЯ ФУНКЦИЯ: Отмена бронирования клубом с новыми полями
async function cancelBookingByClub(bookingId, ownerId, reason = '') {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Получаем детали бронирования с проверкой прав
    const bookingResult = await client.query(`
      SELECT 
        b.id, 
        b.user_id,
        b.status, 
        b.amount_paid,  -- ВАЖНО: получаем сумму к возврату
        b.schedule_id,
        u.first_name,
        u.last_name,
        u.telegram_id as user_telegram_id,
        s.class_name,
        s.start_time,
        s.price,  -- ДОБАВЛЕНО: получаем цену из расписания
        c.name as club_name,
        c.owner_id
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN schedule s ON b.schedule_id = s.id
      JOIN clubs c ON s.club_id = c.id
      WHERE b.id = $1 AND c.owner_id = $2
    `, [bookingId, ownerId]);
    
    if (bookingResult.rows.length === 0) {
      throw new Error('Бронирование не найдено или у вас нет прав на его отмену');
    }
    
    const booking = bookingResult.rows[0];
    
    if (booking.status !== 'confirmed') {
      throw new Error('Бронирование уже отменено или завершено');
    }
    
    console.log('Найдено бронирование для отмены клубом:', {
      bookingId: booking.id,
      userId: booking.user_id,
      userTelegramId: booking.user_telegram_id,
      className: booking.class_name,
      ownerId: booking.owner_id,
      amountPaid: booking.amount_paid, // ДОБАВЛЕНО
      price: booking.price // ДОБАВЛЕНО
    });
    
    // ИСПРАВЛЕНО: Определяем сумму возврата
    const refundAmount = parseFloat(booking.amount_paid) || parseFloat(booking.price) || 0;
    
    console.log(`💰 Сумма к возврату: ${refundAmount} ₽`);
    
    if (refundAmount <= 0) {
      console.warn('⚠️ Сумма возврата равна 0! Проверьте amount_paid или price');
    }
    
    // Отменяем бронирование
    await client.query(`
      UPDATE bookings 
      SET status = 'cancelled_by_club', 
          cancelled_by = 'club',
          cancellation_reason = $2,
          cancelled_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [bookingId, reason]);
    
    // ИСПРАВЛЕНО: Возвращаем средства пользователю (ВСЕГДА при отмене клубом)
    if (refundAmount > 0) {
      console.log(`💳 Возвращаем ${refundAmount} ₽ пользователю ${booking.user_id}`);
      
      const balanceUpdateResult = await client.query(
        'UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance',
        [refundAmount, booking.user_id]
      );
      
      console.log(`✅ Новый баланс пользователя: ${balanceUpdateResult.rows[0]?.balance} ₽`);
    }
    
    // Освобождаем место в расписании
    await client.query(
      'UPDATE schedule SET booked = booked - 1 WHERE id = $1',
      [booking.schedule_id]
    );
    
    await client.query('COMMIT');
    
    console.log('Бронирование успешно отменено клубом:', {
      bookingId,
      userId: booking.user_id,
      refundAmount,
      reason
    });
    
    // ИСПРАВЛЕНО: возвращаем правильную сумму возврата
    return {
      success: true,
      refunded: true,
      refund_amount: refundAmount.toFixed(2), // ИСПРАВЛЕНО
      class_name: booking.class_name,
      class_start_time: booking.start_time,
      user_name: `${booking.first_name} ${booking.last_name}`.trim(),
      user_id: booking.user_id,
      user_telegram_id: booking.user_telegram_id,
      club_name: booking.club_name,
      cancelled_by: 'club',
      cancellation_reason: reason
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при отмене бронирования клубом:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function getUserBookings(userId) {
  const result = await pool.query(
    `SELECT b.id, b.status, b.created_at, b.rating, b.feedback, b.visit_code,
            b.schedule_id,
            s.class_name, s.start_time, s.end_time, s.trainer,
            c.id as club_id, c.name as club_name, c.address as club_address
     FROM bookings b
     JOIN schedule s ON b.schedule_id = s.id
     JOIN clubs c ON s.club_id = c.id
     WHERE b.user_id = $1 AND b.status != 'cancelled'
       AND s.start_time > CURRENT_TIMESTAMP
     ORDER BY s.start_time`,
    [userId]
  );
  
  return result.rows;
}

async function getUserHistory(userId) {
  const result = await pool.query(
    `SELECT b.id, b.status, b.created_at, b.rating, b.feedback, b.visit_code,
            s.class_name, s.start_time, s.end_time, s.trainer,
            c.id as club_id, c.name as club_name, c.address as club_address
     FROM bookings b
     JOIN schedule s ON b.schedule_id = s.id
     JOIN clubs c ON s.club_id = c.id
     WHERE b.user_id = $1
       AND (b.status = 'completed' OR s.start_time < CURRENT_TIMESTAMP)
     ORDER BY s.start_time DESC`,
    [userId]
  );
  
  return result.rows;
}

async function addRating(id, userId, rating, feedback) {
  // Проверяем, что бронирование принадлежит пользователю
  const bookingCheck = await pool.query(
    'SELECT id FROM bookings WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  
  if (bookingCheck.rows.length === 0) {
    throw new Error('Бронирование не найдено или у вас нет прав на его оценку');
  }
  
  const result = await pool.query(
    `UPDATE bookings 
     SET rating = $1, feedback = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [rating, feedback, id]
  );
  
  return result.rows[0];
}

async function getClubBookings(clubId) {
  const result = await pool.query(
    `SELECT b.id, b.status, b.created_at, b.visit_code,
            u.first_name, u.last_name, u.email, u.phone,
            s.class_name, s.start_time, s.end_time, s.trainer, s.price
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     JOIN schedule s ON b.schedule_id = s.id
     WHERE s.club_id = $1
     ORDER BY s.start_time DESC`,
    [clubId]
  );
  
  return result.rows;
}

async function completeBooking(id) {
  const result = await pool.query(
    `UPDATE bookings
     SET status = 'completed', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  
  return result.rows[0];
}

// Функция для получения детальной информации о бронировании для уведомлений
async function getBookingDetailsForNotification(bookingId) {
  const result = await pool.query(
    `SELECT 
      b.id as booking_id,
      b.created_at as booking_date,
      b.visit_code,
      u.first_name,
      u.last_name,
      u.email as user_email,
      u.phone as user_phone,
      s.class_name,
      s.start_time as class_date,
      EXTRACT(HOUR FROM s.start_time) || ':' || 
      LPAD(EXTRACT(MINUTE FROM s.start_time)::TEXT, 2, '0') as class_time,
      s.price,
      c.name as club_name,
      c.owner_id
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     JOIN schedule s ON b.schedule_id = s.id
     JOIN clubs c ON s.club_id = c.id
     WHERE b.id = $1`,
    [bookingId]
  );
  
  if (result.rows.length > 0) {
    const row = result.rows[0];
    // Объединяем имя и фамилию
    row.user_name = `${row.first_name} ${row.last_name || ''}`.trim();
    delete row.first_name;
    delete row.last_name;
    
    console.log('Детали бронирования для уведомления:', row);
    return row;
  }
  
  return null;
}

// НОВАЯ ФУНКЦИЯ: Получение бронирования по коду посещения
async function getBookingByVisitCode(visitCode) {
  const result = await pool.query(
    `SELECT b.id, b.user_id, b.schedule_id, b.status, b.visit_code, b.created_at,
            u.first_name, u.last_name, u.email, u.phone,
            s.class_name, s.start_time, s.end_time, s.trainer,
            c.id as club_id, c.name as club_name
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     JOIN schedule s ON b.schedule_id = s.id
     JOIN clubs c ON s.club_id = c.id
     WHERE b.visit_code = $1 AND b.status = 'confirmed'`,
    [visitCode]
  );
  
  if (result.rows.length > 0) {
    const row = result.rows[0];
    row.user_name = `${row.first_name} ${row.last_name || ''}`.trim();
    return row;
  }
  
  return null;
}

// НОВАЯ ФУНКЦИЯ: Валидация кода посещения
async function validateVisitCode(visitCode, clubId = null) {
  let query = `
    SELECT b.id, b.user_id, b.schedule_id, b.status, b.visit_code,
           s.start_time, s.end_time, s.class_name,
           c.id as club_id, c.name as club_name,
           u.first_name, u.last_name
    FROM bookings b
    JOIN schedule s ON b.schedule_id = s.id
    JOIN clubs c ON s.club_id = c.id
    JOIN users u ON b.user_id = u.id
    WHERE b.visit_code = $1 AND b.status = 'confirmed'
  `;
  
  const params = [visitCode];
  
  // Если указан клуб, добавляем фильтр по клубу
  if (clubId) {
    query += ' AND c.id = $2';
    params.push(clubId);
  }
  
  const result = await pool.query(query, params);
  
  if (result.rows.length === 0) {
    return { valid: false, message: 'Код посещения не найден или недействителен' };
  }
  
  const booking = result.rows[0];
  const now = new Date();
  const classStart = new Date(booking.start_time);
  const classEnd = new Date(booking.end_time);
  
  // Проверяем, что занятие сегодня (в пределах разумного времени)
  const timeDiff = Math.abs(now.getTime() - classStart.getTime());
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  if (hoursDiff > 24) {
    return { 
      valid: false, 
      message: 'Код посещения действителен только в день занятия',
      booking: booking 
    };
  }
  
  return {
    valid: true,
    message: 'Код посещения действителен',
    booking: {
      ...booking,
      user_name: `${booking.first_name} ${booking.last_name || ''}`.trim()
    }
  };
}

// НОВАЯ ФУНКЦИЯ: Получение статистики по кодам посещения
async function getVisitCodeStats(clubId, startDate = null, endDate = null) {
  let query = `
    SELECT 
      COUNT(*) as total_bookings,
      COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_visits,
      COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as pending_visits,
      COUNT(CASE WHEN b.visit_code IS NOT NULL THEN 1 END) as with_visit_code
    FROM bookings b
    JOIN schedule s ON b.schedule_id = s.id
    WHERE s.club_id = $1
  `;
  
  const params = [clubId];
  
  if (startDate && endDate) {
    query += ' AND s.start_time BETWEEN $2 AND $3';
    params.push(startDate, endDate);
  }
  
  const result = await pool.query(query, params);
  return result.rows[0];
}

module.exports = {
  createBooking,
  cancelBooking,
  cancelBookingByClub,
  getUserBookings,
  getUserHistory,
  addRating,
  getClubBookings,
  completeBooking,
  getBookingDetailsForNotification,
  getBookingByVisitCode,
  validateVisitCode,
  getVisitCodeStats
};