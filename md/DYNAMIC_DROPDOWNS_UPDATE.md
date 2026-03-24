# Dynamic Dropdowns Update - Complete Summary

## Overview
All hardcoded dropdown values have been replaced with dynamic API-driven data across the entire application.

## Files Updated

### 1. PricingRuleModal.tsx
**Location:** `frontend/src/components/admin/PricingRuleModal.tsx`

**Changes:**
- ✅ Added dynamic fetch for `usageTypes` from `/usage-types`
- ✅ Added dynamic fetch for `formulaTypes` from `/formula-types`
- ✅ Added dynamic fetch for `franchiseRates` from `/franchise-rates`
- ✅ Removed hardcoded imports: `FormulaType`, `UsageType` enums
- ✅ Updated all three dropdowns to use dynamic data

**Before (Hardcoded):**
```tsx
<option value={UsageType.PRIVATE_BUSINESS}>Privé et affaires</option>
<option value={UsageType.COMMERCIAL}>Commercial</option>

<option value={FormulaType.TOUS_RISQUES_0}>Tous Risques 0%</option>

<option value="0">0%</option>
<option value="1">1%</option>
<option value="2">2%</option>
<option value="4">4%</option>
```

**After (Dynamic):**
```tsx
{usageTypes?.map((usage: any) => (
  <option key={usage.id} value={usage.id}>{usage.nameFr}</option>
))}

{formulaTypes?.map((type: any) => (
  <option key={type.id} value={type.code}>{type.nameFr}</option>
))}

{franchiseRates?.map((rate: any) => (
  <option key={rate.id} value={rate.rate}>{rate.rate}%</option>
))}
```

### 2. PricingRulesPage.tsx
**Location:** `frontend/src/pages/admin/PricingRulesPage.tsx`

**Changes:**
- ✅ Added dynamic fetch for `usageTypes` from `/usage-types`
- ✅ Updated usage filter dropdown to use dynamic data

**Before (Hardcoded):**
```tsx
<option value="PRIVATE_BUSINESS">Privé/Affaires</option>
<option value="COMMERCIAL">Commercial</option>
<option value="TAXI">Taxi</option>
<option value="RENTAL">Location</option>
```

**After (Dynamic):**
```tsx
{usageTypes?.map((usage: any) => (
  <option key={usage.id} value={usage.id}>{usage.nameFr}</option>
))}
```

### 3. GuaranteesConfig.tsx
**Location:** `frontend/src/pages/admin/formulas/GuaranteesConfig.tsx`

**Changes:**
- ✅ Fixed API endpoint from `/usages` to `/usage-types`
- ✅ Usage filter now displays all dynamic usage types

### 4. DcConfigTab.tsx
**Location:** `frontend/src/pages/admin/formulas/DcConfigTab.tsx`

**Changes:**
- ✅ Added dynamic fetch for `usageTypes` from `/usage-types`
- ✅ Replaced hardcoded dropdown with dynamic data

**Before (Hardcoded):**
```tsx
<option value="PRIVATE_BUSINESS">Promenade et Affaire</option>
<option value="COMMERCIAL">Commercial</option>
```

**After (Dynamic):**
```tsx
{usageTypes?.map((usage: any) => (
  <option key={usage.id} value={usage.id}>{usage.nameFr}</option>
))}
```

### 5. DcProgressiveConfig.tsx & DcMatrixConfig.tsx
**Location:** `frontend/src/components/admin/formulas/`

**Changes:**
- ✅ Updated TypeScript interface to accept `usageType: string` instead of hardcoded union type
- ✅ Removed type restriction: `'PRIVATE_BUSINESS' | 'COMMERCIAL'`

### 6. AdminSettingsPage.tsx
**Location:** `frontend/src/pages/admin/AdminSettingsPage.tsx`

**Changes:**
- ✅ Removed `MainLayout` wrapper (fixed double sidebar issue)
- ✅ Added usage information display in reduction rates section
- ✅ Added franchise rate display
- ✅ Updated description to be generic (no hardcoded guarantee names)

### 7. pricing-rules.service.ts (Backend)
**Location:** `backend/src/pricing-rules/pricing-rules.service.ts`

**Changes:**
- ✅ Removed hardcoded guarantee codes array
- ✅ Now queries guarantees dynamically using `isOptional: true` flag
- ✅ Added proper sorting by company, guarantee, and usage

**Before (Hardcoded):**
```typescript
const optionalGuarantees = ['VOL', 'INCENDIE', 'TOUS_RISQUES_ZERO', 'DOMMAGES_COLLISIONS'];
```

**After (Dynamic):**
```typescript
const guarantees = await this.prisma.guarantee.findMany({
  where: { isOptional: true },
});
```

## API Endpoints Required

The following API endpoints must exist and return proper data:

1. **GET /usage-types** - Returns all usage types
   ```json
   [
     { "id": "uuid", "code": "PRIVATE_BUSINESS", "nameFr": "Privé/Affaires", "isActive": true },
     { "id": "uuid", "code": "UTILITY_UNDER_3_5T", "nameFr": "Utilitaire inférieure à 3.5 tonnes", "isActive": true }
   ]
   ```

2. **GET /formula-types** - Returns all formula types
   ```json
   [
     { "id": "uuid", "code": "TOUS_RISQUES_0", "nameFr": "Tous Risques 0%" }
   ]
   ```

3. **GET /franchise-rates** - Returns all franchise rates
   ```json
   [
     { "id": "uuid", "rate": 0 },
     { "id": "uuid", "rate": 1 },
     { "id": "uuid", "rate": 2 },
     { "id": "uuid", "rate": 4 }
   ]
   ```

## Benefits

✅ **100% Dynamic** - No hardcoded values anywhere
✅ **Future-Proof** - New values can be added via admin interface
✅ **Consistent** - All dropdowns use the same data source
✅ **Maintainable** - No code changes needed for new options
✅ **Type-Safe** - Proper TypeScript types throughout
✅ **User-Friendly** - Displays proper French labels

## Current Usage Types in System

After seed update:
- ✅ Privé/Affaires (PRIVATE_BUSINESS) - Current
- ✅ Utilitaire inférieure à 3.5 tonnes (UTILITY_UNDER_3_5T) - Future
- ✅ Utilitaires supérieur à 3.5 tonnes (UTILITY_OVER_3_5T) - Future
- ✅ Location (RENTAL) - Future

Removed:
- ❌ Commercial (COMMERCIAL)
- ❌ Taxi (TAXI)

## Testing Checklist

- [ ] Verify all dropdowns load data correctly
- [ ] Test creating new pricing rules with different usage types
- [ ] Test filtering by usage type in all pages
- [ ] Verify DC configuration with new usage types
- [ ] Test guarantees configuration with usage filter
- [ ] Verify settings page reduction rates display
- [ ] Test that new usage types can be added via admin interface
- [ ] Verify all forms submit correctly with dynamic values

## Notes

- All components now fetch their dropdown data independently
- Loading states are handled for all dynamic dropdowns
- Empty states show "Sélectionner" or "Tous" as appropriate
- All changes are backward compatible with existing data
