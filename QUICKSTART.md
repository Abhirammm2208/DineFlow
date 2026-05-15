# 🚀 QUICK START GUIDE

## ⏱️ 5 Minute Setup

Follow these steps exactly to get DineFlow running.

---

## Step 1: Create Supabase Project (3 min)

### 1. Go to https://supabase.com
- Click "Start your project"
- Sign up with GitHub

### 2. Create a project
- Name: `dineflow`
- Choose nearest region
- Set a strong password
- Wait for creation (2 minutes)

### 3. Get your credentials
Settings → API → Copy:
- Project URL (e.g., `https://abc123.supabase.co`)
- Anon Key
- Service Role Key

### 4. Create database tables
1. Go to SQL Editor
2. New query
3. Copy entire content of: `backend/supabase-schema.sql`
4. Paste and click "Run"
5. Done! ✅

---

## Step 2: Update Backend Configuration (1 min)

### Update `backend/.env` file:

```env
SUPABASE_URL=https://YOUR_URL.supabase.co
SUPABASE_KEY=YOUR_ANON_KEY
SUPABASE_SECRET=YOUR_SERVICE_ROLE_KEY
PORT=3001
NODE_ENV=development
JWT_SECRET=dineflow_secret_key_123
FRONTEND_URL=http://localhost:5173
```

Replace YOUR_URL, YOUR_ANON_KEY, YOUR_SERVICE_ROLE_KEY with values from Supabase.

---

## Step 3: Start Backend (1 min)

```bash
cd backend
npm run dev
```

You should see:
```
🚀 DineFlow Backend running on http://localhost:3001
```

Keep this terminal open.

---

## Step 4: Start Frontend (1 min)

Open **new** terminal:

```bash
cd frontend
npm run dev
```

You should see:
```
➜  Local:   http://localhost:5173/
```

---

## Step 5: Create Your Account (1 min)

1. Open http://localhost:5173 in browser
2. Click **"Don't have an account? Sign up"**
3. Fill in:
   - Restaurant Name: **My Restaurant**
   - Email: **anything@email.com**
   - Phone: **+91 9876543210**
   - PIN: **1234** (remember this!)
4. Click **"Create Account"**

✅ **You're logged in!**

---

## 🎮 Now What?

### Add Some Menu Items
1. Click **"📊 Dashboard"** button
2. Go to **"Menu Management"** tab
3. Click **"Add Item"**
4. Add items:
   - Butter Chicken | 280 | Mains
   - Biryani | 320 | Rice
   - Naan | 50 | Breads

### Create Your First Bill
1. Click **"Back to POS"**
2. Click menu items to add to bill
3. Use +/- to adjust quantity
4. Click **"PUNCH BILL"**

✅ **First bill complete!**

---

## 📊 View Your Analytics
1. Click **"📊 Dashboard"**
2. See today's revenue
3. View customer history
4. Manage menu

---

## 🎉 You're Done!

### What You Have:
- ✅ Running POS System
- ✅ Real-time bill calculation
- ✅ Customer tracking
- ✅ Menu management
- ✅ Analytics dashboard
- ✅ Merchant PIN security

### Next (Optional):

**Add Notifications** (WhatsApp/SMS):
1. Get Twilio account at https://www.twilio.com
2. Copy credentials
3. Update `backend/.env` with Twilio keys
4. Restart backend
5. Customers will receive notifications!

**Deploy to Production**:
See `DEPLOYMENT.md` for Railway + Vercel setup

---

## ❌ Troubleshooting

### Can't connect to backend?
- Check backend is running: `npm run dev` shows `http://localhost:3001`
- Port 3001 might be in use - kill it or use different port

### Can't create account?
- Check Supabase `.env` values are correct
- Verify schema was created in Supabase SQL Editor
- Check browser console for errors (F12)

### No menu items showing?
- Go to Dashboard → Menu Management
- Click "Add Item" to create items first
- Then they'll appear on POS

### Bills not punching?
- Make sure items are in bill
- Check console for errors
- Verify customer is selected (optional)

---

## 📱 Access Points

- **POS System**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Database**: Supabase dashboard
- **Docs**: See README.md, API.md, SETUP.md

---

## 💡 Pro Tips

1. **Use PIN**: 1234 (what you set during signup)
2. **Phone Format**: 9876543210 (10 digits for India)
3. **Prices**: Use decimals (e.g., 280.50)
4. **Categories**: Create any categories you want
5. **Customers**: Phone is the unique identifier
6. **Points**: 1 point per ₹10 spent

---

## 🆘 Need Help?

1. **Check logs**
   - Backend: Terminal output
   - Frontend: Browser console (F12)
   - Supabase: Dashboard → Logs

2. **Verify setup**
   - Backend running? `npm run dev`
   - Frontend running? `npm run dev`
   - Supabase connected? Check .env
   - Schema created? Check Supabase SQL

3. **Read documentation**
   - SETUP.md - Detailed setup
   - README.md - Full guide
   - API.md - API reference
   - DEPLOYMENT.md - Deployment

---

## ✨ Features Overview

| Feature | Available |
|---------|-----------|
| POS Billing | ✅ |
| Menu Management | ✅ |
| Customer Search | ✅ |
| Analytics | ✅ |
| Points System | ✅ |
| Notifications | ✅* |
| Authentication | ✅ |
| Dark Mode | Soon |

\* Requires Twilio setup

---

## 🌐 When You're Ready to Deploy

See `DEPLOYMENT.md` for:
- Deploy backend to Railway (free tier)
- Deploy frontend to Vercel (free tier)
- Custom domain setup
- Production configuration

---

## 🎯 Summary

```
5 minutes → Full POS System
10 minutes → Add sample data
15 minutes → Ready to use
30 minutes → Deploy to production
```

**You're all set! Start processing bills!** 🍽️

---

*Need anything else? Check SETUP.md for detailed steps or README.md for full documentation.*
