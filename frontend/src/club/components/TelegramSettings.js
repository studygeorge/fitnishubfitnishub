import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './TelegramSettings.css';

const TelegramSettings = () => {
  const [status, setStatus] = useState({
    connected: false,
    isClubOwner: false,
    clubName: null,
    botUsername: null
  });
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [botStatus, setBotStatus] = useState({ botActive: false });
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  useEffect(() => {
    loadTelegramStatus();
    loadBotStatus();
  }, []);

  const loadTelegramStatus = async () => {
    try {
      const response = await api.telegram.getStatus();
      setStatus(response);
    } catch (error) {
      console.error('Ошибка загрузки статуса Telegram:', error);
    }
  };

  const loadBotStatus = async () => {
    try {
      const response = await api.telegram.getBotStatus();
      setBotStatus(response);
    } catch (error) {
      console.error('Ошибка проверки статуса бота:', error);
    }
  };

  const generateVerificationCode = async () => {
    setLoading(true);
    try {
      const response = await api.telegram.generateCode();
      setVerificationData(response);
    } catch (error) {
      console.error('Ошибка генерации кода:', error);
      alert('Ошибка при генерации кода верификации: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectClick = () => {
    setShowDisconnectConfirm(true);
  };

  const confirmDisconnect = async () => {
    try {
      await api.telegram.disconnect();
      setStatus(prev => ({ ...prev, connected: false }));
      setVerificationData(null);
      setShowDisconnectConfirm(false);
      alert('Telegram уведомления отключены');
    } catch (error) {
      console.error('Ошибка отключения Telegram:', error);
      alert('Ошибка при отключении: ' + error.message);
    }
  };

  const cancelDisconnect = () => {
    setShowDisconnectConfirm(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Команда скопирована в буфер обмена!');
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Команда скопирована в буфер обмена!');
    });
  };

  const checkConnection = async () => {
    await loadTelegramStatus();
    if (status.connected) {
      setVerificationData(null);
    }
  };

  if (!status.isClubOwner) {
    return (
      <div className="telegram-settings">
        <div className="tg-card">
          <div className="tg-header">
            <h3>Telegram уведомления</h3>
            <p>Эта функция доступна только владельцам клубов</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="telegram-settings">
      <div className="tg-card">
        <div className="tg-header">
          <h3>Telegram уведомления</h3>
          <p>Получайте мгновенные уведомления о новых записях в ваш клуб</p>
        </div>

        {/* Статус бота */}
        <div className="tg-bot-status">
          <div className={`tg-status-indicator ${botStatus.botActive ? 'active' : 'inactive'}`}>
            <span className="tg-status-dot"></span>
            <span className="tg-status-text">
              {botStatus.botActive ? 'Бот активен и готов к работе' : 'Бот не активен'}
            </span>
          </div>
        </div>

        {status.connected ? (
          // Подключенное состояние
          <div className="tg-connected">
            <div className="tg-connection-status success">
              <div className="tg-status-icon">✅</div>
              <div className="tg-status-info">
                <h4>Telegram подключен</h4>
                <p>Клуб: <strong>{status.clubName}</strong></p>
                <p>Вы получаете уведомления о новых записях</p>
              </div>
            </div>

            <div className="tg-actions">
              <button 
                onClick={checkConnection}
                className="tg-btn tg-btn-secondary"
              >
                Обновить статус
              </button>
              <button 
                onClick={handleDisconnectClick}
                className="tg-btn tg-btn-danger"
              >
                Отключить уведомления
              </button>
            </div>

            {/* Модальное окно подтверждения отключения */}
            {showDisconnectConfirm && (
              <div className="tg-modal-overlay">
                <div className="tg-modal-content">
                  <h4>Подтверждение отключения</h4>
                  <p>Вы уверены, что хотите отключить Telegram уведомления?</p>
                  <p>После отключения вы перестанете получать уведомления о новых записях.</p>
                  <div className="tg-modal-actions">
                    <button onClick={confirmDisconnect} className="tg-btn tg-btn-danger">
                      Да, отключить
                    </button>
                    <button onClick={cancelDisconnect} className="tg-btn tg-btn-secondary">
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Неподключенное состояние
          <div className="tg-setup">
            <div className="tg-connection-status disconnected">
              <div className="tg-status-icon">❌</div>
              <div className="tg-status-info">
                <h4>Telegram не подключен</h4>
                <p>Подключите Telegram для получения уведомлений о записях</p>
              </div>
            </div>

            {!verificationData ? (
              <div className="tg-setup-start">
                <div className="tg-benefits">
                  <h4>Что вы получите:</h4>
                  <ul>
                    <li>Мгновенные уведомления о новых записях</li>
                    <li>Информация о клиенте и занятии</li>
                    <li>Детали стоимости и времени</li>
                    <li>Удобство управления в Telegram</li>
                  </ul>
                </div>
                
                <button 
                  onClick={generateVerificationCode}
                  disabled={loading || !botStatus.botActive}
                  className="tg-btn tg-btn-primary tg-btn-large"
                >
                  {loading ? 'Генерация...' : 'Подключить Telegram'}
                </button>

                {!botStatus.botActive && (
                  <div className="tg-warning">
                    ⚠️ Telegram бот временно недоступен. Попробуйте позже.
                  </div>
                )}
              </div>
            ) : (
              <div className="tg-verification">
                <div className="tg-instructions">
                  <h4>Инструкции по подключению:</h4>
                  
                  <div className="tg-step">
                    <div className="tg-step-number">1</div>
                    <div className="tg-step-content">
                      <p>Перейдите в Telegram к боту:</p>
                      <a 
                        href={`https://t.me/${verificationData.botUsername}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="tg-bot-link"
                      >
                        @{verificationData.botUsername}
                      </a>
                    </div>
                  </div>

                  <div className="tg-step">
                    <div className="tg-step-number">2</div>
                    <div className="tg-step-content">
                      <p>Отправьте эту команду боту:</p>
                      <div className="tg-code-block">
                        <code>/start {verificationData.verificationCode}</code>
                        <button 
                          onClick={() => copyToClipboard(`/start ${verificationData.verificationCode}`)}
                          className="tg-copy-btn"
                          title="Скопировать команду"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="tg-step">
                    <div className="tg-step-number">3</div>
                    <div className="tg-step-content">
                      <p>Дождитесь подтверждения от бота и нажмите кнопку ниже</p>
                    </div>
                  </div>
                </div>

                <div className="tg-verification-actions">
                  <button 
                    onClick={checkConnection}
                    className="tg-btn tg-btn-primary"
                  >
                    Проверить подключение
                  </button>
                  <button 
                    onClick={() => setVerificationData(null)}
                    className="tg-btn tg-btn-secondary"
                  >
                    Получить новый код
                  </button>
                </div>

                <div className="tg-help">
                  <p><strong>Не получается?</strong> Убедитесь, что:</p>
                  <ul>
                    <li>Вы правильно скопировали команду</li>
                    <li>Отправили команду именно нашему боту</li>
                    <li>Бот ответил подтверждением</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramSettings;