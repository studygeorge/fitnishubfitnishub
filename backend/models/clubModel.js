const { pool } = require('../db');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Функция для удаления файла, если он существует
const deleteFileIfExists = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Файл успешно удален: ${filePath}`);
      return true;
    } else {
      console.warn(`Файл не существует: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Ошибка при удалении файла ${filePath}:`, error);
    return false;
  }
};

// Функция для получения пути к файлу из URL
const getFilePathFromUrl = (fileUrl) => {
  if (!fileUrl) return null;
  
  try {
    let filename;
    
    // Извлекаем имя файла из URL
    if (fileUrl.startsWith('/uploads/')) {
      filename = fileUrl.substring('/uploads/'.length);
    } else if (fileUrl.includes('/uploads/')) {
      const parts = fileUrl.split('/uploads/');
      filename = parts[1];
    } else {
      console.warn('Неизвестный формат URL:', fileUrl);
      return null;
    }
    
    // Формируем путь к файлу
    return path.join(__dirname, '../../frontend/build/uploads', filename);
  } catch (error) {
    console.error('Ошибка при получении пути к файлу:', error);
    return null;
  }
};

// ======================== TELEGRAM ФУНКЦИИ ВЛАДЕЛЬЦЕВ КЛУБОВ ========================

// Создание таблицы для хранения Telegram данных владельцев клубов
async function createTelegramTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS club_owner_telegram (
      id SERIAL PRIMARY KEY,
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      telegram_chat_id TEXT,
      verification_code TEXT,
      is_active BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(owner_id),
      UNIQUE(telegram_chat_id)
    )
  `;
  
  await pool.query(sql);
  console.log('Таблица club_owner_telegram создана или уже существует');
}

// Генерация кода верификации для владельца клуба
async function generateVerificationCode(ownerId) {
  const verificationCode = Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Проверяем, есть ли уже запись для этого владельца
    const existingRecord = await client.query(
      'SELECT id FROM club_owner_telegram WHERE owner_id = $1',
      [ownerId]
    );
    
    if (existingRecord.rows.length > 0) {
      // Обновляем существующую запись - только код верификации и статус
      await client.query(
        `UPDATE club_owner_telegram 
         SET verification_code = $1, is_active = false, updated_at = CURRENT_TIMESTAMP
         WHERE owner_id = $2`,
        [verificationCode, ownerId]
      );
    } else {
      // Создаем новую запись БЕЗ telegram_chat_id (он будет добавлен позже)
      await client.query(
        `INSERT INTO club_owner_telegram (owner_id, verification_code, is_active)
         VALUES ($1, $2, false)`,
        [ownerId, verificationCode]
      );
    }
    
    await client.query('COMMIT');
    return verificationCode;
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Сохранение Telegram ID после верификации
async function saveClubOwnerTelegramId(verificationCode, telegramChatId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Находим владельца по коду верификации
    const findResult = await client.query(
      `SELECT cot.owner_id, u.first_name, u.last_name, c.name as club_name 
       FROM club_owner_telegram cot
       JOIN users u ON cot.owner_id = u.id
       LEFT JOIN clubs c ON c.owner_id = u.id
       WHERE cot.verification_code = $1 AND cot.is_active = false`,
      [verificationCode]
    );
    
    if (findResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, message: 'Неверный код верификации или код уже использован' };
    }
    
    const ownerData = findResult.rows[0];
    
    // Проверяем, не используется ли уже этот telegram_chat_id другим владельцем
    const existingTelegram = await client.query(
      `SELECT owner_id FROM club_owner_telegram 
       WHERE telegram_chat_id = $1 AND owner_id != $2 AND is_active = true`,
      [telegramChatId, ownerData.owner_id]
    );
    
    if (existingTelegram.rows.length > 0) {
      await client.query('ROLLBACK');
      return { success: false, message: 'Этот Telegram аккаунт уже используется другим владельцем клуба' };
    }
    
    // Обновляем запись с Telegram ID
    await client.query(
      `UPDATE club_owner_telegram 
       SET telegram_chat_id = $1, is_active = true, verification_code = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE owner_id = $2`,
      [telegramChatId, ownerData.owner_id]
    );
    
    await client.query('COMMIT');
    
    return { 
      success: true, 
      clubName: ownerData.club_name || 'Ваш клуб',
      ownerName: `${ownerData.first_name} ${ownerData.last_name}`.trim()
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Получение Telegram ID владельца клуба
async function getClubOwnerTelegramId(ownerId) {
  const result = await pool.query(
    `SELECT telegram_chat_id 
     FROM club_owner_telegram 
     WHERE owner_id = $1 AND is_active = true`,
    [ownerId]
  );
  
  return result.rows.length > 0 ? result.rows[0].telegram_chat_id : null;
}

// Получение детальной информации о бронировании для уведомления
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
     WHERE b.id = $1 AND b.status = 'confirmed'`,
    [bookingId]
  );
  
  if (result.rows.length > 0) {
    const row = result.rows[0];
    // Объединяем имя и фамилию
    row.user_name = `${row.first_name} ${row.last_name || ''}`.trim();
    delete row.first_name;
    delete row.last_name;
    return row;
  }
  
  return null;
}

// Проверка статуса Telegram подключения
async function getTelegramConnectionStatus(ownerId) {
  const result = await pool.query(
    `SELECT is_active, created_at, telegram_chat_id
     FROM club_owner_telegram 
     WHERE owner_id = $1`,
    [ownerId]
  );
  
  return result.rows.length > 0 ? {
    connected: result.rows[0].is_active,
    connectedAt: result.rows[0].created_at,
    telegramId: result.rows[0].telegram_chat_id ? '***скрыто***' : null
  } : { connected: false };
}

// Отключение Telegram уведомлений
async function disconnectTelegram(ownerId) {
  const result = await pool.query(
    `UPDATE club_owner_telegram 
     SET is_active = false, updated_at = CURRENT_TIMESTAMP
     WHERE owner_id = $1
     RETURNING *`,
    [ownerId]
  );
  
  return result.rows.length > 0;
}

// ======================== TELEGRAM ФУНКЦИИ ПОЛЬЗОВАТЕЛЕЙ ========================

// Создание таблицы для хранения кодов верификации пользователей
async function createUserTelegramTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS user_telegram_codes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code VARCHAR(10) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Создаем индексы только если их еще нет
    CREATE INDEX IF NOT EXISTS idx_user_telegram_codes_code ON user_telegram_codes(code);
    CREATE INDEX IF NOT EXISTS idx_user_telegram_codes_expires ON user_telegram_codes(expires_at);
    CREATE INDEX IF NOT EXISTS idx_user_telegram_codes_user_id ON user_telegram_codes(user_id);
    
    -- Создаем уникальные ограничения только если их еще нет
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_user_telegram_codes_code'
      ) THEN
        ALTER TABLE user_telegram_codes ADD CONSTRAINT unique_user_telegram_codes_code UNIQUE(code);
      END IF;
    END $$;
  `;
  
  await pool.query(sql);
  console.log('Таблица user_telegram_codes создана или уже существует');
}

// Генерация кода верификации для пользователя
async function generateUserVerificationCode(userId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Удаляем старые коды для этого пользователя
    await client.query(
      'DELETE FROM user_telegram_codes WHERE user_id = $1',
      [userId]
    );
    
    // Генерируем новый код
    const code = Math.random().toString(36).substr(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут
    
    // Сохраняем код
    const result = await client.query(
      `INSERT INTO user_telegram_codes (user_id, code, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, code, expiresAt]
    );
    
    await client.query('COMMIT');
    
    return { 
      code, 
      expiresAt,
      id: result.rows[0].id
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка в generateUserVerificationCode:', error);
    throw error;
  } finally {
    client.release();
  }
}

// ИСПРАВЛЕНО: Проверка статуса привязки Telegram для пользователя
async function checkUserLinkingStatus(userId, code) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Проверяем, есть ли уже привязанный Telegram ID
    const userResult = await client.query(
      'SELECT telegram_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, message: 'Пользователь не найден' };
    }
    
    const user = userResult.rows[0];
    
    // КРИТИЧНО: Если Telegram уже привязан, удаляем все коды верификации
    if (user.telegram_id) {
      await client.query(
        'DELETE FROM user_telegram_codes WHERE user_id = $1',
        [userId]
      );
      await client.query('COMMIT');
      
      return {
        success: true,
        linked: true,
        telegram_id: user.telegram_id
      };
    }
    
    // Если код не передан, просто проверяем статус
    if (!code) {
      await client.query('COMMIT');
      return {
        success: true,
        linked: false,
        hasActiveCode: false
      };
    }
    
    // Проверяем переданный код
    const codeResult = await client.query(
      `SELECT * FROM user_telegram_codes 
       WHERE user_id = $1 AND code = $2 AND expires_at > CURRENT_TIMESTAMP AND used = false`,
      [userId, code]
    );
    
    await client.query('COMMIT');
    
    if (codeResult.rows.length === 0) {
      return { success: false, message: 'Код не найден или истек' };
    }
    
    return {
      success: true,
      linked: false,
      hasActiveCode: true,
      used: false
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка в checkUserLinkingStatus:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Получение статуса Telegram для пользователя
async function getUserTelegramConnectionStatus(userId) {
  try {
    const result = await pool.query(
      'SELECT telegram_id, telegram_username, telegram_linked_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return { connected: false, message: 'Пользователь не найден' };
    }
    
    const user = result.rows[0];
    
    return {
      connected: !!user.telegram_id,
      isLinked: !!user.telegram_id,
      telegram_id: user.telegram_id,
      telegram_username: user.telegram_username,
      linked_at: user.telegram_linked_at,
      telegramUsername: user.telegram_username,
      linkedAt: user.telegram_linked_at
    };
  } catch (error) {
    console.error('Ошибка в getUserTelegramConnectionStatus:', error);
    throw error;
  }
}

// Привязка Telegram аккаунта пользователя
async function linkUserTelegram(userId, telegramId, telegramUsername = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Проверяем, не привязан ли уже этот Telegram ID к другому пользователю
    const existingUser = await client.query(
      'SELECT id FROM users WHERE telegram_id = $1 AND id != $2',
      [telegramId, userId]
    );
    
    if (existingUser.rows.length > 0) {
      throw new Error('Этот Telegram аккаунт уже привязан к другому пользователю');
    }
    
    // Обновляем данные пользователя
    const result = await client.query(
      `UPDATE users 
       SET telegram_id = $1, telegram_username = $2, telegram_linked_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id`,
      [telegramId, telegramUsername, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Пользователь не найден');
    }

    // КРИТИЧНО: Удаляем все коды верификации после успешной привязки
    await client.query(
      'DELETE FROM user_telegram_codes WHERE user_id = $1',
      [userId]
    );

    await client.query('COMMIT');
    
    return {
      success: true,
      message: 'Telegram аккаунт успешно привязан'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка в linkUserTelegram:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Отвязка Telegram аккаунта пользователя
async function disconnectUserTelegram(userId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await pool.query(
      `UPDATE users 
       SET telegram_id = NULL, telegram_username = NULL, telegram_linked_at = NULL
       WHERE id = $1 AND telegram_id IS NOT NULL
       RETURNING id`,
      [userId]
    );

    // Удаляем все коды верификации
    await client.query(
      'DELETE FROM user_telegram_codes WHERE user_id = $1',
      [userId]
    );

    await client.query('COMMIT');

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'Telegram не был привязан к аккаунту'
      };
    }
    
    return {
      success: true,
      message: 'Telegram аккаунт успешно отвязан'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка в disconnectUserTelegram:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Получение Telegram ID пользователя
async function getUserTelegramId(userId) {
  try {
    console.log('getUserTelegramId для userId:', userId);
    
    const result = await pool.query(
      'SELECT telegram_id FROM users WHERE id = $1',
      [userId]
    );
    
    console.log('Результат запроса к БД:', result.rows);
    
    if (result.rows.length === 0) {
      console.log(`Пользователь с id ${userId} не найден`);
      return null;
    }
    
    const telegramId = result.rows[0].telegram_id;
    console.log(`Найден telegram_id для пользователя ${userId}:`, telegramId);
    
    return telegramId; // ИСПРАВЛЕНО: возвращаем telegram_id, а не id
  } catch (error) {
    console.error('Ошибка получения telegram_id пользователя:', error);
    return null;
  }
}

// ИСПРАВЛЕНО: Сохранение привязки пользователя из Telegram бота
async function saveUserTelegramId(verificationCode, telegramChatId, telegramUsername = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Находим код и проверяем его действительность
    const codeResult = await client.query(
      `SELECT user_id FROM user_telegram_codes 
       WHERE code = $1 AND expires_at > CURRENT_TIMESTAMP AND used = FALSE`,
      [verificationCode]
    );
    
    if (codeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'Код верификации недействителен или истек'
      };
    }
    
    const userId = codeResult.rows[0].user_id;
    
    // Получаем информацию о пользователе
    const userResult = await client.query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'Пользователь не найден'
      };
    }
    
    const user = userResult.rows[0];
    const userName = `${user.first_name} ${user.last_name || ''}`.trim();
    
    // Проверяем, не привязан ли уже этот Telegram ID к другому пользователю
    const existingUser = await client.query(
      'SELECT id FROM users WHERE telegram_id = $1 AND id != $2',
      [telegramChatId, userId]
    );
    
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'Этот Telegram аккаунт уже привязан к другому пользователю'
      };
    }
    
    // Обновляем пользователя с Telegram ID
    await client.query(
      `UPDATE users 
       SET telegram_id = $1, telegram_username = $2, telegram_linked_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [telegramChatId, telegramUsername, userId]
    );
    
    // КРИТИЧНО: Удаляем ВСЕ коды верификации для этого пользователя после успешной привязки
    await client.query(
      'DELETE FROM user_telegram_codes WHERE user_id = $1',
      [userId]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      message: 'Аккаунт успешно привязан',
      userName: userName
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка в saveUserTelegramId:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Функция для отправки уведомления пользователю об отмене занятия
async function getCancellationDetailsForNotification(bookingId) {
  const result = await pool.query(
    `SELECT 
      b.id as booking_id,
      b.user_id,
      b.amount_paid as refund_amount,
      u.telegram_id,
      u.first_name,
      u.last_name,
      s.class_name,
      s.start_time as class_date,
      EXTRACT(HOUR FROM s.start_time) || ':' || 
      LPAD(EXTRACT(MINUTE FROM s.start_time)::TEXT, 2, '0') as class_time,
      c.name as club_name
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     JOIN schedule s ON b.schedule_id = s.id
     JOIN clubs c ON s.club_id = c.id
     WHERE b.id = $1`,
    [bookingId]
  );
  
  if (result.rows.length > 0) {
    const row = result.rows[0];
    row.user_name = `${row.first_name} ${row.last_name || ''}`.trim();
    return row;
  }
  
  return null;
}

// ======================== ОСНОВНЫЕ ФУНКЦИИ КЛУБОВ ========================

async function getAllClubs(filters = {}) {
  let query = `
    SELECT id, name, address, category, description, rating, contact_phone,
           contact_email, website, amenities, images, logo_url, banner_url,
           owner_id, created_at, balance
    FROM clubs
  `;
  
  const queryParams = [];
  const conditions = [];
  
  if (filters.category) {
    queryParams.push(filters.category);
    conditions.push(`category = $${queryParams.length}`);
  }
  
  if (filters.search) {
    queryParams.push(`%${filters.search}%`);
    conditions.push(`(name ILIKE $${queryParams.length} OR address ILIKE $${queryParams.length})`);
  }
  
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  query += ' ORDER BY rating DESC, name';
  
  const result = await pool.query(query, queryParams);
  return result.rows;
}

async function getClubById(id) {
  const result = await pool.query(
    `SELECT id, name, address, category, description, rating, contact_phone,
            contact_email, website, amenities, images, logo_url, banner_url, 
            opening_hours, balance, owner_id, created_at
     FROM clubs
     WHERE id = $1`,
    [id]
  );
  
  return result.rows[0];
}

async function createClub(clubData, ownerId) {
  const {
    name, address, category, description, contact_phone,
    contact_email, website, amenities, images, logo_url, banner_url, opening_hours
  } = clubData;
  
  const result = await pool.query(
    `INSERT INTO clubs 
     (name, address, category, description, owner_id, contact_phone,
      contact_email, website, amenities, images, logo_url, banner_url, opening_hours)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
     RETURNING *`,
    [name, address, category, description, ownerId, contact_phone,
     contact_email, website, amenities || [], images || [], logo_url, banner_url, opening_hours || {}]
  );
  
  return result.rows[0];
}

async function updateClub(id, clubData, ownerId) {
  // Сначала проверяем, что клуб принадлежит этому пользователю
  const clubCheck = await pool.query(
    'SELECT id, logo_url, banner_url, images FROM clubs WHERE id = $1 AND owner_id = $2',
    [id, ownerId]
  );
  
  if (clubCheck.rows.length === 0) {
    throw new Error('У вас нет прав на редактирование этого клуба');
  }
  
  const currentClub = clubCheck.rows[0];
  
  // Подготавливаем данные для обновления
  const updates = [];
  const values = [];
  
  // Функция для добавления поля в запрос обновления
  const addUpdateField = (field, value) => {
    updates.push(`${field} = $${values.length + 1}`);
    values.push(value);
  };
  
  // Проверяем и добавляем поля для обновления
  if ('name' in clubData) addUpdateField('name', clubData.name);
  if ('address' in clubData) addUpdateField('address', clubData.address);
  if ('category' in clubData) addUpdateField('category', clubData.category);
  if ('description' in clubData) addUpdateField('description', clubData.description);
  if ('contact_phone' in clubData) addUpdateField('contact_phone', clubData.contact_phone);
  if ('contact_email' in clubData) addUpdateField('contact_email', clubData.contact_email);
  if ('website' in clubData) addUpdateField('website', clubData.website);
  if ('amenities' in clubData) addUpdateField('amenities', clubData.amenities);
  if ('images' in clubData) addUpdateField('images', clubData.images);
  if ('opening_hours' in clubData) addUpdateField('opening_hours', clubData.opening_hours);
  
  // Специальная обработка для поля logo_url
  if ('logo_url' in clubData) {
    // Если новое значение null, и у клуба был логотип - удаляем файл
    if (clubData.logo_url === null && currentClub.logo_url) {
      const logoPath = getFilePathFromUrl(currentClub.logo_url);
      if (logoPath) {
        deleteFileIfExists(logoPath);
      }
    }
    addUpdateField('logo_url', clubData.logo_url);
  }
  
  // Специальная обработка для поля banner_url
  if ('banner_url' in clubData) {
    // Если новое значение null, и у клуба была шапка - удаляем файл
    if (clubData.banner_url === null && currentClub.banner_url) {
      const bannerPath = getFilePathFromUrl(currentClub.banner_url);
      if (bannerPath) {
        deleteFileIfExists(bannerPath);
      }
    }
    addUpdateField('banner_url', clubData.banner_url);
  }
  
  // Добавляем поле updated_at
  addUpdateField('updated_at', new Date());
  
  // Если нет полей для обновления, возвращаем текущие данные клуба
  if (updates.length === 0) {
    return currentClub;
  }
  
  // Добавляем id в значения и создаем условие WHERE
  values.push(id);
  
  const query = `
    UPDATE clubs 
    SET ${updates.join(', ')}
    WHERE id = $${values.length}
    RETURNING *
  `;
  
  const result = await pool.query(query, values);
  
  return result.rows[0];
}

async function getClubsByOwnerId(ownerId) {
  const result = await pool.query(
    `SELECT id, name, address, category, description, rating, balance, logo_url, banner_url, created_at
     FROM clubs
     WHERE owner_id = $1
     ORDER BY name`,
    [ownerId]
  );
  
  return result.rows;
}

async function updateClubBalance(id, amount) {
  const result = await pool.query(
    'UPDATE clubs SET balance = balance + $1 WHERE id = $2 RETURNING balance',
    [amount, id]
  );
  
  return result.rows[0];
}

async function getClubBalance(id) {
  const result = await pool.query('SELECT balance FROM clubs WHERE id = $1', [id]);
  return result.rows[0];
}

// Функция для удаления логотипа клуба
async function deleteClubLogo(id, ownerId) {
  try {
    // Проверяем права доступа
    const clubCheck = await pool.query(
      'SELECT id, logo_url FROM clubs WHERE id = $1 AND owner_id = $2',
      [id, ownerId]
    );
    
    if (clubCheck.rows.length === 0) {
      throw new Error('У вас нет прав на редактирование этого клуба');
    }
    
    const currentClub = clubCheck.rows[0];
    
    // Если у клуба есть логотип, удаляем файл
    if (currentClub.logo_url) {
      const logoPath = getFilePathFromUrl(currentClub.logo_url);
      if (logoPath) {
        deleteFileIfExists(logoPath);
      }
    }
    
    // Обновляем запись в БД, устанавливая logo_url в NULL
    const result = await pool.query(
      'UPDATE clubs SET logo_url = NULL WHERE id = $1 RETURNING *',
      [id]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Ошибка при удалении логотипа клуба:', error);
    throw error;
  }
}

// Функция для удаления шапки клуба
async function deleteClubBanner(id, ownerId) {
  try {
    // Проверяем права доступа
    const clubCheck = await pool.query(
      'SELECT id, banner_url FROM clubs WHERE id = $1 AND owner_id = $2',
      [id, ownerId]
    );
    
    if (clubCheck.rows.length === 0) {
      throw new Error('У вас нет прав на редактирование этого клуба');
    }
    
    const currentClub = clubCheck.rows[0];
    
    // Если у клуба есть шапка, удаляем файл
    if (currentClub.banner_url) {
      const bannerPath = getFilePathFromUrl(currentClub.banner_url);
      if (bannerPath) {
        deleteFileIfExists(bannerPath);
      }
    }
    
    // Обновляем запись в БД, устанавливая banner_url в NULL
    const result = await pool.query(
      'UPDATE clubs SET banner_url = NULL WHERE id = $1 RETURNING *',
      [id]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Ошибка при удалении шапки клуба:', error);
    throw error;
  }
}

// Функция для удаления изображения из галереи клуба
async function deleteClubGalleryImage(id, imageIndex, ownerId) {
  try {
    // Проверяем права доступа
    const clubCheck = await pool.query(
      'SELECT id, images FROM clubs WHERE id = $1 AND owner_id = $2',
      [id, ownerId]
    );
    
    if (clubCheck.rows.length === 0) {
      throw new Error('У вас нет прав на редактирование этого клуба');
    }
    
    const currentClub = clubCheck.rows[0];
    
    // Проверяем, существует ли изображение с указанным индексом
    const images = currentClub.images || [];
    if (imageIndex < 0 || imageIndex >= images.length) {
      throw new Error('Указанное изображение не найдено');
    }
    
    // Получаем URL изображения, которое нужно удалить
    const imageUrl = images[imageIndex];
    
    // Удаляем файл
    const imagePath = getFilePathFromUrl(imageUrl);
    if (imagePath) {
      deleteFileIfExists(imagePath);
    }
    
    // Удаляем URL из массива изображений
    images.splice(imageIndex, 1);
    
    // Обновляем запись в БД
    const result = await pool.query(
      'UPDATE clubs SET images = $1 WHERE id = $2 RETURNING *',
      [images, id]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Ошибка при удалении изображения из галереи клуба:', error);
    throw error;
  }
}

// Новая функция для авторизации клуба через владельца
async function authenticateClubOwner(email, password) {
  try {
    // Сначала находим пользователя с указанным email
    const userResult = await pool.query(
      'SELECT id, email, password, first_name, last_name FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      // Пользователь не найден
      return { success: false, error: 'Пользователь не найден' };
    }
    
    const user = userResult.rows[0];
    
    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, error: 'Неверный пароль' };
    }
    
    // Проверяем, является ли пользователь владельцем клуба
    const clubsResult = await pool.query(
      'SELECT id, name, balance FROM clubs WHERE owner_id = $1',
      [user.id]
    );
    
    if (clubsResult.rows.length === 0) {
      return { success: false, error: 'У вас нет связанных клубов' };
    }
    
    // Если у пользователя есть клубы, возвращаем информацию о первом клубе
    const club = clubsResult.rows[0];
    
    return {
      success: true,
      userId: user.id,
      userDetails: {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      },
      clubId: club.id,
      clubName: club.name,
      balance: club.balance
    };
  } catch (error) {
    console.error('Ошибка при авторизации клуба:', error);
    return { success: false, error: 'Ошибка сервера при авторизации' };
  }
}

// Функция для получения полной информации о клубе с статистикой
async function getClubWithStats(clubId) {
  try {
    // Получаем основную информацию о клубе
    const clubResult = await pool.query(
      `SELECT c.id, c.name, c.address, c.category, c.description, c.rating, 
              c.contact_phone, c.contact_email, c.website, c.amenities, 
              c.images, c.logo_url, c.banner_url, c.opening_hours, c.balance, c.owner_id,
              u.first_name AS owner_first_name, u.last_name AS owner_last_name
       FROM clubs c
       JOIN users u ON c.owner_id = u.id
       WHERE c.id = $1`,
      [clubId]
    );
    
    if (clubResult.rows.length === 0) {
      return null;
    }
    
    const club = clubResult.rows[0];
    
    // Получаем расписание клуба
    const scheduleResult = await pool.query(
      `SELECT id, class_name, start_time, end_time, trainer, capacity, booked, price, category
       FROM schedule
       WHERE club_id = $1
       ORDER BY start_time`,
      [clubId]
    );
    
    // Получаем бронирования клуба
    const bookingsResult = await pool.query(
      `SELECT b.id, b.status, b.created_at, u.first_name, u.last_name, 
              s.class_name, s.start_time, s.end_time
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN schedule s ON b.schedule_id = s.id
       WHERE s.club_id = $1
       ORDER BY s.start_time DESC
       LIMIT 20`,
      [clubId]
    );
    
    // Считаем статистику
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const todayVisits = bookingsResult.rows.filter(b => 
      new Date(b.created_at) >= today && b.status === 'completed'
    ).length;
    
    const weeklyVisits = bookingsResult.rows.filter(b => 
      new Date(b.created_at) >= weekAgo && b.status === 'completed'
    ).length;
    
    const totalVisits = bookingsResult.rows.filter(b => 
      b.status === 'completed'
    ).length;
    
    return {
      ...club,
      schedule: scheduleResult.rows,
      bookings: bookingsResult.rows,
      stats: {
        totalVisits,
        weeklyVisits,
        todayVisits,
        activeClasses: scheduleResult.rows.length
      }
    };
  } catch (error) {
    console.error('Ошибка при получении данных о клубе с статистикой:', error);
    throw error;
  }
}

// Функция для полного удаления клуба (для админа) - упрощенная версия
async function deleteClub(id) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Получаем информацию о клубе
    const clubResult = await client.query(
      'SELECT id, name, owner_id, logo_url, banner_url, images FROM clubs WHERE id = $1',
      [id]
    );
    
    if (clubResult.rows.length === 0) {
      throw new Error('Клуб не найден');
    }
    
    const club = clubResult.rows[0];
    console.log(`Начинаем удаление клуба "${club.name}" (ID: ${id})`);
    
    // Удаляем файлы изображений
    try {
      if (club.logo_url) {
        const logoPath = getFilePathFromUrl(club.logo_url);
        if (logoPath) {
          deleteFileIfExists(logoPath);
          console.log(`Логотип клуба удален: ${club.logo_url}`);
        }
      }
      
      if (club.banner_url) {
        const bannerPath = getFilePathFromUrl(club.banner_url);
        if (bannerPath) {
          deleteFileIfExists(bannerPath);
          console.log(`Баннер клуба удален: ${club.banner_url}`);
        }
      }
      
      if (club.images && club.images.length > 0) {
        club.images.forEach(imageUrl => {
          const imagePath = getFilePathFromUrl(imageUrl);
          if (imagePath) {
            deleteFileIfExists(imagePath);
          }
        });
        console.log(`Удалено ${club.images.length} изображений из галереи`);
      }
    } catch (fileError) {
      console.warn('Ошибка при удалении файлов клуба:', fileError.message);
    }
    
    // Каскадное удаление из базы данных - только основные таблицы
    const deletedData = {
      telegram: 0,
      bookings: 0,
      schedule: 0
    };
    
    // 1. Удаляем уведомления Telegram
    try {
      const telegramDeleteResult = await client.query(
        'DELETE FROM club_owner_telegram WHERE owner_id = $1',
        [club.owner_id]
      );
      deletedData.telegram = telegramDeleteResult.rowCount;
      console.log(`Удалено Telegram уведомлений: ${deletedData.telegram}`);
    } catch (error) {
      console.log('Таблица club_owner_telegram не найдена, пропускаем');
    }
    
    // 2. Удаляем бронирования пользователей для занятий этого клуба
    try {
      const bookingsDeleteResult = await client.query(`
        DELETE FROM bookings 
        WHERE schedule_id IN (
          SELECT id FROM schedule WHERE club_id = $1
        )
      `, [id]);
      deletedData.bookings = bookingsDeleteResult.rowCount;
      console.log(`Удалено бронирований: ${deletedData.bookings}`);
    } catch (error) {
      console.log('Ошибка при удалении бронирований:', error.message);
    }
    
    // 3. Удаляем расписание занятий клуба
    try {
      const scheduleDeleteResult = await client.query(
        'DELETE FROM schedule WHERE club_id = $1', 
        [id]
      );
      deletedData.schedule = scheduleDeleteResult.rowCount;
      console.log(`Удалено записей расписания: ${deletedData.schedule}`);
    } catch (error) {
      console.log('Таблица schedule не найдена, пропускаем');
    }
    
    // 4. Удаляем сам клуб
    const clubDeleteResult = await client.query(
      'DELETE FROM clubs WHERE id = $1', 
      [id]
    );
    
    if (clubDeleteResult.rowCount === 0) {
      throw new Error('Не удалось удалить клуб из базы данных');
    }
    
    await client.query('COMMIT');
    
    console.log(`Клуб "${club.name}" (ID: ${id}) успешно удален со всеми связанными данными`);
    
    return {
      success: true,
      deletedClub: {
        id: club.id,
        name: club.name
      },
      deletedData
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка удаления клуба:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  // Основные функции клубов
  getAllClubs,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
  getClubsByOwnerId,
  updateClubBalance,
  getClubBalance,
  authenticateClubOwner,
  getClubWithStats,
  deleteClubLogo,
  deleteClubBanner,
  deleteClubGalleryImage,
  
  // Telegram функциональность владельцев клубов
  createTelegramTable,
  generateVerificationCode,
  saveClubOwnerTelegramId,
  getClubOwnerTelegramId,
  getBookingDetailsForNotification,
  getTelegramConnectionStatus,
  disconnectTelegram,
  
  // Telegram функциональность пользователей
  createUserTelegramTable,
  linkUserTelegram,
  disconnectUserTelegram,
  generateUserVerificationCode,
  checkUserLinkingStatus,
  getUserTelegramConnectionStatus,
  getUserTelegramId,
  saveUserTelegramId,
  getCancellationDetailsForNotification,
  
  // Утилиты для работы с файлами
  deleteFileIfExists,
  getFilePathFromUrl
};