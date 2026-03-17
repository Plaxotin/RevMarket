-- ============================================================
-- Таблица жалоб (модерация)
-- Выполните этот SQL в Supabase Console → SQL Editor
-- ============================================================

-- Создаём таблицу reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('request', 'offer')),
  target_id UUID NOT NULL,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fraud', 'duplicate', 'other')),
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Один пользователь не может пожаловаться на один и тот же объект дважды
  UNIQUE(target_type, target_id, reporter_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);

-- RLS: включаем
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Политика: авторизованные пользователи могут создавать жалобы
CREATE POLICY "Users can create reports"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Политика: пользователь видит только свои жалобы
CREATE POLICY "Users can view own reports"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Даём service_role полный доступ (для админ-панели)
-- Это работает по умолчанию через service_role key

COMMENT ON TABLE public.reports IS 'Жалобы на запросы и предложения для модерации';
