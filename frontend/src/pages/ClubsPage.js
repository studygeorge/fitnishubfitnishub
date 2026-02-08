// src/pages/ClubsPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './ClubsPage.css';

const ClubsPage = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: ''
  });

  // Функция для перевода категорий на русский язык
  const translateCategory = (category) => {
    const translations = {
      'fitness': 'Фитнес-клуб',
      'gym': 'Тренажерный зал',
      'yoga': 'Студия йоги',
      'swimming': 'Бассейн',
      'crossfit': 'Кроссфит',
      'dance': 'Танцевальная студия',
      'boxing': 'Бокс',
      'martial_arts': 'Боевые искусства',
      'other': 'Другое',
      // Дополнительные переводы для вариантов написания
      'Фитнес-клуб': 'Фитнес-клуб',
      'Йога-студия': 'Студия йоги',
      'Тренажерный зал': 'Тренажерный зал',
      'Бассейн': 'Бассейн',
      'Танцевальная студия': 'Танцевальная студия',
      'Боевые искусства': 'Боевые искусства',
      'Спортивный комплекс': 'Спортивный комплекс'
    };
    
    return translations[category] || category;
  };

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const clubsData = await api.clubs.getAll(filters);
      setClubs(clubsData || []);
    } catch (err) {
      console.error('Ошибка загрузки клубов:', err);
      setError('Не удалось загрузить список клубов');
      setClubs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadClubs();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: ''
    });
  };

  if (loading) {
    return (
      <div className="fh-cp__page-wrapper">
        <div className="fh-cp__loading-state">
          <div className="fh-cp__loading-spinner"></div>
          <h2>Загружаем клубы...</h2>
          <p>Это займет всего пару секунд</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fh-cp__page-wrapper">
        <div className="fh-cp__error-state">
          <div className="fh-cp__error-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V21C3 22.1 3.9 23 5 23H19C20.1 23 21 22.1 21 21V9M19 9H14V4H5V21H19V9Z"/>
            </svg>
          </div>
          <h2>Что-то пошло не так</h2>
          <p>{error}</p>
          <button className="fh-cp__btn fh-cp__btn--primary" onClick={loadClubs}>
            Попробовать еще раз
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fh-cp__page-wrapper">
      {/* Заголовок страницы */}
      <div className="fh-cp__header-section">
        <h1>Найдите свое место для тренировок</h1>
        <p>Фитнес-клубы, студии йоги, танцевальные школы, бассейны и многое другое</p>
      </div>

      {/* Фильтры */}
      <div className="fh-cp__filters-panel">
        <div className="fh-cp__filters-container">
          <div className="fh-cp__filter-group">
            <div className="fh-cp__search-wrapper">
              <svg className="fh-cp__search-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                name="search"
                placeholder="Поиск по названию или адресу..."
                value={filters.search}
                onChange={handleFilterChange}
                className="fh-cp__search-input"
              />
            </div>
          </div>

          <div className="fh-cp__filter-group">
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="fh-cp__category-select"
            >
              <option value="">Все виды</option>
              <option value="fitness">Фитнес-клубы</option>
              <option value="yoga">Студии йоги</option>
              <option value="gym">Тренажерные залы</option>
              <option value="swimming">Бассейны</option>
              <option value="dance">Танцевальные студии</option>
              <option value="martial_arts">Боевые искусства</option>
              <option value="crossfit">Кроссфит</option>
              <option value="boxing">Бокс</option>
              <option value="other">Другое</option>
            </select>
          </div>

          {(filters.search || filters.category) && (
            <button className="fh-cp__clear-filters-btn" onClick={clearFilters}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
              Сбросить
            </button>
          )}
        </div>

        <div className="fh-cp__results-count">
          <span className="fh-cp__count-number">{clubs.length}</span>
          <span className="fh-cp__count-text">
            {clubs.length === 1 ? 'клуб найден' : 
             clubs.length >= 2 && clubs.length <= 4 ? 'клуба найдено' : 
             'клубов найдено'}
          </span>
        </div>
      </div>

      {/* Список клубов */}
      {clubs.length === 0 ? (
        <div className="fh-cp__no-clubs">
          <div className="fh-cp__no-clubs-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h3>Ничего не найдено</h3>
          <p>
            {filters.search || filters.category 
              ? 'Попробуйте изменить параметры поиска или сбросить фильтры.'
              : 'Скоро здесь появятся новые клубы и студии.'
            }
          </p>
          {(filters.search || filters.category) && (
            <button className="fh-cp__btn fh-cp__btn--primary" onClick={clearFilters}>
              Показать все
            </button>
          )}
        </div>
      ) : (
        <div className="fh-cp__clubs-grid">
          {clubs.map(club => (
            <div key={club.id} className="fh-cp__club-card">
              {/* Изображение клуба */}
              <div className="fh-cp__club-image">
                {club.banner_url || club.logo_url ? (
                  <img 
                    src={club.banner_url || club.logo_url} 
                    alt={club.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="fh-cp__club-image-placeholder"
                  style={{ display: club.banner_url || club.logo_url ? 'none' : 'flex' }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="fh-cp__placeholder-text">{club.name}</span>
                </div>
                
                {/* Рейтинг */}
                <div className="fh-cp__club-rating">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                  <span>{club.rating || '5.0'}</span>
                </div>
              </div>

              {/* Информация о клубе */}
              <div className="fh-cp__club-info">
                <div className="fh-cp__club-content">
                  {/* ТОЛЬКО: Название и вид спорта */}
                  <div className="fh-cp__club-header">
                    <h3 className="fh-cp__club-name">{club.name}</h3>
                    {club.category && (
                      <span className="fh-cp__club-category">
                        {translateCategory(club.category)}
                      </span>
                    )}
                  </div>

                  {/* ТОЛЬКО: Адрес */}
                  <div className="fh-cp__club-address">
                    
                    <span>{club.address}</span>
                  </div>

                  {/* ТОЛЬКО: Описание */}
                  <div className="fh-cp__club-description">
                    {club.description 
                      ? (club.description.length > 120 
                          ? `${club.description.substring(0, 120)}...`
                          : club.description)
                      : 'Описание клуба скоро появится'
                    }
                  </div>
                </div>

                {/* Действия - ОТОДВИНУТЫ от нижнего края */}
                <div className="fh-cp__club-actions">
                  <Link 
                    to={`/clubs/${club.id}`} 
                    className="fh-cp__btn fh-cp__btn--primary fh-cp__details-btn"
                  >
                    Подробнее
                  </Link>
                  <Link 
                    to={`/schedule?club=${club.id}`} 
                    className="fh-cp__btn fh-cp__btn--secondary fh-cp__schedule-btn"
                  >
                    Расписание
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Призыв к действию для владельцев клубов */}
      <div className="fh-cp__cta-section">
        <div className="fh-cp__cta-content">
          <h3>Владеете клубом или студией?</h3>
          <p>Подключайтесь к нашей платформе и привлекайте новых клиентов</p>
          <Link to="/club-register" className="fh-cp__cta-button">
            Подключиться
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ClubsPage;