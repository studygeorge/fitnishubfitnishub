// src/pages/ClubDashboard.js
import React, { useState, useEffect } from 'react';
import { useClub } from '../contexts/ClubContext';
import { Navigate, Link } from 'react-router-dom';
import ClubLayout from '../components/layout/ClubLayout';
import StatsPanel from '../components/dashboard/StatsPanel';
import UpcomingClasses from '../components/dashboard/UpcomingClasses';
import RecentVisitors from '../components/dashboard/RecentVisitors';
import api from '../../services/api';
import '../styles/club-dashboard.css';

const ClubDashboard = () => {
  const { club, isAuthenticated, loading } = useClub();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      todayBookings: 0,
      weeklyBookings: 0,
      monthlyRevenue: 0,
      activeClasses: 0,
      completedBookings: 0,
      cancelledBookings: 0
    },
    recentBookings: [],
    todayClasses: [],
    templates: []
  });
  const [dataLoading, setDataLoading] = useState(true);

  // ДОБАВЛЕНЫ ФУНКЦИИ: Корректное форматирование времени (убираем 3 часа)
  const formatLocalDate = (dateString) => {
    const date = new Date(dateString);
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return localDate.toLocaleDateString('ru-RU');
  };

  const formatLocalTime = (dateString) => {
    const date = new Date(dateString);
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return localDate.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (isAuthenticated && club?.id) {
      loadDashboardData();
    }
  }, [isAuthenticated, club]);

  const loadDashboardData = async () => {
    try {
      setDataLoading(true);
      
      const [bookingsData, scheduleData, templatesData] = await Promise.allSettled([
        api.bookings.getClubBookings(club.id),
        api.schedule.getAll({ clubId: club.id }),
        api.templates.getAll(club.id)
      ]);

      const bookings = bookingsData.status === 'fulfilled' ? bookingsData.value : [];
      const schedule = scheduleData.status === 'fulfilled' ? scheduleData.value : [];
      const templates = templatesData.status === 'fulfilled' ? templatesData.value : [];

      console.log('Загруженные данные дашборда:', {
        bookingsCount: bookings.length,
        scheduleCount: schedule.length,
        templatesCount: templates.length
      });

      // ИСПРАВЛЕНО: Более точная фильтрация сегодняшних занятий
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

      console.log('Диапазон сегодня:', {
        start: todayStart.toISOString(),
        end: todayEnd.toISOString()
      });

      const todayClasses = schedule.filter(classItem => {
        const classDateTime = new Date(classItem.start_time);
        const isToday = classDateTime >= todayStart && classDateTime <= todayEnd;
        
        console.log('Проверка занятия:', {
          id: classItem.id,
          name: classItem.name || classItem.class_name || classItem.title || 'Без названия',
          start_time: classItem.start_time,
          classDateTime: classDateTime.toISOString(),
          isToday: isToday
        });
        
        return isToday;
      }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

      console.log('Найдено сегодняшних занятий:', todayClasses.length);

      // ИСПРАВЛЕНО: Последние бронирования с преобразованными статусами
      const recentBookings = bookings
        .map(booking => {
          const displayStatus = getDisplayStatus(booking.status, booking.cancelled_by);
          console.log('Преобразование статуса бронирования:', {
            id: booking.id,
            client: `${booking.first_name} ${booking.last_name}`,
            originalStatus: booking.status,
            cancelledBy: booking.cancelled_by,
            displayStatus: displayStatus
          });
          
          return {
            ...booking,
            displayStatus: displayStatus
          };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      console.log('Последние бронирования обработаны:', recentBookings.length);

      // Вычисляем статистику
      const stats = calculateStats(bookings, schedule);

      setDashboardData({
        stats,
        recentBookings,
        todayClasses,
        templates
      });

    } catch (error) {
      console.error('Ошибка загрузки данных дашборда:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ: Преобразование статуса для отображения
  const getDisplayStatus = (status, cancelledBy) => {
    console.log('🔍 getDisplayStatus получил:', { status, cancelledBy });
    
    const statusMap = {
      'confirmed': 'Подтверждено',
      'completed': 'Завершено',
      'cancelled': cancelledBy === 'user' ? 'Отменено клиентом' : 'Отменено клиентом',
      'cancelled_by_club': 'Отменено клубом' // ИСПРАВЛЕНО: показываем "Отменено клубом"
    };
    
    const result = statusMap[status] || status;
    console.log('🎯 Преобразован статус:', `${status} → ${result}`);
    return result;
  };

  const calculateStats = (bookings, schedule) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const todayCount = bookings.filter(b => 
      new Date(b.created_at) >= today
    ).length;

    const weeklyCount = bookings.filter(b => 
      new Date(b.created_at) >= weekAgo
    ).length;

    // ИСПРАВЛЕНО: Учитываем только подтвержденные и завершенные бронирования для дохода
    const monthlyRevenue = bookings.filter(b => {
      const isRecentMonth = new Date(b.created_at) >= monthAgo;
      const isConfirmedOrCompleted = ['confirmed', 'completed'].includes(b.status);
      return isRecentMonth && isConfirmedOrCompleted;
    }).reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);

    const completedCount = bookings.filter(b => 
      b.status === 'completed'
    ).length;

    // ИСПРАВЛЕНО: Учитываем все виды отмен
    const cancelledCount = bookings.filter(b => 
      b.status === 'cancelled' || b.status === 'cancelled_by_club'
    ).length;

    console.log('Рассчитанная статистика:', {
      todayCount,
      weeklyCount,
      monthlyRevenue,
      completedCount,
      cancelledCount,
      activeClassesCount: schedule.length
    });

    return {
      todayBookings: todayCount,
      weeklyBookings: weeklyCount,
      monthlyRevenue,
      activeClasses: schedule.length,
      completedBookings: completedCount,
      cancelledBookings: cancelledCount
    };
  };

  if (loading) {
    return (
      <div className="fitness-profile-loading">
        <div className="fitness-loading-spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/club/login" replace />;
  }

  return (
    <ClubLayout>
      <div className="fitness-dashboard-page">
        {/* Приветствие */}
        <div className="fitness-dashboard-header">
          <div className="fitness-dashboard-info">
            <h1>Панель управления</h1>
            <p>Обзор активности клуба <strong>{club?.name}</strong></p>
          </div>
          <div className="fitness-dashboard-actions">
            <Link to="/club/schedule" className="fitness-btn fitness-btn-primary">
              Добавить занятие
            </Link>
          </div>
        </div>

        {/* Статистика */}
        <StatsPanel 
          stats={dashboardData.stats} 
          templatesCount={dashboardData.templates.length}
          loading={dataLoading}
        />

        {/* Основной контент */}
        <div className="fitness-dashboard-grid">
          {/* Сегодняшние занятия */}
          <UpcomingClasses 
            classes={dashboardData.todayClasses}
            loading={dataLoading}
            formatLocalTime={formatLocalTime}
          />

          {/* Последние посетители */}
          <RecentVisitors 
            bookings={dashboardData.recentBookings}
            loading={dataLoading}
            formatLocalDate={formatLocalDate}
            formatLocalTime={formatLocalTime}
          />
        </div>

        {/* Быстрые действия */}
        <div className="fitness-quick-actions-section">
          <h2>Быстрые действия</h2>
          <div className="fitness-quick-actions-grid">
            <Link to="/club/schedule" className="fitness-action-card">
              <div className="fitness-action-icon fitness-schedule-icon"></div>
              <div className="fitness-action-content">
                <h3>Расписание</h3>
                <p>Управление занятиями и тренировками</p>
              </div>
            </Link>

            <Link to="/club/bookings" className="fitness-action-card">
              <div className="fitness-action-icon fitness-bookings-icon"></div>
              <div className="fitness-action-content">
                <h3>Бронирования</h3>
                <p>Записи и заявки клиентов</p>
              </div>
            </Link>

            <Link to="/club/templates" className="fitness-action-card">
              <div className="fitness-action-icon fitness-templates-icon"></div>
              <div className="fitness-action-content">
                <h3>Шаблоны</h3>
                <p>Быстрое создание занятий</p>
              </div>
            </Link>

            <Link to="/club/profile" className="fitness-action-card">
              <div className="fitness-action-icon fitness-profile-icon"></div>
              <div className="fitness-action-content">
                <h3>Профиль клуба</h3>
                <p>Настройки и информация</p>
              </div>
            </Link>

            <Link to="/club/finances" className="fitness-action-card">
              <div className="fitness-action-icon fitness-finances-icon"></div>
              <div className="fitness-action-content">
                <h3>Финансы</h3>
                <p>Доходы и финансовая отчетность</p>
              </div>
            </Link>

            <Link to="/club/settings" className="fitness-action-card">
              <div className="fitness-action-icon fitness-settings-icon"></div>
              <div className="fitness-action-content">
                <h3>Настройки</h3>
                <p>Параметры и конфигурация</p>
              </div>
            </Link>
          </div>
        </div>

        {/* ОТЛАДОЧНАЯ ИНФОРМАЦИЯ для разработки */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info" style={{
            background: '#f0f0f0',
            padding: '10px',
            margin: '10px 0',
            borderRadius: '5px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <strong>🔍 Отладочная информация дашборда:</strong><br/>
            <strong>Сегодняшние занятия:</strong> {dashboardData.todayClasses?.length || 0}<br/>
            {dashboardData.todayClasses?.length > 0 && (
              <>
                {dashboardData.todayClasses.map((cl, i) => (
                  <div key={i}>
                    • {cl.name || cl.class_name || cl.title || 'Без названия'} в{' '}
                    {formatLocalTime(cl.start_time)}
                  </div>
                ))}
              </>
            )}
            <br/>
            <strong>Последние бронирования:</strong> {dashboardData.recentBookings?.length || 0}<br/>
            {dashboardData.recentBookings?.map((booking, i) => (
              <div key={i}>
                • {booking.first_name} {booking.last_name}: {booking.status} 
                {booking.cancelled_by && ` (отменил: ${booking.cancelled_by})`} → {booking.displayStatus}
              </div>
            ))}
          </div>
        )}
      </div>
    </ClubLayout>
  );
};

export default ClubDashboard;