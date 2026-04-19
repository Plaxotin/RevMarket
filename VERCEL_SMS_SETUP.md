# Инструкция: Настройка переменных окружения в Vercel для SMS Webhook

## Шаг 1: Вход в Vercel Dashboard

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Войдите в свой аккаунт
3. Найдите проект с SMS webhook (обычно это проект `sms-webhook` или основной проект, если webhook находится в подпапке)

## Шаг 2: Открытие настроек проекта

1. Нажмите на название вашего проекта
2. В верхнем меню выберите **Settings** (Настройки)
3. В левом боковом меню выберите **Environment Variables** (Переменные окружения)

## Шаг 3: Добавление переменных окружения

Для каждого проекта в Vercel можно настроить переменные для разных окружений:
- **Production** - для продакшена
- **Preview** - для preview-деплоев
- **Development** - для локальной разработки

Рекомендуется добавить переменные для **Production** и **Preview**.

### Переменные для SMSC.ru:

Нажмите кнопку **Add New** и добавьте следующие переменные:

#### 1. SMS_PROVIDER
- **Key (Ключ):** `SMS_PROVIDER`
- **Value (Значение):** `smsc`
- **Environment:** Выберите Production, Preview (можно выбрать оба)
- Нажмите **Save**

#### 2. SMSC_LOGIN
- **Key:** `SMSC_LOGIN`
- **Value:** `plaxotin` (ваш логин от SMSC.ru)
- **Environment:** Production, Preview
- Нажмите **Save**

#### 3. SMS_API_KEY
- **Key:** `SMS_API_KEY`
- **Value:** `a372324` (ваш пароль от SMSC.ru)
- **Environment:** Production, Preview
- ⚠️ **Важно:** Это чувствительные данные, они будут скрыты в интерфейсе
- Нажмите **Save**

#### 4. SMS_SENDER
- **Key:** `SMS_SENDER`
- **Value:** `РЕВЕРС МАРК`
- **Environment:** Production, Preview
- Нажмите **Save**

#### 5. SUPABASE_SMS_SECRET
- **Key:** `SUPABASE_SMS_SECRET`
- **Value:** `ваш_секрет_из_supabase` (получите в Supabase Dashboard → Authentication → Settings → Phone Auth → SMS Hook Secret)
- **Environment:** Production, Preview
- ⚠️ **Важно:** Это секретный ключ, он будет скрыт в интерфейсе
- Нажмите **Save**

## Шаг 4: Проверка переменных

После добавления всех переменных, вы должны увидеть список:

```
SMS_PROVIDER = smsc
SMSC_LOGIN = plaxotin
SMS_API_KEY = ••••••••• (скрыто)
SMS_SENDER = РЕВЕРС МАРК
SUPABASE_SMS_SECRET = ••••••••• (скрыто)
```

## Шаг 5: Перезапуск deployment (если нужно)

Если webhook уже развернут:

1. Перейдите на вкладку **Deployments**
2. Найдите последний deployment
3. Нажмите на три точки (⋮) справа от deployment
4. Выберите **Redeploy**
5. Подтвердите перезапуск

Или просто сделайте новый commit и push - Vercel автоматически создаст новый deployment с обновленными переменными.

## Шаг 6: Проверка работы

После настройки переменных:

1. Проверьте логи deployment в Vercel:
   - Перейдите в **Deployments** → выберите deployment → **Functions** → `api/send-sms`
   - Проверьте, нет ли ошибок при инициализации

2. Протестируйте отправку SMS:
   - Откройте ваше приложение
   - Попробуйте авторизоваться по SMS
   - Проверьте логи в Vercel на наличие запросов

## Важные замечания

### Безопасность:
- ✅ Никогда не коммитьте переменные окружения в Git
- ✅ Используйте разные секреты для Production и Development
- ✅ Регулярно обновляйте пароли и секреты

### Если webhook не работает:
1. Проверьте, что все переменные добавлены правильно
2. Проверьте, что выбраны правильные окружения (Production/Preview)
3. Проверьте логи deployment в Vercel
4. Убедитесь, что webhook развернут и доступен по URL

### Структура проекта:

Если ваш webhook находится в подпапке `sms-webhook/`:

1. Убедитесь, что в Vercel настроен правильный **Root Directory**
2. Или создайте отдельный проект Vercel для webhook
3. Или используйте **Monorepo** настройки в Vercel

## Альтернативный способ: через Vercel CLI

Если вы предпочитаете командную строку:

```bash
# Установите Vercel CLI (если еще не установлен)
npm install -g vercel

# Войдите в аккаунт
vercel login

# Перейдите в папку с webhook
cd sms-webhook

# Добавьте переменные
vercel env add SMS_PROVIDER production
# Введите: smsc

vercel env add SMSC_LOGIN production
# Введите: plaxotin

vercel env add SMS_API_KEY production
# Введите: a372324

vercel env add SMS_SENDER production
# Введите: РЕВЕРС МАРК

vercel env add SUPABASE_SMS_SECRET production
# Введите: ваш_секрет_из_supabase
```

## Полный список переменных для копирования

Для быстрой настройки, вот все переменные, которые нужно добавить:

| Ключ | Значение | Описание |
|------|----------|----------|
| `SMS_PROVIDER` | `smsc` | Провайдер SMS |
| `SMSC_LOGIN` | `plaxotin` | Логин от SMSC.ru |
| `SMS_API_KEY` | `a372324` | Пароль от SMSC.ru |
| `SMS_SENDER` | `РЕВЕРС МАРК` | Имя отправителя |
| `SUPABASE_SMS_SECRET` | `ваш_секрет` | Секрет из Supabase |

## Следующие шаги

После настройки переменных в Vercel:

1. ✅ Настройте Supabase webhook (см. `SUPABASE_SMS_SETUP.md`)
2. ✅ Протестируйте отправку SMS
3. ✅ Проверьте логи в Vercel и Supabase
4. ✅ Убедитесь, что SMS доставляются корректно

## Полезные ссылки

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Supabase SMS Setup Guide](./SUPABASE_SMS_SETUP.md)




