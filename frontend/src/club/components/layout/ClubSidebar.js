import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useClub } from '../../contexts/ClubContext';
import '../../styles/club-sidebar.css';

const ClubSidebar = ({ isMobile }) => {
  const location = useLocation();
  const { club, clubOwner, logout } = useClub();

  const navigationItems = [
    { path: '/club/dashboard', label: 'Обзор', exactMatch: true },
    { path: '/club/schedule', label: 'Расписание' },
    { path: '/club/bookings', label: 'Бронирования' },
    { path: '/club/templates', label: 'Шаблоны' },
    { path: '/club/profile', label: 'Профиль' },
    { path: '/club/finances', label: 'Финансы' },
  ];

  const additionalItems = [
    { path: '/club/settings', label: 'Настройки' },
    { path: '/', label: 'Главная сайта' }
  ];

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path, exactMatch = false) => {
    if (exactMatch) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const getInitials = (name) => {
    if (!name) return 'К';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  // Только десктопная версия
  return (
    <aside className="club-sidebar">
      <div className="club-sidebar-header">
        <div className="club-logo">
          {club?.logo_url ? (
            <img src={club.logo_url} alt={club.name} />
          ) : (
            <div className="club-logo-placeholder">
              {getInitials(club?.name)}
            </div>
          )}
        </div>
        <div className="club-info">
          <h3 className="club-name">{club?.name || 'Мой клуб'}</h3>
          <p className="club-owner">{clubOwner?.first_name} {clubOwner?.last_name}</p>
        </div>
      </div>

      <nav className="club-nav">
        <div className="nav-section">
          <h4 className="nav-section-title">Управление</h4>
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`club-nav-item ${isActive(item.path, item.exactMatch) ? 'active' : ''}`}
            >
              <span className="nav-icon"></span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="nav-section">
          <h4 className="nav-section-title">Дополнительно</h4>
          {additionalItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="club-nav-item"
            >
              <span className="nav-icon"></span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
          <button 
            className="club-nav-item logout-btn" 
            onClick={handleLogout}
          >
            <span className="nav-icon"></span>
            <span className="nav-label">Выйти</span>
          </button>
        </div>
      </nav>

      
  
    </aside>
  );
};

export default ClubSidebar;