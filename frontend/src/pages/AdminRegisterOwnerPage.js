import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import './AdminRegisterOwnerPage.css';

const AdminRegisterOwnerPage = () => {
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const redirectToClub = queryParams.get('redirect') === 'club';
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value
    });
  };
  
  const validateForm = () => {
    // Проверка обязательных полей
    const requiredFields = {
      'Имя': userData.first_name,
      'Фамилия': userData.last_name,
      'Email': userData.email,
      'Пароль': userData.password,
      'Подтверждение пароля': userData.confirm_password
    };
    
    for (const [fieldName, value] of Object.entries(requiredFields)) {
      if (!value || value.trim() === '') {
        setError(`Поле "${fieldName}" обязательно для заполнения`);
        return false;
      }
    }
    
    // Проверка email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      setError('Некорректный email адрес');
      return false;
    }
    
    // Проверка пароля
    if (userData.password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов');
      return false;
    }
    
    // Проверка совпадения паролей
    if (userData.password !== userData.confirm_password) {
      setError('Пароли не совпадают');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🚀 Создаем пользователя-владельца:', userData);
      
      // Создание только пользователя
      const ownerData = {
        first_name: userData.first_name.trim(),
        last_name: userData.last_name.trim(),
        email: userData.email.trim(),
        phone: userData.phone.trim(),
        password: userData.password,
        role: 'owner' // Указываем, что это владелец
      };
      
      // Используем обычный роут создания пользователя
      const response = await api.admin.createUser(ownerData);
      
      console.log('✅ Пользователь-владелец создан:', response);
      
      setSuccess(`Аккаунт владельца "${response.user.full_name}" успешно создан!`);
      
      // Очищаем форму
      setUserData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: ''
      });
      
      // Если перенаправление на создание клуба
      if (redirectToClub) {
        setTimeout(() => {
          navigate('/admin/clubs/register', { 
            state: { 
              ownerId: response.user.id,
              ownerName: response.user.full_name 
            } 
          });
        }, 1500);
      } else {
        // Иначе возвращаемся на панель администратора
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error('❌ Ошибка создания владельца:', err);
      setError(err.message || 'Ошибка при создании аккаунта владельца');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="admin-register-owner-page">
      <div className="admin-back-nav">
        <Link to={redirectToClub ? '/admin/clubs/register' : '/admin/dashboard'}>
          ← Вернуться назад
        </Link>
      </div>
      
      <div className="admin-page-title">
        <h1>Создание аккаунта владельца клуба</h1>
        <p>Создайте учетную запись для владельца спортивного клуба</p>
        {redirectToClub && (
          <div className="step-indicator">
            <span className="step active">1. Создание владельца</span>
            <span className="step-arrow">→</span>
            <span className="step">2. Регистрация клуба</span>
          </div>
        )}
      </div>
      
      {error && <div className="admin-error-message">{error}</div>}
      {success && <div className="admin-success-message">{success}</div>}
      
      <form className="admin-register-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>👤 Личная информация</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">Имя *</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={userData.first_name}
                onChange={handleInputChange}
                required
                placeholder="Введите имя"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="last_name">Фамилия *</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={userData.last_name}
                onChange={handleInputChange}
                required
                placeholder="Введите фамилию"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={userData.email}
                onChange={handleInputChange}
                required
                placeholder="example@gmail.com"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Телефон</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={userData.phone}
                onChange={handleInputChange}
                placeholder="+7 (999) 123-45-67"
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2>🔐 Учетные данные</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Пароль *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={userData.password}
                onChange={handleInputChange}
                placeholder="Минимум 6 символов"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirm_password">Подтверждение пароля *</label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={userData.confirm_password}
                onChange={handleInputChange}
                placeholder="Повторите пароль"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate(redirectToClub ? '/admin/clubs/register' : '/admin/dashboard')}
          >
            Отмена
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Создание...' : redirectToClub ? 'Создать и продолжить' : 'Создать владельца'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminRegisterOwnerPage;