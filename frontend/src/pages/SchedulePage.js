import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './SchedulePage.css';
import { generateVisitCode, formatVisitCode } from '../utils/visitCode';

const SchedulePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialClubId = queryParams.get('clubId');
  const [currentUser, setCurrentUser] = useState(null);

  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClubId, setSelectedClubId] = useState(initialClubId || 'all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [clubs, setClubs] = useState([]);
  const [error, setError] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [userBookings, setUserBookings] = useState([]);
  const [telegramLinked, setTelegramLinked] = useState(false);
  
  // Состояния для модального окна бронирования
  const [bookingModal, setBookingModal] = useState({
    show: false,
    classItem: null,
    loading: false
  });

  // Состояния для модального окна успешного бронирования
  const [successModal, setSuccessModal] = useState({
    show: false,
    classItem: null,
    newBalance: 0,
    visitCode: '',
    telegramSent: false
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

  // НОВАЯ ФУНКЦИЯ - Обработка клика по занятию для перехода на страницу клуба
  const handleClassItemClick = (e, classItem) => {
    // Проверяем, что клик был не по кнопке записи или другим интерактивным элементам
    if (e.target.closest('.schd-book-btn') || 
        e.target.closest('button') || 
        e.target.closest('a')) {
      return; // Не переходим, если кликнули по кнопке или ссылке
    }
    
    // Получаем club_id из данных занятия
    const clubId = classItem.club_id;
    
    if (clubId) {
      // Переходим на страницу клуба
      navigate(`/clubs/${clubId}`);
    }
  };

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

  // Функция для форматирования кода посещения в слитный формат из 4 цифр
  const formatVisitCodeCompact = (code) => {
    if (!code) return '';
    
    // Удаляем все нецифровые символы
    const digitsOnly = code.replace(/\D/g, '');
    
    // Берем последние 4 цифры или дополняем до 4 нулями в начале
    const fourDigits = digitsOnly.slice(-4).padStart(4, '0');
    
    return fourDigits;
  };

  // Функция для корректного форматирования даты в строку YYYY-MM-DD
  const formatDateToString = (date) => {
    if (!date) return null;
    
    const localDate = new Date(date);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // Функция для создания даты из строки без проблем с часовыми поясами
  const createDateFromString = (dateString) => {
    if (!dateString) return new Date();
    
    if (typeof dateString === 'string' && dateString.includes('-')) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    
    return new Date(dateString);
  };

  // Правильное форматирование времени из datetime
  const formatTime = (datetimeString) => {
    if (!datetimeString) return '00:00';
    
    try {
      if (typeof datetimeString === 'string') {
        if (datetimeString.includes('T')) {
          const timePart = datetimeString.split('T')[1];
          if (timePart && timePart.includes(':')) {
            const [hours, minutes] = timePart.split(':');
            return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
          }
        }
        if (datetimeString.includes(' ')) {
          const timePart = datetimeString.split(' ')[1];
          if (timePart && timePart.includes(':')) {
            const [hours, minutes] = timePart.split(':');
            return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
          }
        }
        if (datetimeString.includes(':') && !datetimeString.includes('-')) {
          const parts = datetimeString.split(':');
          if (parts.length >= 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
          }
        }
      }
      
      return '00:00';
    } catch (error) {
      console.error('Ошибка форматирования времени:', error, datetimeString);
      return '00:00';
    }
  };

  // Улучшенное форматирование даты для отображения
  const formatDisplayDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    
    const isToday = targetDate.getTime() === todayDate.getTime();
    const isTomorrow = targetDate.getTime() === tomorrowDate.getTime();
    
    if (isToday) return 'Сегодня';
    if (isTomorrow) return 'Завтра';
    
    return date.toLocaleDateString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  // Генерация дат для быстрого выбора
  const getQuickDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  // Загрузка баланса пользователя
  const fetchUserBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const user = await api.auth.getCurrentUser();
        setUserBalance(parseFloat(user.balance) || 0);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Ошибка при загрузке баланса:', error);
    }
  };

  // Загрузка бронирований пользователя
  const fetchUserBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const bookings = await api.bookings.getUserBookings();
        setUserBookings(bookings || []);
      }
    } catch (error) {
      console.error('Ошибка при загрузке бронирований:', error);
    }
  };

  // НОВАЯ ФУНКЦИЯ: Проверка статуса привязки Telegram
  const checkTelegramStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const status = await api.telegram.user.getStatus();
        setTelegramLinked(status.isLinked || false);
        console.log('Статус привязки Telegram:', status);
      }
    } catch (error) {
      console.error('Ошибка при проверке статуса Telegram:', error);
      setTelegramLinked(false);
    }
  };

  // Проверка, записан ли пользователь на занятие
  const isUserBookedForClass = (classId) => {
    return userBookings.some(booking => 
      booking.schedule_id === classId || booking.class_id === classId
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const clubsData = await api.clubs.getAll();
        setClubs(clubsData);
        
        const dateStr = formatDateToString(selectedDate);
        const filters = { date: dateStr };
        
        if (selectedClubId !== 'all') {
          filters.club = selectedClubId;
        }
        
        if (selectedCategory !== 'all') {
          filters.category = selectedCategory;
        }
        
        console.log('Загружаем расписание с фильтрами:', filters);
        
        const scheduleData = await api.schedule.getAll(filters);
        console.log('Получено расписание:', scheduleData);
        
        const processedSchedule = scheduleData.map(item => {
          const capacity = parseInt(item.max_participants || item.capacity) || 0;
          const booked = parseInt(item.current_participants || item.booked) || 0;
          const price = parseFloat(item.price) || 0;
          const availableSpots = Math.max(0, capacity - booked);
          
          let duration = item.duration || 60;
          
          if (item.start_time && item.end_time) {
            try {
              const startTime = new Date(item.start_time);
              const endTime = new Date(item.end_time);
              
              if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
                const diffMs = endTime.getTime() - startTime.getTime();
                const diffMinutes = Math.round(diffMs / (60 * 1000));
                
                if (diffMinutes > 0) {
                  duration = diffMinutes;
                }
              }
            } catch (error) {
              console.error('Ошибка вычисления длительности:', error);
            }
          }
          
          const processed = {
            ...item,
            availableSpots,
            totalSpots: capacity,
            className: item.title || item.class_name || 'Без названия',
            startTime: formatTime(item.time || item.start_time),
            endTime: formatTime(item.end_time),
            duration,
            price,
            trainer: item.instructor || item.trainer
          };
          
          return processed;
        });
        
        setSchedule(processedSchedule);
        
        await fetchUserBalance();
        await fetchUserBookings();
        await checkTelegramStatus();
        
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        setError('Не удалось загрузить расписание. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedDate, selectedClubId, selectedCategory]);

  // Группировка занятий по клубам
  const groupedSchedule = schedule.reduce((groups, item) => {
    const clubKey = item.club_id || 'unknown';
    
    if (!groups[clubKey]) {
      const club = clubs.find(c => c.id === parseInt(item.club_id));
      groups[clubKey] = {
        clubName: club ? club.name : 'Неизвестный клуб',
        classes: []
      };
    }
    groups[clubKey].classes.push(item);
    return groups;
  }, {});

  // Открытие модального окна бронирования с проверками
  const openBookingModal = (classItem) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      showAlert(
        'warning', 
        'Требуется авторизация', 
        'Для записи на занятие необходимо войти в систему'
      );
      return;
    }
    
    if (isUserBookedForClass(classItem.id)) {
      showAlert(
        'info', 
        'Уже записаны', 
        'Вы уже записаны на это занятие'
      );
      return;
    }
    
    if (classItem.availableSpots <= 0) {
      showAlert(
        'error', 
        'Нет свободных мест', 
        'К сожалению, все места на это занятие уже заняты'
      );
      return;
    }
    
    const price = parseFloat(classItem.price) || 0;
    const balance = parseFloat(userBalance) || 0;
    
    if (balance < price) {
      showAlert(
        'error', 
        'Недостаточно средств', 
        `Недостаточно средств на балансе.\nТребуется: ${price} ₽\nДоступно: ${balance} ₽`,
        () => {
          navigate('/balance');
        },
        'Пополнить баланс'
      );
      return;
    }
    
    setBookingModal({
      show: true,
      classItem,
      loading: false
    });
  };

  // ОБНОВЛЕННАЯ ФУНКЦИЯ: Подтверждение бронирования с уведомлением в Telegram
  const confirmBooking = async () => {
    try {
      setBookingModal(prev => ({ ...prev, loading: true }));
      
      const classItem = bookingModal.classItem;
      const price = parseFloat(classItem.price) || 0;
      
      const visitCode = generateVisitCode(
        currentUser?.first_name || 'User',
        new Date().toISOString()
      );
      
      console.log('Сгенерированный код посещения:', visitCode);
      
      const bookingData = {
        schedule_id: parseInt(classItem.id),
        visit_code: visitCode
      };
      
      console.log('Отправляем данные бронирования:', bookingData);
      
      const bookingResult = await api.bookings.createBooking(bookingData);
      
      console.log('Результат бронирования:', bookingResult);
      
      await fetchUserBalance();
      
      setSchedule(prevSchedule => 
        prevSchedule.map(item => 
          item.id === classItem.id 
            ? {
                ...item,
                current_participants: (parseInt(item.current_participants) || 0) + 1,
                availableSpots: Math.max(0, item.availableSpots - 1)
              }
            : item
        )
      );
      
      await fetchUserBookings();
      
      setBookingModal({ show: false, classItem: null, loading: false });
      
      // НОВОЕ: Проверяем, отправлено ли уведомление в Telegram
      const telegramSent = bookingResult.telegram_sent || false;
      
      setSuccessModal({
        show: true,
        classItem,
        newBalance: parseFloat(userBalance) - price,
        visitCode: bookingResult.visit_code || visitCode,
        telegramSent: telegramSent
      });
      
    } catch (error) {
      console.error('Ошибка при записи на занятие:', error);
      
      await fetchUserBalance();
      await fetchUserBookings();
      
      let errorTitle = 'Ошибка записи';
      let errorMessage = 'Не удалось записаться на занятие.';
      
      if (error.message.includes('уже записаны') || error.message.includes('already booked')) {
        errorTitle = 'Уже записаны';
        errorMessage = 'Вы уже записаны на это занятие.';
      } else if (error.message.includes('Недостаточно средств') || error.message.includes('insufficient')) {
        errorTitle = 'Недостаточно средств';
        errorMessage = 'Недостаточно средств на балансе.';
      } else if (error.message.includes('занято') || error.message.includes('full') || error.message.includes('свободных мест')) {
        errorTitle = 'Нет свободных мест';
        errorMessage = 'Все места на это занятие уже заняты.';
      } else if (error.message.includes('500')) {
        errorTitle = 'Ошибка сервера';
        errorMessage = 'Произошла ошибка на сервере.\nПроверьте ваш баланс и список записей.';
      }
      
      showAlert('error', errorTitle, errorMessage);
      setBookingModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Закрытие модального окна бронирования
  const closeBookingModal = () => {
    if (!bookingModal.loading) {
      setBookingModal({ show: false, classItem: null, loading: false });
    }
  };

  // Закрытие модального окна успеха
  const closeSuccessModal = () => {
    setSuccessModal({ 
      show: false, 
      classItem: null, 
      newBalance: 0, 
      visitCode: '',
      telegramSent: false 
    });
  };

  // НОВАЯ ФУНКЦИЯ: Переход к настройке Telegram
  const handleTelegramSetup = () => {
    navigate('/profile', { state: { openTelegram: true } });
    closeSuccessModal();
  };

  // Функция для получения иконки alert'а
  const getAlertIcon = (type) => {
    switch (type) {
      case 'success':
        return (
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        );
      case 'warning':
        return (
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        );
      case 'error':
        return (
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        );
      default: // info
        return (
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11M11,9H13V7H11"/>
        );
    }
  };

  return (
    <div className="fitness-schedule-page">
      <div className="fitness-page-header">
        <h1>Расписание занятий</h1>
      </div>

      <div className="fitness-schedule-filters">
        <div className="fitness-date-selector">
          <button 
            className="fitness-date-button"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <svg className="fitness-date-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
            <span className="fitness-date-text">{formatDisplayDate(selectedDate)}</span>
            <span className="fitness-date-full">{selectedDate.toLocaleDateString('ru-RU')}</span>
            <svg className="fitness-chevron" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
          </button>
          
          {/* УБИРАЕМ БЛОК БЫСТРЫХ ДАТ НА МОБИЛЬНЫХ */}
          <div className="fitness-quick-dates fitness-quick-dates-desktop">
            {getQuickDates().map((date, index) => {
              const isActive = formatDateToString(selectedDate) === formatDateToString(date);
              
              return (
                <button
                  key={index}
                  className={`fitness-quick-date ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    console.log('Выбрана быстрая дата:', date);
                    setSelectedDate(date);
                    setShowCalendar(false);
                  }}
                >
                  {formatDisplayDate(date)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="fitness-filter-controls">
          <div className="fitness-filter-group">
            <svg className="fitness-filter-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <select
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
              className="fitness-filter-select"
            >
              <option value="all">Все клубы</option>
              {clubs.map(club => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
          </div>
          
          <div className="fitness-filter-group">
            <svg className="fitness-filter-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="fitness-filter-select"
            >
              <option value="all">Все виды</option>
              <option value="Фитнес">Фитнес</option>
              <option value="Йога">Йога</option>
              <option value="CrossFit">Кроссфит</option>
              <option value="Танцы">Танцы</option>
              <option value="Плавание">Плавание</option>
              <option value="Боевые искусства">Единоборства</option>
            </select>
          </div>
        </div>
      </div>

      {showCalendar && (
        <div className="fitness-calendar-dropdown">
          <MiniCalendar
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              console.log('Выбрана дата из календаря:', date);
              setSelectedDate(date);
              setShowCalendar(false);
            }}
            onClose={() => setShowCalendar(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="fitness-loading-state">
          <div className="fitness-loading-spinner"></div>
          <h2>Загружаем расписание...</h2>
          <p>Это займет всего пару секунд</p>
        </div>
      ) : error ? (
        <div className="fitness-error-state">
          <div className="fitness-error-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V21C3 22.1 3.9 23 5 23H19C20.1 23 21 22.1 21 21V9M19 9H14V4H5V21H19V9Z"/>
            </svg>
          </div>
          <h2>Что-то пошло не так</h2>
          <p>{error}</p>
          <button className="fitness-btn fitness-btn-primary" onClick={() => window.location.reload()}>
            Попробовать еще раз
          </button>
        </div>
      ) : (
        <div className="schd-classes-container">
          {Object.keys(groupedSchedule).length > 0 ? (
            Object.values(groupedSchedule).map((group, groupIndex) => (
              <div className="schd-club-section" key={`club-${groupIndex}`}>
                <h2 className="schd-club-title">{group.clubName}</h2>
                <div className="schd-classes-list">
                  {group.classes.map((classItem) => {
                    const isBooked = isUserBookedForClass(classItem.id);
                    
                    return (
                      <div 
                        className="schd-class-item" 
                        key={classItem.id}
                        onClick={(e) => handleClassItemClick(e, classItem)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="schd-class-time-block">
                          <div className="schd-time-main">{classItem.startTime}</div>
                          <div className="schd-time-duration">{classItem.duration}м</div>
                          {classItem.endTime && classItem.endTime !== '00:00' && classItem.endTime !== classItem.startTime && (
                            <div className="schd-time-end">до {classItem.endTime}</div>
                          )}
                        </div>
                        
                        <div className="schd-class-details">
                          <h3 className="schd-class-name">{classItem.className}</h3>
                          {classItem.trainer && (
                            <p className="schd-class-trainer">Тренер: {classItem.trainer}</p>
                          )}
                          {classItem.category && (
                            <span className="schd-class-category">{classItem.category}</span>
                          )}
                          {classItem.description && (
                            <p className="schd-class-description">{classItem.description}</p>
                          )}
                        </div>
                        
                        <div className="schd-class-booking">
                          <div className="schd-spots-info">
                            <span className="schd-spots-available">
                              {classItem.availableSpots} из {classItem.totalSpots} мест
                            </span>
                            <div className="schd-spots-bar">
                              <div 
                                className="schd-spots-fill"
                                style={{
                                  width: classItem.totalSpots > 0 
                                    ? `${((classItem.totalSpots - classItem.availableSpots) / classItem.totalSpots) * 100}%`
                                    : '0%'
                                }}
                              />
                            </div>
                          </div>
                          
                          <div className="schd-booking-action">
                            <div className="schd-class-price">{parseFloat(classItem.price).toLocaleString()} ₽</div>
                            <button 
                              className={`schd-book-btn ${
                                classItem.availableSpots <= 0 || isBooked ? 'disabled' : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation(); // Предотвращаем переход на страницу клуба
                                if (!isBooked && classItem.availableSpots > 0) {
                                  openBookingModal(classItem);
                                }
                              }}
                              disabled={classItem.availableSpots <= 0 || isBooked}
                            >
                              {isBooked 
                                ? 'Записаны' 
                                : classItem.availableSpots > 0 
                                  ? 'Записаться' 
                                  : 'Нет мест'
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="fitness-empty-state">
              <div className="fitness-empty-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
              </div>
              <h3>Занятий не найдено</h3>
              <p>На выбранную дату занятий нет. Попробуйте выбрать другой день.</p>
            </div>
          )}
        </div>
      )}

      {/* Модальные окна остаются без изменений */}
      {bookingModal.show && (
        <div className="fitness-modal-overlay" onClick={closeBookingModal}>
          <div className="fitness-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fitness-modal-header">
              <h3>Подтверждение записи</h3>
              {!bookingModal.loading && (
                <button className="fitness-modal-close" onClick={closeBookingModal}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              )}
            </div>
            
            <div className="fitness-modal-content">
              <div className="fitness-booking-info">
                <p><strong>Занятие:</strong> {bookingModal.classItem?.className}</p>
                <p><strong>Дата:</strong> {selectedDate.toLocaleDateString('ru-RU')}</p>
                <p><strong>Время:</strong> {bookingModal.classItem?.startTime}
                  {bookingModal.classItem?.endTime && 
                   bookingModal.classItem.endTime !== '00:00' && 
                   bookingModal.classItem.endTime !== bookingModal.classItem.startTime && 
                    ` - ${bookingModal.classItem.endTime}`}
                </p>
                <p><strong>Длительность:</strong> {bookingModal.classItem?.duration} мин</p>
                {bookingModal.classItem?.trainer && (
                  <p><strong>Тренер:</strong> {bookingModal.classItem.trainer}</p>
                )}
                <p><strong>Стоимость:</strong> {parseFloat(bookingModal.classItem?.price || 0).toLocaleString()} ₽</p>
                <p><strong>Свободных мест:</strong> {bookingModal.classItem?.availableSpots} из {bookingModal.classItem?.totalSpots}</p>
              </div>
              
              <div className="fitness-balance-info">
                <p>Текущий баланс: <strong>{parseFloat(userBalance).toLocaleString()} ₽</strong></p>
              </div>

              <div className="fitness-cancellation-policy">
                <div className="fitness-policy-header">
                  <strong>Условия отмены</strong>
                </div>
                <ul className="fitness-policy-list">
                  <li>✅ Отмена за 12+ часов — <span className="fitness-policy-success">полный возврат средств</span></li>
                  <li>❌ Отмена менее чем за 12 часов — <span className="fitness-policy-warning">средства не возвращаются</span></li>
                </ul>
              </div>
            </div>
            
            <div className="fitness-modal-actions">
              <button 
                className="fitness-btn fitness-btn-secondary" 
                onClick={closeBookingModal}
                disabled={bookingModal.loading}
              >
                Отмена
              </button>
              <button 
                className="fitness-btn fitness-btn-primary"
                onClick={confirmBooking}
                disabled={bookingModal.loading}
              >
                {bookingModal.loading ? 'Обработка...' : 'Подтвердить запись'}
              </button>
            </div>
          </div>
        </div>
      )}

      {successModal.show && (
        <div className="fitness-modal-overlay" onClick={closeSuccessModal}>
          <div className="fitness-modal fitness-success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fitness-modal-header">
              <div className="fitness-success-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <h3>Запись подтверждена!</h3>
              <button className="fitness-modal-close" onClick={closeSuccessModal}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            
            <div className="fitness-modal-content">
              <p>Вы успешно записались на занятие "{successModal.classItem?.className}"</p>
              
              {successModal.visitCode && (
                <div className="fitness-visit-code-block">
                  <div className="fitness-visit-code-header">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22,16V4A2,2 0 0,0 20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16M20,16H8V4H20V16M16,6V10.5L13.5,9L11,10.5V6H16M4,6H2V20A2,2 0 0,0 4,22H18V20H4V6Z"/>
                    </svg>
                    <h4>Ваш код посещения</h4>
                  </div>
                  <div className="fitness-visit-code-display">
                    <span className="fitness-visit-code">{formatVisitCodeCompact(successModal.visitCode)}</span>
                  </div>
                  <p className="fitness-visit-code-instruction">
                    Назовите этот код администратору при посещении клуба
                  </p>
                </div>
              )}
              
              <div className="fitness-success-info">
                <p><strong>Дата:</strong> {selectedDate.toLocaleDateString('ru-RU')} в {successModal.classItem?.startTime}</p>
                {successModal.classItem?.trainer && (
                  <p><strong>Тренер:</strong> {successModal.classItem.trainer}</p>
                )}
              </div>
            </div>
            
            <div className="fitness-modal-actions">
              <button className="fitness-btn fitness-btn-primary" onClick={closeSuccessModal}>
                Отлично!
              </button>
            </div>
          </div>
        </div>
      )}

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

// ОБНОВЛЕННЫЙ Компонент мини-календаря с серыми прошедшими датами
const MiniCalendar = ({ selectedDate, onDateSelect, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  });

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current.getFullYear(), current.getMonth(), current.getDate()));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const today = new Date();

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const isToday = (date) => {
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return todayDate.getTime() === checkDate.getTime();
  };

  const isSelected = (date) => {
    const selectedDateNormalized = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return selectedDateNormalized.getTime() === checkDate.getTime();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isPastDate = (date) => {
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return checkDate.getTime() < todayDate.getTime();
  };

  const handleDateSelect = (date) => {
    if (isPastDate(date)) return;
    
    const newSelectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    console.log('Выбрана дата в календаре:', newSelectedDate);
    
    onDateSelect(newSelectedDate);
  };

  return (
    <div className="fitness-mini-calendar">
      <div className="fitness-calendar-header">
        <button onClick={() => navigateMonth(-1)} className="fitness-nav-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        <h3>
          {currentMonth.toLocaleDateString('ru-RU', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </h3>
        <button onClick={() => navigateMonth(1)} className="fitness-nav-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
          </svg>
        </button>
      </div>
      
      <div className="fitness-calendar-weekdays">
        {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
          <div key={day} className="fitness-weekday">{day}</div>
        ))}
      </div>
      
      <div className="fitness-calendar-grid">
        {days.map((day, index) => (
          <button
            key={index}
            className={`fitness-calendar-day ${
              !isCurrentMonth(day) ? 'other-month' : ''
            } ${
              isToday(day) ? 'today' : ''
            } ${
              isSelected(day) ? 'selected' : ''
            } ${
              isPastDate(day) ? 'past' : ''
            }`}
            onClick={() => handleDateSelect(day)}
            disabled={isPastDate(day)}
          >
            {day.getDate()}
          </button>
        ))}
      </div>
      
      <div className="fitness-calendar-footer">
        <button onClick={onClose} className="fitness-btn fitness-btn-secondary">
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default SchedulePage;