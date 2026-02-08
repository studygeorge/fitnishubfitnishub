const axios = require('axios');

class AlfaBankService {
  constructor() {
    this.apiUrl = process.env.ALFABANK_API_URL;
    this.login = process.env.ALFABANK_LOGIN;
    this.password = process.env.ALFABANK_PASSWORD;
    this.returnUrl = process.env.ALFABANK_RETURN_URL;
    this.failUrl = process.env.ALFABANK_FAIL_URL;
    
    // ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ КОНФИГУРАЦИИ
    console.log('🏦 Инициализация Альфа-Банк сервиса:');
    console.log('  📍 API URL:', this.apiUrl);
    console.log('  👤 Login:', this.login);
    console.log('  🔑 Password:', this.password ? `***${this.password.slice(-4)}` : '❌ НЕ УСТАНОВЛЕН');
    console.log('  🔙 Return URL:', this.returnUrl);
    console.log('  ❌ Fail URL:', this.failUrl || 'не установлен');
    
    // ПРОВЕРКА КРИТИЧНЫХ ПАРАМЕТРОВ
    if (!this.apiUrl || !this.login || !this.password) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Не все параметры Альфа-Банк настроены!');
      console.error('Проверьте .env файл:', {
        ALFABANK_API_URL: !!this.apiUrl,
        ALFABANK_LOGIN: !!this.login,
        ALFABANK_PASSWORD: !!this.password,
        ALFABANK_RETURN_URL: !!this.returnUrl
      });
    }
  }

  async registerOrder(orderId, amount, description, email, phone) {
    try {
      console.log('📝 Регистрируем заказ в Альфа-Банк:', {
        orderId,
        amount: `${amount} ₽`,
        description,
        email,
        phone
      });

      // Конвертация в копейки (Альфа-Банк требует копейки)
      const amountInKopecks = Math.round(parseFloat(amount) * 100);
      
      console.log(`💰 Сумма: ${amount} ₽ → ${amountInKopecks} копеек`);

      const params = {
        userName: this.login,
        password: this.password,
        orderNumber: orderId,
        amount: amountInKopecks,
        returnUrl: this.returnUrl,
        description: description || 'Пополнение баланса FitnesHub',
        language: 'ru'
      };

      if (this.failUrl) {
        params.failUrl = this.failUrl;
      }

      if (email) {
        params.email = email;
      }

      if (phone) {
        params.phone = phone;
      }

      const endpoint = `${this.apiUrl}/register.do`;
      
      console.log('🌐 Отправляем запрос на:', endpoint);
      console.log('📦 Параметры запроса:', { 
        ...params, 
        password: `***${this.password.slice(-4)}` 
      });

      const response = await axios.get(endpoint, {
        params: params,
        timeout: 30000,
        headers: {
          'User-Agent': 'FitnesHub/1.0',
          'Accept': 'application/json'
        }
      });

      console.log('✅ Ответ от Альфа-Банк:', response.data);

      // ВАЖНО: errorCode приходит как строка!
      // '0' = успех, любое другое значение = ошибка
      if (response.data.errorCode && response.data.errorCode !== '0') {
        const errorMsg = response.data.errorMessage || 'Неизвестная ошибка';
        console.error('❌ Ошибка регистрации заказа:', {
          errorCode: response.data.errorCode,
          errorMessage: errorMsg
        });
        
        // Специфичные сообщения для разных ошибок
        if (response.data.errorCode === '5') {
          throw new Error('Доступ запрещён. Проверьте логин и пароль в настройках Альфа-Банк.');
        } else if (response.data.errorCode === '1') {
          throw new Error('Неверный формат запроса. Свяжитесь с поддержкой.');
        }
        
        throw new Error(errorMsg);
      }

      // Проверка обязательных полей в ответе
      if (!response.data.orderId || !response.data.formUrl) {
        console.error('❌ Некорректный ответ от Альфа-Банк (нет orderId или formUrl):', response.data);
        throw new Error('Некорректный ответ от платежной системы');
      }

      console.log('🎉 Платеж успешно зарегистрирован:', {
        alfabankOrderId: response.data.orderId,
        formUrl: response.data.formUrl.substring(0, 50) + '...'
      });

      return {
        success: true,
        orderId: response.data.orderId,
        formUrl: response.data.formUrl
      };

    } catch (error) {
      console.error('❌ Ошибка при регистрации заказа в Альфа-Банк:');
      console.error('  Сообщение:', error.message);
      
      if (error.response) {
        console.error('  HTTP статус:', error.response.status);
        console.error('  Ответ сервера:', error.response.data);
      }
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Не удалось подключиться к Альфа-Банк. Проверьте URL API.');
      }
      
      if (error.code === 'ETIMEDOUT') {
        throw new Error('Превышено время ожидания ответа от Альфа-Банк.');
      }

      // Если это наше кастомное сообщение - прокидываем как есть
      if (error.message.includes('Доступ запрещён') || 
          error.message.includes('Неверный формат')) {
        throw error;
      }

      throw new Error('Не удалось создать платеж. Попробуйте позже.');
    }
  }

  async getOrderStatus(alfabankOrderId) {
    try {
      console.log('🔍 Проверяем статус заказа в Альфа-Банк:', alfabankOrderId);

      const params = {
        userName: this.login,
        password: this.password,
        orderId: alfabankOrderId,
        language: 'ru'
      };

      const endpoint = `${this.apiUrl}/getOrderStatusExtended.do`;
      
      console.log('🌐 Запрос статуса:', endpoint);

      const response = await axios.get(endpoint, {
        params: params,
        timeout: 30000,
        headers: {
          'User-Agent': 'FitnesHub/1.0',
          'Accept': 'application/json'
        }
      });

      console.log('📊 Статус от Альфа-Банк:', response.data);

      // ВАЖНО: errorCode приходит как строка!
      // '0' = успех, любое другое значение = ошибка
      if (response.data.errorCode && response.data.errorCode !== '0') {
        console.error('❌ Ошибка получения статуса:', {
          errorCode: response.data.errorCode,
          errorMessage: response.data.errorMessage
        });
        return null;
      }

      return {
        orderNumber: response.data.orderNumber,
        orderStatus: response.data.orderStatus,
        amount: response.data.amount,
        currency: response.data.currency,
        date: response.data.date,
        ip: response.data.ip,
        cardAuthInfo: response.data.cardAuthInfo,
        bindingInfo: response.data.bindingInfo,
        merchantOrderParams: response.data.merchantOrderParams,
        attributes: response.data.attributes,
        paymentAmountInfo: response.data.paymentAmountInfo,
        bankInfo: response.data.bankInfo
      };

    } catch (error) {
      console.error('❌ Ошибка при проверке статуса заказа:', {
        message: error.message,
        response: error.response?.data
      });
      return null;
    }
  }

  getStatusText(orderStatus) {
    const statuses = {
      0: 'Заказ зарегистрирован, но не оплачен',
      1: 'Предавторизованная сумма захолдирована',
      2: 'Проведена полная авторизация суммы заказа',
      3: 'Авторизация отменена',
      4: 'По транзакции была проведена операция возврата',
      5: 'Инициирована авторизация через ACS банка-эмитента',
      6: 'Авторизация отклонена'
    };

    return statuses[orderStatus] || `Неизвестный статус (${orderStatus})`;
  }

  isSuccessfulPayment(orderStatus) {
    // Статус 2 = полная авторизация
    return orderStatus === 2;
  }

  isFailedPayment(orderStatus) {
    // Статусы 3, 6 = отменена или отклонена
    return orderStatus === 3 || orderStatus === 6;
  }

  isPendingPayment(orderStatus) {
    // Статусы 0, 1, 5 = в процессе
    return orderStatus === 0 || orderStatus === 1 || orderStatus === 5;
  }
}

module.exports = new AlfaBankService();
