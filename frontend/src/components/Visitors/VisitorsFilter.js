import React from 'react';

const VisitorsFilter = ({ filters, onFilterChange }) => {
  return (
    <div className="visitors-filter">
      <div className="filter-group">
        <label>Фильтр по статусу</label>
        <select name="status" value={filters.status} onChange={onFilterChange}>
          <option value="all">Все статусы</option>
          <option value="completed">Завершено</option>
          <option value="confirmed">Подтверждено</option>
          <option value="cancelled">Отменено</option>
        </select>
      </div>
      
      <div className="filter-group">
        <label>Фильтр по дате</label>
        <input 
          type="date" 
          name="date"
          value={filters.date || ''}
          onChange={onFilterChange}
        />
      </div>
      
      <div className="filter-group search-group">
        <label>Поиск</label>
        <input 
          type="text"
          name="search" 
          value={filters.search || ''}
          onChange={onFilterChange}
          placeholder="Поиск по имени или занятию" 
        />
      </div>
    </div>
  );
};

export default VisitorsFilter;