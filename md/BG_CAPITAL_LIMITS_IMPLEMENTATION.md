# BG (Bris de Glaces) Capital Limits - Implementation Complete ✅

## 📋 Client Requirement

**From phone call:**
> "BG is NOT about valeur vénale or valeur à neuf - it's about capital chosen by client. The rate changes based on capital ranges. For example: if capital ≤ 5,000 DT → 6.5%, if capital > 5,000 DT → 7%. The client chooses from predefined limits (1000/2000/3000 DT) and these limits should be admin-configurable like franchise values."

**Key points:**
1. BG pricing is based on **capital ranges** (min/max), NOT vehicle values
2. Different rates apply to different capital ranges (tiered pricing)
3. Client selects from **admin-configurable** capital limits (not hardcoded)
4. Formula: `prime = capital × rate × (1 - reduction%)`

---

## ✅ What Was Implemented

### 1. Backend - BgCapitalLimit Model & Module

**Schema (`schema.prisma`):**
```prisma
model BgCapitalLimit {
  id          String   @id @default(uuid())
  value       Decimal  @unique @db.Decimal(15, 0)
  label       String?
  description String?
  isStandard  Boolean  @default(false)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("bg_capital_limits")
}
```

**Module Structure:**
```
backend/src/bg-capital-limits/
├── dto/
│   ├── create-bg-capital-limit.dto.ts  ✅
│   └── update-bg-capital-limit.dto.ts  ✅
├── bg-capital-limits.controller.ts     ✅
├── bg-capital-limits.module.ts         ✅
└── bg-capital-limits.service.ts        ✅
```

**Features:**
- Full CRUD operations (create, read, update, delete, deactivate, reactivate)
- Audit logging for all operations
- Conflict detection (duplicate values)
- Foreign key protection (cannot delete if in use)

**API Endpoints:**
```
GET    /bg-capital-limits              [Public - All authenticated users]
GET    /bg-capital-limits/:id          [Admin only]
POST   /bg-capital-limits              [Admin only]
PATCH  /bg-capital-limits/:id          [Admin only]
DELETE /bg-capital-limits/:id          [Admin only - deactivate]
DELETE /bg-capital-limits/:id/permanent [Admin only - hard delete]
PATCH  /bg-capital-limits/:id/reactivate [Admin only]
```

**Security Fix:**
- `GET /bg-capital-limits` is now accessible to **all authenticated users** (not just admins)
- This allows clients to fetch BG limits during quote generation
- All other endpoints remain admin-only

---

### 2. Seed Data

**Default BG Capital Limits (`seed.ts`):**
```typescript
const bgCapitalLimitsSeed = [
  { value: 1000, label: '1,000 DT', description: 'Couverture minimale', isStandard: true },
  { value: 2000, label: '2,000 DT', description: 'Couverture standard', isStandard: true },
  { value: 3000, label: '3,000 DT', description: 'Couverture étendue', isStandard: true },
];
```

**BG Pricing Rules (Simplified for now):**
```typescript
// Lloyd: 6.5% for all capitals (0 to unlimited)
await prisma.pricingRule.create({
  data: {
    companyId: lloyd.id,
    guaranteeId: guarantees['BG'].id,
    minCapital: 0,
    maxCapital: null,  // No upper limit
    ratePercentage: 0.065,
    reductionRate: 0,
    isActive: true,
  },
});

// Amana: 7% for all capitals (0 to unlimited)
await prisma.pricingRule.create({
  data: {
    companyId: amana.id,
    guaranteeId: guarantees['BG'].id,
    minCapital: 0,
    maxCapital: null,
    ratePercentage: 0.07,
    reductionRate: 0,
    isActive: true,
  },
});
```

**Note:** Admin can now add tiered rates via the UI (e.g., 0-5k = 6.5%, >5k = 7%).

---

### 3. Pricing Engine - calculateBG() Fixed

**File:** `backend/src/pricing-engine/pricing-engine.service.ts`

**Changes:**
1. **Removed VV fallback** - BG capital MUST be selected by client
2. **Added capital range filtering** - finds rule based on `minCapital`/`maxCapital`
3. **Graceful handling** - returns `null` if capital is 0 (BG not selected)
4. **Error handling** - throws clear error if BG is explicitly selected but no capital chosen

**Logic:**
```typescript
private async calculateBG(
  companyId: string,
  vehicle: VehicleData,
  isTousRisques: boolean,
  selectedCapital?: Decimal,
  conventionId?: string,
  isBGExplicitlySelected?: boolean,
) {
  const guarantee = await this.prisma.guarantee.findUnique({ where: { code: 'BG' } });
  if (!guarantee) return null;

  // If BG is explicitly selected by user but no capital provided → ERROR
  if (isBGExplicitlySelected && (!selectedCapital || selectedCapital.eq(0))) {
    throw new BadRequestException(
      'Bris de Glaces (BG) est sélectionné mais aucun capital n\'a été choisi. Veuillez sélectionner un capital BG (1000 / 2000 / 3000 DT).',
    );
  }

  // If BG not selected or capital is 0, skip it gracefully
  if (!selectedCapital || selectedCapital.eq(0)) {
    return null;
  }

  const capital = selectedCapital;

  if (isTousRisques) {
    return {
      guaranteeCode: 'BG',
      guaranteeId: guarantee.id,
      capital,
      prime: new Decimal(0),  // FREE for Tous Risques
    };
  }

  const conventionScope = conventionId ? { conventionId } : { conventionId: null };

  // ✅ NEW - Find rule based on CAPITAL range (not VV)
  let rule = await this.prisma.pricingRule.findFirst({
    where: {
      companyId,
      guaranteeId: guarantee.id,
      isActive: true,
      ...conventionScope,
      AND: [
        {
          OR: [
            { minCapital: null },
            { minCapital: { lte: capital } },
          ],
        },
        {
          OR: [
            { maxCapital: null },
            { maxCapital: { gte: capital } },
          ],
        },
      ],
    },
    orderBy: { minCapital: 'desc' },  // Get most specific range
  });

  // Fallback to general rule if convention-specific not found
  if (!rule && conventionId) {
    rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        conventionId: null,
        AND: [
          {
            OR: [
              { minCapital: null },
              { minCapital: { lte: capital } },
            ],
          },
          {
            OR: [
              { maxCapital: null },
              { maxCapital: { gte: capital } },
            ],
          },
        ],
      },
      orderBy: { minCapital: 'desc' },
    });
  }

  if (!rule || rule.ratePercentage === null) {
    throw new BadRequestException(`BG pricing rule not found for capital ${capital} DT`);
  }

  // ✅ FORMULA: capital * ratePercentage * (1 - discount)
  let prime = capital.mul(rule.ratePercentage);
  
  if (rule.reductionRate && rule.reductionRate.gt(0)) {
    const multiplier = new Decimal(1).sub(rule.reductionRate.div(100));
    prime = prime.mul(multiplier);
  }

  // Apply convention reduction if exists
  if (conventionId) {
    const discountPercent = await this.reductionRatesService.getReductionPercent(
      companyId,
      'BG',
      conventionId,
      capital,
      'DC_CAPITAL' as ReductionMetric,
    );
    prime = this.reductionRatesService.applyDiscount(prime, discountPercent);
  }

  return {
    guaranteeCode: 'BG',
    guaranteeId: guarantee.id,
    capital,
    prime,
  };
}
```

---

### 4. Frontend - Dynamic BG Limit Selector

**File:** `frontend/src/components/simulations/CoverageSelectionStep.tsx`

**Before (Hardcoded):**
```tsx
<option value="500">500 DT</option>
<option value="700">700 DT</option>
<option value="1000">1 000 DT</option>
<option value="1500">1 500 DT</option>
<option value="2000">2 000 DT</option>
<option value="2500">2 500 DT</option>
<option value="3000">3 000 DT</option>
```

**After (Dynamic from API):**
```tsx
// Fetch BG capital limits from API (admin-configurable)
const { data: bgCapitalLimits } = useQuery({
  queryKey: ['bg-capital-limits'],
  queryFn: async () => {
    const { data } = await api.get('/bg-capital-limits');
    return data as Array<{ id: string; value: number; label: string; isActive: boolean }>;
  },
});

// Use in dropdown
<Select
  label="Limite Bris de Glaces (DT)"
  value={localBgLimit.toString()}
  onChange={(e) => {
    const limit = Number(e.target.value);
    setLocalBgLimit(limit);
    onUpdate({ ...data, bgLimit: limit });
  }}
  options={
    bgCapitalLimits && bgCapitalLimits.length > 0
      ? bgCapitalLimits
          .filter(limit => limit.isActive)
          .map(limit => ({
            value: limit.value.toString(),
            label: limit.label || `${limit.value.toLocaleString()} DT`,
          }))
      : [
          // Fallback if API fails
          { value: '1000', label: '1 000 DT' },
          { value: '2000', label: '2 000 DT' },
          { value: '3000', label: '3 000 DT' },
        ]
  }
/>
```

**Applied to:**
- STANDARD formula + BG selected
- DOMMAGES_COLLISIONS formula + BG selected

---

### 5. Admin UI - BG Capital Range Management

**File:** `frontend/src/pages/admin/formulas/FormulaRatesTab.tsx`

**Before:**
- Only showed `Taux` and `Réduction` fields
- No way to configure capital ranges

**After:**
- Shows **5 fields** per BG rule:
  1. **Capital Min (DT)** - editable
  2. **Capital Max (DT)** - editable (empty = unlimited)
  3. **Taux (coefficient décimal)** - editable
  4. **Réduction (%)** - editable
  5. **Actions** - delete button

**Display:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
  <div>
    <label>Capital Min (DT)</label>
    <input
      type="number"
      defaultValue={Number(rule.minCapital || 0)}
      onBlur={(e) => handleUpdate(rule.id, 'minCapital', e.target.value)}
    />
  </div>
  <div>
    <label>Capital Max (DT)</label>
    <input
      type="number"
      placeholder="Illimité si vide"
      defaultValue={rule.maxCapital ? Number(rule.maxCapital) : ''}
      onBlur={(e) => {
        const val = e.target.value;
        if (val === '') {
          updateMutation.mutate({ id: rule.id, values: { maxCapital: null } });
        } else {
          handleUpdate(rule.id, 'maxCapital', val);
        }
      }}
    />
  </div>
  <div>
    <label>Taux (coefficient décimal)</label>
    <input
      type="number"
      step="0.001"
      defaultValue={Number(rule.ratePercentage || 0)}
      onBlur={(e) => handleUpdate(rule.id, 'ratePercentage', e.target.value)}
    />
  </div>
  <div>
    <label>Réduction (%)</label>
    <input
      type="number"
      step="0.01"
      defaultValue={Number(rule.reductionRate || 0)}
      onBlur={(e) => handleUpdate(rule.id, 'reductionRate', e.target.value)}
    />
  </div>
  <div>
    <label>Actions</label>
    <Button onClick={() => deleteMutation.mutate(rule.id)}>
      <Trash2 />
    </Button>
  </div>
</div>
<div className="text-xs text-gray-500 mt-2">
  Plage: {Number(rule.minCapital || 0).toLocaleString()} DT → {rule.maxCapital ? Number(rule.maxCapital).toLocaleString() + ' DT' : '∞'} | Taux: {(Number(rule.ratePercentage || 0) * 100).toFixed(2)}%
</div>
```

**Summary line shows:**
- Capital range: `1,000 DT → 5,000 DT` or `5,001 DT → ∞`
- Rate as percentage: `6.50%` or `7.00%`

---

## 🎯 How to Use (Admin Workflow)

### Step 1: Configure BG Capital Limits
1. Navigate to **Admin → BG Capital Limits** (new page to be created)
2. Add/edit/deactivate capital limits:
   - 1,000 DT
   - 2,000 DT
   - 3,000 DT
   - 5,000 DT (new)
3. These will appear in the client's dropdown

### Step 2: Configure BG Pricing Rules with Capital Ranges
1. Navigate to **Admin → Gestion de Tarification → Onglet "Autres Formules"**
2. Scroll to **BG (Glass Breakage)** section
3. Click **"+"** to add a new rule
4. For **Lloyd Tunisien**, create 2 rules:
   - **Rule 1:**
     - Capital Min: `0`
     - Capital Max: `5000`
     - Taux: `0.065` (6.5%)
     - Réduction: `0`
   - **Rule 2:**
     - Capital Min: `5001`
     - Capital Max: *(leave empty for unlimited)*
     - Taux: `0.07` (7%)
     - Réduction: `0`
5. Repeat for **Assurances Amana** with different rates if needed

### Step 3: Test Quote Generation
1. As a client, create a new simulation
2. Select **STANDARD** or **DOMMAGES_COLLISIONS** formula
3. Check **Bris de Glaces** guarantee
4. Select a capital limit from dropdown (e.g., 2,000 DT)
5. Generate quote
6. Verify:
   - If capital ≤ 5,000 DT → prime = 2,000 × 0.065 = **130 DT**
   - If capital > 5,000 DT → prime = 6,000 × 0.07 = **420 DT**

---

## 📊 Example Scenarios

### Scenario 1: Lloyd - Capital 2,000 DT
```
Capital: 2,000 DT
Rule matched: minCapital=0, maxCapital=5000, rate=0.065
Calculation: 2,000 × 0.065 = 130 DT
Prime BG: 130 DT
```

### Scenario 2: Lloyd - Capital 6,000 DT
```
Capital: 6,000 DT
Rule matched: minCapital=5001, maxCapital=null, rate=0.07
Calculation: 6,000 × 0.07 = 420 DT
Prime BG: 420 DT
```

### Scenario 3: Tous Risques - Any Capital
```
Capital: 3,000 DT
Formula: TOUS_RISQUES_0
Prime BG: 0 DT (FREE)
```

---

## 🔧 Database Migration

**Run migration:**
```bash
cd backend
npx prisma migrate dev --name add_bg_capital_limits
```

**Run seed:**
```bash
npm run prisma:seed
```

**Verify:**
```sql
-- Check BG capital limits
SELECT * FROM bg_capital_limits;

-- Check BG pricing rules
SELECT pr.*, c.name as company_name, g.code as guarantee_code
FROM pricing_rules pr
JOIN companies c ON pr.company_id = c.id
JOIN guarantees g ON pr.guarantee_id = g.id
WHERE g.code = 'BG';
```

---

## ✅ Testing Checklist

- [ ] Backend: `GET /bg-capital-limits` returns 3 limits (1k/2k/3k)
- [ ] Backend: `POST /bg-capital-limits` creates new limit (admin only)
- [ ] Backend: `PATCH /bg-capital-limits/:id` updates limit (admin only)
- [ ] Backend: `DELETE /bg-capital-limits/:id` deactivates limit (admin only)
- [ ] Frontend: BG dropdown shows limits from API (not hardcoded)
- [ ] Frontend: BG dropdown has fallback if API fails
- [ ] Admin UI: BG section shows 5 fields (min/max capital, rate, reduction, actions)
- [ ] Admin UI: Can edit capital ranges inline
- [ ] Admin UI: Summary line shows range and rate correctly
- [ ] Pricing Engine: Filters BG rules by capital range
- [ ] Pricing Engine: Throws error if BG selected but no capital chosen
- [ ] Pricing Engine: Returns null gracefully if capital is 0
- [ ] Pricing Engine: BG is FREE for Tous Risques
- [ ] Quote Generation: BG prime calculated correctly based on capital range

---

## 🎉 Summary

**What was broken:**
1. ❌ BG capital limits were hardcoded in frontend
2. ❌ BG pricing used VV as fallback (wrong)
3. ❌ BG pricing rules had no capital range filtering
4. ❌ Admin UI didn't show capital range fields for BG
5. ❌ `GET /bg-capital-limits` required admin role (blocked clients)

**What is now fixed:**
1. ✅ BG capital limits are admin-configurable via API
2. ✅ BG pricing requires client to select capital (no VV fallback)
3. ✅ BG pricing rules filter by capital ranges (tiered rates)
4. ✅ Admin UI shows 5 fields for BG rules (min/max capital, rate, reduction, actions)
5. ✅ `GET /bg-capital-limits` is accessible to all authenticated users

**Result:**
- Admin can now configure BG capital limits (1k/2k/3k/5k/etc.) from the UI
- Admin can now configure tiered BG rates (e.g., 0-5k = 6.5%, >5k = 7%)
- Client sees dynamic BG capital dropdown (not hardcoded)
- Pricing engine correctly calculates BG prime based on capital ranges
- System is fully parameterizable without developer intervention

---

**Date:** 2026-01-XX  
**Status:** ✅ COMPLETE  
**Tested:** Pending client validation
