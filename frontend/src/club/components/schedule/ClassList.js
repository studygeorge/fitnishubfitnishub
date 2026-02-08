import React from 'react';

const ClassList = ({ 
  classes, 
  onEditClass, 
  onDeleteClass, 
  selectedDate,
  dateOptions,
  onDateChange,
  loading 
}) => {
  
  const parseLocalDateTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    
    console.log('Parsing ClassList date:', dateTimeString);
    
    if (typeof dateTimeString === 'string' && dateTimeString.includes(' ')) {
      const [datePart, timePart] = dateTimeString.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute, second] = (timePart || '00:00:00').split(':').map(Number);
      
      const result = new Date(year, month - 1, day, hour, minute, second || 0);
      console.log('ClassList parsed:', result, 'Hours:', result.getHours());
      return result;
    }
    
    if (dateTimeString.includes('T') && dateTimeString.includes('Z')) {
      const utcDate = new Date(dateTimeString);
      return new Date(
        utcDate.getUTCFullYear(),
        utcDate.getUTCMonth(),
        utcDate.getUTCDate(),
        utcDate.getUTCHours(),
        utcDate.getUTCMinutes(),
        utcDate.getUTCSeconds()
      );
    }
    
    if (dateTimeString.includes('T')) {
      return new Date(dateTimeString);
    }
    
    if (dateTimeString.includes('-') && !dateTimeString.includes(' ')) {
      const [year, month, day] = dateTimeString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    
    return new Date(dateTimeString);
  };

  const formatTime = (dateTimeString) => {
    const dateTime = parseLocalDateTime(dateTimeString);
    if (!dateTime) return '00:00';
    
    const hours = dateTime.getHours();
    const minutes = dateTime.getMinutes();
    
    console.log('ClassList formatTime - Original:', dateTimeString, 'Hours:', hours, 'Minutes:', minutes);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const formatDate = (dateTimeString) => {
    const dateTime = parseLocalDateTime(dateTimeString);
    if (!dateTime || isNaN(dateTime.getTime())) return 'Неизвестно';
    
    const day = String(dateTime.getDate()).padStart(2, '0');
    const month = String(dateTime.getMonth() + 1).padStart(2, '0');
    const year = dateTime.getFullYear();
    
    return `${day}.${month}.${year}`;
  };

  const formatDuration = (startTime, endTime) => {
    const start = parseLocalDateTime(startTime);
    const end = parseLocalDateTime(endTime);
    
    if (!start || !end) return '';
    
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}м`;
    }
    
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    return minutes > 0 ? `${hours}ч ${minutes}м` : `${hours}ч`;
  };

  const getStatusBadge = (classItem) => {
    const now = new Date();
    const startTime = parseLocalDateTime(classItem.start_time);
    const endTime = parseLocalDateTime(classItem.end_time);
    
    if (!startTime || !endTime) return 'unknown';
    
    if (now < startTime) return 'upcoming';
    if (now >= startTime && now <= endTime) return 'active';
    return 'completed';
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'upcoming': return 'Предстоит';
      case 'active': return 'Идет сейчас';
      case 'completed': return 'Завершено';
      default: return 'Неизвестно';
    }
  };

  if (loading) {
    return (
      <div className="fitness-class-list-loading">
        <div className="fitness-loading-spinner"></div>
        <p>Загрузка занятий...</p>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="fitness-empty-classes">
        <div className="fitness-empty-icon fitness-calendar-empty-icon"></div>
        <h3>Нет занятий на выбранную дату</h3>
        <p>Добавьте новое занятие или выберите другую дату</p>
      </div>
    );
  }

  const sortedClasses = [...classes].sort((a, b) => {
    const timeA = parseLocalDateTime(a.start_time);
    const timeB = parseLocalDateTime(b.start_time);
    return timeA - timeB;
  });

  const formatSelectedDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <div className="fitness-class-list">
      <div className="fitness-class-list-header">
        <h3>
          Занятия на {formatSelectedDate(selectedDate)}
        </h3>
        <div className="fitness-class-count">
          {classes.length} {classes.length === 1 ? 'занятие' : 
           classes.length < 5 ? 'занятия' : 'занятий'}
        </div>
      </div>

      <div className="fitness-classes-grid">
        {sortedClasses.map(classItem => {
          const status = getStatusBadge(classItem);
          const occupancyPercent = Math.round(((classItem.booked || 0) / classItem.capacity) * 100);
          
          console.log('Rendering class:', classItem.class_name, 'Start:', classItem.start_time, 'Formatted:', formatTime(classItem.start_time));
          
          return (
            <div key={classItem.id} className={`fitness-class-card fitness-status-${status}`}>
              <div className="fitness-class-card-header">
                <div className="fitness-class-time-range">
                  <span className="fitness-start-time">{formatTime(classItem.start_time)}</span>
                  <span className="fitness-time-separator">—</span>
                  <span className="fitness-end-time">{formatTime(classItem.end_time)}</span>
                  <span className="fitness-duration">
                    ({formatDuration(classItem.start_time, classItem.end_time)})
                  </span>
                </div>
                <div className={`fitness-status-badge fitness-status-${status}`}>
                  {getStatusText(status)}
                </div>
              </div>

              <div className="fitness-class-card-body">
                <h4 className="fitness-class-name">{classItem.class_name}</h4>
                
                {classItem.category && (
                  <div className="fitness-class-category">
                    <span className="fitness-category-badge">{classItem.category}</span>
                  </div>
                )}

                <div className="fitness-class-details">
                  {classItem.trainer && (
                    <div className="fitness-detail-row">
                      <span className="fitness-detail-label">Тренер:</span>
                      <span className="fitness-detail-value">{classItem.trainer}</span>
                    </div>
                  )}

                  <div className="fitness-detail-row">
                    <span className="fitness-detail-label">Мест:</span>
                    <span className="fitness-detail-value">
                      {classItem.booked || 0} / {classItem.capacity}
                      <span className="fitness-occupancy-percent">({occupancyPercent}%)</span>
                    </span>
                  </div>

                  <div className="fitness-detail-row">
                    <span className="fitness-detail-label">Цена:</span>
                    <span className="fitness-detail-value fitness-price">{parseFloat(classItem.price).toFixed(0)} ₽</span>
                  </div>

                  {classItem.created_at && (
                    <div className="fitness-detail-row">
                      <span className="fitness-detail-label">Дата создания:</span>
                      <span className="fitness-detail-value">{formatDate(classItem.created_at)}</span>
                    </div>
                  )}
                </div>

                {classItem.description && (
                  <div className="fitness-class-description">
                    <p>{classItem.description}</p>
                  </div>
                )}

                <div className="fitness-occupancy-bar">
                  <div 
                    className="fitness-occupancy-fill"
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
              </div>

              <div className="fitness-class-card-actions">
                <button 
                  className="fitness-btn fitness-btn-sm fitness-btn-secondary"
                  onClick={() => onEditClass && onEditClass(classItem)}
                  title="Редактировать занятие"
                >
                  <div className="fitness-edit-icon"></div>
                  Изменить
                </button>
                <button 
                  className="fitness-btn fitness-btn-sm fitness-btn-danger"
                  onClick={() => onDeleteClass && onDeleteClass(classItem.id)}
                  title="Удалить занятие"
                >
                  <div className="fitness-delete-icon"></div>
                  Удалить
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClassList;