import React from 'react';

const VisitorsList = ({ bookings, formatTime, onCompleteBooking, onCancelBooking }) => {
  return (
    <div className="visitors-table">
      <div className="table-header">
        <div className="th">Посетитель</div>
        <div className="th">Занятие</div>
        <div className="th">Дата</div>
        <div className="th">Время</div>
        <div className="th">Статус</div>
        <div className="th">Действия</div>
      </div>
      
      {bookings && bookings.length > 0 ? (
        bookings.map(booking => (
          <div className="table-row" key={booking.id}>
            <div className="td">{booking.first_name} {booking.last_name}</div>
            <div className="td">{booking.class_name}</div>
            <div className="td">{new Date(booking.start_time).toLocaleDateString('ru-RU')}</div>
            <div className="td">
              {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
            </div>
            <div className={`td status ${booking.status}`}>
              {booking.status === 'completed' && 'Завершено'}
              {booking.status === 'confirmed' && 'Подтверждено'}
              {booking.status === 'cancelled' && 'Отменено'}
            </div>
            <div className="td actions">
              {booking.status === 'confirmed' && (
                <>
                  <button 
                    className="confirm-btn"
                    onClick={() => onCompleteBooking(booking.id)}
                  >
                    Отметить посещение
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => onCancelBooking(booking.id)}
                  >
                    Отменить
                  </button>
                </>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="no-visitors">Нет данных о посетителях</div>
      )}
    </div>
  );
};

export default VisitorsList;