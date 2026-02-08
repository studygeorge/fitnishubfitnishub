import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './ClubLoginPage.css';

const ClubLoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    agreeToTerms: false // Добавлено поле для согласия с условиями
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Очистка ошибки при изменении поля
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Введите email';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Неверный формат email';
      isValid = false;
    }
    
    if (!formData.password) {
      newErrors.password = 'Введите пароль';
      isValid = false;
    }
    
    // Проверка согласия с условиями
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Необходимо согласие с договором оферты';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Запрос на вход для клуба
      const response = await api.auth.clubLogin({
        email: formData.email,
        password: formData.password,
        agreeToTerms: formData.agreeToTerms // Отправляем информацию о согласии
      });
      
      // Сохраняем токен и информацию о клубе
      localStorage.setItem('clubToken', response.token);
      localStorage.setItem('clubId', response.clubId);
      localStorage.setItem('isClubOwner', 'true');
      localStorage.setItem('termsAccepted', 'true'); // Сохраняем информацию о согласии
      
      // Перенаправляем на панель управления клуба
      navigate('/club-dashboard');
    } catch (error) {
      setErrors({
        ...errors,
        general: error.message || 'Ошибка входа. Проверьте email и пароль.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="club-login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Вход для партнеров</h1>
          <p>Войдите в панель управления вашего клуба</p>
        </div>
        
        {errors.general && (
          <div className="error-message general">{errors.general}</div>
        )}
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Введите email клуба"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Введите пароль"
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          
          {/* Чекбокс для согласия с договором оферты */}
          <div className="form-group terms-agreement">
            <label className="checkbox-container terms-checkbox">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className={errors.agreeToTerms ? 'error' : ''}
              />
              <span className="checkmark"></span>
              <span className="terms-text">
                Соглашаюсь  с{' '}
                <a 
                  href="https://fitneshub.ru/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="terms-link"
                >
                  договором оферты
                </a>
              </span>
            </label>
            {errors.agreeToTerms && (
              <span className="error-message">{errors.agreeToTerms}</span>
            )}
          </div>
          
          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <span className="checkmark"></span>
              Запомнить меня
            </label>
            <Link to="/club-forgot-password" className="forgot-password">Забыли пароль?</Link>
          </div>
          
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти как партнер'}
          </button>
        </form>
        
        <div className="register-link">
          <p>Хотите стать партнером? <Link to="/club-register">Подать заявку</Link></p>
        </div>
        
        <div className="login-help">
          <p>Нужна помощь? <a href="#contact">Свяжитесь с нами</a></p>
        </div>
      </div>
    </div>
  );
};

export default ClubLoginPage;