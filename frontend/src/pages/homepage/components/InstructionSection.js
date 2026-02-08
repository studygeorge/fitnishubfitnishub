import React from 'react';
import '../styles/InstructionSection.css';

// Исправленные пути к изображениям
import profileMockup from '../blok1_profile.png';
import scheduleMockup from '../blok2_raspisanie.png';
import codeMockup from '../blok3_code.png';

const InstructionSection = () => {
  const steps = [
    {
      id: "profile",
      title: "Создайте личный кабинет",
      description: "Зарегистрируйтесь и пополните счет на любую сумму",
      mockupImage: profileMockup,
      mockupAlt: "Скриншот личного кабинета пользователя"
    },
    {
      id: "choose",
      title: "Выберите, куда сходить",
      description: "Найдите подходящий зал рядом с домом или работой",
      mockupImage: scheduleMockup,
      mockupAlt: "Скриншот расписания занятий"
    },
    {
      id: "visit",
      title: "Приходите на занятие по записи",
      description: "На входе в зал назовите код администратору и занимайтесь",
      mockupImage: codeMockup,
      mockupAlt: "Скриншот кода для посещения"
    }
  ];

  return (
    <section className="instruction-section">
      <div className="fitness-container">
        {/* Заголовок */}
        <div className="instruction-header-section">
          <h2 className="instruction-title">
            Следуй этим шагам для<br />
            старта!
          </h2>
        </div>

        {/* Подзаголовок */}
        <div className="instruction-subtitle-container">
          <p className="instruction-subtitle">
            Всего 3 простых шага, чтобы начать<br />
            тренироваться в лучших студиях города
          </p>
        </div>
      </div>

      {/* Карточки на всю ширину блока - ВНЕ обычного контейнера */}
      <div className="instruction-full-width-cards">
        <div className="instruction-cards-grid">
          {steps.map((step, index) => (
            <div key={step.id} className="instruction-card">
              <div className="instruction-content">
                <h3 className="instruction-card-title">{step.title}</h3>
                <div className="instruction-card-description-container">
                  <p className="instruction-card-description">
                    {step.description}
                  </p>
                </div>
              </div>
              <div className="instruction-mockup-container">
                <img 
                  src={step.mockupImage} 
                  alt={step.mockupAlt}
                  className="instruction-mockup-image"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstructionSection;