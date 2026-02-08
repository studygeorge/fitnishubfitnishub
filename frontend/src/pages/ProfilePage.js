import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TelegramLinkModal from '../components/TelegramLinkModal';
import './ProfilePage.css';

const ProfilePage = () => {
  const { 
    user, 
    isAuthenticated, 
    loading: authLoading, 
    api, 
    refreshUserProfile,
    checkTelegramStatus,
    uploadAvatar,
    removeAvatar
  } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);
  const [error, setError] = useState(null);

  // НОВОЕ: Локальное состояние для аватара
  const [currentAvatar, setCurrentAvatar] = useState(null);

  // Состояния для формы настроек
  const [settingsForm, setSettingsForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Состояния для аватаров
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  // Telegram состояния
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState({
    isLinked: false,
    telegramUsername: null
  });

  // Состояния для кастомных alert модальных окон
  const [alertModal, setAlertModal] = useState({
    show: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'OK'
  });

  // НОВОЕ: Обновляем локальный аватар при изменении пользователя
  useEffect(() => {
    if (user) {
      setCurrentAvatar(user.profile_image);
    }
  }, [user?.profile_image]);

  // Функция для показа кастомного alert
  const showAlert = (type, title, message, onConfirm = null, confirmText = 'OK') => {
    setAlertModal({
      show: true,
      type,
      title,
      message,
      onConfirm,
      confirmText
    });
  };

  // Закрытие alert модального окна
  const closeAlert = () => {
    if (alertModal.onConfirm) {
      alertModal.onConfirm();
    }
    setAlertModal({
      show: false,
      type: 'info',
      title: '',
      message: '',
      onConfirm: null,
      confirmText: 'OK'
    });
  };

  // Функция для получения иконки alert'а
  const getAlertIcon = (type) => {
    switch (type) {
      case 'success':
        return <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>;
      case 'warning':  
        return <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>;
      case 'error':
        return <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>;
      default: // info
        return <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,12 0 0,0 12,2M11,17H13V11H11M11,9H13V7H11"/>;
    }
  };

  // ОБНОВЛЕННАЯ ФУНКЦИЯ ДЛЯ ЗАГРУЗКИ АВАТАРА
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      showAlert('warning', 'Неверный файл', 'Пожалуйста, выберите изображение');
      return;
    }

    // Проверка размера файла (50MB)
    if (file.size > 50 * 1024 * 1024) {
      showAlert('warning', 'Файл слишком большой', 'Размер файла не должен превышать 50MB');
      return;
    }

    try {
      setAvatarUploading(true);
      setShowAvatarMenu(false);

      console.log('Начинаем загрузку аватара...');

      // НОВОЕ: Сразу показываем превью загружаемого файла
      const previewUrl = URL.createObjectURL(file);
      setCurrentAvatar(previewUrl);
      
      // Используем функцию из AuthContext
      const result = await uploadAvatar(file);

      if (result.success) {
        // НОВОЕ: Обновляем на окончательный URL
        setCurrentAvatar(result.imageUrl);
        
        showAlert('success', 'Успешно', 'Аватар загружен успешно');
        
        // Обновляем профиль пользователя для получения новых данных
        await refreshUserProfile();
        
        console.log('Аватар успешно загружен:', result.imageUrl);
      } else {
        // В случае ошибки возвращаем старый аватар
        setCurrentAvatar(user?.profile_image || null);
        throw new Error(result.error || 'Ошибка загрузки аватара');
      }
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      // В случае ошибки возвращаем старый аватар
      setCurrentAvatar(user?.profile_image || null);
      showAlert('error', 'Ошибка загрузки', error.message);
    } finally {
      setAvatarUploading(false);
      // Сбрасываем значение input
      event.target.value = '';
    }
  };

  // ОБНОВЛЕННАЯ ФУНКЦИЯ ДЛЯ УДАЛЕНИЯ АВАТАРА
  const handleDeleteAvatar = async () => {
    try {
      setShowAvatarMenu(false);
      setAvatarUploading(true);

      console.log('🗑️ Начинаем удаление аватара...');

      // НОВОЕ: Сразу убираем аватар из отображения
      const oldAvatar = currentAvatar;
      setCurrentAvatar(null);

      // Используем функцию из AuthContext
      const result = await removeAvatar();

      if (result.success) {
        showAlert('success', 'Успешно', 'Аватар удален');
        
        // Обновляем профиль пользователя
        await refreshUserProfile();
        
        console.log('Аватар успешно удален');
      } else {
        // В случае ошибки возвращаем старый аватар
        setCurrentAvatar(oldAvatar);
        throw new Error(result.error || 'Ошибка удаления аватара');
      }
    } catch (error) {
      console.error('Ошибка удаления аватара:', error);
      // В случае ошибки возвращаем старый аватар
      setCurrentAvatar(user?.profile_image || null);
      showAlert('error', 'Ошибка удаления', error.message);
    } finally {
      setAvatarUploading(false);
    }
  };

  // ОБНОВЛЕННАЯ ФУНКЦИЯ ДЛЯ ЗАГРУЗКИ АВАТАРА В НАСТРОЙКАХ
  const handleSettingsAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      showAlert('warning', 'Неверный файл', 'Пожалуйста, выберите изображение');
      event.target.value = '';
      return;
    }

    // Проверка размера файла (50MB)
    if (file.size > 50 * 1024 * 1024) {
      showAlert('warning', 'Файл слишком большой', 'Размер файла не должен превышать 50MB');
      event.target.value = '';
      return;
    }

    try {
      setAvatarUploading(true);

      console.log('Начинаем загрузку аватара из настроек...');

      // НОВОЕ: Сразу показываем превью загружаемого файла
      const previewUrl = URL.createObjectURL(file);
      setCurrentAvatar(previewUrl);
      
      // Используем функцию из AuthContext
      const result = await uploadAvatar(file);

      if (result.success) {
        // НОВОЕ: Обновляем на окончательный URL
        setCurrentAvatar(result.imageUrl);
        
        showAlert('success', 'Успешно', 'Фото профиля обновлено успешно');
        
        // Обновляем профиль пользователя для получения новых данных
        await refreshUserProfile();
        
        console.log('Аватар успешно загружен из настроек:', result.imageUrl);
      } else {
        // В случае ошибки возвращаем старый аватар
        setCurrentAvatar(user?.profile_image || null);
        throw new Error(result.error || 'Ошибка загрузки аватара');
      }
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      // В случае ошибки возвращаем старый аватар
      setCurrentAvatar(user?.profile_image || null);
      showAlert('error', 'Ошибка загрузки', error.message);
    } finally {
      setAvatarUploading(false);
      // Сбрасываем значение input
      event.target.value = '';
    }
  };

  // Функции для корректного форматирования времени
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    date.setHours(date.getHours() - 3);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    date.setHours(date.getHours() - 3);
    return date.toLocaleDateString('ru-RU');
  };

  // Функция проверки Telegram статуса
  const updateTelegramStatus = async () => {
    try {
      if (refreshUserProfile) {
        await refreshUserProfile();
      }

      if (checkTelegramStatus) {
        const result = await checkTelegramStatus();
        
        if (result.success) {
          setTelegramStatus({
            isLinked: result.isLinked,
            telegramUsername: result.telegramUsername
          });
        }
      }
    } catch (error) {
      console.error('Ошибка обновления Telegram статуса:', error);
    }
  };

  // Инициализируем форму данными пользователя
  useEffect(() => {
    if (user) {
      setSettingsForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      
      updateTelegramStatus();
    }
  }, [user?.id]);

  // Функция для обработки изменений в форме
  const handleSettingsChange = (field, value) => {
    setSettingsForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Функция для сохранения изменений
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    
    try {
      setSettingsLoading(true);
      
      if (!settingsForm.first_name.trim() || !settingsForm.last_name.trim()) {
        showAlert('warning', 'Неверные данные', 'Имя и фамилия обязательны для заполнения');
        return;
      }
      
      if (!settingsForm.email.trim()) {
        showAlert('warning', 'Неверные данные', 'Email обязателен для заполнения');
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(settingsForm.email)) {
        showAlert('warning', 'Неверные данные', 'Введите корректный email адрес');
        return;
      }
      
      const updateData = {
        first_name: settingsForm.first_name.trim(),
        last_name: settingsForm.last_name.trim(),
        email: settingsForm.email.trim(),
        phone: settingsForm.phone.trim() || null
      };
      
      await api.users.updateProfile(updateData);
      
      showAlert('success', 'Успешно', 'Настройки профиля сохранены');
      
    } catch (error) {
      console.error('Ошибка при сохранении настроек:', error);
      showAlert('error', 'Ошибка сохранения', error.message || 'Не удалось сохранить настройки профиля');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Telegram функции
  const startTelegramLinking = () => {
    setShowTelegramModal(true);
  };

  // Функция отвязки Telegram
  const unlinkTelegram = async () => {
    try {
      const response = await fetch('/api/telegram/user/unlink', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        showAlert('success', 'Успешно', 'Telegram аккаунт отвязан. Уведомления об отмене занятий больше не будут приходить.');
        
        setTelegramStatus({
          isLinked: false,
          telegramUsername: null
        });
        
        if (refreshUserProfile) {
          await refreshUserProfile();
        }
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showAlert('error', 'Ошибка', data.message);
      }
    } catch (error) {
      console.error('Ошибка отвязки Telegram:', error);
      showAlert('error', 'Ошибка', 'Ошибка при отвязке аккаунта');
    }
  };

  // Остальные функции
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated && user) {
        try {
          setError(null);
          
          const [bookingsData, historyData] = await Promise.allSettled([
            api.bookings.getUserBookings(),
            api.bookings.getVisitHistory()
          ]);

          if (bookingsData.status === 'fulfilled') {
            setBookings(Array.isArray(bookingsData.value) ? bookingsData.value : []);
          } else {
            console.error('Ошибка загрузки бронирований:', bookingsData.reason);
            setBookings([]);
          }

          if (historyData.status === 'fulfilled') {
            setVisitHistory(Array.isArray(historyData.value) ? historyData.value : []);
          } else {
            console.error('Ошибка загрузки истории:', historyData.reason);
            setVisitHistory([]);
          }

        } catch (error) {
          console.error('Ошибка при загрузке данных профиля:', error);
          setError('Не удалось загрузить данные профиля');
          setBookings([]);
          setVisitHistory([]);
        }
      }
      setLoading(false);
    };

    if (!authLoading) {
      fetchUserData();
    }
  }, [isAuthenticated, authLoading, api]);

  const handleCancelBooking = async (id) => {
    try {
      const response = await api.bookings.cancelBooking(id);
      
      setBookings(bookings.filter(booking => booking.id !== id));
      
      const alertType = response.refunded ? 'success' : 'info';
      const title = response.refunded ? 'Бронирование отменено' : 'Бронирование отменено';
      
      if (response.refunded) {
        showAlert(
          alertType, 
          title, 
          response.message,
          () => {
            window.location.href = '/schedule';
          },
          'Перейти к расписанию'
        );
      } else {
        showAlert(alertType, title, response.message);
      }
      
    } catch (error) {
      console.error('Ошибка при отмене бронирования:', error);
      showAlert('error', 'Ошибка', 'Не удалось отменить бронирование: ' + error.message);
    }
  };

  const handleAddRating = async (bookingId, rating, feedback = '') => {
    try {
      await api.bookings.addRating(bookingId, rating, feedback);
      const updatedHistory = visitHistory.map(visit => 
        visit.id === bookingId 
          ? { ...visit, rating, feedback }
          : visit
      );
      setVisitHistory(updatedHistory);
      showAlert('success', 'Успешно', 'Оценка добавлена');
    } catch (error) {
      console.error('Ошибка при добавлении оценки:', error);
      showAlert('error', 'Ошибка', 'Не удалось добавить оценку: ' + error.message);
    }
  };

  // Показываем загрузку только при первоначальной проверке авторизации
  if (authLoading) {
    return (
      <div className="fitness-profile-loading">
        <div className="fitness-loading-spinner"></div>
        <p>Проверка авторизации...</p>
      </div>
    );
  }

  // Если пользователь не авторизован
  if (!isAuthenticated) {
    return (
      <div className="fitness-profile-page">
        <div className="fitness-auth-prompt">
          <div className="fitness-auth-card">
            <div className="fitness-auth-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
              </svg>
            </div>
            <h2>Личный кабинет</h2>
            <p>Войдите в свой аккаунт для управления профилем и записями на занятия</p>
            
            <div className="fitness-auth-benefits">
              <div className="fitness-benefit-item">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
                <span>Управление записями</span>
              </div>
              <div className="fitness-benefit-item">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                </svg>
                <span>Контроль баланса</span>
              </div>
              <div className="fitness-benefit-item">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z"/>
                </svg>
                <span>История посещений</span>
              </div>
            </div>

            <div className="fitness-auth-actions">
              <Link to="/login" className="fitness-btn fitness-btn-primary">
                Войти в аккаунт
              </Link>
              <Link to="/register" className="fitness-btn fitness-btn-secondary">
                Создать аккаунт
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Показываем загрузку данных профиля
  if (loading) {
    return (
      <div className="fitness-profile-loading">
        <div className="fitness-loading-spinner"></div>
        <p>Загружаем данные профиля...</p>
      </div>
    );
  }

  // Если есть ошибка
  if (error) {
    return (
      <div className="fitness-profile-page">
        <div className="fitness-profile-error">
          <div className="fitness-error-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V21C3 22.1 3.9 23 5 23H19C20.1 23 21 22.1 21 21V9M19 9H14V4H5V21H19V9Z"/>
            </svg>
          </div>
          <h2>Ошибка загрузки</h2>
          <p>{error}</p>
          <button 
            className="fitness-btn fitness-btn-primary" 
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  // Основной контент
  return (
    <div className="fitness-profile-page">
      <div className="fitness-profile-header">
        <div className="fitness-profile-info">
          <div className="fitness-profile-avatar">
            {currentAvatar ? (
              <img 
                src={currentAvatar} 
                alt={`${user.first_name} ${user.last_name}`}
                onError={(e) => {
                  console.log('Ошибка загрузки изображения:', currentAvatar);
                  // Если изображение не загрузилось, показываем placeholder
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : (
              <div className="fitness-avatar-placeholder show">
                {user.first_name?.[0]?.toUpperCase() || user.last_name?.[0]?.toUpperCase() || 'У'}
              </div>
            )}
            
            {/* Placeholder на случай ошибки загрузки изображения */}
            {currentAvatar && (
              <div className="fitness-avatar-placeholder" style={{display: 'none'}}>
                {user.first_name?.[0]?.toUpperCase() || user.last_name?.[0]?.toUpperCase() || 'У'}
              </div>
            )}
          </div>

          <div className="fitness-profile-details">
            <div className="fitness-profile-name-section">
              <h1>{user.first_name} {user.last_name}</h1>
              
              <div className="fitness-telegram-button-section">
                {telegramStatus.isLinked ? (
                  <div className="fitness-telegram-connected">
                    <span className="fitness-telegram-status">
                      Уведомления включены
                    </span>
                    <button
                      className="fitness-telegram-unlink-btn"
                      onClick={unlinkTelegram}
                      title="Отключить Telegram уведомления"
                    >
                      Отключить
                    </button>
                  </div>
                ) : (
                  <button
                    className="fitness-telegram-link-btn"
                    onClick={startTelegramLinking}
                    disabled={showTelegramModal}
                  >
                    {showTelegramModal ? 'Подключение...' : 'Уведомления в Telegram'}
                  </button>
                )}
              </div>
            </div>
            
            <div className="fitness-user-stats">
              <div className="fitness-stat">
                <span className="fitness-stat-value">{parseFloat(user.balance || 0).toLocaleString()} ₽</span>
                <span className="fitness-stat-label">Баланс</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="fitness-balance-section">
          <Link to="/balance" className="fitness-balance-button">
            Пополнить баланс
          </Link>
        </div>
      </div>

      {/* Telegram Modal */}
      <TelegramLinkModal
        isOpen={showTelegramModal}
        onClose={() => setShowTelegramModal(false)}
        user={user}
        onSuccess={updateTelegramStatus}
        showAlert={showAlert}
      />

      <div className="fitness-profile-tabs">
        <button 
          className={`fitness-profile-tab ${activeTab === 'bookings' ? 'active' : ''}`} 
          onClick={() => setActiveTab('bookings')}
        >
          Записи 
        </button>
        <button 
          className={`fitness-profile-tab ${activeTab === 'history' ? 'active' : ''}`} 
          onClick={() => setActiveTab('history')}
        >
          История 
        </button>
        <button 
          className={`fitness-profile-tab ${activeTab === 'settings' ? 'active' : ''}`} 
          onClick={() => setActiveTab('settings')}
        >
          Настройки
        </button>
      </div>

      <div className="fitness-profile-content">
        {activeTab === 'bookings' && (
          <div className="fitness-profile-section">
            {bookings.length === 0 ? (
              <div className="fitness-empty-state">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
                <h3>Нет запланированных занятий</h3>
                <p>У вас пока нет записей на занятия. Найдите подходящие тренировки в расписании.</p>
                <Link to="/schedule" className="fitness-btn fitness-btn-primary">
                  Перейти к расписанию
                </Link>
              </div>
            ) : (
              <div className="fitness-bookings-list">
                {bookings.map(booking => (
                  <div className="fitness-booking-card" key={booking.id}>
                    <div className="fitness-booking-info">
                      <h3>{booking.class_name}</h3>
                      <p className="fitness-booking-club">{booking.club_name}</p>
                      {booking.booking_code && (
                        <p className="fitness-booking-code">
                          <span className="fitness-booking-code-label">Код:</span>
                          <span className="fitness-booking-code-value">{booking.booking_code}</span>
                        </p>
                      )}
                      
                      <div className="fitness-booking-details">
                        <span className="fitness-booking-date">
                          {formatDate(booking.start_time)}
                        </span>
                        <span className="fitness-booking-time">
                          {formatTime(booking.start_time)}
                        </span>
                        {booking.trainer && (
                          <span className="fitness-booking-trainer">{booking.trainer}</span>
                        )}
                      </div>
                      
                      <div className="fitness-booking-footer">
                        {booking.status === 'cancelled_by_club' && (
                          <div className="fitness-club-cancellation-notice">
                            <p>К сожалению, занятие отменено клубом. Деньги возвращены на счет автоматически.</p>
                            <p>Вы можете перенести занятие на другое время или выбрать занятие в другом клубе.</p>
                          </div>
                        )}
                        
                        <div className="fitness-booking-actions">
                          {booking.status === 'confirmed' && (
                            <button 
                              className="fitness-btn fitness-btn-danger" 
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              Отменить
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="fitness-profile-section">
            {visitHistory.length === 0 ? (
              <div className="fitness-empty-state">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z"/>
                </svg>
                <h3>История пуста</h3>
                <p>У вас пока нет завершенных посещений. После посещения занятий они появятся здесь.</p>
              </div>
            ) : (
              <div className="fitness-visit-history">
                {visitHistory.map(visit => (
                  <div className="fitness-visit-card" key={visit.id}>
                    <div className="fitness-visit-info">
                      <h3>{visit.class_name}</h3>
                      <p className="fitness-visit-club">{visit.club_name}</p>
                      
                      <div className="fitness-visit-details">
                        <span className="fitness-visit-date">
                          {formatDate(visit.start_time)}
                        </span>
                        <span className="fitness-visit-time">
                          {formatTime(visit.start_time)}
                        </span>
                        {visit.trainer && (
                          <span className="fitness-visit-trainer">{visit.trainer}</span>
                        )}
                      </div>
                    </div>
                    <div className="fitness-visit-rating">
                      <p>Ваша оценка:</p>
                      <div className="fitness-rating-stars">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span 
                            key={star} 
                            className={`fitness-star ${star <= (visit.rating || 0) ? 'filled' : ''}`}
                            onClick={() => !visit.rating && handleAddRating(visit.id, star)}
                            style={{ cursor: visit.rating ? 'default' : 'pointer' }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      {visit.feedback && (
                        <p className="fitness-visit-feedback">"{visit.feedback}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="fitness-profile-section">
            
            {/* РАЗДЕЛ ДЛЯ УПРАВЛЕНИЯ АВАТАРОМ */}
            <div className="fitness-avatar-settings">
              <h3>Фото профиля</h3>
              
              <div className="fitness-avatar-setting-item">
                <div className="fitness-avatar-setting-preview">
                  <div className="fitness-avatar-preview-image">
                    {currentAvatar ? (
                      <img 
                        src={currentAvatar} 
                        alt="Текущее фото профиля"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="fitness-avatar-placeholder show">
                        {user.first_name?.[0]?.toUpperCase() || user.last_name?.[0]?.toUpperCase() || 'У'}
                      </div>
                    )}
                    
                    {currentAvatar && (
                      <div className="fitness-avatar-placeholder" style={{display: 'none'}}>
                        {user.first_name?.[0]?.toUpperCase() || user.last_name?.[0]?.toUpperCase() || 'У'}
                      </div>
                    )}
                  </div>
                  
                  <div className="fitness-avatar-setting-info">
                    <h4>Загрузите фото профиля</h4>
                    <p>Рекомендуемый размер: 200x200 пикселей. Максимальный размер файла: 50MB.</p>
                    <p>Поддерживаемые форматы: JPG, PNG, GIF, WebP, BMP, TIFF, SVG</p>
                    {currentAvatar && (
                      <small className="fitness-current-photo-status">Фото загружено</small>
                    )}
                  </div>
                </div>
                
                <div className="fitness-avatar-setting-actions">
                  <input
                    type="file"
                    id="settings-avatar-upload"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleSettingsAvatarUpload}
                    disabled={avatarUploading}
                  />
                  
                  <button
                    type="button"
                    className="fitness-btn fitness-btn-primary"
                    onClick={() => {
                      console.log('📤 Клик на загрузку из настроек');
                      document.getElementById('settings-avatar-upload').click();
                    }}
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? (
                      <>
                        <div className="fitness-btn-loading-spinner"></div>
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                        </svg>
                        {currentAvatar ? 'Изменить фото' : 'Загрузить фото'}
                      </>
                    )}
                  </button>
                  
                  {currentAvatar && (
                    <button
                      type="button"
                      className="fitness-btn fitness-btn-secondary"
                      onClick={handleDeleteAvatar}
                      disabled={avatarUploading}
                    >
                      {avatarUploading ? (
                        <>
                          <div className="fitness-btn-loading-spinner"></div>
                          Удаление...
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/>
                          </svg>
                          Удалить фото
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="fitness-telegram-settings">
              <h3>Telegram уведомления</h3>
              
              <div className="fitness-telegram-setting-item">
                <div className="fitness-telegram-setting-info">
                  <div>
                    <h4>Уведомления об отмене занятий</h4>
                    <p>Получайте мгновенные уведомления в Telegram, если клуб отменяет ваше занятие. Вы узнаете о возврате средств и сможете быстро перенести запись.</p>
                    {telegramStatus.isLinked && telegramStatus.telegramUsername && (
                      <small>Подключен: @{telegramStatus.telegramUsername}</small>
                    )}
                  </div>
                </div>
                <div className="fitness-telegram-setting-status">
                  {telegramStatus.isLinked ? (
                    <div className="fitness-telegram-enabled">
                      <span className="fitness-status-text">Включено</span>
                    </div>
                  ) : (
                    <div className="fitness-telegram-disabled">
                      <span className="fitness-status-text">Отключено</span>
                      <button 
                        className="fitness-btn fitness-btn-sm fitness-btn-primary"
                        onClick={startTelegramLinking}
                        disabled={showTelegramModal}
                      >
                        Подключить уведомления в Telegram
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <form className="fitness-settings-form" onSubmit={handleSaveSettings}>
              <div className="fitness-form-row">
                <div className="fitness-form-group">
                  <label>Имя *</label>
                  <input 
                    type="text" 
                    value={settingsForm.first_name}
                    onChange={(e) => handleSettingsChange('first_name', e.target.value)}
                    required
                    disabled={settingsLoading}
                  />
                </div>
                <div className="fitness-form-group">
                  <label>Фамилия *</label>
                  <input 
                    type="text" 
                    value={settingsForm.last_name}
                    onChange={(e) => handleSettingsChange('last_name', e.target.value)}
                    required
                    disabled={settingsLoading}
                  />
                </div>
              </div>
              <div className="fitness-form-group">
                <label>Email *</label>
                <input 
                  type="email" 
                  value={settingsForm.email}
                  onChange={(e) => handleSettingsChange('email', e.target.value)}
                  required
                  disabled={settingsLoading}
                />
              </div>
              <div className="fitness-form-group">
                <label>Телефон</label>
                <input 
                  type="tel" 
                  value={settingsForm.phone}
                  onChange={(e) => handleSettingsChange('phone', e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                  disabled={settingsLoading}
                />
              </div>
              
              <div className="fitness-form-actions">
                <button 
                  type="submit" 
                  className="fitness-btn fitness-btn-primary"
                  disabled={settingsLoading}
                >
                  {settingsLoading ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {alertModal.show && (
        <div className="fitness-modal-overlay" onClick={closeAlert}>
          <div className="fitness-modal fitness-alert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fitness-modal-header">
              <div className={`fitness-alert-icon fitness-alert-icon-${alertModal.type}`}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  {getAlertIcon(alertModal.type)}
                </svg>
              </div>
              <h3>{alertModal.title}</h3>
              <button className="fitness-modal-close" onClick={closeAlert}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            
            <div className="fitness-modal-content">
              <p className="fitness-alert-message">{alertModal.message}</p>
            </div>
            
            <div className="fitness-modal-actions">
              <button className="fitness-btn fitness-btn-primary" onClick={closeAlert}>
                {alertModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;