# FitnesHub - Платформа бронирования фитнес-клубов

## 📋 Описание проекта

FitnesHub - это веб-платформа для бронирования занятий в фитнес-клубах. Система предоставляет пользователям удобный интерфейс для поиска клубов, просмотра расписания занятий и бронирования тренировок. Владельцы клубов получают полноценный кабинет для управления расписанием, бронированиями и финансами.

## 🏗️ Архитектура

**Технологический стек:**
- **Backend**: Node.js + Express.js 5.1.0
- **Frontend**: React 19.1.0 + React Router 6.30.0
- **База данных**: PostgreSQL
- **Стилизация**: Tailwind CSS 3.3.0
- **Процесс-менеджер**: PM2
- **Платежи**: Alfabank, PayKeeper
- **Уведомления**: Telegram Bot API

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+ и npm
- PostgreSQL 12+
- PM2 (глобально установлен)
- Git

### Установка на сервер

```bash
# 1. Клонирование репозитория
cd /home
git clone git@github.com:studygeorge/fitnishubfitnishub.git fitneshub
cd fitneshub

# 2. Настройка Backend
cd backend
cp .env.example .env
# Отредактируйте .env и укажите параметры БД
nano .env

# 3. Установка зависимостей Backend
npm install --production

# 4. Настройка Frontend
cd ../frontend
cp .env.example .env
# Отредактируйте .env и укажите API URL
nano .env

# 5. Сборка Frontend
npm install
npm run build

# 6. Инициализация БД (автоматически при первом запуске)
# База данных создается автоматически при запуске backend

# 7. Запуск Backend через PM2
cd ../backend
pm2 start ecosystem.config.js
pm2 save

# 8. Настройка автозапуска PM2
pm2 startup
```

### Быстрый деплой (одна команда)

После первой установки используйте автоматический деплой:

```bash
# Установка алиасов
cat /home/fitneshub/scripts/bash-aliases.sh >> ~/.bashrc
source ~/.bashrc

# Теперь деплой одной командой:
fh-deploy
```

## 🔧 Конфигурация

### Backend (.env)

```env
# Backend Configuration
NODE_ENV=production
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fitneshub
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key

# Admin
ADMIN_USERNAME=admin@fitneshub.ru
ADMIN_PASSWORD=admin123

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Payments
ALFABANK_USERNAME=your_alfabank_username
ALFABANK_PASSWORD=your_alfabank_password
ALFABANK_RETURN_URL=https://fitneshub.ru/balance/payment-result
ALFABANK_API_URL=https://web.rbsuat.com/ab

PAYKEEPER_SERVER=https://your-shop.server.paykeeper.ru
PAYKEEPER_SECRET=your_paykeeper_secret
```

### Frontend (.env)

```env
REACT_APP_API_URL=https://fitneshub.ru/api
REACT_APP_UPLOADS_URL=https://fitneshub.ru/uploads
```

## 📦 Структура базы данных

**Таблицы:**
- `users` - Пользователи системы
- `clubs` - Фитнес-клубы
- `class_templates` - Шаблоны занятий
- `schedule` - Расписание занятий
- `bookings` - Бронирования
- `transactions` - Транзакции пользователей
- `payments` - Платежи (Alfabank)
- `club_requests` - Заявки на добавление клубов
- `club_owner_telegram` - Telegram владельцев клубов
- `user_telegram` - Telegram пользователей

## 🔄 Workflow разработки

### Ветки Git

- `main` - Production ветка (стабильная версия)
- `development` - Development ветка (активная разработка)

### Процесс деплоя

1. **Разработка в ветке development:**
   ```bash
   git checkout development
   # Вносите изменения
   git add .
   git commit -m "Описание изменений"
   git push origin development
   ```

2. **Деплой на сервер:**
   ```bash
   # На сервере одна команда:
   fh-deploy
   # или явно указать ветку:
   fh-deploy-dev
   ```

3. **Проверка и тестирование**

4. **Мерж в main после подтверждения:**
   ```bash
   git checkout main
   git merge development
   git push origin main
   
   # Деплой production:
   fh-deploy-main
   ```

## 🛠️ Скрипты автоматизации

### Основные команды

```bash
# ДЕПЛОЙ
fh-deploy           # Деплой development ветки (одна команда!)
fh-deploy-dev       # Деплой development ветки
fh-deploy-main      # Деплой main ветки
fh-rollback         # Откат к предыдущей версии

# БАЗА ДАННЫХ
fh-backup           # Создать бекап БД
fh-restore          # Восстановить БД из бекапа
fh-backups          # Список бекапов БД

# СЕРВИСЫ
fh-logs             # Просмотр логов
fh-status           # Статус сервиса
fh-restart          # Перезапуск сервиса
fh-health           # Проверка API

# СПРАВКА
fh-help             # Показать справку по всем командам
```

### Что делает скрипт деплоя:

1. ✅ Создает полный бекап проекта (код)
2. ✅ Создает бекап базы данных (автоматически)
3. ✅ Сохраняет текущий коммит для отката
4. ✅ Подтягивает последние изменения из Git
5. ✅ Устанавливает зависимости Backend
6. ✅ Собирает Frontend (production build)
7. ✅ Перезапускает Backend через PM2
8. ✅ Проверяет работоспособность API

**Важно:** База данных НИКОГДА не удаляется! Только создаются бекапы перед каждым деплоем.

### Система бекапов

**Автоматические бекапы:**
- Создаются перед каждым деплоем
- Хранятся последние 10 бекапов БД
- Бекапы кода сохраняются без ограничений

**Пути к бекапам:**
- БД: `/home/fitneshub/backups/db/fitneshub_YYYYMMDD_HHMMSS.sql.gz`
- Код: `/home/fitneshub/backups/code/fitneshub_YYYYMMDD_HHMMSS.tar.gz`

**Восстановление:**
```bash
# Просмотр доступных бекапов
fh-restore

# Восстановление по номеру
fh-restore 1

# Или по полному пути
fh-restore /home/fitneshub/backups/db/fitneshub_20240208_120000.sql.gz
```

### Откат к предыдущей версии

```bash
# Откат кода к предыдущему коммиту
fh-rollback

# Если нужно откатить и БД:
fh-restore 1  # выберите нужный бекап
```

## 🔐 Система безопасности

**Роли пользователей:**
- **Обычный пользователь** - бронирование, профиль, баланс
- **Владелец клуба** - управление клубом, расписанием, финансами
- **Администратор** - полный доступ ко всей системе

**Аутентификация:**
- JWT токены для API
- Защищенные маршруты на Frontend
- Middleware для проверки прав доступа

## 📡 API Endpoints

### Публичные
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/clubs` - Список клубов
- `GET /api/clubs/:id` - Детали клуба
- `GET /api/schedule` - Расписание занятий

### Защищенные (требуют авторизации)
- `GET /api/users/profile` - Профиль пользователя
- `POST /api/bookings` - Создание бронирования
- `GET /api/bookings` - Список бронирований
- `POST /api/balance/deposit` - Пополнение баланса
- `GET /api/balance/transactions` - История транзакций

### Для владельцев клубов
- `GET /api/clubs/owner/dashboard` - Дашборд клуба
- `POST /api/schedule` - Создание занятия
- `GET /api/bookings/club/:clubId` - Бронирования клуба
- `PUT /api/clubs/:id` - Обновление клуба

### Администраторские
- `GET /api/admin/dashboard` - Админ дашборд
- `GET /api/admin/users` - Управление пользователями
- `GET /api/admin/clubs` - Управление клубами
- `POST /api/admin/clubs/approve/:id` - Одобрение клуба

## 🐛 Отладка и логи

```bash
# Просмотр логов Backend
fh-logs

# Просмотр логов в реальном времени
fh-logs-live

# Статус сервиса
fh-status

# Детальные логи PM2
pm2 logs fitneshub-backend --lines 100

# Логи по датам
pm2 logs --timestamp

# Очистка логов
fh-clear-logs
```

## 📊 Мониторинг

```bash
# Статус всех процессов PM2
pm2 list

# Мониторинг ресурсов
pm2 monit

# Проверка здоровья API
fh-health
curl http://localhost:5000/api/health
```

## 🔧 Полезные команды

```bash
# Обновление зависимостей
cd /home/fitneshub/backend && npm update
cd /home/fitneshub/frontend && npm update

# Проверка безопасности зависимостей
npm audit
npm audit fix

# Очистка node_modules и переустановка
rm -rf node_modules package-lock.json
npm install

# Очистка кеша npm
npm cache clean --force
```

## 🚨 Решение проблем

### Backend не запускается

```bash
# 1. Проверьте логи
fh-logs

# 2. Проверьте соединение с БД
psql -h localhost -U postgres -d fitneshub

# 3. Проверьте переменные окружения
cat /home/fitneshub/backend/.env

# 4. Перезапустите сервис
fh-restart
```

### API не отвечает

```bash
# 1. Проверьте статус
fh-status

# 2. Проверьте порт
netstat -tulpn | grep 5000

# 3. Проверьте health endpoint
curl http://localhost:5000/api/health
```

### Ошибка при деплое

```bash
# 1. Откатитесь к предыдущей версии
fh-rollback

# 2. Проверьте логи
fh-logs

# 3. Попробуйте снова
fh-deploy
```

## 📚 Дополнительная информация

### Структура проекта

```
fitnishub/
├── backend/                 # Node.js Backend
│   ├── app.js              # Основной сервер
│   ├── db/                 # Подключение к БД
│   ├── models/             # Модели данных
│   ├── routes/             # API роуты
│   ├── middleware/         # Middleware
│   ├── services/           # Сервисы (Telegram, платежи)
│   ├── migrations/         # Миграции БД
│   └── uploads/            # Загруженные файлы
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── pages/         # Страницы
│   │   ├── components/    # Компоненты
│   │   ├── club/          # Кабинет клуба
│   │   ├── contexts/      # React Context
│   │   └── services/      # API клиенты
│   └── build/             # Production build
├── scripts/               # Скрипты автоматизации
│   ├── deploy.sh         # Автоматический деплой
│   ├── rollback.sh       # Откат версии
│   ├── backup-db.sh      # Бекап БД
│   └── restore-db.sh     # Восстановление БД
└── backups/              # Бекапы (создается автоматически)
    ├── db/               # Бекапы базы данных
    └── code/             # Бекапы кода
```

## 👥 Контакты

- **Репозиторий**: https://github.com/studygeorge/fitnishubfitnishub
- **Домен**: https://fitneshub.ru (production)

## 📄 Лицензия

Proprietary - все права защищены.

---

**Последнее обновление**: 08.02.2026

**Версия**: 1.0.0
