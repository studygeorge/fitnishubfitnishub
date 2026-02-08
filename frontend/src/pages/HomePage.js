// src/pages/HomePage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './homepage/components/Header';
import HeroSection from './homepage/components/HeroSection';
import AdvantagesSection from './homepage/components/AdvantagesSection';
import SportsSection from './homepage/components/SportsSection';
import InstructionSection from './homepage/components/InstructionSection';
import NewsSection from './homepage/components/NewsSection';
import FooterSection from './homepage/components/FooterSection';
import CookieConsent from './homepage/components/CookieConsent';
import './HomePage.css';

// Импорт всех изображений
import advantage1 from './homepage/advantage1.webp';
import advantage2 from './homepage/advantage2.webp';
import advantage3 from './homepage/advantage3.webp';
import blok1Profile from './homepage/blok1_profile.png';
import blok2Raspisanie from './homepage/blok2_raspisanie.png';
import blok3Code from './homepage/blok3_code.png';
import danceStudio from './homepage/dance-studio.png';
import heroFitness from './homepage/hero-fitness.png';
import heroImg from './homepage/hero.png';
import img9699 from './homepage/IMG_9699-1.webp';
import img9700_1 from './homepage/IMG_9700-1-1.webp';
import img9700 from './homepage/IMG_9700.webp';
import img9702 from './homepage/IMG_9702-1.webp';
import img9703 from './homepage/IMG_9703-1.webp';
import img9704 from './homepage/IMG_9704-1.webp';
import img9710 from './homepage/IMG_9710-1.webp';
import logoJpg from './homepage/logo.jpg';
import logoPng from './homepage/logo.png';

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth(); // Получаем информацию о пользователе

  useEffect(() => {
    // Все изображения для предзагрузки
    const imageUrls = [
      advantage1,
      advantage2,
      advantage3,
      blok1Profile,
      blok2Raspisanie,
      blok3Code,
      danceStudio,
      heroFitness,
      heroImg,
      img9699,
      img9700_1,
      img9700,
      img9702,
      img9703,
      img9704,
      img9710,
      logoJpg,
      logoPng
    ];

    let loadedImages = 0;
    const totalImages = imageUrls.length;

    const preloadImage = (src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loadedImages++;
        if (loadedImages === totalImages) {
          // Небольшая задержка для плавности
          setTimeout(() => setIsLoading(false), 500);
        }
      };
      img.src = src;
    };

    // Загружаем все изображения
    imageUrls.forEach(preloadImage);

    // Таймаут на случай, если что-то пойдет не так
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 10000); // 10 секунд максимум

    return () => clearTimeout(timeout);
  }, []);

  // Простой прелоадер
  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
      }}>
        {/* Логотип */}
        <div style={{
          width: '80px',
          height: '80px',
          marginBottom: '30px',
          opacity: 0.8
        }}>
          <img 
            src={logoPng} 
            alt="Logo" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Спиннер */}
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #FF6933',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>

        {/* Текст загрузки */}
        <div style={{
          fontSize: '16px',
          color: '#666',
          fontWeight: '500',
          fontFamily: 'Inter, sans-serif'
        }}>
          Загрузка...
        </div>

        {/* Стили для анимации */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fitness-home-page">
      <Header />
      
      {/* Hero Section — БЕЗ фонового класса, чтобы не мешал */}
      <div id="fitness-hero-section">
        <HeroSection />
      </div>
      
      {/* Advantages Section - белый фон */}
      <div id="fitness-advantages-section" className="fitness-block">
        <AdvantagesSection />
      </div>
      
      {/* Sports Section - контрастный серо-голубой */}
      <div id="fitness-sports-section" className="fitness-block fitness-contrast-block">
        <SportsSection />
      </div>
      
      {/* Instruction Section - оранжевый градиент */}
      <div id="fitness-instruction-section" className="fitness-block fitness-orange-block">
        <InstructionSection />
      </div>
      
      {/* News Section - светло-серый */}
      <div id="fitness-news-section" className="fitness-block fitness-light-block">
        <NewsSection />
      </div>

      {/* Footer Section */}
      <div id="fitness-footer-section" className="fitness-block fitness-footer-block">
        <FooterSection />
      </div>

      {/* Показываем уведомление о куки только для авторизованных пользователей */}
      {user && <CookieConsent />}
    </div>
  );
};

// Экспорт изображений для использования в других компонентах
export {
  advantage1,
  advantage2,
  advantage3,
  blok1Profile,
  blok2Raspisanie,
  blok3Code,
  danceStudio,
  heroFitness,
  heroImg,
  img9699,
  img9700_1,
  img9700,
  img9702,
  img9703,
  img9704,
  img9710,
  logoJpg,
  logoPng
};

export default HomePage;
