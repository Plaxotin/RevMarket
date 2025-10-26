// Определяем, работаем ли мы в продакшене или локально
export const isProduction = () => {
  return import.meta.env.PROD;
};

// Определяем, используем ли Supabase Storage
export const useSupabaseStorage = () => {
  // В продакшене используем Supabase Storage
  // В разработке используем base64
  return isProduction();
};



