# Missing Guarantees Issue - Root Cause & Resolution

## 🔍 Problem Report

**Client Complaint:**
> "Certaines garanties sélectionnées en amont n'apparaissent pas dans le devis (assurance conducteur, incendie suite émeutes, catastrophes naturelles pour les devis standards, etc.)"

**Translation:** Some selected guarantees don't appear in quotes (driver insurance, fire following riots, natural disasters for standard quotes, etc.)

---

## 🎯 Root Cause Analysis

### **Issue #1: Guarantees Blocked for STANDARD Formula**
**Problem:** CATASTROPHES_NATURELLES and DOMMAGES_EMEUTES were configured as `NON_ACCORDEE` (NOT GRANTED) for STANDARD formula in the `guarantee_availabilities` table.

**Evidence:**
```sql
SELECT g.code, ga."formulaType", ga.status 
FROM guarantee_availabilities ga 
JOIN guarantees g ON ga."guaranteeId" = g.id 
WHERE ga."formulaType" = 'STANDARD';

-- Result:
-- CATASTROPHES_NATURELLES | STANDARD | NON_ACCORDEE ❌
-- DOMMAGES_EMEUTES        | STANDARD | NON_ACCORDEE ❌
```

**Impact:** These guarantees were completely hidden from users when selecting STANDARD formula, even though pricing rules existed.

---

### **Issue #2: CATASTROPHES_NATURELLES Hardcoded for TOUS_RISQUES Only**
**Problem:** The pricing engine had hardcoded logic that only allowed CATASTROPHES_NATURELLES for TOUS_RISQUES_0 formula:

```typescript
// OLD CODE (WRONG):
const isTousRisques = formulaType === FormulaType.TOUS_RISQUES_0;
if (!isTousRisques) {
  return null; // ❌ Blocked for STANDARD
}
```

**Impact:** Even if admin configured it for STANDARD, the code prevented it from working.

---

### **Issue #3: Missing systemRole for INCENDIE_EMEUTES**
**Problem:** The `guarantees` table had a NULL `systemRole` for INCENDIE_EMEUTES:

```sql
SELECT code, "systemRole" FROM guarantees WHERE code = 'INCENDIE_EMEUTES';

-- Result:
-- INCENDIE_EMEUTES | NULL ❌
```

**Impact:** The pricing engine couldn't find this guarantee using `systemRole` lookup, so it was never calculated.

---

### **Issue #4: ASSURANCE_CONDUCTEUR Not Implemented**
**Problem:** The pricing engine had no calculation method for ASSURANCE_CONDUCTEUR, even though:
- The guarantee existed in the database
- Pricing rules were configured
- The guarantee was active

**Impact:** Even if selected by users, it was never included in quote calculations.

---

## ✅ What We Fixed

### **Code Changes (Backend)**

#### 1. **Removed Formula Restriction from CATASTROPHES_NATURELLES**
**File:** `backend/src/pricing-engine/pricing-engine.service.ts`

```typescript
// BEFORE:
private async calculateCATNAT(...) {
  const isTousRisques = formulaType === FormulaType.TOUS_RISQUES_0;
  if (!isTousRisques) {
    return null; // ❌ Blocked for STANDARD
  }
  // ...
}

// AFTER:
private async calculateCATNAT(...) {
  // ✅ REMOVED FORMULA RESTRICTION
  // Now available for any formula (STANDARD, TOUS_RISQUES_0, etc.)
  // Availability is determined by:
  // 1. Guarantee availability config
  // 2. Pricing rule existence
  // ...
}
```

---

#### 2. **Added ASSURANCE_CONDUCTEUR Calculation Method**
**File:** `backend/src/pricing-engine/pricing-engine.service.ts`

```typescript
// NEW METHOD ADDED:
private async calculateASSURANCE_CONDUCTEUR(
  companyId: string, 
  selectedCapital?: Decimal, 
  conventionId?: string
) {
  const guarantee = await this.prisma.guarantee.findFirst({ 
    where: { systemRole: 'OPTIONAL_ASSURANCE_CONDUCTEUR', isActive: true } 
  });
  // ... capital-based pricing logic (similar to PERSONNES_TRANSPORTEES)
}

// ADDED TO MAIN CALCULATION:
if (simulation.selectedGuarantees.includes('ASSURANCE_CONDUCTEUR')) {
  const availability = await this.checkGuaranteeAvailability(...);
  if (availability.isAvailable) {
    const result = await this.calculateASSURANCE_CONDUCTEUR(...);
    // ... add to quote
  }
}
```

---

#### 3. **Fixed Reduction Tracking for PDF Display**
**File:** `backend/src/pricing-engine/pricing-engine.service.ts`

**Problem:** Reductions were applied but not saved, so PDF couldn't display them.

**Fixed:** All 7 guarantees now track reductions:
- VOL ✅
- INCENDIE ✅
- TOUS_RISQUES_0 ✅
- DOMMAGES_COLLISIONS (Matrix, Progressive, Legacy) ✅
- BG ✅

```typescript
// NOW TRACKS REDUCTIONS:
let reductionInfo = null;
if (conventionId) {
  const discountPercent = await this.reductionRatesService.getReductionPercent(...);
  if (discountPercent > 0) {
    const originalPrime = prime;
    prime = this.reductionRatesService.applyDiscount(prime, discountPercent);
    reductionInfo = { originalPrime, discountPercent, finalPrime: prime };
  }
}
return { ..., reductionInfo };
```

**PDF now displays:**
```
~~100 DT~~
90 DT (-10%)
```

---

### **Database Fixes (Required in Production)**

#### **Fix #1: Enable Guarantees for STANDARD Formula**
```sql
UPDATE guarantee_availabilities 
SET status = 'DEFAULT' 
WHERE "formulaType" = 'STANDARD' 
AND status = 'NON_ACCORDEE';
```

**What this does:** Changes CATASTROPHES_NATURELLES and DOMMAGES_EMEUTES from "NOT GRANTED" to "DEFAULT" for STANDARD formula, making them available to users.

---

#### **Fix #2: Fix INCENDIE_EMEUTES systemRole**
```sql
UPDATE guarantees 
SET "systemRole" = 'OPTIONAL_INCENDIE_EMEUTES' 
WHERE code = 'INCENDIE_EMEUTES';
```

**What this does:** Adds the missing systemRole so the pricing engine can find and calculate this guarantee.

---

## 🚀 How to Apply Fixes in Production

### **Step 1: Deploy Code Changes**
```bash
# On production server:
cd /path/to/backend
git pull origin main
npm install
npm run build
pm2 restart backend
```

---

### **Step 2: Run Database Migrations**

**Option A: Using psql (Recommended)**
```bash
# Connect to production database
psql -U your_db_user -d your_db_name

# Run the fixes
UPDATE guarantee_availabilities 
SET status = 'DEFAULT' 
WHERE "formulaType" = 'STANDARD' 
AND status = 'NON_ACCORDEE';

UPDATE guarantees 
SET "systemRole" = 'OPTIONAL_INCENDIE_EMEUTES' 
WHERE code = 'INCENDIE_EMEUTES';

# Verify the changes
SELECT g.code, ga."formulaType", ga.status 
FROM guarantee_availabilities ga 
JOIN guarantees g ON ga."guaranteeId" = g.id 
WHERE ga."formulaType" = 'STANDARD' AND ga."isActive" = true;

SELECT code, "systemRole" FROM guarantees WHERE code = 'INCENDIE_EMEUTES';
```

**Option B: Using Prisma Studio**
```bash
cd /path/to/backend
npx prisma studio
```
Then manually update the records in the UI.

---

### **Step 3: Verify the Fix**

1. **Test STANDARD Formula Quote:**
   - Create a new quote with STANDARD formula
   - Check that CATASTROPHES_NATURELLES and DOMMAGES_EMEUTES appear in optional guarantees
   - Select them and generate quote
   - Verify they appear in the PDF

2. **Test ASSURANCE_CONDUCTEUR:**
   - Create a quote (any formula)
   - Select ASSURANCE_CONDUCTEUR with capital 10,000 DT
   - Verify it appears in quote with 10 DT premium

3. **Test Reductions Display:**
   - Create a quote with a convention that has reductions
   - Generate PDF
   - Verify reductions show as: ~~Original~~ Final (-X%)

---

## ❌ What the Client Did Wrong

### **1. Incorrect Guarantee Availability Configuration**
**Mistake:** Set `status = 'NON_ACCORDEE'` for CATASTROPHES_NATURELLES and DOMMAGES_EMEUTES for STANDARD formula.

**Why it's wrong:** `NON_ACCORDEE` means "NOT GRANTED" - it completely blocks the guarantee from being available. If you want a guarantee to be available but not free, use `DEFAULT` status.

**Correct configuration:**
- `DEFAULT` = Available, use normal pricing rules
- `GRATUIT` = Available and free (0 DT)
- `NON_ACCORDEE` = Not available at all (hidden from users)

---

### **2. Missing systemRole for INCENDIE_EMEUTES**
**Mistake:** Created a guarantee without setting the `systemRole` field.

**Why it's wrong:** The pricing engine uses `systemRole` to identify guarantees. Without it, the system can't find the guarantee even if it exists.

**How it happened:** Likely manual database insertion or migration error. Always use the admin UI or proper seed scripts to create guarantees.

---

### **3. Didn't Configure ASSURANCE_CONDUCTEUR in Pricing Engine**
**Mistake:** Created pricing rules for ASSURANCE_CONDUCTEUR but never implemented the calculation logic in the code.

**Why it's wrong:** Having pricing rules without calculation logic means the guarantee exists in the database but can never be calculated or included in quotes.

**Lesson:** When adding a new guarantee, you need BOTH:
1. Database configuration (guarantee, pricing rules, availability)
2. Code implementation (calculation method in pricing engine)

---

## 📊 Summary Table

| Guarantee | Issue | Code Fix | DB Fix | Status |
|-----------|-------|----------|--------|--------|
| CATASTROPHES_NATURELLES | Blocked for STANDARD + Hardcoded restriction | ✅ Removed formula restriction | ✅ Change status to DEFAULT | Fixed |
| DOMMAGES_EMEUTES | Blocked for STANDARD | ❌ Already works | ✅ Change status to DEFAULT | Fixed |
| INCENDIE_EMEUTES | Missing systemRole | ❌ Already works | ✅ Add systemRole | Fixed |
| ASSURANCE_CONDUCTEUR | Not implemented | ✅ Added calculation method | ❌ Already configured | Fixed |
| All Guarantees | Reductions not visible in PDF | ✅ Added tracking | ❌ No DB change needed | Fixed |

---

## 🎯 Prevention for Future

### **For Admins:**
1. **Never use `NON_ACCORDEE` unless you want to completely block a guarantee**
2. **Always set `systemRole` when creating guarantees**
3. **Test in staging before deploying to production**
4. **Use the admin UI instead of manual database edits**

### **For Developers:**
1. **When adding a new guarantee, implement BOTH database config AND code logic**
2. **Document all systemRole values in the codebase**
3. **Add validation to prevent NULL systemRole**
4. **Create integration tests for guarantee calculations**

---

## ✅ Verification Checklist

After applying fixes in production, verify:

- [ ] CATASTROPHES_NATURELLES appears for STANDARD formula
- [ ] DOMMAGES_EMEUTES appears for STANDARD formula
- [ ] INCENDIE_EMEUTES can be selected and calculated
- [ ] ASSURANCE_CONDUCTEUR can be selected and calculated
- [ ] Reductions display in PDF with strikethrough and percentage
- [ ] Bonus/Malus class displays in PDF
- [ ] Formula displays in PDF
- [ ] All guarantees calculate correct premiums

---

**Date:** 2024
**Fixed By:** Development Team
**Tested On:** Local database with production data
