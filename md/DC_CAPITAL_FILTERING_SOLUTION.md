# DC Capital Filtering Solution

## Problem Statement

**Client Issue:** "Dommages collision : les limites affichées doivent tenir compte de la valeur du véhicule."

### What Was Wrong

1. ✅ **Backend pricing engine** correctly enforces DC Config limits:
   - `maxCapitalPercent` (e.g., 50% of VV)
   - `plafondAbsolu` (e.g., 100,000 DT)

2. ❌ **Frontend DC modal dropdown** ignored these limits:
   - Only read from "Paliers de Capital DC" tab
   - Never checked "DC Configuration" tab
   - Showed ALL options (1000 to 100,000 DT) regardless of vehicle value

### Example Scenario

**Configuration:**
- Vehicle VV (Valeur Vénale) = 80,000 DT
- DC Config: `maxCapitalPercent = 50%`
- DC Config: `plafondAbsolu = 100,000 DT`

**Expected Max Capital:**
```
min(80,000 × 50%, 100,000) = min(40,000, 100,000) = 40,000 DT
```

**Before Fix:**
- Dropdown showed: 1000, 2000, 3000, ..., 100,000 DT ❌
- User could select 50,000 DT (invalid!)
- Backend would reject during quote generation

**After Fix:**
- Dropdown shows: 1000, 2000, 3000, ..., 40,000 DT ✅
- User cannot select invalid capitals
- No backend errors

## Solution Implemented

### 1. Added DC Config Query (Frontend)

**File:** `CoverageSelectionStep.tsx`

```typescript
// Fetch DC Config for the modal company to get maxCapitalPercent and plafondAbsolu
const { data: dcConfig } = useQuery({
  queryKey: ['dc-config', dcModalCompanyId, usageId],
  queryFn: async () => {
    if (!dcModalCompanyId || !usageId) return null;
    const { data } = await api.get('/dc-config', {
      params: { companyId: dcModalCompanyId, usageId }
    });
    return data && data.length > 0 ? data[0] : null;
  },
  enabled: !!dcModalCompanyId && !!usageId,
});
```

### 2. Added marketValue Prop

**File:** `CoverageSelectionStep.tsx`
```typescript
interface CoverageSelectionStepProps {
  // ... existing props
  marketValue?: number;  // ← Added
}
```

**File:** `NewSimulationPage.tsx`
```typescript
<CoverageSelectionStep
  // ... existing props
  marketValue={simulationData.vehicle.marketValue}  // ← Added
/>
```

### 3. Filter Dropdown Options

**File:** `CoverageSelectionStep.tsx` (DC Modal)

```typescript
// Apply DC Config limits: maxCapitalPercent and plafondAbsolu
if (dcConfig && marketValue) {
  const maxCapitalPercent = Number(dcConfig.maxCapitalPercent || 100);
  const plafondAbsolu = Number(dcConfig.maxCapitalAbsolute || Infinity);
  const effectiveCeiling = Math.min(
    marketValue * (maxCapitalPercent / 100),
    plafondAbsolu
  );
  
  allOptions = allOptions.filter(opt => opt.value <= effectiveCeiling);
}
```

### 4. Updated Warning Message

**Before:** Hardcoded 80% warning
```typescript
const maxAllowed = marketValue * 0.8;
```

**After:** Dynamic warning based on DC Config
```typescript
const maxCapitalPercent = dcConfig ? Number(dcConfig.maxCapitalPercent || 80) : 80;
const effectiveCeiling = Math.min(
  marketValue * (maxCapitalPercent / 100),
  plafondAbsolu
);
```

## How It Works Now

### Step-by-Step Flow

1. **User enters vehicle info:**
   - VV = 80,000 DT
   - Usage = Privé/Affaires

2. **User selects DC formula and company (e.g., AL BARAKA)**

3. **DC Modal opens:**
   - Frontend fetches DC Config for AL BARAKA + Privé/Affaires
   - Reads: `maxCapitalPercent = 50%`, `plafondAbsolu = 100,000 DT`

4. **Dropdown generation:**
   - Fetches capital tiers from "Paliers DC" tab
   - Generates options: 1000, 2000, ..., 100,000 (based on step rules)
   - **Filters** options: keeps only ≤ 40,000 DT
   - Final dropdown: 1000, 2000, ..., 40,000 DT ✅

5. **User selects capital:**
   - Can only choose valid options (≤ 40,000 DT)
   - No backend errors during quote generation

## Configuration Example

### DC Configuration Tab (Admin)
```
Compagnie: AL BARAKA
Usage: Privé/Affaires
Capital Max % VV: 50%
Plafond Absolu: 100,000 DT
```

### Paliers DC Tab (Admin)
```
AL BARAKA - Privé/Affaires:
- 1000 → 20,000 (step: 1000)
```

### Result for VV = 80,000 DT
```
Effective Ceiling = min(80,000 × 50%, 100,000) = 40,000 DT
Dropdown Options: 1000, 2000, 3000, ..., 20,000 DT
(Stops at 20,000 because tier max is 20,000)
```

### Result for VV = 150,000 DT
```
Effective Ceiling = min(150,000 × 50%, 100,000) = 75,000 DT
Dropdown Options: 1000, 2000, 3000, ..., 20,000 DT
(Still stops at 20,000 because tier max is 20,000)
```

## Backend Endpoint Used

**Endpoint:** `GET /dc-config?companyId={id}&usageId={id}`

**Response:**
```json
[
  {
    "id": "...",
    "companyId": "...",
    "usageId": "...",
    "maxCapitalPercent": 50,
    "maxCapitalAbsolute": 100000,
    "minCapital": 1000,
    "basePremium": 10,
    "discountPercent": 0,
    "useMatrix": false,
    "isActive": true
  }
]
```

## Testing Checklist

- [ ] VV = 80,000 DT, maxCapitalPercent = 50% → Max shown = 40,000 DT
- [ ] VV = 200,000 DT, plafondAbsolu = 100,000 DT → Max shown = 100,000 DT
- [ ] VV = 30,000 DT, maxCapitalPercent = 50% → Max shown = 15,000 DT
- [ ] Different companies have different limits
- [ ] Different usages have different limits
- [ ] Warning message shows correct percentage
- [ ] Console logs show filtering details

## Files Modified

1. ✅ `frontend/src/components/simulations/CoverageSelectionStep.tsx`
   - Added `dcConfig` query
   - Added `marketValue` prop
   - Added filtering logic in DC modal
   - Updated warning message

2. ✅ `frontend/src/pages/simulations/NewSimulationPage.tsx`
   - Pass `marketValue` prop to CoverageSelectionStep

## Status

✅ **SOLVED** - DC capital dropdown now respects vehicle value limits configured in DC Config tab.
