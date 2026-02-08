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
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] shadow-xl p-8 max-w-md w-full border border-gray-100">
        <div className="text-center mb-6">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-red-200 rounded-full opacity-20 blur-xl"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-[#FF6933] to-[#DC2626] rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Оплата отменена
          </h1>
          <p className="text-gray-600">
            Платеж был отменен или произошла ошибка
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-l-4 border-[#FFA726] rounded-r-[15px] p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-[#FF6933]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-700 font-medium">
                Деньги не были списаны с вашего счета
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoToBalance}
            className="w-full bg-gradient-to-r from-[#FF6933] to-[#FFA726] text-white py-4 rounded-[20px] hover:shadow-lg transition-all duration-300 font-semibold text-lg"
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
};

export default PaymentFailedPage;
