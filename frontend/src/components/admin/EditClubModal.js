import React from 'react';
import './EditClubModal.css';

const EditClubModal = ({ 
  club, 
  clubForm, 
  setClubForm, 
  onSave, 
  onClose, 
  loading,
  owners,
  isAddMode = false  // Новый проп для режима добавления
}) => {
  // В режиме добавления club может быть null
  if (!isAddMode && !club) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(e);
  };

  return (
    <div className="edit-club-overlay" onClick={onClose}>
      <div className="edit-club-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-club-header">
          <h2>{isAddMode ? 'Добавление нового клуба' : 'Редактирование клуба'}</h2>
          <button 
            className="edit-club-close" 
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="edit-club-body">
            <div className="edit-club-form-row">
              <div className="edit-club-field">
                <label>Название клуба *</label>
                <input
                  type="text"
                  value={clubForm.name}
                  onChange={(e) => setClubForm({...clubForm, name: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <div className="edit-club-field">
                <label>Категория</label>
                <select
                  value={clubForm.category}
                  onChange={(e) => setClubForm({...clubForm, category: e.target.value})}
                  disabled={loading}
                >
                  <option value="">Выберите категорию</option>
                  <option value="fitness">Фитнес-клуб</option>
                  <option value="gym">Тренажерный зал</option>
                  <option value="yoga">Студия йоги</option>
                  <option value="swimming">Бассейн</option>
                  <option value="crossfit">Кроссфит</option>
                  <option value="dance">Танцевальная студия</option>
                  <option value="boxing">Бокс</option>
                  <option value="martial_arts">Боевые искусства</option>
                  <option value="other">Другое</option>
                </select>
              </div>
            </div>

            <div className="edit-club-form-row">
              <div className="edit-club-field edit-club-field-full">
                <label>Адрес *</label>
                <input
                  type="text"
                  value={clubForm.address}
                  onChange={(e) => setClubForm({...clubForm, address: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="edit-club-form-row">
              <div className="edit-club-field">
                <label>Контактный телефон</label>
                <input
                  type="tel"
                  value={clubForm.contact_phone}
                  onChange={(e) => setClubForm({...clubForm, contact_phone: e.target.value})}
                  disabled={loading}
                />
              </div>

              <div className="edit-club-field">
                <label>Email</label>
                <input
                  type="email"
                  value={clubForm.contact_email}
                  onChange={(e) => setClubForm({...clubForm, contact_email: e.target.value})}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="edit-club-form-row">
              <div className="edit-club-field">
                <label>Владелец *</label>
                <select
                  value={clubForm.owner_id}
                  onChange={(e) => setClubForm({...clubForm, owner_id: e.target.value})}
                  required
                  disabled={loading}
                >
                  <option value="">Выберите владельца</option>
                  {owners.map(owner => (
                    <option key={owner.id} value={owner.id}>
                      {owner.first_name} {owner.last_name} ({owner.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="edit-club-field">
                <label>Веб-сайт</label>
                <input
                  type="url"
                  value={clubForm.website}
                  onChange={(e) => setClubForm({...clubForm, website: e.target.value})}
                  placeholder="https://"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="edit-club-form-row">
              <div className="edit-club-field edit-club-field-full">
                <label>Описание</label>
                <textarea
                  value={clubForm.description}
                  onChange={(e) => setClubForm({...clubForm, description: e.target.value})}
                  rows="4"
                  disabled={loading}
                />
              </div>
            </div>

            {!isAddMode && club && (
              <div className="edit-club-info-box">
                <div className="edit-club-info-item">
                  <span className="edit-club-info-label">ID:</span>
                  <span className="edit-club-info-value">{club.id}</span>
                </div>
                <div className="edit-club-info-item">
                  <span className="edit-club-info-label">Дата создания:</span>
                  <span className="edit-club-info-value">
                    {new Date(club.created_at).toLocaleString('ru-RU')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="edit-club-footer">
            <button 
              type="button"
              className="edit-club-btn edit-club-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </button>
            <button 
              type="submit"
              className="edit-club-btn edit-club-btn-save"
              disabled={loading}
            >
              {loading ? 'Сохранение...' : (isAddMode ? 'Создать клуб' : 'Сохранить изменения')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClubModal;
