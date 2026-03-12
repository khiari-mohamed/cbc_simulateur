# 📊 Excel to Application Mapping - Complete Reference

## 🎯 Purpose
This document maps how Excel formulas are transformed into the current application system, addressing the client's specific requirements and showing the complete workflow from Excel data entry to quote generation.

---

## 📋 **CLIENT'S SPECIFIC REQUIREMENTS ANALYSIS**

### 1️⃣ **"Tableau Excel pour saisir RC"**
**Requirement**: Excel-like table for RC data entry

**Current State**: ❌ Individual form entries in Tarification module
**Needed**: ✅ Excel-like grid interface for RC table

**Implementation Plan**:
- Create RC table component with Excel-like grid
- Columns: CLASSE | 3-4CV | 5-6CV | 7-10CV | 11-14CV | >=15CV
- Rows: Classes 01-08 with direct cell editing
- Bulk import/export from Excel files

### 2️⃣ **"Les classe sans dédiée uniquement pour la garantie RC"**
**Requirement**: Bonus/Malus classes dedicated only to RC guarantee

**Current State**: ✅ Already implemented correctly
- `bonusMalusClass` field exists only in RC pricing rules
- Other guarantees don't use bonus/malus classes

### 3️⃣ **"Combiné module tarification et configuration Formule"**
**Requirement**: Combine Tarification + Formules modules

**Current State**: ❌ Separate modules cause confusion
**Needed**: ✅ Single unified module

**Implementation Plan**:
- Merge `/admin/pricing-rules` + `/admin/formulas` into `/admin/pricing-management`
- Tabbed interface: RC Table | Guarantees | Formulas | DC Configuration
- Maintain all current parameters and functionality

### 4️⃣ **"Ajouter les paliers de valeurs (min et max) à neuf et vénale"**
**Requirement**: Add min/max value ranges for new/market values per guarantee

**Current State**: ⚠️ Partially implemented
- `minMarketValue`/`maxMarketValue` exist in PricingRule table
- Not exposed in UI for all guarantees

**Needed**: ✅ UI fields for value ranges
- Add min/max value inputs for each guarantee
- Show which formula applies to which value range

### 5️⃣ **"Vérifier l'implémentation de la méthode Progressive"**
**Requirement**: Verify Progressive method for Dommages Collision

**Current State**: ✅ Correctly implemented
```typescript
// Progressive calculation logic in pricing-engine.service.ts
if (capitalPercent.lte(10)) {
  // Simple case: <= 10%
  primeVariable = capital.mul(tier1.tierRate);
} else {
  // Progressive calculation: each tranche = 10% of VV
  while (capitalRemaining.gt(0)) {
    const tier = tiers[tierIndex];
    const amountInTier = capitalRemaining.gt(trancheSize) ? trancheSize : capitalRemaining;
    primeVariable = primeVariable.add(amountInTier.mul(tier.tierRate));
    // ... continue progressive calculation
  }
}
```

### 6️⃣ **"Model Matrice Dommages Collision: taux de réduction par tranche"**
**Requirement**: Reduction rate per VV/VN range with dropdown choice

**Current State**: ⚠️ Partially implemented
- Matrix model exists (`DcMatrixVvRange`, `DcMatrixPrice`)
- General reduction rate in `DcConfig.discountPercent`
- Missing: Per-range reduction rates

**Needed**: ✅ Enhanced matrix model
- Add `reductionRate` field to `DcMatrixVvRange` table
- UI dropdown to choose VV or VN for reduction calculation
- If no range-specific rate, use general rate from `DcConfig`

### 7️⃣ **"Liaison tableau dommages collision"**
**Requirement**: Link/connection for DC tables

**Current State**: ✅ Already implemented
- `DcMatrixPrice` links VV ranges to capitals
- Foreign keys: `vvRangeId` → `DcMatrixVvRange`, `capitalId` → `DcMatrixCapital`

### 8️⃣ **"Liste déroulante garanties (choix valeur, choix de formules, choix de l'usage)"**
**Requirement**: Dropdown lists for guarantees with value/formula/usage choices

**Current State**: ❌ Not implemented as requested
**Needed**: ✅ Enhanced guarantee selection UI
- Guarantee dropdown with sub-options:
  - Value type choice (VV/VN)
  - Formula choice (Progressive/Matrix for DC)
  - Usage type choice (Private/Commercial/Taxi/Rental)

---

## 📋 Current Excel Structure vs App Implementation

### 1️⃣ **RC (Responsabilité Civile) - TABLEAU RC**

#### Excel Structure:
```
CLASSE | TAUX DE PRIME | 3-4CV | 5-6CV | 7-10CV | 11-14CV | >=15CV
01     | 70%          | 77,000| 98,000| 119,000| 154,000| 184,800
02     | 80%          | 88,000|112,000| 136,000| 176,000| 211,200
...
```

#### App Implementation:
- **Database Table**: `PricingRule`
- **Fields Used**:
  - `companyId` (Lloyd/Amana)
  - `guaranteeId` (RC guarantee ID)
  - `minPower` / `maxPower` (CV ranges: 3-4, 5-6, 7-10, 11-14, >=15)
  - `bonusMalusClass` (1-8 classes)
  - `fixedPremium` (exact premium amount)

#### How to Enter in App:
1. Go to **Tarification** module
2. Select **Company** (Lloyd/Amana)
3. Select **Guarantee** = RC
4. Set **Power Range**: minPower=3, maxPower=4
5. Set **Bonus/Malus Class** = 1
6. Set **Fixed Premium** = 77000
7. Repeat for all combinations

---

### 2️⃣ **VOL & INCENDIE - Formula Based**

#### Excel Old Formula:
```
VOL = (((valeur vénale*2,36)/1000)+30)*taux de réduction
INCENDIE = (((valeur vénale*2,75)/1000)+30)*taux de réduction
```

#### Excel New Formula:
```
VOL = ((valeur vénale*taux de prime Vol)+Prime Fixe Vol)*taux de réduction
INCENDIE = ((valeur vénale*taux de prime Incendie)+Prime Fixe Incendie)*taux de réduction
```

#### App Implementation:
- **Database Table**: `PricingRule`
- **Fields Used**:
  - `ratePercentage` (taux de prime)
  - `fixedPremium` (Prime Fixe)
  - `reductionRate` (taux de réduction)
  - `formula` (custom formula string)

#### Current App Formula Logic:
```typescript
// In pricing-engine.service.ts
if (rule.formula) {
  const variables = {
    VV: vehicle.marketValue.toNumber(),
    rate: rule.ratePercentage?.toNumber() || 0,
    fixed: rule.fixedPremium?.toNumber() || 0,
    reduction: rule.reductionRate ? (1 - rule.reductionRate.toNumber() / 100) : 1,
  };
  prime = new Decimal(this.formulaEvaluator.evaluateFormula(rule.formula, variables));
} else {
  // Fallback: VV * rate + fixed * reduction
  prime = vehicle.marketValue.mul(rule.ratePercentage).add(rule.fixedPremium);
  if (rule.reductionRate && rule.reductionRate.gt(0)) {
    const multiplier = new Decimal(1).sub(rule.reductionRate.div(100));
    prime = prime.mul(multiplier);
  }
}
```

#### How to Enter in App:
1. **Tarification** module
2. Select **Company** + **Guarantee** (VOL/INCENDIE)
3. **Option A - Use Formula Field**:
   - Set `formula` = `"((VV * rate) + fixed) * reduction"`
   - Set `ratePercentage` = 0.00236 (for VOL)
   - Set `fixedPremium` = 30
   - Set `reductionRate` = convention reduction %

4. **Option B - Use Legacy Fields**:
   - Set `ratePercentage` = 0.00236
   - Set `fixedPremium` = 30
   - Set `reductionRate` = reduction %

---

### 3️⃣ **TOUS RISQUES - Franchise Based**

#### Excel Structure:
```
Franchise | Taux    | Fixe
0%        | 0.032   | 22,000
1%        | 0.0265  | 21,750
2%        | 0.021   | 19,000
4%        | 0.017   | 15,000
```

#### Excel New Formula:
```
=((valeur à neuf*taux de prime tous risques X%)+Prime Fixe Tous risques X%)*taux de réduction
```

#### App Implementation:
- **Database Table**: `PricingRule`
- **Fields Used**:
  - `guaranteeId` (TOUS_RISQUES_ZERO)
  - `franchiseRate` (0, 1, 2, 4)
  - `ratePercentage` (0.032, 0.0265, 0.021, 0.017)
  - `fixedPremium` (22000, 21750, 19000, 15000)

#### How to Enter in App:
1. **Tarification** module
2. Select **Guarantee** = TOUS_RISQUES_ZERO
3. Set **Franchise Rate** = 0
4. Set **Rate Percentage** = 0.032
5. Set **Fixed Premium** = 22000
6. Repeat for each franchise rate

---

### 4️⃣ **Company-Specific Fixed Premiums**

#### Excel Structure:
```
                LLOYD   AMANA
Assistance      115,000 90,000
CAS             45,000  20,000
PTA (5000)      21,000  32,000
PTA (10000)     42,000  64,000
BG              6.5%    7%
Frais contrat   30,000  20,000
```

#### App Implementation:
- **Database Table**: `PricingRule` + `Company`
- **Fields Used**:
  - `companyId` (Lloyd/Amana)
  - `fixedPremium` (for fixed amounts)
  - `ratePercentage` (for BG percentages)
  - `minCapital` (for PTA capital tiers)
  - `contractFees` (in Company table)

#### How to Enter in App:
1. **Companies** module for contract fees
2. **Tarification** module for guarantees:
   - ASSISTANCE: Lloyd=115000, Amana=90000
   - CAS: Lloyd=45000, Amana=20000
   - PTA: Multiple rules with minCapital + fixedPremium
   - BG: ratePercentage = 0.065 (Lloyd), 0.07 (Amana)

---

### 5️⃣ **DOMMAGES COLLISION - Complex Progressive/Matrix**

#### Excel Requirements (from Word doc):
- **Progressive Method**: Tier-based calculation
- **Matrix Method**: VV Range × Capital lookup
- **Configurable Parameters**:
  - Taux par tranche (tier rates)
  - Prime fixe (base premium)
  - Paliers de capital (capital tiers)
  - Plafond du capital (capital ceiling)
  - Taux de réduction (reduction rate)

#### App Implementation:
- **Database Tables**:
  - `DcConfig` (general configuration)
  - `DcProgressiveTier` (tier rates for progressive method)
  - `DcMatrixVvRange` (VV ranges for matrix method)
  - `DcMatrixCapital` (capital amounts for matrix method)
  - `DcMatrixPrice` (price lookup for matrix method)
  - `DcCapitalTier` (capital step validation)

#### Current App Logic:
```typescript
// In pricing-engine.service.ts - calculateDOMMAGES_COLLISIONS()
if (dcConfig.useMatrix) {
  return await this.calculateDC_Matrix(...);
} else {
  return await this.calculateDC_Progressive(...);
}
```

#### How to Enter in App:
1. **Formules** module → **Dommages Collision**
2. **Configuration**:
   - Set `useMatrix` = true/false
   - Set `minCapital`, `maxCapitalPercent`, `maxCapitalAbsolute`
   - Set `basePremium`, `discountPercent`

3. **Progressive Method**:
   - Add tiers in `DcProgressiveTier`
   - Set `tierNumber`, `tierRate`

4. **Matrix Method**:
   - Add VV ranges in `DcMatrixVvRange`
   - Add capital amounts in `DcMatrixCapital`
   - Fill price matrix in `DcMatrixPrice`

---

## 🔄 Complete Workflow: Excel → App → Quote

### Step 1: Data Entry (Admin)
```
Excel Data → Admin Interface → Database Tables
```

### Step 2: Quote Generation (Client)
```
Client Input → Pricing Engine → Formula Calculation → Quote PDF
```

### Step 3: Formula Evaluation
```typescript
// Example: VOL calculation
const variables = {
  VV: 15000,           // Vehicle market value
  rate: 0.00236,       // From PricingRule.ratePercentage
  fixed: 30,           // From PricingRule.fixedPremium
  reduction: 0.9       // 10% reduction
};
// Result: ((15000 * 0.00236) + 30) * 0.9 = 58.86
```

---

## 🎯 **Current State Analysis - Updated Based on Client Notes**

### ✅ **What Works Perfectly (Client Requirements Met)**
1. **RC Bonus/Malus Classes**: ✅ Dedicated only to RC guarantee
2. **Progressive DC Method**: ✅ Correctly implemented with tier-based calculation
3. **DC Table Linking**: ✅ Matrix tables properly linked via foreign keys
4. **Formula Evaluation**: ✅ Dynamic formula system supports Excel formulas
5. **Company-specific Values**: ✅ All fixed premiums work correctly

### ⚠️ **Areas Needing Immediate Attention (Client Requirements)**
1. **Excel-like RC Table**: ❌ Missing grid interface for RC data entry
2. **Combined Modules**: ❌ Tarification + Formules still separate
3. **Value Range UI**: ❌ Min/max value fields not exposed in UI
4. **Per-Range Reduction Rates**: ❌ DC matrix missing range-specific reduction rates
5. **Enhanced Guarantee Dropdowns**: ❌ Missing value/formula/usage choice dropdowns

### 🔧 **Missing Features (From Client Notes)**
1. **RC Excel Table**: No grid interface for bulk RC data entry
2. **Value Range Configuration**: Min/max VV/VN not configurable per guarantee
3. **Matrix Reduction Rates**: No per-VV-range reduction rates in DC matrix
4. **Dropdown Enhancement**: Guarantee selection lacks sub-options
5. **Module Integration**: UI still confusing with separate modules

---

## 📝 **Updated Recommendations for Client**

### 1️⃣ **Priority 1: UI Restructuring** 🚨
- **Combine modules**: Merge Tarification + Formules into single interface
- **RC Excel table**: Create grid component for bulk RC data entry
- **Value ranges**: Add min/max VV/VN fields to all guarantee forms

### 2️⃣ **Priority 2: DC Matrix Enhancement** 🎯
- **Per-range reduction**: Add reduction rate field to each VV range
- **VV/VN choice**: Dropdown to select value type for reduction calculation
- **Enhanced dropdowns**: Add value/formula/usage sub-options

### 3️⃣ **Priority 3: Excel Integration** 🔧
- **Import/Export**: Direct Excel file handling for RC table
- **Template system**: Predefined Excel-like templates
- **Bulk operations**: Update multiple rules at once

---

## 🚀 **Implementation Roadmap (Based on Client Notes)**

### Phase 1: Module Restructuring (Week 1-2)
1. Create unified pricing management interface
2. Implement RC Excel-like grid component
3. Add value range fields to guarantee forms

### Phase 2: DC Matrix Enhancement (Week 3)
1. Add per-range reduction rates to DC matrix
2. Implement VV/VN choice dropdown
3. Enhanced guarantee selection with sub-options

### Phase 3: Excel Integration (Week 4)
1. Excel import/export functionality
2. Bulk data operations
3. Template management system

---

**This updated analysis directly addresses all client requirements and provides a clear implementation path!** 🎯

---

*This document serves as the complete reference for understanding how Excel formulas are transformed and applied in the current application system.*