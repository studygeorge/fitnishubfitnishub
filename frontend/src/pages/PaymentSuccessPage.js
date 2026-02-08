import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking');
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

        await new Promise(resolve => setTimeout(resolve, 2000));

        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/balance/payment/check/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('📊 Ответ от API:', data);

        if (data.status === 'completed') {
          setStatus('success');
          setPaymentInfo(data);
        } else if (data.status === 'failed') {
          setStatus('failed');
          setPaymentInfo(data);
        } else {
          setStatus('checking');
          setPaymentInfo(data);
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
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          {/* Animated loader with orange accent */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FF6933] animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Проверяем статус платежа
          </h2>
          <p className="text-gray-500">
            Пожалуйста, подождите...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[28px] shadow-xl p-8 max-w-md w-full border border-gray-100">
          <div className="text-center mb-6">
            {/* Success icon with orange gradient */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full opacity-20 blur-xl"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-[#FF6933] to-[#FFA726] rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Оплата успешна!
            </h1>
            <p className="text-gray-600">
              Ваш баланс успешно пополнен
            </p>
          </div>

          {paymentInfo && (
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-[20px] p-6 mb-6 border border-orange-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600 font-medium">Сумма пополнения:</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-[#FF6933] to-[#FFA726] bg-clip-text text-transparent">
                  {paymentInfo.amount} ₽
                </span>
              </div>
              <div className="pt-3 border-t border-orange-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">ID платежа:</span>
                  <span className="text-gray-700 font-mono text-xs">
                    {paymentInfo.orderId?.substring(0, 20)}...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoToBalance}
              className="w-full bg-gradient-to-r from-[#FF6933] to-[#FFA726] text-white py-4 rounded-[20px] hover:shadow-lg transition-all duration-300 font-semibold text-lg"
            >
              Перейти к балансу
            </button>
            <button
              onClick={handleGoHome}
              className="w-full bg-gray-100 text-gray-700 py-4 rounded-[20px] hover:bg-gray-200 transition-all duration-300 font-medium"
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
      <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[28px] shadow-xl p-8 max-w-md w-full border border-gray-100">
          <div className="text-center mb-6">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-red-200 rounded-full opacity-20 blur-xl"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Оплата не прошла
            </h1>
            <p className="text-gray-600">
              Платеж был отклонен или отменен
            </p>
          </div>

          {paymentInfo && (
            <div className="bg-gray-50 rounded-[20px] p-4 mb-6 border border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Сумма:</span>
                <span className="text-lg font-semibold text-gray-800">
                  {paymentInfo.amount} ₽
                </span>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border-l-4 border-[#FFA726] rounded-r-[15px] p-4 mb-6">
            <p className="text-sm text-gray-700">
              💡 Деньги не были списаны с вашего счета
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoToBalance}
              className="w-full bg-gradient-to-r from-[#FF6933] to-[#FFA726] text-white py-4 rounded-[20px] hover:shadow-lg transition-all duration-300 font-semibold"
            >
              Попробовать снова
            </button>
            <button
              onClick={handleGoHome}
              className="w-full bg-gray-100 text-gray-700 py-4 rounded-[20px] hover:bg-gray-200 transition-all duration-300 font-medium"
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
    <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] shadow-xl p-8 max-w-md w-full border border-gray-100">
        <div className="text-center mb-6">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-yellow-200 rounded-full opacity-20 blur-xl"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-[#FFA726] to-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
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
            className="w-full bg-gradient-to-r from-[#FF6933] to-[#FFA726] text-white py-4 rounded-[20px] hover:shadow-lg transition-all duration-300 font-semibold"
          >
            К балансу
          </button>
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-100 text-gray-700 py-4 rounded-[20px] hover:bg-gray-200 transition-all duration-300 font-medium"
          >
            На главную
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
