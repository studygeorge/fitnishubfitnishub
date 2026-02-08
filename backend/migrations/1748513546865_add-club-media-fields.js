/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Создаем таблицу для хранения Telegram данных владельцев клубов
  pgm.createTable('club_owner_telegram', {
    id: 'id',
    owner_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    telegram_chat_id: {
      type: 'text',
      notNull: true,
      unique: true
    },
    verification_code: {
      type: 'text',
      notNull: false
    },
    is_active: {
      type: 'boolean',
      default: true
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Создаем уникальный индекс для owner_id
  pgm.createIndex('club_owner_telegram', 'owner_id', { unique: true });
  
  // Создаем индексы для быстрого поиска
  pgm.createIndex('club_owner_telegram', 'telegram_chat_id');
  pgm.createIndex('club_owner_telegram', 'verification_code');
  
  // Добавляем комментарии к таблице
  pgm.sql(`
    COMMENT ON TABLE club_owner_telegram IS 'Таблица для хранения Telegram данных владельцев клубов';
    COMMENT ON COLUMN club_owner_telegram.owner_id IS 'ID владельца клуба из таблицы users';
    COMMENT ON COLUMN club_owner_telegram.telegram_chat_id IS 'Telegram Chat ID пользователя';
    COMMENT ON COLUMN club_owner_telegram.verification_code IS 'Код верификации для подключения Telegram';
    COMMENT ON COLUMN club_owner_telegram.is_active IS 'Активно ли подключение к Telegram';
  `);
};

exports.down = pgm => {
  // Удаляем таблицу при откате миграции
  pgm.dropTable('club_owner_telegram');
};