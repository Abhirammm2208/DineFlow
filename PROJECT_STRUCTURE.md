# DineFlow — Project Structure

## Repository Root

```
DineFlow/
├── backend/
├── frontend/
├── README.md
├── INTERVIEW_DOC.md
├── PROJECT_STRUCTURE.md
└── .gitignore
```

---

## Backend (`backend/`)

```
backend/
├── src/
│   ├── index.ts                  ← Express app entry point
│   ├── routes/
│   │   ├── merchants.ts          ← Register, login, profile
│   │   ├── menu.ts               ← CRUD for menu items + image upload
│   │   ├── customers.ts          ← CRM — search, create, update, segments
│   │   ├── bills.ts              ← Create bill, punch bill, export CSV
│   │   ├── dashboard.ts          ← Stats, top customers, at-risk, live revenue
│   │   ├── analytics.ts          ← Revenue trends, top items charts
│   │   ├── loyalty.ts            ← Settings, tiers, points redemption
│   │   ├── campaigns.ts          ← Create, list, send campaigns
│   │   ├── ai.ts                 ← Gemini AI campaign copy generation
│   │   ├── search.ts             ← Global search across menu + customers
│   │   ├── telegram.ts           ← Telegram webhook/setup helpers
│   │   ├── v1Catalog.ts          ← Table management (dine-in)
│   │   └── testEmail.ts          ← Manual email test trigger
│   ├── services/
│   │   ├── notificationService.ts ← Email (Resend) + Telegram notifications
│   │   └── campaignScheduler.ts   ← Hourly campaign send scheduler
│   ├── middleware/
│   │   └── authMiddleware.ts     ← JWT verification, attaches merchantId
│   └── utils/
│       ├── supabase.ts           ← Supabase client (anon + service role)
│       └── auth.ts               ← bcrypt PIN hash/compare, JWT sign/verify
├── .env                          ← Local env vars (gitignored)
├── .gitignore
├── package.json
├── tsconfig.json
└── nixpacks.toml                 ← Railway build config
```

### Key Backend Files

| File | What it does |
|------|-------------|
| `index.ts` | Bootstraps Express, sets `TZ=Asia/Kolkata`, registers all routes, CORS config |
| `routes/bills.ts` | Core billing logic — creates bill, on punch: updates customer points, fires notifications non-blocking |
| `services/notificationService.ts` | Sends email via Resend SDK and Telegram via Bot API; both read env vars at call time |
| `services/campaignScheduler.ts` | Polls every hour for due campaigns, sends emails to target segment |
| `middleware/authMiddleware.ts` | Verifies JWT Bearer token, extracts `merchantId` into `req.merchantId` |
| `utils/supabase.ts` | Two clients: anon key (RLS-respecting) and service role key (admin) |
| `nixpacks.toml` | Forces Railway to run `npm run build` (tsc) before starting the server |

---

## Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── main.tsx                  ← React app entry point
│   ├── App.tsx                   ← Router with ProtectedRoute guard
│   ├── pages/
│   │   ├── LoginPage.tsx         ← PIN-based merchant login
│   │   ├── POSPage.tsx           ← Main POS — menu, cart, bill punch
│   │   ├── OrderSuccessPage.tsx  ← Post-punch confirmation screen
│   │   ├── DashboardPage.tsx     ← Revenue, bills, KPI cards
│   │   ├── CustomersPage.tsx     ← CRM table, filters, customer detail
│   │   ├── LoyaltyPage.tsx       ← Points config, tiers, redemption
│   │   ├── CampaignsPage.tsx     ← Create/send campaigns, AI generate
│   │   ├── AnalyticsPage.tsx     ← Charts for revenue + items
│   │   └── SettingsPage.tsx      ← Merchant profile, tax rate, table config
│   ├── components/
│   │   ├── Button.tsx            ← Primary/secondary/danger variants
│   │   ├── Card.tsx              ← df-card wrapper
│   │   ├── Input.tsx             ← Styled input with label
│   │   ├── Alert.tsx             ← Success/error banners
│   │   └── layout/
│   │       └── AppShell.tsx      ← Sidebar nav + header shell
│   ├── services/
│   │   └── api.ts                ← Axios client; attaches JWT to every request
│   ├── store/
│   │   └── store.ts              ← Zustand store (token + merchant, persisted)
│   ├── index.css                 ← Global styles + Tailwind directives
│   └── design-system.css         ← Custom design tokens (df-card, etc.)
├── vercel.json                   ← SPA rewrite (all routes → index.html)
├── vite.config.ts                ← Proxy /api → backend in dev, chunk limit
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### Key Frontend Files

| File | What it does |
|------|-------------|
| `App.tsx` | Defines all routes; `ProtectedRoute` redirects to `/login` if no JWT token |
| `pages/POSPage.tsx` | Largest file — menu grid, cart management, customer search, bill creation + punch |
| `services/api.ts` | Single Axios instance; `VITE_API_URL` as base URL; JWT injected via request interceptor |
| `store/store.ts` | Zustand store persisted to localStorage — survives page refresh |
| `vercel.json` | `{"rewrites":[{"source":"/(.*)", "destination":"/index.html"}]}` — fixes 404 on refresh |
| `vite.config.ts` | Dev proxy: `/api` → `http://localhost:3001`; `chunkSizeWarningLimit: 1000` |

---

## Data Flow

```
User action (e.g. Punch Bill)
    ↓
POSPage.tsx → api.ts (POST /api/bills/:id/punch)
    ↓
authMiddleware.ts → verifies JWT
    ↓
bills.ts route → updates Supabase (bill status, customer points)
    ↓ (non-blocking, no await)
notificationService.ts
    ├── Resend SDK → email to customer
    └── Telegram Bot API → message to customer's chat
    ↓
Response 200 returned to frontend immediately
```

---

## Deployment

| Service | Platform | Config |
|---------|----------|--------|
| Frontend | Vercel | Root: `frontend`, framework: Vite |
| Backend | Railway | Root: `backend`, `nixpacks.toml` enforces build |
| Database | Supabase | Managed PostgreSQL, accessed via SDK |
| Email | Resend | HTTPS API, domain `abhiram.codes` verified |
| Telegram | Bot API | HTTPS, no port restrictions |
