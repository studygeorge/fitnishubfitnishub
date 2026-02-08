import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext'; // Импорт контекста авторизации
import logoImage from './logo.png'; // Импорт логотипа
import '../styles/Header.css';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth(); // Получаем данные пользователя

  // Функция для плавного перехода к секции
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    setMenuOpen(false); // Закрываем меню после клика
  };

  return (
    <header className="homepage-fitness-header">
      <div className="homepage-fitness-header-content">
        <Link to="/" className="homepage-fitness-logo">
          <img 
            src={logoImage} 
            alt="FitnesHub" 
            className="homepage-fitness-logo-image"
          />
          <span className="homepage-fitness-logo-text">ФИТНЕСХАБ</span>
        </Link>
        <div className="homepage-fitness-header-right">
          <Link to="/pricing" className="homepage-fitness-price-btn">Узнать стоимость</Link>
          <button 
            className="homepage-fitness-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          {/* ОБНОВЛЕННАЯ КНОПКА ПРОФИЛЯ С АВАТАРКОЙ */}
          <Link to="/profile" className="homepage-fitness-profile-btn">
            {isAuthenticated && user ? (
              <div className="homepage-fitness-user-avatar">
                {user.profile_image ? (
                  <img 
                    src={user.profile_image} 
                    alt={user.first_name || 'Пользователь'} 
                    className="homepage-fitness-avatar-image"
                  />
                ) : (
                  <div className="homepage-fitness-avatar-placeholder">
                    {user.first_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            ) : (
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="homepage-fitness-login-icon"
              >
                <path 
                  d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15"
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M10 17L15 12L10 7" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M15 12H3" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </Link>
        </div>
      </div>
      
      {menuOpen && (
        <div className="homepage-fitness-dropdown-menu">
          <button onClick={() => scrollToSection('fitness-hero-section')}>Главная</button>
          <button onClick={() => scrollToSection('fitness-advantages-section')}>Преимущества</button>
          <button onClick={() => scrollToSection('fitness-sports-section')}>Виды спорта</button>
          <button onClick={() => scrollToSection('fitness-instruction-section')}>Инструкция</button>
          <button onClick={() => scrollToSection('fitness-news-section')}>Новости</button>
          <Link to="/clubs">Клубы и залы</Link>
          <Link to="/schedule">Расписание</Link>
          <Link to="/profile">Личный кабинет</Link>
          <Link to="/faq">FAQ</Link>
          
          {/* ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ В МЕНЮ */}
          {isAuthenticated && user && (
            <>
              <div className="homepage-fitness-menu-divider"></div>
              <div className="homepage-fitness-user-info">
                <div className="homepage-fitness-user-name">
                  {user.first_name} {user.last_name}
                </div>
                {user.balance !== undefined && (
                  <div className="homepage-fitness-user-balance">
                    Баланс: {user.balance} ₽
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;