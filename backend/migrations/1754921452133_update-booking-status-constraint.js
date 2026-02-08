/* eslint-disable camelcase */

exports.up = (pgm) => {
    // Сначала удаляем старый constraint
    pgm.sql(`
      ALTER TABLE bookings 
      DROP CONSTRAINT IF EXISTS bookings_status_check;
    `);
    
    // Добавляем новый constraint с поддержкой cancelled_by_club
    pgm.sql(`
      ALTER TABLE bookings 
      ADD CONSTRAINT bookings_status_check 
      CHECK (status IN ('confirmed', 'completed', 'cancelled', 'cancelled_by_club'));
    `);
  
    console.log('✅ Обновлен constraint для статусов бронирований');
  };
  
  exports.down = (pgm) => {
    // Откатываем к старому constraint (без cancelled_by_club)
    pgm.sql(`
      ALTER TABLE bookings 
      DROP CONSTRAINT IF EXISTS bookings_status_check;
    `);
    
    pgm.sql(`
      ALTER TABLE bookings 
      ADD CONSTRAINT bookings_status_check 
      CHECK (status IN ('confirmed', 'completed', 'cancelled'));
    `);
  
    console.log('✅ Возвращен старый constraint для статусов бронирований');
  };