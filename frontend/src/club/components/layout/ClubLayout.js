import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import ClubSidebar from './ClubSidebar';
import ClubHeader from './ClubHeader';
import './ClubLayout.css';

const ClubLayout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getMainClasses = () => {
    let classes = 'club-main';
    
    if (!isMobile) {
      classes += ' with-sidebar';
    }
    
    return classes;
  };

  const isActiveRoute = (path) => {
    if (path === '/club/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const bottomNavItems = [
    { path: '/club/dashboard', label: 'Обзор' },
    { path: '/club/schedule', label: 'Расписание' },
    { path: '/club/bookings', label: 'Бронирования' },
    { path: '/club/profile', label: 'Профиль' },
    { path: '/club/finances', label: 'Финансы' }
  ];

  return (
    <div className="club-layout">
      <a href="#main-content" className="skip-to-content">
        Перейти к содержимому
      </a>

      {/* Sidebar только для десктопа */}
      {!isMobile && (
        <ClubSidebar isMobile={false} />
      )}

      <div className={getMainClasses()}>
        <ClubHeader isMobile={isMobile} />

        <main id="main-content" className="club-content" tabIndex="-1">
          {children}
        </main>
      </div>

      {/* Нижняя навигация только для мобильных */}
      {isMobile && (
        <nav className="bottom-navigation" role="navigation" aria-label="Основная навигация">
          {bottomNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${isActiveRoute(item.path) ? 'active' : ''}`}
              aria-current={isActiveRoute(item.path) ? 'page' : undefined}
            >
              <span className="nav-icon"></span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
};

export default ClubLayout;