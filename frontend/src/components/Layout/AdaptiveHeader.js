import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoImage from './logo.png';
import './AdaptiveHeader.css';

const AdaptiveHeader = ({ isMobile, onMenuClick, sidebarOpen }) => {
  const location = useLocation();
  const { user, logout, isAuthenticated, loading } = useAuth();
  
  // Локальное состояние баланса в хедере (обновляется только по событиям)
  const [headerBalance, setHeaderBalance] = useState(null);
  const [balanceUpdateTrigger, setBalanceUpdateTrigger] = useState(0);

  // Инициализация баланса при загрузке пользователя
  useEffect(() => {
    if (user && user.balance !== undefined && headerBalance === null) {
      setHeaderBalance(user.balance);
      console.log('📊 Инициализация баланса в хедере:', user.balance);
    }
  }, [user, headerBalance]);

  // Обработчик события обновления баланса
  const handleBalanceUpdate = useCallback((event) => {
    console.log('📢 Получен сигнал обновления баланса в хедере');
    
    let newBalance = null;
    
    // Если это кастомное событие с данными
    if (event.detail && event.detail.balance !== undefined) {
      newBalance = event.detail.balance;
    } 
    // Если это событие из localStorage
    else {
      const balanceData = localStorage.getItem('latestBalance');
      if (balanceData) {
        try {
          const parsed = JSON.parse(balanceData);
          newBalance = parsed.balance;
        } catch (err) {
          console.error('Ошибка парсинга баланса:', err);
          return;
        }
      }
    }
    
    if (newBalance !== null && newBalance !== headerBalance) {
      console.log('🎯 Обновляем баланс в хедере:', { old: headerBalance, new: newBalance });
      
      setHeaderBalance(newBalance);
      setBalanceUpdateTrigger(prev => prev + 1);
      
      console.log('✅ Баланс в хедере обновлен');
    }
  }, [headerBalance]);

  // Слушаем события обновления баланса (ТОЛЬКО события, никаких периодических запросов)
  useEffect(() => {
    // Слушаем кастомное событие для той же вкладки
    const handleCustomBalanceUpdate = (event) => {
      handleBalanceUpdate(event);
    };

    // Слушаем изменения localStorage для других вкладок
    const handleStorageChange = (event) => {
      if (event.key === 'latestBalance') {
        handleBalanceUpdate(event);
      }
    };

    window.addEventListener('balanceUpdated', handleCustomBalanceUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('balanceUpdated', handleCustomBalanceUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleBalanceUpdate]);

  if (isMobile) {
    return (
      <header className="fitness-adaptive-header fitness-mobile-header">
        <Link to="/" className="fitness-header-logo">
          <img 
            src={logoImage} 
            alt="FitnesHub" 
            className="fitness-logo-image"
          />
          <span className="fitness-logo-text">ФИТНЕСХАБ</span>
        </Link>
      </header>
    );
  }

  const navigationItems = [
    { path: '/', icon: 'home', label: 'Главная' },
    { path: '/clubs', icon: 'choose', label: 'Выбрать' },
    { path: '/schedule', icon: 'calendar', label: 'Расписание' },
    { path: '/profile', icon: 'profile', label: 'Профиль' },
  ];

  const additionalItems = isAuthenticated ? [
    { path: '/balance', icon: 'wallet', label: 'Баланс' },
  ] : [];

  const renderIcon = (iconType) => {
    const icons = {
      home: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      ),
      choose: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      calendar: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
        </svg>
      ),
      profile: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      ),
      wallet: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      ),
    };
    return icons[iconType] || icons.home;
  };

  // Определяем какой баланс показывать (приоритет у локального состояния хедера)
  const displayBalance = headerBalance !== null ? headerBalance : user?.balance;

  return (
    <header className="fitness-adaptive-header fitness-desktop-header">
      <div className="fitness-header-content">
        <Link to="/" className="fitness-header-logo">
          <img 
            src={logoImage} 
            alt="FitnesHub" 
            className="fitness-logo-image"
          />
          <span className="fitness-logo-text">ФИТНЕСХАБ</span>
        </Link>
        
        <nav className="fitness-header-navigation">
          <div className="fitness-nav-section">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`fitness-nav-item ${location.pathname === item.path ? 'fitness-active' : ''}`}
              >
                <span className="fitness-nav-icon">
                  {renderIcon(item.icon)}
                </span>
                <span className="fitness-nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
          
          {isAuthenticated && additionalItems.length > 0 && (
            <div className="fitness-nav-section fitness-additional">
              {additionalItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`fitness-nav-item ${location.pathname === item.path ? 'fitness-active' : ''}`}
                >
                  <span className="fitness-nav-icon">
                    {renderIcon(item.icon)}
                  </span>
                  <span className="fitness-nav-label">{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>
        
        <div className="fitness-header-actions">
          {loading ? (
            <div className="fitness-loading-user">
              <div className="fitness-loading-spinner"></div>
            </div>
          ) : isAuthenticated && user ? (
            <div className="fitness-user-section">
              <div className="fitness-user-info-compact">
                <div className="fitness-user-avatar-small">
                  {user.profile_image ? (
                    <img src={user.profile_image} alt={user.first_name} />
                  ) : (
                    user.first_name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div className="fitness-user-details">
                  <div className="fitness-user-name-small">
                    {user.first_name} {user.last_name}
                  </div>
                  {displayBalance !== undefined && (
                    <div 
                      className={`fitness-user-balance-small ${
                        balanceUpdateTrigger > 0 ? 'balance-updated' : ''
                      }`}
                      key={`header-balance-${displayBalance}-${balanceUpdateTrigger}`}
                    >
                      {parseFloat(displayBalance).toLocaleString()} ₽
                    </div>
                  )}
                </div>
              </div>
              <button 
                className="fitness-logout-btn-small"
                onClick={logout}
                title="Выйти"
              >
                Выйти
              </button>
            </div>
          ) : (
            <div className="fitness-auth-buttons">
              <Link to="/login" className="fitness-auth-btn fitness-login-btn">Войти</Link>
              <Link to="/register" className="fitness-auth-btn fitness-register-btn">Регистрация</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdaptiveHeader;