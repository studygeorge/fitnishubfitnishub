#!/bin/bash

# Автоматический скрипт деплоя FitnesHub
# Использование: ./deploy.sh [branch_name]
# По умолчанию: development

set -e

BRANCH="${1:-development}"
PROJECT_DIR="/home/fitneshub"
BACKUP_DIR="/home/fitneshub/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🚀 ===== ДЕПЛОЙ FITNESHUB ====="
echo "📅 Время: $(date)"
echo "🌿 Ветка: $BRANCH"
echo "================================"
echo ""

# Переход в директорию проекта
cd "$PROJECT_DIR"

# 1. Создание полного бекапа проекта
echo "📦 1/8: Создание бекапа проекта..."
mkdir -p "$BACKUP_DIR/code"
BACKUP_CODE="$BACKUP_DIR/code/fitneshub_${TIMESTAMP}.tar.gz"
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='uploads' \
    --exclude='logs' \
    --exclude='backups' \
    -czf "$BACKUP_CODE" -C "$PROJECT_DIR" .
echo "✅ Бекап кода создан: $BACKUP_CODE"

# 2. Создание бекапа базы данных
echo ""
echo "💾 2/8: Создание бекапа базы данных..."
bash "$PROJECT_DIR/scripts/backup-db.sh"

# 3. Сохранение текущего коммита
CURRENT_COMMIT=$(git rev-parse HEAD)
echo ""
echo "📌 3/8: Текущий коммит: $CURRENT_COMMIT"
echo "$CURRENT_COMMIT" > "$BACKUP_DIR/last_commit.txt"

# 4. Получение обновлений из Git
echo ""
echo "🔄 4/8: Получение обновлений из Git..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"
echo "✅ Код обновлен до последней версии ветки $BRANCH"

# 5. Установка зависимостей Backend
echo ""
echo "📦 5/8: Установка зависимостей Backend..."
cd "$PROJECT_DIR/backend"
npm install --production
echo "✅ Зависимости Backend установлены"

# 6. Сборка Frontend
echo ""
echo "🏗️  6/8: Сборка Frontend..."
cd "$PROJECT_DIR/frontend"
npm install
npm run build
echo "✅ Frontend собран"

# 7. Перезапуск Backend через PM2
echo ""
echo "🔄 7/8: Перезапуск Backend..."
cd "$PROJECT_DIR/backend"

# Проверка наличия процесса в PM2
if pm2 list | grep -q "fitneshub-backend"; then
  echo "♻️  Перезапуск существующего процесса..."
  pm2 restart fitneshub-backend
else
  echo "▶️  Запуск нового процесса..."
  pm2 start ecosystem.config.js
fi

pm2 save
echo "✅ Backend перезапущен"

# 8. Проверка работоспособности
echo ""
echo "🔍 8/8: Проверка работоспособности..."
sleep 3

# Проверка статуса PM2
if pm2 list | grep -q "fitneshub-backend.*online"; then
  echo "✅ Backend работает"
else
  echo "❌ Backend не запущен! Проверьте логи: pm2 logs fitneshub-backend"
  exit 1
fi

# Проверка API
if curl -f -s http://localhost:5000/api/health > /dev/null; then
  echo "✅ API отвечает"
else
  echo "⚠️  API не отвечает, но процесс запущен. Проверьте логи."
fi

echo ""
echo "================================"
echo "✅ ДЕПЛОЙ ЗАВЕРШЕН УСПЕШНО!"
echo "================================"
echo ""
echo "📋 Информация:"
echo "   Ветка: $BRANCH"
echo "   Коммит: $(git rev-parse HEAD)"
echo "   Бекап кода: $BACKUP_CODE"
echo "   Бекапы БД: $BACKUP_DIR/db/"
echo ""
echo "📚 Полезные команды:"
echo "   Логи: pm2 logs fitneshub-backend"
echo "   Статус: pm2 status"
echo "   Откат: bash $PROJECT_DIR/scripts/rollback.sh"
echo ""

exit 0
