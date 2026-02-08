// src/club/components/templates/TemplateForm.js
import React from 'react';

const TemplateForm = ({ 
  newTemplate, 
  onTemplateChange, 
  onSubmit 
}) => {
  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}м`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`;
  };

  const colorOptions = [
    { value: '#FF6B35', label: 'Оранжевый' },
    { value: '#3B82F6', label: 'Голубой' },
    { value: '#10B981', label: 'Зеленый' },
    { value: '#EC4899', label: 'Розовый' },
    { value: '#8B5CF6', label: 'Фиолетовый' },
    { value: '#F59E0B', label: 'Желтый' },
    { value: '#EF4444', label: 'Красный' },
    { value: '#06B6D4', label: 'Бирюзовый' }
  ];

  return (
    <div className="template-form-card">
      <div className="template-form-header">
        <h3>🎯 Новый шаблон</h3>
        <p>Создайте шаблон для быстрого планирования занятий</p>
      </div>

      <form className="template-form-compact" onSubmit={onSubmit}>
        <div className="template-form-grid">
          <div className="template-input-group">
            <input
              type="text"
              name="template_name"
              value={newTemplate.template_name}
              onChange={onTemplateChange}
              placeholder="Название шаблона"
              className="template-input template-input-primary"
              required
            />
            <span className="template-input-icon">📝</span>
          </div>

          <div className="template-input-group">
            <input
              type="text"
              name="class_name"
              value={newTemplate.class_name}
              onChange={onTemplateChange}
              placeholder="Название занятия"
              className="template-input"
              required
            />
            <span className="template-input-icon">🏃‍♀️</span>
          </div>

          <div className="template-select-group">
            <select
              name="category"
              value={newTemplate.category}
              onChange={onTemplateChange}
              className="template-select"
            >
              <option value="">📂 Категория</option>
              <option value="Йога">🧘‍♀️ Йога</option>
              <option value="Фитнес">💪 Фитнес</option>
              <option value="Силовые тренировки">🏋️‍♂️ Силовые</option>
              <option value="Кардио">❤️ Кардио</option>
              <option value="Групповые занятия">👥 Групповые</option>
              <option value="Танцы">💃 Танцы</option>
              <option value="Боевые искусства">🥊 Единоборства</option>
              <option value="Плавание">🏊‍♂️ Плавание</option>
              <option value="Другое">🎯 Другое</option>
            </select>
          </div>

          <div className="template-input-group">
            <input
              type="text"
              name="trainer"
              value={newTemplate.trainer}
              onChange={onTemplateChange}
              placeholder="Тренер"
              className="template-input"
            />
            <span className="template-input-icon">👨‍💼</span>
          </div>

          <div className="template-duration-group">
            <div className="template-duration-header">
              <span className="template-duration-icon">⏱️</span>
              <span className="template-duration-value">{formatDuration(newTemplate.duration)}</span>
            </div>
            <input
              type="range"
              name="duration"
              value={newTemplate.duration}
              onChange={onTemplateChange}
              min="30"
              max="180"
              step="15"
              className="template-duration-slider"
            />
          </div>

          <div className="template-number-group">
            <div className="template-number-input">
              <span className="template-number-icon">👥</span>
              <input
                type="number"
                name="capacity"
                value={newTemplate.capacity}
                onChange={onTemplateChange}
                min="1"
                max="100"
                placeholder="Мест"
                className="template-number"
                required
              />
            </div>
          </div>

          <div className="template-number-group">
            <div className="template-number-input">
              <span className="template-number-icon">💰</span>
              <input
                type="number"
                name="price"
                value={newTemplate.price}
                onChange={onTemplateChange}
                min="0"
                step="50"
                placeholder="Цена ₽"
                className="template-number"
                required
              />
            </div>
          </div>

          <div className="template-color-group">
            <div className="template-color-header">
              <span>🎨 Цвет</span>
            </div>
            <div className="template-color-grid">
              {colorOptions.map(option => (
                <label
                  key={option.value}
                  className={`template-color-option ${newTemplate.color === option.value ? 'selected' : ''}`}
                  title={option.label}
                >
                  <input
                    type="radio"
                    name="color"
                    value={option.value}
                    checked={newTemplate.color === option.value}
                    onChange={onTemplateChange}
                  />
                  <div 
                    className="template-color-swatch"
                    style={{ backgroundColor: option.value }}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="template-textarea-group">
          <textarea
            name="description"
            value={newTemplate.description}
            onChange={onTemplateChange}
            placeholder="💬 Описание занятия (необязательно)"
            className="template-textarea"
            rows="2"
          />
        </div>

        <div className="template-form-actions">
          <button type="submit" className="template-btn template-btn-create">
            <span>✨</span>
            Создать шаблон
          </button>
          <button 
            type="button" 
            className="template-btn template-btn-reset"
            onClick={() => {
              const resetEvent = (name, value) => ({
                target: { name, value }
              });
              
              onTemplateChange(resetEvent('template_name', ''));
              onTemplateChange(resetEvent('class_name', ''));
              onTemplateChange(resetEvent('duration', 60));
              onTemplateChange(resetEvent('trainer', ''));
              onTemplateChange(resetEvent('capacity', 10));
              onTemplateChange(resetEvent('price', 500));
              onTemplateChange(resetEvent('category', ''));
              onTemplateChange(resetEvent('description', ''));
              onTemplateChange(resetEvent('color', '#FF6B35'));
            }}
          >
            <span>🗑️</span>
            Очистить
          </button>
        </div>
      </form>
    </div>
  );
};

export default TemplateForm;