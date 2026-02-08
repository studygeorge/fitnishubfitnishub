import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

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
    
    // Очистка ошибки при изменении поля
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
      const result = await login({
        email: formData.email,
        password: formData.password,
        remember: formData.rememberMe
      });
      
      if (result.success) {
        // Успешный вход - перенаправляем пользователя
        navigate('/');
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
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    // В реальном приложении здесь была бы логика для входа в демо-режиме
    navigate('/');
  };

  return (
    <div className="fh-lp__page-wrapper">
      <div className="fh-lp__auth-container">
        <div className="fh-lp__header-section">
          <h1>Добро пожаловать в FitnesHub</h1>
          <p>Войдите в свой аккаунт и продолжайте заниматься</p>
        </div>
        
        {errors.general && (
          <div className="fh-lp__error-msg fh-lp__error-msg--general">{errors.general}</div>
        )}
        
        <form className="fh-lp__auth-form" onSubmit={handleSubmit}>
          <div className="fh-lp__input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Введите ваш email"
              className={errors.email ? 'fh-lp__input--error' : ''}
            />
            {errors.email && <span className="fh-lp__error-msg">{errors.email}</span>}
          </div>
          
          <div className="fh-lp__input-group">
            <label>Пароль</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Введите ваш пароль (только английские символы)"
              className={errors.password ? 'fh-lp__input--error' : ''}
            />
            {errors.password && <span className="fh-lp__error-msg">{errors.password}</span>}
          </div>
          
          <div className="fh-lp__form-options">
            <label className="fh-lp__checkbox-wrapper">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              Запомнить меня
            </label>
            <Link to="/forgot-password" className="fh-lp__forgot-link">Забыли пароль?</Link>
          </div>
          
          <button
            type="submit"
            className="fh-lp__submit-btn"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <div className="fh-lp__register-section">
          <p>Еще нет аккаунта? <Link to="/register">Создать аккаунт</Link></p>
        </div>
      </div>
      
      <div className="fh-lp__info-panel">
        <div className="fh-lp__info-content">
          <h2>Все виды спорта в одном месте</h2>
          <p>Выбирайте из сотен занятий и студий по всему городу</p>
          
          <div className="fh-lp__features-grid">
            <div className="fh-lp__feature-item">
              <div className="fh-lp__feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </div>
              <div className="fh-lp__feature-text">
                <h3>Найти подходящее занятие</h3>
                <p>Пилатес, РUМР, Бассейн, Танцы и многое другое</p>
              </div>
            </div>
            
            <div className="fh-lp__feature-item">
              <div className="fh-lp__feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              </div>
              <div className="fh-lp__feature-text">
                <h3>Один баланс для всех студий</h3>
                <p>Пополняйте счёт один раз и тратьте везде</p>
              </div>
            </div>
            
            <div className="fh-lp__feature-item">
              <div className="fh-lp__feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
              </div>
              <div className="fh-lp__feature-text">
                <h3>Записаться в несколько кликов</h3>
                <p>Выбирайте время и бронируйте места быстро</p>
              </div>
            </div>
            
            <div className="fh-lp__feature-item">
              <div className="fh-lp__feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
              </div>
              <div className="fh-lp__feature-text">
                <h3>Проверенные студии</h3>
                <p>Работаем только с лучшими клубами</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;