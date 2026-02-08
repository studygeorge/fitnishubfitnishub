const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  try {
    // Получаем токен из заголовка
    const authHeader = req.header('Authorization');
    
    // Проверяем наличие токена
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Доступ запрещен. Отсутствует токен авторизации' });
    }
    
    const token = authHeader.substring(7);
    
    try {
      // Верифицируем токен
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Добавляем идентификатор пользователя в объект запроса
      req.userId = decoded.userId;
      
      // Если в токене есть user, добавляем его в запрос
      if (decoded.user) {
        req.user = decoded.user;
      }
      
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Токен истек. Пожалуйста, войдите снова.' });
      }
      res.status(401).json({ error: 'Недействительный токен' });
    }
  } catch (err) {
    console.error('Ошибка в middleware auth:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};
