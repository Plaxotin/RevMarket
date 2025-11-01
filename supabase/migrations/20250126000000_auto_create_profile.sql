-- Функция для автоматического создания профиля при регистрации через SMS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Проверяем, существует ли уже профиль
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    -- Создаем профиль автоматически
    INSERT INTO public.profiles (id, name, phone, email, city)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', 'Пользователь'),
      COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
      COALESCE(NEW.email, ''),
      COALESCE(NEW.raw_user_meta_data->>'city', NULL)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического создания профиля
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

