import React from 'react';

const TemplateList = ({ templates, onUseTemplate, onDeleteTemplate, formatDuration }) => {
  return (
    <div className="templates-grid">
      {templates.map(template => (
        <div 
          className="template-card"
          key={template.id}
          style={{ borderLeft: `5px solid ${template.color}` }}
        >
          <div className="template-header">
            <h4>{template.template_name}</h4>
            <div className="template-actions">
              <button 
                className="template-use-btn"
                onClick={() => onUseTemplate(template.id)}
                title="Создать занятие из шаблона"
              >
                Использовать
              </button>
              <button 
                className="template-delete-btn"
                onClick={() => onDeleteTemplate(template.id)}
                title="Удалить шаблон"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="template-details">
            <div className="template-info">
              <p className="template-class-name">{template.class_name}</p>
              <p className="template-trainer">Тренер: {template.trainer}</p>
              <p className="template-duration">
                Длительность: {formatDuration(template.duration)}
              </p>
            </div>
            <div className="template-stats">
              <div className="template-capacity">
                <span>Мест:</span> {template.capacity}
              </div>
              <div className="template-price">
                <span>Цена:</span> {template.price} ₽
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <div className="template-card add-template-card" onClick={() => {
        document.querySelector('.new-template-form-container').scrollIntoView({ behavior: 'smooth' });
      }}>
        <div className="add-template-icon">+</div>
        <p>Создать новый шаблон</p>
      </div>
    </div>
  );
};

export default TemplateList;