// src/club/components/dashboard/RecentVisitors.js
import React from 'react';
import { Link } from 'react-router-dom';

const RecentVisitors = ({ bookings, loading, formatLocalDate, formatLocalTime }) => {
  if (loading) {
    return (
      <div className="fitness-dashboard-section">
        <div className="fitness-section-header">
          <h3>Последние посетители</h3>
        </div>
        <div className="fitness-loading-placeholder">
          <div className="fitness-loading-spinner"></div>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  // ИСПРАВЛЕНО: Используем displayStatus из дашборда
  const getStatusLabel = (booking) => {
    // Приоритет отдаем displayStatus, если есть
    if (booking.displayStatus) {
      return booking.displayStatus;
    }
    
    // Fallback на старую логику для совместимости
    const statusMap = {
      'confirmed': 'Подтверждено',
      'completed': 'Завершено',
      'cancelled': booking.cancelled_by === 'user' ? 'Отменено клиентом' : 'Отменено',
      'cancelled_by_club': 'Отменено' // ИСПРАВЛЕНО: показываем просто "Отменено"
    };
    return statusMap[booking.status] || booking.status;
  };

  const getStatusClass = (booking) => {
    // Используем оригинальный статус для CSS классов
    const status = booking.status;
    const statusClasses = {
      'confirmed': 'fitness-status-confirmed',
      'completed': 'fitness-status-completed',
      'cancelled': 'fitness-status-cancelled',
      'cancelled_by_club': 'fitness-status-cancelled' // ДОБАВЛЕНО: тот же класс что и для cancelled
    };
    return statusClasses[status] || '';
  };

  console.log('RecentVisitors получил bookings:', bookings?.map(b => ({
    name: `${b.first_name} ${b.last_name}`,
    originalStatus: b.status,
    displayStatus: b.displayStatus,
    cancelledBy: b.cancelled_by
  })));

  return (
    <div className="fitness-dashboard-section">
      <div className="fitness-section-header">
        <h3>Последние посетители</h3>
      </div>

      {bookings && bookings.length > 0 ? (
        <div className="fitness-visitors-list">
          {bookings.slice(0, 5).map(booking => (
            <div key={booking.id} className="fitness-visitor-item">
              <div className="fitness-visitor-avatar">
                {booking.first_name?.[0]?.toUpperCase() || 'П'}
              </div>
              <div className="fitness-visitor-info">
                <h4 className="fitness-visitor-name">
                  {booking.first_name} {booking.last_name}
                </h4>
                <p className="fitness-visitor-class">{booking.class_name}</p>
                <p className="fitness-visitor-time">
                  {/* ИСПРАВЛЕНО: Используем функции форматирования из родителя */}
                  {formatLocalDate ? formatLocalDate(booking.start_time) : new Date(booking.start_time).toLocaleDateString('ru-RU')} в {' '}
                  {formatLocalTime ? formatLocalTime(booking.start_time) : new Date(booking.start_time).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="fitness-visitor-status">
                <span className={`fitness-status-badge ${getStatusClass(booking)}`}>
                  {/* ИСПРАВЛЕНО: Используем новую функцию getStatusLabel */}
                  {getStatusLabel(booking)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="fitness-empty-state">
          <div className="fitness-empty-icon fitness-users-icon"></div>
          <h4>Нет записей</h4>
          <p>Записи посетителей появятся здесь</p>
        </div>
      )}
    </div>
  );
};

export default RecentVisitors;