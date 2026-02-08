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
        <div className="text-center max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-lg p-12">
          {/* Animated loader with orange accent */}
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FF6B35] animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-3">
            Проверяем статус платежа
          </h2>
          <p className="text-[#666666] text-base">
            Пожалуйста, подождите...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-10 max-w-lg w-full">
          <div className="text-center mb-8">
            {/* Success icon with orange gradient - like BalancePage */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-md" 
                   style={{background: 'linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%)'}}>
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-[#1a1a1a] mb-3">
              Оплата успешна!
            </h1>
            <p className="text-[#666666] text-base">
              Ваш баланс успешно пополнен
            </p>
          </div>

          {paymentInfo && (
            <div className="bg-[#FFF9F7] rounded-xl p-6 mb-8 border border-[#f0f1f3]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[#666666] font-semibold text-base">Сумма пополнения:</span>
                <span className="text-3xl font-extrabold text-[#FF6B35]">
                  {paymentInfo.amount} ₽
                </span>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#999999]">ID платежа:</span>
                  <span className="text-[#666666] font-mono text-xs">
                    {paymentInfo.orderId?.substring(0, 20)}...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoToBalance}
              className="w-full text-white py-4 px-6 rounded-xl hover:shadow-xl transition-all duration-300 font-bold text-base"
              style={{background: 'linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%)'}}
            >
              Перейти к балансу
            </button>
            <button
              onClick={handleGoHome}
              className="w-full bg-white border-2 border-gray-200 text-[#666666] py-4 px-6 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold text-base"
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
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-10 max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-md bg-red-500">
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-[#1a1a1a] mb-3">
              Оплата не прошла
            </h1>
            <p className="text-[#666666] text-base">
              Платеж был отклонен или отменен
            </p>
          </div>

          {paymentInfo && (
            <div className="bg-[#FFF9F7] rounded-xl p-5 mb-6 border border-[#f0f1f3]">
              <div className="flex justify-between items-center">
                <span className="text-[#666666] font-medium">Сумма:</span>
                <span className="text-xl font-bold text-[#1a1a1a]">
                  {paymentInfo.amount} ₽
                </span>
              </div>
            </div>
          )}

          <div className="bg-[#FFF9F7] border-l-4 border-[#FF6B35] rounded-r-xl p-5 mb-8">
            <p className="text-sm text-[#666666]">
              💡 Деньги не были списаны с вашего счета
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoToBalance}
              className="w-full text-white py-4 px-6 rounded-xl hover:shadow-xl transition-all duration-300 font-bold text-base"
              style={{background: 'linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%)'}}
            >
              Попробовать снова
            </button>
            <button
              onClick={handleGoHome}
              className="w-full bg-white border-2 border-gray-200 text-[#666666] py-4 px-6 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold text-base"
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-10 max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-md bg-amber-500">
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-3">
            Ошибка
          </h1>
          <p className="text-[#666666] text-base">
            {error || 'Не удалось проверить статус платежа'}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoToBalance}
            className="w-full text-white py-4 px-6 rounded-xl hover:shadow-xl transition-all duration-300 font-bold text-base"
            style={{background: 'linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%)'}}
          >
            К балансу
          </button>
          <button
            onClick={handleGoHome}
            className="w-full bg-white border-2 border-gray-200 text-[#666666] py-4 px-6 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold text-base"
          >
            На главную
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
