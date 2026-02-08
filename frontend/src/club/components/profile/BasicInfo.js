import React from 'react';

const BasicInfo = ({ formData, onChange, validationErrors }) => {
  const categoryOptions = [
    { value: '', label: 'Выберите категорию' },
    { value: 'fitness', label: 'Фитнес-клуб' },
    { value: 'yoga', label: 'Йога-студия' },
    { value: 'gym', label: 'Тренажерный зал' },
    { value: 'pool', label: 'Бассейн' },
    { value: 'dance', label: 'Танцевальная студия' },
    { value: 'martial_arts', label: 'Боевые искусства' },
    { value: 'sports_complex', label: 'Спортивный комплекс' },
    { value: 'crossfit', label: 'CrossFit' },
    { value: 'pilates', label: 'Пилатес' },
    { value: 'other', label: 'Другое' }
  ];

  const calculateProfileCompleteness = () => {
    const fields = ['name', 'address', 'category', 'description', 'contact_phone', 'contact_email'];
    const filledFields = fields.filter(field => formData[field] && formData[field].trim());
    return Math.round((filledFields.length / fields.length) * 100);
  };

  return (
    <div className="fitness-profile-basic">
      <h2>Основная информация</h2>
      <p>Базовые данные о вашем клубе</p>

      <div className="fitness-form-row">
        <div className="fitness-form-group">
          <label htmlFor="name">Название клуба *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={onChange}
            placeholder="Введите название клуба"
            className={validationErrors.name ? 'error' : ''}
          />
          {validationErrors.name && (
            <span className="fitness-error-message">{validationErrors.name}</span>
          )}
        </div>

        <div className="fitness-form-group">
          <label htmlFor="category">Категория *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={onChange}
            className={validationErrors.category ? 'error' : ''}
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {validationErrors.category && (
            <span className="fitness-error-message">{validationErrors.category}</span>
          )}
        </div>
      </div>

      <div className="fitness-form-group">
        <label htmlFor="address">Адрес *</label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={onChange}
          placeholder="Введите полный адрес"
          className={validationErrors.address ? 'error' : ''}
        />
        {validationErrors.address && (
          <span className="fitness-error-message">{validationErrors.address}</span>
        )}
      </div>

      <div className="fitness-form-group">
        <label htmlFor="description">Описание клуба</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={onChange}
          placeholder="Расскажите о вашем клубе, услугах и особенностях"
          rows="4"
          className={validationErrors.description ? 'error' : ''}
        />
        <small className="fitness-form-help">
          Хорошее описание поможет клиентам лучше понять ваш клуб
        </small>
        {validationErrors.description && (
          <span className="fitness-error-message">{validationErrors.description}</span>
        )}
      </div>

      <div className="fitness-profile-stats">
        <h3>Статистика профиля</h3>
        <div className="fitness-stats-card">
          <div className="fitness-stats-progress">
            <div className="fitness-progress-bar">
              <div 
                className="fitness-progress-fill" 
                style={{ width: `${calculateProfileCompleteness()}%` }}
              ></div>
            </div>
            <span className="fitness-progress-text">
              {calculateProfileCompleteness()}% заполнено
            </span>
          </div>
          <p>Заполненность профиля влияет на видимость в поиске</p>
        </div>
      </div>
    </div>
  );
};

export default BasicInfo;