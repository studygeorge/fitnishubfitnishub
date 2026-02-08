# FitnesHub - Bash Aliases для удобного управления

# Добавьте эти строки в файл ~/.bashrc на вашем сервере
# Затем выполните: source ~/.bashrc

# === ОСНОВНЫЕ КОМАНДЫ ДЕПЛОЯ ===

# Деплой из ветки development (по умолчанию)
alias fh-deploy='bash /home/fitneshub/scripts/deploy.sh'

# Деплой из ветки development (явно)
alias fh-deploy-dev='bash /home/fitneshub/scripts/deploy.sh development'

# Деплой из ветки main
alias fh-deploy-main='bash /home/fitneshub/scripts/deploy.sh main'

# Откат к предыдущей версии
alias fh-rollback='bash /home/fitneshub/scripts/rollback.sh'

# === УПРАВЛЕНИЕ БАЗОЙ ДАННЫХ ===

# Создать бекап БД
alias fh-backup='bash /home/fitneshub/scripts/backup-db.sh'

# Восстановить БД из бекапа
alias fh-restore='bash /home/fitneshub/scripts/restore-db.sh'

# === УПРАВЛЕНИЕ СЕРВИСАМИ ===

# Просмотр логов (без блокировки)
alias fh-logs='pm2 logs fitneshub-backend --nostream'

# Просмотр логов в реальном времени
alias fh-logs-live='pm2 logs fitneshub-backend'

# Статус сервиса
alias fh-status='pm2 status fitneshub-backend'

# Перезапуск сервиса
alias fh-restart='pm2 restart fitneshub-backend'

# Остановка сервиса
alias fh-stop='pm2 stop fitneshub-backend'

# Запуск сервиса
alias fh-start='pm2 start fitneshub-backend'

# === НАВИГАЦИЯ ===

# Перейти в директорию проекта
alias fh-cd='cd /home/fitneshub'

# Перейти в директорию backend
alias fh-backend='cd /home/fitneshub/backend'

# Перейти в директорию frontend
alias fh-frontend='cd /home/fitneshub/frontend'

# === GIT КОМАНДЫ ===

# Статус Git
alias fh-git-status='cd /home/fitneshub && git status'

# Текущая ветка
alias fh-git-branch='cd /home/fitneshub && git branch --show-current'

# Последние коммиты
alias fh-git-log='cd /home/fitneshub && git log --oneline -10'

# === ПОЛЕЗНЫЕ КОМАНДЫ ===

# Список бекапов БД
alias fh-backups='ls -lh /home/fitneshub/backups/db/'

# Список бекапов кода
alias fh-backups-code='ls -lh /home/fitneshub/backups/code/'

# Проверка здоровья API
alias fh-health='curl -s http://localhost:5000/api/health | jq'

# Очистка логов PM2
alias fh-clear-logs='pm2 flush'

# === БЫСТРАЯ СПРАВКА ===

# Показать справку по командам
alias fh-help='cat << EOF
🚀 FitnesHub - Команды управления

ДЕПЛОЙ:
  fh-deploy           - Деплой development ветки (одна команда!)
  fh-deploy-dev       - Деплой development ветки
  fh-deploy-main      - Деплой main ветки
  fh-rollback         - Откат к предыдущей версии

БАЗА ДАННЫХ:
  fh-backup           - Создать бекап БД
  fh-restore          - Восстановить БД из бекапа
  fh-backups          - Список бекапов БД

СЕРВИСЫ:
  fh-logs             - Просмотр логов
  fh-status           - Статус сервиса
  fh-restart          - Перезапуск сервиса
  fh-health           - Проверка API

НАВИГАЦИЯ:
  fh-cd               - Перейти в проект
  fh-backend          - Перейти в backend
  fh-frontend         - Перейти в frontend

GIT:
  fh-git-status       - Статус Git
  fh-git-branch       - Текущая ветка
  fh-git-log          - История коммитов

СПРАВКА:
  fh-help             - Показать эту справку
EOF'
