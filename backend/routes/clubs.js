const express = require('express');
const router = express.Router();
const upload = require('../middleware/fileUpload');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken'); 
const { 
  getAllClubs, 
  getClubById, 
  createClub, 
  updateClub, 
  getClubsByOwnerId,
  getClubBalance,
  getClubWithStats,
  deleteClubLogo,      // Добавляем функцию для удаления логотипа
  deleteClubBanner,    // Добавляем функцию для удаления шапки
  deleteClubGalleryImage // Добавляем функцию для удаления изображения из галереи
} = require('../models/clubModel');
const { getClassesByClubId } = require('../models/scheduleModel');
const { getClubBookings } = require('../models/bookingModel');
const db = require('../db');
const auth = require('../middleware/auth');

// Получение списка всех клубов
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filters = { category, search };
    
    const clubs = await getAllClubs(filters);
    
    // Убедимся, что все необходимые поля присутствуют в каждом клубе
    const processedClubs = clubs.map(club => ({
      ...club,
      logo_url: club.logo_url || null,
      banner_url: club.banner_url || null,
      images: club.images || []
    }));
    
    res.json(processedClubs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при загрузке клубов' });
  }
});

// Получение информации о конкретном клубе
router.get('/:id', async (req, res) => {
  try {
    const clubId = req.params.id;
    const club = await getClubById(clubId);
    
    if (!club) {
      return res.status(404).json({ error: 'Клуб не найден' });
    }
    
    // Проверка, является ли запрашивающий пользователь владельцем
    let isOwner = false;
    
    // Проверяем токен если он есть
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        isOwner = decoded.userId === club.owner_id;
      } catch (err) {
        // Токен недействительный, продолжаем как неавторизованный
        console.warn('Недействительный токен при запросе клуба:', err.message);
      }
    }
    
    // Для владельца возвращаем полную информацию
    if (isOwner) {
      // Убедимся, что все необходимые поля присутствуют
      res.json({
        ...club,
        logo_url: club.logo_url || null,
        banner_url: club.banner_url || null,
        images: club.images || []
      });
    } else {
      // Для обычного посетителя скрываем конфиденциальную информацию
      const publicClub = {
        id: club.id,
        name: club.name,
        address: club.address,
        category: club.category,
        description: club.description,
        rating: club.rating,
        contact_phone: club.contact_phone,
        contact_email: club.contact_email,
        website: club.website,
        amenities: club.amenities || [],
        images: club.images || [],
        logo_url: club.logo_url || null, // Добавляем логотип
        banner_url: club.banner_url || null // Добавляем шапку
      };
      res.json(publicClub);
    }
  } catch (err) {
    console.error('Ошибка при загрузке информации о клубе:', err);
    res.status(500).json({ error: 'Ошибка при загрузке информации о клубе' });
  }
});

// Получение расписания клуба
router.get('/:id/schedule', async (req, res) => {
  try {
    const clubId = req.params.id;
    const schedule = await getClassesByClubId(clubId);
    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при загрузке расписания клуба' });
  }
});

// Создание нового клуба (только для авторизованных пользователей)
router.post('/', auth, async (req, res) => {
  try {
    const club = await createClub(req.body, req.userId);
    res.status(201).json(club);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании клуба' });
  }
});

// Обновление данных клуба (только для владельцев)
router.put('/:id', auth, async (req, res) => {
  try {
    const clubId = req.params.id;
    const updatedClub = await updateClub(clubId, req.body, req.userId);
    res.json(updatedClub);
  } catch (err) {
    console.error(err);
    if (err.message === 'У вас нет прав на редактирование этого клуба') {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: 'Ошибка при обновлении данных клуба' });
  }
});

// Получение клубов текущего пользователя (для владельцев)
router.get('/owner/my', auth, async (req, res) => {
  try {
    const clubs = await getClubsByOwnerId(req.userId);
    res.json(clubs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при загрузке ваших клубов' });
  }
});

// Получение баланса клуба (только для владельца)
router.get('/:id/balance', auth, async (req, res) => {
  try {
    const clubId = req.params.id;
    
    // Проверяем, что пользователь является владельцем клуба
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === clubId);
    
    if (!isOwner) {
      return res.status(403).json({ error: 'У вас нет прав на просмотр баланса этого клуба' });
    }
    
    const balanceInfo = await getClubBalance(clubId);
    res.json(balanceInfo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при загрузке баланса клуба' });
  }
});

// Получение статистики клуба
router.get('/:id/statistics', auth, async (req, res) => {
  try {
    const clubId = req.params.id;
    
    // Проверка прав доступа: пользователь должен быть владельцем клуба
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === clubId);
    
    if (!isOwner) {
      return res.status(403).json({ error: 'У вас нет прав для просмотра статистики этого клуба' });
    }
    
    // Получаем данные о бронированиях
    const bookings = await getClubBookings(clubId);
    
    // Получаем данные о расписании
    const schedule = await getClassesByClubId(clubId);
    
    // Считаем статистику
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const completedBookings = bookings.filter(b => b.status === 'completed');
    
    const stats = {
      totalVisits: completedBookings.length,
      weeklyVisits: completedBookings.filter(b => new Date(b.created_at) >= weekAgo).length,
      todayVisits: completedBookings.filter(b => new Date(b.created_at) >= today).length,
      activeClasses: schedule.length
    };
    
    res.json(stats);
  } catch (err) {
    console.error('Ошибка при получении статистики клуба:', err);
    res.status(500).json({ error: 'Ошибка при загрузке статистики клуба' });
  }
});

// Получение списка бронирований клуба (только для владельца)
router.get('/:id/bookings', auth, async (req, res) => {
  try {
    const clubId = req.params.id;
    
    // Проверяем, что пользователь является владельцем клуба
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === clubId);
    
    if (!isOwner) {
      return res.status(403).json({ error: 'У вас нет прав на просмотр бронирований этого клуба' });
    }
    
    const bookings = await getClubBookings(clubId);
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при загрузке бронирований клуба' });
  }
});

// Маршрут для загрузки логотипа клуба
router.post('/:id/logo', auth, upload.single('logo'), async (req, res) => {
  try {
    const clubId = req.params.id;
    
    // Проверка прав владельца
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === clubId);
    
    if (!isOwner) {
      // Если загружен файл, но нет прав - удаляем его
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ error: 'У вас нет прав для обновления этого клуба' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не был загружен' });
    }
    
    // Получаем только имя файла из пути
    const filename = path.basename(req.file.path);
    
    // Формируем URL для доступа к файлу - относительный путь
    const logo_url = `/uploads/${filename}`;
    
    // Обновляем запись в БД
    const updatedClub = await updateClub(clubId, { logo_url }, req.userId);
    
    res.json({ 
      success: true, 
      logo_url: updatedClub.logo_url 
    });
  } catch (err) {
    console.error('Ошибка при загрузке логотипа:', err);
    res.status(500).json({ error: 'Ошибка при загрузке логотипа' });
  }
});

// Маршрут для удаления логотипа клуба
router.delete('/:id/logo', auth, async (req, res) => {
  try {
    const clubId = req.params.id;
    
    // Удаляем логотип через модель
    await deleteClubLogo(clubId, req.userId);
    
    res.json({ 
      success: true,
      message: 'Логотип успешно удален'
    });
  } catch (err) {
    console.error('Ошибка при удалении логотипа:', err);
    
    // Возвращаем соответствующий код ошибки в зависимости от типа ошибки
    if (err.message === 'У вас нет прав на редактирование этого клуба') {
      return res.status(403).json({ error: err.message });
    }
    
    res.status(500).json({ error: 'Ошибка при удалении логотипа' });
  }
});

// Маршрут для загрузки шапки клуба
router.post('/:id/banner', auth, upload.single('banner'), async (req, res) => {
  try {
    const clubId = req.params.id;
    
    // Проверка прав владельца
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === clubId);
    
    if (!isOwner) {
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ error: 'У вас нет прав для обновления этого клуба' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не был загружен' });
    }
    
    // Получаем имя файла
    const filename = path.basename(req.file.path);
    
    // Формируем URL для доступа к файлу - относительный путь
    const banner_url = `/uploads/${filename}`;
    
    // Обновляем запись в БД
    const updatedClub = await updateClub(clubId, { banner_url }, req.userId);
    
    res.json({ 
      success: true, 
      banner_url: updatedClub.banner_url 
    });
  } catch (err) {
    console.error('Ошибка при загрузке шапки:', err);
    res.status(500).json({ error: 'Ошибка при загрузке шапки' });
  }
});

// Маршрут для удаления шапки клуба
router.delete('/:id/banner', auth, async (req, res) => {
  try {
    const clubId = req.params.id;
    
    // Удаляем шапку через модель
    await deleteClubBanner(clubId, req.userId);
    
    res.json({ 
      success: true,
      message: 'Шапка успешно удалена'
    });
  } catch (err) {
    console.error('Ошибка при удалении шапки:', err);
    
    if (err.message === 'У вас нет прав на редактирование этого клуба') {
      return res.status(403).json({ error: err.message });
    }
    
    res.status(500).json({ error: 'Ошибка при удалении шапки' });
  }
});

// Маршрут для загрузки изображений в галерею
router.post('/:id/gallery', auth, upload.array('gallery', 10), async (req, res) => {
  try {
    const clubId = req.params.id;
    
    // Проверка прав владельца
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === clubId);
    
    if (!isOwner) {
      // Удаляем загруженные файлы при отсутствии прав
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
      return res.status(403).json({ error: 'У вас нет прав для обновления этого клуба' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Файлы не были загружены' });
    }
    
    // Получаем текущий клуб и его изображения
    const club = await getClubById(clubId);
    const currentImages = club.images || [];
    
    // Добавляем новые изображения с относительными URL
    const newImageUrls = req.files.map(file => {
      const filename = path.basename(file.path);
      return `/uploads/${filename}`;
    });
    
    // Обновляем массив изображений
    const images = [...currentImages, ...newImageUrls];
    
    // Обновляем запись в БД
    const updatedClub = await updateClub(clubId, { images }, req.userId);
    
    res.json({ 
      success: true, 
      images: updatedClub.images 
    });
  } catch (err) {
    console.error('Ошибка при загрузке изображений:', err);
    res.status(500).json({ error: 'Ошибка при загрузке изображений' });
  }
});

// Маршрут для удаления изображения из галереи
router.delete('/:id/gallery/:imageIndex', auth, async (req, res) => {
  try {
    const clubId = req.params.id;
    const imageIndex = parseInt(req.params.imageIndex);
    
    // Используем новую функцию для удаления изображения из галереи
    const updatedClub = await deleteClubGalleryImage(clubId, imageIndex, req.userId);
    
    res.json({ 
      success: true, 
      images: updatedClub.images 
    });
  } catch (err) {
    console.error('Ошибка при удалении изображения:', err);
    
    if (err.message === 'У вас нет прав на редактирование этого клуба') {
      return res.status(403).json({ error: err.message });
    }
    if (err.message === 'Указанное изображение не найдено') {
      return res.status(400).json({ error: err.message });
    }
    
    res.status(500).json({ error: 'Ошибка при удалении изображения' });
  }
});

// Маршрут для регистрации заявки на создание клуба
router.post('/register-request', async (req, res) => {
  try {
    const {
      club_name,
      address,
      category,
      description,
      contact_name,
      contact_email,
      contact_phone,
      website,
      message
    } = req.body;
    
    // Проверка обязательных полей
    if (!club_name || !address || !category || !contact_name || !contact_email) {
      return res.status(400).json({ 
        error: 'Необходимо указать название клуба, адрес, категорию, имя и email контактного лица' 
      });
    }
    
    // Создаем заявку
    const result = await db.query(
      `INSERT INTO club_requests 
       (club_name, address, category, description, contact_name, contact_email, contact_phone, website, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [club_name, address, category, description, contact_name, contact_email, contact_phone, website, message]
    );
    
    const request = result.rows[0];
    
    res.status(201).json({
      message: 'Ваша заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
      request_id: request.id
    });
  } catch (err) {
    console.error('Ошибка при создании заявки на регистрацию клуба:', err);
    res.status(500).json({ error: 'Ошибка при отправке заявки' });
  }
});

// Получение детальной информации о клубе с статистикой (для владельцев)
router.get('/:id/dashboard', auth, async (req, res) => {
  try {
    const clubId = req.params.id;
    
    // Проверяем, что пользователь является владельцем клуба
    const club = await getClubById(clubId);
    
    if (!club) {
      return res.status(404).json({ error: 'Клуб не найден' });
    }
    
    if (club.owner_id !== req.userId) {
      return res.status(403).json({ error: 'У вас нет прав на просмотр данных этого клуба' });
    }
    
    // Получаем полную информацию о клубе с статистикой
    const clubWithStats = await getClubWithStats(clubId);
    
    res.json(clubWithStats);
  } catch (err) {
    console.error('Ошибка при получении данных о клубе:', err);
    res.status(500).json({ error: 'Ошибка при загрузке информации о клубе' });
  }
});

module.exports = router;