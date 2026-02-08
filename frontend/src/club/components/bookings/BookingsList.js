// src/club/components/bookings/BookingsList.js
import React from 'react';

const BookingsList = ({ 
  bookings, 
  loading, 
  onCompleteBooking, 
  onCancelBooking,
  filters 
}) => {
  if (loading) {
    return (
      <div className="bookings-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка бронирований...</p>
      </div>
    );
  }

  // Фильтрация бронирований
  const filteredBookings = bookings.filter(booking => {
    if (filters.status !== 'all' && booking.status !== filters.status) {
      return false;
    }
    
    if (filters.date && new Date(booking.start_time).toISOString().split('T')[0] !== filters.date) {
      return false;
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const fullName = `${booking.first_name} ${booking.last_name}`.toLowerCase();
      const className = booking.class_name.toLowerCase();
      if (!fullName.includes(searchLower) && !className.includes(searchLower)) {
        return false;
      }
    }
    
    return true;
  });

  const getStatusLabel = (status) => {
    const statusMap = {
      'confirmed': 'Подтверждено',
      'completed': 'Завершено',
      'cancelled': 'Отменено'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      'confirmed': 'status-confirmed',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return statusClasses[status] || '';
  };

  if (filteredBookings.length === 0) {
    return (
      <div className="empty-bookings">
        <div className="empty-icon">📝</div>
        <h3>Нет бронирований</h3>
        <p>
          {filters.status !== 'all' || filters.date || filters.search
            ? 'По заданным фильтрам бронирования не найдены'
            : 'Бронирования от посетителей появятся здесь'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="bookings-table">
      <div className="table-header">
        <span>Клиент</span>
        <span>Занятие</span>
        <span>Дата и время</span>
        <span>Статус</span>
        <span>Действия</span>
      </div>
      
      <div className="table-body">
        {filteredBookings.map(booking => (
          <div key={booking.id} className="table-row">
            <div className="client-info">
              <div className="client-avatar">
                {booking.first_name?.[0]?.toUpperCase() || '👤'}
              </div>
              <div className="client-details">
                <span className="client-name">
                  {booking.first_name} {booking.last_name}
                </span>
              </div>
            </div>
            
            <div className="class-info">
              <span className="class-name">{booking.class_name}</span>
              {booking.trainer && (
                <span className="class-trainer">Тренер: {booking.trainer}</span>
              )}
            </div>
            
            <div className="booking-datetime">
              <span className="booking-date">
                {new Date(booking.start_time).toLocaleDateString('ru-RU')}
              </span>
              <span className="booking-time">
                {new Date(booking.start_time).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            <div className="booking-status">
              <span className={`status-badge ${getStatusClass(booking.status)}`}>
                {getStatusLabel(booking.status)}
              </span>
            </div>
            
            <div className="booking-actions">
              {booking.status === 'confirmed' && (
                <>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => onCompleteBooking(booking.id)}
                    title="Отметить как завершенное"
                  >
                    ✓ Завершить
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => onCancelBooking(booking.id)}
                    title="Отменить бронирование"
                  >
                    ✕ Отменить
                  </button>
                </>
              )}
              {booking.status === 'completed' && (
                <span className="completed-label">Завершено</span>
              )}
              {booking.status === 'cancelled' && (
                <span className="cancelled-label">Отменено</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingsList;