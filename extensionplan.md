# DineFlow — Extension Plan

## Checklist Audit (Current State vs Requirements)

### 1. POS Dashboard

| Requirement | Status | Notes |
|---|---|---|
| Add & manage menu (name, price, category) | ✅ Done | `POSPage.tsx` + `/api/menu` |
| New bill screen | ✅ Done | Full cart UI in `POSPage.tsx` |
| Search customer by phone/name | ✅ Done | Debounced search with dropdown |
| Add new customer (name + phone) | ✅ Done | Modal in POS |
| Returning customer auto-fill | ✅ Done | Dropdown select populates cart panel |
| Add items to bill, set quantity | ✅ Done | Cart with +/- quantity controls |
| Live running total | ✅ Done | Subtotal + tax + grand total live |
| Punch the bill | ✅ Done | `/api/bills/:id/punch` |
| **Email on customer at creation** | ✅ Done | Optional email field in modal |
| **Telegram Chat ID at creation** | ✅ Done | Optional field in modal |

---

### 2. Customer Notification

| Requirement | Status | Notes |
|---|---|---|
| Notify customer on bill punch | ✅ Done | Email + Telegram fire on punch |
| Message includes bill amount | ✅ Done | Both email and Telegram |
| Message includes restaurant name | ✅ Done | Both channels |
| Message includes active campaigns/offers | ✅ Done | Up to 4 campaigns included |
| WhatsApp / SMS | ❌ Missing | Only Email + Telegram right now |
| Telegram auto-link (no manual ID entry) | ✅ Done | `/link <phone>` bot command wired |

---

### 3. Merchant Dashboard

| Requirement | Status | Notes |
|---|---|---|
| Today's transactions count | ✅ Done | `billsToday` in dashboard stats |
| Today's total revenue | ✅ Done | `todayRevenue` with % vs yesterday |
| Top customers by visits | ❌ Missing | Not shown on dashboard |
| Customer list (name, phone, visits, spend, points) | ✅ Done | `CustomersPage.tsx` full table |
| Segments (VIP, at-risk, frequent, new) | ✅ Done | Filter tabs in customers page |
| Analytics (30-day revenue, bills, customers) | ⚠️ Minimal | `AnalyticsPage.tsx` shows 3 numbers only |
| Avg order value | ✅ Done | Dashboard stat card |
| Returning customers % | ✅ Done | Dashboard stat card |
| CSV Export | ✅ Done | Dashboard export button |

---

## What's Missing — Prioritised Extension List

### P1 — High Priority (core gaps)

---

#### ITEM 1 — WhatsApp / SMS Notifications
**What:** Send bill receipt via WhatsApp or SMS in addition to email/Telegram.  
**Why:** Most Indian restaurant customers expect WhatsApp. It's the primary channel.  
**How:**
- WhatsApp: Twilio WhatsApp API or Meta Cloud API (free tier available)
- SMS: Twilio SMS or Fast2SMS (India-specific, cheaper)
- Add `sendWhatsAppNotification()` in `notificationService.ts`
- No new DB columns needed — uses existing `phone` field
- Wire into `sendNotification()` alongside email + Telegram

**Files to change:**
- `backend/src/services/notificationService.ts` — add WhatsApp/SMS sender
- `backend/env.example` — add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`

---

#### ITEM 2 — Top Customers on Dashboard
**What:** Show top 5 customers by visits and top 5 by spend on the dashboard.  
**Why:** Required in the spec. Currently missing from `DashboardPage.tsx`.  
**How:**
- Backend: Add `GET /api/dashboard/top-customers` endpoint
- Query customers ordered by `total_visits DESC` and `total_spend DESC`, limit 5
- Frontend: Add two leaderboard cards to `DashboardPage.tsx`

**Files to change:**
- `backend/src/routes/dashboard.ts` — new `/top-customers` endpoint
- `frontend/src/pages/DashboardPage.tsx` — two new leaderboard cards
- `frontend/src/services/api.ts` — add `getTopCustomers()`

---

### P2 — Medium Priority (UX improvements)

---

#### ITEM 3 — Analytics Page (Full Charts)
**What:** Replace the 3-number analytics stub with actual charts.  
**Why:** `AnalyticsPage.tsx` currently shows only Revenue / Bills / Customers as static numbers.  
**How:**
- Add revenue-over-time chart (last 7 days bar chart)
- Add top categories by revenue (pie/donut)
- Add new vs returning customers chart
- Use `recharts` (already likely in deps) or `chart.js`

**Files to change:**
- `backend/src/routes/analytics.ts` — expand with date-bucketed queries
- `frontend/src/pages/AnalyticsPage.tsx` — full rebuild with charts

---

#### ITEM 4 — Bill History on Dashboard (Today's Transactions List)
**What:** Show today's transactions as a scrollable list on the dashboard — not just a count.  
**Why:** Spec says "today's transactions" — currently only a number is shown.  
**How:**
- `GET /api/bills?status=completed&date=today` (already exists, just not shown on dashboard)
- Add a recent transactions table below the 4 stat cards

**Files to change:**
- `frontend/src/pages/DashboardPage.tsx` — add transactions table section

---

#### ITEM 5 — Loyalty Points Redemption at POS
**What:** Allow cashier to apply a customer's existing points as a discount while punching a bill.  
**Why:** Points are earned but never redeemable — makes the loyalty system incomplete.  
**How:**
- Add "Redeem points" toggle in the cart panel (show available points, apply as ₹ discount)
- Send `points_redeemed` in the punch payload
- Backend subtracts from `points_balance` and reduces bill total

**Files to change:**
- `frontend/src/pages/POSPage.tsx` — redeem toggle in cart
- `backend/src/routes/bills.ts` — handle `points_redeemed` in punch route
- `frontend/store/store.ts` — carry `pointsRedeemed` in bill state

---

### P3 — Nice to Have (future)

---

#### ITEM 6 — Table Management
**What:** Assign bills to table numbers.  
**Why:** Restaurant context — cashiers need to know which table ordered what.  
**Status:** Partial — `v1Catalog.ts` exists but table UI is not on POS screen.

---

#### ITEM 7 — Receipt PDF / Print
**What:** Generate a printable PDF receipt or thermal printer format after punch.  
**Why:** Many restaurants need physical receipts.  
**How:** Use `pdf-lib` or `jsPDF` on frontend, or `puppeteer` on backend.

---

#### ITEM 8 — Multi-staff / Role Based Access
**What:** Separate cashier vs owner login.  
**Why:** Cashiers should not access dashboard or settings.

---

#### ITEM 9 — Campaign Scheduler
**What:** Auto-send campaign messages to customer segments at a scheduled time.  
**Why:** `CampaignsPage.tsx` exists but only stores campaigns — no send mechanism.

---

## Suggested Implementation Order

```
1. ITEM 1 — WhatsApp SMS       (biggest user-facing gap, P1)
2. ITEM 2 — Top Customers      (spec requirement, P1, small effort)
3. ITEM 4 — Bill History List  (spec requirement, P1, small effort)
4. ITEM 5 — Points Redemption  (completes loyalty loop, P2)
5. ITEM 3 — Analytics Charts   (P2, medium effort)
6. ITEM 6 — Table Management   (P3)
7. ITEM 7 — Receipt PDF        (P3)
8. ITEM 8 — Multi-staff        (P3)
9. ITEM 9 — Campaign Scheduler (P3)
```

---

*Last updated: based on codebase audit as of session date.*
