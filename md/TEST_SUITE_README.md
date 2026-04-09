# 🧪 Quote Generation Test Suite

Comprehensive test suite to validate the insurance quote generation system with different scenarios.

## 📋 Test Scripts

### 1. `validate-system.ts` - System Validation
**Purpose:** Quick health check to ensure the system is ready for testing

**What it checks:**
- ✅ All guarantees have systemRole assigned
- ✅ Pricing rules exist for mandatory guarantees
- ✅ Usage types are configured
- ✅ Companies are active
- ✅ RC pricing rules coverage
- ✅ Test user exists

**Run:**
```bash
npx ts-node validate-system.ts
```

**Expected output:**
```
🎉 SYSTEM READY: All checks passed!
```

---

### 2. `test-quote-generation.ts` - Comprehensive Test Suite
**Purpose:** Test 13 different scenarios covering various vehicle types, formulas, and edge cases

**Test Scenarios:**

#### ✅ Success Scenarios (10 tests)
1. **Standard Formula - Basic Vehicle** - New vehicle, no optional guarantees
2. **Standard Formula - With Optional Guarantees** - BG + INCENDIE_EMEUTES
3. **Tous Risques 0% - New Vehicle** - Brand new vehicle, franchise 0%
4. **Tous Risques 0% - With Franchise 5%** - New vehicle with franchise
5. **Dommages Collision - 5 Year Old Vehicle** - DC with capital selection
6. **High Bonus - 50% Reduction** - Excellent driving record
7. **High Malus - 200%** - Poor driving record
8. **Utility Vehicle - Under 3.5T** - Commercial vehicle
9. **Low Value Vehicle - 10,000 DT** - Old vehicle
10. **High Value Vehicle - 300,000 DT** - Luxury vehicle
11. **Maximum Coverage** - All optional guarantees

#### ❌ Error Scenarios (2 tests)
12. **TR 0% on Old Vehicle** - Should fail (age > 2 years)
13. **DC on Old Vehicle** - Should fail (age > 10 years)

**Run:**
```bash
# Make sure backend is running first
npm run start:dev

# In another terminal:
npx ts-node test-quote-generation.ts
```

**Expected output:**
```
📊 TEST SUMMARY
================================================================================

Total Tests: 13
✅ Passed: 13
❌ Failed: 0
⏱️  Total Duration: 5000ms

🎉 ALL TESTS PASSED!
```

---

### 3. `check-incendie-rules.ts` - INCENDIE Validation
**Purpose:** Check if INCENDIE guarantee has systemRole and pricing rules

**Run:**
```bash
npx ts-node check-incendie-rules.ts
```

---

### 4. `assign-system-roles.ts` - System Role Assignment
**Purpose:** Assign systemRole to all guarantees in local database

**Run:**
```bash
npx ts-node assign-system-roles.ts
```

---

## 🚀 Quick Start

### Step 1: Validate System
```bash
npx ts-node validate-system.ts
```

If any checks fail, fix them before proceeding.

### Step 2: Start Backend
```bash
npm run start:dev
```

### Step 3: Run Tests
```bash
npx ts-node test-quote-generation.ts
```

---

## 📊 Test Coverage

### Vehicle Types
- ✅ New vehicles (< 1 year)
- ✅ Recent vehicles (1-2 years)
- ✅ Mid-age vehicles (3-9 years)
- ✅ Old vehicles (10+ years)

### Market Values
- ✅ Low value (10,000 DT)
- ✅ Medium value (50,000 DT)
- ✅ High value (300,000 DT)

### Formulas
- ✅ STANDARD
- ✅ TOUS_RISQUES_0 (franchise 0%, 5%)
- ✅ DOMMAGES_COLLISIONS

### Usage Types
- ✅ PRIVATE_BUSINESS
- ✅ UTILITY_UNDER_3_5T
- ✅ UTILITY_OVER_3_5T
- ✅ RENTAL

### Bonus-Malus
- ✅ High bonus (50%)
- ✅ Normal (100%)
- ✅ High malus (200%)

### Optional Guarantees
- ✅ BG (Bris de Glaces)
- ✅ INCENDIE_EMEUTES
- ✅ CATASTROPHES_NATURELLES
- ✅ DOMMAGES_EMEUTES
- ✅ DEFENSE_RECOURS
- ✅ ASSURANCE_CONDUCTEUR

### Edge Cases
- ✅ Business rule violations (TR 0% on old vehicle)
- ✅ Age restrictions (DC on old vehicle)
- ✅ Multiple optional guarantees
- ✅ Different capital selections

---

## 🔧 Troubleshooting

### ❌ "INCENDIE guarantee not found"
**Solution:**
```bash
npx ts-node assign-system-roles.ts
```

### ❌ "INCENDIE pricing rule not found"
**Solution:**
```bash
# Check if rules exist
npx ts-node check-incendie-rules.ts

# If no rules, run seed
npx ts-node prisma/seed.ts
```

### ❌ "Test user not found"
**Solution:**
```bash
npx ts-node prisma/seed.ts
```

### ❌ "Usage type not found"
**Solution:**
```bash
npx ts-node prisma/seed.ts
```

---

## 📝 Adding New Test Scenarios

Edit `test-quote-generation.ts` and add to `TEST_SCENARIOS` array:

```typescript
{
  name: 'Your Test Name',
  description: 'Description of what you are testing',
  vehicleData: {
    brand: 'Brand',
    model: 'Model',
    fiscalHorsepower: 7,
    numberOfSeats: 5,
    firstCirculationDate: '2023-01-01',
    newValue: 50000,
    marketValue: 45000
  },
  simulationData: {
    bonusMalus: 100,
    usageType: 'PRIVATE_BUSINESS',
    formulaType: 'STANDARD',
    selectedGuarantees: ['BG'],
    selectedCapitals: { 'BG': 2000 }
  },
  expectedResult: 'SUCCESS' // or 'ERROR'
}
```

---

## 🎯 Production Testing

For production, use the production-specific scripts:

```bash
# Check INCENDIE on production
npx ts-node check-incendie-rules-prod.ts

# Assign system roles on production
npx ts-node assign-system-roles-prod.ts
```

**⚠️ WARNING:** Do NOT run `test-quote-generation.ts` on production - it will create test data!

---

## ✅ Success Criteria

All tests should pass with:
- ✅ Quotes generated for both companies (Lloyd + Amana)
- ✅ Correct pricing calculations
- ✅ No errors for valid scenarios
- ✅ Expected errors for invalid scenarios
- ✅ Total duration < 10 seconds

---

## 📞 Support

If tests fail:
1. Check `validate-system.ts` output
2. Verify backend logs
3. Check database has all required data
4. Ensure systemRole is assigned to all guarantees

---

**Last Updated:** 2026-01-02
**Version:** 1.0.0
