import React from 'react';
import './AddClassForm.css';

const AddClassForm = ({ 
  newClass, 
  onInputChange, 
  onDateSelection, 
  onTimeChange, 
  onSubmit 
}) => {
  const handleTimeChange = (field, value) => {
    if (onTimeChange) {
      onTimeChange({ [field]: value });
    }
  };

  const handleDateChange = (e) => {
    const selectedDates = Array.from(e.target.selectedOptions, option => option.value);
    if (onDateSelection) {
      onDateSelection(selectedDates);
    }
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const value = date.toISOString().split('T')[0];
      const label = date.toLocaleDateString('ru-RU', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
      
      dates.push({ value, label });
    }
    
    return dates;
  };

  const dateOptions = generateDateOptions();
  
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeStr);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className="fitness-add-class-form">
      <div className="fitness-form-header">
        <h2>Добавить новое занятие</h2>
        <p>Заполните информацию о занятии</p>
      </div>

      <form onSubmit={onSubmit}>
        <div className="fitness-form-section">
          <h3>Основная информация</h3>
          <div className="fitness-form-grid">
            <div className="fitness-form-group">
              <label htmlFor="className">Название занятия *</label>
              <input
                type="text"
                id="className"
                name="className"
                value={newClass.className}
                onChange={onInputChange}
                placeholder="Например: Йога для начинающих"
                required
              />
            </div>

            <div className="fitness-form-group">
              <label htmlFor="category">Категория</label>
              <select
                id="category"
                name="category"
                value={newClass.category}
                onChange={onInputChange}
              >
                <option value="">Выберите категорию</option>
                <option value="Йога">Йога</option>
                <option value="Фитнес">Фитнес</option>
                <option value="Силовые тренировки">Силовые тренировки</option>
                <option value="Кардио">Кардио</option>
                <option value="Групповые занятия">Групповые занятия</option>
                <option value="Танцы">Танцы</option>
                <option value="Боевые искусства">Боевые искусства</option>
                <option value="Плавание">Плавание</option>
                <option value="Другое">Другое</option>
              </select>
            </div>

            <div className="fitness-form-group">
              <label htmlFor="trainer">Тренер</label>
              <input
                type="text"
                id="trainer"
                name="trainer"
                value={newClass.trainer}
                onChange={onInputChange}
                placeholder="Имя тренера"
              />
            </div>

            <div className="fitness-form-group">
              <label htmlFor="description">Описание</label>
              <textarea
                id="description"
                name="description"
                value={newClass.description}
                onChange={onInputChange}
                placeholder="Дополнительная информация о занятии"
                rows="3"
              />
            </div>
          </div>
        </div>

        <div className="fitness-form-section">
          <h3>Расписание</h3>
          <div className="fitness-form-grid">
            <div className="fitness-form-group fitness-span-full">
              <label htmlFor="dates">Даты проведения *</label>
              <select
                id="dates"
                multiple
                size="5"
                value={newClass.dates}
                onChange={handleDateChange}
                className="fitness-date-multiselect"
                required
              >
                {dateOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="fitness-form-help">
                Удерживайте Ctrl/Cmd для выбора нескольких дат
              </div>
            </div>

            <div className="fitness-form-group">
              <label htmlFor="startTime">Время начала *</label>
              <select
                id="startTime"
                name="startTime"
                value={newClass.startTime}
                onChange={(e) => {
                  onInputChange(e);
                  handleTimeChange('startTime', e.target.value);
                }}
                required
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="fitness-form-group">
              <label htmlFor="endTime">Время окончания *</label>
              <select
                id="endTime"
                name="endTime"
                value={newClass.endTime}
                onChange={(e) => {
                  onInputChange(e);
                  handleTimeChange('endTime', e.target.value);
                }}
                required
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="fitness-form-section">
          <h3>Параметры</h3>
          <div className="fitness-form-grid">
            <div className="fitness-form-group">
              <label htmlFor="capacity">Количество мест *</label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                value={newClass.capacity}
                onChange={onInputChange}
                min="1"
                max="100"
                required
              />
            </div>

            <div className="fitness-form-group">
              <label htmlFor="price">Цена (₽) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={newClass.price}
                onChange={onInputChange}
                min="0"
                step="50"
                required
              />
            </div>
          </div>
        </div>

        <div className="fitness-form-actions">
          <button type="submit" className="fitness-btn fitness-btn-primary fitness-btn-large">
            Создать занятие
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddClassForm;
