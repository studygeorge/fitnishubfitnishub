const fs = require('fs');
const path = require('path');

const uploadsPath = path.join(__dirname, '../build/uploads');
const backupPath = path.join(__dirname, '../uploads-backup');

// Создаем бэкап папки uploads если она существует
if (fs.existsSync(uploadsPath)) {
  console.log('Создаем бэкап папки uploads...');
  
  // Удаляем старый бэкап если существует
  if (fs.existsSync(backupPath)) {
    fs.rmSync(backupPath, { recursive: true, force: true });
  }
  
  // Копируем папку uploads в бэкап (включая все подпапки и файлы)
  fs.cpSync(uploadsPath, backupPath, { recursive: true });
  
  // Проверяем, что папка users скопировалась
  const usersBackupPath = path.join(backupPath, 'users');
  if (fs.existsSync(usersBackupPath)) {
    const userFiles = fs.readdirSync(usersBackupPath);
    console.log(`Бэкап создан успешно. Сохранено ${userFiles.length} файлов аватарок пользователей`);
  } else {
    console.log('Бэкап создан успешно (папка users пуста)');
  }
} else {
  console.log('Папка uploads не найдена, бэкап не требуется');
}