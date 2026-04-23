# Flouci Webhook Configuration Guide

## 🎯 Problem Solved

Previously, Flouci was redirecting users to success/fail pages, but **never notifying the backend** about payment status. This caused payments to remain in "PENDING" status forever.

**Solution:** Configure Flouci to call our backend webhook URL when payment is completed.

---

## 📋 What Was Changed

### 1. Backend Changes (flouci.service.ts)

#### Added webhook URL to payment request:
```typescript
const flouciRequest: FlouciPaymentRequest = {
  app_token: this.flouciAppToken,
  app_secret: this.flouciAppSecret,
  amount: Math.round(totalAmount * 1000),
  accept_card: 'true',
  session_timeout_secs: 1200,
  success_link: `${FRONTEND_URL}/payment/success?paymentId=${payment.id}&quoteId=${quoteId}`,
  fail_link: `${FRONTEND_URL}/payment/cancel?paymentId=${payment.id}&quoteId=${quoteId}`,
  developer_tracking_id: orderId,
  webhook: `${BACKEND_URL}/payments/webhook`, // ✅ NEW: Webhook URL
};
```

#### Enhanced webhook handler with better logging:
- Logs all incoming webhook payloads
- Handles both 'SUCCESS' and 'success' status values
- Provides detailed console output for debugging

#### Improved payment verification:
- Returns detailed verification results
- Includes Flouci API response data
- Better error handling

### 2. Frontend Changes (PaymentSuccessPage.tsx)

#### Added automatic payment verification:
- Waits 5 seconds after redirect
- Calls Flouci API to verify payment status
- Updates payment status if webhook was missed
- Stops polling once payment is confirmed

### 3. New API Endpoint (payments.controller.ts)

#### POST /payments/:id/verify-with-flouci
- Manually verifies payment with Flouci API
- Updates database if payment was successful
- Used as fallback if webhook fails

---

## 🔧 Environment Variables Required

Add these to your `.env` file:

```bash
# Flouci Configuration
FLOUCI_URL=https://developers.flouci.com/api
FLOUCI_APP_TOKEN=your_app_token_here
FLOUCI_APP_SECRET=your_app_secret_here

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000  # ✅ IMPORTANT: Must be publicly accessible for webhooks
```

---

## 🌐 Webhook URL Configuration

### Development (Local Testing)

For local development, Flouci cannot reach `http://localhost:3000`. You need to expose your local server using a tunneling service:

#### Option 1: ngrok (Recommended)
```bash
# Install ngrok
npm install -g ngrok

# Start your backend
cd backend
npm run start:dev

# In another terminal, expose port 3000
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update your .env:
BACKEND_URL=https://abc123.ngrok.io
```

#### Option 2: localtunnel
```bash
npm install -g localtunnel
lt --port 3000
```

#### Option 3: Cloudflare Tunnel
```bash
cloudflared tunnel --url http://localhost:3000
```

### Production

Set `BACKEND_URL` to your production backend URL:
```bash
BACKEND_URL=https://api.yourdomain.com
```

---

## 📡 Webhook Endpoint Details

### Endpoint
```
POST /payments/webhook
```

### Expected Payload from Flouci
```json
{
  "payment_id": "flouci_payment_id_here",
  "developer_tracking_id": "ARS-Q2024000123-1234567890",
  "amount": 500000,
  "status": "SUCCESS"
}
```

### Response
```json
{
  "status": "success",
  "paymentId": "internal_payment_id"
}
```

---

## 🧪 Testing the Webhook

### 1. Test with curl (Local)
```bash
curl -X POST http://localhost:3000/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "test_flouci_payment_123",
    "developer_tracking_id": "ARS-Q2024000001-1234567890",
    "amount": 500000,
    "status": "SUCCESS"
  }'
```

### 2. Test with Postman
1. Create a POST request to `http://localhost:3000/payments/webhook`
2. Set Content-Type to `application/json`
3. Use the JSON payload above
4. Send request
5. Check backend console for logs

### 3. Test End-to-End Flow
1. Start backend: `npm run start:dev`
2. Start frontend: `npm run dev`
3. Create a test payment scenario: `node create-payment-test-scenario.js`
4. Login with test user: `test.payment@example.com / Test123!`
5. Go to quote and proceed to payment
6. Complete payment on Flouci
7. Check backend console for webhook logs

---

## 🔍 Debugging Webhook Issues

### Check Backend Logs

When webhook is received, you should see:
```
🔔 Webhook received from Flouci: {
  "payment_id": "...",
  "developer_tracking_id": "...",
  "amount": 500000,
  "status": "SUCCESS"
}
📦 Found payment: xxx - Current status: PENDING
✅ Payment successful - updating status to PAID
🎉 Contract created successfully: C2024000123
```

### Common Issues

#### 1. Webhook Not Received
**Symptoms:** Payment stays in PENDING status forever

**Solutions:**
- Verify `BACKEND_URL` is publicly accessible
- Check if ngrok/tunnel is running
- Verify webhook URL in Flouci dashboard (if applicable)
- Check firewall settings

#### 2. Webhook Received but Payment Not Found
**Symptoms:** Log shows "Payment not found for order: XXX"

**Solutions:**
- Verify `developer_tracking_id` matches `orderId` in database
- Check if payment was created before webhook was called

#### 3. Webhook Fails to Update Status
**Symptoms:** Webhook received but status stays PENDING

**Solutions:**
- Check database connection
- Verify payment ID exists
- Check for database errors in logs

---

## 🔄 Payment Flow Diagram

```
User clicks "Proceed to Payment"
         ↓
Frontend calls POST /payments/init
         ↓
Backend creates payment (status: PENDING)
         ↓
Backend calls Flouci API with webhook URL
         ↓
Flouci returns payment link
         ↓
User redirected to Flouci payment page
         ↓
User completes payment
         ↓
┌────────────────────────────────────┐
│  Flouci sends TWO notifications:   │
│  1. Webhook to backend (async)     │
│  2. Redirect to frontend (sync)    │
└────────────────────────────────────┘
         ↓
Backend webhook updates payment status to PAID
         ↓
Backend creates contract
         ↓
Frontend polls /payments/:id/status
         ↓
Frontend shows success page
```

---

## ✅ Verification Checklist

Before going to production, verify:

- [ ] `BACKEND_URL` is set to publicly accessible URL
- [ ] Webhook endpoint `/payments/webhook` is accessible without authentication
- [ ] Backend logs show webhook payloads when testing
- [ ] Payment status updates from PENDING to PAID after webhook
- [ ] Contract is created after successful payment
- [ ] Frontend success page shows correct status
- [ ] Email notifications are sent
- [ ] Test with real Flouci payment (if possible)

---

## 📞 Contact Flouci Support

If webhooks still don't work after configuration:

**Email:** support@flouci.com, dev-support@flouci.com

**Information to provide:**
1. Your merchant ID / app_token
2. Your webhook URL (e.g., `https://api.yourdomain.com/payments/webhook`)
3. Example `developer_tracking_id` from a test payment
4. Confirmation that webhook endpoint is publicly accessible
5. Request them to verify webhook configuration on their side

---

## 🚀 Next Steps

1. Update `.env` with correct `BACKEND_URL`
2. Restart backend server
3. Test payment flow end-to-end
4. Monitor backend logs for webhook calls
5. Contact Flouci if webhooks are not being sent

---

## 📝 Additional Notes

### Webhook Security (Future Enhancement)

Consider adding webhook signature verification:
```typescript
// Verify webhook is from Flouci
const signature = req.headers['x-flouci-signature'];
const isValid = verifySignature(payload, signature, FLOUCI_SECRET);
if (!isValid) {
  throw new UnauthorizedException('Invalid webhook signature');
}
```

### Idempotency

The webhook handler is idempotent - calling it multiple times with the same payload won't create duplicate contracts.

### Retry Logic

If webhook fails, Flouci may retry. Ensure your handler can handle duplicate calls gracefully.

---

**Last Updated:** April 23, 2024
