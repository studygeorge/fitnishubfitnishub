/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // 1. Добавляем поля Telegram в таблицу users (только новые)
  pgm.addColumn('users', {
    telegram_id: {
      type: 'bigint',
      unique: true
    },
    telegram_username: {
      type: 'varchar(255)'
    },
    telegram_linked_at: {
      type: 'timestamp'
    }
  }, { ifNotExists: true });

  // 2. Создаем таблицу для кодов верификации пользователей
  pgm.createTable('user_telegram_codes', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    code: {
      type: 'varchar(10)',
      notNull: true,
      unique: true
    },
    expires_at: {
      type: 'timestamp',
      notNull: true
    },
    used: {
      type: 'boolean',
      default: false
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('CURRENT_TIMESTAMP')
    }
  });

  // 3. Создаем индексы
  pgm.createIndex('users', 'telegram_id', { ifNotExists: true });
  pgm.createIndex('user_telegram_codes', ['code'], { ifNotExists: true });
  pgm.createIndex('user_telegram_codes', ['user_id'], { ifNotExists: true });
  pgm.createIndex('user_telegram_codes', ['expires_at'], { ifNotExists: true });

  // 4. Добавляем поле amount_paid в bookings (если его нет)
  pgm.addColumn('bookings', {
    amount_paid: {
      type: 'decimal(10,2)',
      default: 0
    }
  }, { ifNotExists: true });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Откат в обратном порядке
  pgm.dropColumn('bookings', ['amount_paid'], { ifExists: true });
  
  pgm.dropIndex('user_telegram_codes', ['expires_at'], { ifExists: true });
  pgm.dropIndex('user_telegram_codes', ['user_id'], { ifExists: true });
  pgm.dropIndex('user_telegram_codes', ['code'], { ifExists: true });
  pgm.dropIndex('users', ['telegram_id'], { ifExists: true });
  
  pgm.dropTable('user_telegram_codes', { ifExists: true });
  
  pgm.dropColumn('users', ['telegram_id', 'telegram_username', 'telegram_linked_at'], { ifExists: true });
};
