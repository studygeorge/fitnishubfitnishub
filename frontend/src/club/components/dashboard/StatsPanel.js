import React from 'react';

const StatsPanel = ({ stats, templatesCount, loading }) => {
  if (loading) {
    return (
      <div className="fitness-stats-grid">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="fitness-stat-card loading">
            <div className="fitness-stat-skeleton"></div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Сегодня',
      subtitle: 'записей',
      value: stats?.todayBookings || 0,
      iconClass: 'fitness-today-icon',
      color: 'primary',
      trend: '+12%'
    },
    {
      title: 'За неделю',
      subtitle: 'записей', 
      value: stats?.weeklyBookings || 0,
      iconClass: 'fitness-chart-icon',
      color: 'info',
      trend: '+8%'
    },
    {
      title: 'Активных',
      subtitle: 'занятий',
      value: stats?.activeClasses || 0,
      iconClass: 'fitness-workout-icon',
      color: 'warning'
    },
    {
      title: 'Завершено',
      subtitle: 'посещений',
      value: stats?.completedBookings || 0,
      iconClass: 'fitness-check-icon',
      color: 'success'
    },
    
    {
      title: 'Шаблонов',
      subtitle: 'создано',
      value: templatesCount || 0,
      iconClass: 'fitness-template-icon',
      color: 'secondary'
    }
  ];

  return (
    <div className="fitness-stats-section">
      <div className="fitness-stats-grid">
        {statCards.map((card, index) => (
          <div key={index} className={`fitness-stat-card ${card.color}`}>
            <div className="fitness-stat-header">
              <div className={`fitness-stat-icon ${card.iconClass}`}></div>
              {card.trend && (
                <div className="fitness-stat-trend positive">
                  {card.trend}
                </div>
              )}
            </div>
            <div className="fitness-stat-content">
              <div className="fitness-stat-value">
                {card.isRevenue ? card.value : card.value.toLocaleString()}
              </div>
              <div className="fitness-stat-label">
                <span className="fitness-stat-title">{card.title}</span>
                <span className="fitness-stat-subtitle">{card.subtitle}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsPanel;