const express = require('express');
const router = express.Router();
const { pool } = require('../db'); // Исправлен путь к базе данных
const bcrypt = require('bcrypt');

// Импортируем функции из модели клуба
const { 
  getAllClubs, 
  getClubById, 
  createClub,
  updateClub,
  deleteClub,
  deleteClubLogo,
  deleteClubBanner,
  deleteClubGalleryImage
} = require('../models/clubModel');

// Добавляем отладочный middleware для логирования
router.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log(`📝 ${req.method} ${req.originalUrl}`, {
      body: req.body,
      headers: req.headers['content-type']
    });
  }
  next();
});

// Получение статистики для админ панели
router.get('/stats', async (req, res) => {
  try {
    const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalClubsResult = await pool.query('SELECT COUNT(*) FROM clubs');
    const totalBookingsResult = await pool.query('SELECT COUNT(*) FROM bookings');
    const totalApplicationsResult = await pool.query('SELECT COUNT(*) FROM club_applications');

    const stats = {
      totalUsers: parseInt(totalUsersResult.rows[0].count),
      totalClubs: parseInt(totalClubsResult.rows[0].count),
      totalBookings: parseInt(totalBookingsResult.rows[0].count),
      totalApplications: parseInt(totalApplicationsResult.rows[0].count)
    };

    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение всех пользователей
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, first_name, last_name, email, phone, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    // Форматируем данные для совместимости с AdminDashboardPage
    const users = result.rows.map(user => ({
      ...user,
      full_name: `${user.first_name} ${user.last_name || ''}`.trim(),
      role: 'client' // Добавляем роль по умолчанию
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение всех клубов (используем функцию из модели)
router.get('/clubs', async (req, res) => {
  try {
    const clubs = await getAllClubs();
    
    // Добавляем недостающие поля для админки
    const clubsWithDetails = await Promise.all(
      clubs.map(async (club) => {
        // Получаем информацию о владельце
        const ownerResult = await pool.query(
          'SELECT first_name, last_name, email FROM users WHERE id = $1',
          [club.owner_id]
        );
        
        return {
          id: club.id,
          name: club.name,
          address: club.address,
          phone: club.contact_phone,
          email: club.contact_email,
          description: club.description,
          created_at: club.created_at || new Date(),
          owner_name: ownerResult.rows[0] ? 
            `${ownerResult.rows[0].first_name} ${ownerResult.rows[0].last_name || ''}`.trim() : 
            'Неизвестно'
        };
      })
    );
    
    res.json(clubsWithDetails);
  } catch (error) {
    console.error('Ошибка получения клубов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение детальной информации о клубе для редактирования
router.get('/clubs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Получаем полную информацию о клубе из модели
    const club = await getClubById(id);
    
    if (!club) {
      return res.status(404).json({ error: 'Клуб не найден' });
    }
    
    // Получаем информацию о владельце
    const ownerResult = await pool.query(
      'SELECT id, first_name, last_name, email, phone FROM users WHERE id = $1',
      [club.owner_id]
    );
    
    const owner = ownerResult.rows[0];
    
    res.json({
      ...club,
      owner_name: owner ? `${owner.first_name} ${owner.last_name || ''}`.trim() : 'Неизвестно',
      owner_email: owner?.email,
      owner_phone: owner?.phone
    });
  } catch (error) {
    console.error('Ошибка получения клуба:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение всех заявок на создание клубов
router.get('/applications', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ca.id, 
        ca.club_name, 
        ca.owner_name, 
        ca.email, 
        ca.phone, 
        ca.address, 
        ca.description, 
        ca.status, 
        ca.created_at,
        ca.updated_at
      FROM club_applications ca 
      ORDER BY ca.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения заявок:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление статуса заявки
router.put('/applications/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Обновляем статус заявки
    await client.query(
      'UPDATE club_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, id]
    );

    // Если заявка одобрена, создаем клуб
    if (status === 'approved') {
      const applicationResult = await client.query(
        'SELECT * FROM club_applications WHERE id = $1',
        [id]
      );
      
      const application = applicationResult.rows[0];
      
      if (application) {
        // Сначала создаем пользователя-владельца, если его еще нет
        let ownerId;
        const existingOwner = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [application.email]
        );
        
        if (existingOwner.rows.length > 0) {
          ownerId = existingOwner.rows[0].id;
        } else {
          // Создаем нового пользователя
          const newOwnerResult = await client.query(
            `INSERT INTO users (first_name, last_name, email, phone, password) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [
              application.owner_name.split(' ')[0],
              application.owner_name.split(' ').slice(1).join(' ') || '',
              application.email,
              application.phone,
              await bcrypt.hash('defaultpassword123', 10) // Временный пароль
            ]
          );
          ownerId = newOwnerResult.rows[0].id;
        }
        
        // Создаем клуб
        await client.query(
          `INSERT INTO clubs (name, address, contact_phone, contact_email, description, owner_id, category, rating, balance, amenities, images, opening_hours) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            application.club_name,
            application.address,
            application.phone,
            application.email,
            application.description,
            ownerId,
            'fitness', // категория по умолчанию
            0, // rating
            0, // balance
            [], // amenities как пустой массив
            [], // images как пустой массив
            {} // opening_hours как пустой объект
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Статус заявки обновлен' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка обновления статуса заявки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});

// РОУТ: Регистрация клуба админом - ИСПРАВЛЕННЫЙ
router.post('/clubs', async (req, res) => {
  console.log('📝 Создание клуба админом:', req.body);
  
  const { 
    name, 
    address, 
    category, 
    description, 
    contact_phone, 
    contact_email, 
    website,
    owner_id,
    amenities = []
  } = req.body;
  
  // Валидация обязательных полей
  const requiredFields = {
    'Название клуба': name,
    'Адрес': address,
    'Категория': category,
    'Владелец': owner_id
  };
  
  const missingFields = [];
  for (const [fieldName, value] of Object.entries(requiredFields)) {
    if (!value || value.toString().trim() === '') {
      missingFields.push(fieldName);
    }
  }
  
  if (missingFields.length > 0) {
    console.log('Отсутствуют обязательные поля:', missingFields);
    return res.status(400).json({ 
      error: `Отсутствуют обязательные поля: ${missingFields.join(', ')}`,
      missingFields: missingFields
    });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Проверяем, существует ли владелец
    const ownerResult = await client.query(
      'SELECT id, first_name, last_name FROM users WHERE id = $1',
      [owner_id]
    );
    
    if (ownerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Указанный владелец не найден' });
    }
    
    const owner = ownerResult.rows[0];
    
    // Проверяем, не существует ли клуб с таким названием
    const existingClub = await client.query(
      'SELECT id FROM clubs WHERE name = $1', 
      [name.trim()]
    );
    
    if (existingClub.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Клуб с таким названием уже существует' });
    }
    
    // Подготавливаем данные для вставки
    const clubName = name.trim();
    const clubAddress = address.trim();
    const clubCategory = category.trim();
    const clubDescription = description ? description.trim() : `Фитнес-клуб ${clubName}`;
    const clubPhone = contact_phone ? contact_phone.trim() : null;
    const clubEmail = contact_email ? contact_email.trim() : null;
    const clubWebsite = website ? website.trim() : null;
    
    // Правильная обработка массива amenities
    let amenitiesArray = [];
    if (Array.isArray(amenities)) {
      amenitiesArray = amenities.filter(item => item && typeof item === 'string' && item.trim());
    }
    
    console.log('Подготовленные данные для создания клуба:', {
      name: clubName,
      address: clubAddress,
      category: clubCategory,
      description: clubDescription,
      contact_phone: clubPhone,
      contact_email: clubEmail,
      website: clubWebsite,
      owner_id: owner_id,
      amenities: amenitiesArray
    });
    
    // Создаем клуб используя функцию из модели clubModel
    const clubData = {
      name: clubName,
      address: clubAddress,
      category: clubCategory,
      description: clubDescription,
      contact_phone: clubPhone,
      contact_email: clubEmail,
      website: clubWebsite,
      amenities: amenitiesArray,
      images: [],
      logo_url: null,
      banner_url: null,
      opening_hours: {}
    };
    
    const newClub = await createClub(clubData, owner_id);
    
    await client.query('COMMIT');
    
    console.log(`✅ Создан клуб: ${newClub.name} (ID: ${newClub.id})`);
    
    res.status(201).json({
      success: true,
      message: 'Клуб успешно зарегистрирован',
      club: {
        ...newClub,
        owner_name: `${owner.first_name} ${owner.last_name}`.trim()
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Ошибка создания клуба:', error);
    
    // Обработка специфичных ошибок PostgreSQL
    if (error.code === '23505') { // duplicate key error
      if (error.detail && error.detail.includes('name')) {
        return res.status(400).json({ error: 'Клуб с таким названием уже существует' });
      }
    }
    
    if (error.code === '23502') { // not null constraint
      return res.status(400).json({ 
        error: 'Отсутствуют обязательные данные',
        details: error.message 
      });
    }
    
    if (error.code === '22P02') { // invalid input syntax
      console.error('Ошибка формата данных:', error.message);
      return res.status(400).json({ 
        error: 'Некорректный формат данных',
        details: 'Проверьте корректность введенных данных'
      });
    }
    
    res.status(500).json({ 
      error: 'Ошибка сервера при создании клуба',
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// ГЛАВНЫЙ РОУТ: Удаление клуба с использованием функции из модели
router.delete('/clubs/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log(`Запрос на удаление клуба с ID: ${id}`);
    
    // Используем функцию из модели клуба
    const result = await deleteClub(id);
    
    console.log('Результат удаления клуба:', result);
    
    res.json({ 
      message: 'Клуб успешно удален со всеми связанными данными', 
      deletedClub: result.deletedClub,
      deletedData: result.deletedData
    });
    
  } catch (error) {
    console.error('Ошибка удаления клуба в admin.js:', error);
    
    if (error.message === 'Клуб не найден') {
      res.status(404).json({ error: 'Клуб не найден' });
    } else {
      res.status(500).json({ 
        error: 'Ошибка при удалении клуба',
        details: error.message 
      });
    }
  }
});

// Удаление пользователя
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Проверяем существование пользователя
    const userResult = await client.query(
      'SELECT id, first_name, last_name, email FROM users WHERE id = $1', 
      [id]
    );
    
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const user = userResult.rows[0];
    
    // Проверяем, не является ли пользователь владельцем клубов
    const clubsResult = await client.query(
      'SELECT id, name FROM clubs WHERE owner_id = $1', 
      [id]
    );
    
    if (clubsResult.rows.length > 0) {
      await client.query('ROLLBACK');
      const clubNames = clubsResult.rows.map(club => club.name).join(', ');
      return res.status(400).json({ 
        error: `Невозможно удалить пользователя. Он является владельцем клубов: ${clubNames}. Сначала удалите клубы или назначьте другого владельца.`
      });
    }
    
    // Удаляем связанные данные пользователя
    await client.query('DELETE FROM bookings WHERE user_id = $1', [id]);
    
    // Удаляем отзывы, если таблица существует
    try {
      await client.query('DELETE FROM reviews WHERE user_id = $1', [id]);
    } catch (error) {
      console.log('Таблица reviews не найдена, пропускаем');
    }
    
    // Удаляем Telegram уведомления, если такая таблица существует
    try {
      await client.query('DELETE FROM club_owner_telegram WHERE owner_id = $1', [id]);
    } catch (error) {
      console.log('Таблица club_owner_telegram не найдена, пропускаем');
    }
    
    // Удаляем пользователя
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    res.json({ 
      message: 'Пользователь успешно удален',
      deletedUser: {
        id: user.id,
        full_name: `${user.first_name} ${user.last_name || ''}`.trim(),
        email: user.email
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка удаления пользователя:', error);
    res.status(500).json({ 
      error: 'Ошибка при удалении пользователя',
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// Создание нового пользователя админом
router.post('/users', async (req, res) => {
  console.log('📝 Создание пользователя админом:', req.body);
  
  const { first_name, last_name, email, phone, password, role = 'client' } = req.body;
  
  // Валидация обязательных полей
  const requiredFields = {
    'Имя': first_name,
    'Фамилия': last_name,
    'Email': email,
    'Пароль': password
  };
  
  const missingFields = [];
  for (const [fieldName, value] of Object.entries(requiredFields)) {
    if (!value || value.trim() === '') {
      missingFields.push(fieldName);
    }
  }
  
  if (missingFields.length > 0) {
    console.log('Отсутствуют обязательные поля:', missingFields);
    return res.status(400).json({ 
      error: `Отсутствуют обязательные поля: ${missingFields.join(', ')}`,
      missingFields: missingFields
    });
  }
  
  try {
    // Проверяем, не существует ли пользователь с таким email
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, password) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, first_name, last_name, email, phone, created_at`,
      [first_name.trim(), last_name.trim(), email.trim(), phone ? phone.trim() : null, hashedPassword]
    );
    
    const newUser = result.rows[0];
    
    console.log(`✅ Создан пользователь: ${newUser.first_name} ${newUser.last_name} (${newUser.email})`);
    
    res.status(201).json({
      success: true,
      message: 'Пользователь успешно создан',
      user: {
        ...newUser,
        full_name: `${newUser.first_name} ${newUser.last_name || ''}`.trim(),
        role: role
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка создания пользователя:', error);
    
    // Обработка специфичных ошибок PostgreSQL
    if (error.code === '23505') { // duplicate key error
      if (error.detail.includes('email')) {
        return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
      }
    }
    
    res.status(500).json({ 
      error: 'Ошибка сервера при создании пользователя',
      details: error.message 
    });
  }
});

// Получение информации о владельцах клубов
router.get('/owners', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at,
             COUNT(c.id) as clubs_count
      FROM users u
      INNER JOIN clubs c ON u.id = c.owner_id
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at
      ORDER BY u.created_at DESC
    `);
    
    const owners = result.rows.map(owner => ({
      ...owner,
      full_name: `${owner.first_name} ${owner.last_name || ''}`.trim(),
      role: 'owner',
      clubs_count: parseInt(owner.clubs_count)
    }));
    
    res.json(owners);
  } catch (error) {
    console.error('Ошибка получения владельцев:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение информации о конкретном пользователе
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.phone, 
        u.balance, u.created_at, u.profile_image,
        u.is_club_owner, u.is_admin
      FROM users u
      WHERE u.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const user = result.rows[0];
    res.json({
      ...user,
      full_name: `${user.first_name} ${user.last_name || ''}`.trim()
    });
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление данных пользователя
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, balance, is_club_owner, is_admin } = req.body;
    
    console.log('📝 Обновление пользователя:', { id, data: req.body });
    
    // Проверяем существование пользователя
    const checkUser = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Проверяем уникальность email (если изменился)
    if (email && email !== checkUser.rows[0].email) {
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
      }
    }
    
    // Обновляем данные
    const result = await pool.query(`
      UPDATE users 
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        balance = COALESCE($5, balance),
        is_club_owner = COALESCE($6, is_club_owner),
        is_admin = COALESCE($7, is_admin)
      WHERE id = $8
      RETURNING *
    `, [first_name, last_name, email, phone, balance, is_club_owner, is_admin, id]);
    
    const updatedUser = result.rows[0];
    
    res.json({
      success: true,
      message: 'Данные пользователя успешно обновлены',
      user: {
        ...updatedUser,
        full_name: `${updatedUser.first_name} ${updatedUser.last_name || ''}`.trim()
      }
    });
  } catch (error) {
    console.error('❌ Ошибка обновления пользователя:', error);
    res.status(500).json({ 
      error: 'Ошибка сервера при обновлении пользователя',
      details: error.message 
    });
  }
});

// Смена пароля пользователя администратором
router.put('/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    console.log('🔐 Смена пароля для пользователя:', id);
    
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
    }
    
    // Проверяем существование пользователя
    const checkUser = await pool.query('SELECT id, first_name, last_name FROM users WHERE id = $1', [id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Обновляем пароль
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
    
    const user = checkUser.rows[0];
    
    res.json({
      success: true,
      message: `Пароль для пользователя ${user.first_name} ${user.last_name} успешно изменен`
    });
  } catch (error) {
    console.error('❌ Ошибка смены пароля:', error);
    res.status(500).json({ 
      error: 'Ошибка сервера при смене пароля',
      details: error.message 
    });
  }
});

module.exports = router;