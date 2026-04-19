const axios = require('axios');

// Настройки SMS провайдера
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'exolve'; // exolve, smsaero, esputnik, smsc
const SMS_API_KEY = process.env.SMS_API_KEY;
const SMS_SENDER = process.env.SMS_SENDER || 'РЕВЕРС МАРК';
const SUPABASE_SMS_SECRET = process.env.SUPABASE_SMS_SECRET;

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
  // SMS Aero требует номер без +, только цифры
  // Преобразуем +79123456789 в 79123456789
  const cleanPhone = phone.replace(/[^\d]/g, '');
  
  // Проверяем наличие обязательных переменных
  if (!process.env.SMS_AERO_EMAIL) {
    throw new Error('SMS_AERO_EMAIL is not set in environment variables');
  }
  if (!SMS_API_KEY) {
    throw new Error('SMS_API_KEY is not set in environment variables');
  }
  if (!SMS_SENDER) {
    throw new Error('SMS_SENDER is not set in environment variables');
  }

  // SMS Aero API v2 использует POST запрос
  const response = await axios.post(
    'https://gate.smsaero.ru/v2/sms/send',
    {
      number: cleanPhone,
      text: message,
      sign: SMS_SENDER
    },
    {
      auth: {
        username: process.env.SMS_AERO_EMAIL,
        password: SMS_API_KEY
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  // Проверяем ответ от SMS Aero
  // SMS Aero возвращает { success: true/false, data: {...} }
  if (response.data && response.data.success === false) {
    const errorMsg = response.data.message || response.data.error || 'Unknown SMS Aero error';
    throw new Error(`SMS Aero error: ${errorMsg}`);
  }

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

// Функция отправки через SMSC.ru
async function sendViaSmsc(phone, message) {
  // SMSC.ru требует номер без +, только цифры
  const cleanPhone = phone.replace(/[^\d]/g, '');
  
  // Проверяем наличие обязательных переменных
  if (!process.env.SMSC_LOGIN) {
    throw new Error('SMSC_LOGIN is not set in environment variables');
  }
  if (!SMS_API_KEY) {
    throw new Error('SMS_API_KEY is not set in environment variables (используется как пароль для SMSC.ru)');
  }
  if (!SMS_SENDER) {
    throw new Error('SMS_SENDER is not set in environment variables');
  }

  // SMSC.ru использует GET запрос с параметрами
  const params = new URLSearchParams({
    login: process.env.SMSC_LOGIN,
    psw: SMS_API_KEY, // Пароль от SMSC.ru
    phones: cleanPhone,
    mes: message,
    sender: SMS_SENDER,
    fmt: 3 // JSON формат ответа
  });

  const response = await axios.get(`https://smsc.ru/sys/send.php?${params.toString()}`);

  // SMSC.ru возвращает объект с полями error, id, cnt, cost
  if (response.data.error) {
    throw new Error(`SMSC.ru error: ${response.data.error}`);
  }

  return response.data;
}

export default async function handler(req, res) {
  // Проверяем метод запроса
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Проверка секрета от Supabase (если настроен)
  if (SUPABASE_SMS_SECRET) {
    // Supabase может отправлять секрет в заголовке или в теле запроса
    // Проверяем заголовок x-supabase-secret или authorization
    const providedSecret = req.headers['x-supabase-secret'] || 
                           req.headers['authorization']?.replace('Bearer ', '') ||
                           req.body?.secret;
    
    if (providedSecret !== SUPABASE_SMS_SECRET) {
      console.warn('Unauthorized SMS webhook request - invalid secret');
      return res.status(401).json({ error: 'Unauthorized' });
    }
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
      case 'smsc':
        result = await sendViaSmsc(phone, message);
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
    
    // Более детальная обработка ошибок
    let statusCode = 500;
    let errorMessage = 'Failed to send SMS';
    let errorDetails = error.message;

    // Обработка специфичных ошибок провайдеров
    if (error.response) {
      // Ошибка от API провайдера
      statusCode = error.response.status || 500;
      errorDetails = error.response.data?.message || error.response.data?.error || error.message;
      
      // Логируем детали ошибки для отладки
      console.error('Provider API error:', {
        status: error.response.status,
        data: error.response.data,
        provider: SMS_PROVIDER
      });
    } else if (error.request) {
      // Запрос был отправлен, но ответа не получено
      errorDetails = 'No response from SMS provider';
      console.error('No response from provider:', SMS_PROVIDER);
    }

    return res.status(statusCode).json({ 
      error: errorMessage,
      details: errorDetails,
      provider: SMS_PROVIDER
    });
  }
}
