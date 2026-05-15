# DineFlow API Reference

Complete API documentation for DineFlow backend.

**Base URL**: `http://localhost:3001/api`

**Authentication**: All endpoints (except `/merchants/register` and `/merchants/login`) require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔐 Authentication

### Register Merchant
**POST** `/merchants/register`

Create a new merchant account.

**Request:**
```json
{
  "name": "My Restaurant",
  "email": "owner@restaurant.com",
  "phone": "+91 9876543210",
  "pin": "1234"
}
```

**Response:**
```json
{
  "merchant": {
    "id": "uuid",
    "name": "My Restaurant",
    "email": "owner@restaurant.com",
    "phone": "+91 9876543210",
    "created_at": "2024-05-10T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Merchant registered successfully"
}
```

---

### Login Merchant
**POST** `/merchants/login`

Login with email and PIN.

**Request:**
```json
{
  "email": "owner@restaurant.com",
  "pin": "1234"
}
```

**Response:**
```json
{
  "merchant": {
    "id": "uuid",
    "name": "My Restaurant",
    "email": "owner@restaurant.com",
    "phone": "+91 9876543210"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error:**
```json
{
  "error": "Invalid email or PIN"
}
```

---

### Get Merchant Profile
**GET** `/merchants/profile`

Get authenticated merchant's details.

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My Restaurant",
  "email": "owner@restaurant.com",
  "phone": "+91 9876543210",
  "created_at": "2024-05-10T12:00:00Z"
}
```

---

### Update Merchant Profile
**PUT** `/merchants/profile`

Update merchant details.

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Request:**
```json
{
  "name": "My Restaurant Updated",
  "phone": "+91 9876543210"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My Restaurant Updated",
  "email": "owner@restaurant.com",
  "phone": "+91 9876543210",
  "created_at": "2024-05-10T12:00:00Z"
}
```

---

## 📋 Menu Management

### Get All Menu Items
**GET** `/menu`

Get all active menu items for the merchant.

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "merchant_id": "uuid",
    "name": "Butter Chicken",
    "price": 280,
    "category": "Curries",
    "is_active": true,
    "created_at": "2024-05-10T12:00:00Z"
  },
  {
    "id": "uuid",
    "merchant_id": "uuid",
    "name": "Biryani",
    "price": 320,
    "category": "Rice",
    "is_active": true,
    "created_at": "2024-05-10T12:00:00Z"
  }
]
```

---

### Get Menu Items by Category
**GET** `/menu/category/:category`

Get menu items for a specific category.

**Example:** `/menu/category/Curries`

**Response:**
```json
[
  {
    "id": "uuid",
    "merchant_id": "uuid",
    "name": "Butter Chicken",
    "price": 280,
    "category": "Curries",
    "is_active": true,
    "created_at": "2024-05-10T12:00:00Z"
  }
]
```

---

### Create Menu Item
**POST** `/menu`

Add a new menu item.

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Request:**
```json
{
  "name": "Tandoori Chicken",
  "price": 350,
  "category": "Mains"
}
```

**Response:**
```json
{
  "id": "uuid",
  "merchant_id": "uuid",
  "name": "Tandoori Chicken",
  "price": 350,
  "category": "Mains",
  "is_active": true,
  "created_at": "2024-05-10T12:00:00Z"
}
```

---

### Update Menu Item
**PUT** `/menu/:id`

Update an existing menu item.

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Request:**
```json
{
  "name": "Tandoori Chicken",
  "price": 350,
  "category": "Mains",
  "is_active": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "merchant_id": "uuid",
  "name": "Tandoori Chicken",
  "price": 350,
  "category": "Mains",
  "is_active": true,
  "created_at": "2024-05-10T12:00:00Z"
}
```

---

### Delete Menu Item
**DELETE** `/menu/:id`

Soft delete a menu item (marks as inactive).

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Response:**
```json
{
  "message": "Menu item deleted"
}
```

---

## 👥 Customer Management

### Search Customer by Phone
**GET** `/customers/search/:phone`

Find a customer by phone number.

**Example:** `/customers/search/9876543210`

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Response (Found):**
```json
{
  "id": "uuid",
  "merchant_id": "uuid",
  "name": "John Doe",
  "phone": "9876543210",
  "points_balance": 150,
  "total_visits": 5,
  "total_spend": 1500,
  "created_at": "2024-05-10T12:00:00Z"
}
```

**Response (Not Found):**
```json
null
```

---

### Create Customer
**POST** `/customers`

Add a new customer.

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Request:**
```json
{
  "name": "John Doe",
  "phone": "9876543210"
}
```

**Response:**
```json
{
  "id": "uuid",
  "merchant_id": "uuid",
  "name": "John Doe",
  "phone": "9876543210",
  "points_balance": 0,
  "total_visits": 0,
  "total_spend": 0,
  "created_at": "2024-05-10T12:00:00Z"
}
```

---

### Get All Customers
**GET** `/customers`

Get all customers for the merchant (sorted by visits).

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "merchant_id": "uuid",
    "name": "John Doe",
    "phone": "9876543210",
    "points_balance": 150,
    "total_visits": 5,
    "total_spend": 1500,
    "created_at": "2024-05-10T12:00:00Z"
  }
]
```

---

### Get Customer by ID
**GET** `/customers/:id`

Get specific customer details.

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Response:**
```json
{
  "id": "uuid",
  "merchant_id": "uuid",
  "name": "John Doe",
  "phone": "9876543210",
  "points_balance": 150,
  "total_visits": 5,
  "total_spend": 1500,
  "created_at": "2024-05-10T12:00:00Z"
}
```

---

### Update Customer
**PUT** `/customers/:id`

Update customer information.

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Request:**
```json
{
  "name": "John Smith",
  "phone": "9876543210",
  "points_balance": 200
}
```

**Response:**
```json
{
  "id": "uuid",
  "merchant_id": "uuid",
  "name": "John Smith",
  "phone": "9876543210",
  "points_balance": 200,
  "total_visits": 5,
  "total_spend": 1500,
  "created_at": "2024-05-10T12:00:00Z"
}
```

---

## 💳 Bill Management

### Create Bill
**POST** `/bills`

Create a new bill (does not complete it).

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Request:**
```json
{
  "customerId": "uuid-or-null",
  "items": [
    {
      "menu_item_id": "uuid",
      "item_name": "Butter Chicken",
      "price": 280,
      "quantity": 2,
      "subtotal": 560
    },
    {
      "menu_item_id": "uuid",
      "item_name": "Naan",
      "price": 50,
      "quantity": 2,
      "subtotal": 100
    }
  ]
}
```

**Response:**
```json
{
  "id": "uuid",
  "merchant_id": "uuid",
  "customer_id": "uuid-or-null",
  "items": [...],
  "total_amount": 660,
  "status": "pending",
  "created_at": "2024-05-10T12:00:00Z",
  "completed_at": null
}
```

---

### Get Bills
**GET** `/bills?status=completed&limit=50&offset=0`

Get bills with pagination and filtering.

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Query Parameters:**
- `status`: "pending", "completed", or "cancelled" (optional)
- `limit`: Number of results (default 50)
- `offset`: Pagination offset (default 0)

**Response:**
```json
[
  {
    "id": "uuid",
    "merchant_id": "uuid",
    "customer_id": "uuid",
    "items": [...],
    "total_amount": 660,
    "status": "completed",
    "created_at": "2024-05-10T12:00:00Z",
    "completed_at": "2024-05-10T12:05:00Z"
  }
]
```

---

### Get Bill by ID
**GET** `/bills/:id`

Get specific bill details with customer information.

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Response:**
```json
{
  "id": "uuid",
  "merchant_id": "uuid",
  "customer_id": "uuid",
  "items": [...],
  "total_amount": 660,
  "status": "completed",
  "created_at": "2024-05-10T12:00:00Z",
  "completed_at": "2024-05-10T12:05:00Z",
  "customers": {
    "name": "John Doe",
    "phone": "9876543210"
  },
  "merchants": {
    "name": "My Restaurant"
  }
}
```

---

### Punch Bill (Complete & Trigger Notifications)
**POST** `/bills/:id/punch`

Complete a bill, update customer stats, and send notifications.

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Response:**
```json
{
  "bill": {
    "id": "uuid",
    "merchant_id": "uuid",
    "customer_id": "uuid",
    "items": [...],
    "total_amount": 660,
    "status": "completed",
    "created_at": "2024-05-10T12:00:00Z",
    "completed_at": "2024-05-10T12:05:00Z"
  },
  "customer": {
    "id": "uuid",
    "name": "John Doe",
    "phone": "9876543210",
    "points_balance": 216,
    "total_visits": 6,
    "total_spend": 2160
  },
  "notification": {
    "whatsapp": true,
    "sms": true
  }
}
```

---

### Get Today's Statistics
**GET** `/bills/stats/today`

Get today's revenue and transaction statistics.

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Response:**
```json
{
  "totalRevenue": 5420.50,
  "totalBills": 12,
  "averageBillValue": 451.71
}
```

---

## ⚠️ Error Responses

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Status Codes

- `200` - Success
- `400` - Bad request (missing/invalid parameters)
- `401` - Unauthorized (invalid or missing token)
- `404` - Not found (resource doesn't exist)
- `500` - Server error

---

## 🔄 Authentication Flow

1. **Register** → Get token
2. **Include token** in `Authorization: Bearer <TOKEN>` header
3. **Make API calls** - token automatically includes merchant context
4. **Token expires** after 24 hours → Need to login again

---

## 📊 Data Models

### Merchant
```json
{
  "id": "UUID",
  "name": "string",
  "email": "string (unique)",
  "phone": "string",
  "pin_hash": "string (hashed)",
  "created_at": "timestamp"
}
```

### Customer
```json
{
  "id": "UUID",
  "merchant_id": "UUID",
  "phone": "string",
  "name": "string",
  "points_balance": "integer",
  "total_visits": "integer",
  "total_spend": "decimal",
  "created_at": "timestamp"
}
```

### MenuItem
```json
{
  "id": "UUID",
  "merchant_id": "UUID",
  "name": "string",
  "price": "decimal",
  "category": "string",
  "is_active": "boolean",
  "created_at": "timestamp"
}
```

### Bill
```json
{
  "id": "UUID",
  "merchant_id": "UUID",
  "customer_id": "UUID (nullable)",
  "items": "array of BillItem",
  "total_amount": "decimal",
  "status": "enum('pending', 'completed', 'cancelled')",
  "created_at": "timestamp",
  "completed_at": "timestamp (nullable)"
}
```

### BillItem
```json
{
  "menu_item_id": "UUID",
  "item_name": "string",
  "price": "decimal",
  "quantity": "integer",
  "subtotal": "decimal"
}
```

---

## 📝 Notes

- All decimal values are stored with up to 12 digits, 2 decimal places
- Timestamps are in ISO 8601 format
- IDs are UUIDs (universally unique identifiers)
- All requests expect JSON content-type
- PIN is never returned in responses
- Token validity: 24 hours from issue

---

## 🧪 Testing with curl

### Test registration:
```bash
curl -X POST http://localhost:3001/api/merchants/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Restaurant",
    "email": "test@restaurant.com",
    "phone": "+91 9876543210",
    "pin": "1234"
  }'
```

### Test login:
```bash
curl -X POST http://localhost:3001/api/merchants/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@restaurant.com",
    "pin": "1234"
  }'
```

### Test protected endpoint:
```bash
curl -X GET http://localhost:3001/api/merchants/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

For more information, see README.md
