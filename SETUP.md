# 🎯 DineFlow - Complete Setup Guide

Welcome to DineFlow! This guide will walk you through everything needed to get your restaurant POS system up and running.

## ⏱️ Estimated Setup Time: 15-20 minutes

---

## 📋 What You'll Get

✅ **POS Dashboard** - Fast bill creation with real-time totals
✅ **Customer Management** - Search and create customers
✅ **Menu System** - Manage items by category
✅ **Merchant Dashboard** - View analytics and statistics
✅ **WhatsApp/SMS Notifications** - Automatic customer alerts
✅ **Points System** - Loyalty program built-in
✅ **Production Ready** - Deploy to Railway + Vercel

---

## 🔧 Prerequisites

Before starting, you'll need:

1. **Node.js 18+** - Download from https://nodejs.org
2. **Supabase Account** - Free at https://supabase.com
3. **Git** - For version control
4. **Text Editor** - VS Code recommended

---

## 📝 Step 1: Create Supabase Project

### 1.1 Create Account
- Go to https://supabase.com and click "Start your project"
- Sign up with GitHub (easiest option)
- Create organization (or use default)

### 1.2 Create Project
- Click "New project"
- Choose project name: `dineflow`
- Choose region closest to you
- Create a strong database password
- Wait for project creation (2-3 minutes)

### 1.3 Get API Credentials
Once project is ready:
1. Click Settings (gear icon) → API
2. You'll see two keys:
   - **Anon Key** (public) - Copy this
   - **Service Role Key** (secret) - Copy this
3. Also copy the **Project URL** at the top (e.g., `https://abc123.supabase.co`)

### 1.4 Create Database Schema
1. Go to **SQL Editor** tab
2. Click "New query"
3. Open the file `backend/supabase-schema.sql` from this project
4. Copy the entire content
5. Paste into Supabase query editor
6. Click "Run" (or Cmd+Enter)
7. You should see "Success" - the database is ready!

---

## 🔑 Step 2: Configure Backend

### 2.1 Update Environment Variables

Open `backend/.env` file and update:

```env
SUPABASE_URL=https://abc123.supabase.co
SUPABASE_KEY=your_anon_public_key_here
SUPABASE_SECRET=your_service_role_key_here
PORT=3001
NODE_ENV=development
JWT_SECRET=dineflow_secret_change_me_in_production
FRONTEND_URL=http://localhost:5173
```

### 2.2 Install Dependencies

```bash
cd backend
npm install
```

### 2.3 Start Backend Server

```bash
npm run dev
```

You should see:
```
🚀 DineFlow Backend running on http://localhost:3001
```

✅ **Backend is ready!**

---

## 🎨 Step 3: Configure Frontend

### 3.1 Install Dependencies

Open new terminal:

```bash
cd frontend
npm install
```

### 3.2 Start Frontend Server

```bash
npm run dev
```

You should see:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

✅ **Frontend is ready!**

---

## 🚀 Step 4: Create Your First Merchant Account

1. Open http://localhost:5173 in your browser
2. You should see the DineFlow login page
3. Click "Don't have an account? Sign up"
4. Fill in the form:
   ```
   Restaurant Name: My Restaurant
   Email: owner@myrestaurant.com
   Phone: +91 9876543210
   PIN: 1234 (any 4 digits you remember)
   ```
5. Click "Create Account"
6. You're now logged in to the POS system! 🎉

---

## 📱 Step 5: Add Your First Menu Items

### 5.1 Go to Dashboard
From the POS screen, click the **📊 Dashboard** button

### 5.2 Go to Menu Management
Click the "Menu Management" tab

### 5.3 Add Items
Click "Add Item" and fill in:

**Item 1:**
```
Name: Butter Chicken
Price: 280
Category: Curries
```

**Item 2:**
```
Name: Biryani
Price: 320
Category: Rice
```

**Item 3:**
```
Name: Naan
Price: 50
Category: Breads
```

Try adding 5-10 items across different categories.

---

## 💳 Step 6: Create Your First Bill

### 6.1 Go Back to POS
Click "Back to POS" button

### 6.2 Create a New Customer (Optional)
1. Enter phone number: 9876543210
2. Click search icon
3. Click "Add New Customer"
4. Name: John Doe (can be any name)

### 6.3 Add Items to Bill
Click on menu items to add them:
- Click "Butter Chicken" → added to bill
- Click "Naan" → added to bill
- Adjust quantities using +/- buttons

### 6.4 Punch the Bill
You should see the running total on the right panel.
Click the big green **PUNCH BILL** button.

✅ You just processed your first transaction!

---

## 📊 Step 7: Check Your Dashboard

Go to Dashboard again:
- **Overview Tab**: Shows today's revenue, transactions, average bill
- **Top Customers Tab**: Shows customer visit history and spending
- **Menu Management Tab**: Manage your menu items

Congratulations! Your POS system is fully functional! 🎉

---

## 🔔 Step 8: Setup WhatsApp/SMS Notifications (Optional)

To enable customer notifications:

### 8.1 Create Twilio Account
1. Go to https://www.twilio.com
2. Sign up (free trial with $15 credit)
3. Go to Console → Account SID and Auth Token
4. Copy both

### 8.2 Get Twilio Numbers
1. In Twilio dashboard, go to Phone Numbers
2. Get a **SMS number** (e.g., +1234567890)
3. Get a **WhatsApp number** (sandbox or production)

### 8.3 Update Backend .env
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

### 8.4 Restart Backend
Press Ctrl+C and run `npm run dev` again

### 8.5 Test Notifications
Create a new bill and customers will receive WhatsApp/SMS!

---

## 🌐 Deploy to Production (Optional)

When you're ready to go live:

1. **Backend → Railway** (See `DEPLOYMENT.md`)
2. **Frontend → Vercel** (See `DEPLOYMENT.md`)
3. **Domain Setup** (See `DEPLOYMENT.md`)

---

## 🎮 Common Actions

### Add a Menu Category
Menu items are organized by category. When adding items, create new categories as needed (e.g., "Appetizers", "Mains", "Desserts")

### Search for Returning Customer
POS Dashboard → Enter phone number → Click search icon → Details auto-fill

### View All Customers
Dashboard → Top Customers tab (sorted by visits)

### Change PIN
Contact support (currently manual in database)

### Backup Data
Supabase automatically backs up. Manual backups in Supabase dashboard → Settings → Backups

---

## 📚 Project Structure

```
DineFlow/
├── frontend/          # React app - runs on port 5173
│   └── src/
│       ├── pages/     # Login, POS, Dashboard
│       ├── store/     # Zustand state
│       └── services/  # API calls
│
├── backend/           # Express API - runs on port 3001
│   └── src/
│       ├── routes/    # Endpoints
│       ├── services/  # Notifications
│       └── utils/     # Database helpers
│
└── README.md          # Full documentation
```

---

## 🛠️ Useful Commands

```bash
# Backend
cd backend
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Run compiled production code

# Frontend
cd frontend
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build locally
```

---

## ⚠️ Important Notes

1. **PIN System**: PINs are 4 digits, hashed with bcryptjs
2. **Points**: 1 point per ₹10 spent
3. **API URL**: Frontend proxies to `http://localhost:3001/api`
4. **Database**: All data in Supabase PostgreSQL
5. **Security**: Never share `.env` files publicly

---

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install
```

### "Port 3001 already in use"
```bash
# Kill the process or use different port
PORT=3002 npm run dev
```

### "Supabase connection refused"
- Check URL and keys in `.env`
- Verify schema was created
- Check Supabase project status

### "Frontend shows blank page"
- Open browser console (F12) for errors
- Check network tab to see if API is responding
- Verify backend is running on port 3001

### Menu items not loading
- Go to Dashboard → Menu Management
- Add at least one item first
- Refresh POS page

---

## 📞 Getting Help

If something doesn't work:

1. **Check the console**
   - Browser: F12 → Console tab
   - Terminal: Look for error messages

2. **Verify setup**
   - Backend running: http://localhost:3001/api/health
   - Frontend running: http://localhost:5173
   - Supabase schema created

3. **Check logs**
   - Supabase: Dashboard → Logs
   - Backend: Terminal output
   - Frontend: Browser console

---

## 🎓 Next Steps

1. ✅ Setup complete - start using the system!
2. 📊 Explore Dashboard features
3. 🔔 Setup notifications (optional)
4. 🌐 Deploy to production (optional)
5. 🚀 Customize for your restaurant

---

## 🎉 You're Ready!

Your DineFlow POS system is now ready to use. Start managing your restaurant efficiently!

- **POS Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Database**: Supabase Console

**Happy selling! 🍽️**

---

*For more details, see README.md and DEPLOYMENT.md*
