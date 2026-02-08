import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { format, isSameDay, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import 'react-datepicker/dist/react-datepicker.css';

const MultipleDatePicker = ({ selectedDates, onChange }) => {
  const [dates, setDates] = useState(
    selectedDates.map(dateStr => parseISO(dateStr))
  );

  const handleChange = (date) => {
    let newDates;
    const dateExists = dates.some(d => isSameDay(d, date));
    
    if (dateExists) {
      newDates = dates.filter(d => !isSameDay(d, date));
    } else {
      newDates = [...dates, date];
    }
    
    setDates(newDates);
    
    // Конвертируем даты в строки формата ISO
    const formattedDates = newDates.map(d => 
      format(d, 'yyyy-MM-dd')
    ).sort();
    
    onChange(formattedDates);
  };

  return (
    <div className="multiple-date-picker">
      <div className="date-picker-container">
        <DatePicker
          selected={new Date()}
          onChange={(date) => handleChange(date)}
          inline
          highlightDates={dates}
          dateFormat="dd.MM.yyyy"
          locale="ru"
          monthsShown={1}
        />
      </div>
      
      <div className="selected-dates">
        <div className="selected-dates-title">Выбранные даты:</div>
        <div className="selected-dates-list">
          {dates.length > 0 ? dates.map((date, index) => (
            <span key={index} className="selected-date-tag">
              {format(date, 'dd.MM.yyyy')}
              <button 
                className="remove-date-btn" 
                onClick={() => handleChange(date)}
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

export default MultipleDatePicker;