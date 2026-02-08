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
      
      // Проверяем, является ли пользователь администратором
      if (!decoded.isAdmin) {
        return res.status(403).json({ error: 'У вас нет прав администратора' });
      }
      
      // Добавляем информацию в объект запроса
      req.admin = {
        username: decoded.username,
        isAdmin: decoded.isAdmin
      };
      
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Токен истек. Пожалуйста, войдите снова.' });
      }
      res.status(401).json({ error: 'Недействительный токен администратора' });
    }
  } catch (err) {
    console.error('Ошибка в middleware adminAuth:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};