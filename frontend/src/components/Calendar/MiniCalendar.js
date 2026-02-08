import React, { useState, useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

const MiniCalendar = ({ selectedDates, onDateSelect, month = new Date() }) => {
  const [currentMonth, setCurrentMonth] = useState(month);
  
  // Получаем первый день месяца
  const firstDayOfMonth = useMemo(() => {
    const date = new Date(currentMonth);
    date.setDate(1);
    return date;
  }, [currentMonth]);
  
  // Получаем день недели первого дня месяца (0 - воскресенье, 6 - суббота)
  const firstDayOfWeek = useMemo(() => {
    return firstDayOfMonth.getDay();
  }, [firstDayOfMonth]);
  
  // Получаем количество дней в месяце
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    return new Date(year, month, 0).getDate();
  }, [currentMonth]);
  
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
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      days.push({
        date,
        isCurrentMonth: true
      });
    }
    
    // Добавляем дни следующего месяца для заполнения последней недели
    const totalDays = days.length;
    const remainingDays = totalDays % 7 ? 7 - (totalDays % 7) : 0;
    
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i);
      days.push({
        date,
        isCurrentMonth: false
      });
    }
    
    return days;
  }, [firstDayOfMonth, firstDayOfWeek, daysInMonth, currentMonth]);
  
  // Проверяем, выбрана ли дата
  const isDateSelected = (date) => {
    return selectedDates.some(selectedDate => {
      return isSameDay(new Date(selectedDate), date);
    });
  };
  
  // Навигация по месяцам
  const prevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };
  
  const nextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };
  
  // Форматируем дату в строку ISO для хранения
  const formatDateToISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Обработчик выбора даты
  const handleDateClick = (date) => {
    const formattedDate = formatDateToISO(date);
    
    // Если дата уже выбрана, убираем её, иначе добавляем
    if (isDateSelected(date)) {
      onDateSelect(selectedDates.filter(d => d !== formattedDate));
    } else {
      onDateSelect([...selectedDates, formattedDate].sort());
    }
  };
  
  return (
    <div className="mini-calendar">
      <div className="mini-calendar-header">
        <button className="calendar-nav-btn" onClick={prevMonth}>&lt;</button>
        <div className="current-month">
          {format(currentMonth, 'LLLL yyyy', { locale: ru })}
        </div>
        <button className="calendar-nav-btn" onClick={nextMonth}>&gt;</button>
      </div>
      
      <div className="mini-calendar-days-header">
        {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
          <div key={day} className="day-header">{day}</div>
        ))}
      </div>
      
      <div className="mini-calendar-grid">
        {monthDays.map((day, index) => {
          const isToday = isSameDay(new Date(), day.date);
          const isSelected = isDateSelected(day.date);
          
          return (
            <div 
              key={index} 
              className={`mini-calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => handleDateClick(day.date)}
            >
              {day.date.getDate()}
            </div>
          );
        })}
      </div>
      
      <div className="selected-dates">
        <div className="selected-dates-title">Выбранные даты:</div>
        <div className="selected-dates-list">
          {selectedDates.length > 0 ? selectedDates.map((date, index) => (
            <span key={index} className="selected-date-tag">
              {format(new Date(date), 'dd.MM.yyyy')}
              <button 
                className="remove-date-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDateSelect(selectedDates.filter((_, i) => i !== index));
                }}
              >
                ×
              </button>
            </span>
          )) : (
            <span className="no-dates">Нет выбранных дат</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiniCalendar;