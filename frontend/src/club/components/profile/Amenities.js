import React, { useState } from 'react';

const Amenities = ({ formData, onAmenitiesChange }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const amenitiesCategories = {
    basic: {
      title: 'Базовые услуги',
      amenities: [
        { id: 'parking', label: 'Парковка' },
        { id: 'lockers', label: 'Раздевалки' },
        { id: 'shower', label: 'Душевые' },
        { id: 'towels', label: 'Полотенца' },
        { id: 'wifi', label: 'Wi-Fi' },
        { id: 'air_conditioning', label: 'Кондиционер' }
      ]
    },
    equipment: {
      title: 'Оборудование',
      amenities: [
        { id: 'cardio', label: 'Кардио-зона' },
        { id: 'weights', label: 'Тренажеры' },
        { id: 'free_weights', label: 'Свободные веса' },
        { id: 'functional', label: 'Функциональный тренинг' },
        { id: 'crossfit', label: 'CrossFit зона' },
        { id: 'boxing', label: 'Боксерская зона' }
      ]
    },
    wellness: {
      title: 'Здоровье и красота',
      amenities: [
        { id: 'sauna', label: 'Сауна' },
        { id: 'pool', label: 'Бассейн' },
        { id: 'massage', label: 'Массаж' },
        { id: 'spa', label: 'SPA-услуги' },
        { id: 'solarium', label: 'Солярий' },
        { id: 'cosmetology', label: 'Косметология' }
      ]
    },
    additional: {
      title: 'Дополнительные услуги',
      amenities: [
        { id: 'nutrition', label: 'Спортпитание' },
        { id: 'cafe', label: 'Кафе' },
        { id: 'shop', label: 'Магазин' },
        { id: 'childcare', label: 'Детская комната' },
        { id: 'personal_training', label: 'Персональные тренировки' },
        { id: 'group_classes', label: 'Групповые занятия' }
      ]
    }
  };

  const filteredAmenities = searchTerm 
    ? Object.entries(amenitiesCategories).reduce((acc, [key, category]) => {
        const filtered = category.amenities.filter(amenity =>
          amenity.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[key] = { ...category, amenities: filtered };
        }
        return acc;
      }, {})
    : amenitiesCategories;

  return (
    <div className="fitness-profile-amenities">
      <h2>Услуги и удобства</h2>
      <p>Отметьте доступные в вашем клубе услуги</p>
      
      <div className="fitness-amenities-search">
        <input
          type="text"
          placeholder="Поиск услуг..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="fitness-search-input"
        />
      </div>

      <div className="fitness-amenities-container">
        {Object.entries(filteredAmenities).map(([categoryKey, category]) => (
          <div key={categoryKey} className="fitness-amenities-category">
            <h3>{category.title}</h3>
            <div className="fitness-amenities-grid">
              {category.amenities.map(amenity => (
                <label 
                  key={amenity.id} 
                  className={`fitness-amenity-item ${formData.amenities.includes(amenity.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity.id)}
                    onChange={(e) => onAmenitiesChange(amenity.id, e.target.checked)}
                    className="fitness-amenity-checkbox"
                  />
                  <span className="fitness-amenity-label">{amenity.label}</span>
                  <span className="fitness-amenity-check">✓</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fitness-selected-amenities">
        <div className="fitness-amenities-summary">
          <h3>Выбранные услуги</h3>
          <span className="fitness-amenities-count">
            Выбрано: <strong>{formData.amenities.length}</strong> услуг
          </span>
        </div>
        
        {formData.amenities.length > 0 && (
          <div className="fitness-selected-list">
            {formData.amenities.map(amenityId => {
              const amenity = Object.values(amenitiesCategories)
                .flatMap(cat => cat.amenities)
                .find(a => a.id === amenityId);
              return amenity ? (
                <span key={amenityId} className="fitness-selected-tag">
                  {amenity.label}
                  <button
                    type="button"
                    onClick={() => onAmenitiesChange(amenityId, false)}
                    className="fitness-remove-tag"
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Amenities;