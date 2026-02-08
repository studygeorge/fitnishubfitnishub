import React, { useState, useEffect } from 'react';
import { useClub } from '../contexts/ClubContext';
import { Navigate, useLocation } from 'react-router-dom';
import ClubLayout from '../components/layout/ClubLayout';
import ScheduleCalendar from '../components/schedule/ScheduleCalendar';
import ClassList from '../components/schedule/ClassList';
import AddClassForm from '../components/schedule/AddClassForm';
import api from '../../services/api';
import '../styles/club-schedule.css';

const ClubSchedulePage = () => {
  const { club, isAuthenticated, loading } = useClub();
  const location = useLocation();
  const [activeView, setActiveView] = useState('calendar');
  const [schedule, setSchedule] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  // ИСПРАВЛЕНО: Инициализируем selectedDate через функцию
  const [selectedDate, setSelectedDate] = useState(() => getTodayString());
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newClass, setNewClass] = useState(() => ({
    className: '',
    dates: [getTodayString()], // ИСПРАВЛЕНО: используем функцию
    startTime: '10:00',
    endTime: '11:00',
    trainer: '',
    capacity: 10,
    price: 500,
    category: '',
    description: ''
  }));

  // НОВАЯ ФУНКЦИЯ: Корректное извлечение даты без сдвига часовых поясов
  function getLocalDateString(dateTimeString) {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // НОВАЯ ФУНКЦИЯ: Получение текущей даты в местном времени
  function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ИСПРАВЛЕНО: Мемоизированная фильтрация занятий
  const filteredClasses = React.useMemo(() => {
    const filtered = schedule.filter(classItem => {
      const classDate = getLocalDateString(classItem.start_time);
      const matches = classDate === selectedDate;
      
      console.log('Фильтрация занятий:', {
        classId: classItem.id,
        className: classItem.class_name,
        startTime: classItem.start_time,
        classDate: classDate,
        selectedDate: selectedDate,
        matches: matches
      });
      
      return matches;
    });
    
    console.log(`Отфильтровано ${filtered.length} занятий из ${schedule.length} для даты ${selectedDate}`);
    return filtered;
  }, [schedule, selectedDate]);

  useEffect(() => {
    if (isAuthenticated && club?.id) {
      loadScheduleData();
      loadTemplates();
      checkTemplateData();
    }
  }, [isAuthenticated, club, location]);

  // НОВЫЙ useEffect: Принудительная проверка фильтрации при смене представления
  useEffect(() => {
    if (activeView === 'list') {
      console.log('Переключение на список:', {
        selectedDate,
        scheduleLength: schedule.length,
        filteredLength: filteredClasses.length,
        todayString: getTodayString()
      });
      
      // ИСПРАВЛЕНО: Если выбранная дата не сегодня, сбрасываем на сегодня
      const today = getTodayString();
      if (selectedDate !== today && schedule.length > 0) {
        console.log('Сброс даты на сегодня при переключении на список');
        setSelectedDate(today);
      }
    }
  }, [activeView, schedule.length]);

  const checkTemplateData = () => {
    const templateData = localStorage.getItem('scheduleFromTemplate');
    if (templateData) {
      try {
        const scheduleData = JSON.parse(templateData);
        console.log('Данные из шаблона:', scheduleData);
        createClassFromTemplate(scheduleData);
        localStorage.removeItem('scheduleFromTemplate');
      } catch (error) {
        console.error('Ошибка при обработке данных шаблона:', error);
        localStorage.removeItem('scheduleFromTemplate');
      }
    }
  };

  const createClassFromTemplate = async (templateData) => {
    try {
      setDataLoading(true);
      
      if (templateData.repeatType === 'once') {
        await createSingleClass(templateData);
      } else if (templateData.repeatType === 'weekly') {
        await createWeeklyClasses(templateData);
      }
      
      await loadScheduleData();
      alert('Занятия успешно созданы из шаблона!');
      setActiveView('list');
      setSelectedDate(templateData.date);
    } catch (error) {
      console.error('Ошибка при создании занятий из шаблона:', error);
      alert('Ошибка при создании занятий: ' + error.message);
    } finally {
      setDataLoading(false);
    }
  };

  const createSingleClass = async (templateData) => {
    const classData = {
      club_id: club.id,
      class_name: templateData.class_name,
      start_time: `${templateData.date}T${templateData.time}:00`,
      end_time: calculateEndTime(templateData.date, templateData.time, templateData.duration),
      trainer: templateData.trainer || '',
      capacity: parseInt(templateData.capacity),
      price: parseFloat(templateData.price),
      category: templateData.category || '',
      description: templateData.description || '',
      template_id: templateData.template_id
    };
    
    await api.schedule.addClass(classData);
  };

  const createWeeklyClasses = async (templateData) => {
    const startDate = new Date(templateData.date);
    const endDate = templateData.endDate ? new Date(templateData.endDate) : null;
    const selectedDays = templateData.selectedDays;
    
    const dayMapping = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 0
    };

    const classes = [];
    const currentDate = new Date(startDate);
    
    const maxIterations = endDate ? 
      Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000)) + 1 : 52;
    
    for (let week = 0; week < maxIterations; week++) {
      for (const dayKey of selectedDays) {
        const targetDay = dayMapping[dayKey];
        const classDate = new Date(currentDate);
        
        const currentDay = classDate.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;
        classDate.setDate(classDate.getDate() + daysUntilTarget);
        
        if (endDate && classDate > endDate) {
          continue;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (classDate < today) {
          continue;
        }
        
        const classData = {
          club_id: club.id,
          class_name: templateData.class_name,
          start_time: `${classDate.toISOString().split('T')[0]}T${templateData.time}:00`,
          end_time: calculateEndTime(classDate.toISOString().split('T')[0], templateData.time, templateData.duration),
          trainer: templateData.trainer || '',
          capacity: parseInt(templateData.capacity),
          price: parseFloat(templateData.price),
          category: templateData.category || '',
          description: templateData.description || '',
          template_id: templateData.template_id
        };
        
        classes.push(classData);
      }
      
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    for (const classData of classes) {
      await api.schedule.addClass(classData);
    }
    
    console.log(`Создано ${classes.length} занятий`);
  };

  const calculateEndTime = (date, startTime, duration) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    
    return `${date}T${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`;
  };

  const loadScheduleData = async () => {
    try {
      setDataLoading(true);
      const scheduleData = await api.schedule.getAll({ clubId: club.id });
      
      console.log('Загруженное расписание:', {
        total: scheduleData?.length || 0,
        examples: scheduleData?.slice(0, 3)?.map(item => ({
          id: item.id,
          class_name: item.class_name,
          start_time: item.start_time,
          localDate: getLocalDateString(item.start_time)
        }))
      });
      
      setSchedule(scheduleData || []);
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
      setSchedule([]);
    } finally {
      setDataLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const templatesData = await api.templates.getAll(club.id);
      setTemplates(templatesData || []);
    } catch (error) {
      console.error('Ошибка загрузки шаблонов:', error);
      setTemplates([]);
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    
    if (newClass.dates.length === 0) {
      alert('Пожалуйста, выберите хотя бы одну дату для занятия');
      return;
    }
    
    try {
      setDataLoading(true);
      
      for (const date of newClass.dates) {
        const classData = {
          club_id: club.id,
          class_name: newClass.className,
          start_time: `${date}T${newClass.startTime}:00`,
          end_time: `${date}T${newClass.endTime}:00`,
          trainer: newClass.trainer,
          capacity: parseInt(newClass.capacity),
          price: parseFloat(newClass.price),
          category: newClass.category,
          description: newClass.description
        };
        
        await api.schedule.addClass(classData);
      }
      
      await loadScheduleData();
      
      setNewClass({
        className: '',
        dates: [getTodayString()],
        startTime: '10:00',
        endTime: '11:00',
        trainer: '',
        capacity: 10,
        price: 500,
        category: '',
        description: ''
      });
      
      setShowAddForm(false);
      alert(`Успешно добавлено ${newClass.dates.length} занятий`);
    } catch (error) {
      console.error('Ошибка при добавлении занятия:', error);
      alert('Ошибка при добавлении занятия: ' + error.message);
    } finally {
      setDataLoading(false);
    }
  };

  const handleClassDelete = async (classId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это занятие?')) {
      return;
    }

    try {
      setDataLoading(true);
      await api.schedule.deleteClass(classId);
      await loadScheduleData();
      alert('Занятие успешно удалено');
    } catch (error) {
      console.error('Ошибка при удалении занятия:', error);
      alert('Ошибка при удалении занятия: ' + error.message);
    } finally {
      setDataLoading(false);
    }
  };

  const handleCalendarDateClick = (date) => {
    const dateStr = getLocalDateString(date);
    console.log('Клик по календарю:', { originalDate: date, dateStr });
    setSelectedDate(dateStr);
    setActiveView('list');
    
    setNewClass(prev => ({
      ...prev,
      dates: [dateStr]
    }));
  };

  // ИСПРАВЛЕНО: Обработчик переключения вида с принудительным обновлением
  const handleViewChange = (view) => {
    console.log('Переключение вида:', { from: activeView, to: view });
    setActiveView(view);
    
    // Если переключаемся на список и дата не сегодня, сбрасываем
    if (view === 'list') {
      const today = getTodayString();
      console.log('Проверка даты при переключении на список:', { selectedDate, today });
      if (selectedDate !== today) {
        console.log('Сброс даты на сегодня');
        setSelectedDate(today);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClass(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateSelection = (dates) => {
    setNewClass(prev => ({
      ...prev,
      dates: dates
    }));
  };

  const handleTimeChange = (timeValues) => {
    setNewClass(prev => ({
      ...prev,
      ...timeValues
    }));
  };

  const generateDateOptions = () => {
    const options = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const value = `${year}-${month}-${day}`;
      
      const label = date.toLocaleDateString('ru-RU', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'long' 
      });
      
      options.push({ value, label });
    }
    return options;
  };

  const dateOptions = generateDateOptions();

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
      <div className="fitness-schedule-page">
        <div className="fitness-page-header">
          <div className="fitness-header-content">
            <h1>Расписание занятий</h1>
            <p>Управление занятиями и расписанием клуба</p>
          </div>
          <div className="fitness-header-actions">
            <button 
              className="fitness-btn fitness-btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Отменить' : 'Добавить занятие'}
            </button>
          </div>
        </div>

        <div className="fitness-view-toggle">
          <button 
            className={`fitness-toggle-btn ${activeView === 'calendar' ? 'active' : ''}`}
            onClick={() => handleViewChange('calendar')} // ИСПРАВЛЕНО: используем новый обработчик
          >
            <div className="fitness-toggle-icon fitness-calendar-toggle-icon"></div>
            Календарь
          </button>
          <button 
            className={`fitness-toggle-btn ${activeView === 'list' ? 'active' : ''}`}
            onClick={() => handleViewChange('list')} // ИСПРАВЛЕНО: используем новый обработчик
          >
            <div className="fitness-toggle-icon fitness-list-toggle-icon"></div>
            Список
          </button>
        </div>

        <div className="fitness-schedule-content">
          {showAddForm ? (
            <div className="fitness-add-form-section">
              <AddClassForm 
                newClass={newClass}
                onInputChange={handleInputChange}
                onDateSelection={handleDateSelection}
                onTimeChange={handleTimeChange}
                onSubmit={handleAddClass}
              />
            </div>
          ) : (
            <>
              {activeView === 'calendar' ? (
                <div className="fitness-calendar-section">
                  <ScheduleCalendar 
                    classes={schedule}
                    templates={templates}
                    onClassClick={() => {}}
                    onDateClick={handleCalendarDateClick}
                  />
                </div>
              ) : (
                <div className="fitness-list-section">
                  <div className="fitness-list-controls">
                    <div className="fitness-date-selector">
                      <label htmlFor="date-select">Дата:</label>
                      <select
                        id="date-select"
                        value={selectedDate}
                        onChange={(e) => {
                          console.log('Ручная смена даты:', e.target.value);
                          setSelectedDate(e.target.value);
                        }}
                        className="fitness-date-select"
                      >
                        {dateOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="fitness-list-stats">
                      <span className="fitness-stat">
                        Всего: <strong>{schedule.length}</strong>
                      </span>
                      <span className="fitness-stat">
                        На дату: <strong>{filteredClasses.length}</strong>
                      </span>
                    </div>
                  </div>

                  <ClassList 
                    classes={filteredClasses}
                    onEditClass={() => {}}
                    onDeleteClass={handleClassDelete}
                    selectedDate={selectedDate}
                    dateOptions={dateOptions}
                    onDateChange={setSelectedDate}
                    loading={dataLoading}
                  />

                  {/* ОТЛАДОЧНАЯ ИНФОРМАЦИЯ для разработки */}
                  {process.env.NODE_ENV === 'development' && (
                    <div style={{
                      background: '#f0f0f0',
                      padding: '10px',
                      margin: '10px 0',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}>
                      <strong>🔍 Отладка расписания:</strong><br/>
                      Сегодня: {getTodayString()}<br/>
                      Выбранная дата: {selectedDate}<br/>
                      Всего занятий: {schedule.length}<br/>
                      Отфильтровано: {filteredClasses.length}<br/>
                      <strong>Примеры занятий и их даты:</strong><br/>
                      {schedule.slice(0, 5).map((cl, i) => (
                        <div key={i} style={{ color: getLocalDateString(cl.start_time) === selectedDate ? 'green' : 'red' }}>
                          • {cl.class_name}: {cl.start_time} → {getLocalDateString(cl.start_time)}
                          {getLocalDateString(cl.start_time) === selectedDate ? ' ✓' : ' ✗'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ClubLayout>
  );
};

export default ClubSchedulePage;
