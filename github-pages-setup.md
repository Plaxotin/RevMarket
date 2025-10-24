# 🚀 Настройка GitHub Pages с автоматическим деплоем

## 📋 Пошаговая инструкция:

### **Шаг 1: Настройка репозитория**

#### **1.1 ✅ Включите GitHub Pages:**
1. Перейдите в ваш репозиторий на GitHub
2. Нажмите **Settings** (вкладка справа)
3. Прокрутите вниз до раздела **Pages**
4. В разделе **Source** выберите:
   - **Source**: "GitHub Actions"
   - **Branch**: main
5. Нажмите **Save**

#### **1.2 ✅ Проверьте настройки:**
- Убедитесь, что репозиторий **публичный** (для бесплатного GitHub Pages)
- Или настройте **GitHub Pro** для приватных репозиториев

### **Шаг 2: Настройка переменных окружения**

#### **2.1 ✅ Создайте .env файл:**
```bash
# Создайте файл .env в корне проекта
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

#### **2.2 ✅ Добавьте в GitHub Secrets:**
1. Перейдите в **Settings** → **Secrets and variables** → **Actions**
2. Нажмите **New repository secret**
3. Добавьте:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: ваш Supabase URL
4. Добавьте:
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: ваш Supabase Anon Key

### **Шаг 3: Загрузка кода в репозиторий**

#### **3.1 ✅ Инициализируйте Git (если не сделано):**
```bash
git init
git add .
git commit -m "Initial commit"
```

#### **3.2 ✅ Подключите к GitHub:**
```bash
git remote add origin https://github.com/your-username/your-repo-name.git
git branch -M main
git push -u origin main
```

### **Шаг 4: Активация GitHub Action**

#### **4.1 ✅ После пуша кода:**
1. Перейдите в вкладку **Actions** в вашем репозитории
2. Вы увидите workflow "Deploy to GitHub Pages"
3. Нажмите на него и выберите **Run workflow**
4. Или просто сделайте новый коммит - workflow запустится автоматически

#### **4.2 ✅ Мониторинг деплоя:**
- Перейдите в **Actions** → **Deploy to GitHub Pages**
- Следите за прогрессом в реальном времени
- При ошибках - проверьте логи

### **Шаг 5: Проверка результата**

#### **5.1 ✅ URL сайта:**
После успешного деплоя ваш сайт будет доступен по адресу:
```
https://your-username.github.io/your-repo-name/
```

#### **5.2 ✅ Проверка работы:**
- Откройте URL в браузере
- Проверьте все страницы
- Убедитесь, что роутинг работает
- Проверьте авторизацию

## 🔧 Альтернативные варианты:

### **Вариант A: Простой деплой (рекомендуется)**
Используйте файл `.github/workflows/deploy-simple.yml`

### **Вариант B: Продвинутый деплой**
Используйте файл `.github/workflows/deploy.yml`

### **Вариант C: Ручной деплой**
1. Соберите проект: `npm run build`
2. Скопируйте содержимое `dist/` в корень репозитория
3. Зафиксируйте: `git add . && git commit -m "Deploy"`
4. Запушьте: `git push origin main`

## 🚨 Решение проблем:

### **Проблема 1: Build fails**
- Проверьте, что все зависимости установлены
- Убедитесь, что нет ошибок в коде
- Проверьте логи в GitHub Actions

### **Проблема 2: 404 ошибки**
- Убедитесь, что файлы `public/404.html` и `public/.nojekyll` созданы
- Проверьте настройки base path в `vite.config.ts`

### **Проблема 3: CSP ошибки**
- Проверьте настройки в `vercel.json`
- Убедитесь, что Supabase URL корректный

## 🎯 Результат:
После выполнения всех шагов ваш сайт будет автоматически деплоиться при каждом пуше в main ветку! 🚀✨
