# Send Offer Notification Edge Function

Уведомления владельцу запроса о новом предложении. Вызов **только с JWT пользователя**, создавшего предложение (проверка совпадения `offer.user_id` и `request_id`).

## Переменные окружения (Supabase Dashboard → Edge Functions → Secrets)

Обязательные для работы с БД (обычно задаются автоматически):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` — для проверки JWT вызывающего
- `SUPABASE_SERVICE_ROLE_KEY` — чтение данных запроса/оффера и подписки

Опционально:

- `SITE_URL` — ссылки в письмах (по умолчанию `https://rev-market.vercel.app`)
- `RESEND_API_KEY` — [Resend](https://resend.com); без ключа письма не отправляются (`results.email: false`)
- `RESEND_FROM` — отправитель, например `РеверсМаркет <notify@ваш-домен.ru>`
- `TELEGRAM_BOT_TOKEN` — для Telegram; `chat_id` в подписке: **числовой id** (после `/start` бота) или число в виде строки

## Деплой

```bash
supabase functions deploy send-offer-notification
```
