import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import './AdminRegisterClubPage.css';

const AdminRegisterClubPage = ({ isEdit = false }) => {
  const [clubData, setClubData] = useState({
    name: '',
    address: '',
    category: '',
    description: '',
    contact_phone: '',
    contact_email: '',
    website: '',
    owner_id: '',
    amenities: []
  });
  
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [amenitiesInput, setAmenitiesInput] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { id: clubId } = useParams();
  
  // Получаем данные из state (если переходим с создания владельца)
  const preselectedOwner = location.state;
  
  const queryParams = new URLSearchParams(location.search);
  const requestId = queryParams.get('request');
  
  const categories = [
    { value: 'fitness', label: 'Фитнес-клуб' },
    { value: 'gym', label: 'Тренажерный зал' },
    { value: 'yoga', label: 'Студия йоги' },
    { value: 'swimming', label: 'Бассейн' },
    { value: 'crossfit', label: 'Кроссфит' },
    { value: 'dance', label: 'Танцевальная студия' },
    { value: 'boxing', label: 'Бокс' },
    { value: 'martial_arts', label: 'Боевые искусства' },
    { value: 'other', label: 'Другое' }
  ];
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setFormLoading(true);
        
        // Загружаем всех пользователей
        const usersData = await api.admin.getAllUsers();
        setOwners(usersData);
        
        // Если есть предварительно выбранный владелец
        if (preselectedOwner?.ownerId) {
          setClubData(prev => ({
            ...prev,
            owner_id: preselectedOwner.ownerId.toString()
          }));
        }
        
        // Если есть requestId, загружаем данные заявки
        if (requestId) {
          const requestsData = await api.admin.getApplications();
          const request = requestsData.find(req => req.id === parseInt(requestId));
          
          if (request) {
            setClubData(prev => ({
              ...prev,
              name: request.club_name || '',
              address: request.address || '',
              category: request.category || '',
              description: request.description || '',
              contact_phone: request.phone || '',
              contact_email: request.email || '',
              website: request.website || ''
            }));
          }
        }
        
        // Если режим редактирования - загружаем данные клуба
        if (isEdit && clubId) {
          const clubDetails = await api.admin.getClub(clubId);
          
          setClubData({
            name: clubDetails.name || '',
            address: clubDetails.address || '',
            category: clubDetails.category || '',
            description: clubDetails.description || '',
            contact_phone: clubDetails.contact_phone || '',
            contact_email: clubDetails.contact_email || '',
            website: clubDetails.website || '',
            owner_id: clubDetails.owner_id?.toString() || '',
            amenities: clubDetails.amenities || []
          });
          
          if (clubDetails.amenities && Array.isArray(clubDetails.amenities)) {
            // Если amenities пришли как строка, парсим их
            if (typeof clubDetails.amenities === 'string') {
              try {
                const parsed = JSON.parse(clubDetails.amenities);
                setClubData(prev => ({ ...prev, amenities: Array.isArray(parsed) ? parsed : [] }));
              } catch (e) {
                console.error('Ошибка парсинга amenities:', e);
              }
            }
          }
        }
      } catch (err) {
        setError('Ошибка при загрузке данных. Пожалуйста, попробуйте позже.');
        console.error('Ошибка загрузки данных:', err);
      } finally {
        setFormLoading(false);
      }
    };
    
    loadData();
  }, [requestId, preselectedOwner, isEdit, clubId]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClubData({
      ...clubData,
      [name]: value
    });
  };
  
  const handleAddAmenity = () => {
    if (amenitiesInput.trim()) {
      setClubData({
        ...clubData,
        amenities: [...clubData.amenities, amenitiesInput.trim()]
      });
      setAmenitiesInput('');
    }
  };
  
  const handleRemoveAmenity = (index) => {
    const newAmenities = [...clubData.amenities];
    newAmenities.splice(index, 1);
    setClubData({
      ...clubData,
      amenities: newAmenities
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Проверка обязательных полей
      const requiredFields = {
        'Название клуба': clubData.name,
        'Адрес': clubData.address,
        'Категория': clubData.category,
        'Владелец': clubData.owner_id
      };
      
      const missingFields = [];
      for (const [fieldName, value] of Object.entries(requiredFields)) {
        if (!value || value.trim() === '') {
          missingFields.push(fieldName);
        }
      }
      
      if (missingFields.length > 0) {
        setError(`Заполните обязательные поля: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }
      
      console.log('🏋️ Создаем клуб:', clubData);
      
      // Отправка данных на сервер
      const response = await api.admin.registerClub(clubData);
      
      console.log('✅ Клуб создан:', response);
      
      setSuccess(`Клуб "${response.name}" успешно зарегистрирован!`);
      
      // Если клуб создан из заявки, обновляем статус заявки
      if (requestId) {
        await api.admin.updateApplicationStatus(requestId, 'approved');
      }
      
      // Редирект на панель администратора через 2 секунды
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('❌ Ошибка создания клуба:', err);
      setError(err.message || 'Ошибка при регистрации клуба');
    } finally {
      setLoading(false);
    }
  };
  
  const createNewOwner = () => {
    navigate('/admin/users/register-owner?redirect=club');
  };
  
  if (formLoading) {
    return (
      <div className="admin-loading-container">
        <div className="admin-spinner"></div>
        <p>Загрузка формы...</p>
      </div>
    );
  }
  
  return (
    <div className="admin-register-club-page">
      <div className="admin-back-nav">
        <Link to="/admin/dashboard">← Вернуться в админ панель</Link>
      </div>
      
      <div className="admin-page-title">
        <h1>Регистрация нового клуба</h1>
        <p>Заполните форму для добавления клуба в систему</p>
        {preselectedOwner && (
          <div className="step-indicator">
            <span className="step completed">1. Владелец создан</span>
            <span className="step-arrow">→</span>
            <span className="step active">2. Регистрация клуба</span>
          </div>
        )}
      </div>
      
      {error && <div className="admin-error-message">{error}</div>}
      {success && <div className="admin-success-message">{success}</div>}
      
      <form className="admin-register-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>🏋️ Основная информация</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Название клуба *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={clubData.name}
                onChange={handleInputChange}
                required
                placeholder="Введите название клуба"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="category">Категория *</label>
              <select
                id="category"
                name="category"
                value={clubData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Выберите категорию</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="address">Адрес *</label>
            <input
              type="text"
              id="address"
              name="address"
              value={clubData.address}
              onChange={handleInputChange}
              required
              placeholder="Полный адрес клуба"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              name="description"
              value={clubData.description}
              onChange={handleInputChange}
              rows="4"
              placeholder="Краткое описание клуба, услуги, особенности..."
            ></textarea>
          </div>
        </div>
        
        <div className="form-section">
          <h2>📞 Контактная информация</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contact_phone">Телефон</label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={clubData.contact_phone}
                onChange={handleInputChange}
                placeholder="+7 (999) 123-45-67"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="contact_email">Email</label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={clubData.contact_email}
                onChange={handleInputChange}
                placeholder="info@fitnessclub.ru"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="website">Веб-сайт</label>
            <input
              type="url"
              id="website"
              name="website"
              value={clubData.website}
              onChange={handleInputChange}
              placeholder="https://example.com"
            />
          </div>
        </div>
        
        <div className="form-section">
          <h2>✨ Удобства и особенности</h2>
          
          <div className="form-group">
            <label>Список удобств</label>
            <div className="amenities-input">
              <input
                type="text"
                value={amenitiesInput}
                onChange={(e) => setAmenitiesInput(e.target.value)}
                placeholder="Например: Бесплатный Wi-Fi"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
              />
              <button type="button" onClick={handleAddAmenity}>Добавить</button>
            </div>
            
            <div className="amenities-list">
              {clubData.amenities.map((amenity, index) => (
                <div className="amenity-tag" key={index}>
                  <span>{amenity}</span>
                  <button type="button" onClick={() => handleRemoveAmenity(index)}>×</button>
                </div>
              ))}
              {clubData.amenities.length === 0 && (
                <p className="no-amenities">Список удобств пуст</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2>👤 Владелец клуба</h2>
          
          {preselectedOwner && (
            <div className="preselected-owner">
              <p>✅ Выбранный владелец: <strong>{preselectedOwner.ownerName}</strong></p>
            </div>
          )}
          
          <div className="form-row">
            <div className="form-group owner-select">
              <label htmlFor="owner_id">Выберите владельца *</label>
              <select
                id="owner_id"
                name="owner_id"
                value={clubData.owner_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Выберите владельца клуба</option>
                {owners.map(owner => (
                  <option key={owner.id} value={owner.id}>
                    {owner.full_name} ({owner.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group owner-action">
              <button type="button" onClick={createNewOwner} className="create-owner-btn">
                + Новый владелец
              </button>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate('/admin/dashboard')}>
            Отмена
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрировать клуб'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminRegisterClubPage;