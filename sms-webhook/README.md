# Supabase SMS Webhook с российскими провайдерами

Webhook для отправки SMS через российские API (Exolve, SMS Aero, eSputnik) в Supabase Auth.

## Поддерживаемые провайдеры

### 1. Exolve (рекомендуется)
- **Сайт**: [exolve.ru](https://exolve.ru)
- **Стоимость**: от 1.5₽ за SMS
- **Регистрация**: бесплатная
- **API**: REST API с Bearer токеном

### 2. SMS Aero
- **Сайт**: [smsaero.ru](https://smsaero.ru)
- **Стоимость**: от 1.8₽ за SMS
- **Регистрация**: бесплатная
- **API**: HTTP Basic Auth

### 3. eSputnik
- **Сайт**: [esputnik.com](https://esputnik.com)
- **Стоимость**: от 2₽ за SMS
- **Регистрация**: бесплатная
- **API**: REST API с Bearer токеном

## Настройка

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка переменных окружения
Создайте файл `.env.local`:

#### Для Exolve:
```
SMS_PROVIDER=exolve
SMS_API_KEY=your_exolve_api_key
SMS_SENDER=NeedHub
```

#### Для SMS Aero:
```
SMS_PROVIDER=smsaero
SMS_API_KEY=your_smsaero_password
SMS_AERO_EMAIL=your_email@smsaero.ru
SMS_SENDER=NeedHub
```

#### Для eSputnik:
```
SMS_PROVIDER=esputnik
SMS_API_KEY=your_esputnik_api_key
SMS_SENDER=NeedHub
```

### 3. Получение API ключей

#### Exolve:
1. Регистрируемся на [exolve.ru](https://exolve.ru)
2. Пополняем баланс (минимум 100₽)
3. Получаем API ключ в личном кабинете

#### SMS Aero:
1. Регистрируемся на [smsaero.ru](https://smsaero.ru)
2. Пополняем баланс (минимум 200₽)
3. Получаем email и пароль для API

#### eSputnik:
1. Регистрируемся на [esputnik.com](https://esputnik.com)
2. Пополняем баланс (минимум 500₽)
3. Получаем API ключ в настройках

### 4. Деплой на Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 5. Настройка переменных в Vercel
В Vercel Dashboard → Settings → Environment Variables:
- `SMS_PROVIDER` = exolve/smsaero/esputnik
- `SMS_API_KEY` = ваш API ключ
- `SMS_SENDER` = NeedHub
- `SMS_AERO_EMAIL` = ваш email (только для SMS Aero)

### 6. Настройка в Supabase
1. Заходим в Supabase Dashboard
2. Authentication → Settings → Phone Auth
3. Enable Send SMS hook: ON
4. Hook type: HTTPS
5. URL: https://your-vercel-app.vercel.app/api/send-sms
6. Secret: Generate secret

## Стоимость SMS

| Провайдер | Стоимость SMS | Минимум пополнения | Регистрация |
|-----------|---------------|-------------------|-------------|
| Exolve    | от 1.5₽       | 100₽              | Бесплатно   |
| SMS Aero  | от 1.8₽       | 200₽              | Бесплатно   |
| eSputnik  | от 2₽         | 500₽              | Бесплатно   |

## Использование

Webhook автоматически вызывается Supabase при отправке SMS кода.

## Структура запроса от Supabase

```json
{
  "phone": "+79123456789",
  "token": "123456"
}
```

## Структура ответа

```json
{
  "success": true,
  "provider": "exolve",
  "result": { ... }
}
```
