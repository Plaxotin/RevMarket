# 🚀 Инструкция для деплоя на GitHub Pages

## ✅ Исправления для GitHub Pages:

### 1. ✅ Base path исправлен:
- `vite.config.ts`: base path изменен на `/need-it-find-it-main/`
- `public/404.html`: pathSegmentsToKeep = 1
- `index.html`: относительные пути к скриптам

### 2. ✅ Файлы для GitHub Pages:
- `public/.nojekyll` - отключает Jekyll
- `public/404.html` - SPA роутинг
- `public/_redirects` - Netlify редиректы

### 3. ✅ Настройки:
- Удален конфликтующий `bun.lockb`
- Используется только `npm` и `package-lock.json`

## 🚀 Следующие шаги:

### 1. ✅ В GitHub репозитории:
- Settings → Pages
- Source: Deploy from a branch
- Branch: main
- Folder: / (root)

### 2. ✅ Создайте GitHub Action:
Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v4
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### 3. ✅ Альтернатива - ручной деплой:
1. Соберите проект локально: `npm run build`
2. Скопируйте содержимое папки `dist/` в корень репозитория
3. Зафиксируйте изменения: `git add . && git commit -m "Deploy"`
4. Запушьте: `git push origin main`

## 🎯 Результат:
- ✅ Сайт будет доступен по адресу: `https://username.github.io/need-it-find-it-main/`
- ✅ Все маршруты будут работать
- ✅ SPA роутинг настроен
- ✅ CSP ошибки исправлены
