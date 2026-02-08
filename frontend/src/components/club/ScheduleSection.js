import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { generateVisitCode, formatVisitCode } from '../../utils/visitCode';
import './ScheduleSection.css';

const ScheduleSection = ({ clubId }) => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentUser, setCurrentUser] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [userBookings, setUserBookings] = useState([]);

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
    visitCode: ''
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

  // Функция для корректного форматирования даты в строку YYYY-MM-DD
  const formatDateToString = (date) => {
    if (!date) return null;
    
    const localDate = new Date(date);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
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

  const formatPrice = (price) => {
    if (!price) return 'Бесплатно';
    
    if (typeof price === 'string' && (price.includes('₽') || price.includes('руб'))) {
      return price;
    }
    
    if (typeof price === 'number') {
      return `${price} ₽`;
    }
    
    return price;
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

  // ИСПРАВЛЕННАЯ проверка, прошло ли занятие
  const isClassFinished = (classItem) => {
    const now = new Date();
    const classDate = formatDateToString(selectedDate);
    const classTime = classItem.start_time || classItem.time;
    
    // Создаем полную дату и время занятия
    let classDateTime;
    if (classTime.includes('T')) {
      // Если время уже в ISO формате
      classDateTime = new Date(classTime);
    } else {
      // Если время отдельно от даты
      classDateTime = new Date(`${classDate}T${classTime}`);
    }
    
    // Добавляем длительность занятия для более точной проверки
    const duration = classItem.duration || 60; // минуты
    const classEndTime = new Date(classDateTime.getTime() + duration * 60000);
    
    console.log('Проверка времени занятия:', {
      now: now.toISOString(),
      classStart: classDateTime.toISOString(),
      classEnd: classEndTime.toISOString(),
      isFinished: classEndTime < now
    });
    
    return classEndTime < now;
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
        console.log('Загруженные бронирования:', bookings);
      }
    } catch (error) {
      console.error('Ошибка при загрузке бронирований:', error);
    }
  };

  // ИСПРАВЛЕННАЯ проверка, записан ли пользователь на занятие
  const isUserBookedForClass = (classId) => {
    const isBooked = userBookings.some(booking => {
      const bookingScheduleId = booking.schedule_id || booking.class_id;
      const matchesId = parseInt(bookingScheduleId) === parseInt(classId);
      
      console.log('Проверка бронирования:', {
        classId: classId,
        bookingScheduleId: bookingScheduleId,
        matches: matchesId,
        booking: booking
      });
      
      return matchesId;
    });
    
    console.log(`Пользователь записан на занятие ${classId}:`, isBooked);
    return isBooked;
  };

  useEffect(() => {
    if (clubId) {
      loadSchedule();
      fetchUserBalance();
      fetchUserBookings();
    }
  }, [selectedDate, clubId]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        club_id: clubId,
        date: formatDateToString(selectedDate)
      };
      
      console.log('Загрузка расписания с фильтрами:', filters);
      
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
        
        return {
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
      });
      
      setSchedule(processedSchedule);
      
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
      setError(error.message || 'Не удалось загрузить расписание');
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  const getNextWeekDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date,
        dayName: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString('ru-RU', { month: 'short' })
      });
    }
    
    return dates;
  };

  // Открытие модального окна бронирования с ИСПРАВЛЕННЫМИ проверками
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

    // Проверяем, не завершилось ли занятие
    if (isClassFinished(classItem)) {
      showAlert(
        'error', 
        'Занятие завершено', 
        'Нельзя записаться на завершившееся занятие'
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
          window.location.href = '/balance';
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

  // ИСПРАВЛЕННАЯ функция подтверждения бронирования с детальной обработкой ошибок
  const confirmBooking = async () => {
    try {
      setBookingModal(prev => ({ ...prev, loading: true }));
      
      const classItem = bookingModal.classItem;
      const price = parseFloat(classItem.price) || 0;
      
      // Проверяем наличие пользователя
      if (!currentUser) {
        throw new Error('Пользователь не авторизован');
      }

      // Еще раз проверяем, не завершилось ли занятие
      if (isClassFinished(classItem)) {
        throw new Error('ЗАНЯТИЕ_ЗАВЕРШЕНО');
      }

      // Еще раз проверяем бронирование (обновляем данные)
      await fetchUserBookings();
      if (isUserBookedForClass(classItem.id)) {
        throw new Error('УЖЕ_ЗАПИСАНЫ');
      }
      
      const visitCode = generateVisitCode(
        currentUser?.first_name || currentUser?.name || 'User',
        new Date().toISOString()
      );
      
      console.log('Создание бронирования с кодом посещения:', visitCode);
      
      const bookingData = {
        schedule_id: parseInt(classItem.id),
        visit_code: visitCode
      };
      
      console.log('Отправляем данные бронирования:', bookingData);
      
      // Отправляем запрос
      const bookingResult = await api.bookings.createBooking(bookingData);
      
      console.log('Результат бронирования:', bookingResult);
      
      // Обновляем данные
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
      
      setSuccessModal({
        show: true,
        classItem,
        newBalance: parseFloat(userBalance) - price,
        visitCode: bookingResult.visit_code || visitCode
      });
      
    } catch (error) {
      console.error('Ошибка при создании бронирования:', error);
      
      // Обновляем данные после ошибки
      await fetchUserBalance();
      await fetchUserBookings();
      
      let errorTitle = 'Ошибка записи';
      let errorMessage = 'Не удалось записаться на занятие.';
      
      // ДЕТАЛЬНАЯ обработка различных типов ошибок
      const errorMsg = error.message;
      
      // Обработка специфических ошибок
      if (errorMsg === 'УЖЕ_ЗАПИСАНЫ') {
        errorTitle = 'Уже записаны';
        errorMessage = 'Вы уже записаны на это занятие.';
      } else if (errorMsg === 'ЗАНЯТИЕ_ЗАВЕРШЕНО') {
        errorTitle = 'Занятие завершено';
        errorMessage = 'Нельзя записаться на завершившееся занятие.';
      }
      // Обработка ошибок базы данных
      else if (errorMsg.includes('duplicate key') || errorMsg.includes('23505')) {
        errorTitle = 'Дублирование записи';
        errorMessage = 'Вы уже записаны на это занятие.\nОбновите страницу и проверьте свои записи.';
      }
      // Обработка других ошибок PostgreSQL
      else if (errorMsg.includes('bookings_user_id_schedule_id_key')) {
        errorTitle = 'Повторная запись';
        errorMessage = 'Вы уже записаны на это занятие.\nПроверьте список ваших записей.';
      }
      // Проверка на прошедшее время
      else if (errorMsg.includes('прошло') || errorMsg.includes('завершено') || errorMsg.includes('expired') || errorMsg.includes('past')) {
        errorTitle = 'Занятие недоступно';
        errorMessage = 'Время записи на это занятие истекло.';
      }
      // Проверка баланса
      else if (errorMsg.includes('недостаточно средств') || errorMsg.includes('insufficient') || errorMsg.includes('баланс')) {
        errorTitle = 'Недостаточно средств';
        errorMessage = 'Недостаточно средств на балансе для записи.';
      }
      // Проверка мест
      else if (errorMsg.includes('занято') || errorMsg.includes('full') || errorMsg.includes('свободных мест') || errorMsg.includes('capacity')) {
        errorTitle = 'Нет свободных мест';
        errorMessage = 'Все места на это занятие уже заняты.';
      }
      // Занятие не найдено
      else if (errorMsg.includes('не найден') || errorMsg.includes('not found') || errorMsg.includes('404')) {
        errorTitle = 'Занятие не найдено';
        errorMessage = 'Занятие больше не доступно для записи.';
      }
      // Ошибки авторизации
      else if (errorMsg.includes('авторизация') || errorMsg.includes('unauthorized') || errorMsg.includes('401')) {
        errorTitle = 'Ошибка авторизации';
        errorMessage = 'Необходимо войти в систему заново.';
      }
      // Ошибки сервера
      else if (errorMsg.includes('500') || errorMsg.includes('server error') || errorMsg.includes('внутренняя ошибка')) {
        errorTitle = 'Ошибка сервера';
        errorMessage = 'Произошла внутренняя ошибка сервера.\nПопробуйте еще раз через несколько секунд.';
      }
      // Сетевые ошибки
      else if (errorMsg.includes('network') || errorMsg.includes('сеть') || errorMsg.includes('Failed to fetch')) {
        errorTitle = 'Ошибка сети';
        errorMessage = 'Проблемы с подключением к серверу.\nПроверьте интернет-соединение.';
      }
      // Остальные ошибки
      else {
        errorMessage = `Произошла ошибка при записи.\n\nВозможные причины:\n• Вы уже записаны на это занятие\n• Занятие уже завершилось\n• Нет свободных мест\n• Технические неполадки\n\nПопробуйте обновить страницу.`;
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
    setSuccessModal({ show: false, classItem: null, newBalance: 0, visitCode: '' });
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

  // ИСПРАВЛЕННАЯ функция для определения статуса кнопки
  const getBookButtonStatus = (classItem) => {
    const isFinished = isClassFinished(classItem);
    const isBooked = isUserBookedForClass(classItem.id);
    const hasSpots = classItem.availableSpots > 0;
    
    if (isFinished) {
      return {
        text: 'Завершено',
        disabled: true,
        className: 'disabled'
      };
    }
    
    if (isBooked) {
      return {
        text: 'Записаны',
        disabled: true,
        className: 'disabled'
      };
    }
    
    if (!hasSpots) {
      return {
        text: 'Нет мест',
        disabled: true,
        className: 'disabled'
      };
    }
    
    return {
      text: 'Записаться',
      disabled: false,
      className: 'primary'
    };
  };

  const weekDates = getNextWeekDates();
  const isDateSelected = (date) => {
    return formatDateToString(selectedDate) === formatDateToString(date);
  };

  return (
    <div className="schedule-container">
      <div className="schedule-top">
        <h3 className="schedule-title">Расписание занятий</h3>
        <div className="dates-row">
          {weekDates.map((dateInfo, index) => (
            <button
              key={index}
              className={`date-card ${isDateSelected(dateInfo.date) ? 'active' : ''}`}
              onClick={() => setSelectedDate(dateInfo.date)}
            >
              <span className="date-weekday">{dateInfo.dayName}</span>
              <span className="date-day">{dateInfo.dayNumber}</span>
              <span className="date-month">{dateInfo.monthName}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="schedule-body">
        {loading ? (
          <div className="schedule-loading">
            <div className="loading-spinner"></div>
            <p>Загрузка расписания...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <h4>Ошибка загрузки</h4>
            <p>{error}</p>
            <button className="retry-button" onClick={loadSchedule}>
              Попробовать снова
            </button>
          </div>
        ) : schedule.length === 0 ? (
          <div className="empty-state">
            <h4>Нет занятий на выбранную дату</h4>
            <p>Выберите другую дату или свяжитесь с клубом для уточнения расписания</p>
          </div>
        ) : (
          <div className="classes-list">
            {schedule.map(classItem => {
              const isFinished = isClassFinished(classItem);
              const buttonStatus = getBookButtonStatus(classItem);
              
              return (
                <div key={classItem.id} className={`class-item ${isFinished ? 'passed' : ''}`}>
                  <div className="class-header">
                    <div className="class-time-block">
                      <span className="class-time">{classItem.startTime}</span>
                      <span className="class-duration">{classItem.duration}м</span>
                      {isFinished && <span className="class-status-badge">Завершено</span>}
                    </div>
                    <div className="class-price-block">
                      <span className="class-price">{formatPrice(classItem.price)}</span>
                    </div>
                  </div>
                  
                  <div className="class-content">
                    <h4 className="class-name">{classItem.className}</h4>
                    <p className="class-desc">{classItem.description || 'Описание занятия не указано'}</p>
                    <div className="class-meta">
                      <span className="class-trainer">
                        Тренер: {classItem.trainer || 'Не указан'}
                      </span>
                      <span className="class-type">
                        Категория: {classItem.category || classItem.type || 'Общая'}
                      </span>
                    </div>
                  </div>

                  <div className="class-footer">
                    <div className="class-spots">
                      <span className="spots-text">
                        {classItem.availableSpots} из {classItem.totalSpots} мест
                      </span>
                      <div className="spots-progress">
                        <div 
                          className="spots-fill"
                          style={{
                            width: classItem.totalSpots > 0 
                              ? `${((classItem.totalSpots - classItem.availableSpots) / classItem.totalSpots) * 100}%`
                              : '0%'
                          }}
                        />
                      </div>
                    </div>
                    
                    <button 
                      className={`book-btn ${buttonStatus.className}`}
                      onClick={() => !buttonStatus.disabled && openBookingModal(classItem)}
                      disabled={buttonStatus.disabled}
                    >
                      {buttonStatus.text}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Модальное окно подтверждения бронирования */}
      {bookingModal.show && (
        <div className="schedule-modal-overlay" onClick={closeBookingModal}>
          <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedule-modal-header">
              <h3>Подтверждение записи</h3>
              {!bookingModal.loading && (
                <button className="schedule-modal-close" onClick={closeBookingModal}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              )}
            </div>
            
            <div className="schedule-modal-content">
              <div className="booking-info">
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
              
              <div className="balance-info">
                <p>Текущий баланс: <strong>{parseFloat(userBalance).toLocaleString()} ₽</strong></p>
                <p>После списания: <strong>{(parseFloat(userBalance) - parseFloat(bookingModal.classItem?.price || 0)).toLocaleString()} ₽</strong></p>
              </div>
            </div>
            
            <div className="schedule-modal-actions">
              <button 
                className="btn-secondary" 
                onClick={closeBookingModal}
                disabled={bookingModal.loading}
              >
                Отмена
              </button>
              <button 
                className="btn-primary"
                onClick={confirmBooking}
                disabled={bookingModal.loading}
              >
                {bookingModal.loading ? 'Обработка...' : 'Подтвердить запись'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно успешного бронирования С КОДОМ ПОСЕЩЕНИЯ */}
      {successModal.show && (
        <div className="schedule-modal-overlay" onClick={closeSuccessModal}>
          <div className="schedule-modal success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedule-modal-header">
              <div className="success-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <h3>Запись подтверждена!</h3>
              <button className="schedule-modal-close" onClick={closeSuccessModal}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            
            <div className="schedule-modal-content">
              <p>Вы успешно записались на занятие "{successModal.classItem?.className}"</p>
              
              {successModal.visitCode && (
                <div className="visit-code-block">
                  <div className="visit-code-header">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22,16V4A2,2 0 0,0 20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16M20,16H8V4H20V16M16,6V10.5L13.5,9L11,10.5V6H16M4,6H2V20A2,2 0 0,0 4,22H18V20H4V6Z"/>
                    </svg>
                    <h4>Ваш код посещения</h4>
                  </div>
                  <div className="visit-code-display">
                    <span className="visit-code">{formatVisitCodeCompact(successModal.visitCode)}</span>
                  </div>
                  <p className="visit-code-instruction">
                    Назовите этот код администратору при посещении клуба
                  </p>
                </div>
              )}
              
              <div className="success-info">
                <p><strong>Дата:</strong> {selectedDate.toLocaleDateString('ru-RU')} в {successModal.classItem?.startTime}</p>
                {successModal.classItem?.trainer && (
                  <p><strong>Тренер:</strong> {successModal.classItem.trainer}</p>
                )}
                <p><strong>Списано:</strong> <span className="amount-red">-{parseFloat(successModal.classItem?.price || 0).toLocaleString()} ₽</span></p>
                <p><strong>Остаток:</strong> <span className="amount-green">{parseFloat(userBalance).toLocaleString()} ₽</span></p>
              </div>
            </div>
            
            <div className="schedule-modal-actions">
              <button className="btn-primary" onClick={closeSuccessModal}>
                Отлично!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* КАСТОМНОЕ МОДАЛЬНОЕ ОКНО ДЛЯ ALERT */}
      {alertModal.show && (
        <div className="schedule-modal-overlay" onClick={closeAlert}>
          <div className="schedule-modal alert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedule-modal-header">
              <div className={`alert-icon alert-icon-${alertModal.type}`}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  {getAlertIcon(alertModal.type)}
                </svg>
              </div>
              <h3>{alertModal.title}</h3>
              <button className="schedule-modal-close" onClick={closeAlert}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            
            <div className="schedule-modal-content">
              <p className="alert-message">{alertModal.message}</p>
            </div>
            
            <div className="schedule-modal-actions">
              <button className="btn-primary" onClick={closeAlert}>
                {alertModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleSection;
