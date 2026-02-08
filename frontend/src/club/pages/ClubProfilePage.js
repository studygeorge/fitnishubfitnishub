import React, { useState, useEffect } from 'react';
import { useClub } from '../contexts/ClubContext';
import { Navigate } from 'react-router-dom';
import ClubLayout from '../components/layout/ClubLayout';
import BasicInfo from '../components/profile/BasicInfo';
import ContactInfo from '../components/profile/ContactInfo';
import Gallery from '../components/profile/Gallery';
import Amenities from '../components/profile/Amenities';
import OpeningHours from '../components/profile/OpeningHours';
import api from '../../services/api';
import '../styles/club-profile.css';

const ClubProfilePage = () => {
  const { club, isAuthenticated, loading, updateClub, refreshClubData } = useClub();
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    category: '',
    description: '',
    contact_phone: '',
    contact_email: '',
    website: '',
    amenities: [],
    opening_hours: {},
    social_media: {
      instagram: '',
      vkontakte: '',
      telegram: ''
    }
  });

  useEffect(() => {
    if (club) {
      setFormData({
        name: club.name || '',
        address: club.address || '',
        category: club.category || '',
        description: club.description || '',
        contact_phone: club.contact_phone || '',
        contact_email: club.contact_email || '',
        website: club.website || '',
        amenities: club.amenities || [],
        opening_hours: club.opening_hours || initializeOpeningHours(),
        social_media: {
          instagram: club.social_media?.instagram || '',
          vkontakte: club.social_media?.vkontakte || '',
          telegram: club.social_media?.telegram || ''
        }
      });
    }
  }, [club]);

  const initializeOpeningHours = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const hours = {};
    days.forEach(day => {
      hours[day] = {
        open: '09:00',
        close: '21:00',
        closed: false
      };
    });
    return hours;
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Название клуба обязательно';
    if (!formData.address.trim()) errors.address = 'Адрес обязателен';
    if (!formData.category) errors.category = 'Выберите категорию';
    if (!formData.contact_phone.trim()) errors.contact_phone = 'Телефон обязателен';
    if (!formData.contact_email.trim()) errors.contact_email = 'Email обязателен';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.contact_email && !emailRegex.test(formData.contact_email)) {
      errors.contact_email = 'Некорректный email';
    }
    
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (formData.contact_phone && !phoneRegex.test(formData.contact_phone.replace(/\s|-|\(|\)/g, ''))) {
      errors.contact_phone = 'Некорректный номер телефона';
    }
    
    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      errors.website = 'Сайт должен начинаться с http:// или https://';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSocialMediaChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: value
      }
    }));
  };

  const handleAmenitiesChange = (amenityId, checked) => {
    setFormData(prev => ({
      ...prev,
      amenities: checked 
        ? [...prev.amenities, amenityId]
        : prev.amenities.filter(id => id !== amenityId)
    }));
  };

  const handleOpeningHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours[day],
          [field]: value
        }
      }
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
      return;
    }
    
    try {
      setSaving(true);
      await api.clubs.update(club.id, formData);
      await refreshClubData();
      showNotification('Профиль клуба успешно обновлен', 'success');
    } catch (error) {
      console.error('Ошибка при сохранении профиля:', error);
      showNotification('Ошибка при сохранении профиля: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (type) => async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showNotification('Файл слишком большой. Максимальный размер: 5MB', 'error');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('Поддерживаются только форматы: JPEG, PNG, WebP', 'error');
      return;
    }

    const uploadFunction = type === 'logo' ? handleLogoUpload : 
                          type === 'banner' ? handleBannerUpload : 
                          handleGalleryUpload;
    
    await uploadFunction(file);
    e.target.value = '';
  };

  const handleLogoUpload = async (file) => {
    try {
      setUploading(true);
      const result = await api.clubs.uploadLogo(club.id, file);
      updateClub({ logo_url: result.logo_url });
      showNotification('Логотип успешно загружен', 'success');
    } catch (error) {
      console.error('Ошибка при загрузке логотипа:', error);
      showNotification('Ошибка при загрузке логотипа: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleBannerUpload = async (file) => {
    try {
      setUploading(true);
      const result = await api.clubs.uploadBanner(club.id, file);
      updateClub({ banner_url: result.banner_url });
      showNotification('Баннер успешно загружен', 'success');
    } catch (error) {
      console.error('Ошибка при загрузке баннера:', error);
      showNotification('Ошибка при загрузке баннера: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (file) => {
    try {
      setUploading(true);
      await api.clubs.uploadGalleryImages(club.id, [file]);
      await refreshClubData();
      showNotification('Изображение добавлено в галерею', 'success');
    } catch (error) {
      console.error('Ошибка при загрузке изображения:', error);
      showNotification('Ошибка при загрузке изображения: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (type, index = null) => {
    if (!window.confirm('Вы уверены, что хотите удалить это изображение?')) return;
  
    try {
      setUploading(true);
      
      if (type === 'logo') {
        await api.clubs.deleteLogo(club.id);
        updateClub({ logo_url: null });
      } else if (type === 'banner') {
        await api.clubs.deleteBanner(club.id);
        updateClub({ banner_url: null });
      } else if (type === 'gallery' && index !== null) {
        await api.clubs.deleteGalleryImage(club.id, index);
        await refreshClubData();
      }
      
      showNotification('Изображение удалено', 'success');
    } catch (error) {
      console.error('Ошибка при удалении изображения:', error);
      showNotification('Ошибка при удалении изображения: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const showNotification = (message, type) => {
    // Простая реализация уведомлений через alert для примера
    // В реальном проекте лучше использовать toast-библиотеку
    alert(message);
  };

  const calculateProfileCompleteness = () => {
    const fields = ['name', 'address', 'category', 'description', 'contact_phone', 'contact_email'];
    const filledFields = fields.filter(field => formData[field] && formData[field].trim());
    return Math.round((filledFields.length / fields.length) * 100);
  };

  if (loading) {
    return (
      <ClubLayout>
        <div className="fitness-profile-loading">
          <div className="fitness-loading-spinner"></div>
          <p>Загрузка профиля клуба...</p>
        </div>
      </ClubLayout>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/club/login" replace />;
  }

  const tabs = [
    { id: 'basic', label: 'Основное' },
    { id: 'contact', label: 'Контакты' },
    { id: 'media', label: 'Медиа' },
    { id: 'amenities', label: 'Услуги' },
    { id: 'hours', label: 'Режим работы' }
  ];

  return (
    <ClubLayout>
      <div className="fitness-profile-page">
        <div className="fitness-profile-header">
          <div className="fitness-profile-info">
            <div className="fitness-profile-avatar">
              {club?.logo_url ? (
                <img src={club.logo_url} alt="Логотип клуба" />
              ) : (
                <div className="fitness-avatar-placeholder">
                  {club?.name ? club.name.charAt(0) : 'К'}
                </div>
              )}
            </div>
            <div className="fitness-profile-details">
              <h1>{club?.name || 'Название клуба'}</h1>
              <p className="fitness-profile-email">{club?.contact_email}</p>
              <div className="fitness-user-stats">
                <div className="fitness-stat">
                  <span className="fitness-stat-value">{calculateProfileCompleteness()}%</span>
                  <span className="fitness-stat-label">Заполненность</span>
                </div>
                <div className="fitness-stat">
                  <span className="fitness-stat-value">{club?.status || 'Не проверен'}</span>
                  <span className="fitness-stat-label">Статус</span>
                </div>
              </div>
            </div>
          </div>
          {club?.status === 'verified' && (
            <div className="fitness-status-badge fitness-status-confirmed">
              Верифицирован
            </div>
          )}
        </div>

        <div className="fitness-profile-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`fitness-profile-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="fitness-profile-content">
          <form className="fitness-profile-section" onSubmit={handleSaveProfile}>
            {activeTab === 'basic' && (
              <BasicInfo
                formData={formData}
                onChange={handleInputChange}
                validationErrors={validationErrors}
              />
            )}
            
            {activeTab === 'contact' && (
              <ContactInfo
                formData={formData}
                onChange={handleInputChange}
                onSocialMediaChange={handleSocialMediaChange}
                validationErrors={validationErrors}
              />
            )}
            
            {activeTab === 'media' && (
              <Gallery
                club={club}
                onFileUpload={handleFileUpload}
                onDeleteImage={handleDeleteImage}
                uploading={uploading}
              />
            )}
            
            {activeTab === 'amenities' && (
              <Amenities
                formData={formData}
                onAmenitiesChange={handleAmenitiesChange}
              />
            )}
            
            {activeTab === 'hours' && (
              <OpeningHours
                formData={formData}
                onOpeningHoursChange={handleOpeningHoursChange}
              />
            )}

            {activeTab !== 'media' && (
              <div className="fitness-form-actions">
                <button 
                  type="submit" 
                  className="fitness-btn fitness-btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </ClubLayout>
  );
};

export default ClubProfilePage;