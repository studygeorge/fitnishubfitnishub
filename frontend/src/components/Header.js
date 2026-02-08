import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <h1>FitnessHub</h1>
        </Link>
        
        <div className="mobile-toggle" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        
        <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
          <ul className="nav-list">
            <li><Link to="/" onClick={toggleMenu}>Главная</Link></li>
            <li><Link to="/clubs" onClick={toggleMenu}>Клубы</Link></li>
            <li><Link to="/schedule" onClick={toggleMenu}>Расписание</Link></li>
            <li><Link to="/balance" onClick={toggleMenu}>Баланс</Link></li>
            <li><Link to="/profile" onClick={toggleMenu}>Личный кабинет</Link></li>
          </ul>
          <div className="auth-buttons">
            <Link to="/login" className="login-btn">Вход</Link>
            <Link to="/register" className="register-btn">Регистрация</Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
