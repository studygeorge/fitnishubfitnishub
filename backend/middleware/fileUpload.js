const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Конфигурация хранения файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Изменяем путь на frontend/build/uploads
    const uploadDir = path.join(__dirname, '../../frontend/build/uploads');
    
    // Проверка существования директории
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Сохраняем оригинальное расширение файла
    const fileExt = path.extname(file.originalname);
    cb(null, `${uuidv4()}${fileExt}`);
  }
});

// Фильтрация файлов по типу
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Загружать можно только изображения'), false);
  }
};

// Создаем middleware для загрузки
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB максимальный размер файла
  }
});

module.exports = upload;