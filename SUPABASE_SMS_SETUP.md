# Инструкция по настройке Supabase для SMS-авторизации

## Этап 2.1: Настройка Phone Auth в Supabase Dashboard

### Шаг 1: Включение Phone Authentication

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Выберите ваш проект
3. Перейдите в **Authentication** → **Settings** (в левом меню)
4. Найдите раздел **Phone Auth**
5. Включите следующие опции:
   - ✅ **Enable phone signup** - включить регистрацию по телефону
   - ✅ **Enable phone login** - включить вход по телефону

### Шаг 2: Настройка SMS Provider

Supabase по умолчанию использует Twilio, но для российских номеров нужно использовать кастомный webhook.

1. В том же разделе **Phone Auth** найдите **SMS Provider**
2. Выберите **Custom** (или оставьте Twilio, если используете кастомный webhook)
3. Включите **Enable Send SMS hook**: **ON**
4. Настройте webhook:
   - **Hook type**: `HTTPS`
   - **URL**: `https://your-vercel-app.vercel.app/api/send-sms`
     - Замените `your-vercel-app` на URL вашего развернутого webhook
   - **Secret**: Нажмите **Generate secret** или введите свой секретный ключ
     - ⚠️ **ВАЖНО**: Сохраните этот секрет! Он понадобится для настройки webhook

### Шаг 3: Сохранение секрета

После генерации секрета:
1. Скопируйте секретный ключ
2. Добавьте его в переменные окружения вашего webhook (Vercel):
   - Имя переменной: `SUPABASE_SMS_SECRET`
   - Значение: скопированный секрет

---

## Этап 2.2: Настройка Rate Limiting

Для защиты от злоупотреблений и спама:

1. В Supabase Dashboard перейдите в **Authentication** → **Settings**
2. Найдите раздел **Rate Limits** (или **Rate Limiting**)
3. Настройте следующие лимиты:

### Рекомендуемые настройки:

**SMS отправка:**
- Максимум **3 SMS** в час на один номер телефона
- Максимум **10 SMS** в день на один номер телефона

**OTP проверка:**
- Максимум **5 попыток** в 15 минут на один номер
- Максимум **10 попыток** в час на один номер

**Общие лимиты:**
- Максимум **20 запросов** в минуту с одного IP
- Максимум **100 запросов** в час с одного IP

### Как настроить:

Если в интерфейсе нет прямых настроек rate limiting:
1. Используйте **Database** → **Database Functions** для создания кастомных триггеров
2. Или настройте через **Edge Functions** (см. Этап 2.3)

---

## Этап 2.3: Создание Edge Function для дополнительной валидации (опционально)

Edge Function можно использовать для:
- Дополнительной проверки номеров перед отправкой SMS
- Проверки на заблокированные номера
- Логирования попыток авторизации
- Кастомного rate limiting

### Установка Supabase CLI

```bash
npm install -g supabase
```

### Инициализация проекта

```bash
supabase login
supabase link --project-ref your-project-ref
```

### Создание Edge Function

```bash
supabase functions new validate-phone
```

### Код функции

Создайте файл `supabase/functions/validate-phone/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json()
    
    // Валидация российского номера
    const normalized = phone.replace(/[^\d+]/g, '')
    if (!normalized.startsWith('+7') || normalized.length !== 12) {
      return new Response(
        JSON.stringify({ error: 'Invalid Russian phone number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Проверка на заблокированные номера (пример)
    // Здесь можно добавить проверку в базу данных
    
    // Логирование
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    await supabaseClient
      .from('auth_attempts')
      .insert({ phone, timestamp: new Date().toISOString() })

    return new Response(
      JSON.stringify({ valid: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Деплой функции

```bash
supabase functions deploy validate-phone
```

---

## Проверка настройки

### Тест 1: Проверка Phone Auth

1. Откройте ваше приложение
2. Перейдите на страницу авторизации
3. Введите валидный российский номер: `+7 (900) 123-45-67`
4. Нажмите "Получить SMS код"
5. Проверьте:
   - ✅ Номер нормализован до `+79001234567`
   - ✅ Запрос отправлен в Supabase
   - ✅ Webhook получил запрос
   - ✅ SMS отправлено через провайдера

### Тест 2: Проверка Rate Limiting

1. Попробуйте отправить SMS 4 раза подряд с одного номера
2. После 3-й попытки должна появиться ошибка rate limiting

### Тест 3: Проверка валидации

1. Попробуйте ввести невалидный номер: `+1 (234) 567-89-00`
2. Должна появиться ошибка валидации до отправки запроса в Supabase

---

## Устранение проблем

### Проблема: SMS не отправляются

**Решение:**
1. Проверьте, что webhook развернут и доступен
2. Проверьте переменные окружения в Vercel
3. Проверьте логи webhook в Vercel Dashboard
4. Убедитесь, что секрет совпадает в Supabase и Vercel

### Проблема: Ошибка "Invalid phone number"

**Решение:**
1. Убедитесь, что номер в формате `+7XXXXXXXXXX`
2. Проверьте валидацию на клиенте
3. Проверьте настройки Phone Auth в Supabase

### Проблема: Rate limit exceeded

**Решение:**
1. Подождите указанное время (обычно 1 час)
2. Проверьте настройки rate limiting
3. Используйте другой номер для тестирования

---

## Дополнительные настройки

### Настройка сообщения SMS

Текст SMS настраивается в webhook (`sms-webhook/api/send-sms.js`):

```javascript
const message = `Ваш код подтверждения: ${token}`;
```

Можно изменить на:
```javascript
const message = `Код для входа в RevMarket: ${token}. Никому не сообщайте этот код.`;
```

### Настройка времени жизни OTP

В Supabase Dashboard → Authentication → Settings:
- **OTP Expiry**: по умолчанию 3600 секунд (1 час)
- Рекомендуется: 600 секунд (10 минут) для безопасности

---

## Безопасность

### Рекомендации:

1. ✅ Всегда используйте HTTPS для webhook
2. ✅ Храните секреты в переменных окружения, не в коде
3. ✅ Включите rate limiting
4. ✅ Логируйте все попытки авторизации
5. ✅ Мониторьте подозрительную активность
6. ✅ Регулярно проверяйте баланс SMS-провайдера

---

## Следующие шаги

После настройки Supabase:
- ✅ Этап 1: Валидация номеров (завершен)
- ✅ Этап 2: Настройка Supabase (текущий этап)
- ⏭️ Этап 3: Улучшение SMS Webhook
- ⏭️ Этап 4: Улучшение UI/UX
- ⏭️ Этап 5: Безопасность и защита от злоупотреблений





