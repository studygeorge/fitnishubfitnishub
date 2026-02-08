module.exports = {
  apps: [{
    name: 'fitneshub-backend',
    script: './app.js',
    cwd: '/home/fitneshub/backend',
    instances: 1,
    exec_mode: 'fork',
    
    // Автоматический перезапуск
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    
    // Политика перезапуска при сбоях
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Переменные окружения
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    
    // Логирование
    error_file: '/home/fitneshub/backend/logs/pm2-error.log',
    out_file: '/home/fitneshub/backend/logs/pm2-out.log',
    log_file: '/home/fitneshub/backend/logs/pm2-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Обработка исключений
    kill_timeout: 5000,
    listen_timeout: 3000,
    shutdown_with_message: true,
    
    // Exponential backoff restart delay
    exp_backoff_restart_delay: 100,
    
    // Запуск после краша
    stop_exit_codes: [0],
    
    // Дополнительные настройки для стабильности
    wait_ready: false,
    increment_var: 'PORT',
    combine_logs: true,
    
    // Мониторинг
    pmx: true,
    automation: false,
    
    // Обработка сигналов
    kill_retry_time: 100
  }]
};