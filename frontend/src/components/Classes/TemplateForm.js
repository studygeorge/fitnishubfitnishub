import React from 'react';

const TemplateForm = ({ newTemplate, onTemplateChange, onSubmit }) => {
  return (
    <div className="new-template-form-container">
      <h3>Создать новый шаблон</h3>
      <form className="new-template-form" onSubmit={onSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Название шаблона</label>
            <input 
              type="text" 
              name="template_name"
              value={newTemplate.template_name}
              onChange={onTemplateChange}
              placeholder="Например: Утренняя йога" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Название занятия</label>
            <input 
              type="text" 
              name="class_name"
              value={newTemplate.class_name}
              onChange={onTemplateChange}
              placeholder="Название для отображения в расписании" 
              required 
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Длительность (минуты)</label>
            <input 
              type="number" 
              name="duration"
              value={newTemplate.duration}
              onChange={onTemplateChange}
              min="15"
              max="240"
              step="5" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Тренер</label>
            <input 
              type="text" 
              name="trainer"
              value={newTemplate.trainer}
              onChange={onTemplateChange}
              placeholder="Имя тренера" 
              required 
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Вместимость</label>
            <input 
              type="number" 
              name="capacity"
              value={newTemplate.capacity}
              onChange={onTemplateChange}
              min="1" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Цена (в рублях)</label>
            <input 
              type="number" 
              name="price"
              value={newTemplate.price}
              onChange={onTemplateChange}
              min="0" 
              required 
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Категория</label>
            <select 
              name="category"
              value={newTemplate.category}
              onChange={onTemplateChange}
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
          <div className="form-group">
            <label>Цвет шаблона</label>
            <input 
              type="color" 
              name="color"
              value={newTemplate.color}
              onChange={onTemplateChange}
              className="color-picker"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Описание</label>
          <textarea 
            name="description"
            value={newTemplate.description}
            onChange={onTemplateChange}
            placeholder="Краткое описание занятия"
          ></textarea>
        </div>
        
        <button type="submit" className="submit-template-btn">Создать шаблон</button>
      </form>
    </div>
  );
};

export default TemplateForm;