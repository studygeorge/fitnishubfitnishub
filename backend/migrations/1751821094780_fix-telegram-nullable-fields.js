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
  // Добавляем поле visit_code в таблицу bookings
  pgm.addColumn('bookings', {
    visit_code: {
      type: 'varchar(4)',
      notNull: false
    }
  });
  
  // Заполняем существующие записи случайными кодами
  pgm.sql(`
    UPDATE bookings 
    SET visit_code = LPAD(FLOOR(RANDOM() * 9000 + 1000)::text, 4, '0')
    WHERE visit_code IS NULL
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Удаляем поле visit_code
  pgm.dropColumn('bookings', 'visit_code');
};