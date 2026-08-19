# Fleet App

Logistics platform API for truck drivers: route points, instructions, reviews, companies, RBAC, activity, and chat. Includes an AI layer (OpenAI + Pinecone) for documents/rules, Mapbox, Firebase, and a Telegram bot.

## Stack

Node.js, TypeScript, Express, Prisma, PostgreSQL, OpenAI, Pinecone, Mapbox, Firebase, Telegram Bot API, Swagger, PM2  
Admin: React, Vite, TanStack Query, Tailwind CSS, Recharts

## Setup

```bash
cp .env.example .env
npm install
npx prisma generate
npm --prefix admin install
npm run admin:build
npm run dev
```

Admin UI: `http://localhost:8000/admin` (dev UI: `npm run admin:dev`)
