# Fix: NON_ACCORDEE vs HIDDEN Status

## 🎯 Problem

The client set guarantees to `NON_ACCORDEE` status thinking it would show them in quotes/PDFs as "NOT COVERED", but instead they were completely hidden.

**What client wanted:**
```
Quote PDF:
✅ Responsabilité Civile - 150 DT
✅ Vol - 80 DT  
✅ Incendie - 60 DT
❌ Catastrophes Naturelles - NON ACCORDÉE (not covered)
❌ Dommages Émeutes - NON ACCORDÉE (not covered)
```

**What actually happened:**
```
Quote PDF:
✅ Responsabilité Civile - 150 DT
✅ Vol - 80 DT
✅ Incendie - 60 DT
(Catastrophes Naturelles and Dommages Émeutes don't appear at all)
```

---

## ✅ Solution

We added a new status `HIDDEN` and changed the behavior of `NON_ACCORDEE`:

### **New Status Definitions:**

| Status | Behavior | Use Case |
|--------|----------|----------|
| **DEFAULT** | Available with normal pricing | Standard optional guarantees users can select |
| **GRATUIT** | Available and FREE (0 DT) | Guarantees included automatically at no cost |
| **NON_ACCORDEE** | Shows in quote/PDF as "NOT COVERED" | Inform customers this guarantee is NOT included |
| **HIDDEN** | Completely hidden from UI and quotes | Guarantee doesn't exist for this formula/company |

---

## 🔧 What We Changed

### **1. Schema Update**
**File:** `backend/prisma/schema.prisma`

```prisma
enum GuaranteeAvailabilityStatus {
  GRATUIT
  NON_ACCORDEE
  DEFAULT
  HIDDEN        // ← NEW STATUS ADDED
}
```

---

### **2. Pricing Engine Update**
**File:** `backend/src/pricing-engine/pricing-engine.service.ts`

```typescript
// OLD BEHAVIOR:
case GuaranteeAvailabilityStatus.NON_ACCORDEE:
  return { isAvailable: false, ... }; // ❌ Completely hidden

// NEW BEHAVIOR:
case GuaranteeAvailabilityStatus.HIDDEN:
  return { isAvailable: false, ... }; // ❌ Completely hidden

case GuaranteeAvailabilityStatus.NON_ACCORDEE:
  return { isAvailable: true, isNotCovered: true, ... }; // ✅ Shows as "NOT COVERED"
```

---

### **3. PDF Service Update** (TODO)
**File:** `backend/src/pdf/pdf.service.ts`

Need to update PDF generation to show NON_ACCORDEE guarantees with a special label:

```typescript
// In generateQuoteHtml and generateContractHtml:
if (item.isNotCovered) {
  rows += `
    <tr style="background: #fff3cd;">
      <td>${item.guarantee.nameFr} <span style="color: #856404; font-weight: bold;">(NON ACCORDÉE)</span></td>
      <td>-</td>
      <td>0 DT</td>
    </tr>
  `;
}
```

---

## 🚀 How to Deploy

### **Step 1: Run Database Migration**

```bash
# Connect to database
psql -U your_db_user -d your_db_name

# Run migration
\i backend/prisma/migrations/add_hidden_status.sql
```

Or manually:

```sql
-- Add HIDDEN status
ALTER TYPE "GuaranteeAvailabilityStatus" ADD VALUE IF NOT EXISTS 'HIDDEN';
```

---

### **Step 2: Update Prisma Client**

```bash
cd backend
npx prisma generate
npm run build
```

---

### **Step 3: Deploy Code**

```bash
git pull origin main
pm2 restart backend
```

---

### **Step 4: Update Existing Records (OPTIONAL)**

If you want old `NON_ACCORDEE` records to be completely hidden, change them to `HIDDEN`:

```sql
-- Change old NON_ACCORDEE to HIDDEN (if you want them completely hidden)
UPDATE guarantee_availabilities 
SET status = 'HIDDEN' 
WHERE status = 'NON_ACCORDEE';
```

**OR** keep them as `NON_ACCORDEE` if you want them to show as "NOT COVERED" in quotes.

---

## 📋 Decision Matrix for Admins

When configuring guarantee availability, use this guide:

| What You Want | Status to Use | Result |
|---------------|---------------|--------|
| Users can select and pay for it | `DEFAULT` | Shows in UI, normal pricing |
| Included automatically for free | `GRATUIT` | Shows in UI, 0 DT |
| Show in quote as "NOT COVERED" | `NON_ACCORDEE` | Shows in quote/PDF with "NOT COVERED" label |
| Don't show it at all | `HIDDEN` | Completely invisible |

---

## 🎯 Examples

### **Example 1: STANDARD Formula - Some Guarantees Not Covered**

**Configuration:**
```sql
-- Catastrophes Naturelles is NOT covered for STANDARD
INSERT INTO guarantee_availabilities (companyId, guaranteeId, formulaType, status)
VALUES ('lloyd-id', 'catnat-id', 'STANDARD', 'NON_ACCORDEE');

-- But it IS covered for TOUS_RISQUES_0
INSERT INTO guarantee_availabilities (companyId, guaranteeId, formulaType, status)
VALUES ('lloyd-id', 'catnat-id', 'TOUS_RISQUES_0', 'DEFAULT');
```

**Result:**
- STANDARD quote: Shows "Catastrophes Naturelles - NON ACCORDÉE"
- TOUS_RISQUES_0 quote: Shows "Catastrophes Naturelles - 40 DT" (selectable)

---

### **Example 2: Guarantee Doesn't Exist for Company**

**Configuration:**
```sql
-- ASSURANCE_CONDUCTEUR doesn't exist for this company
INSERT INTO guarantee_availabilities (companyId, guaranteeId, formulaType, status)
VALUES ('company-id', 'assurance-conducteur-id', NULL, 'HIDDEN');
```

**Result:**
- Guarantee doesn't appear anywhere in UI or quotes

---

### **Example 3: Free Guarantee for Tous Risques**

**Configuration:**
```sql
-- Bris de Glaces is FREE for TOUS_RISQUES_0
INSERT INTO guarantee_availabilities (companyId, guaranteeId, formulaType, status)
VALUES ('lloyd-id', 'bg-id', 'TOUS_RISQUES_0', 'GRATUIT');
```

**Result:**
- Shows in quote: "Bris de Glaces - 0 DT (Gratuit)"

---

## ⚠️ Breaking Changes

### **For Existing Data:**

All existing `NON_ACCORDEE` records will now show as "NOT COVERED" in quotes instead of being hidden.

**If you want the old behavior (completely hidden):**
```sql
UPDATE guarantee_availabilities 
SET status = 'HIDDEN' 
WHERE status = 'NON_ACCORDEE';
```

---

## ✅ Testing Checklist

After deployment, test:

- [ ] `HIDDEN` status: Guarantee doesn't appear in UI or quotes
- [ ] `NON_ACCORDEE` status: Guarantee shows in quote/PDF as "NOT COVERED"
- [ ] `DEFAULT` status: Guarantee is selectable with normal pricing
- [ ] `GRATUIT` status: Guarantee is included for free (0 DT)
- [ ] PDF displays "NON ACCORDÉE" label correctly
- [ ] Frontend hides `HIDDEN` guarantees
- [ ] Frontend shows `NON_ACCORDEE` guarantees with special styling

---

## 🎓 Summary

**Before:**
- `NON_ACCORDEE` = Completely hidden ❌
- No way to show "NOT COVERED" in quotes

**After:**
- `NON_ACCORDEE` = Shows as "NOT COVERED" ✅
- `HIDDEN` = Completely hidden ✅
- Clear separation of concerns

**Client can now:**
- Inform customers which guarantees are NOT covered
- Completely hide guarantees that don't exist
- Have full control over guarantee visibility

---

**Date:** 2024
**Status:** ✅ Schema updated, ✅ Pricing engine updated, ⏳ PDF service needs update
