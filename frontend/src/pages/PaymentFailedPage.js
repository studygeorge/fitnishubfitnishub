import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentFailedPage = () => {
  const navigate = useNavigate();

  const handleGoToBalance = () => {
    navigate('/balance');
  };

  const handleGoHome = () => {
    navigate('/');
  };

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
            Оплата отменена
          </h1>
          <p className="text-[#666666] text-base">
            Платеж был отменен или произошла ошибка
          </p>
        </div>

        <div className="bg-[#FFF9F7] border-l-4 border-[#FF6B35] rounded-r-xl p-5 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-[#FF6B35]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-[#666666] font-medium">
                Деньги не были списаны с вашего счета
              </p>
            </div>
          </div>
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
};

export default PaymentFailedPage;
