const express = require('express');
const router = express.Router();
const { 
  getUserBalance, 
  deductBalance
} = require('../models/userModel');
const { 
  createDeposit, 
  createWithdrawal, 
  getUserTransactions, 
  getClubTransactions,
  createPayment
} = require('../models/transactionModel');
const {
  createPayment: createPaymentRecord,
  updatePaymentStatus,
  getPaymentByOrderId,
  updateAlfabankData,
  getUserPayments
} = require('../models/paymentModel');
const { getClubsByOwnerId } = require('../models/clubModel');
const { findUserById } = require('../models/userModel');
const alfabankService = require('../services/alfabankService');
const auth = require('../middleware/auth');

// Получение баланса пользователя
router.get('/', auth, async (req, res) => {
  try {
    const balanceInfo = await getUserBalance(req.userId);
    res.json(balanceInfo);
  } catch (err) {
    console.error('❌ Ошибка загрузки баланса:', err);
    res.status(500).json({ error: 'Ошибка при загрузке баланса' });
  }
});

// Пополнение баланса через Альфа-Банк
router.post('/add', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0 || amount < 100) {
      return res.status(400).json({ error: 'Минимальная сумма пополнения - 100 ₽' });
    }

    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const orderId = `balance_${req.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('💳 Создаем платеж для пользователя:', {
      userId: req.userId,
      email: user.email,
      amount: amount,
      orderId: orderId
    });

    const paymentRecord = await createPaymentRecord(
      req.userId,
      amount,
      orderId,
      user.email,
      user.phone,
      `Пополнение баланса FitnesHub на ${amount} ₽`
    );

    console.log('📋 Создана запись о платеже:', {
      id: paymentRecord.id,
      orderId: paymentRecord.order_id,
      status: paymentRecord.status
    });

    try {
      const alfabankResult = await alfabankService.registerOrder(
        orderId,
        amount,
        `Пополнение баланса FitnesHub на ${amount} ₽`,
        user.email,
        user.phone
      );

      console.log('✅ Результат создания платежа Альфа-Банк:', {
        success: alfabankResult.success,
        orderId: alfabankResult.orderId,
        formUrl: alfabankResult.formUrl ? 'получена' : 'не получена'
      });

      if (alfabankResult.success) {
        await updateAlfabankData(
          orderId,
          alfabankResult.orderId,
          alfabankResult.formUrl
        );

        res.json({
          success: true,
          paymentUrl: alfabankResult.formUrl,
          orderId: orderId,
          alfabankOrderId: alfabankResult.orderId,
          amount: amount,
          message: 'Платеж создан успешно. Перенаправляем на оплату...'
        });
      } else {
        await updatePaymentStatus(orderId, 'failed');
        res.status(500).json({ error: 'Не удалось создать платеж в Альфа-Банк' });
      }

    } catch (alfabankError) {
      console.error('❌ Ошибка Альфа-Банк:', alfabankError);
      await updatePaymentStatus(orderId, 'failed', { error: alfabankError.message });
      res.status(500).json({ 
        error: 'Ошибка платежной системы. Попробуйте позже.',
        details: alfabankError.message 
      });
    }

  } catch (err) {
    console.error('❌ Общая ошибка при пополнении баланса:', err);
    res.status(500).json({ error: 'Ошибка при создании платежа' });
  }
});

// Callback от Альфа-Банк (не используется, для справки)
router.post('/webhook/alfabank', async (req, res) => {
  try {
    console.log('🔔 Получен callback от Альфа-Банк:', req.body);
    res.send('OK');
  } catch (err) {
    console.error('❌ Ошибка обработки callback:', err);
    res.status(500).send('Error');
  }
});

// Проверка статуса платежа по alfabank orderId (для страницы success/failed)
router.get('/payment/check/:alfabankOrderId', auth, async (req, res) => {
  try {
    const { alfabankOrderId } = req.params;
    
    console.log('🔍 Проверяем статус платежа по alfabankOrderId:', alfabankOrderId);
    
    const { getPaymentByAlfabankOrderId } = require('../models/paymentModel');
    const payment = await getPaymentByAlfabankOrderId(alfabankOrderId);
    
    if (!payment) {
      console.log('❌ Платеж не найден:', alfabankOrderId);
      return res.status(404).json({ error: 'Платеж не найден' });
    }
    
    if (payment.user_id !== req.userId) {
      console.log('❌ Нет доступа к платежу:', alfabankOrderId);
      return res.status(403).json({ error: 'Нет доступа к платежу' });
    }

    console.log('📋 Найден платеж:', {
      orderId: payment.order_id,
      status: payment.status,
      amount: payment.amount,
      alfabankOrderId: payment.alfabank_order_id
    });

    if (payment.status === 'completed') {
      return res.json({
        orderId: payment.order_id,
        status: 'completed',
        amount: payment.amount,
        createdAt: payment.created_at,
        completedAt: payment.completed_at,
        message: 'Оплата прошла успешно! Баланс пополнен.'
      });
    }

    // Проверяем статус в Альфа-Банк
    console.log('🔍 Проверяем статус в Альфа-Банк:', alfabankOrderId);
    
    const alfabankStatus = await alfabankService.getOrderStatus(alfabankOrderId);
    
    if (alfabankStatus) {
      console.log('📊 Статус от Альфа-Банк:', alfabankStatus);

      if (alfabankService.isSuccessfulPayment(alfabankStatus.orderStatus)) {
        if (payment.status !== 'completed') {
          console.log('✅ Платеж успешен, пополняем баланс');

          await createDeposit(
            payment.user_id,
            payment.amount,
            'alfabank',
            `Пополнение через Альфа-Банк (заказ: ${payment.order_id})`
          );

          await updatePaymentStatus(payment.order_id, 'completed', alfabankStatus);

          console.log(`✅ Баланс пользователя ${payment.user_id} пополнен на ${payment.amount} ₽`);

          return res.json({
            orderId: payment.order_id,
            status: 'completed',
            amount: payment.amount,
            createdAt: payment.created_at,
            completedAt: new Date(),
            message: 'Оплата прошла успешно! Баланс пополнен.'
          });
        }
      } else if (alfabankService.isFailedPayment(alfabankStatus.orderStatus)) {
        await updatePaymentStatus(payment.order_id, 'failed', alfabankStatus);
        
        return res.json({
          orderId: payment.order_id,
          status: 'failed',
          amount: payment.amount,
          createdAt: payment.created_at,
          message: 'Оплата отклонена'
        });
      }
    }
    
    // Статус еще pending
    res.json({
      orderId: payment.order_id,
      status: payment.status,
      amount: payment.amount,
      createdAt: payment.created_at,
      message: 'Платеж обрабатывается...'
    });
    
  } catch (err) {
    console.error('❌ Ошибка получения статуса платежа:', err);
    res.status(500).json({ error: 'Ошибка при получении статуса платежа' });
  }
});

// Проверка статуса платежа и пополнение баланса
router.get('/payment/status/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('🔍 Проверяем статус платежа:', orderId);
    
    const payment = await getPaymentByOrderId(orderId);
    
    if (!payment) {
      console.log('❌ Платеж не найден:', orderId);
      return res.status(404).json({ error: 'Платеж не найден' });
    }
    
    if (payment.user_id !== req.userId) {
      console.log('❌ Нет доступа к платежу:', orderId);
      return res.status(403).json({ error: 'Нет доступа к платежу' });
    }

    console.log('📋 Найден платеж:', {
      status: payment.status,
      amount: payment.amount,
      alfabankOrderId: payment.alfabank_order_id
    });

    if (payment.status === 'completed') {
      return res.json({
        orderId: payment.order_id,
        status: 'completed',
        amount: payment.amount,
        createdAt: payment.created_at,
        completedAt: payment.completed_at
      });
    }

    if (payment.alfabank_order_id) {
      console.log('🔍 Проверяем статус в Альфа-Банк:', payment.alfabank_order_id);
      
      const alfabankStatus = await alfabankService.getOrderStatus(payment.alfabank_order_id);
      
      if (alfabankStatus) {
        console.log('📊 Статус от Альфа-Банк:', alfabankStatus);

        if (alfabankService.isSuccessfulPayment(alfabankStatus.orderStatus)) {
          if (payment.status !== 'completed') {
            console.log('✅ Платеж успешен, пополняем баланс');

            await createDeposit(
              payment.user_id,
              payment.amount,
              'alfabank',
              `Пополнение через Альфа-Банк (заказ: ${orderId})`
            );

            await updatePaymentStatus(orderId, 'completed', alfabankStatus);

            console.log(`✅ Баланс пользователя ${payment.user_id} пополнен на ${payment.amount} ₽`);

            return res.json({
              orderId: payment.order_id,
              status: 'completed',
              amount: payment.amount,
              createdAt: payment.created_at,
              completedAt: new Date(),
              message: 'Оплата прошла успешно! Баланс пополнен.'
            });
          }
        } else if (alfabankService.isFailedPayment(alfabankStatus.orderStatus)) {
          await updatePaymentStatus(orderId, 'failed', alfabankStatus);
          
          return res.json({
            orderId: payment.order_id,
            status: 'failed',
            amount: payment.amount,
            createdAt: payment.created_at,
            message: 'Оплата отклонена'
          });
        }
      }
    }
    
    res.json({
      orderId: payment.order_id,
      status: payment.status,
      amount: payment.amount,
      createdAt: payment.created_at,
      completedAt: payment.completed_at
    });
    
  } catch (err) {
    console.error('❌ Ошибка получения статуса платежа:', err);
    res.status(500).json({ error: 'Ошибка при получении статуса платежа' });
  }
});

// Списание средств с баланса
router.post('/deduct', auth, async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Сумма должна быть больше 0' });
    }
    
    console.log('💸 Списываем средства:', {
      userId: req.userId,
      amount: amount,
      description: description
    });
    
    const result = await deductBalance(req.userId, parseFloat(amount));
    
    try {
      await createPayment(
        req.userId,
        null,
        parseFloat(amount),
        null,
        description || 'Списание средств с баланса'
      );
    } catch (paymentError) {
      console.error('❌ Ошибка записи транзакции:', paymentError);
    }
    
    console.log('✅ Средства списаны успешно:', result);
    
    res.json({
      success: true,
      new_balance: result.new_balance,
      amount_deducted: result.amount_deducted,
      transaction_id: `deduct_${Date.now()}`
    });
    
  } catch (err) {
    console.error('❌ Ошибка при списании средств:', err);
    
    if (err.message === 'Недостаточно средств на балансе') {
      return res.status(400).json({ error: err.message });
    }
    
    res.status(500).json({ error: 'Ошибка при списании средств' });
  }
});

// Вывод средств с баланса клуба
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { clubId, amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Сумма должна быть положительной' });
    }
    
    console.log('💰 Запрос на вывод средств:', {
      userId: req.userId,
      clubId: clubId,
      amount: amount
    });
    
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === clubId.toString());
    
    if (!isOwner) {
      return res.status(403).json({ error: 'У вас нет прав на вывод средств этого клуба' });
    }
    
    const result = await createWithdrawal(req.userId, clubId, amount);
    
    console.log('✅ Средства выведены успешно:', result);
    
    res.json(result);
  } catch (err) {
    console.error('❌ Ошибка при выводе средств:', err);
    if (err.message === 'Недостаточно средств на балансе клуба') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Ошибка при выводе средств' });
  }
});

// Получение истории транзакций пользователя
router.get('/history', auth, async (req, res) => {
  try {
    console.log('📊 Загружаем историю транзакций для пользователя:', req.userId);
    
    const transactions = await getUserTransactions(req.userId);
    
    console.log('✅ История транзакций загружена, записей:', transactions.length);
    
    res.json(transactions);
  } catch (err) {
    console.error('❌ Ошибка при загрузке истории транзакций:', err);
    res.status(500).json({ error: 'Ошибка при загрузке истории транзакций' });
  }
});

// Получение истории транзакций клуба
router.get('/club/:clubId/history', auth, async (req, res) => {
  try {
    const clubId = req.params.clubId;
    
    console.log('📊 Загружаем историю транзакций клуба:', clubId);
    
    const clubs = await getClubsByOwnerId(req.userId);
    const isOwner = clubs.some(club => club.id.toString() === clubId);
    
    if (!isOwner) {
      return res.status(403).json({ error: 'У вас нет прав на просмотр транзакций этого клуба' });
    }
    
    const transactions = await getClubTransactions(clubId);
    
    console.log('✅ История транзакций клуба загружена, записей:', transactions.length);
    
    res.json(transactions);
  } catch (err) {
    console.error('❌ Ошибка при загрузке истории транзакций клуба:', err);
    res.status(500).json({ error: 'Ошибка при загрузке истории транзакций клуба' });
  }
});

module.exports = router;