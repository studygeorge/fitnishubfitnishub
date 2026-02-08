import React from 'react';
import { MultipleDatePicker, TimeRangePicker } from '../Calendar';

const AddClassForm = ({ newClass, onInputChange, onDateSelection, onTimeChange, onSubmit }) => {
  return (
    <div className="add-class-form-container">
      <h3>Добавить занятие</h3>
      <form className="add-class-form" onSubmit={onSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Название занятия</label>
            <input 
              type="text" 
              name="className"
              value={newClass.className}
              onChange={onInputChange}
              placeholder="Например: Силовая тренировка" 
              required 
            />
          </div>
        </div>
        
        <div className="form-section">
          <h4>Выберите дату или даты занятий</h4>
          <MultipleDatePicker 
            selectedDates={newClass.dates}
            onChange={onDateSelection}
          />
        </div>
        
        <div className="form-section">
          <h4>Выберите время проведения</h4>
          <TimeRangePicker 
            startTime={newClass.startTime}
            endTime={newClass.endTime}
            onChange={onTimeChange}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Тренер</label>
            <input 
              type="text" 
              name="trainer"
              value={newClass.trainer}
              onChange={onInputChange}
              placeholder="Имя тренера" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Максимальное количество участников</label>
            <input 
              type="number" 
              name="capacity"
              value={newClass.capacity}
              onChange={onInputChange}
              min="1" 
              required 
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Цена (в рублях)</label>
            <input 
              type="number" 
              name="price"
              value={newClass.price}
              onChange={onInputChange}
              min="0" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Категория</label>
            <select 
              name="category"
              value={newClass.category}
              onChange={onInputChange}
              required
            >
              <option value="">Выберите категорию</option>
              <option value="strength">Силовые</option>
              <option value="cardio">Кардио</option>
              <option value="yoga">Йога</option>
              <option value="crossfit">Кроссфит</option>
              <option value="dance">Танцы</option>
              <option value="other">Другое</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Описание</label>
          <textarea 
            name="description"
            value={newClass.description}
            onChange={onInputChange}
            placeholder="Краткое описание занятия"
          ></textarea>
        </div>
        
        <div className="submit-area">
          <div className="selected-dates-summary">
            Будет создано {newClass.dates.length} занятий
          </div>
          <button type="submit" className="submit-class-btn">
            {newClass.dates.length > 1 
              ? `Добавить ${newClass.dates.length} занятий` 
              : 'Добавить занятие'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddClassForm;