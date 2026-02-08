import React, { useState, useEffect, useRef } from 'react';
import './TelegramLinkModal.css';

const TelegramLinkModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onSuccess,
  showAlert 
}) => {
  const [telegramCode, setTelegramCode] = useState('');
  const [linkingStep, setLinkingStep] = useState(1);
  const [telegramError, setTelegramError] = useState('');
  
  // Реф для интервала проверки
  const linkingIntervalRef = useRef(null);
  const maxAttempts = 20;
  const attemptsRef = useRef(0);

  // Функция очистки интервала проверки
  const clearLinkingInterval = () => {
    if (linkingIntervalRef.current) {
      clearInterval(linkingIntervalRef.current);
      linkingIntervalRef.current = null;
    }
  };

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      clearLinkingInterval();
    };
  }, []);

  // Проверка привязки Telegram с правильной очисткой интервала
  useEffect(() => {
    if (linkingStep === 2 && telegramCode && isOpen) {
      attemptsRef.current = 0;
      
      linkingIntervalRef.current = setInterval(async () => {
        attemptsRef.current += 1;
        
        if (attemptsRef.current > maxAttempts) {
          clearLinkingInterval();
          setTelegramError('Время ожидания истекло. Код остается активным, попробуйте отправить команду боту еще раз.');
          // НЕ сбрасываем на шаг 1, оставляем на шаге 2
          return;
        }
        
        try {
          const success = await checkTelegramLinkingStatus();
          if (success) {
            clearLinkingInterval();
          }
        } catch (error) {
          console.error('Ошибка при проверке статуса:', error);
        }
      }, 3000);
    }
    
    return () => {
      clearLinkingInterval();
    };
  }, [linkingStep, telegramCode, isOpen]);

  // Генерация кода верификации с таймером на 5 секунд
  const generateTelegramCode = async () => {
    try {
      setLinkingStep(1);
      setTelegramError('');
      
      // Показываем загрузку ровно 5 секунд
      setTimeout(async () => {
        try {
          const response = await fetch('/api/telegram/user/generate-code', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          const data = await response.json();
          
          if (data.success) {
            setTelegramCode(data.code);
            setLinkingStep(2);
            localStorage.setItem('telegram_linking_code', data.code);
            localStorage.setItem('telegram_linking_user_id', user.id);
          } else {
            setTelegramError(data.message || 'Ошибка генерации кода');
            // Остаемся на шаге 1, не переходим дальше
          }
        } catch (error) {
          console.error('Ошибка генерации кода:', error);
          setTelegramError('Не удалось сгенерировать код');
          // Остаемся на шаге 1, не переходим дальше
        }
      }, 5000);
      
    } catch (error) {
      console.error('Ошибка генерации кода:', error);
      setTelegramError('Не удалось сгенерировать код');
    }
  };

  // Функция проверки статуса привязки
  const checkTelegramLinkingStatus = async () => {
    try {
      const response = await fetch('/api/telegram/user/check-linking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ code: telegramCode })
      });

      const data = await response.json();
      
      if (data.success && data.linked) {
        // Успешная привязка - переходим к шагу 3
        setLinkingStep(3);
        localStorage.removeItem('telegram_linking_code');
        localStorage.removeItem('telegram_linking_user_id');
        
        // Вызываем callback успеха
        if (onSuccess) {
          onSuccess();
        }
        
        // Автоматически закрываем модальное окно через 4 секунды
        setTimeout(() => {
          handleClose();
          // Перезагружаем страницу для обновления всех данных
          window.location.reload();
        }, 4000);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Ошибка проверки привязки Telegram:', error);
      return false;
    }
  };

  // Копирование команды Telegram
  const copyTelegramCommand = async () => {
    const command = `/link ${telegramCode}`;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(command);
        showAlert && showAlert('success', 'Успешно', 'Команда скопирована в буфер обмена');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = command;
        textArea.style.position = 'absolute';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showAlert && showAlert('success', 'Успешно', 'Команда скопирована в буфер обмена');
      }
    } catch (error) {
      console.error('Ошибка копирования:', error);
      showAlert && showAlert('info', 'Скопируйте команду вручную', command);
    }
  };

  // Переход в бота
  const openTelegramBot = () => {
    const botUrl = 'https://t.me/fitneshub_bot';
    window.open(botUrl, '_blank');
  };

  // Обработка открытия модального окна
  useEffect(() => {
    if (isOpen) {
      generateTelegramCode();
    } else {
      handleClose();
    }
  }, [isOpen]);

  // Функция для закрытия модального окна
  const handleClose = () => {
    clearLinkingInterval();
    setLinkingStep(1);
    setTelegramCode('');
    setTelegramError('');
    attemptsRef.current = 0;
    localStorage.removeItem('telegram_linking_code');
    localStorage.removeItem('telegram_linking_user_id');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="telegram-modal-overlay" onClick={handleClose}>
      <div className="telegram-modal" onClick={e => e.stopPropagation()}>
        <div className="telegram-modal-header">
          <h3>Подключение уведомлений в Telegram</h3>
        </div>
        
        <div className="telegram-modal-content">
          {linkingStep === 1 && (
            <div className="telegram-step">
              <div className="telegram-step-header">
                <div className="telegram-step-number">1</div>
                <h4>Генерация кода...</h4>
              </div>
              <div className="telegram-loading-spinner"></div>
              <p>Создаем код для привязки вашего Telegram аккаунта</p>
            </div>
          )}

          {linkingStep === 2 && (
            <div className="telegram-step">
              <div className="telegram-step-header">
                <div className="telegram-step-number">2</div>
                <h4>Отправьте команду боту</h4>
              </div>
              <div className="telegram-step-content">
                <div className="telegram-info-block">
                  <p><strong>Что это даст:</strong></p>
                  <ul>
                    <li>Уведомления об отмене занятий</li>
                    <li>Мгновенные сообщения в Telegram</li>
                    <li>Информация о возврате средств</li>
                  </ul>
                </div>
                
                <div className="telegram-info-block">
                  <p><strong>Инструкция:</strong></p>
                  <ol>
                    <li>Перейдите в Telegram бот: <strong>@fitneshub_bot</strong></li>
                    <li>Отправьте боту эту команду:</li>
                  </ol>
                </div>
                
                <div className="telegram-code-block">
                  <div className="telegram-code">
                    <code>/link {telegramCode}</code>
                    <div className="telegram-code-buttons">
                      <button 
                        className="telegram-copy-btn"
                        onClick={copyTelegramCommand}
                      >
                        Копировать
                      </button>
                      <button 
                        className="telegram-bot-btn"
                        onClick={openTelegramBot}
                      >
                        Перейти в бот
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="telegram-linking-status">
                  <div className="telegram-loading-spinner"></div>
                  <span>Ожидаем подтверждения от бота...</span>
                </div>
              </div>
            </div>
          )}

          {linkingStep === 3 && (
            <div className="telegram-step">
              <div className="telegram-step-header">
                <span className="telegram-step-success">✓</span>
                <h4>Уведомления подключены!</h4>
              </div>
              <div className="telegram-step-content">
                <p>Telegram уведомления успешно настроены.</p>
                <div className="telegram-success-info">
                  <h5>Вы будете получать уведомления о:</h5>
                  <ul>
                    <li>Отмене занятий клубом</li>
                    <li>Автоматическом возврате средств</li>
                    <li>Возможности перенести запись</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {telegramError && (
            <div className="telegram-error">
              <span className="telegram-error-icon">!</span>
              <span>{telegramError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelegramLinkModal;