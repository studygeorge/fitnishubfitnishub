const { pool } = require('../db');

// НОВАЯ функция для создания платежа с правильными параметрами для Альфа-Банка
async function createPaymentRecord(userId, amount, orderId, clientEmail, clientPhone, description) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO payments 
       (user_id, amount, order_id, client_email, client_phone, description, status, payment_method, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'alfabank', CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, parseFloat(amount), orderId, clientEmail, clientPhone, description || 'Пополнение баланса FitnesHub']
    );
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// СТАРАЯ функция для совместимости (используется в transactionModel)
async function createPayment(userId, amount, paymentMethod, orderId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO payments 
       (user_id, amount, payment_method, order_id, status, created_at)
       VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, amount, paymentMethod, orderId]
    );
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updatePaymentStatus(orderId, status, paymentData = {}) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      `UPDATE payments 
       SET status = $1, 
           payment_data = $2,
           completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
           updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $3
       RETURNING *`,
      [status, JSON.stringify(paymentData), orderId]
    );
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getPaymentByOrderId(orderId) {
  const result = await pool.query(
    'SELECT * FROM payments WHERE order_id = $1',
    [orderId]
  );
  return result.rows[0];
}

async function updateAlfabankData(orderId, alfabankOrderId, formUrl) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      `UPDATE payments 
       SET alfabank_order_id = $1,
           alfabank_form_url = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $3
       RETURNING *`,
      [alfabankOrderId, formUrl, orderId]
    );
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getPaymentByAlfabankOrderId(alfabankOrderId) {
  const result = await pool.query(
    'SELECT * FROM payments WHERE alfabank_order_id = $1',
    [alfabankOrderId]
  );
  return result.rows[0];
}

async function getUserPayments(userId, limit = 20, offset = 0) {
  const result = await pool.query(
    `SELECT * FROM payments 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}

async function getPaymentStats(userId = null) {
  let query = `
    SELECT 
      COUNT(*) as total_count,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_amount
    FROM payments
  `;

  const values = [];
  if (userId) {
    query += ' WHERE user_id = $1';
    values.push(userId);
  }

  const result = await pool.query(query, values);
  return result.rows[0];
}

module.exports = {
  createPayment,
  createPayment: createPaymentRecord, // Экспортируем новую функцию как createPayment для balance.js
  updatePaymentStatus,
  getPaymentByOrderId,
  updateAlfabankData,
  getPaymentByAlfabankOrderId,
  getUserPayments,
  getPaymentStats
};