import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

const ScheduleCalendar = ({ classes, templates, onClassClick, onDateClick }) => {
  const [calendarView, setCalendarView] = useState('month'); // 'month' или 'week'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredClass, setHoveredClass] = useState(null);
  
  // Получаем первый день месяца
  const firstDayOfMonth = useMemo(() => {
    const date = new Date(currentDate);
    date.setDate(1);
    return date;
  }, [currentDate]);
  
  // Получаем день недели первого дня месяца (0 - воскресенье, 6 - суббота)
  const firstDayOfWeek = useMemo(() => {
    return firstDayOfMonth.getDay();
  }, [firstDayOfMonth]);
  
  // Получаем количество дней в месяце
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    return new Date(year, month, 0).getDate();
  }, [currentDate]);
  
  // Получаем массив дат для месяца
  const monthDays = useMemo(() => {
    const days = [];
    
    // Добавляем дни предыдущего месяца для заполнения первой недели
    const prevMonthDays = firstDayOfWeek;
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const date = new Date(firstDayOfMonth);
      date.setDate(date.getDate() - (i + 1));
      days.push({
        date,
        isCurrentMonth: false
      });
    }
    
    // Добавляем дни текущего месяца
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      days.push({
        date,
        isCurrentMonth: true
      });
    }
    
    // Добавляем дни следующего месяца для заполнения последней недели
    const totalDays = days.length;
    const remainingDays = totalDays % 7 ? 7 - (totalDays % 7) : 0;
    
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      days.push({
        date,
        isCurrentMonth: false
      });
    }
    
    return days;
  }, [firstDayOfMonth, firstDayOfWeek, daysInMonth, currentDate]);
  
  // Получаем массив дат для недельного представления
  const weekDays = useMemo(() => {
    const days = [];
    const firstDayOfWeek = new Date(currentDate);
    
    // Получаем первый день недели (воскресенье)
    const day = currentDate.getDay();
    firstDayOfWeek.setDate(currentDate.getDate() - day);
    
    // Создаем массив дат для недели
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + i);
      days.push({
        date,
        isCurrentMonth: date.getMonth() === currentDate.getMonth()
      });
    }
    
    return days;
  }, [currentDate]);
  
  // Получаем классы для конкретной даты
  const getClassesForDate = (date) => {
    return classes.filter(classItem => {
      const classDate = new Date(classItem.start_time);
      return (
        classDate.getFullYear() === date.getFullYear() &&
        classDate.getMonth() === date.getMonth() &&
        classDate.getDate() === date.getDate()
      );
    });
  };
  
  // Получаем цвет для класса (используем цвет шаблона или стандартный)
  const getClassColor = (classItem) => {
    if (classItem.color) return classItem.color;
    
    // Если у класса нет цвета, ищем соответствующий шаблон
    const classTemplate = templates.find(
      template => template.class_name === classItem.class_name
    );
    
    return classTemplate ? classTemplate.color : '#F8A284';
  };
  
  // Форматирование времени
  const formatTime = (isoTime) => {
    if (!isoTime) return '';
    const date = new Date(isoTime);
    return date.toTimeString().substring(0, 5); // Получаем "HH:MM"
  };

  // Перемещение к предыдущему месяцу/неделе
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  // Перемещение к следующему месяцу/неделе
  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // Возврат к сегодняшнему дню
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Отображение названия месяца и года
  const calendarTitle = () => {
    if (calendarView === 'month') {
      return currentDate.toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric'
      });
    } else {
      const firstDay = weekDays[0].date;
      const lastDay = weekDays[6].date;
      
      // Если неделя находится в одном месяце
      if (firstDay.getMonth() === lastDay.getMonth()) {
        return `${firstDay.getDate()} - ${lastDay.getDate()} ${firstDay.toLocaleDateString('ru-RU', { month: 'long' })}`;
      } 
      // Если неделя находится на стыке месяцев
      else {
        return `${firstDay.getDate()} ${firstDay.toLocaleDateString('ru-RU', { month: 'long' })} - ${lastDay.getDate()} ${lastDay.toLocaleDateString('ru-RU', { month: 'long' })}`;
      }
    }
  };

  return (
    <div className="schedule-calendar">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button onClick={handlePrevious}>&lt;</button>
          <button onClick={handleToday}>Сегодня</button>
          <button onClick={handleNext}>&gt;</button>
        </div>
        <h3>{calendarTitle()}</h3>
        <div className="calendar-view-toggle">
          <button 
            className={calendarView === 'month' ? 'active' : ''} 
            onClick={() => setCalendarView('month')}
          >
            Месяц
          </button>
          <button 
            className={calendarView === 'week' ? 'active' : ''} 
            onClick={() => setCalendarView('week')}
          >
            Неделя
          </button>
        </div>
      </div>
      
      {calendarView === 'month' && (
        <div className="month-view">
          <div className="calendar-days-header">
            {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
              <div key={day} className="day-header">{day}</div>
            ))}
          </div>
          <div className="calendar-grid">
            {monthDays.map((day, index) => {
              const dayClasses = getClassesForDate(day.date);
              const isToday = new Date().toDateString() === day.date.toDateString();
              
              return (
                <div 
                  key={index} 
                  className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => onDateClick(day.date)}
                >
                  <div className="day-number">{day.date.getDate()}</div>
                  <div className="day-classes">
                    {dayClasses.slice(0, 3).map(classItem => (
                      <div 
                        key={classItem.id}
                        className="calendar-class-item"
                        style={{ backgroundColor: getClassColor(classItem) }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onClassClick(classItem);
                        }}
                        onMouseEnter={() => setHoveredClass(classItem)}
                        onMouseLeave={() => setHoveredClass(null)}
                      >
                        {formatTime(classItem.start_time)} {classItem.class_name}
                      </div>
                    ))}
                    {dayClasses.length > 3 && (
                      <div className="more-classes">+ еще {dayClasses.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {calendarView === 'week' && (
        <div className="week-view">
          <div className="week-header">
            <div className="time-column"></div>
            {weekDays.map((day, index) => {
              const isToday = new Date().toDateString() === day.date.toDateString();
              return (
                <div 
                  key={index} 
                  className={`day-column-header ${isToday ? 'today' : ''}`}
                  onClick={() => onDateClick(day.date)}
                >
                  <div className="weekday">{day.date.toLocaleDateString('ru-RU', { weekday: 'short' })}</div>
                  <div className="date">{day.date.getDate()}</div>
                </div>
              );
            })}
          </div>
          
          <div className="week-grid">
            <div className="time-slots">
              {Array.from({ length: 15 }, (_, i) => i + 7).map(hour => (
                <div key={hour} className="time-slot">
                  <div className="hour-label">{`${hour}:00`}</div>
                </div>
              ))}
            </div>
            
            {weekDays.map((day, dayIndex) => {
              const dayClasses = getClassesForDate(day.date);
              return (
                <div key={dayIndex} className="day-column">
                  {dayClasses.map(classItem => {
                    const startTime = new Date(classItem.start_time);
                    const endTime = new Date(classItem.end_time);
                    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
                    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
                    const duration = endHour - startHour;
                    
                    return (
                      <div 
                        key={classItem.id}
                        className="week-class-item"
                        style={{
                          top: `${(startHour - 7) * 60}px`,
                          height: `${duration * 60}px`,
                          backgroundColor: getClassColor(classItem)
                        }}
                        onClick={() => onClassClick(classItem)}
                        onMouseEnter={() => setHoveredClass(classItem)}
                        onMouseLeave={() => setHoveredClass(null)}
                      >
                        <div className="class-time">{formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}</div>
                        <div className="class-name">{classItem.class_name}</div>
                        <div className="class-trainer">{classItem.trainer}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {hoveredClass && (
        <div className="class-tooltip" style={{ 
          left: `${window.event.clientX + 10}px`,
          top: `${window.event.clientY + 10}px`
        }}>
          <h4>{hoveredClass.class_name}</h4>
          <p>Тренер: {hoveredClass.trainer}</p>
          <p>Время: {formatTime(hoveredClass.start_time)} - {formatTime(hoveredClass.end_time)}</p>
          <p>Занято: {hoveredClass.booked}/{hoveredClass.capacity}</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleCalendar;