// src/services/api.js

// Базовый URL API
const API_BASE_URL = '/api';

// Обработка сетевых ошибок
const handleNetworkError = (error) => {
  console.error('Сетевая ошибка:', error);
  
  if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
    throw new Error('Сервер недоступен. Проверьте подключение к интернету.');
  }
  
  if (error.name === 'AbortError') {
    throw new Error('Запрос прерван по таймауту');
  }
  
  throw error;
};

// Улучшенная функция для обработки ответов от API
const handleResponse = async (response) => {
  try {
    console.log('Обработка ответа сервера:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });
    
    // Проверка на HTML ответ вместо JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      const text = await response.text();
      console.error('Получен HTML вместо JSON:', text.substring(0, 500));
      throw new Error(`Сервер вернул HTML вместо JSON. Статус: ${response.status}`);
    }
    
    let data;
    try {
      const responseText = await response.text();
      console.log('Текст ответа сервера:', responseText);
      
      if (responseText) {
        data = JSON.parse(responseText);
      } else {
        data = {};
      }
    } catch (parseError) {
      console.error('Ошибка парсинга JSON:', parseError);
      throw new Error(`Некорректный формат ответа сервера: ${parseError.message}`);
    }
    
    if (!response.ok) {
      const errorMessage = data.error || data.message || data.details || `Ошибка: ${response.status} ${response.statusText}`;
      console.error('Ошибка от сервера:', {
        status: response.status,
        message: errorMessage,
        data: data
      });
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Некорректный формат ответа сервера: ${error.message}`);
    }
    throw error;
  }
};

// Создание fetch с таймаутом
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Функции для получения заголовков авторизации
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const getClubAuthHeader = () => {
  const token = localStorage.getItem('clubToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const getAdminAuthHeader = () => {
  const token = localStorage.getItem('adminToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Объект с методами для работы с API
const api = {
  // Аутентификация
  auth: {
    login: async (credentials) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });
      return handleResponse(response);
    },

    register: async (userData) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      return handleResponse(response);
    },

    logout: async () => {
      localStorage.removeItem('token');
      return { success: true };
    },

    getCurrentUser: async () => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/me`, {
        headers: {
          ...getAuthHeader()
        }
      });
      return handleResponse(response);
    },

    clubLogin: async (credentials) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/club/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });
      return handleResponse(response);
    },
    
    clubLogout: async () => {
      localStorage.removeItem('token');
      localStorage.removeItem('clubToken');
      localStorage.removeItem('clubId');
      localStorage.removeItem('isClubOwner');
      return { success: true };
    },
  },

  // Клубы и студии
  clubs: {
    getAll: async (filters = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetchWithTimeout(`${API_BASE_URL}/clubs?${queryParams.toString()}`);
      return handleResponse(response);
    },

    getById: async (clubId) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/clubs/${clubId}`);
      return handleResponse(response);
    },

    uploadLogo: async (clubId, logoFile) => {
      const formData = new FormData();
      formData.append('logo', logoFile);
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/clubs/${clubId}/logo`, {
        method: 'POST',
        headers: {
          ...getClubAuthHeader()
        },
        body: formData
      });
      
      return handleResponse(response);
    },

    uploadBanner: async (clubId, bannerFile) => {
      const formData = new FormData();
      formData.append('banner', bannerFile);
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/clubs/${clubId}/banner`, {
        method: 'POST',
        headers: {
          ...getClubAuthHeader()
        },
        body: formData
      });
      
      return handleResponse(response);
    },

    uploadGalleryImages: async (clubId, imageFiles) => {
      const formData = new FormData();
      
      for (let i = 0; i < imageFiles.length; i++) {
        formData.append('gallery', imageFiles[i]);
      }
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/clubs/${clubId}/gallery`, {
        method: 'POST',
        headers: {
          ...getClubAuthHeader()
        },
        body: formData
      });
      
      return handleResponse(response);
    },
    
    deleteLogo: async (clubId) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/clubs/${clubId}/logo`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getClubAuthHeader()
        }
      });
      
      return handleResponse(response);
    },

    deleteBanner: async (clubId) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/clubs/${clubId}/banner`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getClubAuthHeader()
        }
      });
      
      return handleResponse(response);
    },

    deleteGalleryImage: async (clubId, imageIndex) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/clubs/${clubId}/gallery/${imageIndex}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getClubAuthHeader()
        }
      });
      
      return handleResponse(response);
    },

    update: async (clubId, clubData) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/clubs/${clubId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getClubAuthHeader()
        },
        body: JSON.stringify(clubData)
      });
      return handleResponse(response);
    },
    
    create: async (clubData) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/clubs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getClubAuthHeader()
        },
        body: JSON.stringify(clubData)
      });
      return handleResponse(response);
    },
    
    getStatistics: async (clubId) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/clubs/${clubId}/statistics`, {
        headers: {
          ...getClubAuthHeader()
        }
      });
      return handleResponse(response);
    },
    
    getOwnerClubs: async () => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/clubs/owner/my`, {
        headers: {
          ...getClubAuthHeader()
        }
      });
      return handleResponse(response);
    }
  },

  // Расписание занятий
  schedule: {
    getAll: async (filters = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetchWithTimeout(`${API_BASE_URL}/schedule?${queryParams.toString()}`);
      return handleResponse(response);
    },
    
    addClass: async (classData) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getClubAuthHeader()
        },
        body: JSON.stringify(classData)
      });
      return handleResponse(response);
    },
    
    updateClass: async (classId, classData) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/schedule/${classId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getClubAuthHeader()
        },
        body: JSON.stringify(classData)
      });
      return handleResponse(response);
    },
    
    deleteClass: async (classId) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/schedule/${classId}`, {
        method: 'DELETE',
        headers: {
          ...getClubAuthHeader()
        }
      });
      return handleResponse(response);
    },
    
    getById: async (classId) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/schedule/${classId}`);
      return handleResponse(response);
    },
    
    createFromTemplate: async (data) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/schedule/from-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getClubAuthHeader()
        },
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },
    
    createSeries: async (data) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/schedule/create-series`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getClubAuthHeader()
        },
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    }
  },

  // Бронирования и посещения
  bookings: {
    getUserBookings: async () => {
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/bookings/user`, {
          headers: {
            ...getAuthHeader()
          }
        });
        return handleResponse(response);
      } catch (error) {
        console.error('Ошибка при получении бронирований пользователя:', error);
        throw error;
      }
    },
    
    createBooking: async (bookingData) => {
      console.log('API: Создание бронирования с данными:', bookingData);
      
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify(bookingData)
        });
        
        console.log('API: Ответ сервера на создание бронирования - статус:', response.status);
        
        const result = await handleResponse(response);
        console.log('API: Обработанный результат:', result);
        
        return result;
      } catch (error) {
        console.error('API: Детальная ошибка при создании бронирования:', error);
        
        if (error.message) {
          const errorMsg = error.message.toLowerCase();
          
          if (errorMsg.includes('duplicate key') || 
              errorMsg.includes('23505') || 
              errorMsg.includes('bookings_user_id_schedule_id_key') ||
              errorMsg.includes('already exists')) {
            console.log('API: Обнаружена ошибка дублирования записи');
            throw new Error('УЖЕ_ЗАПИСАНЫ');
          }
          
          if (errorMsg.includes('constraint') || errorMsg.includes('violates')) {
            console.log('API: Обнаружена ошибка ограничений БД');
            throw new Error('УЖЕ_ЗАПИСАНЫ');
          }
          
          if (errorMsg.includes('time') || 
              errorMsg.includes('expired') || 
              errorMsg.includes('прошло') ||
              errorMsg.includes('завершено')) {
            console.log('API: Обнаружена ошибка времени занятия');
            throw new Error('ЗАНЯТИЕ_ЗАВЕРШЕНО');
          }
          
          if (errorMsg.includes('balance') || 
              errorMsg.includes('insufficient') || 
              errorMsg.includes('баланс') ||
              errorMsg.includes('средств')) {
            console.log('API: Обнаружена ошибка баланса');
            throw new Error('НЕДОСТАТОЧНО_СРЕДСТВ');
          }
          
          if (errorMsg.includes('capacity') || 
              errorMsg.includes('full') || 
              errorMsg.includes('мест') ||
              errorMsg.includes('занято')) {
            console.log('API: Обнаружена ошибка отсутствия мест');
            throw new Error('НЕТ_МЕСТ');
          }
        }
        
        throw new Error(`Ошибка при создании бронирования: ${error.message}`);
      }
    },
    
    cancelBooking: async (bookingId) => {
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/bookings/${bookingId}`, {
          method: 'DELETE',
          headers: {
            ...getAuthHeader()
          }
        });
        return handleResponse(response);
      } catch (error) {
        console.error('Ошибка при отмене бронирования:', error);
        throw error;
      }
    },

    cancelBookingByClub: async (bookingId, reason = '') => {
      console.log('📡 API: Отправляем запрос на отмену бронирования клубом:', bookingId);
      console.log('📝 API: Причина отмены:', reason);
      
      try {
        const url = `${API_BASE_URL}/bookings/${bookingId}/club-cancel`;
        console.log('🌐 URL запроса:', url);
        
        const headers = {
          'Content-Type': 'application/json',
          ...getClubAuthHeader()
        };
        
        console.log('🔑 Заголовки:', headers);
        
        const body = JSON.stringify({ reason });
        console.log('📦 Тело запроса:', body);
        
        const response = await fetchWithTimeout(url, {
          method: 'DELETE',
          headers: headers,
          body: body
        });
        
        console.log('📥 Ответ сервера (статус):', response.status);
        
        const result = await handleResponse(response);
        console.log('📦 Обработанный результат:', result);
        
        return result;
      } catch (error) {
        console.error('❌ API: Ошибка при отмене бронирования клубом:', error);
        throw error;
      }
    },
    
    getVisitHistory: async () => {
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/bookings/history`, {
          headers: {
            ...getAuthHeader()
          }
        });
        return handleResponse(response);
      } catch (error) {
        console.error('Ошибка при получении истории посещений:', error);
        throw error;
      }
    },
    
    addRating: async (bookingId, rating, feedback) => {
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/bookings/${bookingId}/rating`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify({ rating, feedback })
        });
        return handleResponse(response);
      } catch (error) {
        console.error('Ошибка при добавлении рейтинга:', error);
        throw error;
      }
    },
    
    getClubBookings: async (clubId) => {
      console.log('📡 API: Получаем бронирования клуба:', clubId);
      
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/bookings/club/${clubId}`, {
          headers: {
            ...getClubAuthHeader()
          }
        });
        return handleResponse(response);
      } catch (error) {
        console.error('Ошибка при получении бронирований клуба:', error);
        throw error;
      }
    },
    
    completeBooking: async (bookingId) => {
      console.log('📡 API: Завершаем бронирование:', bookingId);
      
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/bookings/${bookingId}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getClubAuthHeader()
          }
        });
        return handleResponse(response);
      } catch (error) {
        console.error('Ошибка при завершении бронирования:', error);
        throw error;
      }
    }
  },

  // Управление балансом
  balance: {
    getUserBalance: async () => {
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/balance`, {
          headers: {
            ...getAuthHeader()
          }
        });
        return handleResponse(response);
      } catch (error) {
        console.error('❌ Ошибка получения баланса:', error);
        throw error;
      }
    },
    
    deductFunds: async (amount, description = 'Оплата занятия') => {
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/balance/deduct`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify({ amount, description })
        });
        return handleResponse(response);
      } catch (error) {
        console.error('❌ Ошибка списания средств:', error);
        throw error;
      }
    },
    
    // ИСПРАВЛЕНО: Создание платежа через Alfa-Bank (убрали paymentMethod)
    addFunds: async (amount) => {
      try {
        console.log('💳 API: Создаем платеж Alfa-Bank:', { amount });
        
        const response = await fetchWithTimeout(`${API_BASE_URL}/balance/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify({ amount })
        });
        
        const result = await handleResponse(response);
        
        console.log('📋 API: Результат создания платежа:', {
          success: result.success,
          orderId: result.orderId,
          alfabankOrderId: result.alfabankOrderId,
          hasPaymentUrl: !!result.paymentUrl
        });
        
        return result;
      } catch (error) {
        console.error('❌ API: Ошибка создания платежа:', error);
        throw error;
      }
    },
    
    checkPaymentStatus: async (orderId) => {
      try {
        console.log('🔍 API: Проверяем статус платежа:', orderId);
        
        const response = await fetchWithTimeout(`${API_BASE_URL}/balance/payment/status/${orderId}`, {
          headers: {
            ...getAuthHeader()
          }
        });
        
        const result = await handleResponse(response);
        
        console.log('📊 API: Статус платежа получен:', {
          orderId: result.orderId,
          status: result.status,
          amount: result.amount
        });
        
        return result;
      } catch (error) {
        console.error('❌ API: Ошибка получения статуса платежа:', error);
        throw error;
      }
    },
    
    getTransactionHistory: async () => {
      try {
        console.log('📊 API: Загружаем историю транзакций');
        
        const response = await fetchWithTimeout(`${API_BASE_URL}/balance/history`, {
          headers: {
            ...getAuthHeader()
          }
        });
        
        const result = await handleResponse(response);
        
        console.log('✅ API: История транзакций загружена, записей:', result.length);
        
        return result;
      } catch (error) {
        console.error('❌ API: Ошибка получения истории транзакций:', error);
        throw error;
      }
    },
    
    withdrawFunds: async (clubId, amount) => {
      try {
        console.log('💰 API: Запрос на вывод средств клуба:', { clubId, amount });
        
        const response = await fetchWithTimeout(`${API_BASE_URL}/balance/withdraw`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getClubAuthHeader()
          },
          body: JSON.stringify({ clubId, amount })
        });
        
        const result = await handleResponse(response);
        
        console.log('✅ API: Средства выведены успешно');
        
        return result;
      } catch (error) {
        console.error('❌ API: Ошибка вывода средств:', error);
        throw error;
      }
    },
    
    getClubBalance: async (clubId) => {
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/clubs/${clubId}/balance`, {
          headers: {
            ...getClubAuthHeader()
          }
        });
        return handleResponse(response);
      } catch (error) {
        console.error('❌ API: Ошибка получения баланса клуба:', error);
        throw error;
      }
    },
    
    getClubTransactions: async (clubId) => {
      try {
        console.log('📊 API: Загружаем транзакции клуба:', clubId);
        
        const response = await fetchWithTimeout(`${API_BASE_URL}/balance/club/${clubId}/history`, {
          headers: {
            ...getClubAuthHeader()
          }
        });
        
        const result = await handleResponse(response);
        
        console.log('✅ API: Транзакции клуба загружены, записей:', result.length);
        
        return result;
      } catch (error) {
        console.error('❌ API: Ошибка получения транзакций клуба:', error);
        throw error;
      }
    },
  
    getPaymentDetails: async (orderId) => {
      try {
        console.log('🔍 API: Получаем детали платежа:', orderId);
        
        const response = await fetchWithTimeout(`${API_BASE_URL}/balance/payment/${orderId}`, {
          headers: {
            ...getAuthHeader()
          }
        });
        
        return handleResponse(response);
      } catch (error) {
        console.error('❌ API: Ошибка получения деталей платежа:', error);
        throw error;
      }
    },
  
    cancelPayment: async (orderId) => {
      try {
        console.log('❌ API: Отменяем платеж:', orderId);
        
        const response = await fetchWithTimeout(`${API_BASE_URL}/balance/payment/${orderId}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          }
        });
        
        return handleResponse(response);
      } catch (error) {
        console.error('❌ API: Ошибка отмены платежа:', error);
        throw error;
      }
    },
  
    getPaymentStats: async () => {
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/balance/stats`, {
          headers: {
            ...getAuthHeader()
          }
        });
        return handleResponse(response);
      } catch (error) {
        console.error('❌ API: Ошибка получения статистики платежей:', error);
        throw error;
      }
    },
  
    getPendingPayments: async () => {
      try {
        console.log('⏳ API: Получаем ожидающие платежи');
        
        const response = await fetchWithTimeout(`${API_BASE_URL}/balance/payments/pending`, {
          headers: {
            ...getAuthHeader()
          }
        });
        
        return handleResponse(response);
      } catch (error) {
        console.error('❌ API: Ошибка получения ожидающих платежей:', error);
        throw error;
      }
    },
  
    validateTopUp: async (amount) => {
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/balance/validate-topup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify({ amount })
        });
        
        return handleResponse(response);
      } catch (error) {
        console.error('❌ API: Ошибка валидации пополнения:', error);
        throw error;
      }
    },
  
    getLimits: async () => {
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/balance/limits`, {
          headers: {
            ...getAuthHeader()
          }
        });
        return handleResponse(response);
      } catch (error) {
        console.error('❌ API: Ошибка получения лимитов:', error);
        throw error;
      }
    }
  },

  // Пользователи
  users: {
    getProfile: async () => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/users/profile`, {
        headers: {
          ...getAuthHeader()
        }
      });
      return handleResponse(response);
    },
    
    updateProfile: async (userData) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(userData)
      });
      return handleResponse(response);
    },
    
    updatePassword: async (passwordData) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/users/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(passwordData)
      });
      return handleResponse(response);
    },
    
    updatePreferences: async (preferences) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/users/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ preferences })
      });
      return handleResponse(response);
    },
  
    uploadAvatar: async (avatarFile) => {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/users/upload-avatar`, {
        method: 'POST',
        headers: {
          ...getAuthHeader()
        },
        body: formData
      });
      return handleResponse(response);
    },
  
    deleteAvatar: async () => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/users/delete-avatar`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeader()
        }
      });
      return handleResponse(response);
    },
  
    getAvatar: async (userId = null) => {
      const url = userId 
        ? `${API_BASE_URL}/users/avatar/${userId}`
        : `${API_BASE_URL}/users/avatar`;
        
      const response = await fetchWithTimeout(url, {
        headers: userId ? {} : { ...getAuthHeader() }
      });
      return handleResponse(response);
    }
  },
  
  // Шаблоны занятий
  templates: {
    getAll: async (clubId) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/templates/club/${clubId}`, {
        headers: {
          ...getClubAuthHeader()
        }
      });
      return handleResponse(response);
    },
    
    getById: async (id) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/templates/${id}`, {
        headers: {
          ...getClubAuthHeader()
        }
      });
      return handleResponse(response);
    },
    
    create: async (templateData) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getClubAuthHeader()
        },
        body: JSON.stringify(templateData)
      });
      return handleResponse(response);
    },
    
    update: async (id, templateData) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getClubAuthHeader()
        },
        body: JSON.stringify(templateData)
      });
      return handleResponse(response);
    },
    
    delete: async (id) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/templates/${id}`, {
        method: 'DELETE',
        headers: {
          ...getClubAuthHeader()
        }
      });
      return handleResponse(response);
    }
  },

  // TELEGRAM
  telegram: {
    generateCode: async () => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/telegram/generate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getClubAuthHeader()
        }
      });
      return handleResponse(response);
    },

    getStatus: async () => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/telegram/status`, {
        headers: {
          ...getClubAuthHeader()
        }
      });
      return handleResponse(response);
    },

    disconnect: async () => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/telegram/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getClubAuthHeader()
        }
      });
      return handleResponse(response);
    },

    regenerateCode: async () => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/telegram/regenerate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getClubAuthHeader()
        }
      });
      return handleResponse(response);
    },

    getBotStatus: async () => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/telegram/bot-status`);
      return handleResponse(response);
    },

    user: {
      generateCode: async () => {
        const response = await fetchWithTimeout(`${API_BASE_URL}/telegram/user/generate-code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          }
        });
        return handleResponse(response);
      },

      getStatus: async () => {
        const response = await fetchWithTimeout(`${API_BASE_URL}/telegram/user/status`, {
          headers: {
            ...getAuthHeader()
          }
        });
        return handleResponse(response);
      },

      checkLinking: async (code) => {
        const response = await fetchWithTimeout(`${API_BASE_URL}/telegram/user/check-linking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify({ code })
        });
        return handleResponse(response);
      },

      unlink: async () => {
        const response = await fetchWithTimeout(`${API_BASE_URL}/telegram/user/unlink`, {
          method: 'DELETE',
          headers: {
            ...getAuthHeader()
          }
        });
        return handleResponse(response);
      }
    }
  },
  
  // Администрирование
  admin: {
    login: async (credentials) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });
      return handleResponse(response);
    },
    
    logout: async () => {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('isAdmin');
      return { success: true };
    },
    
    getClubRequests: async () => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/club-requests`, {
        headers: {
          ...getAdminAuthHeader()
        }
      });
      return handleResponse(response);
    },
    
    deleteClub: async (clubId) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/clubs/${clubId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader()
        }
      });
      return handleResponse(response);
    },
    
    approveClubRequest: async (requestId) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/club-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader()
        }
      });
      return handleResponse(response);
    },
    
    rejectClubRequest: async (requestId, reason) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/club-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader()
        },
        body: JSON.stringify({ reason })
      });
      return handleResponse(response);
    },
    
    getAllClubs: async () => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/clubs`, {
        headers: {
          ...getAdminAuthHeader()
        }
      });
      return handleResponse(response);
    },
    
    registerClub: async (clubData) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/clubs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader()
        },
        body: JSON.stringify(clubData)
      });
      return handleResponse(response);
    },
    
    updateClubStatus: async (clubId, status) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/clubs/${clubId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader()
        },
        body: JSON.stringify({ status })
      });
      return handleResponse(response);
    },
    
    getAllUsers: async () => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/users`, {
        headers: {
          ...getAdminAuthHeader()
        }
      });
      return handleResponse(response);
    },
  
    getStats: async () => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/stats`, {
        headers: {
          ...getAdminAuthHeader()
        }
      });
      return handleResponse(response);
    },
  
    getApplications: async () => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/applications`, {
        headers: {
          ...getAdminAuthHeader()
        }
      });
      return handleResponse(response);
    },
  
    updateApplicationStatus: async (applicationId, status) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader()
        },
        body: JSON.stringify({ status })
      });
      return handleResponse(response);
    },
  
    deleteUser: async (userId) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader()
        }
      });
      return handleResponse(response);
    },
  
    createUser: async (userData) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader()
        },
        body: JSON.stringify(userData)
      });
      return handleResponse(response);
    },
  
    getOwners: async () => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/owners`, {
        headers: {
          ...getAdminAuthHeader()
        }
      });
      return handleResponse(response);
    },

    // Получение информации о конкретном пользователе
    getUser: async (userId) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: {
          ...getAdminAuthHeader()
        }
      });
      return handleResponse(response);
    },

    // Обновление данных пользователя
    updateUser: async (userId, userData) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader()
        },
        body: JSON.stringify(userData)
      });
      return handleResponse(response);
    },

    // Смена пароля пользователя
    changeUserPassword: async (userId, password) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader()
        },
        body: JSON.stringify({ password })
      });
      return handleResponse(response);
    },

    // Получение детальной информации о клубе
    getClub: async (clubId) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/clubs/${clubId}`, {
        headers: {
          ...getAdminAuthHeader()
        }
      });
      return handleResponse(response);
    },
    
    // Обновление данных клуба
    updateClub: async (clubId, clubData) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/clubs/${clubId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader()
        },
        body: JSON.stringify(clubData)
      });
      return handleResponse(response);
    }
  }
};

export default api;
