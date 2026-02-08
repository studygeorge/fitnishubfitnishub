// scripts/migrate.js
const path = require('path');
const dotenv = require('dotenv');
const { exec } = require('child_process');

// Загружаем переменные окружения
dotenv.config();

// Формируем строку подключения
const connectionString = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Определяем команду миграции
const command = process.argv[2] || 'up'; // по умолчанию "up"
const migrationName = process.argv[3]; // имя миграции для create

// Формируем полную команду
let migrationCommand;
if (command === 'create' && migrationName) {
  migrationCommand = `DATABASE_URL="${connectionString}" npx node-pg-migrate create ${migrationName}`;
} else {
  migrationCommand = `DATABASE_URL="${connectionString}" npx node-pg-migrate ${command}`;
}

console.log(`Запуск команды: ${migrationCommand}`);
console.log(`Подключение к БД: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

// Запускаем команду миграции
exec(migrationCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Ошибка выполнения: ${error.message}`);
    return;
  }
  
  if (stderr && !stderr.includes('NOTICE')) {
    console.error(`⚠️ stderr: ${stderr}`);
  }
  
  console.log(`✅ Результат:`);
  console.log(stdout);
});