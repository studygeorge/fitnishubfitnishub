const fs = require('fs');
const path = require('path');

const uploadsPath = path.join(__dirname, '../build/uploads');
const backupPath = path.join(__dirname, '../uploads-backup');

// Восстанавливаем папку uploads из бэкапа
if (fs.existsSync(backupPath)) {
  console.log('Восстанавливаем папку uploads из бэкапа...');
  
  // Создаем папку uploads если не существует
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  
  // Копируем файлы из бэкапа (включая все подпапки)
  fs.cpSync(backupPath, uploadsPath, { recursive: true });
  
  // Проверяем восстановление папки users
  const usersPath = path.join(uploadsPath, 'users');
  if (fs.existsSync(usersPath)) {
    const userFiles = fs.readdirSync(usersPath);
    console.log(`Папка uploads восстановлена успешно. Восстановлено ${userFiles.length} файлов аватарок пользователей`);
  } else {
    console.log('Папка uploads восстановлена успешно (папка users пуста)');
  }
  
  // Удаляем временный бэкап
  fs.rmSync(backupPath, { recursive: true, force: true });
  console.log('Временный бэкап удален');
} else {
  console.log('Бэкап не найден, восстановление не требуется');
}