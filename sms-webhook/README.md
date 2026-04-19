# Supabase SMS Webhook с российскими провайдерами

Webhook для отправки SMS через российские API (Exolve, SMSC.ru, SMS Aero, eSputnik) в Supabase Auth.

## Поддерживаемые провайдеры

### 1. Exolve (рекомендуется)
- **Сайт**: [exolve.ru](https://exolve.ru)
- **Стоимость**: от 1.5₽ за SMS
- **Регистрация**: бесплатная
- **API**: REST API с Bearer токеном

### 2. SMSC.ru
- **Сайт**: [smsc.ru](https://smsc.ru)
- **Стоимость**: от 1.8₽ за SMS
- **Регистрация**: бесплатная
- **API**: HTTP GET запрос с параметрами

### 3. SMS Aero
- **Сайт**: [smsaero.ru](https://smsaero.ru)
- **Стоимость**: от 1.8₽ за SMS
- **Регистрация**: бесплатная
- **API**: HTTP Basic Auth

### 4. eSputnik
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
SMS_SENDER=РЕВЕРС МАРК
SUPABASE_SMS_SECRET=your_supabase_secret
```

#### Для SMS Aero:
```
SMS_PROVIDER=smsaero
SMS_API_KEY=your_smsaero_api_key
SMS_AERO_EMAIL=your_email@smsaero.ru
SMS_SENDER=РЕВЕРС МАРК
SUPABASE_SMS_SECRET=your_supabase_secret
```
⚠️ **Важно для SMS Aero:**
- `SMS_AERO_EMAIL` - ваш email, использованный при регистрации
- `SMS_API_KEY` - сгенерированный API ключ (НЕ пароль от аккаунта!)
- `SMS_SENDER` - подпись отправителя должна быть подтверждена в личном кабинете

#### Для SMSC.ru:
```
SMS_PROVIDER=smsc
SMSC_LOGIN=your_smsc_login
SMS_API_KEY=your_smsc_password
SMS_SENDER=РЕВЕРС МАРК
SUPABASE_SMS_SECRET=your_supabase_secret
```

⚠️ **Важно для SMSC.ru:**
- `SMSC_LOGIN` - ваш логин от SMSC.ru
- `SMS_API_KEY` - ваш пароль от SMSC.ru (используется как пароль для API)
- `SMS_SENDER` - имя отправителя должно быть подтверждено в личном кабинете SMSC.ru (используйте "РЕВЕРС МАРК")

#### Для eSputnik:
```
SMS_PROVIDER=esputnik
SMS_API_KEY=your_esputnik_api_key
SMS_SENDER=РЕВЕРС МАРК
SUPABASE_SMS_SECRET=your_supabase_secret
```

### 3. Получение API ключей

#### Exolve:
1. Регистрируемся на [exolve.ru](https://exolve.ru)
2. Пополняем баланс (минимум 100₽)
3. Получаем API ключ в личном кабинете

#### SMSC.ru:
1. Регистрируемся на [smsc.ru](https://smsc.ru)
2. Пополняем баланс (минимум 100₽)
3. В личном кабинете:
   - Перейдите в "Настройки" → "Имя отправителя"
   - Добавьте и подтвердите имя отправителя "РЕВЕРС МАРК"
4. Получите логин и пароль для API (обычно это логин и пароль от аккаунта)

#### SMS Aero:
1. Регистрируемся на [smsaero.ru](https://smsaero.ru)
2. Пополняем баланс (минимум 200₽)
3. Настраиваем подпись отправителя в разделе "Настройки" → "Подписи" (требуется подтверждение)
4. Получаем email и API ключ в разделе "Настройки" → "API и SMPP"
   - Email - это ваш email, использованный при регистрации
   - API ключ - это сгенерированный пароль для API (НЕ пароль от аккаунта!)

📖 **Подробная инструкция**: См. [SMS_AERO_SETUP.md](../SMS_AERO_SETUP.md)

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
- `SMS_PROVIDER` = exolve/smsc/smsaero/esputnik
- `SMS_API_KEY` = ваш API ключ (для SMSC.ru - это пароль)
- `SMS_SENDER` = РЕВЕРС МАРК
- `SMSC_LOGIN` = ваш логин (только для SMSC.ru)
- `SMS_AERO_EMAIL` = ваш email (только для SMS Aero)
- `SUPABASE_SMS_SECRET` = секрет из Supabase (см. шаг 6)

### 6. Настройка в Supabase
1. Заходим в Supabase Dashboard
2. Authentication → Settings → Phone Auth
3. Enable Send SMS hook: ON
4. Hook type: HTTPS
5. URL: https://your-vercel-app.vercel.app/api/send-sms
6. Secret: Generate secret (или введите свой)
   - ⚠️ **ВАЖНО**: Скопируйте этот секрет и добавьте в Vercel как `SUPABASE_SMS_SECRET`
   - Webhook будет проверять этот секрет для безопасности

## Стоимость SMS

| Провайдер | Стоимость SMS | Минимум пополнения | Регистрация |
|-----------|---------------|-------------------|-------------|
| Exolve    | от 1.5₽       | 100₽              | Бесплатно   |
| SMSC.ru   | от 1.8₽       | 100₽              | Бесплатно   |
| SMS Aero  | от 1.8₽       | 200₽              | Бесплатно   |
| eSputnik  | от 2₽         | 500₽              | Бесплатно   |

## Безопасность

Webhook проверяет секрет от Supabase для защиты от несанкционированных запросов:
- Если `SUPABASE_SMS_SECRET` установлен, все запросы без правильного секрета будут отклонены
- Секрет проверяется в заголовках `x-supabase-secret`, `authorization` или в теле запроса

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
