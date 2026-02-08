// backend/routes/classTemplates.js
const express = require('express');
const router = express.Router();
const { 
  getAllTemplates, 
  getTemplateById, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate 
} = require('../models/classTemplateModel');
const { getClubsByOwnerId } = require('../models/clubModel');
const auth = require('../middleware/auth');

// Получение всех шаблонов клуба
router.get('/club/:clubId', auth, async (req, res) => {
  try {
    const clubId = req.params.clubId;
    
    // Проверяем, что пользователь является владельцем клуба
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === clubId.toString());
    
    if (!isOwner) {
      return res.status(403).json({ error: 'У вас нет прав на просмотр шаблонов этого клуба' });
    }
    
    const templates = await getAllTemplates(clubId);
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при загрузке шаблонов занятий' });
  }
});

// Получение конкретного шаблона
router.get('/:id', auth, async (req, res) => {
  try {
    const templateId = req.params.id;
    const template = await getTemplateById(templateId);
    
    if (!template) {
      return res.status(404).json({ error: 'Шаблон не найден' });
    }
    
    // Проверяем, что пользователь является владельцем клуба
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === template.club_id.toString());
    
    if (!isOwner) {
      return res.status(403).json({ error: 'У вас нет прав на просмотр этого шаблона' });
    }
    
    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при загрузке шаблона занятия' });
  }
});

// Создание нового шаблона
router.post('/', auth, async (req, res) => {
  try {
    const { club_id } = req.body;
    
    // Проверяем, что пользователь является владельцем клуба
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === club_id.toString());
    
    if (!isOwner) {
      return res.status(403).json({ error: 'У вас нет прав на создание шаблонов для этого клуба' });
    }
    
    const newTemplate = await createTemplate(req.body);
    res.status(201).json(newTemplate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании шаблона занятия' });
  }
});

// Обновление шаблона
router.put('/:id', auth, async (req, res) => {
  try {
    const templateId = req.params.id;
    const template = await getTemplateById(templateId);
    
    if (!template) {
      return res.status(404).json({ error: 'Шаблон не найден' });
    }
    
    // Проверяем, что пользователь является владельцем клуба
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === template.club_id.toString());
    
    if (!isOwner) {
      return res.status(403).json({ error: 'У вас нет прав на редактирование этого шаблона' });
    }
    
    const updatedTemplate = await updateTemplate(templateId, req.body);
    res.json(updatedTemplate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при обновлении шаблона занятия' });
  }
});

// Удаление шаблона
router.delete('/:id', auth, async (req, res) => {
  try {
    const templateId = req.params.id;
    const template = await getTemplateById(templateId);
    
    if (!template) {
      return res.status(404).json({ error: 'Шаблон не найден' });
    }
    
    // Проверяем, что пользователь является владельцем клуба
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === template.club_id.toString());
    
    if (!isOwner) {
      return res.status(403).json({ error: 'У вас нет прав на удаление этого шаблона' });
    }
    
    await deleteTemplate(templateId);
    res.json({ message: 'Шаблон успешно удален' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при удалении шаблона занятия' });
  }
});

module.exports = router;