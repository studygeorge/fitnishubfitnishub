import React, { useState, useEffect } from 'react';
import { useClub } from '../contexts/ClubContext';
import { Navigate } from 'react-router-dom';
import ClubLayout from '../components/layout/ClubLayout';
import TelegramSettings from '../components/TelegramSettings';
import api from '../../services/api';
import './ClubSettingsPage.css';

const ClubSettingsPage = () => {
  const { club, isAuthenticated, loading } = useClub();
  const [activeTab, setActiveTab] = useState('telegram');
  const [supportTickets, setSupportTickets] = useState([]);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'technical',
    priority: 'medium',
    description: ''
  });
  const [reports, setReports] = useState({
    bookings: [],
    revenue: [],
    attendance: []
  });
  const [reportPeriod, setReportPeriod] = useState('week');
  const [supportStats, setSupportStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    avgResponseTime: '2 часа'
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    if (club) {
      if (activeTab === 'support') {
        loadSupportData();
      } else if (activeTab === 'reports') {
        loadReportsData();
      }
    }
  }, [club, activeTab, reportPeriod]);

  const loadSupportData = async () => {
    try {
      // Заглушка для поддержки - замените на реальные API вызовы когда будет готово
      setSupportTickets([]);
      setSupportStats({
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0,
        avgResponseTime: '2 часа'
      });
    } catch (error) {
      console.error('Ошибка загрузки данных поддержки:', error);
    }
  };

  const loadReportsData = async () => {
    try {
      setLoadingReports(true);
      // Заглушка для отчетов - замените на реальные API вызовы когда будет готово
      setReports({
        bookings: { total: 0, confirmed: 0, cancelled: 0, attended: 0 },
        revenue: { total: 0, average: 0, refunds: 0, transactions: 0 },
        attendance: { rate: 0, popular_class: 'Нет данных', peak_time: 'Нет данных', returning_clients: 0 }
      });
    } catch (error) {
      console.error('Ошибка загрузки отчетов:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleNewTicketChange = (field, value) => {
    setNewTicket(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    try {
      setSubmittingTicket(true);
      
      // Заглушка для создания тикета - замените на реальный API вызов
      alert('Тикет успешно создан! Мы свяжемся с вами в ближайшее время.');
      
      setNewTicket({
        subject: '',
        category: 'technical',
        priority: 'medium',
        description: ''
      });
    } catch (error) {
      console.error('Ошибка создания тикета:', error);
      alert('Ошибка при создании тикета: ' + error.message);
    } finally {
      setSubmittingTicket(false);
    }
  };

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
      <div className="club-settings-page">
        <div className="page-header">
          <h1>Настройки клуба</h1>
          <p>Управление уведомлениями, поддержка и аналитика</p>
        </div>

        {/* Навигационные вкладки */}
        <div className="tabs-navigation">
          <button 
            className={`tab-button ${activeTab === 'telegram' ? 'active' : ''}`}
            onClick={() => setActiveTab('telegram')}
          >
            <span className="tab-icon"></span>
            Telegram
          </button>
          <button 
            className={`tab-button ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            <span className="tab-icon"></span>
            Поддержка
          </button>
          <button 
            className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <span className="tab-icon"></span>
            Отчеты
          </button>
        </div>

        <div className="tab-content">
          {/* Вкладка Telegram */}
          {activeTab === 'telegram' && <TelegramSettings />}

          {/* Вкладка поддержки */}
          {activeTab === 'support' && (
            <div className="support-section">
              {/* Ваш существующий код поддержки */}
              <div className="settings-section">
                <div className="section-header">
                  <h3>Техническая поддержка</h3>
                  <p>Этот раздел находится в разработке</p>
                </div>
              </div>
            </div>
          )}

          {/* Вкладка отчетов */}
          {activeTab === 'reports' && (
            <div className="reports-section">
              <div className="settings-section">
                <div className="section-header">
                  <h3>Отчеты и аналитика</h3>
                  <p>Этот раздел находится в разработке</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ClubLayout>
  );
};

export default ClubSettingsPage;