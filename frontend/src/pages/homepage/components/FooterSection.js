// src/pages/homepage/components/FooterSection.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/FooterSection.css';

const FooterSection = () => {
  const [showFaqModal, setShowFaqModal] = useState(false);

  const documents = [
    {
      to: "/privacy-policy", 
      text: "Политика конфиденциальности"
    },
    {
      to: "/terms-of-service",
      text: "Публичная оферта"
    },
    {
      to: "/recommendation-policy",
      text: "Правила применения рекомендательных технологий"
    },
    {
      to: "/user-rules",
      text: "Правила пользования сервисом"
    }
  ];

  const socialLinks = [
    {
      href: "https://vk.com/fitneshub_tula",
      text: "VKontakte",
      className: "vk"
    },
    {
      href: "https://t.me/fitneshub_channel",
      text: "Telegram", 
      className: "telegram"
    },
    {
      href: "https://www.instagram.com/fitneshub_tula",
      text: "Instagram",
      className: "instagram"
    }
  ];

  const faqData = [
    {
      question: "Как зарегистрироваться в приложении?",
      answer: "Нажмите 'Регистрация' и заполните необходимые данные. После подтверждения email вы сможете пользоваться всеми функциями приложения."
    },
    {
      question: "Как забронировать занятие?",
      answer: "Откройте раздел 'Расписание', выберите интересующий вас зал и время занятия, нажмите 'Забронировать'. Бронирование подтвердится автоматически, и вы получите уведомление."
    },
    {
      question: "Можно ли отменить бронирование?",
      answer: "Да, вы можете отменить бронирование не позднее чем за 12 часов до начала занятия, а денежные средства вернуть на ваш баланс. Для этого зайдите в раздел 'Записи' и нажмите 'Отменить'."
    },
    {
      question: "Как пополнить баланс?",
      answer: "Перейдите в раздел 'Баланс' в приложении, выберите удобный способ пополнения: банковская карта, СБП или электронные кошельки. Средства поступят на баланс мгновенно."
    },
    {
      question: "Что делать, если не могу войти в аккаунт?",
      answer: "Проверьте правильность введенных данных. Если проблема не решилась, используйте функцию 'Забыли пароль?' или обратитесь в техническую поддержку по адресу fitneshub@mail.ru."
    },
    {
      question: "Есть ли абонементы и скидки?",
      answer: "Да! Мы предлагаем различные тарифные планы: разовые посещения, недельные и месячные абонементы. Следите за акциями в разделе 'Акции' и в наших социальных сетях."
    },
    {
      question: "Как стать партнерским залом?",
      answer: "Свяжитесь с нами по email fitneshub@mail.ru или заполните форму на сайте. Наш менеджер расскажет об условиях сотрудничества и поможет подключить ваш зал к платформе."
    }
  ];

  const handleEmailClick = (subject) => {
    const email = 'fitneshub@mail.ru';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    window.location.href = mailtoUrl;
  };

  const handleFaqClick = (e) => {
    e.preventDefault();
    setShowFaqModal(true);
  };

  const closeFaqModal = () => {
    setShowFaqModal(false);
  };

  return (
    <section className="footer-main-section">
      <div className="fitness-container">
        <div className="footer-main-content">
          
          {/* Заголовок секции */}
          <div className="footer-main-header">
            <h2 className="footer-main-title">Информация</h2>
            <p className="footer-main-subtitle">
              Вся необходимая информация и документы для пользователей FitnesHub
            </p>
          </div>

          {/* Основной контент */}
          <div className="footer-main-grid">
            
            {/* Документы */}
            <div className="footer-main-documents">
              <h3 className="footer-main-section-title">
                Юридические документы
              </h3>
              <div className="footer-main-doc-grid">
                {documents.map((doc, index) => (
                  <Link 
                    key={index}
                    to={doc.to}
                    className="footer-main-doc-item"
                  >
                    <span className="footer-main-doc-text">{doc.text}</span>
                    <span className="footer-main-download-indicator">→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* FAQ и поддержка */}
            <div className="footer-main-support">
              <h3 className="footer-main-section-title">
                Помощь и поддержка
              </h3>
              <div className="footer-main-support-links">
                <button 
                  onClick={handleFaqClick}
                  className="footer-main-faq-link footer-main-active footer-main-support-button"
                >
                  <div className="footer-main-support-content">
                    <strong>Часто задаваемые вопросы</strong>
                    <span className="footer-main-support-description">Ответы на популярные вопросы</span>
                  </div>
                  <span className="footer-main-link-arrow">→</span>
                </button>
                
                <button 
                  onClick={() => handleEmailClick('Техническая поддержка - FitnesHub')}
                  className="footer-main-support-link footer-main-support-button"
                >
                  <div className="footer-main-support-content">
                    <strong>Техническая поддержка</strong>
                    <span className="footer-main-support-description">Помощь по работе с приложением</span>
                  </div>
                  <span className="footer-main-link-arrow">→</span>
                </button>

                <button 
                  onClick={() => handleEmailClick('Связаться с нами - FitnesHub')}
                  className="footer-main-contact-link footer-main-support-button"
                >
                  <div className="footer-main-support-content">
                    <strong>Связаться с нами</strong>
                    <span className="footer-main-support-description">Контакты и обратная связь</span>
                  </div>
                  <span className="footer-main-link-arrow">→</span>
                </button>
              </div>
            </div>

            {/* Социальные сети */}
            <div className="footer-main-social">
              <h3 className="footer-main-section-title">
                Мы в социальных сетях
              </h3>
              <div className="footer-main-social-grid">
                {socialLinks.map((social, index) => (
                  <a 
                    key={index}
                    href={social.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`footer-main-social-item footer-main-${social.className}`}
                  >
                    <span className="footer-main-social-text">{social.text}</span>
                    <span className="footer-main-external-link">↗</span>
                  </a>
                ))}
              </div>

              <div className="footer-main-social-description">
                <p>Следите за новостями, получайте советы от тренеров и участвуйте в челленджах!</p>
              </div>
            </div>
          </div>

          {/* Дополнительная информация */}
          <div className="footer-main-additional">
            <div className="footer-main-info">
              <div className="footer-main-company-info">
                <div className="footer-main-logo">
                  <span className="footer-main-logo-text">ФИТНЕСХАБ</span>
                </div>
                  <p className="footer-main-company-description">
                  Россия 300044, г. Тула, ул. М.Горького 51</p>
                  <p className="footer-main-company-description">
                  ООО «ФИТНЕСХАБ»</p>
                  <p className="footer-main-company-description">
                  fitneshub@mail.ru</p>
              </div>
            </div>
          </div>

          {/* Копирайт */}
          <div className="footer-main-bottom">
            <div className="footer-main-copyright">
              <p>&copy; 2025 FitnesHub. Все права защищены.</p>
              <p className="footer-main-city">Тула, Россия</p>
            </div>
          </div>

        </div>
      </div>

      {/* Модальное окно FAQ */}
      {showFaqModal && (
        <div className="footer-faq-modal-overlay" onClick={closeFaqModal}>
          <div className="footer-faq-modal" onClick={(e) => e.stopPropagation()}>
            <div className="footer-faq-modal-header">
              <h3 className="footer-faq-modal-title">Часто задаваемые вопросы</h3>
              <button 
                className="footer-faq-modal-close" 
                onClick={closeFaqModal}
                aria-label="Закрыть модальное окно"
              >
                ×
              </button>
            </div>
            <div className="footer-faq-modal-content">
              {faqData.map((item, index) => (
                <div key={index} className="footer-faq-item">
                  <h4 className="footer-faq-question">{item.question}</h4>
                  <p className="footer-faq-answer">{item.answer}</p>
                </div>
              ))}
            </div>
            <div className="footer-faq-modal-footer">
              <p className="footer-faq-contact-info">
                Не нашли ответ на свой вопрос? 
                <button 
                  onClick={() => {
                    closeFaqModal();
                    handleEmailClick('Вопрос не из FAQ - FitnesHub');
                  }}
                  className="footer-faq-contact-link"
                >
                  Напишите нам
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FooterSection;