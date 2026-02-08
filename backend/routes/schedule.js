const express = require('express');
const router = express.Router();
const { 
  getAllClasses, 
  getClassById, 
  addClass, 
  updateClass, 
  deleteClass,
  createClassFromTemplate,  // Добавьте эту функцию в импорт
  createSeriesFromTemplate  // Добавьте эту функцию в импорт
} = require('../models/scheduleModel');
const { getTemplateById } = require('../models/classTemplateModel'); // Добавьте этот импорт
const { getClubsByOwnerId } = require('../models/clubModel');
const auth = require('../middleware/auth');

// Получение списка всех занятий с фильтрами
router.get('/', async (req, res) => {
  try {
    const { clubId, date, category } = req.query;
    const filters = { clubId, date, category };
    
    const classes = await getAllClasses(filters);
    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при загрузке расписания' });
  }
});

// Получение информации о конкретном занятии
router.get('/:id', async (req, res) => {
  try {
    const classId = req.params.id;
    const classInfo = await getClassById(classId);
    
    if (!classInfo) {
      return res.status(404).json({ error: 'Занятие не найдено' });
    }
    
    res.json(classInfo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при загрузке информации о занятии' });
  }
});

// Добавление нового занятия (только для владельцев клубов)
router.post('/', auth, async (req, res) => {
  try {
    const { club_id } = req.body;
    
    // Проверяем, что пользователь является владельцем клуба
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === club_id.toString());
    
    if (!isOwner) {
      return res.status(403).json({ error: 'У вас нет прав на добавление занятий в этот клуб' });
    }
    
    const newClass = await addClass(req.body);
    res.status(201).json(newClass);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при добавлении занятия' });
  }
});

// Обновление информации о занятии (только для владельцев)
router.put('/:id', auth, async (req, res) => {
  try {
    const classId = req.params.id;
    
    // Получаем информацию о занятии для проверки клуба
    const classInfo = await getClassById(classId);
    if (!classInfo) {
      return res.status(404).json({ error: 'Занятие не найдено' });
    }
    
    // Проверяем, что пользователь является владельцем клуба
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === classInfo.club_id.toString());
    
    if (!isOwner) {
      return res.status(403).json({ error: 'У вас нет прав на редактирование занятий этого клуба' });
    }
    
    const updatedClass = await updateClass(classId, req.body);
    res.json(updatedClass);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при обновлении информации о занятии' });
  }
});

// Создание занятия из шаблона
router.post('/from-template', auth, async (req, res) => {
  try {
    const { template_id, date, start_time } = req.body;
    
    if (!template_id || !date || !start_time) {
      return res.status(400).json({ error: 'Требуются template_id, date и start_time' });
    }
    
    // Получаем информацию о шаблоне
    const template = await getTemplateById(template_id);
    if (!template) {
      return res.status(404).json({ error: 'Шаблон не найден' });
    }
    
    // Проверяем, что пользователь является владельцем клуба
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === template.club_id.toString());
    
    if (!isOwner) {
      return res.status(403).json({ error: 'У вас нет прав на создание занятий для этого клуба' });
    }
    
    // Создаем занятие из шаблона
    const newClass = await createClassFromTemplate(template_id, date, start_time);
    res.status(201).json(newClass);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании занятия из шаблона' });
  }
});

// Создание серии занятий из шаблона
router.post('/create-series', auth, async (req, res) => {
  try {
    const { template_id, start_date, end_date, days_of_week, start_time } = req.body;
    
    if (!template_id || !start_date || !end_date || !days_of_week || !start_time || !Array.isArray(days_of_week)) {
      return res.status(400).json({ 
        error: 'Требуются template_id, start_date, end_date, days_of_week (массив) и start_time' 
      });
    }
    
    // Получаем информацию о шаблоне
    const template = await getTemplateById(template_id);
    if (!template) {
      return res.status(404).json({ error: 'Шаблон не найден' });
    }
    
    // Проверяем, что пользователь является владельцем клуба
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === template.club_id.toString());
    
    if (!isOwner) {
      return res.status(403).json({ error: 'У вас нет прав на создание занятий для этого клуба' });
    }
    
    // Создаем серию занятий
    const createdClasses = await createSeriesFromTemplate(
      template_id,
      start_date,
      end_date,
      days_of_week,
      start_time
    );
    
    res.status(201).json({
      message: `Создано ${createdClasses.length} занятий`,
      classes: createdClasses
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании серии занятий' });
  }
});

// Удаление занятия (только для владельцев)
router.delete('/:id', auth, async (req, res) => {
  try {
    const classId = req.params.id;
    
    // Получаем информацию о занятии для проверки клуба
    const classInfo = await getClassById(classId);
    if (!classInfo) {
      return res.status(404).json({ error: 'Занятие не найдено' });
    }
    
    // Проверяем, что пользователь является владельцем клуба
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === classInfo.club_id.toString());
    
    if (!isOwner) {
      return res.status(403).json({ error: 'У вас нет прав на удаление занятий этого клуба' });
    }
    
    await deleteClass(classId);
    res.json({ message: 'Занятие успешно удалено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при удалении занятия' });
  }
});

module.exports = router;
