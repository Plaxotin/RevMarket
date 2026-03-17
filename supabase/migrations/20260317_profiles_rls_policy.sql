-- ============================================================
-- RLS-политика для таблицы profiles
-- Ограничивает доступ к контактным данным (phone, email, city)
-- только для пользователей, у которых есть предложение на запрос владельца профиля
-- ============================================================

-- Включаем RLS на profiles (идемпотентно — ALTER TABLE не падает если уже включено)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Пользователь всегда может читать свой собственный профиль
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Пользователь может читать профиль другого пользователя,
-- только если у него есть предложение на запрос этого пользователя
DROP POLICY IF EXISTS "Users can read profile of request owners they made offers to" ON public.profiles;
CREATE POLICY "Users can read profile of request owners they made offers to"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.requests r
      JOIN public.offers o ON o.request_id = r.id
      WHERE r.user_id = profiles.id
        AND o.user_id = auth.uid()
    )
  );

-- Пользователь может обновлять только свой профиль
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role (для триггера auto_create_profile) имеет полный доступ по умолчанию

COMMENT ON POLICY "Users can read profile of request owners they made offers to" ON public.profiles
  IS 'Разрешает поставщику видеть контакты покупателя только при наличии предложения на его запрос';
