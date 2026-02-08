const { pool } = require('../db');

// Функция создания депозита (пополнения баланса)
async function createDeposit(userId, amount, paymentMethod, description = 'Пополнение баланса') {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Создаем запись о транзакции
    const transactionResult = await client.query(
      `INSERT INTO transactions
       (user_id, type, amount, payment_method, description)
       VALUES ($1, 'deposit', $2, $3, $4)
       RETURNING *`,
      [userId, amount, paymentMethod, description]
    );
    
    // Обновляем баланс пользователя
    await client.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2',
      [amount, userId]
    );
    
    await client.query('COMMIT');
    console.log(`✅ Депозит создан: пользователь ${userId}, сумма ${amount}, описание: ${description}`);
    return transactionResult.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Ошибка создания депозита:', e.message);
    throw e;
  } finally {
    client.release();
  }
}

// Функция создания платежа (списание с баланса)
async function createPayment(userId, clubId, amount, bookingId, description) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Проверяем баланс пользователя
    const userBalance = await client.query(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );
    
    if (userBalance.rows.length === 0) {
      throw new Error('Пользователь не найден');
    }
    
    // Приводим к числам для корректного сравнения
    const currentBalance = parseFloat(userBalance.rows[0].balance);
    const paymentAmount = parseFloat(amount);
    
    console.log('Проверка баланса:', {
      userId,
      currentBalance,
      paymentAmount,
      balanceType: typeof currentBalance,
      amountType: typeof paymentAmount,
      hasEnough: currentBalance >= paymentAmount
    });
    
    if (currentBalance < paymentAmount) {
      throw new Error('Недостаточно средств на балансе');
    }
    
    // Создаем запись о транзакции списания с пользователя
    const transactionResult = await client.query(
      `INSERT INTO transactions
       (user_id, club_id, type, amount, description, booking_id)
       VALUES ($1, $2, 'payment', $3, $4, $5)
       RETURNING *`,
      [userId, clubId, -paymentAmount, description, bookingId]
    );
    
    // Обновляем баланс пользователя
    await client.query(
      'UPDATE users SET balance = balance - $1 WHERE id = $2',
      [paymentAmount, userId]
    );
    
    // Обновляем баланс клуба (если клуб указан)
    if (clubId) {
      await client.query(
        'UPDATE clubs SET balance = balance + $1 WHERE id = $2',
        [paymentAmount, clubId]
      );
    }
    
    await client.query('COMMIT');
    console.log(`✅ Платеж создан: пользователь ${userId}, сумма ${paymentAmount}, клуб ${clubId}`);
    return { success: true, transaction: transactionResult.rows[0] };
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Ошибка создания платежа:', e.message);
    throw e;
  } finally {
    client.release();
  }
}

// Функция создания вывода средств
async function createWithdrawal(userId, clubId, amount) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Проверяем баланс клуба и права пользователя
    const clubBalance = await client.query(
      'SELECT balance FROM clubs WHERE id = $1 AND owner_id = $2',
      [clubId, userId]
    );
    
    if (clubBalance.rows.length === 0) {
      throw new Error('Клуб не найден или вы не являетесь его владельцем');
    }
    
    const currentClubBalance = parseFloat(clubBalance.rows[0].balance);
    const withdrawalAmount = parseFloat(amount);
    
    if (currentClubBalance < withdrawalAmount) {
      throw new Error('Недостаточно средств на балансе клуба');
    }
    
    // Создаем запись о транзакции
    const transactionResult = await client.query(
      `INSERT INTO transactions
       (user_id, club_id, type, amount, description)
       VALUES ($1, $2, 'withdrawal', $3, 'Вывод средств')
       RETURNING *`,
      [userId, clubId, -withdrawalAmount]
    );
    
    // Обновляем баланс клуба
    await client.query(
      'UPDATE clubs SET balance = balance - $1 WHERE id = $2',
      [withdrawalAmount, clubId]
    );
    
    await client.query('COMMIT');
    console.log(`✅ Вывод создан: пользователь ${userId}, клуб ${clubId}, сумма ${withdrawalAmount}`);
    return { success: true, transaction: transactionResult.rows[0] };
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Ошибка создания вывода:', e.message);
    throw e;
  } finally {
    client.release();
  }
}

// Функция получения транзакций пользователя
async function getUserTransactions(userId) {
  try {
    const result = await pool.query(
      `SELECT t.id, t.type, t.amount, t.description, t.payment_method, t.created_at,
              c.name as club_name, t.booking_id
       FROM transactions t
       LEFT JOIN clubs c ON t.club_id = c.id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC
       LIMIT 50`,
      [userId]
    );
    
    console.log(`📊 Получено ${result.rows.length} транзакций для пользователя ${userId}`);
    return result.rows;
  } catch (error) {
    console.error('❌ Ошибка получения транзакций пользователя:', error.message);
    throw error;
  }
}

// Функция получения транзакций клуба
async function getClubTransactions(clubId) {
  try {
    const result = await pool.query(
      `SELECT t.id, t.type, t.amount, t.description, t.created_at,
              u.first_name, u.last_name, t.booking_id, t.payment_method
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.club_id = $1
       ORDER BY t.created_at DESC
       LIMIT 100`,
      [clubId]
    );
    
    console.log(`📊 Получено ${result.rows.length} транзакций для клуба ${clubId}`);
    return result.rows;
  } catch (error) {
    console.error('❌ Ошибка получения транзакций клуба:', error.message);
    throw error;
  }
}

// Функция создания возврата
async function createRefund(userId, clubId, amount, bookingId, description) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const refundAmount = parseFloat(amount);
    
    // Создаем запись о возврате средств
    const transactionResult = await client.query(
      `INSERT INTO transactions
       (user_id, club_id, type, amount, description, booking_id)
       VALUES ($1, $2, 'refund', $3, $4, $5)
       RETURNING *`,
      [userId, clubId, refundAmount, description, bookingId]
    );
    
    // Возвращаем средства пользователю
    await client.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2',
      [refundAmount, userId]
    );
    
    // Списываем с баланса клуба (если клуб указан)
    if (clubId) {
      await client.query(
        'UPDATE clubs SET balance = balance - $1 WHERE id = $2',
        [refundAmount, clubId]
      );
    }
    
    await client.query('COMMIT');
    console.log(`✅ Возврат создан: пользователь ${userId}, сумма ${refundAmount}, бронирование ${bookingId}`);
    return { success: true, transaction: transactionResult.rows[0] };
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Ошибка создания возврата:', e.message);
    throw e;
  } finally {
    client.release();
  }
}

// Функция получения статистики транзакций пользователя
async function getUserTransactionStats(userId) {
  try {
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_transactions,
         COUNT(CASE WHEN type = 'deposit' THEN 1 END) as deposits_count,
         COUNT(CASE WHEN type = 'payment' THEN 1 END) as payments_count,
         COUNT(CASE WHEN type = 'refund' THEN 1 END) as refunds_count,
         COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount END), 0) as total_deposits,
         COALESCE(SUM(CASE WHEN type = 'payment' THEN ABS(amount) END), 0) as total_payments,
         COALESCE(SUM(CASE WHEN type = 'refund' THEN amount END), 0) as total_refunds
       FROM transactions 
       WHERE user_id = $1`,
      [userId]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('❌ Ошибка получения статистики транзакций:', error.message);
    throw error;
  }
}

// Функция получения статистики транзакций клуба
async function getClubTransactionStats(clubId) {
  try {
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_transactions,
         COUNT(CASE WHEN type = 'payment' THEN 1 END) as income_count,
         COUNT(CASE WHEN type = 'withdrawal' THEN 1 END) as withdrawals_count,
         COUNT(CASE WHEN type = 'refund' THEN 1 END) as refunds_count,
         COALESCE(SUM(CASE WHEN type = 'payment' THEN ABS(amount) END), 0) as total_income,
         COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN ABS(amount) END), 0) as total_withdrawals,
         COALESCE(SUM(CASE WHEN type = 'refund' THEN ABS(amount) END), 0) as total_refunds
       FROM transactions 
       WHERE club_id = $1`,
      [clubId]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('❌ Ошибка получения статистики клуба:', error.message);
    throw error;
  }
}

// Функция получения транзакций по периоду
async function getTransactionsByPeriod(userId, startDate, endDate, transactionType = null) {
  try {
    let query = `
      SELECT t.id, t.type, t.amount, t.description, t.payment_method, t.created_at,
             c.name as club_name, t.booking_id
      FROM transactions t
      LEFT JOIN clubs c ON t.club_id = c.id
      WHERE t.user_id = $1 
        AND t.created_at >= $2 
        AND t.created_at <= $3
    `;
    
    const params = [userId, startDate, endDate];
    
    if (transactionType) {
      query += ` AND t.type = $4`;
      params.push(transactionType);
    }
    
    query += ` ORDER BY t.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    console.log(`📊 Получено ${result.rows.length} транзакций за период для пользователя ${userId}`);
    return result.rows;
  } catch (error) {
    console.error('❌ Ошибка получения транзакций по периоду:', error.message);
    throw error;
  }
}

// Функция проверки существования транзакции
async function transactionExists(userId, bookingId, type) {
  try {
    const result = await pool.query(
      `SELECT id FROM transactions 
       WHERE user_id = $1 AND booking_id = $2 AND type = $3 
       LIMIT 1`,
      [userId, bookingId, type]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Ошибка проверки существования транзакции:', error.message);
    throw error;
  }
}

// Функция получения транзакции по ID
async function getTransactionById(transactionId) {
  try {
    const result = await pool.query(
      `SELECT t.*, c.name as club_name, 
              u.first_name, u.last_name, u.email
       FROM transactions t
       LEFT JOIN clubs c ON t.club_id = c.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [transactionId]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('❌ Ошибка получения транзакции по ID:', error.message);
    throw error;
  }
}

module.exports = {
  createDeposit,
  createPayment,
  createWithdrawal,
  createRefund,
  getUserTransactions,
  getClubTransactions,
  getUserTransactionStats,
  getClubTransactionStats,
  getTransactionsByPeriod,
  transactionExists,
  getTransactionById
};