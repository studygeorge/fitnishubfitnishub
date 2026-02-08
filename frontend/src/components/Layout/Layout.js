// src/components/Layout/Layout.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import AdaptiveHeader from './AdaptiveHeader';
import './Layout.css';

const Layout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`layout ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* Адаптивный заголовок */}
      <AdaptiveHeader isMobile={isMobile} />

      {/* Основной контент */}
      <main className="main-content">
        {children}
      </main>

      {/* Нижняя навигация только для мобильных */}
      {isMobile && <BottomNavigation />}
    </div>
  );
};

export default Layout;