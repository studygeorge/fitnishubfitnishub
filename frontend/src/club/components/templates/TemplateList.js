// src/club/components/templates/TemplateList.js
import React from 'react';

const TemplateList = ({ 
  templates, 
  onUseTemplate, 
  onDeleteTemplate, 
  formatDuration 
}) => {
  return (
    <div className="template-list">
      <div className="templates-grid">
        {templates.map(template => (
          <div key={template.id} className="template-card">
            <div className="template-header">
              <h4 className="template-name">{template.template_name}</h4>
              <div className="template-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onUseTemplate(template.id)}
                  title="Создать занятие из шаблона"
                >
                  📅 Использовать
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => onDeleteTemplate(template.id)}
                  title="Удалить шаблон"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="template-details">
              <div className="template-class-name">
                <strong>Занятие:</strong> {template.class_name}
              </div>

              {template.category && (
                <div className="template-category">
                  <span className="category-badge">{template.category}</span>
                </div>
              )}

              <div className="template-info-grid">
                <div className="info-item">
                  <span className="info-label">Длительность:</span>
                  <span className="info-value">{formatDuration(template.duration)}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Места:</span>
                  <span className="info-value">{template.capacity}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Цена:</span>
                  <span className="info-value">{template.price} ₽</span>
                </div>

                {template.trainer && (
                  <div className="info-item">
                    <span className="info-label">Тренер:</span>
                    <span className="info-value">{template.trainer}</span>
                  </div>
                )}
              </div>

              {template.description && (
                <div className="template-description">
                  <p>{template.description}</p>
                </div>
              )}
            </div>

            <div 
              className="template-color-indicator"
              style={{ backgroundColor: template.color || '#F8A284' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateList;