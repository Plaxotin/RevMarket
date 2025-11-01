# План добавления YandexGPT классификатора

## Шаг 1: Получение доступа к Yandex Cloud GPT API

### Необходимые действия:
1. **Регистрация в Yandex Cloud**
   - Перейти на https://console.cloud.yandex.ru
   - Зарегистрировать аккаунт или войти
   - Создать или выбрать каталог (folder)

2. **Активация сервиса AI Foundation Models**
   - В консоли Yandex Cloud перейти в раздел "AI Foundation Models"
   - Активировать YandexGPT (может требовать пополнения счета)

3. **Создание сервисного аккаунта и API ключа**
   - Создать сервисный аккаунт с ролью `ai.editor`
   - Сгенерировать API-ключ для аутентификации
   - Сохранить API-ключ и ID каталога (folder ID)

### Документация:
- https://yandex.cloud/ru/docs/foundation-models/concepts/yandexgpt/
- https://yandex.cloud/ru/docs/foundation-models/api-ref/

---

## Шаг 2: Создание Supabase Edge Function

### Установка Supabase CLI
```bash
npm install -g supabase
```

### Авторизация
```bash
supabase login
supabase link --project-ref acolxrqnxpvhalzdflds
```

### Создание функции
```bash
supabase functions new classify-category
```

### Структура Edge Function:
```
supabase/functions/classify-category/
├── index.ts (основной код функции)
└── README.md (документация)
```

### Пример кода Edge Function:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const YANDEX_GPT_API_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"

serve(async (req) => {
  // CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, description } = await req.json()

    // Получаем переменные окружения
    const yandexApiKey = Deno.env.get('YANDEX_GPT_API_KEY')
    const yandexFolderId = Deno.env.get('YANDEX_FOLDER_ID')

    if (!yandexApiKey || !yandexFolderId) {
      throw new Error('Missing Yandex GPT credentials')
    }

    // Вызов YandexGPT API
    const response = await fetch(YANDEX_GPT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${yandexApiKey}`,
        'x-folder-id': yandexFolderId
      },
      body: JSON.stringify({
        modelUri: `gcr://${yandexFolderId}/yandexgpt/latest`,
        completionOptions: {
          temperature: 0.3,
          maxTokens: 50
        },
        messages: [
          {
            role: 'system',
            text: 'Ты классификатор объявлений для маркетплейса. Выбери ТОЛЬКО ОДНУ категорию из списка: Электроника, Дизайн, Мебель, Образование, Авто, Одежда и аксессуары, Хобби и отдых, Животные, Запчасти, Детские товары, Недвижимость, Красота и здоровье, Услуги, Другое. Отвечай ТОЛЬКО названием категории без дополнительных комментариев.'
          },
          {
            role: 'user',
            text: `Название: "${title}"\n\nОписание: "${description || 'Нет описания'}"\n\nКатегория:`
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('YandexGPT API error:', errorData)
      throw new Error(`YandexGPT API error: ${response.status}`)
    }

    const data = await response.json()
    const category = data.result?.alternatives?.[0]?.message?.text?.trim()

    return new Response(
      JSON.stringify({ category }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
```

### Создание helper файла для CORS:
```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

---

## Шаг 3: Настройка переменных окружения

### В Supabase Dashboard:
1. Открыть Dashboard: https://supabase.com/dashboard
2. Выбрать проект: `acolxrqnxpvhalzdflds`
3. Перейти в Settings → Edge Functions → Secrets
4. Добавить секреты:
   - `YANDEX_GPT_API_KEY`: ваш API-ключ от Yandex Cloud
   - `YANDEX_FOLDER_ID`: ID вашего каталога в Yandex Cloud

---

## Шаг 4: Деплой Edge Function

```bash
cd supabase/functions/classify-category
supabase functions deploy classify-category
```

---

## Шаг 5: Создание утилиты в клиенте

### Файл: `src/utils/yandexGPTClassifier.ts`
```typescript
import { supabase } from '@/integrations/supabase/client'

export const classifyWithYandexGPT = async (
  title: string, 
  description: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('classify-category', {
      body: { title, description }
    })

    if (error) {
      console.error('Error calling Edge Function:', error)
      return ''
    }

    return data?.category || ''
  } catch (error) {
    console.error('Error in classifyWithYandexGPT:', error)
    return ''
  }
}
```

---

## Шаг 6: Интеграция в AuthCreateRequest.tsx

### Изменения:
1. Импортировать утилиту
2. Добавить вызов классификатора при изменении title/description
3. Автоматически устанавливать категорию если она пустая

```typescript
// ... imports
import { classifyWithYandexGPT } from '@/utils/yandexGPTClassifier'

// ... component
const handleTitleChange = async (value: string) => {
  setRequestData(prev => ({ ...prev, title: value }))
  
  // Авто-определение категории если она пустая
  if (!requestData.category && requestData.description) {
    const detected = await classifyWithYandexGPT(value, requestData.description)
    if (detected) {
      setRequestData(prev => ({ ...prev, category: detected }))
    }
  }
}

const handleDescriptionChange = async (value: string) => {
  const lines = value.split('\n');
  if (lines.length <= 5) {
    setRequestData(prev => ({ ...prev, description: value }))
  }
  
  // Авто-определение категории если она пустая
  if (!requestData.category && requestData.title) {
    const detected = await classifyWithYandexGPT(requestData.title, value)
    if (detected) {
      setRequestData(prev => ({ ...prev, category: detected }))
    }
  }
}
```

---

## Шаг 7: Тестирование

### Тестовые сценарии:
1. **Простой тест**: "Ищу iPhone 15 Pro" → Электроника
2. **Неоднозначный тест**: "Куртка для бега" → может быть Одежда или Хобби
3. **Пустой ввод**: должен обрабатываться корректно
4. **Ошибка API**: должен показывать fallback

### Ожидаемое поведение:
- Категория определяется автоматически после ввода title/description
- Если пользователь вручную выбрал категорию, авто-определение не перезаписывает
- Показывается индикатор загрузки во время определения
- Ошибки обрабатываются gracefully

---

## Шаг 8: Оптимизация и улучшения

### Возможные улучшения:
1. **Кэширование результатов** в localStorage
2. **Debounce** при вводе текста (не вызывать API на каждый символ)
3. **Показ уверенности модели** (confidence score)
4. **A/B тестирование** - сравнение качества с keyword-based подходом
5. **Логирование** правильных/неправильных классификаций для улучшения промпта

---

## Стоимость и лимиты

### Yandex Cloud цены:
- YandexGPT Lite: ~1000 руб/1M токенов
- YandexGPT Pro: ~1500 руб/1M токенов

### Расчет для классификации:
- Один запрос: ~100-200 токенов (ввод + вывод)
- 1000 классификаций = 200,000 токенов = 200-300 руб
- Дешевле чем OpenAI примерно в 2 раза

---

## Альтернативные варианты

### Если YandexGPT не подходит:

1. **OpenAI GPT-3.5-turbo**
   - Дешевле и проще интеграция
   - Работает из браузера напрямую (через CORS)

2. **YandexGPT через прямое API**
   - Без Supabase Edge Function
   - Но нужно решить проблему с CORS

3. **Serverless функции (Vercel/Netlify)**
   - Альтернатива Supabase Edge Functions
   - Проще деплой

---

## Чеклист перед запуском в продакшн

- [ ] Получены API ключи Yandex Cloud
- [ ] Создана и задеплоена Edge Function
- [ ] Настроены секреты в Supabase
- [ ] Протестирована классификация на 20+ примерах
- [ ] Добавлена обработка ошибок
- [ ] Добавлен debounce при вводе
- [ ] Настроен мониторинг ошибок
- [ ] Проверена стоимость на тестовой нагрузке
- [ ] Добавлены логи для анализа качества

