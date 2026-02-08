#!/bin/bash

# Скрипт отката к предыдущей версии
# Использование: ./rollback.sh

set -e

PROJECT_DIR="/home/fitneshub"
BACKUP_DIR="/home/fitneshub/backups"

echo "🔙 ===== ОТКАТ FITNESHUB ====="
echo "📅 Время: $(date)"
echo "================================"
echo ""

cd "$PROJECT_DIR"

# Проверка наличия последнего коммита
if [ ! -f "$BACKUP_DIR/last_commit.txt" ]; then
  echo "❌ Файл последнего коммита не найден!"
  echo "Невозможно выполнить откат."
  exit 1
fi

LAST_COMMIT=$(cat "$BACKUP_DIR/last_commit.txt")
CURRENT_COMMIT=$(git rev-parse HEAD)

echo "📌 Текущий коммит: $CURRENT_COMMIT"
echo "📌 Предыдущий коммит: $LAST_COMMIT"
echo ""

if [ "$LAST_COMMIT" == "$CURRENT_COMMIT" ]; then
  echo "⚠️  Текущий и предыдущий коммиты совпадают!"
  echo "Откат не требуется."
  exit 0
fi

read -p "⚠️  Выполнить откат? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "❌ Откат отменен"
  exit 1
fi

# 1. Создание бекапа текущего состояния
echo "📦 1/5: Создание страховочного бекапа..."
SAFETY_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
bash "$PROJECT_DIR/scripts/backup-db.sh"

# 2. Откат кода к предыдущему коммиту
echo ""
echo "🔄 2/5: Откат кода к предыдущему коммиту..."
git checkout "$LAST_COMMIT"
echo "✅ Код откачен к коммиту $LAST_COMMIT"

# 3. Установка зависимостей Backend
echo ""
echo "📦 3/5: Установка зависимостей Backend..."
cd "$PROJECT_DIR/backend"
npm install --production
echo "✅ Зависимости Backend установлены"

# 4. Сборка Frontend
echo ""
echo "🏗️  4/5: Сборка Frontend..."
cd "$PROJECT_DIR/frontend"
npm install
npm run build
echo "✅ Frontend собран"

# 5. Перезапуск Backend
echo ""
echo "🔄 5/5: Перезапуск Backend..."
cd "$PROJECT_DIR/backend"
pm2 restart fitneshub-backend
pm2 save
echo "✅ Backend перезапущен"

echo ""
echo "================================"
echo "✅ ОТКАТ ЗАВЕРШЕН УСПЕШНО!"
echo "================================"
echo ""
echo "📋 Восстановлен коммит: $LAST_COMMIT"
echo ""
echo "⚠️  Если нужно откатить базу данных:"
echo "   bash $PROJECT_DIR/scripts/restore-db.sh"
echo ""

exit 0
