# BG Capital Limits - CORRECT Implementation ✅

## 🎯 What Was Actually Fixed

You were absolutely right - I initially modified the wrong component (`FormulaRatesTab.tsx`) when the real admin UI uses a **modal system** (`PricingRuleModal.tsx`).

---

## ✅ Actual Changes Made

### 1. Backend - BgCapitalLimit Module (CORRECT)
- ✅ Created `BgCapitalLimit` model in schema
- ✅ Created full CRUD module (`bg-capital-limits/`)
- ✅ Made `GET /bg-capital-limits` public (all authenticated users)
- ✅ All other endpoints admin-only
- ✅ Seed creates 3 default limits (1k/2k/3k)
- ✅ Fixed `calculateBG()` to filter by capital ranges

### 2. Frontend Client - BG Limit Selector (CORRECT)
**File:** `frontend/src/components/simulations/CoverageSelectionStep.tsx`

- ✅ Fetches BG limits from API dynamically
- ✅ Fallback to hardcoded values if API fails
- ✅ Applied to both STANDARD and DOMMAGES_COLLISIONS formulas

### 3. Frontend Admin - PricingRuleModal (CORRECT - THIS WAS THE KEY FIX)
**File:** `frontend/src/components/admin/PricingRuleModal.tsx`

**Changes made:**

1. **Updated formula hint for BG:**
```typescript
'BG': 'Formule: capital × taux × réduction. LLOYD: 6.5% | AMANA: 7%. Vous pouvez définir des limites de capital.',
```

2. **Added capital range fields to BG field map:**
```typescript
'BG': ['minCapital', 'maxCapital', 'ratePercentage', 'reductionRate'],
```

3. **Added `maxCapital` to form state:**
```typescript
const [formData, setFormData] = useState({
  // ... other fields
  minCapital: rule?.minCapital || '',
  maxCapital: rule?.maxCapital || '',  // ← NEW
  // ... other fields
});
```

4. **Added `maxCapital` to number parsing:**
```typescript
if (['minPower', 'maxPower', 'bonusMalusClass', 'minCapital', 'maxCapital', ...].includes(k)) {
  return [k, parseFloat(v as string)];
}
```

5. **Added Capital Maximum field in the form:**
```typescript
{showField('minCapital') && (
  <tr>
    <td>Capital Minimum (DT)</td>
    <td>
      <input
        type="number"
        value={formData.minCapital}
        onChange={(e) => setFormData({ ...formData, minCapital: e.target.value })}
        placeholder="Limite minimale de capital pour Bris de Glaces (optionnel)"
      />
    </td>
  </tr>
)}
{showField('maxCapital') && (
  <tr>
    <td>Capital Maximum (DT)</td>
    <td>
      <input
        type="number"
        value={formData.maxCapital}
        onChange={(e) => setFormData({ ...formData, maxCapital: e.target.value })}
        placeholder="Limite maximale de capital pour Bris de Glaces (optionnel)"
      />
    </td>
  </tr>
)}
```

---

## 📊 Files Actually Modified

### Backend (9 files) ✅
1. `backend/prisma/schema.prisma`
2. `backend/src/bg-capital-limits/dto/create-bg-capital-limit.dto.ts`
3. `backend/src/bg-capital-limits/dto/update-bg-capital-limit.dto.ts`
4. `backend/src/bg-capital-limits/bg-capital-limits.service.ts`
5. `backend/src/bg-capital-limits/bg-capital-limits.controller.ts`
6. `backend/src/bg-capital-limits/bg-capital-limits.module.ts`
7. `backend/src/app.module.ts`
8. `backend/prisma/seed.ts`
9. `backend/src/pricing-engine/pricing-engine.service.ts`

### Frontend (2 files) ✅
10. `frontend/src/components/simulations/CoverageSelectionStep.tsx` - Client BG selector
11. `frontend/src/components/admin/PricingRuleModal.tsx` - Admin modal (THE KEY FIX)

### ❌ Files I Mistakenly Modified (REVERTED)
- ~~`frontend/src/pages/admin/formulas/FormulaRatesTab.tsx`~~ - This was wrong, the real UI uses the modal

---

## 🎯 How It Works Now

### Admin Workflow

1. **Navigate to:** Admin → Gestion de Tarification → Onglet "Garanties"

2. **Filter by:** 
   - Compagnie: Lloyd Tunisien
   - Garantie: Bris de Glaces

3. **Click "Ajouter" to create a new BG rule**

4. **Modal opens with these fields:**
   - **Compagnie:** Lloyd Tunisien
   - **Garantie:** Bris de Glaces
   - **Capital Minimum (DT):** 0
   - **Capital Maximum (DT):** 5000
   - **Taux:** 0.065 (6.5%)
   - **Taux de réduction:** 0

5. **Click "Enregistrer"**

6. **Repeat for second tier:**
   - **Capital Minimum (DT):** 5001
   - **Capital Maximum (DT):** *(leave empty for unlimited)*
   - **Taux:** 0.07 (7%)
   - **Taux de réduction:** 0

### Client Workflow

1. **Create simulation** → Select STANDARD or DOMMAGES_COLLISIONS formula

2. **Check "Bris de Glaces" guarantee**

3. **Dropdown appears:** "Limite Bris de Glaces (DT)"
   - Options: 1,000 DT / 2,000 DT / 3,000 DT (fetched from API)

4. **Select capital:** 2,000 DT

5. **Generate quote**

6. **System calculates:**
   - Capital: 2,000 DT
   - Rule matched: minCapital=0, maxCapital=5000, rate=0.065
   - Prime: 2,000 × 0.065 = **130 DT**

---

## 🧪 Testing

### Test 1: Admin can configure BG capital ranges
```
1. Login as admin
2. Go to: Admin → Gestion de Tarification → Garanties
3. Filter: Compagnie=Lloyd, Garantie=Bris de Glaces
4. Click "Ajouter"
5. Fill:
   - Capital Minimum: 0
   - Capital Maximum: 5000
   - Taux: 0.065
6. Save
7. Verify: Rule created successfully
```

### Test 2: Client sees dynamic BG limits
```
1. Login as client
2. Create new simulation
3. Select STANDARD formula
4. Check "Bris de Glaces"
5. Verify: Dropdown shows 1,000 / 2,000 / 3,000 DT (from API)
```

### Test 3: Pricing engine uses capital ranges
```
1. Client selects BG capital: 2,000 DT
2. Generate quote for Lloyd
3. Verify: Prime = 2,000 × 0.065 = 130 DT (uses 0-5k tier)
4. Client selects BG capital: 6,000 DT
5. Generate quote for Lloyd
6. Verify: Prime = 6,000 × 0.07 = 420 DT (uses >5k tier)
```

---

## 📝 What I Learned

**Mistake:** I initially modified `FormulaRatesTab.tsx` thinking that was the admin UI for BG configuration.

**Reality:** The actual admin UI uses a **modal system** (`PricingRuleModal.tsx`) that dynamically shows/hides fields based on the selected guarantee.

**Lesson:** Always check the actual UI flow before modifying components. The modal-based system is much cleaner and already had the infrastructure - I just needed to add BG-specific fields to the field map.

---

## ✅ Final Status

**Backend:** ✅ COMPLETE
- BgCapitalLimit model and module created
- Pricing engine filters by capital ranges
- Seed data includes 3 default limits

**Frontend Client:** ✅ COMPLETE
- BG limit selector fetches from API
- Fallback to hardcoded values if API fails

**Frontend Admin:** ✅ COMPLETE (CORRECTED)
- PricingRuleModal now shows minCapital/maxCapital fields for BG
- Admin can configure tiered rates by capital range
- Formula hint updated to reflect capital-based pricing

**Documentation:** ✅ COMPLETE
- Implementation guide
- Client configuration guide
- Technical summary

---

**Date:** 2026-01-XX  
**Status:** ✅ COMPLETE - All fixes applied correctly  
**Apology:** Sorry for initially modifying the wrong component. The modal system is now correctly updated.
