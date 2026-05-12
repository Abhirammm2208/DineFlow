# DineFlow

A full-stack restaurant POS and CRM system built with React + Vite (frontend) and Express + TypeScript (backend), backed by Supabase (PostgreSQL).

## Tech Stack

- **Frontend** — React 18, TypeScript, Vite, TailwindCSS, Zustand, React Router
- **Backend** — Node.js, Express, TypeScript
- **Database** — Supabase (PostgreSQL)
- **Auth** — PIN-based login + JWT
- **Email** — Resend SDK (`noreply@abhiram.codes`)
- **Telegram** — Bot API for instant bill notifications
- **AI** — Google Gemini for campaign copy generation
- **Deployment** — Railway (backend) + Vercel (frontend)

## Features

- **POS** — Bill punching, menu management, table/order type, order success screen
- **Dashboard** — Today's revenue, bills, returning customers %, avg order value
- **Customers** — CRM with visit history, spend, loyalty points, segments (VIP/at-risk)
- **Loyalty** — Configurable points-per-rupee, tier thresholds, redemption
- **Campaigns** — AI-generated messages, send to customer segments via email
- **Analytics** — Revenue trends, top items, customer behaviour charts
- **Notifications** — Email + Telegram fired non-blocking on every bill punch

## Project Structure

```
DineFlow/
├── frontend/
│   └── src/
│       ├── pages/          # LoginPage, POSPage, DashboardPage, CustomersPage,
│       │                   # LoyaltyPage, CampaignsPage, AnalyticsPage, SettingsPage
│       ├── components/     # Button, Card, Input, Alert, AppShell layout
│       ├── store/          # Zustand store (token, merchant info)
│       └── services/       # Axios API client (api.ts)
│
└── backend/
    └── src/
        ├── routes/         # merchants, menu, customers, bills, dashboard,
        │                   # loyalty, campaigns, analytics, ai, search, telegram
        ├── services/       # notificationService.ts, campaignScheduler.ts
        ├── middleware/     # authMiddleware (JWT verify)
        └── utils/          # supabase client, auth helpers
```

## Local Setup

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_secret

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SECRET=your_service_role_key

RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=DineFlow Billing

TELEGRAM_BOT_TOKEN=your_bot_token

GEMINI_API_KEY=your_gemini_key
```

```bash
npm run dev   # starts on http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001
```

```bash
npm run dev   # starts on http://localhost:5173
```

## Deployment

### Backend → Railway

- Root directory: `backend`
- Build command: `npm run build`
- Start command: `node dist/index.js`
- Add all env vars from `.env` above

### Frontend → Vercel

- Root directory: `frontend`
- Framework: Vite
- Add env var: `VITE_API_URL=https://your-railway-url.up.railway.app`

## Environment Variables (Railway)

| Key | Description |
|-----|-------------|
| `PORT` | Set automatically by Railway |
| `FRONTEND_URL` | Vercel frontend URL |
| `JWT_SECRET` | Random secret string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon key |
| `SUPABASE_SECRET` | Supabase service role key |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender email |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `GEMINI_API_KEY` | Google Gemini API key |
| `TZ` | `Asia/Kolkata` |
