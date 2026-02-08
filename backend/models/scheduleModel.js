const { pool } = require('../db');

async function getAllClasses(filters = {}) {
  const queryParams = [];
  let query = `
    SELECT s.id, s.class_name, s.start_time, s.end_time, s.trainer, 
           s.capacity, s.booked, s.price, s.category, s.description,
           c.id as club_id, c.name as club_name, c.address as club_address
    FROM schedule s
    JOIN clubs c ON s.club_id = c.id
  `;
  
  const conditions = [];
  
  if (filters.clubId) {
    queryParams.push(filters.clubId);
    conditions.push(`s.club_id = $${queryParams.length}`);
  }
  
  if (filters.date) {
    const date = new Date(filters.date);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    
    queryParams.push(date.toISOString());
    queryParams.push(nextDay.toISOString());
    conditions.push(`s.start_time >= $${queryParams.length - 1} AND s.start_time < $${queryParams.length}`);
  }
  
  if (filters.category) {
    queryParams.push(filters.category);
    conditions.push(`s.category = $${queryParams.length}`);
  }
  
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  query += ' ORDER BY s.start_time';
  
  const result = await pool.query(query, queryParams);
  return result.rows;
}

async function getClassById(id) {
  const result = await pool.query(
    `SELECT s.id, s.class_name, s.start_time, s.end_time, s.trainer, 
            s.capacity, s.booked, s.price, s.category, s.description,
            c.id as club_id, c.name as club_name, c.address as club_address
     FROM schedule s
     JOIN clubs c ON s.club_id = c.id
     WHERE s.id = $1`,
    [id]
  );
  
  return result.rows[0];
}

async function addClass(classData) {
  const {
    club_id, class_name, start_time, end_time, trainer,
    capacity, price, category, description
  } = classData;
  
  const result = await pool.query(
    `INSERT INTO schedule
     (club_id, class_name, start_time, end_time, trainer, capacity, price, category, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [club_id, class_name, start_time, end_time, trainer, capacity, price, category, description]
  );
  
  return result.rows[0];
}

async function updateClass(id, classData) {
  const {
    class_name, start_time, end_time, trainer,
    capacity, price, category, description
  } = classData;
  
  const result = await pool.query(
    `UPDATE schedule
     SET class_name = COALESCE($1, class_name),
         start_time = COALESCE($2, start_time),
         end_time = COALESCE($3, end_time),
         trainer = COALESCE($4, trainer),
         capacity = COALESCE($5, capacity),
         price = COALESCE($6, price),
         category = COALESCE($7, category),
         description = COALESCE($8, description)
     WHERE id = $9
     RETURNING *`,
    [class_name, start_time, end_time, trainer, capacity, price, category, description, id]
  );
  
  return result.rows[0];
}

async function deleteClass(id) {
  await pool.query('DELETE FROM schedule WHERE id = $1', [id]);
  return { success: true };
}

async function incrementBookedCount(id) {
  const result = await pool.query(
    'UPDATE schedule SET booked = booked + 1 WHERE id = $1 RETURNING *',
    [id]
  );
  
  return result.rows[0];
}

async function decrementBookedCount(id) {
  const result = await pool.query(
    'UPDATE schedule SET booked = booked - 1 WHERE id = $1 RETURNING *',
    [id]
  );
  
  return result.rows[0];
}

async function getClassesByClubId(clubId) {
  const result = await pool.query(
    `SELECT id, class_name, start_time, end_time, trainer,
            capacity, booked, price, category
     FROM schedule
     WHERE club_id = $1
     ORDER BY start_time`,
    [clubId]
  );
  
  return result.rows;
}

async function createClassFromTemplate(templateId, date, startTime) {
  // Получаем данные шаблона
  const templateResult = await pool.query(
    'SELECT * FROM class_templates WHERE id = $1',
    [templateId]
  );
  
  if (templateResult.rows.length === 0) {
    throw new Error('Шаблон не найден');
  }
  
  const template = templateResult.rows[0];
  
  // Формируем время начала
  const start = new Date(`${date}T${startTime}`);
  
  // Формируем время окончания
  const end = new Date(start.getTime() + template.duration * 60000);
  
  // Создаем занятие на основе шаблона
  const result = await pool.query(
    `INSERT INTO schedule
     (club_id, class_name, start_time, end_time, trainer, capacity, price, category, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      template.club_id, 
      template.class_name, 
      start.toISOString(), 
      end.toISOString(), 
      template.trainer,
      template.capacity, 
      template.price, 
      template.category, 
      template.description
    ]
  );
  
  return result.rows[0];
}

async function createSeriesFromTemplate(templateId, startDate, endDate, daysOfWeek, startTime) {
  // Получаем данные шаблона
  const templateResult = await pool.query(
    'SELECT * FROM class_templates WHERE id = $1',
    [templateId]
  );
  
  if (templateResult.rows.length === 0) {
    throw new Error('Шаблон не найден');
  }
  
  const template = templateResult.rows[0];
  
  // Преобразуем строки дат в объекты Date
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Разбираем время
  const [hours, minutes] = startTime.split(':').map(Number);
  
  // Массив для хранения созданных занятий
  const createdClasses = [];
  
  // Перебираем все даты от начальной до конечной
  const currentDate = new Date(start);
  while (currentDate <= end) {
    // Проверяем, входит ли день недели в выбранные дни
    const currentDayOfWeek = currentDate.getDay(); // 0 - вс, 1 - пн, ..., 6 - сб
    
    if (daysOfWeek.includes(currentDayOfWeek)) {
      // Создаем время начала для текущей даты
      const classStartTime = new Date(currentDate);
      classStartTime.setHours(hours, minutes, 0, 0);
      
      // Создаем время окончания
      const classEndTime = new Date(classStartTime.getTime() + template.duration * 60000);
      
      // Добавляем занятие в базу данных
      const result = await pool.query(
        `INSERT INTO schedule
         (club_id, class_name, start_time, end_time, trainer, capacity, price, category, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          template.club_id, 
          template.class_name, 
          classStartTime.toISOString(), 
          classEndTime.toISOString(), 
          template.trainer,
          template.capacity, 
          template.price, 
          template.category, 
          template.description
        ]
      );
      
      createdClasses.push(result.rows[0]);
    }
    
    // Переходим к следующему дню
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return createdClasses;
}

// Экспортируем новые функции
module.exports = {
  getAllClasses,
  getClassById,
  addClass,
  updateClass,
  deleteClass,
  incrementBookedCount,
  decrementBookedCount,
  getClassesByClubId,
  createClassFromTemplate, // Новые функции
  createSeriesFromTemplate // Новые функции
};