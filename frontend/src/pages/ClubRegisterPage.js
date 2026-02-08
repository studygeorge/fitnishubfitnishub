import React from 'react';
import { Link } from 'react-router-dom';
import './ClubRegisterPage.css';
import logo from '../pages/homepage/logo.png';

const ClubRegisterPage = () => {
  return (
    <div className="club-register-page">
      {/* Hero секция */}
      <section className="club-register-hero">
        <div className="club-register-hero-container">
          <div className="club-register-hero-content">
            <div className="club-register-brand">
              <img src={logo} alt="FitnesHub" className="club-register-logo" />
              <h1>FitnesHub</h1>
            </div>
            <h2>Присоединяйтесь к крупнейшему агрегатору здорового образа жизни</h2>
            <p className="club-register-hero-subtitle">
              Платформа объединяющая фитнес-клубы, спортивные центры, студии йоги, танцевальные школы, 
              бассейны и все места активного отдыха в одной экосистеме
            </p>
            <div className="club-register-hero-stats">
              <div className="club-register-stat">
                <span className="club-register-stat-number">500+</span>
                <span className="club-register-stat-label">Партнеров</span>
              </div>
              <div className="club-register-stat">
                <span className="club-register-stat-number">50k+</span>
                <span className="club-register-stat-label">Активных пользователей</span>
              </div>
              <div className="club-register-stat">
                <span className="club-register-stat-number">20+</span>
                <span className="club-register-stat-label">Городов</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Для кого платформа */}
      <section className="club-register-target">
        <div className="club-register-container">
          <h2>Для кого наша платформа</h2>
          <div className="club-register-target-grid">
            <div className="club-register-target-item">
              <h3>Фитнес-клубы</h3>
              <p>Тренажерные залы, кроссфит-боксы, функциональные студии</p>
            </div>
            <div className="club-register-target-item">
              <h3>Студии йоги</h3>
              <p>Хатха, виньяса, аштанга, горячая йога и медитативные практики</p>
            </div>
            <div className="club-register-target-item">
              <h3>Танцевальные студии</h3>
              <p>Современные танцы, бальные, латина, стрип-пластика</p>
            </div>
            <div className="club-register-target-item">
              <h3>Бассейны</h3>
              <p>Плавание, аквааэробика, водные виды спорта</p>
            </div>
            <div className="club-register-target-item">
              <h3>Единоборства</h3>
              <p>Бокс, MMA, каратэ, тхэквондо, борьба</p>
            </div>
            <div className="club-register-target-item">
              <h3>Велнес-центры</h3>
              <p>SPA, массаж, релаксация, оздоровительные программы</p>
            </div>
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="club-register-benefits">
        <div className="club-register-container">
          <div className="club-register-benefits-content">
            <div className="club-register-benefits-text">
              <h2>Почему выбирают FitnesHub</h2>
              <div className="club-register-benefit-list">
                <div className="club-register-benefit-item">
                  <h3>Поток новых клиентов</h3>
                  <p>Привлекайте целевую аудиторию через единую платформу поиска активностей. Пользователи ищут именно то, что вы предлагаете.</p>
                </div>
                <div className="club-register-benefit-item">
                  <h3>Умное управление</h3>
                  <p>Автоматизируйте бронирование, управляйте расписанием и отслеживайте загруженность в реальном времени.</p>
                </div>
                <div className="club-register-benefit-item">
                  <h3>Подробная аналитика</h3>
                  <p>Получайте детальные отчеты о посещаемости, доходах и предпочтениях клиентов для роста бизнеса.</p>
                </div>
                <div className="club-register-benefit-item">
                  <h3>Единая экосистема</h3>
                  <p>Интеграция с системой платежей, программами лояльности и маркетинговыми инструментами.</p>
                </div>
              </div>
            </div>
            <div className="club-register-benefits-visual">
              <div className="club-register-growth-chart">
                <h3>Рост выручки партнеров</h3>
                <div className="club-register-chart-bars">
                  <div className="club-register-chart-bar" style={{height: '40%'}}><span>1 мес</span></div>
                  <div className="club-register-chart-bar" style={{height: '65%'}}><span>3 мес</span></div>
                  <div className="club-register-chart-bar" style={{height: '85%'}}><span>6 мес</span></div>
                  <div className="club-register-chart-bar" style={{height: '100%'}}><span>12 мес</span></div>
                </div>
                <p>Средний рост выручки +47% за первый год</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Как работает */}
      <section className="club-register-process">
        <div className="club-register-container">
          <h2>Как начать работать с нами</h2>
          <div className="club-register-process-timeline">
            <div className="club-register-timeline-item">
              <div className="club-register-timeline-marker">1</div>
              <div className="club-register-timeline-content">
                <h3>Подача заявки</h3>
                <p>Свяжитесь с нашим менеджером для первичной консультации и обсуждения условий сотрудничества</p>
              </div>
            </div>
            <div className="club-register-timeline-item">
              <div className="club-register-timeline-marker">2</div>
              <div className="club-register-timeline-content">
                <h3>Настройка профиля</h3>
                <p>Создаем детальную страницу вашего заведения с фотографиями, описанием услуг и расписанием</p>
              </div>
            </div>
            <div className="club-register-timeline-item">
              <div className="club-register-timeline-marker">3</div>
              <div className="club-register-timeline-content">
                <h3>Интеграция систем</h3>
                <p>Подключаем вашу CRM, настраиваем онлайн-бронирование и систему уведомлений</p>
              </div>
            </div>
            <div className="club-register-timeline-item">
              <div className="club-register-timeline-marker">4</div>
              <div className="club-register-timeline-content">
                <h3>Запуск и поддержка</h3>
                <p>Начинаете принимать заявки от клиентов с персональной поддержкой нашей команды</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="club-register-cta">
        <div className="club-register-container">
          <div className="club-register-cta-content">
            <h2>Готовы увеличить поток клиентов?</h2>
            <p>Присоединяйтесь к сотням успешных партнеров и развивайте свой бизнес вместе с FitnesHub</p>
            <div className="club-register-cta-actions">
              <a href="https://t.me/krissi_s" target="_blank" rel="noopener noreferrer" className="club-register-cta-primary">
                Стать партнером
              </a>
              <Link to="/club/login" className="club-register-cta-secondary">
                Войти в кабинет
              </Link>
            </div>
            <p className="club-register-cta-note">Подключение бесплатно • Комиссия только с реальных продаж</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default ClubRegisterPage;