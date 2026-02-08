import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking'); // checking, success, failed, error
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const orderId = searchParams.get('orderId');
        
        if (!orderId) {
          setStatus('error');
          setError('ID заказа не найден');
          return;
        }

        console.log('🔍 Проверяем статус платежа:', orderId);

        // Извлекаем внутренний orderId из alfabank orderId
        // orderId от альфы: 01d29f47-a22a-7edf-9333-bf5702745c4b
        // Нужно найти платеж по alfabank_order_id
        
        // Даем время на обработку платежа
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Проверяем статус через API
        const response = await api.get(`/balance/payment/check/${orderId}`);
        
        console.log('📊 Ответ от API:', response.data);

        if (response.data.status === 'completed') {
          setStatus('success');
          setPaymentInfo(response.data);
        } else if (response.data.status === 'failed') {
          setStatus('failed');
          setPaymentInfo(response.data);
        } else {
          setStatus('checking');
          setPaymentInfo(response.data);
        }

      } catch (err) {
        console.error('❌ Ошибка проверки статуса:', err);
        setStatus('error');
        setError(err.response?.data?.error || 'Ошибка проверки статуса платежа');
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const handleGoToBalance = () => {
    navigate('/balance');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Проверяем статус платежа
          </h2>
          <p className="text-gray-600">
            Пожалуйста, подождите...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Оплата успешна!
            </h1>
            <p className="text-gray-600">
              Ваш баланс успешно пополнен
            </p>
          </div>

          {paymentInfo && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Сумма пополнения:</span>
                <span className="text-2xl font-bold text-green-600">
                  {paymentInfo.amount} ₽
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">ID платежа:</span>
                <span className="text-gray-700 font-mono text-xs">
                  {paymentInfo.orderId?.substring(0, 20)}...
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoToBalance}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Перейти к балансу
            </button>
            <button
              onClick={handleGoHome}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Оплата не прошла
            </h1>
            <p className="text-gray-600">
              Платеж был отклонен или отменен
            </p>
          </div>

          {paymentInfo && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Сумма:</span>
                <span className="text-lg font-semibold text-gray-800">
                  {paymentInfo.amount} ₽
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoToBalance}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Попробовать снова
            </button>
            <button
              onClick={handleGoHome}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Ошибка
          </h1>
          <p className="text-gray-600">
            {error || 'Не удалось проверить статус платежа'}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoToBalance}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            К балансу
          </button>
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            На главную
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
