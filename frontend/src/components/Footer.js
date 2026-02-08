import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>FitnesHub</h3>
            <p>Единая цифровая платформа для поиска, выбора и посещения спортивных залов и тренировок</p>
          </div>
          <div className="footer-section">
            <h3>Ссылки</h3>
            <ul>
              <li><Link to="/">Главная</Link></li>
              <li><Link to="/clubs">Клубы</Link></li>
              <li><Link to="/schedule">Расписание</Link></li>
              <li><Link to="/balance">Пополнить баланс</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Для партнеров</h3>
            <ul>
              <li><Link to="/club-dashboard">Личный кабинет клуба</Link></li>
              <li><Link to="/partner">Стать партнером</Link></li>
              <li><Link to="/partner-terms">Условия сотрудничества</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Контакты</h3>
            <p>Email: info@fitnesshub.ru</p>
            <p>Телефон: +7 (999) 123-45-67</p>
            <div className="social-links">
              <a href="https://t.me/fitnesshub" target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
              <a href="https://vk.com/fitnesshub" target="_blank" rel="noopener noreferrer">
                VK
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} FitnessHub. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;