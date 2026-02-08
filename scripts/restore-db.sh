#!/bin/bash

# Скрипт для восстановления базы данных из резервной копии
# Использование: ./restore-db.sh [путь_к_бекапу]
# Пример: ./restore-db.sh /home/fitneshub/backups/db/fitneshub_20240208_120000.sql.gz

set -e

# Загрузка переменных окружения
if [ -f /home/fitneshub/backend/.env ]; then
  export $(cat /home/fitneshub/backend/.env | grep -v '^#' | xargs)
fi

BACKUP_DIR="/home/fitneshub/backups/db"

# Проверка аргументов
if [ -z "$1" ]; then
  echo "📋 Доступные резервные копии:"
  ls -lh "$BACKUP_DIR"/fitneshub_*.sql.gz 2>/dev/null | awk '{print NR". " $9, "(" $5 ")"}'
  echo ""
  echo "⚠️  Использование: $0 [номер_бекапа_или_путь]"
  echo "Пример: $0 1"
  echo "Пример: $0 /home/fitneshub/backups/db/fitneshub_20240208_120000.sql.gz"
  exit 1
fi

# Определение файла бекапа
if [ -f "$1" ]; then
  BACKUP_FILE="$1"
elif [[ "$1" =~ ^[0-9]+$ ]]; then
  BACKUP_FILE=$(ls -t "$BACKUP_DIR"/fitneshub_*.sql.gz 2>/dev/null | sed -n "${1}p")
  if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Бекап с номером $1 не найден!"
    exit 1
  fi
else
  echo "❌ Файл не найден: $1"
  exit 1
fi

echo "⚠️  ВНИМАНИЕ: Текущая база данных будет полностью заменена!"
echo "📁 Файл бекапа: $BACKUP_FILE"
echo ""
read -p "Продолжить? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Отменено пользователем"
  exit 1
fi

# Создание бекапа текущей БД перед восстановлением
echo "🔄 Создание резервной копии текущей БД..."
SAFETY_BACKUP="/home/fitneshub/backups/db/safety_backup_$(date +"%Y%m%d_%H%M%S").sql.gz"
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -F c | gzip > "$SAFETY_BACKUP"
echo "✅ Создан страховочный бекап: $SAFETY_BACKUP"

echo "🔄 Восстановление базы данных..."

# Остановка всех подключений к БД
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" 2>/dev/null || true

# Удаление и пересоздание БД
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d postgres \
  -c "DROP DATABASE IF EXISTS $DB_NAME;"

PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d postgres \
  -c "CREATE DATABASE $DB_NAME;"

# Восстановление из бекапа
gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" pg_restore \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-privileges

echo "✅ База данных успешно восстановлена!"
echo "📍 Страховочный бекап сохранен: $SAFETY_BACKUP"
echo ""
echo "🔄 Для отката используйте: $0 $SAFETY_BACKUP"

exit 0
