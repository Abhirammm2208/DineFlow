# DineFlow — Deployment Guide

## Stack
| Layer | Platform | URL pattern |
|---|---|---|
| Frontend (React/Vite) | Vercel | `https://dineflow.vercel.app` |
| Backend (Node/Express) | Railway | `https://dineflow-backend.up.railway.app` |
| Database | Supabase | already live |

---

## Prerequisites
- [ ] Code pushed to a GitHub repository
- [ ] Supabase project is live with all migrations run
- [ ] Railway account at https://railway.app
- [ ] Vercel account at https://vercel.com

---

## Step 1 — Push to GitHub

```bash
git init          # skip if already a git repo
git add .
git commit -m "deploy: initial"
git remote add origin https://github.com/YOUR_USERNAME/dineflow.git
git push -u origin main
```

---

## Step 2 — Deploy Backend on Railway

1. Go to https://railway.app → **New Project** → **Deploy from GitHub repo**
2. Select your `dineflow` repo
3. When asked for root directory → set to **`backend`**
4. Railway auto-detects Node.js and runs `npm run build && npm run start`

### Environment Variables to add in Railway dashboard:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://dineflow.vercel.app      ← set after Vercel deploy
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=you@gmail.com
SMTP_FROM_NAME=DineFlow Billing
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
GEMINI_API_KEY=your-gemini-api-key            ← optional
OPENAI_API_KEY=your-openai-api-key            ← optional
```

5. Click **Deploy** — wait ~2 min
6. Copy the Railway public URL: `https://xxxx.up.railway.app`

---

## Step 3 — Deploy Frontend on Vercel

1. Go to https://vercel.com → **Add New Project** → Import GitHub repo
2. Set **Root Directory** to `frontend`
3. Framework preset: **Vite** (auto-detected)

### Environment Variables to add in Vercel dashboard:
```
VITE_API_URL=https://xxxx.up.railway.app      ← your Railway URL from Step 2
```

4. Click **Deploy** — wait ~1 min
5. Copy the Vercel URL: `https://dineflow.vercel.app`

---

## Step 4 — Wire them together

1. Go back to **Railway dashboard** → your backend service → Variables
2. Update `FRONTEND_URL` to your actual Vercel URL:
   ```
   FRONTEND_URL=https://dineflow.vercel.app
   ```
3. Railway will auto-redeploy with the updated CORS origin

---

## Step 5 — Verify

Open your Vercel URL and check:
- [ ] Login page loads
- [ ] Can log in with merchant credentials
- [ ] POS page loads menu items
- [ ] Dashboard shows stats
- [ ] Can punch a bill
- [ ] Email notification sends on bill punch
- [ ] Campaigns page works
- [ ] Analytics page shows revenue chart

---

## Troubleshooting

**CORS error in browser console:**
→ Check `FRONTEND_URL` in Railway matches your Vercel URL exactly (no trailing slash)

**API calls return 404:**
→ Check `VITE_API_URL` in Vercel matches your Railway URL exactly (no trailing slash)

**Backend crashes on Railway:**
→ Check Railway logs → most likely a missing env variable

**Images not loading after upload:**
→ Base64 images are stored in Supabase DB directly — should work out of the box

---

## Re-deploying after code changes

Both platforms auto-deploy on every `git push` to `main` once connected.

```bash
git add .
git commit -m "fix: your change description"
git push
```

Railway and Vercel will pick it up automatically within ~2 minutes.
