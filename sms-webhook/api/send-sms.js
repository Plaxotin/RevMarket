const axios = require('axios');

// Настройки SMS провайдера
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'exolve'; // exolve, smsaero, esputnik
const SMS_API_KEY = process.env.SMS_API_KEY;
const SMS_SENDER = process.env.SMS_SENDER || 'NeedHub';

// Функция отправки через Exolve
async function sendViaExolve(phone, message) {
  const response = await axios.post('https://api.exolve.ru/messaging/v1/SendSMS', {
    number: phone,
    text: message,
    sender: SMS_SENDER
  }, {
    headers: {
      'Authorization': `Bearer ${SMS_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}

// Функция отправки через SMS Aero
async function sendViaSmsAero(phone, message) {
  const response = await axios.get('https://gate.smsaero.ru/v2/sms/send', {
    params: {
      number: phone,
      text: message,
      sign: SMS_SENDER
    },
    auth: {
      username: process.env.SMS_AERO_EMAIL,
      password: SMS_API_KEY
    }
  });
  return response.data;
}

// Функция отправки через eSputnik
async function sendViaEsputnik(phone, message) {
  const response = await axios.post('https://esputnik.com/api/v1/message/sms', {
    recipients: [phone],
    text: message,
    from: SMS_SENDER
  }, {
    headers: {
      'Authorization': `Bearer ${SMS_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}

export default async function handler(req, res) {
  // Проверяем метод запроса
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Получаем данные от Supabase
    const { phone, token } = req.body;
    
    if (!phone || !token) {
      return res.status(400).json({ error: 'Missing phone or token' });
    }

    const message = `Ваш код подтверждения: ${token}`;
    let result;

    // Выбираем провайдера
    switch (SMS_PROVIDER) {
      case 'exolve':
        result = await sendViaExolve(phone, message);
        break;
      case 'smsaero':
        result = await sendViaSmsAero(phone, message);
        break;
      case 'esputnik':
        result = await sendViaEsputnik(phone, message);
        break;
      default:
        throw new Error('Unknown SMS provider');
    }

    console.log('SMS sent via', SMS_PROVIDER, ':', result);
    
    return res.status(200).json({ 
      success: true, 
      provider: SMS_PROVIDER,
      result: result 
    });

  } catch (error) {
    console.error('SMS error:', error);
    return res.status(500).json({ 
      error: 'Failed to send SMS',
      details: error.message 
    });
  }
}
