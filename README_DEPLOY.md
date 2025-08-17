Быстрый деплой

API (Render):
1. Залогинься на render.com и создай новый Web Service из репозитория
2. Укажи `Root Directory: apps/server`
3. Build Command: `npm ci --ignore-scripts && npm run build`
4. Start Command: `npm start`
5. Env vars: `NODE_VERSION=20`, `BOT_TOKEN=<токен бота>`
6. После деплоя получишь URL вида `https://speen-api.onrender.com`

Frontend (Vercel):
1. Залогинься на vercel.com → New Project → Import repo → `Root Directory: apps/web`
2. Build Command: `npm run build`
3. Output Dir: `dist`
4. Env var: `VITE_API_URL=https://speen-api.onrender.com`
5. После деплоя получишь URL вида `https://speen-web.vercel.app`

BotFather:
1. /setdomain — можно указать домен API при необходимости
2. Привяжи Web App к кнопке: добавь URL фронтенда `https://speen-web.vercel.app`






