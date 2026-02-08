#!/bin/bash

# Скрипт для создания резервной копии базы данных PostgreSQL
# Использование: ./backup-db.sh

set -e

# Загрузка переменных окружения
if [ -f /home/fitneshub/backend/.env ]; then
  export $(cat /home/fitneshub/backend/.env | grep -v '^#' | xargs)
fi

# Настройки
BACKUP_DIR="/home/fitneshub/backups/db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/fitneshub_${TIMESTAMP}.sql"
KEEP_BACKUPS=10

# Создание директории для бекапов
mkdir -p "$BACKUP_DIR"

echo "🔄 Создание резервной копии базы данных..."
echo "📁 Файл: $BACKUP_FILE"

# Создание бекапа
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -F c \
  -f "$BACKUP_FILE"

# Сжатие бекапа
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

if [ -f "$BACKUP_FILE" ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✅ Резервная копия создана успешно!"
  echo "📦 Размер: $SIZE"
  echo "📍 Путь: $BACKUP_FILE"
else
  echo "❌ Ошибка создания резервной копии!"
  exit 1
fi

# Удаление старых бекапов (оставляем только последние N)
echo "🧹 Очистка старых резервных копий..."
cd "$BACKUP_DIR"
ls -t fitneshub_*.sql.gz | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm
echo "✅ Оставлено последних резервных копий: $KEEP_BACKUPS"

# Список доступных бекапов
echo ""
echo "📋 Доступные резервные копии:"
ls -lh "$BACKUP_DIR"/fitneshub_*.sql.gz 2>/dev/null | awk '{print $9, "(" $5 ")"}'

exit 0
