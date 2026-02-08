// src/club/components/dashboard/UpcomingClasses.js
import React from 'react';
import { Link } from 'react-router-dom';

const UpcomingClasses = ({ classes, loading }) => {
  if (loading) {
    return (
      <div className="fitness-dashboard-section">
        <div className="fitness-section-header">
          <h3>Занятия на сегодня</h3>
        </div>
        <div className="fitness-loading-placeholder">
          <div className="fitness-loading-spinner"></div>
          <p>Загрузка занятий...</p>
        </div>
      </div>
    );
  }

  console.log('UpcomingClasses получил classes:', classes?.map(c => ({
    id: c.id,
    name: c.class_name || c.name || c.title,
    start_time: c.start_time,
    trainer: c.trainer,
    capacity: c.capacity,
    booked: c.booked,
    price: c.price
  })));

  return (
    <div className="fitness-dashboard-section">
      <div className="fitness-section-header">
        <h3>Занятия на сегодня</h3>
      </div>

      {classes && classes.length > 0 ? (
        <div className="fitness-classes-list">
          {classes.map(classItem => (
            <div key={classItem.id} className="fitness-class-item">
              <div className="fitness-class-time">
                {new Date(classItem.start_time).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="fitness-class-info">
                {/* ИСПРАВЛЕНО: Проверяем разные поля для названия занятия */}
                <h4 className="fitness-class-name">
                  {classItem.class_name || classItem.name || classItem.title || 'Занятие без названия'}
                </h4>
                <p className="fitness-class-details">
                  Тренер: {classItem.trainer || 'Не указан'} • 
                  Свободно: {(classItem.capacity || 0) - (classItem.booked || 0)} из {classItem.capacity || 0}
                </p>
              </div>
              <div className="fitness-class-price">
                {classItem.price || 0} ₽
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="fitness-empty-state">
          <div className="fitness-empty-icon fitness-calendar-icon"></div>
          <h4>Нет занятий на сегодня</h4>
          <p>Добавьте занятия в расписание</p>
          <Link to="/club/schedule" className="fitness-btn fitness-btn-primary">
            Добавить занятие
          </Link>
        </div>
      )}
      
      {/* ОТЛАДОЧНАЯ ИНФОРМАЦИЯ для разработки */}
      {process.env.NODE_ENV === 'development' && classes && (
        <div style={{
          background: '#f0f0f0',
          padding: '8px',
          margin: '8px 0',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'monospace'
        }}>
          <strong>🔍 Отладка UpcomingClasses:</strong><br/>
          Всего занятий: {classes.length}<br/>
          {classes.slice(0, 3).map((cl, i) => (
            <div key={i}>
              • ID: {cl.id}, Название: "{cl.class_name || cl.name || cl.title || 'НЕТ'}", 
              Время: {cl.start_time}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingClasses;