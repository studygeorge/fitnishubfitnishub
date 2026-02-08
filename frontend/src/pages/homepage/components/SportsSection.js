// src/pages/homepage/components/SportsSection.js
import React from 'react';
import { Link } from 'react-router-dom';
import { sportsActivities } from '../data/sportsActivities';
import '../styles/SportsSection.css';

const SportsSection = () => {
  // Берем первые 6 карточек
  const displayedSports = sportsActivities.slice(0, 6);

  return (
    <section id="fitness-sports-section" className="sports-section">
      <div className="fitness-container">
        <div className="sports-header">
          <h2 className="sports-title">Собрали все виды спорта</h2>
          <p className="sports-subtitle">
            И каждый месяц добавляем что-то новенькое
          </p>
        </div>
      </div>
      
      {/* Карточки на всю ширину блока - ВНЕ обычного контейнера */}
      <div className="sports-full-width-cards">
        <div className="sports-cards-grid">
          {displayedSports.map((sport, index) => (
            <Link 
              key={index}
              to={sport.link} 
              className="sports-card"
            >
              <div className="sports-image">
                <img src={sport.image} alt={sport.title} />
                <div className="sports-overlay">
                  <div className="sports-info">
                    <h3>{sport.title}</h3>
                    <span className="sports-count">{sport.count}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="fitness-container">
        <div className="sports-cta">
          <Link to="/schedule" className="fitness-btn-secondary">
            Начни сейчас
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SportsSection;