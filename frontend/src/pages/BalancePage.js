import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import HorizontalLogos from './assets/HorizontalLogos.png';
import './BalancePage.css';

const BalancePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [error, setError] = useState(null);
  const [processLoading, setProcessLoading] = useState(false);
  
  // Добавляем состояние для отслеживания обновлений
  const [balanceUpdateTrigger, setBalanceUpdateTrigger] = useState(0);
  
  const [alertModal, setAlertModal] = useState({
    show: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'OK'
  });
  
  const navigate = useNavigate();

  const showAlert = (type, title, message, onConfirm = null, confirmText = 'OK') => {
    setAlertModal({
      show: true,
      type,
      title,
      message,
      onConfirm,
      confirmText
    });
  };

  const closeAlert = () => {
    if (alertModal.onConfirm) {
      alertModal.onConfirm();
    }
    setAlertModal({
      show: false,
      type: 'info',
      title: '',
      message: '',
      onConfirm: null,
      confirmText: 'OK'
    });
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'success':
        return <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>;
      case 'warning':
        return <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>;
      case 'error':
        return <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>;
      default:
        return <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11M11,9H13V7H11"/>;
    }
  };

  // Функция для уведомления хедера об обновлении баланса
  const notifyHeaderBalanceUpdate = useCallback((newBalance) => {
    console.log('📢 Уведомляем хедер об обновлении баланса...', newBalance);
    
    const balanceData = {
      balance: newBalance,
      timestamp: Date.now()
    };
    
    localStorage.setItem('latestBalance', JSON.stringify(balanceData));
    
    window.dispatchEvent(new CustomEvent('balanceUpdated', {
      detail: {
        balance: newBalance,
        timestamp: Date.now()
      }
    }));
    
    console.log('✅ Уведомление отправлено в хедер');
  }, []);

  // Улучшенная функция обновления баланса с анимацией и уведомлением хедера
  const forceRefreshBalance = useCallback(async () => {
    try {
      console.log('🔄 Принудительно обновляем баланс пользователя...');
      
      const userData = await api.users.getProfile();
      const newBalance = userData.balance || 0;
      
      console.log('📊 Новые данные пользователя:', {
        currentBalance: user ? user.balance : 'не загружен',
        newBalance: newBalance
      });
      
      const oldBalance = user ? user.balance : 0;
      
      setUser(prevUser => {
        if (oldBalance !== newBalance) {
          setBalanceUpdateTrigger(prev => prev + 1);
          console.log('🎯 Баланс изменился:', { oldBalance, newBalance });
          
          setTimeout(() => {
            notifyHeaderBalanceUpdate(newBalance);
          }, 100);
        }
        
        return {
          ...prevUser,
          id: userData.id,
          name: `${userData.first_name} ${userData.last_name}`,
          balance: newBalance
        };
      });
      
      console.log('✅ Баланс успешно обновлен');
      
    } catch (err) {
      console.error('❌ Ошибка обновления баланса:', err);
      throw err;
    }
  }, [user, notifyHeaderBalanceUpdate]);

  // Функция для периодического обновления баланса
  const startBalancePolling = useCallback(() => {
    const pollInterval = setInterval(async () => {
      try {
        await forceRefreshBalance();
      } catch (err) {
        console.error('❌ Ошибка периодического обновления:', err);
      }
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [forceRefreshBalance]);

  // Обработка возврата с PayKeeper
  useEffect(() => {
    const handlePaymentReturn = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const error = urlParams.get('error');
      
      const pendingOrderId = localStorage.getItem('pendingPaymentOrder');
      
      if (success === 'true' && pendingOrderId) {
        console.log('🎉 Возврат после успешной оплаты:', pendingOrderId);
        
        try {
          setTimeout(async () => {
            await forceRefreshBalance();
            
            setCustomAmount('');
            setSelectedAmount(1000);
            
            showAlert('success', 'Оплата завершена!', 
              `Баланс успешно пополнен! Спасибо за оплату.`);
          }, 2000);
            
        } catch (err) {
          console.error('❌ Ошибка обновления данных:', err);
          showAlert('warning', 'Проверьте баланс', 'Оплата прошла успешно. Обновите страницу для актуализации данных.');
        }
        
        localStorage.removeItem('pendingPaymentOrder');
        
      } else if (error === 'true') {
        console.log('❌ Возврат после неуспешной оплаты');
        showAlert('error', 'Ошибка оплаты', 'Платеж не был завершен. Попробуйте еще раз.');
        
        if (pendingOrderId) {
          localStorage.removeItem('pendingPaymentOrder');
        }
      }
      
      if (success || error) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    if (user && !loading) {
      handlePaymentReturn();
    }
  }, [user, loading, forceRefreshBalance]);

  // Запуск периодического обновления баланса
  useEffect(() => {
    if (user && !loading) {
      console.log('▶️ Запускаем периодическое обновление баланса на странице баланса');
      const stopPolling = startBalancePolling();
      
      return () => {
        console.log('⏹️ Останавливаем периодическое обновление баланса');
        stopPolling();
      };
    }
  }, [user, loading, startBalancePolling]);

  // Загрузка данных пользователя
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login', { state: { from: '/balance' } });
          return;
        }
        
        console.log('📊 Загружаем данные пользователя и баланс...');
        
        const userData = await api.users.getProfile();
        
        setUser({
          id: userData.id,
          name: `${userData.first_name} ${userData.last_name}`,
          balance: userData.balance || 0
        });
        
        console.log('✅ Данные пользователя загружены:', {
          id: userData.id,
          balance: userData.balance
        });
        
      } catch (err) {
        console.error('❌ Ошибка при загрузке данных баланса:', err);
        setError('Не удалось загрузить данные. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate]);

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    setCustomAmount(e.target.value);
    setSelectedAmount(0);
  };

  const getFinalAmount = () => {
    return customAmount ? Number(customAmount) : selectedAmount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const amount = getFinalAmount();
    
    if (amount < 100) {
      showAlert('warning', 'Неверная сумма', 'Минимальная сумма пополнения - 100 ₽');
      return;
    }
    
    try {
      setProcessLoading(true);
      
      console.log('💳 Создаем платеж:', { amount, paymentMethod });
      
      const result = await api.balance.addFunds(amount, paymentMethod);
      
      console.log('📋 Результат создания платежа:', result);
      
      if (result.success && result.paymentUrl) {
        localStorage.setItem('pendingPaymentOrder', result.orderId);
        
        showAlert('info', 'Переход к оплате', 
          `Сейчас вы будете перенаправлены на безопасную страницу оплаты суммы ${amount.toLocaleString()} ₽.\n\nПосле успешной оплаты вы вернетесь обратно, и ваш баланс будет автоматически пополнен.`, 
          () => {
            console.log('🔄 Перенаправляем на PayKeeper:', result.paymentUrl);
            window.location.href = result.paymentUrl;
          },
          'Перейти к оплате'
        );
      } else {
        showAlert('error', 'Ошибка создания платежа', 
          result.message || 'Не удалось создать платеж. Попробуйте позже.');
      }
      
    } catch (error) {
      console.error('❌ Ошибка при создании платежа:', error);
      showAlert('error', 'Ошибка создания платежа', 
        'Не удалось создать платеж. Проверьте подключение к интернету и попробуйте еще раз.');
    } finally {
      setProcessLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="balpg-loading-wrapper">
        <div className="balpg-loading-content">
          <div className="balpg-loading-spinner"></div>
          <p className="balpg-loading-text">Загружаем данные баланса...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="balpg-error-wrapper">
        <div className="balpg-error-content">
          <div className="balpg-error-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V21C3 22.1 3.9 23 5 23H19C20.1 23 21 22.1 21 21V9M19 9H14V4H5V21H19V9Z"/>
            </svg>
          </div>
          <h2 className="balpg-error-title">Ошибка загрузки</h2>
          <p className="balpg-error-message">{error}</p>
          <button className="balpg-btn balpg-btn-primary" onClick={() => window.location.reload()}>
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="balpg-container">
      {/* Заголовок страницы */}
      <header className="balpg-header">
        <div className="balpg-header-content">
          <h1 className="balpg-title">Баланс</h1>
          <p className="balpg-subtitle">Управляйте своим балансом для оплаты занятий</p>
        </div>
        
        {/* Карточка баланса */}
        <div className="balpg-balance-card">
          <div className="balpg-balance-info">
            <span className="balpg-balance-label">Текущий баланс</span>
            <span 
              className={`balpg-balance-amount ${balanceUpdateTrigger > 0 ? 'balpg-balance-updated' : ''}`}
              key={`balance-${user?.balance}-${balanceUpdateTrigger}`}
            >
              {user?.balance !== undefined ? parseFloat(user.balance).toLocaleString() : '0'} ₽
            </span>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="balpg-main">
        {/* Единственная секция пополнения на всю ширину */}
        <section className="balpg-section balpg-deposit-section balpg-single-section">
          <div className="balpg-section-header">
            <h2 className="balpg-section-title">Пополнение баланса</h2>
          </div>
          
          <form className="balpg-deposit-form" onSubmit={handleSubmit}>
            {/* Выбор суммы */}
            <div className="balpg-amount-wrapper">
              <div className="balpg-amount-grid">
                {[500, 1000, 3000, 5000, 10000].map(amount => (
                  <button
                    key={amount}
                    type="button"
                    className={`balpg-amount-btn ${selectedAmount === amount ? 'balpg-amount-btn-active' : ''}`}
                    onClick={() => handleAmountSelect(amount)}
                  >
                    {amount.toLocaleString()} ₽
                  </button>
                ))}
              </div>
              
              <div className="balpg-custom-amount">
                <input
                  type="number"
                  className="balpg-custom-input"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="Другая сумма"
                  min="100"
                />
              </div>
            </div>
            
            {/* Способы оплаты */}
            <div className="balpg-payment-wrapper">
              <label className="balpg-payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="paykeeper"
                  checked={paymentMethod === 'paykeeper' || paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('paykeeper')}
                  className="balpg-payment-radio"
                />
                <div className="balpg-payment-content">
                  <svg className="balpg-payment-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/>
                  </svg>
                  <span className="balpg-payment-text">Банковская карта</span>
                </div>
              </label>
            </div>
            
            {/* Итоговая сумма */}
            <div className="balpg-summary">
              <div className="balpg-summary-row">
                <span className="balpg-summary-label">К оплате:</span>
                <span className="balpg-summary-amount">{getFinalAmount().toLocaleString()} ₽</span>
              </div>
            </div>
            
            {/* Кнопка оплаты */}
            <button 
              type="submit" 
              className={`balpg-btn balpg-btn-primary balpg-submit-btn ${processLoading ? 'balpg-btn-loading' : ''}`}
              disabled={processLoading || getFinalAmount() < 100}
            >
              {processLoading ? (
                <>
                  <div className="balpg-btn-spinner"></div>
                  Создаем платеж...
                </>
              ) : (
                'Пополнить баланс'
              )}
            </button>
          </form>
        </section>
      </main>

      {/* Футер с логотипами */}
      <footer className="balpg-footer">
        <div className="balpg-footer-links">
          <Link to="/terms-of-service" className="balpg-footer-link">Условия использования</Link>
          <Link to="/privacy-policy" className="balpg-footer-link">Политика конфиденциальности</Link>
          <Link to="/recommendation-policy" className="balpg-footer-link">Политика возврата</Link>
          <Link to="/user-rules" className="balpg-footer-link">Правила пользователей</Link>
        </div>
        <div className="balpg-footer-info">
          <p>Все платежи обрабатываются в безопасной среде PayKeeper с использованием SSL-шифрования</p>
          <p>При возникновении вопросов обращайтесь в службу поддержки</p>
        </div>
        
        {/* Логотипы партнеров в футере */}
        <div className="balpg-footer-partners">
          <img 
            src={HorizontalLogos} 
            alt="Партнеры и платежные системы" 
            className="balpg-footer-partners-image"
          />
        </div>
      </footer>

      {/* Модальное окно alert */}
      {alertModal.show && (
        <div className="balpg-modal-overlay" onClick={closeAlert}>
          <div className="balpg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="balpg-modal-header">
              <div className={`balpg-alert-icon balpg-alert-icon-${alertModal.type}`}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  {getAlertIcon(alertModal.type)}
                </svg>
              </div>
              <h3 className="balpg-modal-title">{alertModal.title}</h3>
              <button className="balpg-modal-close" onClick={closeAlert}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            
            <div className="balpg-modal-content">
              <p className="balpg-alert-message">{alertModal.message}</p>
            </div>
            
            <div className="balpg-modal-actions">
              <button className="balpg-btn balpg-btn-primary" onClick={closeAlert}>
                {alertModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalancePage;