# NON_ACCORDÉE vs HIDDEN - Implementation Guide

## 📋 Problem Summary

The client misunderstood what `NON_ACCORDEE` status meant:
- **What they thought**: "Show in quote/PDF with 'NOT COVERED' label"
- **What it actually did**: "Completely hide the guarantee from UI and quotes"

## 🎯 Solution

We're adding a new status `HIDDEN` and changing the behavior of `NON_ACCORDEE`:

| Status | Behavior |
|--------|----------|
| `HIDDEN` | Completely hidden from UI and quotes (old NON_ACCORDEE behavior) |
| `NON_ACCORDEE` | Shows in quote/PDF with "NON ACCORDÉE" label (what client wanted) |
| `DEFAULT` | Normal - user can select and pay |
| `GRATUIT` | Free - included automatically (0 DT) |

---

## ✅ What We've Done

### 1. Updated Prisma Schema ✅
**File**: `backend/prisma/schema.prisma`

Added `HIDDEN` to the enum:
```prisma
enum GuaranteeAvailabilityStatus {
  DEFAULT
  GRATUIT
  NON_ACCORDEE
  HIDDEN        // ← NEW
}
```

### 2. Created Migration ✅
**Migration**: `20260407131733_add_hidden_status_to_guarantee_availability`

```sql
ALTER TYPE "GuaranteeAvailabilityStatus" ADD VALUE IF NOT EXISTS 'HIDDEN';
```

**Status**: ✅ Migration applied successfully

### 3. Updated Pricing Engine ✅
**File**: `backend/src/pricing-engine/pricing-engine.service.ts`

Updated `checkGuaranteeAvailability` method:
```typescript
switch (availability.status) {
  case GuaranteeAvailabilityStatus.HIDDEN:
    // HIDDEN = Completely hidden from UI and quotes
    return { isAvailable: false, isFree: false, useDefault: false, isNotCovered: false };
  
  case GuaranteeAvailabilityStatus.NON_ACCORDEE:
    // NON_ACCORDEE = Show in quote/PDF but mark as "NOT COVERED"
    return { isAvailable: true, isFree: false, useDefault: false, isNotCovered: true };
  
  case GuaranteeAvailabilityStatus.GRATUIT:
    // GRATUIT = Available and free
    return { isAvailable: true, isFree: true, useDefault: false, isNotCovered: false };
  
  case GuaranteeAvailabilityStatus.DEFAULT:
  default:
    // DEFAULT = Use existing logic (backward compatible)
    return { isAvailable: true, isFree: false, useDefault: true, isNotCovered: false };
}
```

---

## ⏳ What Still Needs to Be Done

### 4. Update Quote Items to Track `isNotCovered` Flag

**Problem**: Currently, quote items don't store whether a guarantee is "NON_ACCORDÉE"

**Solution**: Add `isNotCovered` field to `QuoteItem` model

#### Step 4.1: Update Prisma Schema
**File**: `backend/prisma/schema.prisma`

```prisma
model QuoteItem {
  id          String     @id @default(uuid())
  quoteId     String
  guaranteeId String
  capital     Decimal    @db.Decimal(10, 2)
  prime       Decimal    @db.Decimal(10, 2)
  isNotCovered Boolean   @default(false)  // ← ADD THIS
  createdAt   DateTime   @default(now())
  
  quote       Quote      @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  guarantee   Guarantee  @relation(fields: [guaranteeId], references: [id])
  
  @@map("quote_items")
}
```

#### Step 4.2: Create Migration
```bash
cd backend
npx prisma migrate dev --name add_is_not_covered_to_quote_items
```

#### Step 4.3: Update Quotes Service
**File**: `backend/src/quotes/quotes.service.ts`

In the `generate` method, when creating quote items, pass `isNotCovered` from pricing result:

```typescript
items: {
  create: pricing.items.map(({ guaranteeId, capital, prime, isNotCovered }) => ({
    guaranteeId,
    capital,
    prime,
    isNotCovered: isNotCovered || false,  // ← ADD THIS
  })),
},
```

#### Step 4.4: Update Pricing Engine Return Type
**File**: `backend/src/pricing-engine/pricing-engine.service.ts`

Update the return type of `calculatePremium` to include `isNotCovered`:

```typescript
interface PricingItem {
  guaranteeCode: string;
  guaranteeId: string;
  capital: Decimal;
  prime: Decimal;
  reductionInfo?: any;
  isNotCovered?: boolean;  // ← ADD THIS
}
```

And in each guarantee calculation, return `isNotCovered` when applicable:

```typescript
// Example for CATASTROPHES_NATURELLES
const availability = await this.checkGuaranteeAvailability(
  companyId,
  'OPTIONAL_CATASTROPHES_NATURELLES',
  formulaType,
);

if (!availability.isAvailable) return null;

return {
  guaranteeCode: 'CATNAT',
  guaranteeId: guarantee.id,
  capital: vehicle.marketValue,
  prime: new Decimal(rule.fixedPremium),
  isNotCovered: availability.isNotCovered,  // ← ADD THIS
};
```

---

### 5. Update PDF Service to Show "NON ACCORDÉE" Label

**File**: `backend/src/pdf/pdf.service.ts`

#### In `generateQuoteHtml` method:

Find the section where quote items are rendered (around line 400):

```typescript
quote.items.forEach((item: any) => {
  const guaranteeCode = item.guarantee.code;
  
  if (processedGuarantees.has(guaranteeCode)) return;
  
  // ... existing code ...
  
  // ✅ ADD THIS: Check if guarantee is NON_ACCORDEE
  const isNotCovered = item.isNotCovered || false;
  const notCoveredLabel = isNotCovered 
    ? ' <span style="color: #dc2626; font-weight: bold; font-size: 9px;">(NON ACCORDÉE)</span>' 
    : '';
  
  rows += `
    <tr>
      <td>${item.guarantee.nameFr}${isFree ? ' <span style="color: #16a34a; font-weight: bold;">(Gratuit)</span>' : ''}${notCoveredLabel}</td>
      <td>${item.capital == 0 ? 'ILLIMITÉ' : formatCurrency(item.capital)}</td>
      <td>${primeDisplay}</td>
    </tr>
  `;
});
```

#### In `generateContractHtml` method:

Apply the same change (around line 800):

```typescript
contract.quote.items.forEach((item: any) => {
  // ... existing code ...
  
  // ✅ ADD THIS: Check if guarantee is NON_ACCORDEE
  const isNotCovered = item.isNotCovered || false;
  const notCoveredLabel = isNotCovered 
    ? ' <span style="color: #dc2626; font-weight: bold; font-size: 9px;">(NON ACCORDÉE)</span>' 
    : '';
  
  rows += `
    <tr>
      <td>${item.guarantee.nameFr}${isFree ? ' <span style="color: #16a34a; font-weight: bold;">(Gratuit)</span>' : ''}${notCoveredLabel}</td>
      <td>${item.capital == 0 ? 'ILLIMITÉ' : formatCurrency(item.capital)}</td>
      <td>${primeDisplay}</td>
    </tr>
  `;
});
```

---

### 6. Update Frontend (Optional - for better UX)

**File**: `frontend/src/components/QuoteDetails.tsx` (or similar)

Add visual styling for NON_ACCORDÉE guarantees:

```tsx
{quote.items.map((item) => (
  <div 
    key={item.id} 
    className={item.isNotCovered ? 'opacity-60 border-red-500' : ''}
  >
    <span>{item.guarantee.nameFr}</span>
    {item.isNotCovered && (
      <span className="text-red-600 font-bold text-xs ml-2">
        (NON ACCORDÉE)
      </span>
    )}
  </div>
))}
```

---

## 🚀 Deployment Steps for Production

### Step 1: Run Migration in Production
```bash
cd backend
npx prisma migrate deploy
```

This will:
1. Add `HIDDEN` status to the enum ✅ (already done)
2. Add `isNotCovered` field to `quote_items` table ⏳ (pending)

### Step 2: Update Existing Data (if needed)

If you want to convert some existing `NON_ACCORDEE` records to `HIDDEN`:

```sql
-- Example: Convert NON_ACCORDEE to HIDDEN for specific formulas
UPDATE guarantee_availabilities 
SET status = 'HIDDEN' 
WHERE status = 'NON_ACCORDEE' 
  AND "formulaType" = 'SOME_FORMULA';
```

**⚠️ Important**: By default, all existing `NON_ACCORDEE` records will now show as "NOT COVERED" in quotes. If you want them to be completely hidden, change them to `HIDDEN`.

### Step 3: Deploy Code Changes
```bash
# Backend
cd backend
npm run build
pm2 restart backend

# Frontend (if updated)
cd frontend
npm run build
pm2 restart frontend
```

### Step 4: Test in Production
1. Create a new quote with a guarantee that has `NON_ACCORDEE` status
2. Verify it shows in the quote with "NON ACCORDÉE" label
3. Create a quote with a guarantee that has `HIDDEN` status
4. Verify it doesn't appear in the quote at all

---

## 📊 Summary Table

| Task | Status | File | Action Required |
|------|--------|------|-----------------|
| Add HIDDEN to enum | ✅ Done | `schema.prisma` | None |
| Create migration | ✅ Done | Migration file | None |
| Update pricing engine | ✅ Done | `pricing-engine.service.ts` | None |
| Add isNotCovered to QuoteItem | ⏳ Pending | `schema.prisma` | Create migration |
| Update quotes service | ⏳ Pending | `quotes.service.ts` | Add isNotCovered field |
| Update pricing return type | ⏳ Pending | `pricing-engine.service.ts` | Add isNotCovered to return |
| Update PDF service | ⏳ Pending | `pdf.service.ts` | Add NON ACCORDÉE label |
| Update frontend | ⏳ Optional | React components | Add visual styling |

---

## 🎯 What the Client Should Know

### For Existing Guarantees:
- All current `NON_ACCORDEE` guarantees will now show in quotes with "NON ACCORDÉE" label
- If you want them completely hidden, change status to `HIDDEN` in admin panel

### For New Guarantees:
- Use `HIDDEN` if you want to completely block a guarantee
- Use `NON_ACCORDEE` if you want to show it but mark as "not covered"
- Use `DEFAULT` if you want it available with normal pricing
- Use `GRATUIT` if you want it available and free

### Admin Panel Update Needed:
The admin panel should be updated to show all 4 statuses:
- ✅ DEFAULT (Available)
- 🎁 GRATUIT (Free)
- ❌ NON ACCORDÉE (Not Covered - shows in quote)
- 🚫 HIDDEN (Completely Hidden)

---

## 🐛 Testing Checklist

- [ ] Create guarantee with `HIDDEN` status → Should NOT appear in quote
- [ ] Create guarantee with `NON_ACCORDEE` status → Should appear with "NON ACCORDÉE" label
- [ ] Create guarantee with `DEFAULT` status → Should appear normally
- [ ] Create guarantee with `GRATUIT` status → Should appear with "(Gratuit)" label
- [ ] Generate PDF → Verify labels appear correctly
- [ ] Test in all formulas (STANDARD, TOUS_RISQUES_0, DOMMAGES_COLLISIONS)

---

## 📞 Support

If you encounter any issues:
1. Check the migration was applied: `npx prisma migrate status`
2. Regenerate Prisma client: `npx prisma generate`
3. Restart the backend: `pm2 restart backend`
4. Check logs: `pm2 logs backend`
