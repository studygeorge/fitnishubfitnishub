import React, { useState, useEffect } from 'react';
import { useClub } from '../contexts/ClubContext';
import { Navigate, useNavigate } from 'react-router-dom';
import ClubLayout from '../components/layout/ClubLayout';
import api from '../../services/api';
import '../styles/club-templates.css';

const ClubTemplatesPage = () => {
  const { club, isAuthenticated, loading } = useClub();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const [newTemplate, setNewTemplate] = useState({
    template_name: '',
    class_name: '',
    duration: 60,
    trainer: '',
    capacity: 10,
    price: 500,
    category: '',
    description: '',
    color: '#F8A284'
  });

  useEffect(() => {
    if (isAuthenticated && club?.id) {
      loadTemplates();
    }
  }, [isAuthenticated, club]);

  const loadTemplates = async () => {
    try {
      setDataLoading(true);
      const templatesData = await api.templates.getAll(club.id);
      setTemplates(templatesData || []);
    } catch (error) {
      console.error('Ошибка загрузки шаблонов:', error);
      setTemplates([]);
    } finally {
      setDataLoading(false);
    }
  };

  const handleTemplateChange = (e) => {
    const { name, value } = e.target;
    setNewTemplate(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTemplate = async (e) => {
    e.preventDefault();
    
    try {
      setDataLoading(true);
      
      const templateData = {
        club_id: club.id,
        ...newTemplate
      };
      
      if (editingTemplate) {
        await api.templates.update(editingTemplate.id, templateData);
      } else {
        await api.templates.create(templateData);
      }
      
      await loadTemplates();
      resetForm();
      
      alert(editingTemplate ? 'Шаблон успешно обновлен' : 'Шаблон успешно создан');
    } catch (error) {
      console.error('Ошибка при сохранении шаблона:', error);
      alert('Ошибка при сохранении шаблона: ' + error.message);
    } finally {
      setDataLoading(false);
    }
  };

  const handleEditTemplate = (template) => {
    setNewTemplate({
      template_name: template.template_name,
      class_name: template.class_name,
      duration: template.duration,
      trainer: template.trainer || '',
      capacity: template.capacity,
      price: template.price,
      category: template.category || '',
      description: template.description || '',
      color: template.color || '#F8A284'
    });
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот шаблон?')) {
      return;
    }

    try {
      setDataLoading(true);
      await api.templates.delete(templateId);
      await loadTemplates();
      alert('Шаблон успешно удален');
    } catch (error) {
      console.error('Ошибка при удалении шаблона:', error);
      alert('Ошибка при удалении шаблона: ' + error.message);
    } finally {
      setDataLoading(false);
    }
  };

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    setShowScheduleModal(true);
  };

  const resetForm = () => {
    setNewTemplate({
      template_name: '',
      class_name: '',
      duration: 60,
      trainer: '',
      capacity: 10,
      price: 500,
      category: '',
      description: '',
      color: '#F8A284'
    });
    setEditingTemplate(null);
    setShowForm(false);
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}м`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`;
  };

  const colorOptions = [
    { value: '#F8A284', label: 'Оранжевый', bg: '#F8A284' },
    { value: '#84C5F8', label: 'Голубой', bg: '#84C5F8' },
    { value: '#84F8A2', label: 'Зеленый', bg: '#84F8A2' },
    { value: '#F884C5', label: 'Розовый', bg: '#F884C5' },
    { value: '#C584F8', label: 'Фиолетовый', bg: '#C584F8' },
    { value: '#F8F084', label: 'Желтый', bg: '#F8F084' },
    { value: '#F88484', label: 'Красный', bg: '#F88484' },
    { value: '#84F8F8', label: 'Бирюзовый', bg: '#84F8F8' }
  ];

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
      <div className="templates-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>Шаблоны занятий</h1>
            <p>Создавайте шаблоны для быстрого добавления повторяющихся занятий</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '← Назад' : '+ Создать шаблон'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="templates-stats">
          <div className="stat-item">
            <span className="stat-value">{templates.length}</span>
            <span className="stat-label">Всего шаблонов</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {templates.filter(t => t.category).length}
            </span>
            <span className="stat-label">С категориями</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {templates.filter(t => t.trainer).length}
            </span>
            <span className="stat-label">С тренерами</span>
          </div>
        </div>

        {/* Content */}
        <div className="templates-content">
          {showForm ? (
            <TemplateForm
              template={newTemplate}
              editingTemplate={editingTemplate}
              onTemplateChange={handleTemplateChange}
              onSubmit={handleAddTemplate}
              onCancel={resetForm}
              formatDuration={formatDuration}
              colorOptions={colorOptions}
              loading={dataLoading}
            />
          ) : (
            <TemplatesList
              templates={templates}
              onUseTemplate={handleUseTemplate}
              onEditTemplate={handleEditTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              formatDuration={formatDuration}
              loading={dataLoading}
            />
          )}
        </div>

        {/* Tips */}
        {!showForm && (
          <div className="templates-tips">
            <h3>💡 Советы по использованию шаблонов</h3>
            <ul>
              <li>Создавайте отдельные шаблоны для разных типов тренировок</li>
              <li>Используйте разные цвета для разных категорий занятий</li>
              <li>Добавляйте подробные описания для лучшего понимания</li>
              <li>Регулярно обновляйте цены и информацию о тренерах</li>
            </ul>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && selectedTemplate && (
          <ScheduleModal
            template={selectedTemplate}
            onClose={() => {
              setShowScheduleModal(false);
              setSelectedTemplate(null);
            }}
            onSchedule={(scheduleData) => {
              localStorage.setItem('scheduleFromTemplate', JSON.stringify(scheduleData));
              navigate('/club/schedule');
            }}
            formatDuration={formatDuration}
          />
        )}
      </div>
    </ClubLayout>
  );
};

// Модальное окно для планирования
const ScheduleModal = ({ template, onClose, onSchedule, formatDuration }) => {
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
    repeatType: 'once',
    endDate: '',
    selectedDays: []
  });

  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setScheduleData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDayToggle = (day) => {
    setScheduleData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }));
  };

  const handleSchedule = async () => {
    if (!scheduleData.date || !scheduleData.time) {
      alert('Пожалуйста, выберите дату и время');
      return;
    }

    if (scheduleData.repeatType === 'weekly' && scheduleData.selectedDays.length === 0) {
      alert('Пожалуйста, выберите дни недели для повторения');
      return;
    }

    setLoading(true);

    try {
      const fullScheduleData = {
        ...template,
        ...scheduleData,
        template_id: template.id,
        class_name: template.class_name,
        duration: template.duration,
        trainer: template.trainer,
        capacity: template.capacity,
        price: template.price,
        category: template.category,
        description: template.description
      };

      console.log('Отправляем данные:', fullScheduleData);
      
      onSchedule(fullScheduleData);
      onClose();
    } catch (error) {
      console.error('Ошибка при планировании:', error);
      alert('Ошибка при планировании занятия');
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Понедельник' },
    { key: 'tuesday', label: 'Вторник' },
    { key: 'wednesday', label: 'Среда' },
    { key: 'thursday', label: 'Четверг' },
    { key: 'friday', label: 'Пятница' },
    { key: 'saturday', label: 'Суббота' },
    { key: 'sunday', label: 'Воскресенье' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Запланировать занятие</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="template-preview">
            <div 
              className="template-color-indicator"
              style={{ backgroundColor: template.color || '#F8A284' }}
            />
            <div className="template-info">
              <h4>{template.class_name}</h4>
              <p>{formatDuration(template.duration)} • {template.capacity} мест • {template.price} ₽</p>
              {template.trainer && <p>Тренер: {template.trainer}</p>}
            </div>
          </div>

          <div className="schedule-form">
            <div className="form-section">
              <h4>Основные параметры</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="date">Дата *</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={scheduleData.date}
                    onChange={handleInputChange}
                    min={today}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="time">Время *</label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={scheduleData.time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Повторение</h4>
              <div className="repeat-options">
                <label className="repeat-option">
                  <input
                    type="radio"
                    name="repeatType"
                    value="once"
                    checked={scheduleData.repeatType === 'once'}
                    onChange={handleInputChange}
                  />
                  <span>Одноразово</span>
                </label>

                <label className="repeat-option">
                  <input
                    type="radio"
                    name="repeatType"
                    value="weekly"
                    checked={scheduleData.repeatType === 'weekly'}
                    onChange={handleInputChange}
                  />
                  <span>Еженедельно</span>
                </label>
              </div>

              {scheduleData.repeatType === 'weekly' && (
                <div className="weekly-options">
                  <div className="form-group">
                    <label>Дни недели</label>
                    <div className="days-selector">
                      {daysOfWeek.map(day => (
                        <label 
                          key={day.key}
                          className={`day-option ${scheduleData.selectedDays.includes(day.key) ? 'selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={scheduleData.selectedDays.includes(day.key)}
                            onChange={() => handleDayToggle(day.key)}
                          />
                          <span>{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="endDate">До какой даты</label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={scheduleData.endDate}
                      onChange={handleInputChange}
                      min={scheduleData.date || today}
                    />
                    <small>Оставьте пустым для ограничения 52 недели</small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Отменить
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSchedule}
            disabled={loading}
          >
            {loading ? 'Планирование...' : 'Запланировать'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Список шаблонов
const TemplatesList = ({ 
  templates, 
  onUseTemplate, 
  onEditTemplate, 
  onDeleteTemplate, 
  formatDuration, 
  loading 
}) => {
  if (loading) {
    return (
      <div className="templates-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка шаблонов...</p>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="empty-templates">
        <div className="empty-icon">📋</div>
        <h3>У вас пока нет шаблонов</h3>
        <p>Создайте первый шаблон для быстрого добавления занятий в расписание</p>
      </div>
    );
  }

  return (
    <div className="templates-grid">
      {templates.map(template => (
        <div key={template.id} className="template-card">
          <div 
            className="template-color-bar"
            style={{ backgroundColor: template.color || '#F8A284' }}
          />
          
          <div className="template-header">
            <h4 className="template-name">{template.template_name}</h4>
            <div className="template-actions">
              <button
                className="action-btn use"
                onClick={() => onUseTemplate(template)}
                title="Создать занятие из шаблона"
              >
                📅 Использовать
              </button>
              <button
                className="action-btn edit"
                onClick={() => onEditTemplate(template)}
                title="Редактировать шаблон"
              >
                ✏️
              </button>
              <button
                className="action-btn delete"
                onClick={() => onDeleteTemplate(template.id)}
                title="Удалить шаблон"
              >
                🗑️
              </button>
            </div>
          </div>

          <div className="template-content">
            <div className="template-class-name">
              <strong>{template.class_name}</strong>
            </div>

            {template.category && (
              <div className="template-category">
                <span className="category-badge">{template.category}</span>
              </div>
            )}

            <div className="template-details">
              <div className="detail-row">
                <span className="detail-label">Длительность:</span>
                <span className="detail-value">{formatDuration(template.duration)}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Мест:</span>
                <span className="detail-value">{template.capacity}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Цена:</span>
                <span className="detail-value price">{template.price} ₽</span>
              </div>

              {template.trainer && (
                <div className="detail-row">
                  <span className="detail-label">Тренер:</span>
                  <span className="detail-value">{template.trainer}</span>
                </div>
              )}
            </div>

            {template.description && (
              <div className="template-description">
                <p>{template.description}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const TemplateForm = ({ 
  template, 
  editingTemplate,
  onTemplateChange, 
  onSubmit, 
  onCancel,
  formatDuration,
  colorOptions,
  loading
}) => {
  return (
    <div className="template-form">
      <div className="form-header">
        <h2>{editingTemplate ? 'Редактировать шаблон' : 'Создать новый шаблон'}</h2>
        <p>Заполните информацию о шаблоне занятия</p>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-section">
          <h3>Основная информация</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="template_name">Название шаблона *</label>
              <input
                type="text"
                id="template_name"
                name="template_name"
                value={template.template_name}
                onChange={onTemplateChange}
                placeholder="Например: Утренняя йога"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="class_name">Название занятия *</label>
              <input
                type="text"
                id="class_name"
                name="class_name"
                value={template.class_name}
                onChange={onTemplateChange}
                placeholder="Например: Хатха-йога для начинающих"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Категория</label>
              <select
                id="category"
                name="category"
                value={template.category}
                onChange={onTemplateChange}
              >
                <option value="">Выберите категорию</option>
                <option value="Йога">Йога</option>
                <option value="Фитнес">Фитнес</option>
                <option value="Силовые тренировки">Силовые тренировки</option>
                <option value="Кардио">Кардио</option>
                <option value="Групповые занятия">Групповые занятия</option>
                <option value="Танцы">Танцы</option>
                <option value="Боевые искусства">Боевые искусства</option>
                <option value="Плавание">Плавание</option>
                <option value="Другое">Другое</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="trainer">Тренер</label>
              <input
                type="text"
                id="trainer"
                name="trainer"
                value={template.trainer}
                onChange={onTemplateChange}
                placeholder="Имя тренера"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Параметры занятия</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="duration">
                Длительность: {formatDuration(template.duration)}
              </label>
              <input
                type="range"
                id="duration"
                name="duration"
                value={template.duration}
                onChange={onTemplateChange}
                min="30"
                max="180"
                step="15"
                className="duration-slider"
              />
              <div className="duration-marks">
                <span>30м</span>
                <span>1ч</span>
                <span>1.5ч</span>
                <span>2ч</span>
                <span>3ч</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="capacity">Количество мест *</label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                value={template.capacity}
                onChange={onTemplateChange}
                min="1"
                max="100"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Цена (₽) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={template.price}
                onChange={onTemplateChange}
                min="0"
                step="50"
                required
              />
            </div>

            <div className="form-group">
              <label>Цвет для календаря</label>
              <div className="color-picker">
                {colorOptions.map(option => (
                  <label
                    key={option.value}
                    className={`color-option ${template.color === option.value ? 'selected' : ''}`}
                    title={option.label}
                  >
                    <input
                      type="radio"
                      name="color"
                      value={option.value}
                      checked={template.color === option.value}
                      onChange={onTemplateChange}
                    />
                    <div 
                      className="color-swatch"
                      style={{ backgroundColor: option.bg }}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Дополнительно</h3>
          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              name="description"
              value={template.description}
              onChange={onTemplateChange}
              placeholder="Дополнительная информация о шаблоне занятия"
              rows="3"
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Сохранение...' : editingTemplate ? 'Обновить' : 'Создать'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Отменить
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClubTemplatesPage;