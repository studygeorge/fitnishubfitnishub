import React from 'react';

const OpeningHours = ({ formData, onOpeningHoursChange }) => {
  const days = [
    { key: 'monday', label: 'Понедельник' },
    { key: 'tuesday', label: 'Вторник' },
    { key: 'wednesday', label: 'Среда' },
    { key: 'thursday', label: 'Четверг' },
    { key: 'friday', label: 'Пятница' },
    { key: 'saturday', label: 'Суббота' },
    { key: 'sunday', label: 'Воскресенье' }
  ];

  const copyHours = (fromDay, toDay) => {
    const fromHours = formData.opening_hours[fromDay];
    if (fromHours) {
      onOpeningHoursChange(toDay, 'open', fromHours.open);
      onOpeningHoursChange(toDay, 'close', fromHours.close);
      onOpeningHoursChange(toDay, 'closed', fromHours.closed);
    }
  };

  const setWeekdayHours = () => {
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    weekdays.forEach(day => {
      onOpeningHoursChange(day, 'open', '09:00');
      onOpeningHoursChange(day, 'close', '22:00');
      onOpeningHoursChange(day, 'closed', false);
    });
  };

  const setWeekendHours = () => {
    const weekends = ['saturday', 'sunday'];
    weekends.forEach(day => {
      onOpeningHoursChange(day, 'open', '10:00');
      onOpeningHoursChange(day, 'close', '21:00');
      onOpeningHoursChange(day, 'closed', false);
    });
  };

  return (
    <div className="fitness-profile-hours">
      <h2>Режим работы</h2>
      <p>Укажите часы работы вашего клуба</p>

      <div className="fitness-hours-quick-actions">
        <button
          type="button"
          onClick={setWeekdayHours}
          className="fitness-btn fitness-btn-secondary fitness-btn-sm"
        >
          Будни 9:00-22:00
        </button>
        <button
          type="button"
          onClick={setWeekendHours}
          className="fitness-btn fitness-btn-secondary fitness-btn-sm"
        >
          Выходные 10:00-21:00
        </button>
      </div>

      <div className="fitness-hours-grid">
        {days.map(day => {
          const dayHours = formData.opening_hours[day] || {};
          return (
            <div key={day.key} className="fitness-day-hours">
              <div className="fitness-day-header">
                <span className="fitness-day-label">{day.label}</span>
                <label className="fitness-closed-toggle">
                  <input
                    type="checkbox"
                    checked={dayHours.closed || false}
                    onChange={(e) => onOpeningHoursChange(day.key, 'closed', e.target.checked)}
                  />
                  <span>Выходной</span>
                </label>
              </div>
              
              <div className={`fitness-hours-controls ${dayHours.closed ? 'disabled' : ''}`}>
                <div className="fitness-time-group">
                  <label>Открытие</label>
                  <input
                    type="time"
                    value={dayHours.open || '09:00'}
                    onChange={(e) => onOpeningHoursChange(day.key, 'open', e.target.value)}
                    disabled={dayHours.closed}
                  />
                </div>
                
                <span className="fitness-time-separator">—</span>
                
                <div className="fitness-time-group">
                  <label>Закрытие</label>
                  <input
                    type="time"
                    value={dayHours.close || '21:00'}
                    onChange={(e) => onOpeningHoursChange(day.key, 'close', e.target.value)}
                    disabled={dayHours.closed}
                  />
                </div>

                {day.key !== 'monday' && (
                  <button
                    type="button"
                    onClick={() => copyHours('monday', day.key)}
                    className="fitness-copy-hours-btn"
                    disabled={dayHours.closed}
                    title="Скопировать время с понедельника"
                  >
                    Как в ПН
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fitness-hours-preview">
        <h3>Предварительный просмотр</h3>
        <div className="fitness-hours-summary">
          {days.map(day => {
            const dayHours = formData.opening_hours[day.key] || {};
            return (
              <div key={day.key} className="fitness-hours-item">
                <span className="fitness-hours-day">{day.label}:</span>
                <span className="fitness-hours-time">
                  {dayHours.closed ? 
                    'Выходной' : 
                    `${dayHours.open || '09:00'} - ${dayHours.close || '21:00'}`
                  }
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OpeningHours;