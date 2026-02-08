// backend/models/classTemplateModel.js
const { pool } = require('../db');

async function createTable() {
  // Создаем таблицу шаблонов, если её еще нет
  await pool.query(`
    CREATE TABLE IF NOT EXISTS class_templates (
      id SERIAL PRIMARY KEY,
      club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
      template_name VARCHAR(255) NOT NULL,
      class_name VARCHAR(255) NOT NULL,
      duration INTEGER NOT NULL,
      trainer VARCHAR(255) NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 10,
      price NUMERIC(10, 2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT,
      color VARCHAR(20) DEFAULT '#F8A284',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Вызываем функцию создания таблицы при загрузке модуля
createTable().catch(err => console.error('Ошибка при создании таблицы class_templates:', err));

async function getAllTemplates(clubId) {
  const result = await pool.query(
    `SELECT * FROM class_templates 
     WHERE club_id = $1 
     ORDER BY template_name`,
    [clubId]
  );
  return result.rows;
}

async function getTemplateById(id) {
  const result = await pool.query(
    'SELECT * FROM class_templates WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

async function createTemplate(templateData) {
  const {
    club_id,
    template_name,
    class_name,
    duration,
    trainer,
    capacity,
    price,
    category,
    description,
    color
  } = templateData;
  
  const result = await pool.query(
    `INSERT INTO class_templates 
     (club_id, template_name, class_name, duration, trainer, capacity, price, category, description, color)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [club_id, template_name, class_name, duration, trainer, capacity, price, category, description, color || '#F8A284']
  );
  
  return result.rows[0];
}

async function updateTemplate(id, templateData) {
  const {
    template_name,
    class_name,
    duration,
    trainer,
    capacity,
    price,
    category,
    description,
    color
  } = templateData;
  
  const result = await pool.query(
    `UPDATE class_templates
     SET template_name = COALESCE($1, template_name),
         class_name = COALESCE($2, class_name),
         duration = COALESCE($3, duration),
         trainer = COALESCE($4, trainer),
         capacity = COALESCE($5, capacity),
         price = COALESCE($6, price),
         category = COALESCE($7, category),
         description = COALESCE($8, description),
         color = COALESCE($9, color),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $10
     RETURNING *`,
    [template_name, class_name, duration, trainer, capacity, price, category, description, color, id]
  );
  
  return result.rows[0];
}

async function deleteTemplate(id) {
  await pool.query('DELETE FROM class_templates WHERE id = $1', [id]);
  return { success: true };
}

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
};