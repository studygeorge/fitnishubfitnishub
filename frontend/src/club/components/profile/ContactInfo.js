import React from 'react';

const ContactInfo = ({ formData, onChange, onSocialMediaChange, validationErrors }) => {
  const handleSocialChange = (platform) => (e) => {
    onSocialMediaChange(platform, e.target.value);
  };

  return (
    <div className="fitness-profile-contact">
      <h2>Контактная информация</h2>
      <p>Способы связи с вашим клубом</p>

      <h3>Основные контакты</h3>
      <div className="fitness-form-row">
        <div className="fitness-form-group">
          <label htmlFor="contact_phone">Телефон *</label>
          <input
            type="tel"
            id="contact_phone"
            name="contact_phone"
            value={formData.contact_phone}
            onChange={onChange}
            placeholder="+7 (XXX) XXX-XX-XX"
            className={validationErrors.contact_phone ? 'error' : ''}
          />
          {validationErrors.contact_phone && (
            <span className="fitness-error-message">{validationErrors.contact_phone}</span>
          )}
        </div>

        <div className="fitness-form-group">
          <label htmlFor="contact_email">Email *</label>
          <input
            type="email"
            id="contact_email"
            name="contact_email"
            value={formData.contact_email}
            onChange={onChange}
            placeholder="info@yourclub.com"
            className={validationErrors.contact_email ? 'error' : ''}
          />
          {validationErrors.contact_email && (
            <span className="fitness-error-message">{validationErrors.contact_email}</span>
          )}
        </div>
      </div>

      <div className="fitness-form-group">
        <label htmlFor="website">Веб-сайт</label>
        <input
          type="url"
          id="website"
          name="website"
          value={formData.website}
          onChange={onChange}
          placeholder="https://yourclub.com"
          className={validationErrors.website ? 'error' : ''}
        />
        <small className="fitness-form-help">
          Укажите полную ссылку с https://
        </small>
        {validationErrors.website && (
          <span className="fitness-error-message">{validationErrors.website}</span>
        )}
      </div>

      <h3>Социальные сети</h3>
      <div className="fitness-form-row">
        <div className="fitness-form-group">
          <label htmlFor="instagram">Instagram</label>
          <input
            type="url"
            id="instagram"
            name="instagram"
            value={formData.social_media.instagram}
            onChange={handleSocialChange('instagram')}
            placeholder="https://instagram.com/yourclub"
          />
        </div>

        <div className="fitness-form-group">
          <label htmlFor="vkontakte">ВКонтакте</label>
          <input
            type="url"
            id="vkontakte"
            name="vkontakte"
            value={formData.social_media.vkontakte}
            onChange={handleSocialChange('vkontakte')}
            placeholder="https://vk.com/yourclub"
          />
        </div>
      </div>

      <div className="fitness-form-group">
        <label htmlFor="telegram">Telegram</label>
        <input
          type="url"
          id="telegram"
          name="telegram"
          value={formData.social_media.telegram}
          onChange={handleSocialChange('telegram')}
          placeholder="https://t.me/yourclub"
        />
      </div>

      <div className="fitness-contact-preview">
        <h3>Предварительный просмотр</h3>
        <div className="fitness-contact-card">
          <div className="fitness-contact-header">
            <h4>{formData.name || 'Название клуба'}</h4>
            <span className="fitness-contact-category">
              {formData.category || 'Категория не указана'}
            </span>
          </div>
          <div className="fitness-contact-content">
            {formData.contact_phone && (
              <div className="fitness-contact-item">
                <span className="fitness-contact-label">Телефон:</span>
                <span>{formData.contact_phone}</span>
              </div>
            )}
            {formData.contact_email && (
              <div className="fitness-contact-item">
                <span className="fitness-contact-label">Email:</span>
                <span>{formData.contact_email}</span>
              </div>
            )}
            {formData.website && (
              <div className="fitness-contact-item">
                <span className="fitness-contact-label">Сайт:</span>
                <span>{formData.website}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfo;
