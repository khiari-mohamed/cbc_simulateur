# 🚀 Quick Reference - Flouci Payment Integration

## ⚡ Quick Start

```bash
# 1. Check configuration
cd backend
node check-webhook-config.js

# 2. Start backend
npm run start:dev

# 3. Start frontend (new terminal)
cd ../frontend
npm run dev

# 4. For local testing, expose backend (new terminal)
ngrok http 3000
# Then update BACKEND_URL in .env with ngrok URL
```

---

## 🧪 Testing Commands

```bash
# Test webhook endpoint
node test-webhook.js

# Test Flouci API directly
node test-flouci-api.js

# Create test payment scenario
node create-payment-test-scenario.js
```

---

## 🔍 Key URLs

| Purpose | URL | Notes |
|---------|-----|-------|
| Payment Init | `POST /payments/init` | Creates payment, returns Flouci URL |
| Webhook | `POST /payments/webhook` | Flouci calls this (no auth) |
| Payment Status | `GET /payments/:id/status` | Check payment status |
| Verify Payment | `POST /payments/:id/verify-with-flouci` | Manual verification |
| Success Page | `/payment/success?paymentId=X&quoteId=Y` | User redirect |
| Cancel Page | `/payment/cancel?paymentId=X&quoteId=Y` | User redirect |

---

## 📋 Environment Variables

```bash
FLOUCI_URL=https://developers.flouci.com/api
FLOUCI_APP_TOKEN=your_token
FLOUCI_APP_SECRET=your_secret
FRONTEND_URL=http://localhost:5173
BACKEND_URL=https://your-ngrok-url.ngrok.io  # Must be public!
```

---

## 🔄 Payment Flow

```
User → Frontend → Backend → Flouci API
                              ↓
                         Payment Page
                              ↓
                         User Pays
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
            Webhook (Backend)    Redirect (Frontend)
                    ↓                   ↓
            Update Status         Poll Status
                    ↓                   ↓
            Create Contract      Show Success
```

---

## 🐛 Common Issues

### Webhook Not Received
```bash
# Check if backend is publicly accessible
curl https://your-backend-url.com/payments/webhook

# If using ngrok, check if it's running
ngrok http 3000
```

### Payment Stuck in PENDING
```bash
# Check backend logs for webhook calls
# Look for: "🔔 Webhook received from Flouci"

# Manually verify payment
curl -X POST http://localhost:3000/payments/{paymentId}/verify-with-flouci \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Flouci API Errors
```bash
# Test API directly
node test-flouci-api.js

# Check credentials in .env
# Verify FLOUCI_APP_TOKEN and FLOUCI_APP_SECRET
```

---

## 📊 Expected Logs

### Payment Creation
```
🔍 Attempting Flouci API call with payload: {...}
✅ Flouci API Response: {...}
```

### Webhook Received
```
🔔 Webhook received from Flouci: {...}
📦 Found payment: xxx - Current status: PENDING
✅ Payment successful - updating status to PAID
🎉 Contract created successfully: C2024000123
```

### Payment Verification
```
🔍 Verifying payment with Flouci API: flouci_payment_123
✅ Flouci verification response: {...}
```

---

## 📞 Support Contacts

**Flouci Support:**
- Email: support@flouci.com
- Dev Support: dev-support@flouci.com
- Sales: sales@flouci.com

**What to provide:**
- Your app_token
- Webhook URL
- Example developer_tracking_id
- Backend logs showing the issue

---

## 📚 Documentation Files

- `WEBHOOK_FIX_SUMMARY.md` - Complete fix summary
- `FLOUCI_WEBHOOK_SETUP.md` - Detailed setup guide
- `PAYMENT_DEBUG_GUIDE.md` - Debugging checklist

---

## ✅ Pre-Production Checklist

- [ ] `BACKEND_URL` is publicly accessible
- [ ] Webhook endpoint works (test with curl)
- [ ] Environment variables are correct
- [ ] Test payment completes successfully
- [ ] Payment status updates to PAID
- [ ] Contract is created
- [ ] Email notification is sent
- [ ] Frontend shows success page
- [ ] Logs show webhook calls

---

## 🎯 Success Indicators

✅ Backend logs show: "🔔 Webhook received from Flouci"
✅ Payment status changes: PENDING → PAID
✅ Contract is created with number like: C2024000123
✅ Frontend shows: "Paiement réussi!"
✅ Email sent to user

---

**Quick Help:** If stuck, run `node check-webhook-config.js` first!
