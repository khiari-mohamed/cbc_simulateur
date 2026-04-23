# Payment Flow Debugging Checklist

## ✅ WEBHOOK CONFIGURATION FIXED!

**What was the problem?**
Flouci was redirecting users to success/fail pages, but never calling our backend webhook to update payment status.

**What's the solution?**
We now send a `webhook` URL to Flouci when creating payments. Flouci will call this URL to notify us when payment is complete.

**See:** `FLOUCI_WEBHOOK_SETUP.md` for complete configuration guide.

---

## Issue: Error when proceeding to payment

### ✅ What I've Done:
1. Added detailed error logging to backend (flouci.service.ts)
2. Added console logging to frontend (PaymentCheckoutPage.tsx)
3. Created test script to test Flouci API directly

---

## 🔍 Step-by-Step Debugging Process:

### Step 1: Start Backend & Frontend
```bash
# Terminal 1 - Backend
cd d:\house_md\cbc\backend
npm run start:dev

# Terminal 2 - Frontend
cd d:\house_md\cbc\frontend
npm run dev
```

### Step 2: Try to Make a Payment
1. Go to a validated quote
2. Click "Procéder au paiement"
3. Fill in the checkout form
4. Click "Procéder au paiement" button

### Step 3: Check Backend Console
Look for these logs:
- `🔍 Attempting Flouci API call with payload:` - Shows what we're sending
- `✅ Flouci API Response:` - Shows Flouci's response (if successful)
- `❌ Flouci API Error Details:` - Shows detailed error (if failed)

### Step 4: Check Frontend Console (Browser DevTools)
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for: `Payment initialization error:`

### Step 5: Check Network Tab (Browser DevTools)
1. Go to Network tab
2. Look for request to `/payments/init`
3. Check:
   - Status code (200, 400, 401, 500?)
   - Response body
   - Request payload

---

## 🐛 Common Issues & Solutions:

### Issue A: Flouci API Credentials Invalid
**Symptoms:**
- Status: 401 Unauthorized
- Error: "Invalid credentials" or "Authentication failed"

**Solution:**
- Verify credentials in `.env` file
- Contact Flouci support to verify app_token and app_secret

### Issue B: Flouci API Endpoint Wrong
**Symptoms:**
- Status: 404 Not Found
- Error: "Endpoint not found"

**Solution:**
- Check if endpoint should be `/generate_payment` or `/payments/generate`
- Verify Flouci API documentation

### Issue C: Amount Exceeds Limit
**Symptoms:**
- Error: "Le montant X DT dépasse la limite de Flouci (9999.999 DT)"

**Solution:**
- Check quote amount
- Flouci max: 9999.999 DT

### Issue D: Network/CORS Issues
**Symptoms:**
- Error: "Network Error" or "CORS policy"
- Error code: ECONNREFUSED, ETIMEDOUT

**Solution:**
- Check internet connection
- Verify Flouci API is accessible
- Check firewall settings

### Issue E: Missing Required Fields
**Symptoms:**
- Status: 400 Bad Request
- Error: "Missing required field: X"

**Solution:**
- Check payload structure matches Flouci requirements
- Verify all required fields are present

### Issue F: Quote Not Validated
**Symptoms:**
- Error: "Quote must be validated before payment"

**Solution:**
- Ensure quote status is 'VALIDATED'
- Check quote in database

---

## 🧪 Test Flouci API Directly (Optional)

If backend is not running, you can test Flouci API independently:

```bash
cd d:\house_md\cbc\backend
node test-flouci-api.js
```

This will show if the issue is:
- ✅ Code issue (our implementation)
- ❌ API issue (Flouci gateway)

---

## 📋 What to Share With Me:

After following the steps above, please share:

1. **Backend console output** (the error logs)
2. **Frontend console output** (browser DevTools)
3. **Network request details** (from Network tab)
4. **Error message shown to user** (the toast notification)

This will help me pinpoint the exact issue!

---

## 🔧 Quick Fixes to Try:

### Fix 1: Increase Timeout
If you see timeout errors, edit `flouci.service.ts` line 54:
```typescript
timeout: 30000, // Changed from 15000 to 30000 (30 seconds)
```

### Fix 2: Test with Smaller Amount
Try with a quote that has a small amount (e.g., 50 DT) to rule out amount issues.

### Fix 3: Check Quote Status
Run this in your database:
```sql
SELECT id, quoteNumber, status, totalAPayer FROM "Quote" WHERE id = 'YOUR_QUOTE_ID';
```

---

## 📞 Next Steps:

1. Run the backend and frontend
2. Try to make a payment
3. Copy the error logs from backend console
4. Copy the error from browser console
5. Share them with me

Then I can tell you exactly what's wrong! 🚀
