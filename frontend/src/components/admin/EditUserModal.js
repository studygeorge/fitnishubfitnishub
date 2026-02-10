import React from 'react';
import './EditUserModal.css';

const EditUserModal = ({ 
  user, 
  userForm, 
  setUserForm, 
  onSave, 
  onClose, 
  loading 
}) => {
  if (!user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(e);
  };

  return (
    <div className="edit-user-overlay" onClick={onClose}>
      <div className="edit-user-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-user-header">
          <h2>Редактирование пользователя</h2>
          <button 
            className="edit-user-close" 
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="edit-user-body">
            <div className="edit-user-form-row">
              <div className="edit-user-field">
                <label>Имя *</label>
                <input
                  type="text"
                  value={userForm.first_name}
                  onChange={(e) => setUserForm({...userForm, first_name: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <div className="edit-user-field">
                <label>Фамилия</label>
                <input
                  type="text"
                  value={userForm.last_name}
                  onChange={(e) => setUserForm({...userForm, last_name: e.target.value})}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="edit-user-form-row">
              <div className="edit-user-field">
                <label>Email *</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <div className="edit-user-field">
                <label>Телефон</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="edit-user-form-row">
              <div className="edit-user-field">
                <label>Баланс (₽) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={userForm.balance}
                  onChange={(e) => setUserForm({...userForm, balance: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <div className="edit-user-field">
                <label>Новый пароль (минимум 6 символов)</label>
                <input
                  type="password"
                  value={userForm.new_password}
                  onChange={(e) => setUserForm({...userForm, new_password: e.target.value})}
                  placeholder="Оставьте пустым, чтобы не менять"
                  minLength="6"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="edit-user-info-box">
              <div className="edit-user-info-item">
                <span className="edit-user-info-label">ID:</span>
                <span className="edit-user-info-value">{user.id}</span>
              </div>
              <div className="edit-user-info-item">
                <span className="edit-user-info-label">Дата регистрации:</span>
                <span className="edit-user-info-value">
                  {new Date(user.created_at).toLocaleString('ru-RU')}
                </span>
              </div>
              <div className="edit-user-info-item">
                <span className="edit-user-info-label">Роль:</span>
                <span className="edit-user-info-value">
                  {user.is_admin ? 'Администратор' :
                   user.is_club_owner ? 'Владелец клуба' :
                   'Клиент'}
                </span>
              </div>
            </div>
          </div>

          <div className="edit-user-footer">
            <button 
              type="button"
              className="edit-user-btn edit-user-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </button>
            <button 
              type="submit"
              className="edit-user-btn edit-user-btn-save"
              disabled={loading}
            >
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
