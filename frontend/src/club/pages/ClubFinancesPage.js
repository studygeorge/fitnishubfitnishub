import React, { useState, useEffect } from 'react';
import { useClub } from '../contexts/ClubContext';
import { Navigate } from 'react-router-dom';
import ClubLayout from '../components/layout/ClubLayout';
import api from '../../services/api';
import './ClubFinancesPage.css';

const ClubFinancesPage = () => {
  const { club, isAuthenticated, loading, updateClub } = useClub();
  const [financeData, setFinanceData] = useState({
    actualBalance: 0, // Реальный баланс на основе подтвержденных бронирований
    transactions: [],
    bookings: [], // Добавляем бронирования для корректного расчета
    combinedTransactions: [], // Объединенные транзакции с отменами
    monthlyStats: {
      revenue: 0,
      bookings: 0,
      averagePrice: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      refunds: 0
    }
  });
  const [dataLoading, setDataLoading] = useState(true);

  // Форматирование чисел без пробелов
  const formatNumber = (number) => {
    return Math.round(number).toString();
  };

  useEffect(() => {
    if (isAuthenticated && club?.id) {
      loadFinanceData();
    }
  }, [isAuthenticated, club]);

  const loadFinanceData = async () => {
    try {
      setDataLoading(true);
      
      // Загружаем баланс, транзакции И бронирования
      const [balanceData, transactionsData, bookingsData] = await Promise.allSettled([
        api.balance.getClubBalance(club.id),
        api.balance.getClubTransactions(club.id),
        api.bookings.getClubBookings(club.id)
      ]);

      const originalBalance = balanceData.status === 'fulfilled' ? balanceData.value.balance : 0;
      const transactions = transactionsData.status === 'fulfilled' ? transactionsData.value : [];
      const bookings = bookingsData.status === 'fulfilled' ? bookingsData.value : [];

      console.log('Загруженные данные для финансов:', {
        originalBalance,
        transactionsCount: transactions.length,
        bookingsCount: bookings.length
      });

      // Рассчитываем реальный баланс на основе подтвержденных бронирований
      const confirmedBookings = bookings.filter(booking => 
        ['confirmed', 'completed'].includes(booking.status)
      );

      const confirmedRevenue = confirmedBookings.reduce((sum, booking) => {
        const price = parseFloat(booking.price) || 0;
        return sum + price;
      }, 0);

      // Вычитаем выводы из подтвержденного дохода
      const withdrawals = transactions
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const actualBalance = Math.max(0, confirmedRevenue - withdrawals);

      console.log('Расчет реального баланса:', {
        confirmedBookingsCount: confirmedBookings.length,
        confirmedRevenue,
        withdrawals,
        actualBalance
      });

      // Обогащаем обычные транзакции информацией о клиентах
      const enrichedTransactions = transactions.map(transaction => {
        if ((transaction.type === 'payment' || transaction.type === 'income') && transaction.booking_id) {
          const relatedBooking = bookings.find(b => b.id === transaction.booking_id);
          if (relatedBooking) {
            return {
              ...transaction,
              description: `Оплата занятия "${relatedBooking.class_name}" клиентом ${relatedBooking.first_name} ${relatedBooking.last_name}`,
              client_name: `${relatedBooking.first_name} ${relatedBooking.last_name}`,
              class_name: relatedBooking.class_name
            };
          }
        }
        return transaction;
      });

      // Добавляем возвраты для отмененных бронирований
      const cancelledBookings = bookings.filter(booking => 
        booking.status === 'cancelled_by_club' || 
        (booking.status === 'cancelled' && booking.cancelled_by === 'club')
      );

      console.log('Найдено отмененных администрацией бронирований:', cancelledBookings.length);

      // Создаем транзакции возврата для отмененных бронирований
      const refundTransactions = cancelledBookings.map(booking => ({
        id: `refund_${booking.id}`,
        type: 'refund',
        amount: -(parseFloat(booking.price) || 0),
        description: `Возврат за отмененное занятие "${booking.class_name}" клиентом ${booking.first_name} ${booking.last_name}`,
        created_at: booking.cancelled_at || booking.updated_at || booking.created_at,
        booking_id: booking.id,
        client_name: `${booking.first_name} ${booking.last_name}`,
        class_name: booking.class_name,
        cancellation_reason: booking.cancellation_reason || 'Отменено администрацией клуба'
      }));

      // Объединяем обогащенные транзакции с возвратами
      const combinedTransactions = [
        ...enrichedTransactions,
        ...refundTransactions
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      console.log('Объединенные транзакции:', {
        originalTransactions: transactions.length,
        refundTransactions: refundTransactions.length,
        combined: combinedTransactions.length
      });

      // РАСШИРЕННАЯ статистика за месяц
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Все бронирования за месяц
      const monthlyBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.created_at);
        return bookingDate >= monthStart;
      });

      // Подтвержденные бронирования за месяц
      const monthlyConfirmedBookings = monthlyBookings.filter(booking => 
        ['confirmed', 'completed'].includes(booking.status)
      );

      // Отмененные бронирования за месяц
      const monthlyCancelledBookings = monthlyBookings.filter(booking => 
        booking.status === 'cancelled_by_club' || 
        (booking.status === 'cancelled' && booking.cancelled_by === 'club')
      );

      console.log('Месячная статистика бронирований:', {
        total: monthlyBookings.length,
        confirmed: monthlyConfirmedBookings.length,
        cancelled: monthlyCancelledBookings.length
      });

      // Рассчитываем статистику
      const monthlyRevenue = monthlyConfirmedBookings.reduce((sum, booking) => {
        const price = parseFloat(booking.price) || 0;
        return sum + price;
      }, 0);

      const monthlyRefunds = monthlyCancelledBookings.reduce((sum, booking) => {
        const price = parseFloat(booking.price) || 0;
        return sum + price;
      }, 0);
      
      const monthlyBookingsCount = monthlyConfirmedBookings.length;
      const averagePrice = monthlyBookingsCount > 0 ? monthlyRevenue / monthlyBookingsCount : 0;

      console.log('Рассчитанная месячная статистика:', {
        monthlyRevenue,
        monthlyBookingsCount,
        averagePrice,
        monthlyRefunds,
        monthlyCancelledCount: monthlyCancelledBookings.length
      });

      setFinanceData({
        actualBalance,
        transactions,
        bookings,
        combinedTransactions,
        monthlyStats: {
          revenue: monthlyRevenue,
          bookings: monthlyBookingsCount,
          averagePrice,
          completedBookings: monthlyConfirmedBookings.length,
          cancelledBookings: monthlyCancelledBookings.length,
          refunds: monthlyRefunds
        }
      });

    } catch (error) {
      console.error('Ошибка загрузки финансовых данных:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const getTransactionTypeLabel = (type) => {
    const types = {
      'income': 'Доход',
      'payment': 'Оплачено',
      'withdrawal': 'Вывод',
      'refund': 'Возврат'
    };
    return types[type] || type;
  };

  const getTransactionTypeClass = (type) => {
    const classes = {
      'income': 'transaction-income',
      'payment': 'transaction-income',
      'withdrawal': 'transaction-withdrawal',
      'refund': 'transaction-refund'
    };
    return classes[type] || '';
  };

  const formatTransactionAmount = (transaction) => {
    const amount = Math.abs(transaction.amount);
    if (transaction.type === 'income' || transaction.type === 'payment') {
      return `+${formatNumber(amount)}₽`;
    } else {
      return `-${formatNumber(amount)}₽`;
    }
  };

  const getTransactionDescription = (transaction) => {
    // Для возвратов показываем описание + причина
    if (transaction.type === 'refund' && transaction.cancellation_reason) {
      return (
        <div>
          <div style={{ marginBottom: '4px' }}>{transaction.description}</div>
          <small style={{ color: '#64748B', fontStyle: 'italic' }}>
            Причина отмены: {transaction.cancellation_reason}
          </small>
        </div>
      );
    }
    
    return transaction.description || 'Операция';
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
      <div className="club-finances-page">
        <div className="page-header">
          <h1>Финансовая статистика</h1>
          <p>Отчет о доходах и операциях за текущий месяц</p>
        </div>

        {dataLoading ? (
          <div className="loading-placeholder">
            <div className="loading-spinner"></div>
            <p>Загрузка финансовых данных...</p>
          </div>
        ) : (
          <div className="finances-content">
            {/* Расширенная статистика за месяц */}
            <div className="finance-stats">
              <div className="monthly-stats-expanded">
                <h3>Статистика за текущий месяц</h3>
                <div className="stats-grid-expanded">
                  <div className="stat-item-large revenue">
                    <div className="stat-content">
                      <span className="stat-label">Доход</span>
                      <span className="stat-value-large">
                        {formatNumber(financeData.monthlyStats.revenue)}₽
                      </span>
                    </div>
                  </div>

                  <div className="stat-item-large bookings">
                    <div className="stat-content">
                      <span className="stat-label">Записей</span>
                      <span className="stat-value-large">
                        {financeData.monthlyStats.bookings}
                      </span>
                    </div>
                  </div>

                  <div className="stat-item-large average">
                    <div className="stat-content">
                      <span className="stat-label">Средняя цена</span>
                      <span className="stat-value-large">
                        {formatNumber(financeData.monthlyStats.averagePrice)}₽
                      </span>
                    </div>
                  </div>

                  <div className="stat-item-large cancelled">
                    <div className="stat-content">
                      <span className="stat-label">Отменено</span>
                      <span className="stat-value-large">
                        {financeData.monthlyStats.cancelledBookings}
                      </span>
                    </div>
                  </div>

                  <div className="stat-item-large refunds">
                    <div className="stat-content">
                      <span className="stat-label">Возвраты</span>
                      <span className="stat-value-large">
                        {formatNumber(financeData.monthlyStats.refunds)}₽
                      </span>
                    </div>
                  </div>

                  <div className="stat-item-large net">
                    <div className="stat-content">
                      <span className="stat-label">Чистый доход</span>
                      <span className="stat-value-large">
                        {formatNumber(financeData.monthlyStats.revenue - financeData.monthlyStats.refunds)}₽
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* История транзакций */}
            <div className="transactions-section">
              <h3>История операций</h3>
              
              {financeData.combinedTransactions.length === 0 ? (
                <div className="empty-transactions">
                  <div className="empty-icon"></div>
                  <h4>Нет операций</h4>
                  <p>История финансовых операций появится здесь</p>
                </div>
              ) : (
                <div className="transactions-table">
                  <div className="table-header">
                    <span>Дата</span>
                    <span>Тип</span>
                    <span>Описание</span>
                    <span>Сумма</span>
                  </div>
                  
                  <div className="table-body">
                    {financeData.combinedTransactions.map(transaction => (
                      <div key={transaction.id} className="table-row">
                        <div className="transaction-date">
                          {new Date(transaction.created_at).toLocaleDateString('ru-RU')}
                          <span className="transaction-time">
                            {new Date(transaction.created_at).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        <div className="transaction-type">
                          <span className={`type-badge ${getTransactionTypeClass(transaction.type)}`}>
                            {getTransactionTypeLabel(transaction.type)}
                          </span>
                        </div>
                        
                        <div className="transaction-description">
                          {getTransactionDescription(transaction)}
                        </div>
                        
                        <div className={`transaction-amount ${getTransactionTypeClass(transaction.type)}`}>
                          {formatTransactionAmount(transaction)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Информационная секция */}
            <div className="info-section">
              <h4>О финансовой отчетности</h4>
              <ul>
                <li>Статистика обновляется в реальном времени</li>
                <li>Учитываются только подтвержденные и завершенные записи</li>
                <li>Отмененные записи показаны как возвраты</li>
                <li>Данные доступны за текущий календарный месяц</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </ClubLayout>
  );
};

export default ClubFinancesPage;