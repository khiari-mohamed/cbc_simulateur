# 💳 Flouci Payment Integration - Complete Guide

## 📖 Overview

This system integrates with Flouci payment gateway to process insurance quote payments and automatically create contracts upon successful payment.

---

## 🎯 What Was Fixed

### The Problem
Payments were stuck in "PENDING" status because Flouci wasn't notifying our backend when payments were completed.

### The Solution
Added webhook URL to payment requests so Flouci can notify our backend server-to-server when payment is complete.

### Result
✅ Payments now update automatically
✅ Contracts are created instantly
✅ Users see success confirmation
✅ Email notifications are sent

---

## 🏗️ Architecture

### Components

1. **Frontend (React)**
   - Payment checkout page
   - Success/cancel pages
   - Auto-verification fallback

2. **Backend (NestJS)**
   - Payment initialization
   - Webhook handler
   - Payment verification
   - Contract creation

3. **Flouci Gateway**
   - Payment processing
   - Webhook notifications
   - Payment verification API

### Data Flow

```
┌─────────────┐
│   Frontend  │
│  (Checkout) │
└──────┬──────┘
       │ POST /payments/init
       ↓
┌─────────────┐
│   Backend   │
│  (Create)   │
└──────┬──────┘
       │ POST /generate_payment (with webhook URL)
       ↓
┌─────────────┐
│   Flouci    │
│    (API)    │
└──────┬──────┘
       │ Returns payment link
       ↓
┌─────────────┐
│   Frontend  │
│  (Redirect) │
└──────┬──────┘
       │ User completes payment
       ↓
┌─────────────┐
│   Flouci    │
│  (Gateway)  │
└──────┬──────┘
       │
       ├─────────────────────┐
       │                     │
       ↓                     ↓
┌─────────────┐      ┌─────────────┐
│   Backend   │      │   Frontend  │
│  (Webhook)  │      │  (Redirect) │
└──────┬──────┘      └──────┬──────┘
       │                     │
       │ Update status       │ Poll status
       │ Create contract     │
       │                     │
       └──────────┬──────────┘
                  ↓
           ✅ Success!
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Flouci merchant account
- ngrok (for local testing)

### Installation

```bash
# Clone repository
git clone <your-repo>
cd cbc

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

1. **Create `.env` file in backend:**

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cbc"

# Flouci
FLOUCI_URL=https://developers.flouci.com/api
FLOUCI_APP_TOKEN=your_app_token_here
FLOUCI_APP_SECRET=your_app_secret_here

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000  # Change to ngrok URL for testing

# JWT
JWT_SECRET=your_jwt_secret_here

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

2. **Verify configuration:**

```bash
cd backend
node check-webhook-config.js
```

### Running Locally

```bash
# Terminal 1: Start backend
cd backend
npm run start:dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Expose backend (for webhook testing)
ngrok http 3000
# Copy the HTTPS URL and update BACKEND_URL in .env
```

---

## 🧪 Testing

### 1. Configuration Check
```bash
cd backend
node check-webhook-config.js
```

### 2. Test Webhook Endpoint
```bash
node test-webhook.js
```

### 3. Test Flouci API
```bash
node test-flouci-api.js
```

### 4. Create Test Data
```bash
node create-payment-test-scenario.js
```

### 5. End-to-End Test
1. Login with: `test.payment@example.com` / `Test123!`
2. Navigate to quotes
3. Select a validated quote
4. Click "Procéder au paiement"
5. Complete checkout form
6. Click "Procéder au paiement" button
7. Complete payment on Flouci
8. Verify success page shows
9. Check backend logs for webhook
10. Verify contract was created

---

## 📁 File Structure

```
backend/
├── src/
│   └── payments/
│       ├── flouci.service.ts          # Main payment service
│       ├── payments.controller.ts     # API endpoints
│       └── payments.module.ts         # Module definition
├── test-flouci-api.js                 # Test Flouci API
├── test-webhook.js                    # Test webhook endpoint
├── check-webhook-config.js            # Verify configuration
└── create-payment-test-scenario.js    # Create test data

frontend/
└── src/
    └── pages/
        └── quotes/
            ├── PaymentCheckoutPage.tsx    # Checkout form
            ├── PaymentSuccessPage.tsx     # Success page
            └── PaymentCancelPage.tsx      # Cancel page

Documentation/
├── WEBHOOK_FIX_SUMMARY.md             # Fix summary
├── FLOUCI_WEBHOOK_SETUP.md            # Setup guide
├── PAYMENT_DEBUG_GUIDE.md             # Debug checklist
├── QUICK_REFERENCE.md                 # Quick commands
└── PAYMENT_SYSTEM_README.md           # This file
```

---

## 🔌 API Endpoints

### Payment Initialization
```http
POST /payments/init
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "quoteId": "quote_id_here",
  "deliveryType": "HOME_DELIVERY" | "AGENCY_PICKUP",
  "effectiveDate": "2024-04-25"
}

Response:
{
  "paymentId": "payment_id",
  "quoteId": "quote_id",
  "amount": 500.000,
  "flouciPaymentId": "flouci_payment_id",
  "flouciUrl": "https://flouci.com/checkout/...",
  "orderId": "ARS-Q2024000001-1234567890"
}
```

### Webhook (Called by Flouci)
```http
POST /payments/webhook
Content-Type: application/json

{
  "payment_id": "flouci_payment_id",
  "developer_tracking_id": "ARS-Q2024000001-1234567890",
  "amount": 500000,
  "status": "SUCCESS"
}

Response:
{
  "status": "success",
  "paymentId": "payment_id"
}
```

### Get Payment Status
```http
GET /payments/:id/status
Authorization: Bearer {jwt_token}

Response:
{
  "id": "payment_id",
  "status": "PAID" | "PENDING" | "FAILED",
  "amount": 500.000,
  "reference": "flouci_payment_id",
  "paidAt": "2024-04-23T10:30:00Z",
  "quote": {...},
  "contract": {...}
}
```

### Verify Payment with Flouci
```http
POST /payments/:id/verify-with-flouci
Authorization: Bearer {jwt_token}

Response:
{
  "verified": true,
  "status": "SUCCESS",
  "data": {...}
}
```

---

## 🔍 Debugging

### Enable Debug Logs

Backend logs are already verbose. Look for these emojis:
- 🔍 = API call attempt
- ✅ = Success
- ❌ = Error
- 🔔 = Webhook received
- 📦 = Data found
- 🎉 = Contract created

### Common Issues

| Issue | Solution |
|-------|----------|
| Webhook not received | Use ngrok to expose localhost |
| Payment stuck in PENDING | Check backend logs, verify webhook URL |
| Flouci API error 401 | Check FLOUCI_APP_TOKEN and FLOUCI_APP_SECRET |
| Flouci API error 400 | Check payload format, amount limits |
| Contract not created | Check webhook logs, verify payment status |

### Debug Checklist

1. ✅ Backend is running
2. ✅ Frontend is running
3. ✅ ngrok is exposing backend (for local testing)
4. ✅ BACKEND_URL in .env matches ngrok URL
5. ✅ Flouci credentials are correct
6. ✅ Database is accessible
7. ✅ Quote is in VALIDATED status
8. ✅ Webhook endpoint is accessible

---

## 🚀 Deployment

### Environment Variables (Production)

```bash
# Use production URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Use production database
DATABASE_URL=postgresql://user:pass@prod-db:5432/cbc

# Keep Flouci credentials
FLOUCI_URL=https://developers.flouci.com/api
FLOUCI_APP_TOKEN=your_production_token
FLOUCI_APP_SECRET=your_production_secret
```

### Pre-Deployment Checklist

- [ ] All environment variables set
- [ ] BACKEND_URL is publicly accessible
- [ ] Database migrations run
- [ ] SSL certificates configured
- [ ] Webhook endpoint tested
- [ ] End-to-end payment tested
- [ ] Email notifications working
- [ ] Error monitoring configured
- [ ] Backup strategy in place

---

## 📊 Monitoring

### Key Metrics to Track

- Payment success rate
- Average payment processing time
- Webhook delivery rate
- Contract creation rate
- Failed payment reasons

### Logs to Monitor

```bash
# Payment creation
grep "Attempting Flouci API call" logs.txt

# Webhook received
grep "Webhook received from Flouci" logs.txt

# Payment success
grep "Payment successful" logs.txt

# Contract creation
grep "Contract created successfully" logs.txt

# Errors
grep "ERROR" logs.txt
```

---

## 🔒 Security

### Current Implementation

- ✅ JWT authentication for API endpoints
- ✅ Webhook endpoint is public (required by Flouci)
- ✅ Payment verification with Flouci API
- ✅ Idempotent webhook handler

### Future Enhancements

- [ ] Webhook signature verification
- [ ] Rate limiting on webhook endpoint
- [ ] IP whitelist for Flouci webhooks
- [ ] Payment fraud detection
- [ ] PCI compliance audit

---

## 📞 Support

### Flouci Support
- Email: support@flouci.com
- Dev Support: dev-support@flouci.com
- Sales: sales@flouci.com

### Documentation
- Flouci API Docs: https://developers.flouci.com/docs
- Internal Docs: See `FLOUCI_WEBHOOK_SETUP.md`

---

## 📝 License

[Your License Here]

---

## 👥 Contributors

[Your Team Here]

---

**Last Updated:** April 23, 2024
**Version:** 2.0.0 (Webhook Integration)
