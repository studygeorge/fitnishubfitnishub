import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../Layout/Layout';
import api from '../../services/api';
import ScheduleSection from './ScheduleSection';
import '../../styles/club-detail.css';

const ClubDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    loadClubData();
  }, [id]);

  const loadClubData = async () => {
    try {
      setLoading(true);
      const clubData = await api.clubs.getById(id);
      setClub(clubData);
    } catch (error) {
      console.error('Ошибка загрузки клуба:', error);
      navigate('/clubs');
    } finally {
      setLoading(false);
    }
  };

  const handleCallClub = () => {
    if (club?.contact_phone) {
      window.location.href = `tel:${club.contact_phone}`;
    }
  };

  const handleGetDirections = () => {
    if (club?.address) {
      const query = encodeURIComponent(club.address);
      window.open(`https://yandex.ru/maps/?text=${query}`, '_blank');
    }
  };

  const handleShowOnMap = () => {
    if (club?.address) {
      const query = encodeURIComponent(club.address);
      window.open(`https://yandex.ru/maps/?text=${query}`, '_blank');
    }
  };

  const formatWorkingHours = (hours) => {
    if (typeof hours === 'string') return hours;
    if (typeof hours === 'object' && hours !== null) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      
      let result = [];
      days.forEach((day, index) => {
        if (hours[day] && !hours[day].closed) {
          result.push(`${dayNames[index]}: ${hours[day].open}-${hours[day].close}`);
        }
      });
      
      return result.length > 0 ? result.join(', ') : 'Не указан';
    }
    return 'Не указан';
  };

  // Обработка ошибок загрузки изображений
  const handleImageError = useCallback((e) => {
    e.target.style.display = 'none';
    const placeholder = e.target.nextElementSibling;
    if (placeholder && placeholder.classList.contains('fitness-photo-placeholder')) {
      placeholder.style.display = 'flex';
    }
  }, []);

  const handleImageLoad = useCallback((e) => {
    e.target.style.display = 'block';
    const placeholder = e.target.nextElementSibling;
    if (placeholder && placeholder.classList.contains('fitness-photo-placeholder')) {
      placeholder.style.display = 'none';
    }
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="fitness-club-detail-loading">
          <div className="fitness-loading-spinner"></div>
          <p>Загрузка информации о клубе...</p>
        </div>
      </Layout>
    );
  }

  if (!club) {
    return (
      <Layout>
        <div className="fitness-club-detail-error">
          <h2>Клуб не найден</h2>
          <p>Возможно, клуб был удален или изменен адрес страницы</p>
          <button className="fitness-btn fitness-btn-primary" onClick={() => navigate('/clubs')}>
            Вернуться к списку клубов
          </button>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Обзор' },
    { id: 'schedule', label: 'Расписание' },
    { id: 'photos', label: 'Фото' },
    { id: 'reviews', label: 'Отзывы' }
  ];

  return (
    <Layout>
      <div className="fitness-club-detail-page">
        <div className="fitness-container">
          {/* YouTube-style Club Header */}
          <div className="fitness-club-channel-card">
            {/* Banner */}
            <div className="fitness-club-banner-section">
              {club.banner_url ? (
                <>
                  <img 
                    src={club.banner_url} 
                    alt={club.name} 
                    className="fitness-club-banner-img"
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                  />
                  <div className="fitness-club-banner-placeholder">
                    <span>Фото клуба</span>
                  </div>
                </>
              ) : (
                <div className="fitness-club-banner-placeholder">
                  <span>Фото клуба</span>
                </div>
              )}
            </div>

            {/* Channel Info */}
            <div className="fitness-club-channel-info">
              <div className="fitness-club-avatar">
                {club.logo_url ? (
                  <img 
                    src={club.logo_url} 
                    alt={club.name} 
                    className="fitness-club-avatar-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                    onLoad={(e) => {
                      e.target.style.display = 'block';
                      e.target.nextElementSibling.style.display = 'none';
                    }}
                  />
                ) : null}
                <div 
                  className="fitness-club-avatar-placeholder"
                  style={{ display: club.logo_url ? 'none' : 'flex' }}
                >
                  {club.name[0]?.toUpperCase()}
                </div>
              </div>

              <div className="fitness-club-details">
                <div className="fitness-club-name-section">
                  <h1 className="fitness-club-name">{club.name}</h1>
                  <div className="fitness-club-meta">
                    <span className="fitness-club-category">{club.category}</span>
                    <span className="fitness-club-separator">•</span>
                    <span className="fitness-club-address">{club.address}</span>
                  </div>
                  <div className="fitness-club-stats">
                    <div className="fitness-club-rating">
                      <div className="fitness-rating-stars">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < Math.floor(club.rating || 4.5) ? 'fitness-star filled' : 'fitness-star'}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="fitness-rating-text">{club.rating || 4.5} (127 отзывов)</span>
                    </div>
                  </div>
                </div>

                <div className="fitness-club-actions">
                  <button 
                    className="fitness-btn fitness-btn-primary"
                    onClick={handleCallClub}
                  >
                    Позвонить
                  </button>
                  <button 
                    className="fitness-btn fitness-btn-secondary"
                    onClick={handleGetDirections}
                  >
                    Маршрут
                  </button>
                  <button 
                    className="fitness-btn fitness-btn-outline"
                    onClick={handleShowOnMap}
                  >
                    На карте
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="fitness-club-navigation">
            <div className="fitness-club-tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`fitness-club-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="fitness-club-content">
            {activeTab === 'overview' && (
              <ClubOverview 
                club={club} 
                formatWorkingHours={formatWorkingHours}
                onShowMap={handleShowOnMap}
              />
            )}
            
            {activeTab === 'schedule' && (
              <ScheduleSection 
                clubId={id}
              />
            )}
            
            {activeTab === 'photos' && (
              <ClubPhotos
                club={club}
                selectedIndex={selectedImageIndex}
                onImageSelect={setSelectedImageIndex}
                onImageError={handleImageError}
                onImageLoad={handleImageLoad}
              />
            )}
            
            {activeTab === 'reviews' && (
              <ClubReviews club={club} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Компонент обзора клуба
const ClubOverview = ({ club, formatWorkingHours, onShowMap }) => {
  const amenitiesLabels = {
    parking: 'Парковка',
    lockers: 'Раздевалки',
    shower: 'Душевые',
    towels: 'Полотенца',
    wifi: 'Wi-Fi',
    air_conditioning: 'Кондиционер',
    cardio: 'Кардио-зона',
    weights: 'Тренажеры',
    free_weights: 'Свободные веса',
    functional: 'Функциональный тренинг',
    crossfit: 'CrossFit зона',
    boxing: 'Боксерская зона',
    sauna: 'Сауна',
    pool: 'Бассейн',
    massage: 'Массаж',
    spa: 'SPA-услуги',
    solarium: 'Солярий',
    cosmetology: 'Косметология',
    nutrition: 'Спортпитание',
    cafe: 'Кафе',
    shop: 'Магазин',
    childcare: 'Детская комната',
    personal_training: 'Персональные тренировки',
    group_classes: 'Групповые занятия'
  };

  return (
    <div className="fitness-club-overview">
      <div className="fitness-overview-content">
        <div className="fitness-content-section">
          <h3>О клубе</h3>
          <p className="fitness-club-description">
            {club.description || 'Описание клуба не указано.'}
          </p>
        </div>

        {club.amenities && club.amenities.length > 0 && (
          <div className="fitness-content-section">
            <h3>Услуги и удобства</h3>
            <div className="fitness-amenities-list">
              {club.amenities.map((amenity, index) => (
                <div key={index} className="fitness-amenity-tag">
                  <span className="fitness-amenity-check">✓</span>
                  <span className="fitness-amenity-name">
                    {amenitiesLabels[amenity] || amenity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="fitness-content-section">
          <h3>Цены</h3>
          <div className="fitness-price-section">
            <span className="fitness-price-text">
              {club.price_range || 'Цены уточняйте по телефону'}
            </span>
          </div>
        </div>
      </div>

      <div className="fitness-overview-sidebar">
        <div className="fitness-sidebar-card">
          <h4>Контакты</h4>
          <div className="fitness-contact-list">
            <div className="fitness-contact-row">
              <span className="fitness-contact-type">Телефон</span>
              <a href={`tel:${club.contact_phone}`} className="fitness-contact-link">
                {club.contact_phone}
              </a>
            </div>
            
            {club.contact_email && (
              <div className="fitness-contact-row">
                <span className="fitness-contact-type">Email</span>
                <a href={`mailto:${club.contact_email}`} className="fitness-contact-link">
                  {club.contact_email}
                </a>
              </div>
            )}
            
            {club.website && (
              <div className="fitness-contact-row">
                <span className="fitness-contact-type">Сайт</span>
                <a 
                  href={club.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="fitness-contact-link"
                >
                  Перейти на сайт
                </a>
              </div>
            )}

            {club.social_media?.instagram && (
              <div className="fitness-contact-row">
                <span className="fitness-contact-type">Instagram</span>
                <a 
                  href={club.social_media.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="fitness-contact-link"
                >
                  Посмотреть профиль
                </a>
              </div>
            )}

            {club.social_media?.vkontakte && (
              <div className="fitness-contact-row">
                <span className="fitness-contact-type">ВКонтакте</span>
                <a 
                  href={club.social_media.vkontakte} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="fitness-contact-link"
                >
                  Посмотреть группу
                </a>
              </div>
            )}

            {club.social_media?.telegram && (
              <div className="fitness-contact-row">
                <span className="fitness-contact-type">Telegram</span>
                <a 
                  href={club.social_media.telegram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="fitness-contact-link"
                >
                  Перейти в канал
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="fitness-sidebar-card">
          <h4>Режим работы</h4>
          <div className="fitness-hours-text">
            {formatWorkingHours(club.working_hours || club.opening_hours)}
          </div>
        </div>

        <div className="fitness-sidebar-card">
          <h4>Адрес</h4>
          <div className="fitness-address-section">
            <p>{club.address}</p>
            <button 
              className="fitness-btn fitness-btn-secondary fitness-btn-small"
              onClick={onShowMap}
            >
              Показать на карте
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Компонент фотогалереи
const ClubPhotos = ({ club, selectedIndex, onImageSelect, onImageError, onImageLoad }) => {
  const images = club.images || [];

  const handlePrevImage = useCallback(() => {
    onImageSelect(selectedIndex > 0 ? selectedIndex - 1 : images.length - 1);
  }, [selectedIndex, images.length, onImageSelect]);

  const handleNextImage = useCallback(() => {
    onImageSelect(selectedIndex < images.length - 1 ? selectedIndex + 1 : 0);
  }, [selectedIndex, images.length, onImageSelect]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') {
      handlePrevImage();
    } else if (e.key === 'ArrowRight') {
      handleNextImage();
    }
  }, [handlePrevImage, handleNextImage]);

  useEffect(() => {
    if (images.length > 0) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, images.length]);

  if (images.length === 0) {
    return (
      <div className="fitness-photos-section">
        <div className="fitness-empty-state">
          <h4>Нет фотографий</h4>
          <p>Клуб пока не добавил фотографии</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fitness-photos-section">
      <div className="fitness-current-photo">
        <img 
          src={images[selectedIndex]} 
          alt={`Фото ${selectedIndex + 1}`}
          onError={onImageError}
          onLoad={onImageLoad}
        />
        <div className="fitness-photo-placeholder">
          <span>Фото недоступно</span>
        </div>
        {images.length > 1 && (
          <div className="fitness-photo-controls">
            <button 
              className="fitness-photo-nav prev"
              onClick={handlePrevImage}
              aria-label="Предыдущее фото"
            >
              ‹
            </button>
            <span className="fitness-photo-counter">
              {selectedIndex + 1} / {images.length}
            </span>
            <button 
              className="fitness-photo-nav next"
              onClick={handleNextImage}
              aria-label="Следующее фото"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="fitness-photo-thumbs">
          {images.map((image, index) => (
            <div
              key={index}
              className={`fitness-photo-thumb ${index === selectedIndex ? 'active' : ''}`}
              onClick={() => onImageSelect(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onImageSelect(index);
                }
              }}
              aria-label={`Миниатюра фото ${index + 1}`}
            >
              <img 
                src={image} 
                alt={`Миниатюра ${index + 1}`}
                onError={onImageError}
                onLoad={onImageLoad}
              />
              <div className="fitness-thumb-placeholder">
                <span>Фото</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Компонент отзывов
const ClubReviews = ({ club }) => {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    text: '',
    name: ''
  });
  const [showReviewForm, setShowReviewForm] = useState(false);

  const mockReviews = [
    {
      id: 1,
      user: 'Анна Петрова',
      rating: 5,
      date: '2025-01-15',
      text: 'Отличный клуб! Современное оборудование, приветливый персонал. Хожу уже полгода, очень довольна результатами.',
      helpful: 12,
      verified: true
    },
    {
      id: 2,
      user: 'Дмитрий Иванов',
      rating: 4,
      date: '2025-01-10',
      text: 'Хорошие тренеры, разнообразные программы. Единственный минус - иногда много людей в вечернее время.',
      helpful: 8,
      verified: false
    },
    {
      id: 3,
      user: 'Мария Сидорова',
      rating: 5,
      date: '2025-01-05',
      text: 'Прекрасная атмосфера для тренировок. Особенно нравятся занятия йогой. Рекомендую всем!',
      helpful: 15,
      verified: true
    }
  ];

  const visibleReviews = showAllReviews ? mockReviews : mockReviews.slice(0, 3);

  const handleSubmitReview = (e) => {
    e.preventDefault();
    console.log('Отправка отзыва:', newReview);
    setShowReviewForm(false);
    setNewReview({ rating: 5, text: '', name: '' });
    alert('Спасибо за ваш отзыв! Он будет опубликован после модерации.');
  };

  const handleHelpfulClick = (reviewId) => {
    console.log('Отзыв полезен:', reviewId);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    mockReviews.forEach(review => {
      distribution[review.rating]++;
    });
    return distribution;
  };

  const ratingDistribution = calculateRatingDistribution();
  const totalReviews = mockReviews.length;

  return (
    <div className="fitness-reviews-section">
      <div className="fitness-reviews-top">
        <h3>Отзывы посетителей</h3>
        <div className="fitness-rating-summary">
          <div className="fitness-rating-display">
            <span className="fitness-rating-big">{club.rating || 4.5}</span>
            <div className="fitness-stars-display">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.floor(club.rating || 4.5) ? 'fitness-star filled' : 'fitness-star'}>
                  ★
                </span>
              ))}
            </div>
            <span className="fitness-reviews-total">{totalReviews} отзывов</span>
          </div>
          
          <div className="fitness-rating-breakdown">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="fitness-rating-row">
                <span className="fitness-rating-label">{rating} ★</span>
                <div className="fitness-rating-bar">
                  <div 
                    className="fitness-rating-fill"
                    style={{ 
                      width: `${totalReviews > 0 ? (ratingDistribution[rating] / totalReviews) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="fitness-rating-count">{ratingDistribution[rating]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fitness-reviews-list">
        {visibleReviews.map(review => (
          <div key={review.id} className="fitness-review-item">
            <div className="fitness-review-top">
              <div className="fitness-reviewer-data">
                <div className="fitness-reviewer-name-section">
                  <span className="fitness-reviewer-name">{review.user}</span>
                  {review.verified && (
                    <span className="fitness-verified-badge" title="Подтвержденный отзыв">
                      ✓
                    </span>
                  )}
                </div>
                <div className="fitness-review-stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < review.rating ? 'fitness-star filled' : 'fitness-star'}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <span className="fitness-review-date">
                {formatDate(review.date)}
              </span>
            </div>
            
            <div className="fitness-review-text">
              <p>{review.text}</p>
            </div>
            
            <div className="fitness-review-bottom">
              <button 
                className="fitness-helpful-button"
                onClick={() => handleHelpfulClick(review.id)}
              >
                Полезно ({review.helpful})
              </button>
            </div>
          </div>
        ))}
      </div>

      {mockReviews.length > 3 && (
        <div className="fitness-show-more-section">
          <button 
            className="fitness-btn fitness-btn-secondary"
            onClick={() => setShowAllReviews(!showAllReviews)}
          >
            {showAllReviews ? 'Скрыть отзывы' : `Показать все отзывы (${mockReviews.length})`}
          </button>
        </div>
      )}

      <div className="fitness-reviews-buttons">
        <button 
          className="fitness-btn fitness-btn-primary"
          onClick={() => setShowReviewForm(true)}
        >
          Написать отзыв
        </button>
      </div>

      {/* Форма нового отзыва */}
      {showReviewForm && (
        <div className="fitness-review-form-overlay">
          <div className="fitness-review-form-modal">
            <div className="fitness-review-form-header">
              <h4>Написать отзыв</h4>
              <button 
                className="fitness-review-form-close"
                onClick={() => setShowReviewForm(false)}
                type="button"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmitReview} className="fitness-review-form">
              <div className="fitness-form-group">
                <label htmlFor="reviewName">Ваше имя</label>
                <input
                  type="text"
                  id="reviewName"
                  value={newReview.name}
                  onChange={(e) => setNewReview(prev => ({...prev, name: e.target.value}))}
                  placeholder="Введите ваше имя"
                  required
                />
              </div>

              <div className="fitness-form-group">
                <label>Оценка</label>
                <div className="fitness-rating-input">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`fitness-rating-star ${star <= newReview.rating ? 'active' : ''}`}
                      onClick={() => setNewReview(prev => ({...prev, rating: star}))}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="fitness-form-group">
                <label htmlFor="reviewText">Ваш отзыв</label>
                <textarea
                  id="reviewText"
                  value={newReview.text}
                  onChange={(e) => setNewReview(prev => ({...prev, text: e.target.value}))}
                  placeholder="Поделитесь своим мнением о клубе..."
                  rows="4"
                  required
                />
              </div>

              <div className="fitness-review-form-actions">
                <button 
                  type="button" 
                  className="fitness-btn fitness-btn-secondary"
                  onClick={() => setShowReviewForm(false)}
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className="fitness-btn fitness-btn-primary"
                >
                  Опубликовать отзыв
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubDetailPage;