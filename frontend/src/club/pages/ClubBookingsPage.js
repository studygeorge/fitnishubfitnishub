import React, { useState, useEffect } from 'react';
import { useClub } from '../contexts/ClubContext';
import { Navigate } from 'react-router-dom';
import ClubLayout from '../components/layout/ClubLayout';
import api from '../../services/api';
import { formatVisitCode } from '../../utils/visitCode';
import '../styles/club-bookings.css';

const ClubBookingsPage = () => {
  const { club, isAuthenticated, loading } = useClub();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    date: '',
    search: ''
  });

  // ИСПРАВЛЕННЫЕ ФУНКЦИИ: Корректное форматирование времени (убираем 3 часа)
  const formatLocalDateTime = (dateString, options = {}) => {
    const date = new Date(dateString);
    // УБИРАЕМ смещение часового пояса (отнимаем 3 часа)
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return localDate.toLocaleString('ru-RU', options);
  };

  const formatLocalTime = (dateString) => {
    const date = new Date(dateString);
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return localDate.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLocalDate = (dateString) => {
    const date = new Date(dateString);
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return localDate.toLocaleDateString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'long'
    });
  };

  useEffect(() => {
    if (isAuthenticated && club?.id) {
      loadBookings();
    }
  }, [isAuthenticated, club]);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const loadBookings = async () => {
    try {
      setDataLoading(true);
      const bookingsData = await api.bookings.getClubBookings(club.id);
      console.log('Загруженные бронирования:', bookingsData);
      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Ошибка загрузки бронирований:', error);
      setBookings([]);
    } finally {
      setDataLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Фильтр по статусу
    if (filters.status !== 'all') {
      if (filters.status === 'cancelled') {
        // Показываем все виды отмен
        filtered = filtered.filter(booking => 
          booking.status === 'cancelled' || booking.status === 'cancelled_by_club'
        );
      } else {
        filtered = filtered.filter(booking => booking.status === filters.status);
      }
    }

    // Фильтр по дате
    if (filters.date) {
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.start_time);
        // ИСПРАВЛЕНО: убираем смещение для фильтрации
        const localBookingDate = new Date(bookingDate.getTime() + bookingDate.getTimezoneOffset() * 60000);
        const bookingDateString = localBookingDate.toISOString().split('T')[0];
        return bookingDateString === filters.date;
      });
    }

    // Поиск по имени, занятию или коду посещения из БД
    if (filters.search) {
      const searchLower = filters.search.toLowerCase().replace(/\s/g, '');
      filtered = filtered.filter(booking => {
        const fullName = `${booking.first_name} ${booking.last_name}`.toLowerCase();
        const className = booking.class_name.toLowerCase();
        const visitCodeFromDB = booking.visit_code || '';
        const cleanVisitCode = visitCodeFromDB.replace(/\s/g, '').toLowerCase();
        
        return fullName.includes(searchLower) || 
               className.includes(searchLower) ||
               cleanVisitCode.includes(searchLower);
      });
    }

    // Сортировка по дате (новые сначала)
    filtered.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

    setFilteredBookings(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      date: '',
      search: ''
    });
  };

  // Установить сегодняшнюю дату
  const setTodayFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    handleFilterChange('date', today);
    setShowDatePicker(false);
  };

  // Обработчик выбора даты из календаря
  const handleDateSelect = (date) => {
    handleFilterChange('date', date);
    setShowDatePicker(false);
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      await api.bookings.completeBooking(bookingId);
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'completed' }
            : booking
        )
      );
      alert('Посещение отмечено как завершенное');
    } catch (error) {
      console.error('Ошибка при завершении бронирования:', error);
      alert('Не удалось отметить посещение: ' + error.message);
    }
  };

  // ФУНКЦИЯ: Открытие модального окна отмены
  const handleCancelBookingClick = (bookingId) => {
    setCancellingBooking(bookingId);
    setCancelReason('');
    setShowCancelModal(true);
  };

  // ФУНКЦИЯ: Подтверждение отмены с причиной
  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
  
    console.log('🚫 НАЧАЛО ОТМЕНЫ БРОНИРОВАНИЯ С ПРИЧИНОЙ');
    console.log('🔍 ID бронирования:', cancellingBooking);
    console.log('📝 Причина:', cancelReason);
  
    try {
      // Передаем reason как второй параметр
      const result = await api.bookings.cancelBookingByClub(cancellingBooking, cancelReason);
      console.log('✅ Результат отмены клубом:', result);
      
      // Закрываем модальное окно
      setShowCancelModal(false);
      setCancellingBooking(null);
      setCancelReason('');
      
      // Показываем успешное сообщение с деталями
      const message = `Бронирование отменено. Средства (${result.refund_amount}₽) возвращены клиенту.`;
      alert(message);
      
      // Перезагружаем список для актуализации данных
      await loadBookings();
    } catch (error) {
      console.error('❌ ОШИБКА ПРИ ОТМЕНЕ БРОНИРОВАНИЯ:', error);
      alert('Не удалось отменить бронирование: ' + error.message);
    }
  };

  // Обновленная статистика с учетом нового статуса
  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => 
      b.status === 'cancelled' || b.status === 'cancelled_by_club'
    ).length,
    cancelled_by_user: bookings.filter(b => 
      b.status === 'cancelled' && b.cancelled_by === 'user'
    ).length,
    cancelled_by_club: bookings.filter(b => 
      b.status === 'cancelled_by_club'
    ).length
  };

  if (loading) {
    return (
      <div className="club-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/club/login" replace />;
  }

  return (
    <ClubLayout>
      <div className="bookings-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>Бронирования</h1>
            <p>Управление записями клиентов на занятия</p>
          </div>
        </div>

        {/* Stats */}
        <div className="bookings-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Всего записей</div>
          </div>
          <div className="stat-card confirmed">
            <div className="stat-value">{stats.confirmed}</div>
            <div className="stat-label">Подтверждено</div>
          </div>
          <div className="stat-card completed">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Завершено</div>
          </div>
          <div className="stat-card cancelled">
            <div className="stat-value">{stats.cancelled}</div>
            <div className="stat-label">Отменено</div>
            <div className="stat-sublabel">
              Клиентом: {stats.cancelled_by_user}  Клубом: {stats.cancelled_by_club}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bookings-filters">
          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">Статус</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="all">Все статусы</option>
                <option value="confirmed">Подтверждено</option>
                <option value="completed">Завершено</option>
                <option value="cancelled">Отменено</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Дата</label>
              <div className="date-filter-container">
                <button 
                  className="today-btn"
                  onClick={setTodayFilter}
                  title="Показать сегодняшние записи"
                >
                  Сегодня
                </button>
                <button 
                  className="calendar-btn"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  title="Выбрать дату"
                >
                  
                </button>
              </div>
              
              {/* Календарь */}
              {showDatePicker && (
                <DatePicker
                  selectedDate={filters.date}
                  onDateSelect={handleDateSelect}
                  onClose={() => setShowDatePicker(false)}
                />
              )}
              
              {/* Показать выбранную дату */}
              {filters.date && (
                <div className="selected-date">
                  <span>{new Date(filters.date).toLocaleDateString('ru-RU', {
                    weekday: 'short',
                    day: 'numeric', 
                    month: 'long'
                  })}</span>
                  <button 
                    className="clear-date-btn"
                    onClick={() => handleFilterChange('date', '')}
                    title="Очистить фильтр по дате"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="filter-group search-group">
              <label className="filter-label">Поиск</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="По имени, занятию или коду посещения..."
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <button 
                className="clear-filters-btn"
                onClick={clearFilters}
              >
                Очистить все
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bookings-content">
          {dataLoading ? (
            <div className="bookings-loading">
              <div className="loading-spinner"></div>
              <p>Загрузка бронирований...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="empty-bookings">
              <div className="empty-icon">📝</div>
              <h3>
                {filters.status !== 'all' || filters.date || filters.search
                  ? 'По заданным фильтрам ничего не найдено'
                  : 'Нет бронирований'
                }
              </h3>
              <p>
                {filters.status !== 'all' || filters.date || filters.search
                  ? 'Попробуйте изменить критерии поиска'
                  : 'Записи от посетителей появятся здесь'
                }
              </p>
              {(filters.status !== 'all' || filters.date || filters.search) && (
                <button className="btn btn-primary" onClick={clearFilters}>
                  Показать все
                </button>
              )}
            </div>
          ) : (
            <div className="bookings-list">
              {filteredBookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onComplete={handleCompleteBooking}
                  onCancel={handleCancelBookingClick}
                  formatLocalDateTime={formatLocalDateTime}
                  formatLocalTime={formatLocalTime}
                  formatLocalDate={formatLocalDate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Модальное окно отмены */}
        {showCancelModal && (
          <CancelBookingModal
            isOpen={showCancelModal}
            onClose={() => {
              setShowCancelModal(false);
              setCancellingBooking(null);
              setCancelReason('');
            }}
            onConfirm={handleConfirmCancel}
            reason={cancelReason}
            onReasonChange={setCancelReason}
            booking={bookings.find(b => b.id === cancellingBooking)}
            formatLocalDateTime={formatLocalDateTime}
          />
        )}
      </div>
    </ClubLayout>
  );
};

// КОМПОНЕНТ: Модальное окно отмены
const CancelBookingModal = ({ isOpen, onClose, onConfirm, reason, onReasonChange, booking, formatLocalDateTime }) => {
  if (!isOpen || !booking) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Отмена бронирования</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="booking-info">
            <p><strong>Клиент:</strong> {booking.first_name} {booking.last_name}</p>
            <p><strong>Занятие:</strong> {booking.class_name}</p>
            <p><strong>Время:</strong> {formatLocalDateTime(booking.start_time)}</p>
            <p><strong>Цена:</strong> {booking.price}₽</p>
          </div>
          
          <div className="warning-message">
            <p>⚠️ При отмене клубом средства будут автоматически возвращены клиенту</p>
          </div>
          
          <div className="reason-input">
            <label htmlFor="cancel-reason">Причина отмены:</label>
            <textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Укажите причину отмены занятия (по болезни тренера, технические проблемы и т.д.)"
              rows={3}
              className="reason-textarea"
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Отменить
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Подтвердить отмену
          </button>
        </div>
      </div>
    </div>
  );
};

// Компонент календаря для выбора даты
const DatePicker = ({ selectedDate, onDateSelect, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
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
  
  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const isToday = (date) => {
    return formatDateString(date) === formatDateString(today);
  };
  
  const isSelected = (date) => {
    return selectedDate && formatDateString(date) === selectedDate;
  };
  
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentMonth.getMonth();
  };
  
  const handleDateClick = (date) => {
    onDateSelect(formatDateString(date));
  };

  return (
    <div className="date-picker-overlay" onClick={onClose}>
      <div className="date-picker" onClick={(e) => e.stopPropagation()}>
        <div className="date-picker-header">
          <button onClick={() => navigateMonth(-1)} className="nav-btn">‹</button>
          <h4>
            {currentMonth.toLocaleDateString('ru-RU', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h4>
          <button onClick={() => navigateMonth(1)} className="nav-btn">›</button>
        </div>
        
        <div className="date-picker-weekdays">
          {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        
        <div className="date-picker-grid">
          {days.map((day, index) => (
            <button
              key={index}
              className={`date-btn ${
                !isCurrentMonth(day) ? 'other-month' : ''
              } ${
                isToday(day) ? 'today' : ''
              } ${
                isSelected(day) ? 'selected' : ''
              }`}
              onClick={() => handleDateClick(day)}
            >
              {day.getDate()}
            </button>
          ))}
        </div>
        
        <div className="date-picker-footer">
          <button onClick={onClose} className="close-btn">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

// ИСПРАВЛЕННЫЙ Компонент карточки бронирования
const BookingCard = ({ booking, onComplete, onCancel, formatLocalDateTime, formatLocalTime, formatLocalDate }) => {
  // ИСПРАВЛЕННАЯ функция определения статуса
  const getStatusInfo = (status, cancelledBy) => {
    console.log('🔍 getStatusInfo called with:', { status, cancelledBy }); // Для отладки
    
    const statusMap = {
      'confirmed': { label: 'Подтверждено', class: 'confirmed' },
      'completed': { label: 'Завершено', class: 'completed' },
      'cancelled': { 
        label: cancelledBy === 'user' ? 'Отменено клиентом' : 'Отменено', 
        class: 'cancelled' 
      },
      'cancelled_by_club': { label: 'Отменено клубом', class: 'cancelled-by-club' } // ИСПРАВЛЕНО: добавлен отдельный статус
    };
    return statusMap[status] || { label: status, class: '' };
  };

  console.log('🎯 BookingCard получил booking:', {
    id: booking.id,
    status: booking.status,
    cancelled_by: booking.cancelled_by,
    cancelled_at: booking.cancelled_at,
    cancellation_reason: booking.cancellation_reason
  });

  const statusInfo = getStatusInfo(booking.status, booking.cancelled_by);
  const bookingDate = new Date(booking.start_time);
  // ИСПРАВЛЕНО: убираем смещение для определения "сегодня"
  const localBookingDate = new Date(bookingDate.getTime() + bookingDate.getTimezoneOffset() * 60000);
  const isToday = localBookingDate.toDateString() === new Date().toDateString();
  
  // Используем код из БД
  const visitCodeFromDB = booking.visit_code;

  const handleCopyCode = (e) => {
    if (visitCodeFromDB && navigator.clipboard) {
      navigator.clipboard.writeText(visitCodeFromDB).then(() => {
        const btn = e.target;
        const originalText = btn.textContent;
        btn.textContent = '✓';
        btn.style.color = '#27ae60';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.color = '';
        }, 1000);
      }).catch(err => {
        console.error('Ошибка копирования:', err);
        try {
          const textArea = document.createElement('textarea');
          textArea.value = visitCodeFromDB;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          const btn = e.target;
          const originalText = btn.textContent;
          btn.textContent = '✓';
          btn.style.color = '#27ae60';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.color = '';
          }, 1000);
        } catch (fallbackErr) {
          console.error('Fallback копирование не удалось:', fallbackErr);
          alert(`Код посещения: ${visitCodeFromDB}`);
        }
      });
    } else {
      alert(`Код посещения: ${visitCodeFromDB}`);
    }
  };

  return (
    <div className={`booking-card ${statusInfo.class}`}>
      <div className="booking-header">
        <div className="client-info">
          <div className="client-avatar">
            {booking.first_name?.[0]?.toUpperCase() || '👤'}
          </div>
          <div className="client-details">
            <h4 className="client-name">
              {booking.first_name} {booking.last_name}
            </h4>
            {booking.phone && (
              <p className="client-phone">{booking.phone}</p>
            )}
          </div>
        </div>
        
        <div className="booking-status">
          <span className={`status-badge ${statusInfo.class}`}>
            {statusInfo.label}
          </span>
          {isToday && (
            <span className="today-badge">Сегодня</span>
          )}
        </div>
      </div>

      {/* Блок с кодом посещения из БД */}
      {visitCodeFromDB && (
        <div className="visit-code-section">
          <div className="visit-code-header">
            <span className="visit-code-label">🎫 Код посещения:</span>
            <span className="visit-code-display">
              {formatVisitCode(visitCodeFromDB)}
            </span>
            <button 
              className="copy-code-btn"
              onClick={handleCopyCode}
              title="Скопировать код"
            >
              📋
            </button>
          </div>
          <div className="visit-code-hint">
            Клиент должен назвать этот код при посещении
          </div>
        </div>
      )}

      {!visitCodeFromDB && (
        <div className="visit-code-section missing">
          <div className="visit-code-header">
            <span className="visit-code-label">⚠️ Код посещения:</span>
            <span className="visit-code-display error">
              Не найден
            </span>
          </div>
          <div className="visit-code-hint error">
            Код посещения не был сохранен при создании записи
          </div>
        </div>
      )}

      <div className="booking-details">
        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-label">Занятие:</span>
            <span className="detail-value">{booking.class_name}</span>
          </div>
          {booking.trainer && (
            <div className="detail-item">
              <span className="detail-label">Тренер:</span>
              <span className="detail-value">{booking.trainer}</span>
            </div>
          )}
        </div>

        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-label">Дата:</span>
            <span className="detail-value">
              {formatLocalDate(booking.start_time)}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Время:</span>
            <span className="detail-value">
              {formatLocalTime(booking.start_time)}
            </span>
          </div>
        </div>

        {booking.price && (
          <div className="detail-row">
            <div className="detail-item">
              <span className="detail-label">Цена:</span>
              <span className="detail-value price">{booking.price} ₽</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Создана:</span>
              <span className="detail-value">
                {formatLocalDate(booking.created_at)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ИСПРАВЛЕННЫЙ БЛОК: Информация об отмене */}
      {(booking.status === 'cancelled' || booking.status === 'cancelled_by_club') && (
        <div className="cancellation-info">
          <div className="cancellation-header">
            <span className="cancellation-icon">
              {booking.cancelled_by === 'club' || booking.status === 'cancelled_by_club' ? '🏢' : '👤'}
            </span>
            <span className="cancellation-title">
              {booking.cancelled_by === 'club' || booking.status === 'cancelled_by_club'
                ? 'Отменено администрацией клуба' 
                : 'Отменено клиентом'
              }
            </span>
          </div>
          <div className="cancellation-details">
            <div className="cancellation-detail">
              <span className="detail-label">Время отмены:</span>
              <span className="detail-value">
                {booking.cancelled_at 
                  ? formatLocalDateTime(booking.cancelled_at)
                  : 'Не указано'
                }
              </span>
            </div>
            {booking.cancellation_reason && (
              <div className="cancellation-detail">
                <span className="detail-label">Причина:</span>
                <span className="detail-value">{booking.cancellation_reason}</span>
              </div>
            )}
            {(booking.cancelled_by === 'club' || booking.status === 'cancelled_by_club') && (
              <div className="refund-info">
                <span className="refund-icon">💰</span>
                <span className="refund-text">Средства возвращены клиенту</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Кнопки действий только для подтвержденных бронирований */}
      {booking.status === 'confirmed' && (
        <div className="booking-actions">
          <button
            className="action-btn complete"
            onClick={() => onComplete(booking.id)}
            title="Отметить, что клиент пришел на занятие"
          >
            ✓ Отметить посещение
          </button>
          <button
            className="action-btn cancel"
            onClick={() => onCancel(booking.id)}
            title="Отменить бронирование и вернуть средства клиенту"
          >
            ✕ Отменить занятие
          </button>
        </div>
      )}
    </div>
  );
};

export default ClubBookingsPage;