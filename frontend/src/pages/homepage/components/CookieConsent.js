import React, { useState, useEffect } from 'react';
import './CookieConsent.css';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Проверяем, согласился ли пользователь ранее
    const hasConsented = localStorage.getItem('cookieConsent');
    if (!hasConsented) {
      // Показываем уведомление через небольшую задержку для плавности
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    // Сохраняем согласие в localStorage
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fh-cookie-consent">
      <div className="fh-cookie-consent__content">
        <div className="fh-cookie-consent__text">
          Мы используем куки для улучшения работы сайта
        </div>
        <button 
          className="fh-cookie-consent__button"
          onClick={handleAccept}
        >
          Понятно
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;