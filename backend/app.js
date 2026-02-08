const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer'); // ДОБАВЛЕНО

require('dotenv').config();

const app = express();

// Расширенная настройка CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'http://fitneshub.ru' : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ДОБАВЛЕНО: Увеличиваем лимиты для JSON и URL-encoded данных
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ДОБАВЛЕНО: Настройка multer для загрузки файлов
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    fieldSize: 50 * 1024 * 1024 // 50MB для полей формы
  },
  fileFilter: (req, file, cb) => {
    // Поддерживаемые форматы изображений
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
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый формат файла'), false);
    }
  }
});

// ДОБАВЛЕНО: Middleware для обработки ошибок multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: 'Файл слишком большой. Максимальный размер: 50MB' 
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: 'Неожиданное поле файла' 
      });
    }
  }
  next(error);
});

// Настраиваем доступ к статическим файлам из директории uploads
app.use(express.static(path.join(__dirname, '../frontend/build')));

// ИСПРАВЛЕНО: Раздача статических файлов для аватаров пользователей и клубов
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Импортируем маршруты
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const clubRoutes = require('./routes/clubs');
const userRoutes = require('./routes/users');
const scheduleRoutes = require('./routes/schedule');
const bookingRoutes = require('./routes/bookings');
const balanceRoutes = require('./routes/balance');
const classTemplatesRoutes = require('./routes/classTemplates');
const uploadsRoutes = require('./routes/uploads');
const telegramRoutes = require('./routes/telegram');

// ДОБАВЛЕНО: Передаем multer в роуты как middleware
app.locals.upload = upload;

// Устанавливаем маршруты API
app.use('/api/telegram', telegramRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/users', userRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/templates', classTemplatesRoutes);

// Инициализация Telegram бота (безопасная инициализация)
let telegramBot = null;
try {
  telegramBot = require('./services/telegramBot');
  console.log('✅ Telegram бот инициализирован');
} catch (error) {
  console.warn('⚠️ Telegram бот не может быть инициализирован:', error.message);
  console.warn('⚠️ Проверьте TELEGRAM_BOT_TOKEN в файле .env');
}

// Тестовый API роут для проверки
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    telegram: telegramBot ? 'активен' : 'неактивен'
  });
});

// Обработка 404 для API запросов
app.use('/api', (req, res, next) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// SPA обработчик - МАКСИМАЛЬНО ПРОСТАЯ ВЕРСИЯ
app.use((req, res) => {
  const indexPath = path.join(__dirname, '../frontend/build/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Ошибка отправки index.html:', err);
      res.status(500).send('Error loading page');
    }
  });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  
  // Детализированная обработка различных типов ошибок
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Файл слишком большой. Максимум: 50MB' });
  }
  
  if (err.message === 'Неподдерживаемый формат файла') {
    return res.status(400).json({ error: 'Неподдерживаемый формат файла. Поддерживаются: JPG, PNG, GIF, WebP, BMP, TIFF, SVG' });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Ошибка валидации данных' });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Неавторизованный доступ' });
  }
  
  // Общая обработка ошибок
  res.status(500).json({ 
    error: 'Произошла ошибка на сервере',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// Graceful shutdown обработчик
process.on('SIGTERM', () => {
  console.log('💤 Получен сигнал SIGTERM, завершаю работу сервера...');
  
  if (telegramBot) {
    try {
      if (typeof telegramBot.stopPolling === 'function') {
        telegramBot.stopPolling();
      }
      console.log('✅ Telegram бот остановлен');
    } catch (error) {
      console.error('❌ Ошибка при остановке Telegram бота:', error);
    }
  }
  
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('💤 Получен сигнал SIGINT, завершаю работу сервера...');
  
  if (telegramBot) {
    try {
      if (typeof telegramBot.stopPolling === 'function') {
        telegramBot.stopPolling();
      }
      console.log('✅ Telegram бот остановлен');
    } catch (error) {
      console.error('❌ Ошибка при остановке Telegram бота:', error);
    }
  }
  
  process.exit(0);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend запущен на порту ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 Telegram Bot: ${telegramBot ? 'активен' : 'неактивен'}`);
  
  // Показываем статус подключения к БД
  const { testConnection } = require('./db');
  testConnection().then(isConnected => {
    console.log(`🗄️ База данных: ${isConnected ? 'подключена' : 'не подключена'}`);
  }).catch(err => {
    console.error('❌ Ошибка проверки БД:', err.message);
  });
});

// Экспортируем app для тестирования
module.exports = app;