import React from 'react';
import { format } from 'date-fns';

const ClassList = ({ 
  classes, 
  onEditClass, 
  onDeleteClass, 
  formatTime, 
  selectedDate, 
  dateOptions, 
  onDateChange 
}) => {
  return (
    <div>
      <div className="schedule-actions">
        <div className="date-filter">
          <label>Выберите дату:</label>
          <select 
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
          >
            {dateOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="schedule-buttons">
          <button className="add-class-btn" onClick={() => document.querySelector('.add-class-form-container').scrollIntoView({ behavior: 'smooth' })}>
            + Добавить занятие
          </button>
        </div>
      </div>
      
      <div className="classes-table">
        <div className="table-header">
          <div className="th">Занятие</div>
          <div className="th">Время</div>
          <div className="th">Тренер</div>
          <div className="th">Вместимость</div>
          <div className="th">Записалось</div>
          <div className="th">Цена</div>
          <div className="th">Действия</div>
        </div>
        
        {classes.length > 0 ? (
          classes.map(classItem => (
            <div className="table-row" key={classItem.id}>
              <div className="td">{classItem.class_name}</div>
              <div className="td">
                {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
              </div>
              <div className="td">{classItem.trainer}</div>
              <div className="td">{classItem.capacity}</div>
              <div className="td">{classItem.booked}</div>
              <div className="td">{classItem.price} ₽</div>
              <div className="td actions">
                <button className="edit-btn" onClick={() => onEditClass(classItem.id)}>Изменить</button>
                <button className="delete-btn" onClick={() => onDeleteClass(classItem.id)}>Удалить</button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-schedule">На выбранную дату занятий не запланировано</div>
        )}
      </div>
    </div>
  );
};

export default ClassList;
