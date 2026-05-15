# Retenza Induction Task — Submission Document

## Live URL
**Frontend:** https://dine-flow-psi.vercel.app
**Backend:** https://dineflow-production-b358.up.railway.app

---

## What Was Built

### 1. POS Dashboard

**Menu Management**
- Add items with name, price, and category
- Items appear in a grid grouped by category
- Edit and delete supported

**New Bill Screen**
- Search customer by phone number in real time
- If returning customer → auto-fills name, phone, email, points balance
- If new customer → modal to save name + phone on the spot
- Add items to cart, adjust quantity with +/- buttons
- Live running total with tax calculation
- **Punch Bill** button confirms the transaction and triggers the notification pipeline

**Order Types**
- Dine In / Takeaway / Delivery
- Table selection for dine-in

---

### 2. Customer Notification

On every bill punch, the system fires **two notifications simultaneously, non-blocking** (response returns instantly, notifications send in background):

**Email — via Resend (noreply@abhiram.codes)**
- Subject: `Your bill receipt from <Restaurant Name>`
- Contains: bill amount, loyalty points balance, any active campaigns
- Delivered via Resend API (HTTPS-based, not SMTP — chosen because Railway blocks outbound SMTP ports)

**Telegram — via Bot API**
- Customer links their Telegram by sending `/start` to the bot
- On punch: bot sends instant message with bill summary + points earned

**Why these channels over WhatsApp/SMS:**
- WhatsApp Business API requires Meta approval + paid tier
- SMS (Twilio) costs per message and requires number verification
- Resend email is free up to 3,000/month, reliable, and deliverable to any customer with an email
- Telegram is instant, free, and widely used — customers opt-in themselves by messaging the bot

**The message brings customers back by including:**
- Points balance (creates reason to return and redeem)
- Any active campaign offer (e.g. "10% off next visit this week")

---

### 3. Merchant Dashboard

**Today's Metrics**
- Total revenue today
- Number of bills punched today
- Returning customers % (vs new)
- Average order value
- Comparison vs yesterday / last week

**Customer List**
- Name, phone, total visits, total spend, points balance
- Segments: VIP (high visits), At-Risk (haven't visited in 14+ days), New

**Additional Analytics**
- Revenue trend chart (last 7/30 days)
- Top items by order frequency
- At-risk customers list with last visit date

---

## Retention Strategies (Based on What the System Actually Captures)

### 1. Points Expiry Nudge
The system tracks `points_balance` and `last_visit` per customer. Customers who have accumulated points but haven't visited in 10+ days get a Telegram/email reminder: *"You have 120 points expiring soon — redeem them on your next visit."* This creates urgency using data the system already holds.

### 2. Lapsed High-Value Customer Campaign
The system knows `total_spend`, `total_visits`, and `last_visit`. Filter customers where `total_visits > 5` AND `last_visit > 14 days ago`. These are proven regulars who have gone quiet. Send a targeted campaign: *"We miss you — here's 15% off your next order."* High-spend customers responding to this have disproportionate revenue impact.

### 3. Post-Visit Campaign (Triggered by Bill Punch)
Every bill punch captures what items the customer ordered (`items` JSON in the bills table). If a customer repeatedly orders the same item, the next notification can reference it: *"Your usual Butter Chicken is waiting."* Personalisation from actual order history, not guesses.

---

## How to Detect Churn Before It Happens

Using `last_visit` and `total_visits` from the customers table:

- Calculate each customer's **average visit gap** = days between their last N visits
- If their current gap since `last_visit` exceeds **1.5× their personal average**, flag them as at-risk
- Example: customer normally visits every 5 days, hasn't come in 8 days → at-risk flag triggers

The dashboard already shows an "At-Risk" segment using a simpler 14-day cutoff. The above refinement makes it personal per customer rather than a fixed threshold.

---

## What Makes a Customer Return — and How This System Executes It

**The reason:** Habit + perceived value. Customers return when visiting feels rewarding and frictionless.

**How the system leverages this:**

1. **Habit reinforcement via points** — Every bill punch shows the customer their updated points balance. The loyalty system gives them a tangible reason to come back specifically to *this* restaurant rather than a competitor. The points tier system (Silver → Gold → Platinum) adds progression, making returning feel like advancement.

2. **Campaigns timed to the visit cycle** — Since the system knows visit frequency per customer, campaigns can be sent just before a customer's expected next visit window, when they're most receptive. A campaign received 2 days before their usual visit day reinforces the existing habit rather than trying to create a new one.

3. **Recognition at the counter** — When a returning customer is searched by phone, the POS auto-fills their name and shows their points. The cashier sees them as a known customer, not a transaction. This micro-recognition — being known by name — is one of the strongest soft drivers of restaurant loyalty.

---

## Tech Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + Vite + TailwindCSS | Fast dev, small bundle |
| State | Zustand | Simple, no boilerplate |
| Backend | Express + TypeScript | Flexible, type-safe |
| Database | Supabase (PostgreSQL) | Managed, free tier, no infra |
| Auth | PIN + JWT | Fast for POS use case |
| Email | Resend SDK | Works on Railway (HTTPS not SMTP) |
| Telegram | Bot API | Free, instant, opt-in |
| AI | Google Gemini | Campaign copy generation, free tier |
| Backend Deploy | Railway | Persistent Node.js, GitHub auto-deploy |
| Frontend Deploy | Vercel | Zero-config, CDN, GitHub auto-deploy |
