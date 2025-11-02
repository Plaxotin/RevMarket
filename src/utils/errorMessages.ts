/**
 * Функция для перевода ошибок Supabase на русский язык
 */
export const translateSupabaseError = (errorMessage: string): string => {
  // Compute lowercased message once for performance
  const lowerMessage = errorMessage.toLowerCase();
  
  // Пароль
  if (lowerMessage.includes('password should be at least')) {
    return "Пароль должен содержать минимум 6 символов";
  }
  if (lowerMessage.includes('password') && lowerMessage.includes('weak')) {
    return "Пароль слишком слабый";
  }
  
  // Email - specific checks first
  if (lowerMessage.includes('invalid email') || (lowerMessage.includes('invalid') && lowerMessage.includes('email'))) {
    return "Некорректный email адрес";
  }
  if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists')) {
    return "Пользователь с таким email уже зарегистрирован";
  }
  if (lowerMessage.includes('email not confirmed')) {
    return "Email не подтвержден. Проверьте почту и подтвердите регистрацию";
  }
  if (lowerMessage.includes('email rate limit')) {
    return "Слишком много попыток. Попробуйте позже";
  }
  
  // Аутентификация
  if (lowerMessage.includes('invalid credentials') || lowerMessage.includes('invalid login')) {
    return "Неверный email или пароль";
  }
  if (lowerMessage.includes('email not found')) {
    return "Пользователь с таким email не найден";
  }
  if (lowerMessage.includes('user not found')) {
    return "Пользователь не найден";
  }
  if (lowerMessage.includes('signups disabled')) {
    return "Регистрация временно отключена";
  }
  
  // SMS/Phone
  if (lowerMessage.includes('phone provider') || lowerMessage.includes('sms')) {
    return "SMS временно недоступен";
  }
  if (lowerMessage.includes('invalid phone')) {
    return "Некорректный номер телефона";
  }
  
  // Общие ошибки
  if (lowerMessage.includes('network') || lowerMessage.includes('timeout')) {
    return "Ошибка подключения. Проверьте интернет соединение";
  }
  if (lowerMessage.includes('rate limit')) {
    return "Слишком много попыток. Подождите немного";
  }
  if (lowerMessage.includes('400')) {
    return "Ошибка валидации данных";
  }
  if (lowerMessage.includes('401') || lowerMessage.includes('unauthorized')) {
    return "Необходима авторизация";
  }
  if (lowerMessage.includes('403') || lowerMessage.includes('forbidden')) {
    return "Доступ запрещен";
  }
  if (lowerMessage.includes('404') || lowerMessage.includes('not found')) {
    return "Ресурс не найден";
  }
  if (lowerMessage.includes('500') || lowerMessage.includes('server')) {
    return "Ошибка сервера. Попробуйте позже";
  }
  
  // Возвращаем оригинальное сообщение, если не найдено совпадений
  return errorMessage;
};

