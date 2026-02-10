import React, { useState, useMemo } from 'react';
import './Calendar.css';

const Calendar = ({ 
  classes = [],
  selectedDate,
  onDateSelect,
  minDate,
  maxDate 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  
  // Получение дней месяца для календаря
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Первый день месяца
    const firstDay = new Date(year, month, 1);
    // Последний день месяца
    const lastDay = new Date(year, month + 1, 0);
    
    // День недели первого дня (0 = воскресенье, переводим в понедельник = 0)
    let firstDayWeek = firstDay.getDay();
    firstDayWeek = firstDayWeek === 0 ? 6 : firstDayWeek - 1;
    
    // Массив дней
    const days = [];
    
    // Предыдущий месяц
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }
    
    // Текущий месяц
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Следующий месяц
    const remainingDays = 42 - days.length; // 6 недель по 7 дней
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  }, [currentMonth]);
  
  // Подсчет занятий по датам
  const classCountByDate = useMemo(() => {
    const counts = {};
    classes.forEach(classItem => {
      const date = new Date(classItem.start_time);
      const dateStr = date.toISOString().split('T')[0];
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });
    return counts;
  }, [classes]);
  
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };
  
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const isSelected = (date) => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    return date.toDateString() === selected.toDateString();
  };
  
  const isDisabled = (date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };
  
  const getClassCount = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return classCountByDate[dateStr] || 0;
  };
  
  const handleDateClick = (date, isCurrentMonth) => {
    if (!isCurrentMonth || isDisabled(date)) return;
    if (onDateSelect) {
      onDateSelect(date);
    }
  };
  
  return (
    <div className="club-calendar">
      <div className="calendar-header">
        <button 
          className="calendar-nav-btn" 
          onClick={() => navigateMonth(-1)}
          type="button"
        >
          ‹
        </button>
        <div className="calendar-title">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button 
          className="calendar-nav-btn" 
          onClick={() => navigateMonth(1)}
          type="button"
        >
          ›
        </button>
      </div>
      
      <div className="calendar-weekdays">
        {weekDays.map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
      </div>
      
      <div className="calendar-days">
        {calendarDays.map((dayInfo, index) => {
          const { date, isCurrentMonth } = dayInfo;
          const classCount = getClassCount(date);
          
          return (
            <button
              key={index}
              type="button"
              className={`calendar-day 
                ${!isCurrentMonth ? 'other-month' : ''} 
                ${isToday(date) ? 'today' : ''} 
                ${isSelected(date) ? 'selected' : ''}
                ${isDisabled(date) ? 'disabled' : ''}
                ${classCount > 0 && isCurrentMonth ? 'has-classes' : ''}
              `.trim()}
              onClick={() => handleDateClick(date, isCurrentMonth)}
              disabled={isDisabled(date)}
            >
              <span className="calendar-day-number">{date.getDate()}</span>
              {classCount > 0 && isCurrentMonth && (
                <span className="calendar-day-dots">
                  {Array.from({ length: Math.min(classCount, 3) }).map((_, i) => (
                    <span key={i} className="calendar-dot"></span>
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
