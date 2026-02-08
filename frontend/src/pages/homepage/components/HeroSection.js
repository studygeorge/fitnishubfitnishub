// src/pages/homepage/components/HeroSection.js
import React from 'react';
import { Link } from 'react-router-dom';
import photohero from '../hero.png';
import '../styles/HeroSection.css';

const HeroSection = () => {
  return (
    <section className="fitness-hero-wrapper">
      <div className="fitness-hero-card">
        {/* Заголовок */}
        <h1 className="fitness-hero-title">
          Новый способ добавить спорт <br />в свою жизнь
        </h1>

        {/* Подзаголовок */}
        <p className="fitness-hero-subtitle">
          Приложение, в котором мы собрали несколько десятков активностей — от йоги до кроссфита.
        </p>

        {/* Кнопка */}
        <div className="fitness-hero-buttons">
          <Link to="/register" className="fitness-hero-btn-primary">
            <span className="fitness-btn-text">Присоединиться к FitnessHub</span>
            <span className="fitness-btn-arrow">→</span>
          </Link>
        </div>

        {/* Большое фото справа */}
        <img
          className="fitness-hero-image"
          src={photohero}
          alt="Спортивная девушка"
        />
      </div>
    </section>
  );
};

export default HeroSection;