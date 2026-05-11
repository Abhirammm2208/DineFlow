# DineFlow - Smart POS System 🍽️

A modern, full-stack Point of Sale system built for restaurants with real-time customer notifications, menu management, and detailed analytics.

## 📋 Features

### POS Dashboard
- ✅ **Menu Management** - Add/Edit/Delete menu items with categories
- ✅ **Bill Creation** - Quick bill punching with live total calculation
- ✅ **Customer Search** - Search customers by phone number
- ✅ **New Customer Creation** - Quickly add returning customers
- ✅ **Bill Punch** - Complete transactions and trigger notifications

### Merchant Dashboard
- ✅ **Daily Analytics** - Revenue, transaction count, average bill value
- ✅ **Customer List** - View top customers by visits with lifetime spend
- ✅ **Menu Management** - Full CRUD operations for menu items
- ✅ **Points System** - Automatic points allocation (1 point per ₹10)

### Notifications
- ✅ **WhatsApp Messages** - Send transaction confirmations via WhatsApp
- ✅ **SMS Backup** - SMS notifications as fallback
- ✅ **Twilio Integration** - Ready for production setup

### Authentication
- ✅ **Merchant PIN System** - Simple 4-digit PIN authentication
- ✅ **Secure Tokens** - JWT-based session management
- ✅ **Merchant Accounts** - Create and manage merchant profiles

---

## 🏗️ Project Structure

```
DineFlow/
├── frontend/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/           # Login, POS, Dashboard pages
│   │   ├── store/           # Zustand state management
│   │   ├── services/        # API client
│   │   ├── components/      # Reusable UI components
│   │   └── App.tsx          # Main router
│   ├── vite.config.ts       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS config
│   └── package.json
│
└── backend/                  # Node.js + Express + TypeScript
    ├── src/
    │   ├── routes/          # API endpoints
    │   ├── middleware/      # Auth middleware
    │   ├── services/        # Notification service
    │   ├── utils/           # Database & Auth utilities
    │   └── index.ts         # Express server
    ├── .env                 # Environment variables
    ├── tsconfig.json        # TypeScript config
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm installed
- Supabase account (free tier available at https://supabase.com)
- Twilio account (optional, for WhatsApp/SMS)

### Step 1: Supabase Setup

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Create a new project (choose a region close to you)
3. Go to **Settings > API** and note down:
   - Project URL
   - Anon Public Key
   - Service Role Key

4. Go to **SQL Editor** and run the schema from `backend/supabase-schema.sql`:
   - Click "New Query"
   - Copy the entire SQL from `supabase-schema.sql`
   - Paste and run

### Step 2: Environment Setup

Update `backend/.env` with your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_public_key
SUPABASE_SECRET=your_service_role_key

PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Leave these for now (optional for notifications)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WHATSAPP_NUMBER=
```

### Step 3: Run Backend

```bash
cd backend
npm run dev
```

Server will start at `http://localhost:3001`

### Step 4: Run Frontend

```bash
cd frontend
npm run dev
```

Frontend will start at `http://localhost:5173`

### Step 5: Create Your First Merchant Account

1. Open http://localhost:5173 in your browser
2. Click "Don't have an account? Sign up"
3. Fill in:
   - Restaurant Name: Your Restaurant Name
   - Email: any@email.com
   - Phone: +91 your number
   - PIN: 4 digits (e.g., 1234)
4. Click "Create Account"
5. You're now logged in to the POS system!

---

## 💳 Adding Your First Menu

1. From POS Dashboard, click the **📊 Dashboard** button
2. Click **Menu Management** tab
3. Click **Add Item** button
4. Fill in item details:
   - Item name: e.g., "Butter Chicken"
   - Price: e.g., 250
   - Category: e.g., "Mains"
5. Click **Add**
6. Repeat for more items

---

## 🧾 Creating Your First Bill

1. Go back to POS Dashboard
2. **Search for customer** (leave blank for walk-in customer)
   - Enter phone number and click search
   - Or click **Add New Customer** to add new one
3. **Add items** - Click any menu item to add to bill
   - Use + / - buttons to adjust quantity
4. **Review** - See running total on the right side
5. **PUNCH BILL** - Click the green button to complete transaction
   - Notification will be sent to customer (if WhatsApp/SMS configured)
   - Customer stats will update automatically

---

## 📊 Dashboard Features

### Overview Tab
- 📈 Daily revenue total
- 📦 Transaction count
- 💰 Average bill value

### Top Customers
- 👥 Ranked by visit frequency
- 💸 Total lifetime spend
- 🎁 Points balance
- 📞 Phone number

### Menu Management
- ➕ Add new items
- ❌ Delete items
- 📋 Organize by category

---

## 🔔 Setting Up Notifications (Optional)

### WhatsApp & SMS via Twilio

1. Sign up at [https://www.twilio.com](https://www.twilio.com)
2. Get your credentials:
   - Account SID
   - Auth Token
   - Twilio Phone Number
   - Twilio WhatsApp Number

3. Update `backend/.env`:
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
   ```

4. Restart backend: `npm run dev`

Now customers will receive WhatsApp and SMS notifications when their bill is punched!

---

## 🌐 Deployment

### Deploy Backend to Railway

1. Go to [https://railway.app](https://railway.app)
2. Login with GitHub
3. Create new project → Deploy from GitHub repo
4. Select this repository
5. Configure environment variables
6. Deploy!

### Deploy Frontend to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select `frontend` as root directory
5. Add environment variable:
   ```
   VITE_API_URL=https://your-railway-backend.railway.app/api
   ```
6. Deploy!

---

## 🔐 Security Considerations

- PINs are hashed using bcryptjs
- JWTs expire after 24 hours
- API requires Bearer token authentication
- Supabase RLS (Row Level Security) should be configured
- Never commit `.env` files
- Use environment variables for all secrets

---

## 📚 API Documentation

### Authentication
- **POST /api/merchants/register** - Create new merchant
- **POST /api/merchants/login** - Login with email & PIN
- **GET /api/merchants/profile** - Get merchant details (requires auth)

### Menu Management
- **GET /api/menu** - Get all menu items
- **POST /api/menu** - Create menu item
- **PUT /api/menu/:id** - Update menu item
- **DELETE /api/menu/:id** - Delete menu item

### Customers
- **GET /api/customers/search/:phone** - Search customer by phone
- **POST /api/customers** - Create new customer
- **GET /api/customers** - Get all customers
- **PUT /api/customers/:id** - Update customer

### Bills
- **POST /api/bills** - Create bill
- **GET /api/bills** - Get bills (with pagination)
- **POST /api/bills/:id/punch** - Complete bill & trigger notifications
- **GET /api/bills/stats/today** - Get today's statistics

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Router
- **Backend**: Node.js, Express, TypeScript, Supabase, JWT, Twilio
- **Database**: PostgreSQL (Supabase)
- **Authentication**: PIN + JWT
- **Notifications**: Twilio (WhatsApp + SMS)

---

## 📝 Important Notes

1. **Supabase URL**: The URL you get should end with `.co`, not `.app` for API calls
2. **API Proxy**: Development frontend proxies API calls to backend via Vite
3. **Notifications**: SMS/WhatsApp will only work after Twilio credentials are added
4. **Points System**: 1 point is awarded for every ₹10 spent
5. **PIN System**: PINs are always 4 digits, hashed server-side

---

## 🎯 Next Steps / Future Enhancements

- [ ] Multi-language support (Hindi, Tamil, etc.)
- [ ] Offline mode with sync
- [ ] Upi Payment integration
- [ ] Inventory management
- [ ] Staff management & sales tracking
- [ ] Advanced analytics & reports
- [ ] Mobile app (React Native)
- [ ] Table management for dine-in
- [ ] KOT (Kitchen Order Ticket) system
- [ ] Loyalty program enhancements

---

## ❓ Troubleshooting

**Q: "Failed to connect to backend"**
A: Make sure backend is running on port 3001. Check `npm run dev` is executing without errors.

**Q: "Supabase connection error"**
A: Verify SUPABASE_URL and SUPABASE_SECRET in `.env` are correct and the schema is created.

**Q: "PIN authentication failed"**
A: Make sure PIN is 4 digits and matches what was used during registration.

**Q: "Menu items not showing"**
A: Add items from Dashboard → Menu Management tab first.

---

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure database schema is created
4. Check network requests in browser DevTools

---

## 📄 License

MIT License - Feel free to use and modify!

---

**Built with ❤️ for restaurants** 🍽️
