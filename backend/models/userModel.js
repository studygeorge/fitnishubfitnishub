const { pool } = require('../db');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Импортируем утилитарные функции из clubModel.js
const { deleteFileIfExists, getFilePathFromUrl } = require('./clubModel');

async function createUser(userData) {
    const { email, password, first_name, last_name, phone, preferences } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Обработка preferences для PostgreSQL
    let preferencesArray = null;
    if (preferences && Array.isArray(preferences) && preferences.length > 0) {
      // Преобразование JS массива в формат PostgreSQL массива
      preferencesArray = `{${preferences.map(p => `"${p}"`).join(',')}}`;
    }
    
    try {
      const result = await pool.query(
        `INSERT INTO users 
         (email, password, first_name, last_name, phone, preferences)
         VALUES ($1, $2, $3, $4, $5, $6::text[]) 
         RETURNING id, email, first_name, last_name, phone, preferences, balance, created_at`,
        [email, hashedPassword, first_name, last_name, phone, preferencesArray]
      );
      
      return result.rows[0];
    } catch (err) {
      console.error('Ошибка при создании пользователя:', err);
      throw new Error(err.message || 'Ошибка при создании пользователя');
    }
}

async function updateUser(id, userData) {
  const { first_name, last_name, phone, preferences, profile_image } = userData;
  
  const result = await pool.query(
    `UPDATE users 
     SET first_name = COALESCE($1, first_name),
         last_name = COALESCE($2, last_name),
         phone = COALESCE($3, phone),
         preferences = COALESCE($4, preferences),
         profile_image = COALESCE($5, profile_image),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING id, email, first_name, last_name, phone, preferences, profile_image, balance, telegram_id, telegram_username`,
    [first_name, last_name, phone, preferences, profile_image, id]
  );
  
  return result.rows[0];
}

// Получение всех пользователей
async function getAllUsers() {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, phone, profile_image, balance, is_admin, is_club_owner, created_at FROM users',
      []
    );
    return result.rows;
}

// Получение пользователей по роли
async function getUsersByRole(isClubOwner) {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, phone FROM users WHERE is_club_owner = $1',
      [isClubOwner]
    );
    return result.rows;
}

async function findUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

async function findUserById(id) {
  const result = await pool.query(
    'SELECT id, email, first_name, last_name, phone, preferences, profile_image, balance, created_at, telegram_id, telegram_username FROM users WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  
  return user;
}

async function updatePassword(id, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await pool.query(
    'UPDATE users SET password = $1 WHERE id = $2',
    [hashedPassword, id]
  );
  
  return true;
}

// ИСПРАВЛЕНО: Эта функция добавляет к балансу (для пополнения)
async function updateBalance(id, amount) {
  const result = await pool.query(
    'UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance',
    [amount, id]
  );
  
  return result.rows[0];
}

// ДОБАВЛЕНО: Новая функция для установки конкретного значения баланса
async function setBalance(id, newBalance) {
  const result = await pool.query(
    'UPDATE users SET balance = $1 WHERE id = $2 RETURNING balance',
    [newBalance, id]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Пользователь не найден');
  }
  
  return result.rows[0];
}

// ДОБАВЛЕНО: Функция для списания средств с проверкой баланса
async function deductBalance(id, amount) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Проверяем текущий баланс
    const balanceResult = await client.query(
      'SELECT balance FROM users WHERE id = $1',
      [id]
    );
    
    if (balanceResult.rows.length === 0) {
      throw new Error('Пользователь не найден');
    }
    
    const currentBalance = parseFloat(balanceResult.rows[0].balance);
    
    if (currentBalance < amount) {
      throw new Error('Недостаточно средств на балансе');
    }
    
    // Списываем средства
    const newBalance = currentBalance - amount;
    const result = await client.query(
      'UPDATE users SET balance = $1 WHERE id = $2 RETURNING balance',
      [newBalance, id]
    );
    
    await client.query('COMMIT');
    
    return {
      old_balance: currentBalance,
      new_balance: newBalance,
      amount_deducted: amount
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getUserBalance(id) {
  const result = await pool.query('SELECT balance FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

// ОБНОВЛЕННЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С АВАТАРАМИ

async function uploadUserAvatar(userId, file) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Дополнительная проверка размера файла
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error('Файл слишком большой. Максимальный размер: 50MB');
    }
    
    // Проверка формата файла
    const allowedMimes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/webp', 
      'image/bmp', 
      'image/tiff',
      'image/svg+xml'
    ];
    
    if (!allowedMimes.includes(file.mimetype)) {
      throw new Error('Неподдерживаемый формат файла. Поддерживаются: JPG, PNG, GIF, WebP, BMP, TIFF, SVG');
    }
    
    // Проверяем, существует ли пользователь
    const userResult = await client.query(
      'SELECT id, profile_image FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('Пользователь не найден');
    }
    
    const currentUser = userResult.rows[0];
    
    // Создаем директорию для аватаров пользователей, если её нет
    const uploadDir = path.join(__dirname, '../../frontend/build/uploads/users');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Создана директория: ${uploadDir}`);
    }
    
    // Генерируем уникальное имя файла
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `user-${userId}-${timestamp}-${randomSuffix}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Если у пользователя уже есть аватар, удаляем старый файл
    if (currentUser.profile_image) {
      const oldFilePath = getFilePathFromUrl(currentUser.profile_image);
      if (oldFilePath) {
        deleteFileIfExists(oldFilePath);
        console.log(`Старый аватар пользователя удален: ${oldFilePath}`);
      }
    }
    
    // Сохраняем новый файл (используем file.buffer для multer memory storage)
    await fs.promises.writeFile(filePath, file.buffer);
    console.log(`Аватар пользователя сохранен: ${filePath} (размер: ${file.size} байт)`);
    
    // Формируем URL для сохранения в БД
    const imageUrl = `/uploads/users/${fileName}`;
    
    // Обновляем запись в БД
    const updateResult = await client.query(
      'UPDATE users SET profile_image = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING profile_image',
      [imageUrl, userId]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      message: 'Аватар успешно загружен',
      imagePath: imageUrl,
      fileName: fileName,
      fileSize: file.size,
      mimeType: file.mimetype
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка загрузки аватара пользователя:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function deleteUserAvatar(userId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Получаем информацию о пользователе
    const userResult = await client.query(
      'SELECT id, profile_image FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('Пользователь не найден');
    }
    
    const currentUser = userResult.rows[0];
    
    if (!currentUser.profile_image) {
      throw new Error('У пользователя нет аватара для удаления');
    }
    
    // Удаляем файл
    const filePath = getFilePathFromUrl(currentUser.profile_image);
    if (filePath) {
      deleteFileIfExists(filePath);
      console.log(`Аватар пользователя удален: ${filePath}`);
    }
    
    // Обновляем запись в БД, устанавливая profile_image в NULL
    await client.query(
      'UPDATE users SET profile_image = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      message: 'Аватар успешно удален'
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка удаления аватара пользователя:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function getUserAvatar(userId) {
  try {
    const result = await pool.query(
      'SELECT profile_image FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Пользователь не найден');
    }
    
    const user = result.rows[0];
    
    // Проверяем, существует ли файл на диске (если есть аватар)
    let fileExists = false;
    if (user.profile_image) {
      const filePath = getFilePathFromUrl(user.profile_image);
      if (filePath && fs.existsSync(filePath)) {
        fileExists = true;
      }
    }
    
    return {
      profile_image: user.profile_image,
      hasAvatar: !!user.profile_image,
      fileExists: fileExists
    };
    
  } catch (error) {
    console.error('Ошибка получения аватара пользователя:', error);
    throw error;
  }
}

// ДОПОЛНИТЕЛЬНАЯ ФУНКЦИЯ: проверка корректности аватаров всех пользователей
async function validateAllUserAvatars() {
  try {
    const result = await pool.query(
      'SELECT id, profile_image FROM users WHERE profile_image IS NOT NULL'
    );
    
    const issues = [];
    
    for (const user of result.rows) {
      const filePath = getFilePathFromUrl(user.profile_image);
      if (filePath && !fs.existsSync(filePath)) {
        issues.push({
          userId: user.id,
          profileImage: user.profile_image,
          issue: 'Файл не найден на диске'
        });
      }
    }
    
    return {
      totalUsers: result.rows.length,
      issues: issues,
      valid: issues.length === 0
    };
    
  } catch (error) {
    console.error('Ошибка валидации аватаров пользователей:', error);
    throw error;
  }
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  updatePassword,
  updateBalance,
  setBalance,
  deductBalance,
  getAllUsers,
  getUsersByRole,
  getUserBalance,
  uploadUserAvatar,
  deleteUserAvatar,
  getUserAvatar,
  validateAllUserAvatars
};