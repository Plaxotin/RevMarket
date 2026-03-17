# VK ID авторизация — план реализации

## Текущее состояние
- VK ID SDK загружается на странице Auth
- VK App ID: `54306382`
- Redirect URL: `https://rev-market.vercel.app/`
- При успешной авторизации VK возвращает `code` и `device_id`
- **Не реализовано:** обмен VK code на Supabase-сессию

## Что нужно для полной интеграции

### 1. Supabase Edge Function `vk-auth`
Edge Function которая:
1. Принимает `code` и `device_id` от фронтенда
2. Обменивает `code` на VK access_token через VK API (server-side, нужен `client_secret`)
3. Получает данные пользователя через VK API (`/method/users.get`)
4. Ищет или создает пользователя в Supabase Auth (`admin.createUser` или `admin.generateLink`)
5. Возвращает Supabase session token

### 2. Секреты
```bash
supabase secrets set VK_CLIENT_ID=54306382
supabase secrets set VK_CLIENT_SECRET=<получить в VK ID Console>
```

### 3. Фронтенд
В `Auth.tsx` → `handleVKSuccess`:
```typescript
const handleVKSuccess = async (data: { code: string; device_id: string }) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/vk-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: data.code, device_id: data.device_id }),
  });
  const { session } = await response.json();
  await supabase.auth.setSession(session);
  navigate('/');
};
```

### 4. VK ID Console
- Убедиться что redirect URL совпадает: `https://rev-market.vercel.app/`
- Включить callback-режим
- Получить `client_secret`

## Приоритет
Средний. SMS-авторизация уже работает. VK ID добавит удобства для рунет-аудитории.
