import React from 'react';
import { useNavigate } from 'react-router-dom';
import ClubCalendar from './ClubCalendar';
import './CalendarPage.css';

const CalendarPage = ({ clubData, templates }) => {
  const navigate = useNavigate();
  
  // Обработчик клика по занятию в календаре
  const handleClassClick = (classItem) => {
    navigate(`/club/schedule/edit/${classItem.id}`);
  };
  
  // Обработчик клика по дате в календаре
  const handleDateClick = (date) => {
    // Преобразуем дату в формат YYYY-MM-DD для передачи в параметры URL
    const formattedDate = date.toISOString().split('T')[0];
    navigate(`/club/schedule?date=${formattedDate}`);
  };

  return (
    <div className="calendar-page">
      <div className="calendar-page-header">
        <h2 className="calendar-page-title">Календарь занятий</h2>
        <div className="calendar-page-actions">
          <button className="add-class-btn" onClick={() => navigate('/club/schedule/add')}>
            + Добавить занятие
          </button>
          <button className="secondary-btn" onClick={() => navigate('/club/schedule/series')}>
            Создать серию
          </button>
        </div>
      </div>
      
      <ClubCalendar 
        classes={clubData?.schedule || []}
        templates={templates || []}
        onClassClick={handleClassClick}
        onDateClick={handleDateClick}
      />
    </div>
  );
};

export default CalendarPage;