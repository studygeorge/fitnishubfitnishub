// src/components/Layout/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = ({ className, isMobile, onClose }) => {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const navigationItems = [
    { path: '/', icon: '🏠', label: 'Главная' },
    { path: '/clubs', icon: '🏋️', label: 'Клубы' },
    { path: '/schedule', icon: '📅', label: 'Расписание' },
    { path: '/profile', icon: '👤', label: 'Профиль' }, // Всегда показываем профиль
  ];

  const additionalItems = isAuthenticated ? [
    { path: '/balance', icon: '💰', label: 'Баланс' },
  ] : [];

  return (
    <aside className={`sidebar ${className || ''}`}>
      {/* Заголовок сайдбара */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">💪</span>
          <span className="logo-text">FitnesHub</span>
        </div>
        {isMobile && (
          <button className="sidebar-close" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {/* Основная навигация */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3 className="nav-section-title">Навигация</h3>
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Дополнительная секция для авторизованных */}
        {isAuthenticated && additionalItems.length > 0 && (
          <div className="nav-section">
            <h3 className="nav-section-title">Аккаунт</h3>
            {additionalItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
            
            <button 
              className="nav-item logout-btn"
              onClick={() => {
                logout();
                handleLinkClick();
              }}
            >
              <span className="nav-icon">🚪</span>
              <span className="nav-label">Выйти</span>
            </button>
          </div>
        )}
      </nav>

      {/* Информация о пользователе */}
      {isAuthenticated && user && (
        <div className="sidebar-user">
          <div className="user-avatar">
            {user.profile_image ? (
              <img src={user.profile_image} alt={user.first_name} />
            ) : (
              user.first_name?.[0]?.toUpperCase() || '👤'
            )}
          </div>
          <div className="user-info">
            <div className="user-name">
              {user.first_name} {user.last_name}
            </div>
            <div className="user-email">{user.email}</div>
            {user.balance !== undefined && (
              <div className="user-balance">
                Баланс: {user.balance} ₽
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;