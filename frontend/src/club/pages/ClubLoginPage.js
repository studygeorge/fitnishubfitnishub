// src/club/pages/ClubLoginPage.js
import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useClub } from '../contexts/ClubContext';
import '../styles/club-auth.css';

const ClubLoginPage = () => {
  const { login, isAuthenticated, loading } = useClub();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    agreeToPartnerOffer: false // Добавлено поле для согласия с офертой партнеров
  });
  const [errors, setErrors] = useState({});
  const [loginLoading, setLoginLoading] = useState(false);
  const navigate = useNavigate();

  // Если уже авторизован, перенаправляем на дашборд
  if (isAuthenticated) {
    return <Navigate to="/club/dashboard" replace />;
  }

  // Функция проверки на русские символы (для пароля)
  const hasRussianChars = (text) => {
    return /[а-яё]/i.test(text);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Проверка для поля пароля
    if (name === 'password' && hasRussianChars(value)) {
      setErrors({
        ...errors,
        [name]: 'Пароль должен содержать только английские символы'
      });
      return; // Не обновляем значение поля
    }
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Очищаем ошибку при изменении поля
    if (errors[name] && !(name === 'password' && hasRussianChars(value))) {
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
    } else if (hasRussianChars(formData.password)) {
      newErrors.password = 'Пароль должен содержать только английские символы';
      isValid = false;
    }
    
    // Проверка согласия с договором оферты партнеров
    if (!formData.agreeToPartnerOffer) {
      newErrors.agreeToPartnerOffer = 'Необходимо согласие с договором оферты партнеров';
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

    setLoginLoading(true);
    setErrors({});

    try {
      // Используем объектный формат для передачи данных
      const result = await login({
        email: formData.email,
        password: formData.password,
        agreeToPartnerOffer: formData.agreeToPartnerOffer // Отправляем информацию о согласии
      });
      
      if (result.success) {
        // Сохраняем информацию о согласии с офертой партнеров
        localStorage.setItem('partnerOfferAccepted', 'true');
        
        // Успешный вход - перенаправляем на дашборд
        navigate('/club/dashboard');
      } else {
        // Ошибка входа
        setErrors({
          ...errors,
          general: result.error
        });
      }
    } catch (error) {
      setErrors({
        ...errors,
        general: 'Ошибка входа. Проверьте данные и попробуйте снова.'
      });
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="club-auth-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="club-auth-page">
      <div className="club-auth-container">
        <div className="club-auth-card">
          {/* Заголовок */}
          <div className="club-auth-header">
            <div className="club-auth-logo">
              <span className="logo-text">FitnesHub Partners</span>
            </div>
            <h1>Войдите в панель управления вашим клубом</h1>
          </div>

          {/* Форма */}
          <form className="club-auth-form" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="error-message">
                {errors.general}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Введите ваш email"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="field-error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Введите ваш пароль (только английские символы)"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="field-error-message">{errors.password}</span>}
            </div>

            {/* Блок для согласия с договором оферты партнеров */}
            <div className="form-group partner-agreement">
              <label className="checkbox-container partner-checkbox">
                <input
                  type="checkbox"
                  name="agreeToPartnerOffer"
                  checked={formData.agreeToPartnerOffer}
                  onChange={handleChange}
                  className={errors.agreeToPartnerOffer ? 'error' : ''}
                />
                <span className="checkmark"></span>
                <span className="partner-agreement-text">
                  Соглашаюсь с{' '}
                  <a 
                    href="/partner-agreement" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="partner-agreement-link"
                  >
                    договором оферты партнеров
                  </a>
                </span>
              </label>
              {errors.agreeToPartnerOffer && (
                <span className="field-error-message">{errors.agreeToPartnerOffer}</span>
              )}
            </div>

            <button 
              type="submit" 
              className="club-auth-btn"
              disabled={loginLoading}
            >
              {loginLoading ? 'Вход...' : 'Войти в панель'}
            </button>
          </form>

          {/* Дополнительные ссылки */}
          <div className="club-auth-footer">
            <p>Еще нет клуба на платформе?</p>
            <Link to="/club-register" className="club-auth-link">
              Зарегистрировать клуб
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubLoginPage;
