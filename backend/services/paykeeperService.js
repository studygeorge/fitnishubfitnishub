const axios = require('axios');
const crypto = require('crypto');

class PayKeeperService {
  constructor() {
    this.serverUrl = process.env.PAYKEEPER_SERVER;
    this.login = process.env.PAYKEEPER_LOGIN;
    this.password = process.env.PAYKEEPER_PASSWORD;
    this.secret = process.env.PAYKEEPER_SECRET;
    
    if (!this.serverUrl || !this.login || !this.password || !this.secret) {
      throw new Error('PayKeeper credentials not configured');
    }
    
    // Создаем Base64 строку для Basic авторизации
    this.authHeader = Buffer.from(`${this.login}:${this.password}`).toString('base64');
    
    console.log('PayKeeper Service инициализирован:', this.serverUrl);
    console.log('Секретное слово настроено:', this.secret ? 'ДА' : 'НЕТ');
  }

  // Получение токена безопасности
  async getToken() {
    try {
      const response = await axios.get(`${this.serverUrl}/info/settings/token/`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${this.authHeader}`
        }
      });
      
      if (response.data && response.data.token) {
        console.log('PayKeeper токен получен:', response.data.token.substring(0, 10) + '...');
        return response.data.token;
      } else {
        throw new Error('Токен не получен от PayKeeper');
      }
    } catch (error) {
      console.error('Ошибка получения токена PayKeeper:', error.message);
      if (error.response) {
        console.error('Ответ сервера:', error.response.data);
      }
      throw new Error('Не удалось получить токен PayKeeper');
    }
  }

  // Создание платежа
  async createPayment(orderId, amount, description, userEmail, userPhone = null) {
    try {
      // Получаем токен
      const token = await this.getToken();

      // Подготавливаем параметры платежа согласно документации
      const paymentData = {
        pay_amount: parseFloat(amount),
        clientid: orderId,
        orderid: orderId,
        client_email: userEmail,
        service_name: description,
        token: token
      };

      // Добавляем телефон если есть
      if (userPhone) {
        paymentData.client_phone = userPhone;
      }

      console.log('Создаем платеж PayKeeper:', paymentData);

      // Формируем POST параметры как в документации
      const postData = new URLSearchParams();
      Object.keys(paymentData).forEach(key => {
        postData.append(key, paymentData[key]);
      });

      // Отправляем запрос на создание счета
      const response = await axios.post(
        `${this.serverUrl}/change/invoice/preview/`,
        postData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${this.authHeader}`
          }
        }
      );

      console.log('Ответ PayKeeper на создание счета:', response.data);

      if (response.data && response.data.invoice_id) {
        // Формируем ссылку на оплату согласно документации
        const paymentUrl = `${this.serverUrl}/bill/${response.data.invoice_id}/`;
        
        return {
          success: true,
          paymentUrl: paymentUrl,
          invoiceId: response.data.invoice_id,
          orderId: orderId
        };
      } else {
        throw new Error('Некорректный ответ от PayKeeper - отсутствует invoice_id');
      }

    } catch (error) {
      console.error('Ошибка создания платежа PayKeeper:', error.message);
      
      if (error.response) {
        console.error('Статус ответа:', error.response.status);
        console.error('Данные ответа:', error.response.data);
      }
      
      throw new Error(`Ошибка создания платежа: ${error.message}`);
    }
  }

  // ОБНОВЛЕННАЯ проверка подписи webhook с секретным словом PayKeeper
  verifyWebhookSignature(data, receivedSignature) {
    try {
      console.log('🔐 Проверяем подпись webhook PayKeeper');
      console.log('Данные:', data);
      console.log('Полученная подпись:', receivedSignature);
      
      // Создаем массив из всех значений кроме подписи
      const values = [];
      
      // Проходим по всем полям в алфавитном порядке и добавляем их значения
      const sortedKeys = Object.keys(data).sort();
      
      for (const key of sortedKeys) {
        // Исключаем все возможные поля подписи
        if (key !== 'sign' && key !== 'signature' && key !== 'key') {
          values.push(data[key]);
        }
      }
      
      // Добавляем секретное слово в конец
      values.push(this.secret);
      
      // Объединяем все значения
      const signString = values.join('');
      
      console.log('Строка для подписи:', signString);
      
      // Вычисляем MD5 хеш
      const calculatedSignature = crypto
        .createHash('md5')
        .update(signString, 'utf8')
        .digest('hex');
      
      console.log('Вычисленная подпись:', calculatedSignature);
      console.log('Подписи совпадают:', calculatedSignature === receivedSignature);
      
      return calculatedSignature === receivedSignature;
    } catch (error) {
      console.error('❌ Ошибка проверки подписи:', error);
      return false;
    }
  }
  

  // Получение статуса платежа по invoice_id
  async getPaymentStatus(invoiceId) {
    try {
      const response = await axios.get(
        `${this.serverUrl}/info/invoice/byid/?id=${invoiceId}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${this.authHeader}`
          }
        }
      );
  
      console.log('Статус платежа PayKeeper:', response.data);
      console.log('Тип response.data:', typeof response.data); // Добавить эту строку для отладки
  
      // Проверяем что response.data это объект, а не строка
      const responseData = typeof response.data === 'string' 
        ? JSON.parse(response.data) 
        : response.data;
  
      if (responseData && responseData.status) {
        return {
          status: responseData.status,
          invoiceId: invoiceId,
          data: responseData
        };
      } else {
        throw new Error('Не удалось получить статус платежа');
      }
    } catch (error) {
      console.error('Ошибка получения статуса платежа:', error.message);
      if (error.response) {
        console.error('Ответ сервера:', error.response.data);
      }
      throw error;
    }
  }
}

// Экспортируем singleton
module.exports = new PayKeeperService();