import React, { useState } from 'react';
import './ScheduleCalendar.css';

const ScheduleCalendar = ({ 
  classes, 
  templates, 
  onClassClick, 
  onDateClick 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayClasses, setSelectedDayClasses] = useState([]);
  const [selectedModalDate, setSelectedModalDate] = useState(null);

  const parseLocalDateTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    
    if (typeof dateTimeString === 'string' && dateTimeString.includes(' ')) {
      const [datePart, timePart] = dateTimeString.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute, second] = (timePart || '00:00:00').split(':').map(Number);
      
      return new Date(year, month - 1, day, hour, minute, second || 0);
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

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startCalendar = new Date(firstDay);
    
    startCalendar.setDate(startCalendar.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startCalendar);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getClassesForDate = (date) => {
    const targetYear = date.getFullYear();
    const targetMonth = date.getMonth() + 1;
    const targetDay = date.getDate();
    
    return classes.filter(classItem => {
      const classDateTime = parseLocalDateTime(classItem.start_time);
      if (!classDateTime) return false;
      
      const classYear = classDateTime.getFullYear();
      const classMonth = classDateTime.getMonth() + 1;
      const classDay = classDateTime.getDate();
      
      return (classYear === targetYear && classMonth === targetMonth && classDay === targetDay);
    }).sort((a, b) => {
      const timeA = parseLocalDateTime(a.start_time);
      const timeB = parseLocalDateTime(b.start_time);
      return timeA - timeB;
    });
  };

  const formatTime = (dateTimeString) => {
    const dateTime = parseLocalDateTime(dateTimeString);
    if (!dateTime) return '00:00';
    
    const hours = dateTime.getHours();
    const minutes = dateTime.getMinutes();
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleDayClick = (date) => {
    const dayClasses = getClassesForDate(date);
    
    if (dayClasses.length > 0) {
      setSelectedDayClasses(dayClasses);
      setSelectedModalDate(date);
      setShowDayModal(true);
    } else {
      if (onDateClick) {
        onDateClick(date);
      }
    }
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const isToday = (date) => {
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === today.getTime();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getClassColor = (classItem) => {
    const template = templates.find(t => 
      t.id === classItem.template_id || 
      t.class_name === classItem.class_name
    );
    
    return template?.color || '#FF6933';
  };

  const formatModalDate = (date) => {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const calculateDuration = (startTime, endTime) => {
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

  return (
    <div className="fitness-schedule-calendar">
      <div className="fitness-calendar-header">
        <button 
          className="fitness-calendar-nav-btn"
          onClick={() => navigateMonth(-1)}
          title="Предыдущий месяц"
        >
          <div className="fitness-nav-arrow fitness-nav-left"></div>
        </button>
        <h3 className="fitness-calendar-title">
          {currentDate.toLocaleDateString('ru-RU', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </h3>
        <button 
          className="fitness-calendar-nav-btn"
          onClick={() => navigateMonth(1)}
          title="Следующий месяц"
        >
          <div className="fitness-nav-arrow fitness-nav-right"></div>
        </button>
      </div>

      <div className="fitness-calendar-weekdays">
        {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
          <div key={day} className="fitness-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="fitness-calendar-grid">
        {days.map((day, index) => {
          const dayClasses = getClassesForDate(day);
          
          return (
            <div
              key={index}
              className={`fitness-calendar-day ${
                !isCurrentMonth(day) ? 'fitness-other-month' : ''
              } ${
                isToday(day) ? 'fitness-today' : ''
              } ${
                dayClasses.length > 0 ? 'fitness-has-classes' : ''
              }`}
              onClick={() => handleDayClick(day)}
            >
              <div className="fitness-day-number">
                {day.getDate()}
              </div>
              
              {dayClasses.length > 0 && (
                <div className="fitness-day-indicators">
                  {dayClasses.slice(0, 3).map((classItem, idx) => (
                    <div
                      key={classItem.id}
                      className="fitness-class-dot"
                      style={{
                        backgroundColor: getClassColor(classItem)
                      }}
                      title={`${classItem.class_name} - ${formatTime(classItem.start_time)}`}
                    />
                  ))}
                  {dayClasses.length > 3 && (
                    <div className="fitness-more-classes-dot">
                      +{dayClasses.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="fitness-calendar-stats">
        <div className="fitness-stat-item">
          <span className="fitness-stat-label">Всего занятий в месяце:</span>
          <span className="fitness-stat-value">
            {classes.filter(classItem => {
              const classDate = parseLocalDateTime(classItem.start_time);
              return classDate && classDate.getMonth() === currentDate.getMonth() && 
                     classDate.getFullYear() === currentDate.getFullYear();
            }).length}
          </span>
        </div>
      </div>

      <div className="fitness-calendar-legend">
        <div className="fitness-legend-item">
          <div className="fitness-legend-color fitness-today-color"></div>
          <span>Сегодня</span>
        </div>
        <div className="fitness-legend-item">
          <div className="fitness-legend-color fitness-has-classes-color"></div>
          <span>Есть занятия</span>
        </div>
        <div className="fitness-legend-item">
          <div className="fitness-legend-color fitness-other-month-color"></div>
          <span>Другой месяц</span>
        </div>
      </div>

      {showDayModal && selectedModalDate && (
        <div className="fitness-modal-overlay" onClick={() => setShowDayModal(false)}>
          <div className="fitness-day-classes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fitness-modal-header">
              <h3>Занятия на {formatModalDate(selectedModalDate)}</h3>
              <button 
                className="fitness-modal-close"
                onClick={() => setShowDayModal(false)}
              >
                <div className="fitness-close-icon"></div>
              </button>
            </div>
            
            <div className="fitness-modal-content">
              <div className="fitness-classes-count">
                {selectedDayClasses.length} {
                  selectedDayClasses.length === 1 ? 'занятие' : 
                  selectedDayClasses.length < 5 ? 'занятия' : 'занятий'
                }
              </div>
              
              <div className="fitness-modal-classes-list">
                {selectedDayClasses.map(classItem => (
                  <div 
                    key={classItem.id}
                    className="fitness-modal-class-item"
                    onClick={() => {
                      if (onClassClick) {
                        onClassClick(classItem);
                      }
                      setShowDayModal(false);
                    }}
                  >
                    <div className="fitness-class-time-range">
                      <span className="fitness-time-start">{formatTime(classItem.start_time)}</span>
                      <span className="fitness-time-separator">—</span>
                      <span className="fitness-time-end">{formatTime(classItem.end_time)}</span>
                      <span className="fitness-duration">
                        ({calculateDuration(classItem.start_time, classItem.end_time)})
                      </span>
                    </div>
                    
                    <div className="fitness-class-info">
                      <h4 className="fitness-class-title">{classItem.class_name}</h4>
                      {classItem.trainer && (
                        <p className="fitness-class-trainer">Тренер: {classItem.trainer}</p>
                      )}
                      {classItem.category && (
                        <span className="fitness-class-category-badge">{classItem.category}</span>
                      )}
                    </div>
                    
                    <div className="fitness-class-meta">
                      <div className="fitness-class-capacity">
                        {classItem.booked || 0} / {classItem.capacity} мест
                      </div>
                      <div className="fitness-class-price">
                        {parseFloat(classItem.price).toFixed(0)} ₽
                      </div>
                    </div>
                    
                    <div 
                      className="fitness-class-color-indicator"
                      style={{ backgroundColor: getClassColor(classItem) }}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="fitness-modal-footer">
              <button 
                className="fitness-btn fitness-btn-secondary"
                onClick={() => {
                  if (onDateClick) {
                    onDateClick(selectedModalDate);
                  }
                  setShowDayModal(false);
                }}
              >
                Перейти к списку
              </button>
              <button 
                className="fitness-btn fitness-btn-primary"
                onClick={() => setShowDayModal(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleCalendar;
