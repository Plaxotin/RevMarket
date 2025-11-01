/**
 * Функция для перевода ошибок Supabase на русский язык
 */
export const translateSupabaseError = (errorMessage: string): string => {
  // Пароль
  if (errorMessage.toLowerCase().includes('password should be at least')) {
    return "Пароль должен содержать минимум 6 символов";
  }
  if (errorMessage.toLowerCase().includes('password') && errorMessage.toLowerCase().includes('weak')) {
    return "Пароль слишком слабый";
  }
  
  // Email
  if (errorMessage.toLowerCase().includes('invalid email') || errorMessage.toLowerCase().includes('invalid')) {
    return "Некорректный email адрес";
  }
  if (errorMessage.toLowerCase().includes('already registered') || errorMessage.toLowerCase().includes('already exists')) {
    return "Пользователь с таким email уже зарегистрирован";
  }
  if (errorMessage.toLowerCase().includes('email not confirmed')) {
    return "Email не подтвержден. Проверьте почту и подтвердите регистрацию";
  }
  if (errorMessage.toLowerCase().includes('email rate limit')) {
    return "Слишком много попыток. Попробуйте позже";
  }
  
  // Аутентификация
  if (errorMessage.toLowerCase().includes('invalid credentials') || errorMessage.toLowerCase().includes('invalid login')) {
    return "Неверный email или пароль";
  }
  if (errorMessage.toLowerCase().includes('email not found')) {
    return "Пользователь с таким email не найден";
  }
  if (errorMessage.toLowerCase().includes('user not found')) {
    return "Пользователь не найден";
  }
  if (errorMessage.toLowerCase().includes('signups disabled')) {
    return "Регистрация временно отключена";
  }
  
  // SMS/Phone
  if (errorMessage.toLowerCase().includes('phone provider') || errorMessage.toLowerCase().includes('sms')) {
    return "SMS временно недоступен";
  }
  if (errorMessage.toLowerCase().includes('invalid phone')) {
    return "Некорректный номер телефона";
  }
  
  // Общие ошибки
  if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('timeout')) {
    return "Ошибка подключения. Проверьте интернет соединение";
  }
  if (errorMessage.toLowerCase().includes('rate limit')) {
    return "Слишком много попыток. Подождите немного";
  }
  if (errorMessage.toLowerCase().includes('400')) {
    return "Ошибка валидации данных";
  }
  if (errorMessage.toLowerCase().includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
    return "Необходима авторизация";
  }
  if (errorMessage.toLowerCase().includes('403') || errorMessage.toLowerCase().includes('forbidden')) {
    return "Доступ запрещен";
  }
  if (errorMessage.toLowerCase().includes('404') || errorMessage.toLowerCase().includes('not found')) {
    return "Ресурс не найден";
  }
  if (errorMessage.toLowerCase().includes('500') || errorMessage.toLowerCase().includes('server')) {
    return "Ошибка сервера. Попробуйте позже";
  }
  
  // Возвращаем оригинальное сообщение, если не найдено совпадений
  return errorMessage;
};

