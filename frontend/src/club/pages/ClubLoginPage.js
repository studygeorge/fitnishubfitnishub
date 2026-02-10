// ClubLoginPage.js - Clean Modern Design
import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useClub } from '../contexts/ClubContext';
import '../styles/club-auth.css';

const ClubLoginPage = () => {
  const { login, isAuthenticated, loading } = useClub();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    agreeToPartnerOffer: false
  });
  const [errors, setErrors] = useState({});
  const [loginLoading, setLoginLoading] = useState(false);
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/club/dashboard" replace />;
  }

  const hasRussianChars = (text) => {
    return /[а-яё]/i.test(text);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'password' && hasRussianChars(value)) {
      setErrors({
        ...errors,
        [name]: 'Пароль должен содержать только английские символы'
      });
      return;
    }
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
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
    
    if (!formData.agreeToPartnerOffer) {
      newErrors.agreeToPartnerOffer = 'Необходимо согласие с договором оферты';
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
      const result = await login({
        email: formData.email,
        password: formData.password,
        agreeToPartnerOffer: formData.agreeToPartnerOffer
      });
      
      if (result.success) {
        localStorage.setItem('partnerOfferAccepted', 'true');
        navigate('/club/dashboard');
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: 'Ошибка входа. Проверьте данные и попробуйте снова.' });
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="club-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="club-auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">FH</div>
            <h1 className="auth-title">Вход для партнеров</h1>
            <p className="auth-subtitle">Управляйте вашим фитнес-клубом</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="club-alert club-alert-error">
                {errors.general}
              </div>
            )}

            <div className="auth-form-group">
              <label className="auth-label" htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="partner@example.com"
                className={`auth-input ${errors.email ? 'error' : ''}`}
                disabled={loginLoading}
              />
              {errors.email && (
                <span className="auth-error">{errors.email}</span>
              )}
            </div>

            <div className="auth-form-group">
              <label className="auth-label" htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Введите пароль"
                className={`auth-input ${errors.password ? 'error' : ''}`}
                disabled={loginLoading}
              />
              {errors.password && (
                <span className="auth-error">{errors.password}</span>
              )}
            </div>

            <div className="auth-checkbox-group">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  name="agreeToPartnerOffer"
                  checked={formData.agreeToPartnerOffer}
                  onChange={handleChange}
                  disabled={loginLoading}
                />
                <span>Я согласен с договором оферты партнеров</span>
              </label>
              {errors.agreeToPartnerOffer && (
                <span className="auth-error">{errors.agreeToPartnerOffer}</span>
              )}
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={loginLoading}
            >
              {loginLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Нет аккаунта? <Link to="/" className="auth-link">Вернуться на главную</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubLoginPage;
