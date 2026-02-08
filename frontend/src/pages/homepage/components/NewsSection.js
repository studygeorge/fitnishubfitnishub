// src/pages/homepage/components/NewsSection.js
import React from 'react';
import '../styles/NewsSection.css';

const NewsSection = () => {
  const newsItems = [
    {
      id: 1,
      date: "1 сентября",
      title: "Официальный старт FitnesHub в Туле!",
      description: "Мы рады объявить о запуске нашего сервиса в городе-герое. 5 партнерских залов уже ждут вас!",
      isHighlighted: true
    },
    
  ];

  return (
    <section className="news-section">
      <div className="fitness-container">
        {/* Заголовок */}
        <div className="news-header">
          <h2 className="news-title">
            Новости и обновления
          </h2>
        </div>

        {/* Подзаголовок */}
        <div className="news-subtitle-container">
          <p className="news-subtitle">
            Следите за последними новостями нашего сервиса<br />
            и не пропускайте важные обновления
          </p>
        </div>
      </div>

      {/* Новости на всю ширину блока - ВНЕ обычного контейнера */}
      <div className="news-full-width-content">
        <div className="news-items-container">
          {newsItems.map((item) => (
            <div key={item.id} className={`news-item ${item.isHighlighted ? 'news-item-highlighted' : ''}`}>
              <div className="news-date-badge">
                <span className="news-date-icon">📅</span>
                <span className="news-date-text">{item.date}</span>
              </div>
              <div className="news-content">
                <h3 className="news-item-title">{item.title}</h3>
                <p className="news-item-description">{item.description}</p>
                <div className="news-read-more">
                  <span className="news-read-more-text">Читать далее</span>
                  <span className="news-read-more-arrow">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;