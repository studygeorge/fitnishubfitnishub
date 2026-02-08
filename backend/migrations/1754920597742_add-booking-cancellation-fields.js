/* eslint-disable camelcase */

exports.up = (pgm) => {
    // Добавляем новые столбцы для отслеживания отмены бронирований
    pgm.addColumns('bookings', {
      cancelled_at: {
        type: 'timestamp',
        notNull: false,
        comment: 'Время отмены бронирования'
      },
      cancelled_by: {
        type: 'varchar(20)',
        notNull: false,
        comment: 'Кто отменил бронирование: user, club, admin'
      },
      cancellation_reason: {
        type: 'text',
        notNull: false,
        comment: 'Причина отмены бронирования'
      }
    });
  
    console.log('✅ Добавлены столбцы: cancelled_at, cancelled_by, cancellation_reason');
  };
  
  exports.down = (pgm) => {
    // Откатываем изменения - удаляем добавленные столбцы
    pgm.dropColumns('bookings', [
      'cancelled_at',
      'cancelled_by', 
      'cancellation_reason'
    ]);
  
    console.log('✅ Удалены столбцы: cancelled_at, cancelled_by, cancellation_reason');
  };