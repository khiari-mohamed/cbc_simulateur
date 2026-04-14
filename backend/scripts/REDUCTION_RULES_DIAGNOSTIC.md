# Reduction Rules Diagnostic Script

## Purpose
This script checks ALL reduction rules in the database and compares VOL vs INCENDIE discounts to diagnose why they might be different.

## Problem Being Diagnosed
**Client Issue:** In a Tous Risques 0% quote with VN=110,000 DT and VV=80,000 DT:
- INCENDIE gets 45% discount ✅ CORRECT
- VOL gets 35% discount ❌ WRONG - should be 45%

## Prerequisites
Make sure your `.env` file has both database URLs:

```env
# Development database
DATABASE_URL="postgresql://user:password@localhost:5432/cbc_dev"

# Production database
PROD_DATABASE_URL="postgresql://user:password@prod-server:5432/cbc_prod"
```

## Usage

### Check Development Database
```bash
cd backend
node scripts/check-all-reduction-rules.js dev
```

### Check Production Database
```bash
cd backend
node scripts/check-all-reduction-rules.js prod
```

## What the Script Does

1. **Lists all active entities:**
   - Companies (LLOYD, AL BARAKA, etc.)
   - Conventions
   - Guarantees (VOL, INCENDIE, etc.)

2. **Shows all reduction rules grouped by:**
   - Convention
   - Guarantee
   - With full details (metric, range, discount %, priority, etc.)

3. **Critical Analysis:**
   - Compares VOL vs INCENDIE rules side-by-side
   - Highlights discrepancies in discount percentages
   - Shows missing rules

4. **Test Case Simulation:**
   - Simulates the exact client test case
   - Shows which rules would be applied
   - Identifies the problem

## Expected Output

The script will show:
- ✅ Rules that match correctly
- ❌ Discrepancies found (VOL ≠ INCENDIE)
- ⚠️ Missing rules
- 🔧 Recommendations for fixes

## Example Output

```
═══════════════════════════════════════════════════════════════
  CRITICAL ANALYSIS: VOL vs INCENDIE Comparison
═══════════════════════════════════════════════════════════════

📊 Convention: Convention Entreprise

  VOL Rules: 2
    1. Metric: NEW_VALUE, Range: 0-100000, Discount: 35%, Formula: TOUS_RISQUES_0
    2. Metric: MARKET_VALUE, Range: 0-100000, Discount: 40%, Formula: null

  INCENDIE Rules: 2
    1. Metric: NEW_VALUE, Range: 0-100000, Discount: 45%, Formula: TOUS_RISQUES_0
    2. Metric: MARKET_VALUE, Range: 0-100000, Discount: 40%, Formula: null

  ❌ DISCREPANCY FOUND:
     Metric: NEW_VALUE, Range: 0-100000, Formula: TOUS_RISQUES_0
     VOL discount: 35%
     INCENDIE discount: 45%
     Difference: 10%
```

## Next Steps After Running

1. **Compare dev vs prod:**
   - Run script on both databases
   - Check if they have the same rules
   - Identify which database needs fixing

2. **Identify the problem:**
   - Look for VOL rules with wrong discount %
   - Check if rules are missing
   - Verify metric types (NEW_VALUE vs MARKET_VALUE)

3. **Fix the issue:**
   - Update the wrong VOL rule to match INCENDIE
   - Or create missing rules
   - Test with the client's exact data

## Common Issues to Look For

1. **Wrong discount percentage:**
   - VOL has 35% but should be 45%

2. **Wrong metric:**
   - Rule uses MARKET_VALUE instead of NEW_VALUE for TR 0%

3. **Missing formula filter:**
   - Rule applies to ALL formulas instead of just TOUS_RISQUES_0

4. **Wrong priority:**
   - Multiple rules exist but wrong one is being selected

5. **Missing rule:**
   - INCENDIE has a rule but VOL doesn't

## Files
- `check-all-reduction-rules.js` - Main diagnostic script
- `REDUCTION_RULES_DIAGNOSTIC.md` - This documentation
