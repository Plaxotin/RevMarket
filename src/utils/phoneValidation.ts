/**
 * Утилиты для валидации и нормализации российских номеров телефонов
 */

/**
 * Нормализует номер телефона к формату +7XXXXXXXXXX
 * @param phone - Номер телефона в любом формате
 * @returns Нормализованный номер или null, если номер некорректный
 */
export const normalizePhone = (phone: string): string | null => {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Удаляем все символы кроме цифр и +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Если начинается с 8, заменяем на +7
  if (cleaned.startsWith('8')) {
    const digits = cleaned.slice(1);
    if (digits.length === 10) {
      return '+7' + digits;
    }
    return null;
  }

  // Если начинается с 7, добавляем +
  if (cleaned.startsWith('7') && !cleaned.startsWith('+7')) {
    const digits = cleaned.slice(1);
    if (digits.length === 10) {
      return '+7' + digits;
    }
    return null;
  }

  // Если уже начинается с +7
  if (cleaned.startsWith('+7')) {
    const digits = cleaned.slice(2);
    if (digits.length === 10) {
      return '+7' + digits;
    }
    return null;
  }

  // Если начинается с 9 (пользователь ввел только код оператора)
  if (cleaned.startsWith('9') && cleaned.length === 10) {
    return '+7' + cleaned;
  }

  return null;
};

/**
 * Валидирует российский номер телефона
 * @param phone - Номер телефона для проверки
 * @returns Объект с результатом валидации и сообщением об ошибке (если есть)
 */
export const validateRussianPhone = (phone: string): { valid: boolean; error?: string; normalized?: string } => {
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'Введите номер телефона' };
  }

  const normalized = normalizePhone(phone);

  if (!normalized) {
    return { valid: false, error: 'Некорректный формат номера. Используйте формат: +7 (XXX) XXX-XX-XX' };
  }

  // Проверка длины (должно быть +7 + 10 цифр = 12 символов)
  if (normalized.length !== 12) {
    return { valid: false, error: 'Номер должен содержать 10 цифр после +7', normalized };
  }

  // Проверка кода оператора (вторая и третья цифры после +7)
  const operatorCode = normalized.substring(2, 4);
  
  // Валидные коды операторов для российских номеров
  const validCodes = [
    // Мобильные операторы (900-999)
    '90', '91', '92', '93', '94', '95', '96', '97', '98', '99',
    // Дополнительные мобильные (800-899)
    '80', '81', '82', '83', '84', '85', '86', '87', '88', '89',
    // Дополнительные мобильные (700-799)
    '70', '71', '72', '73', '74', '75', '76', '77', '78', '79',
    // Городские и другие (300-699)
    '30', '31', '32', '33', '34', '35', '36', '37', '38', '39',
    '40', '41', '42', '43', '44', '45', '46', '47', '48', '49',
    '50', '51', '52', '53', '54', '55', '56', '57', '58', '59',
    '60', '61', '62', '63', '64', '65', '66', '67', '68', '69',
  ];

  if (!validCodes.includes(operatorCode)) {
    return { valid: false, error: 'Некорректный код оператора. Проверьте правильность номера', normalized };
  }

  return { valid: true, normalized };
};

/**
 * Форматирует номер телефона для отображения: +7 (XXX) XXX-XX-XX
 * @param phone - Номер телефона
 * @returns Отформатированный номер
 */
export const formatPhoneDisplay = (phone: string): string => {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return phone;
  }

  const digits = normalized.slice(2); // Убираем +7
  if (digits.length === 10) {
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
  }

  // Если номер неполный, форматируем частично
  if (digits.length === 0) {
    return '+7';
  } else if (digits.length <= 3) {
    return `+7 (${digits}`;
  } else if (digits.length <= 6) {
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else if (digits.length <= 8) {
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else {
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
  }
};

/**
 * Обрабатывает ввод номера телефона, автоматически форматируя его
 * @param value - Введенное значение
 * @returns Отформатированное значение
 */
export const handlePhoneInput = (value: string): string => {
  // Удаляем все символы кроме цифр и +
  let cleaned = value.replace(/[^\d+]/g, '');

  // Если начинается с 8, заменяем на +7
  if (cleaned.startsWith('8')) {
    cleaned = '+7' + cleaned.slice(1);
  }

  // Если начинается с 7 (но не +7), добавляем +
  if (cleaned.startsWith('7') && !cleaned.startsWith('+7')) {
    cleaned = '+7' + cleaned.slice(1);
  }

  // Если начинается с 9, добавляем +7
  if (cleaned.startsWith('9') && !cleaned.startsWith('+7')) {
    cleaned = '+7' + cleaned;
  }

  // Если не начинается с +7, но начинается с цифры, добавляем +7
  if (!cleaned.startsWith('+') && /^\d/.test(cleaned)) {
    if (!cleaned.startsWith('7') && !cleaned.startsWith('8')) {
      cleaned = '+7' + cleaned;
    } else if (cleaned.startsWith('7')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('8')) {
      cleaned = '+7' + cleaned.slice(1);
    }
  }

  // Форматируем для отображения
  return formatPhoneDisplay(cleaned);
};





