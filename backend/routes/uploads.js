const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Эндпоинт для получения изображений
router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Проверяем существование файла
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Файл не найден');
  }
});

module.exports = router;