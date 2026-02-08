// src/components/Layout/BottomNavigation.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './BottomNavigation.css';

const BottomNavigation = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const navigationItems = [
    { path: '/', icon: 'home', label: 'Главная' },
    { path: '/clubs', icon: 'choose', label: 'Выбрать' },
    { path: '/schedule', icon: 'calendar', label: 'Расписание' },
    { path: '/profile', icon: 'profile', label: 'Профиль' },
  ];

  const renderIcon = (iconType) => {
    const icons = {
      home: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      ),
      choose: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
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
    };
    return icons[iconType] || icons.home;
  };

  return (
    <nav className="fitness-bottom-navigation">
      <div className="fitness-bottom-nav-container">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`fitness-bottom-nav-item ${location.pathname === item.path ? 'fitness-bottom-active' : ''}`}
          >
            <span className="fitness-bottom-nav-icon">
              {renderIcon(item.icon)}
            </span>
            <span className="fitness-bottom-nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;