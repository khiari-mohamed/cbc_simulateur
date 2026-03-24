# BG Capital Limits - Technical Implementation Summary

## 🎯 Problem Statement

**Client requirement (from phone call):**
> "BG is NOT about valeur vénale or valeur à neuf - it's about capital. Sometimes the capital if we chose a limit of max 5k DT we calculate 6.5%, if above >5k it becomes 7%. The BG is not with valeur vénale or valeur à neuf, it's by limit max and limit min. Where are the limits chosen by the client (1000/2000/3000 DT) stored in the system?"

**3 core issues identified:**
1. BG capital limits (1k/2k/3k) were **hardcoded** in frontend
2. BG pricing rules had **no capital range filtering** (minCapital/maxCapital)
3. Admin UI had **no way to configure** capital ranges for BG

---

## ✅ Solution Implemented

### 1. Backend - BgCapitalLimit Entity

**File:** `backend/prisma/schema.prisma`

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

**Migration:**
```bash
npx prisma migrate dev --name add_bg_capital_limits
```

---

### 2. Backend - BgCapitalLimits Module

**Files created:**
```
backend/src/bg-capital-limits/
├── dto/
│   ├── create-bg-capital-limit.dto.ts
│   └── update-bg-capital-limit.dto.ts
├── bg-capital-limits.controller.ts
├── bg-capital-limits.module.ts
└── bg-capital-limits.service.ts
```

**Controller endpoints:**
```typescript
@Controller('bg-capital-limits')
export class BgCapitalLimitsController {
  // Public endpoint - all authenticated users can view
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('includeInactive') includeInactive?: string) { ... }

  // Admin-only endpoints
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  findOne(@Param('id') id: string) { ... }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  create(@Body() dto: CreateBgCapitalLimitDto, @Request() req: RequestWithUser) { ... }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  update(@Param('id') id: string, @Body() dto: UpdateBgCapitalLimitDto, @Request() req: RequestWithUser) { ... }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  deactivate(@Param('id') id: string, @Request() req: RequestWithUser) { ... }

  @Delete(':id/permanent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  deletePermanent(@Param('id') id: string, @Request() req: RequestWithUser) { ... }

  @Patch(':id/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRATEUR_ARS)
  reactivate(@Param('id') id: string, @Request() req: RequestWithUser) { ... }
}
```

**Key security fix:**
- `GET /bg-capital-limits` is **public** (all authenticated users) - allows clients to fetch limits during quote generation
- All other endpoints are **admin-only**

**Service features:**
- Full CRUD operations
- Audit logging for all operations
- Conflict detection (duplicate values)
- Foreign key protection (cannot delete if in use)
- Soft delete (deactivate) vs hard delete

---

### 3. Backend - Seed Data

**File:** `backend/prisma/seed.ts`

**BG Capital Limits:**
```typescript
const bgCapitalLimitsSeed = [
  { value: 1000, label: '1,000 DT', description: 'Couverture minimale', isStandard: true },
  { value: 2000, label: '2,000 DT', description: 'Couverture standard', isStandard: true },
  { value: 3000, label: '3,000 DT', description: 'Couverture étendue', isStandard: true },
];
for (const bg of bgCapitalLimitsSeed) {
  await prisma.bgCapitalLimit.create({ data: bg });
}
```

**BG Pricing Rules (simplified for now):**
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

**Note:** Admin can now add tiered rates via UI (e.g., 0-5k = 6.5%, >5k = 7%).

---

### 4. Backend - Pricing Engine Fix

**File:** `backend/src/pricing-engine/pricing-engine.service.ts`

**Method:** `calculateBG()`

**Changes:**
1. **Removed VV fallback** - capital MUST be selected by client
2. **Added capital range filtering** - finds rule based on `minCapital`/`maxCapital`
3. **Graceful null handling** - returns `null` if capital is 0 (BG not selected)
4. **Clear error messages** - throws error if BG explicitly selected but no capital chosen

**Key logic:**
```typescript
// ✅ Find rule based on CAPITAL range (not VV)
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
```

**Formula:**
```typescript
// FORMULA: capital * ratePercentage * (1 - discount)
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
```

---

### 5. Frontend - Dynamic BG Limit Selector

**File:** `frontend/src/components/simulations/CoverageSelectionStep.tsx`

**Before:**
```tsx
// ❌ Hardcoded
<option value="500">500 DT</option>
<option value="700">700 DT</option>
<option value="1000">1 000 DT</option>
<option value="1500">1 500 DT</option>
<option value="2000">2 000 DT</option>
<option value="2500">2 500 DT</option>
<option value="3000">3 000 DT</option>
```

**After:**
```tsx
// ✅ Dynamic from API
const { data: bgCapitalLimits } = useQuery({
  queryKey: ['bg-capital-limits'],
  queryFn: async () => {
    const { data } = await api.get('/bg-capital-limits');
    return data as Array<{ id: string; value: number; label: string; isActive: boolean }>;
  },
});

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

### 6. Frontend - Admin UI for BG Capital Ranges

**File:** `frontend/src/pages/admin/formulas/FormulaRatesTab.tsx`

**Before:**
```tsx
// ❌ Only 3 fields
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div>
    <label>Taux (coefficient décimal)</label>
    <input type="number" step="0.001" defaultValue={Number(rule.ratePercentage || 0)} />
  </div>
  <div>
    <label>Réduction (%)</label>
    <input type="number" step="0.01" defaultValue={Number(rule.reductionRate || 0)} />
  </div>
  <div>
    <label>Actions</label>
    <Button onClick={() => deleteMutation.mutate(rule.id)}>
      <Trash2 />
    </Button>
  </div>
</div>
```

**After:**
```tsx
// ✅ 5 fields with capital ranges
<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
  <div>
    <label>Capital Min (DT)</label>
    <input
      type="number"
      step="1"
      defaultValue={Number(rule.minCapital || 0)}
      onBlur={(e) => handleUpdate(rule.id, 'minCapital', e.target.value)}
    />
  </div>
  <div>
    <label>Capital Max (DT)</label>
    <input
      type="number"
      step="1"
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

## 📊 Files Modified

### Backend
1. ✅ `backend/prisma/schema.prisma` - Added `BgCapitalLimit` model
2. ✅ `backend/src/bg-capital-limits/dto/create-bg-capital-limit.dto.ts` - Created
3. ✅ `backend/src/bg-capital-limits/dto/update-bg-capital-limit.dto.ts` - Created
4. ✅ `backend/src/bg-capital-limits/bg-capital-limits.service.ts` - Created
5. ✅ `backend/src/bg-capital-limits/bg-capital-limits.controller.ts` - Created
6. ✅ `backend/src/bg-capital-limits/bg-capital-limits.module.ts` - Created
7. ✅ `backend/src/app.module.ts` - Registered `BgCapitalLimitsModule`
8. ✅ `backend/prisma/seed.ts` - Added BG capital limits seed data
9. ✅ `backend/src/pricing-engine/pricing-engine.service.ts` - Fixed `calculateBG()` logic

### Frontend
10. ✅ `frontend/src/components/simulations/CoverageSelectionStep.tsx` - Dynamic BG limit selector
11. ✅ `frontend/src/pages/admin/formulas/FormulaRatesTab.tsx` - Added capital range fields for BG

---

## 🧪 Testing

### Unit Tests (Backend)
```bash
# Test BG capital limits CRUD
npm run test -- bg-capital-limits.service.spec.ts

# Test pricing engine BG calculation
npm run test -- pricing-engine.service.spec.ts
```

### Integration Tests
```bash
# Test full quote generation with BG
npm run test:e2e -- quotes.e2e-spec.ts
```

### Manual Testing
1. **Seed database:**
   ```bash
   cd backend
   npm run prisma:seed
   ```

2. **Verify BG capital limits:**
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:5000/bg-capital-limits
   ```

3. **Create quote with BG:**
   - Login as client
   - Create simulation with STANDARD formula
   - Select BG guarantee
   - Choose capital limit (e.g., 2000 DT)
   - Generate quote
   - Verify prime: `2000 × 0.065 = 130 DT` (Lloyd) or `2000 × 0.07 = 140 DT` (Amana)

4. **Test tiered rates (after admin configures):**
   - Admin adds rule: Lloyd 0-5k = 6.5%
   - Admin adds rule: Lloyd >5k = 7%
   - Client selects 2000 DT → prime = 130 DT (6.5%)
   - Client selects 6000 DT → prime = 420 DT (7%)

---

## 🚀 Deployment

### 1. Run migration
```bash
cd backend
npx prisma migrate deploy
```

### 2. Run seed (optional, only if fresh DB)
```bash
npm run prisma:seed
```

### 3. Restart backend
```bash
npm run start:prod
```

### 4. Deploy frontend
```bash
cd frontend
npm run build
# Deploy dist/ to hosting
```

---

## 📝 Next Steps

### Optional Enhancements
1. **Create dedicated admin page for BG capital limits**
   - Path: `/admin/bg-capital-limits`
   - Features: Add/edit/delete/deactivate limits
   - Similar to franchise values page

2. **Add bulk import for BG pricing rules**
   - Upload CSV with capital ranges and rates
   - Validate and import in one operation

3. **Add validation for overlapping capital ranges**
   - Prevent admin from creating conflicting rules
   - Example: 0-5k and 3k-7k would overlap

4. **Add BG capital limit recommendations**
   - Based on vehicle value
   - Example: VV = 50k → suggest 2k/3k/5k limits

---

## ✅ Verification Checklist

- [x] `BgCapitalLimit` model exists in schema
- [x] `BgCapitalLimitsModule` registered in `app.module.ts`
- [x] `GET /bg-capital-limits` accessible to all authenticated users
- [x] Admin endpoints protected with `@Roles(Role.ADMINISTRATEUR_ARS)`
- [x] Seed creates 3 default BG capital limits (1k/2k/3k)
- [x] Frontend fetches BG limits from API (not hardcoded)
- [x] Frontend has fallback if API fails
- [x] Admin UI shows 5 fields for BG rules (min/max capital, rate, reduction, actions)
- [x] Admin UI summary line shows capital range and rate
- [x] Pricing engine filters BG rules by capital range
- [x] Pricing engine throws error if BG selected but no capital chosen
- [x] Pricing engine returns null gracefully if capital is 0
- [x] BG is FREE for Tous Risques formula

---

**Date:** 2026-01-XX  
**Author:** Development Team  
**Status:** ✅ COMPLETE - Ready for client validation  
**Estimated Time:** 3-4 hours implementation
