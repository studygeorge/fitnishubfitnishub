const { Pool } = require('pg');
require('dotenv').config();

console.log('Настройки подключения к БД:');
console.log('Host:', process.env.DB_HOST);
console.log('Database:', process.env.DB_NAME);
console.log('User:', process.env.DB_USER);
console.log('Port:', process.env.DB_PORT);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// ФЛАГ ДЛЯ ПРЕДОТВРАЩЕНИЯ ПОВТОРНОЙ ИНИЦИАЛИЗАЦИИ
let isInitialized = false;
let isInitializing = false;

pool.on('connect', () => {
  console.log('✅ Подключение к PostgreSQL успешно установлено');
});

pool.on('error', (err) => {
  console.error('❌ Ошибка в пуле соединений PostgreSQL:', err);
});

async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Тест подключения к базе данных успешен');
    return true;
  } catch (err) {
    console.error('❌ Тест подключения к базе данных не удался:', err);
    return false;
  } finally {
    if (client) client.release();
  }
}

async function initDB() {
  // ПРЕДОТВРАЩАЕМ ПОВТОРНЫЙ ЗАПУСК
  if (isInitialized) {
    console.log('⚠️ База данных уже инициализирована, пропускаем');
    return;
  }
  
  if (isInitializing) {
    console.log('⚠️ Инициализация базы данных уже выполняется, ожидаем...');
    return;
  }
  
  isInitializing = true;
  
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Не удалось подключиться к базе данных');
    }
    
    console.log('🚀 Начинаем инициализацию базы данных...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        preferences TEXT[],
        profile_image TEXT,
        balance DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_admin BOOLEAN DEFAULT FALSE,
        is_club_owner BOOLEAN DEFAULT FALSE,
        telegram_id TEXT,
        telegram_username TEXT
      );
    `);
    console.log('✓ Таблица users создана или уже существует');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clubs (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        rating DECIMAL(2, 1) DEFAULT 5.0,
        owner_id INTEGER REFERENCES users(id),
        contact_phone TEXT,
        contact_email TEXT,
        website TEXT,
        amenities TEXT[],
        opening_hours JSONB,
        images TEXT[],
        logo_url TEXT,
        banner_url TEXT,
        balance DECIMAL(10, 2) DEFAULT 0,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Таблица clubs создана или уже существует');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS class_templates (
        id SERIAL PRIMARY KEY,
        club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
        template_name TEXT NOT NULL,
        class_name TEXT NOT NULL,
        duration INTEGER NOT NULL,
        trainer TEXT NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 10,
        price DECIMAL(10, 2) NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        color VARCHAR(20) DEFAULT '#F8A284',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_class_templates_club_id ON class_templates(club_id);
    `);
    console.log('✓ Таблица class_templates создана или уже существует');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS schedule (
        id SERIAL PRIMARY KEY,
        club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
        class_name TEXT NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        trainer TEXT,
        capacity INTEGER NOT NULL,
        booked INTEGER DEFAULT 0,
        price DECIMAL(10, 2) NOT NULL,
        category TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_schedule_club_id ON schedule(club_id);
      CREATE INDEX IF NOT EXISTS idx_schedule_start_time ON schedule(start_time);
    `);
    console.log('✓ Таблица schedule создана или уже существует');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        schedule_id INTEGER REFERENCES schedule(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, schedule_id)
      );
      CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_schedule_id ON bookings(schedule_id);
    `);
    console.log('✓ Таблица bookings создана или уже существует');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
        type TEXT NOT NULL CHECK (type IN ('deposit', 'payment', 'withdrawal', 'refund')),
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        payment_method TEXT,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_club_id ON transactions(club_id);
    `);
    console.log('✓ Таблица transactions создана или уже существует');

    // ТАБЛИЦА ПЛАТЕЖЕЙ ALFABANK
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method TEXT DEFAULT 'alfabank',
        order_id TEXT UNIQUE NOT NULL,
        alfabank_order_id TEXT,
        alfabank_form_url TEXT,
        client_email TEXT,
        client_phone TEXT,
        description TEXT DEFAULT 'Пополнение баланса FitnesHub',
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
        payment_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
      CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
      CREATE INDEX IF NOT EXISTS idx_payments_alfabank_order_id ON payments(alfabank_order_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    `);
    console.log('✓ Таблица payments создана или уже существует');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS club_requests (
        id SERIAL PRIMARY KEY,
        club_name TEXT NOT NULL,
        address TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        contact_name TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        contact_phone TEXT,
        website TEXT,
        message TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Таблица club_requests создана или уже существует');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS club_owner_telegram (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        telegram_chat_id TEXT NOT NULL,
        verification_code TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(owner_id),
        UNIQUE(telegram_chat_id)
      );
      CREATE INDEX IF NOT EXISTS idx_club_owner_telegram_owner_id ON club_owner_telegram(owner_id);
      CREATE INDEX IF NOT EXISTS idx_club_owner_telegram_chat_id ON club_owner_telegram(telegram_chat_id);
    `);
    console.log('✓ Таблица club_owner_telegram создана или уже существует');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_telegram (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        telegram_chat_id TEXT NOT NULL,
        telegram_user_id TEXT NOT NULL,
        telegram_username TEXT,
        verification_code TEXT,
        is_active BOOLEAN DEFAULT true,
        notifications_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id),
        UNIQUE(telegram_chat_id),
        UNIQUE(telegram_user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_user_telegram_user_id ON user_telegram(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_telegram_chat_id ON user_telegram(telegram_chat_id);
      CREATE INDEX IF NOT EXISTS idx_user_telegram_uid ON user_telegram(telegram_user_id);
    `);
    console.log('✓ Таблица user_telegram создана или уже существует');
    
    await checkAndAddMissingColumns();
    await createDefaultAdmin();

    isInitialized = true;
    console.log('✅ База данных инициализирована успешно!');
  } catch (err) {
    console.error('❌ Критическая ошибка инициализации БД:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  } finally {
    isInitializing = false;
  }
}

async function checkAndAddMissingColumns() {
  try {
    const telegramFields = ['telegram_id', 'telegram_username'];
    
    for (const field of telegramFields) {
      try {
        await pool.query(`SELECT ${field} FROM users LIMIT 1;`);
      } catch (columnErr) {
        if (columnErr.code === '42703') {
          await pool.query(`ALTER TABLE users ADD COLUMN ${field} TEXT;`);
          console.log(`✓ Поле ${field} добавлено в таблицу users`);
        }
      }
    }
    
    const clubFields = ['logo_url', 'banner_url'];
    for (const field of clubFields) {
      try {
        await pool.query(`SELECT ${field} FROM clubs LIMIT 1;`);
      } catch (columnErr) {
        if (columnErr.code === '42703') {
          await pool.query(`ALTER TABLE clubs ADD COLUMN ${field} TEXT;`);
          console.log(`✓ Поле ${field} добавлено в таблицу clubs`);
        }
      }
    }

    const paymentsFields = {
      'alfabank_order_id': 'TEXT',
      'alfabank_form_url': 'TEXT',
      'client_email': 'TEXT',
      'client_phone': 'TEXT',
      'description': 'TEXT DEFAULT \'Пополнение баланса FitnesHub\''
    };

    try {
      await pool.query('SELECT 1 FROM payments LIMIT 1');
      
      for (const [field, type] of Object.entries(paymentsFields)) {
        const columnCheck = await pool.query(
          `SELECT column_name 
           FROM information_schema.columns 
           WHERE table_name = 'payments' AND column_name = $1`,
          [field]
        );
        
        if (columnCheck.rows.length === 0) {
          await pool.query(`ALTER TABLE payments ADD COLUMN ${field} ${type};`);
          console.log(`✓ Поле ${field} добавлено в таблицу payments`);
        }
      }
    } catch (tableErr) {
      if (tableErr.code === '42P01') {
        console.log('⚠️ Таблица payments ещё не создана');
      }
    }

  } catch (error) {
    console.error('❌ Ошибка при проверке полей:', error);
  }
}

async function createDefaultAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (adminUsername && adminPassword) {
    try {
      const existingAdmin = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND is_admin = true',
        [adminUsername]
      );
      
      if (existingAdmin.rows.length === 0) {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        await pool.query(
          `INSERT INTO users 
           (email, password, first_name, last_name, is_admin)
           VALUES ($1, $2, 'Admin', 'User', true)`,
          [adminUsername, hashedPassword]
        );
        console.log('✓ Аккаунт администратора создан');
      }
    } catch (adminError) {
      console.error('❌ Ошибка при создании админа:', adminError);
    }
  }
}

async function executeQuery(query, params = [], description = '') {
  try {
    const result = await pool.query(query, params);
    if (description) {
      console.log(`✓ ${description}`);
    }
    return result;
  } catch (err) {
    console.error(`❌ Ошибка запроса ${description}:`, err);
    throw err;
  }
}

async function clearDB() {
  try {
    const tables = [
      'user_telegram', 'club_owner_telegram', 'payments', 'transactions',
      'bookings', 'schedule', 'class_templates', 'club_requests', 'clubs', 'users'
    ];
    for (const table of tables) {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }
    console.log('✓ База данных очищена');
  } catch (err) {
    console.error('❌ Ошибка очистки БД:', err);
    throw err;
  }
}

async function seedTestData() {
  try {
    const existingUsers = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers.rows[0].count) > 1) {
      console.log('✓ Тестовые данные уже существуют');
      return;
    }
    
    console.log('Заполнение тестовыми данными...');
    const bcrypt = require('bcrypt');
    const userPassword = await bcrypt.hash('password123', 10);
    
    await pool.query(
      `INSERT INTO users 
       (email, password, first_name, last_name, phone, preferences, balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['user@example.com', userPassword, 'Иван', 'Петров', '+7 999 123 45 67', ['fitness', 'yoga'], 5000]
    );
    
    console.log('✓ Тестовые данные загружены');
  } catch (err) {
    console.error('❌ Ошибка загрузки тестовых данных:', err);
  }
}

async function validateDatabase() {
  try {
    console.log('🔍 Проверка целостности...');
    
    const tables = [
      'users', 'clubs', 'class_templates', 'schedule', 
      'bookings', 'transactions', 'payments', 'club_requests', 
      'club_owner_telegram', 'user_telegram'
    ];
    
    for (const table of tables) {
      const result = await pool.query(
        `SELECT COUNT(*) FROM information_schema.tables WHERE table_name = $1`,
        [table]
      );
      
      if (result.rows[0].count > 0) {
        console.log(`✅ ${table}`);
      } else {
        console.log(`❌ ${table} отсутствует!`);
      }
    }
    
    console.log('✅ Проверка завершена');
  } catch (error) {
    console.error('❌ Ошибка проверки:', error);
  }
}

// ЗАПУСКАЕМ ИНИЦИАЛИЗАЦИЮ ТОЛЬКО ОДИН РАЗ ПРИ СТАРТЕ
if (require.main === module || !isInitialized) {
  initDB().then(() => {
    validateDatabase();
    
    if (process.env.SEED_TEST_DATA === 'true') {
      seedTestData().catch(err => {
        console.error('Ошибка загрузки тестовых данных:', err);
      });
    }
  }).catch(err => {
    console.error('Критическая ошибка при запуске:', err);
    process.exit(1);
  });
}

module.exports = {
  pool,
  testConnection,
  executeQuery,
  clearDB,
  seedTestData,
  validateDatabase
};
