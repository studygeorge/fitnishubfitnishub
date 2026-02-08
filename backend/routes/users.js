const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  updateUser, 
  findUserById, 
  uploadUserAvatar, 
  deleteUserAvatar, 
  getUserAvatar,
  validateAllUserAvatars
} = require('../models/userModel');
const auth = require('../middleware/auth');

// ОБНОВЛЕННАЯ настройка multer для загрузки файлов с увеличенными лимитами
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // УВЕЛИЧЕНО до 50MB
    fieldSize: 50 * 1024 * 1024, // 50MB для полей формы
    files: 1, // максимум 1 файл
    fields: 10 // максимум 10 полей формы
  },
  fileFilter: (req, file, cb) => {
    // Расширенная проверка MIME-типов для поддержки ВСЕХ форматов изображений
    const allowedMimes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/webp', 
      'image/bmp', 
      'image/tiff',
      'image/tif',
      'image/svg+xml',
      'image/x-icon',
      'image/vnd.microsoft.icon'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      // Дополнительная проверка расширения файла
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.svg', '.ico'];
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error('Недопустимое расширение файла. Разрешены: jpg, jpeg, png, gif, webp, bmp, tiff, svg, ico'), false);
      }
    } else {
      cb(new Error(`Неподдерживаемый тип файла: ${file.mimetype}. Поддерживаются только изображения.`), false);
    }
  }
});

// Middleware для обработки ошибок multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(413).json({ 
          error: 'Файл слишком большой. Максимальный размер: 50MB',
          maxSize: '50MB',
          receivedSize: req.file ? `${(req.file.size / 1024 / 1024).toFixed(2)}MB` : 'неизвестно'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ error: 'Слишком много файлов. Максимум: 1 файл' });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ error: 'Неожиданное поле файла' });
      case 'LIMIT_FIELD_KEY':
        return res.status(400).json({ error: 'Имя поля слишком длинное' });
      case 'LIMIT_FIELD_VALUE':
        return res.status(400).json({ error: 'Значение поля слишком длинное' });
      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({ error: 'Слишком много полей' });
      default:
        return res.status(400).json({ error: `Ошибка загрузки файла: ${error.message}` });
    }
  }
  
  if (error.message.includes('Недопустимое расширение') || 
      error.message.includes('Неподдерживаемый тип файла') ||
      error.message.includes('Поддерживаются только изображения')) {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
};

// Получить профиль текущего пользователя
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Ошибка получения профиля:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить профиль пользователя
router.put('/profile', auth, async (req, res) => {
  try {
    const { first_name, last_name, phone, preferences, profile_image } = req.body;
    
    const updatedUser = await updateUser(req.userId, {
      first_name,
      last_name,
      phone,
      preferences,
      profile_image
    });
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(updatedUser);
  } catch (err) {
    console.error('Ошибка обновления профиля:', err);
    res.status(500).json({ error: 'Ошибка при обновлении профиля' });
  }
});

// Обновить предпочтения пользователя
router.put('/preferences', auth, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (!Array.isArray(preferences)) {
      return res.status(400).json({ error: 'Предпочтения должны быть массивом' });
    }
    
    const updatedUser = await updateUser(req.userId, { preferences });
    
    res.json({ preferences: updatedUser.preferences });
  } catch (err) {
    console.error('Ошибка обновления предпочтений:', err);
    res.status(500).json({ error: 'Ошибка при обновлении предпочтений' });
  }
});

// ОБНОВЛЕННЫЕ МАРШРУТЫ ДЛЯ РАБОТЫ С АВАТАРАМИ

// Маршрут для загрузки аватара пользователя
router.post('/upload-avatar', auth, (req, res) => {
  upload.single('avatar')(req, res, async (error) => {
    // Обработка ошибок multer
    if (error) {
      return handleMulterError(error, req, res, () => {
        console.error('Неизвестная ошибка multer:', error);
        res.status(500).json({ error: 'Неизвестная ошибка при загрузке файла' });
      });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: 'Файл не предоставлен',
          hint: 'Убедитесь, что поле называется "avatar" и содержит файл изображения'
        });
      }

      console.log(`Получен файл для загрузки:`, {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`,
        userId: req.userId
      });

      const userId = req.userId;
      const result = await uploadUserAvatar(userId, req.file);
      
      console.log(`Аватар успешно загружен для пользователя ${userId}:`, result.imagePath);
      
      res.status(200).json({
        success: true,
        message: result.message,
        profile_image: result.imagePath,
        fileName: result.fileName,
        fileSize: result.fileSize,
        mimeType: result.mimeType
      });
      
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      
      // Детальная обработка различных типов ошибок
      if (error.message.includes('Пользователь не найден')) {
        return res.status(404).json({ error: error.message });
      }
      
      if (error.message.includes('слишком большой') || error.message.includes('Максимальный размер')) {
        return res.status(413).json({ error: error.message });
      }
      
      if (error.message.includes('Неподдерживаемый формат') || 
          error.message.includes('Недопустимое расширение')) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ 
        error: 'Внутренняя ошибка сервера при загрузке аватара',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
});

// Маршрут для удаления аватара пользователя
router.delete('/delete-avatar', auth, async (req, res) => {
  try {
    const userId = req.userId;
    console.log(`Удаление аватара для пользователя ${userId}`);
    
    const result = await deleteUserAvatar(userId);
    
    console.log(`Аватар успешно удален для пользователя ${userId}`);
    res.status(200).json({ 
      success: true,
      message: result.message 
    });
    
  } catch (error) {
    console.error('Ошибка удаления аватара:', error);
    
    if (error.message.includes('Пользователь не найден')) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('нет аватара для удаления')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера при удалении аватара',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Маршрут для получения аватара пользователя
router.get('/avatar', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const result = await getUserAvatar(userId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Ошибка получения аватара:', error);
    
    if (error.message.includes('Пользователь не найден')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера при получении аватара',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Маршрут для получения аватара другого пользователя (публичный)
router.get('/avatar/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Неверный ID пользователя' });
    }
    
    const result = await getUserAvatar(parseInt(userId));
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Ошибка получения аватара пользователя:', error);
    
    if (error.message.includes('Пользователь не найден')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера при получении аватара',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ДОПОЛНИТЕЛЬНЫЙ маршрут для проверки состояния аватаров (для администратора)
router.get('/validate-avatars', auth, async (req, res) => {
  try {
    // Проверяем, является ли пользователь администратором (если нужно)
    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const validation = await validateAllUserAvatars();
    
    res.status(200).json({
      message: 'Проверка аватаров завершена',
      ...validation
    });
  } catch (error) {
    console.error('Ошибка валидации аватаров:', error);
    res.status(500).json({ 
      error: 'Ошибка при проверке аватаров',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Тестовый маршрут для проверки лимитов загрузки
router.get('/upload-limits', (req, res) => {
  res.json({
    maxFileSize: '50MB',
    maxFileSizeByte: 50 * 1024 * 1024,
    supportedFormats: ['JPG', 'JPEG', 'PNG', 'GIF', 'WebP', 'BMP', 'TIFF', 'SVG', 'ICO'],
    supportedMimeTypes: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'image/webp', 'image/bmp', 'image/tiff', 'image/tif',
      'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'
    ]
  });
});

module.exports = router;