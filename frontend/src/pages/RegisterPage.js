import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './RegisterPage.css';

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+7',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth();

  // Функция проверки на русские символы
  const hasRussianChars = (text) => {
    return /[а-яё]/i.test(text);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Проверка для полей паролей
    if ((name === 'password' || name === 'confirmPassword') && hasRussianChars(value)) {
      setErrors({
        ...errors,
        [name]: 'Пароль должен содержать только латинские символы'
      });
      return; // Не обновляем значение поля
    }
    
    if (name === 'phone') {
      // Обеспечиваем, что номер всегда начинается с +7
      let phoneValue = value;
      if (!phoneValue.startsWith('+7')) {
        phoneValue = '+7' + phoneValue.replace(/^\+?7?/, '');
      }
      setFormData({
        ...formData,
        [name]: phoneValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
    
    // Очистка ошибки при изменении поля (только если нет русских символов)
    if (errors[name] && !(name === 'password' || name === 'confirmPassword' && hasRussianChars(value))) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateStep1 = () => {
    let isValid = true;
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Введите имя';
      isValid = false;
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Введите фамилию';
      isValid = false;
    }
    
    if (!formData.email) {
      newErrors.email = 'Введите email';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Неверный формат email';
      isValid = false;
    }
    
    if (!formData.phone || formData.phone === '+7') {
      newErrors.phone = 'Введите номер телефона';
      isValid = false;
    } else if (!/^\+7[0-9]{10}$/.test(formData.phone.replace(/[\s-()]/g, ''))) {
      newErrors.phone = 'Неверный формат телефона';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const validateStep2 = () => {
    let isValid = true;
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'Введите пароль';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен содержать минимум 8 символов';
      isValid = false;
    } else if (hasRussianChars(formData.password)) {
      newErrors.password = 'Пароль должен содержать только английские символы';
      isValid = false;
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Подтвердите пароль';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
      isValid = false;
    } else if (hasRussianChars(formData.confirmPassword)) {
      newErrors.confirmPassword = 'Пароль должен содержать только английские символы';
      isValid = false;
    }
    
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'Необходимо согласие с условиями';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      handleNextStep();
      return;
    }
    
    if (!validateStep2()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone
      };
      
      const result = await register(userData);
      
      if (result.success) {
        // Успешная регистрация - перенаправляем пользователя
        navigate('/');
      } else {
        // Ошибка регистрации
        setErrors({
          ...errors,
          general: result.error
        });
      }
    } catch (error) {
      setErrors({
        ...errors,
        general: 'Ошибка регистрации. Попробуйте позже.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fh-rp__page-wrapper">
      <div className="fh-rp__auth-container">
        <div className="fh-rp__header-section">
          <h1>Регистрация</h1>
          <p>Создайте аккаунт для доступа к FitnesHub</p>
        </div>
        
        {errors.general && (
          <div className="fh-rp__error-msg fh-rp__error-msg--general">{errors.general}</div>
        )}
        
        <div className="fh-rp__steps-indicator">
          <div className={`fh-rp__step-item ${step >= 1 ? 'fh-rp__step-item--active' : ''}`}>
            <div className="fh-rp__step-number">1</div>
            <div className="fh-rp__step-text">Личные данные</div>
          </div>
          <div className="fh-rp__step-connector"></div>
          <div className={`fh-rp__step-item ${step >= 2 ? 'fh-rp__step-item--active' : ''}`}>
            <div className="fh-rp__step-number">2</div>
            <div className="fh-rp__step-text">Безопасность</div>
          </div>
        </div>
        
        <form className="fh-rp__auth-form" onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="fh-rp__form-step">
              <div className="fh-rp__form-row">
                <div className="fh-rp__input-group">
                  <label>Имя</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Имя"
                    className={errors.firstName ? 'fh-rp__input--error' : ''}
                  />
                  {errors.firstName && <span className="fh-rp__error-msg">{errors.firstName}</span>}
                </div>
                <div className="fh-rp__input-group">
                  <label>Фамилия</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Фамилия"
                    className={errors.lastName ? 'fh-rp__input--error' : ''}
                  />
                  {errors.lastName && <span className="fh-rp__error-msg">{errors.lastName}</span>}
                </div>
              </div>
              
              <div className="fh-rp__input-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Электронная почта"
                  className={errors.email ? 'fh-rp__input--error' : ''}
                />
                {errors.email && <span className="fh-rp__error-msg">{errors.email}</span>}
              </div>
              
              <div className="fh-rp__input-group">
                <label>Телефон</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+7 (___) ___-__-__"
                  className={errors.phone ? 'fh-rp__input--error' : ''}
                />
                {errors.phone && <span className="fh-rp__error-msg">{errors.phone}</span>}
              </div>
              
              <div className="fh-rp__form-buttons">
                <button
                  type="button"
                  className="fh-rp__next-btn"
                  onClick={handleNextStep}
                >
                  Продолжить
                </button>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="fh-rp__form-step">
              <div className="fh-rp__input-group">
                <label>Пароль</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Минимум 8 символов (только английские)"
                  className={errors.password ? 'fh-rp__input--error' : ''}
                />
                {errors.password && <span className="fh-rp__error-msg">{errors.password}</span>}
              </div>
              
              <div className="fh-rp__input-group">
                <label>Подтверждение пароля</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Повторите пароль"
                  className={errors.confirmPassword ? 'fh-rp__input--error' : ''}
                />
                {errors.confirmPassword && (
                  <span className="fh-rp__error-msg">{errors.confirmPassword}</span>
                )}
              </div>
              
              <div className="fh-rp__input-group fh-rp__input-group--terms">
                <label className="fh-rp__checkbox-wrapper">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                  />
                  <span className={errors.agreeTerms ? 'fh-rp__error-text' : ''}>
                    Соглашаюсь с <a href="/terms">условиями использования</a> и <a href="/privacy">политикой конфиденциальности</a>
                  </span>
                </label>
                {errors.agreeTerms && <span className="fh-rp__error-msg">{errors.agreeTerms}</span>}
              </div>
              
              <div className="fh-rp__form-buttons">
                <button
                  type="button"
                  className="fh-rp__back-btn"
                  onClick={handlePrevStep}
                >
                  Назад
                </button>
                <button
                  type="submit"
                  className="fh-rp__submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
              </div>
            </div>
          )}
        </form>
        
        <div className="fh-rp__login-section">
          <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
        </div>
      </div>
      
      <div className="fh-rp__info-panel">
        <div className="fh-rp__info-content">
          <h2>Преимущества регистрации в FitnesHub</h2>
          <p>Получите максимум от тренировок с нашей системой</p>
          
          <div className="fh-rp__features-grid">
            <div className="fh-rp__feature-item">
              <div className="fh-rp__feature-icon">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
              </div>
              <div className="fh-rp__feature-text">
                <h3>Единый доступ ко всем клубам</h3>
                <p>Посещайте любые спортивные залы в сети без дополнительной регистрации</p>
              </div>
            </div>
            
            <div className="fh-rp__feature-item">
              <div className="fh-rp__feature-icon">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                </svg>
              </div>
              <div className="fh-rp__feature-text">
                <h3>Удобные платежи через единый баланс</h3>
                <p>Пополняйте счет и используйте его для любых занятий в системе</p>
              </div>
            </div>
            
            <div className="fh-rp__feature-item">
              <div className="fh-rp__feature-icon">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
              </div>
              <div className="fh-rp__feature-text">
                <h3>Онлайн-запись на занятия</h3>
                <p>Бронируйте места на тренировки заранее через сайт или мобильное приложение</p>
              </div>
            </div>
            
            <div className="fh-rp__feature-item">
              <div className="fh-rp__feature-icon">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                </svg>
              </div>
              <div className="fh-rp__feature-text">
                <h3>Персональная статистика</h3>
                <p>Следите за своими тренировками, прогрессом и расходами</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;