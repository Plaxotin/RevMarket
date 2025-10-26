import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Форматирует числа с пробелами каждые три цифры
export function formatPrice(price: string | number): string {
  // Если это строка, пытаемся извлечь числа
  const numberStr = typeof price === 'string' 
    ? price.replace(/\D/g, '') // Убираем все нецифровые символы
    : String(price);
  
  // Добавляем пробелы каждые три цифры справа налево
  return numberStr.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
