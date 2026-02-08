// src/club/components/bookings/BookingFilters.js
import React from 'react';

const BookingFilters = ({ filters, onFilterChange }) => {
  // Генерация дат для фильтра
  const generateDateOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = -7; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const value = date.toISOString().split('T')[0];
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

  return (
    <div className="booking-filters">
      <div className="filters-row">
        <div className="filter-group">
          <label htmlFor="status-filter">Статус:</label>
          <select
            id="status-filter"
            name="status"
            value={filters.status}
            onChange={onFilterChange}
            className="filter-select"
          >
            <option value="all">Все статусы</option>
            <option value="confirmed">Подтверждено</option>
            <option value="completed">Завершено</option>
            <option value="cancelled">Отменено</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="date-filter">Дата:</label>
          <select
            id="date-filter"
            name="date"
            value={filters.date}
            onChange={onFilterChange}
            className="filter-select"
          >
            <option value="">Все даты</option>
            {dateOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="search-filter">Поиск:</label>
          <input
            id="search-filter"
            type="text"
            name="search"
            value={filters.search}
            onChange={onFilterChange}
            placeholder="Поиск по имени или занятию..."
            className="filter-input"
          />
        </div>

        <div className="filter-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              onFilterChange({ target: { name: 'status', value: 'all' } });
              onFilterChange({ target: { name: 'date', value: '' } });
              onFilterChange({ target: { name: 'search', value: '' } });
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingFilters;