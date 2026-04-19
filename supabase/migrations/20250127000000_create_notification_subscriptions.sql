-- Таблица для хранения подписок на уведомления
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  telegram_username VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Индекс для быстрого поиска активных подписок
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_active 
ON notification_subscriptions(user_id, is_active) 
WHERE is_active = true;

-- RLS политики
ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Пользователь может читать только свою подписку
CREATE POLICY "Users can view their own subscription"
ON notification_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Пользователь может создавать только свою подписку
CREATE POLICY "Users can insert their own subscription"
ON notification_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Пользователь может обновлять только свою подписку
CREATE POLICY "Users can update their own subscription"
ON notification_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_notification_subscriptions_updated_at ON notification_subscriptions;
CREATE TRIGGER update_notification_subscriptions_updated_at
    BEFORE UPDATE ON notification_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();





