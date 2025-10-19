import { supabase } from '@/integrations/supabase/client';

/**
 * Проверяет, авторизован ли пользователь
 * @returns Promise<{user: any | null, isAuthenticated: boolean}>
 */
export const checkAuth = async () => {
  try {
    // Проверяем, есть ли данные Supabase в localStorage
    const hasSupabaseData = Array.from({ length: localStorage.length }, (_, i) => {
      const key = localStorage.key(i);
      return key && (key.startsWith('sb-') || key.includes('supabase'));
    }).some(Boolean);
    
    if (!hasSupabaseData) {
      console.log('Нет данных Supabase в localStorage, пользователь не авторизован');
      return { user: null, isAuthenticated: false };
    }
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Ошибка получения сессии:', error);
      return { user: null, isAuthenticated: false };
    }
    
    if (session?.user) {
      console.log('Пользователь авторизован:', session.user.id);
      return { user: session.user, isAuthenticated: true };
    } else {
      console.log('Сессия не найдена, пользователь не авторизован');
      return { user: null, isAuthenticated: false };
    }
  } catch (error) {
    console.error('Ошибка проверки авторизации:', error);
    return { user: null, isAuthenticated: false };
  }
};

/**
 * Полностью очищает данные авторизации
 */
export const clearAuthData = () => {
  try {
    // Очищаем localStorage от всех данных Supabase
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('Удален ключ из localStorage:', key);
    });
    
    // Очищаем sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
      console.log('Удален ключ из sessionStorage:', key);
    });
    
    console.log('Данные авторизации очищены');
  } catch (error) {
    console.error('Ошибка при очистке данных авторизации:', error);
  }
};

/**
 * Выполняет выход из системы
 * @returns Promise<boolean> - успешность операции
 */
export const logout = async () => {
  try {
    console.log('Начинаем процесс выхода...');
    
    // Принудительно выходим из Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Ошибка при выходе из Supabase:', error);
    }
    
    // Очищаем все данные авторизации
    clearAuthData();
    
    // Небольшая задержка для завершения процесса
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Выход завершен');
    return true;
  } catch (error) {
    console.error('Ошибка при выходе:', error);
    // В любом случае очищаем данные
    clearAuthData();
    return false;
  }
};

