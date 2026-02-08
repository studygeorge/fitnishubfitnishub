import React from 'react';
import './AdvantagesSection.css';

// Импорт картинок
import advantage1 from '../advantage2.webp';
import advantage2 from '../advantage1.webp';
import advantage3 from '../advantage3.webp';

const AdvantagesSection = () => {
  return (
    <section className="adv-section">
      {/* Текстовая часть с обычным контейнером */}
      <div className="fitness-container">
        {/* Главный заголовок */}
        <div className="adv-header">
          <h2 className="adv-title">
          Просто выбери, забронируй и тренируйся 
            
          </h2>
        </div>

        {/* Подзаголовок */}
        <div className="adv-subtitle-container">
          <p className="adv-subtitle">
          Платформа для тех, кто ценит разнообразие.<br />
          Попробуйте десятки видов тренировок в лучших залах города.
          </p>
        </div>
      </div>

      {/* Карточки на всю ширину блока - ВНЕ обычного контейнера */}
      <div className="adv-full-width-cards">
        {/* Карточки преимуществ */}
        <div className="adv-cards-grid">
          {/* Карточка разнообразия */}
          <div className="adv-benefit-card">
            <div className="adv-benefit-content">
              <h3 className="adv-benefit-title">Разнообразие</h3>
              <div className="adv-benefit-description-container adv-variety">
                <p className="adv-benefit-description">
                  Найдётся вид спорта для тех, кто уже попробовал всё
                </p>
              </div>
            </div>
            <div className="adv-benefit-image-container adv-variety-image">
              <img 
                src={advantage1} 
                alt="Разнообразие спорта" 
                className="adv-benefit-image"
              />
            </div>
          </div>

          {/* Карточка рассрочки */}
          <div className="adv-benefit-card">
            <div className="adv-benefit-content">
              <h3 className="adv-benefit-title">Осознанность</h3>
              <div className="adv-benefit-description-container adv-payment">
                <p className="adv-benefit-description">
                Теперь ты знаешь, сколько стоит<br />
                твоя мотивация и время
                </p>
              </div>
            </div>
            <div className="adv-benefit-image-container adv-payment-image">
              <img 
                src={advantage2} 
                alt="Варианты оплаты" 
                className="adv-benefit-image"
              />
            </div>
          </div>

          {/* Карточка удобства */}
          <div className="adv-benefit-card adv-convenience-card">
            <div className="adv-benefit-content">
              <h3 className="adv-benefit-title">Удобство</h3>
              <div className="adv-benefit-description-container adv-convenience">
                <p className="adv-benefit-description">
                  Залы в любой точке города.<br />
                  Рядом с домом или работой
                </p>
              </div>
            </div>
            <div className="adv-benefit-image-container adv-convenience-image">
              <img 
                src={advantage3} 
                alt="Удобство спортзалов" 
                className="adv-benefit-image"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdvantagesSection;