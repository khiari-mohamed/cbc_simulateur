# 🏗️ Architecture Diagram - Unified Pricing Management

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (Frontend - React/TypeScript)                │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SIDEBAR NAVIGATION                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  "Gestion Tarification" → /admin/pricing-management     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              PRICING MANAGEMENT PAGE (NEW)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    3 TABS                                │  │
│  │  ┌────────────┬────────────────┬──────────────────────┐ │  │
│  │  │ Tableau RC │   Garanties    │ Dommages Collision   │ │  │
│  │  └────────────┴────────────────┴──────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                    │                      │
         ▼                    ▼                      ▼
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  RcTableGrid    │  │ GuaranteesConfig │  │   DcConfigTab    │
│   Component     │  │    Component     │  │   Component      │
│                 │  │                  │  │                  │
│ • Excel grid    │  │ • Collapsible    │  │ • Progressive    │
│ • Cell edit     │  │   groups         │  │ • Matrix         │
│ • Import/Export │  │ • Add/Edit/Del   │  │ • Existing UI    │
│ • Batch save    │  │ • Export CSV     │  │   (unchanged)    │
└─────────────────┘  └──────────────────┘  └──────────────────┘
         │                    │                      │
         │                    ▼                      │
         │           ┌──────────────────┐           │
         │           │GuaranteeRuleModal│           │
         │           │   Component      │           │
         │           │                  │           │
         │           │ • Contextual     │           │
         │           │   fields         │           │
         │           │ • Hints          │           │
         │           │ • Validation     │           │
         │           └──────────────────┘           │
         │                    │                      │
         └────────────────────┴──────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (REST)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  GET    /pricing-rules                                   │  │
│  │  GET    /pricing-rules/:id                               │  │
│  │  POST   /pricing-rules                                   │  │
│  │  PATCH  /pricing-rules/:id                               │  │
│  │  DELETE /pricing-rules/:id                               │  │
│  │  GET    /companies                                       │  │
│  │  GET    /guarantees                                      │  │
│  │  GET    /dc-config                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND SERVICES                              │
│                  (NestJS - TypeScript)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PricingRulesController  ✅ UNCHANGED                    │  │
│  │  PricingRulesService     ✅ UNCHANGED                    │  │
│  │  DcConfigController      ✅ UNCHANGED                    │  │
│  │  DcConfigService         ✅ UNCHANGED                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PRICING ENGINE                                │
│                  (Business Logic Layer)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PricingEngineService    ✅ UNCHANGED                    │  │
│  │  ├─ calculateRC()                                        │  │
│  │  ├─ calculateVOL()                                       │  │
│  │  ├─ calculateINCENDIE()                                  │  │
│  │  ├─ calculateTOUS_RISQUES()                              │  │
│  │  ├─ calculateDC_Progressive()  ✅ VERIFIED               │  │
│  │  ├─ calculateDC_Matrix()       ✅ VERIFIED               │  │
│  │  └─ calculateOtherGuarantees()                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                             │
│                    (PostgreSQL + Prisma)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PricingRule         ✅ UNCHANGED                        │  │
│  │  Company             ✅ UNCHANGED                        │  │
│  │  Guarantee           ✅ UNCHANGED                        │  │
│  │  DcConfig            ✅ UNCHANGED                        │  │
│  │  DcProgressiveTier   ✅ UNCHANGED                        │  │
│  │  DcMatrixVvRange     ✅ UNCHANGED                        │  │
│  │  DcMatrixCapital     ✅ UNCHANGED                        │  │
│  │  DcMatrixPrice       ✅ UNCHANGED                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow - RC Table Example

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. USER ACTION: Edit cell in RC table                           │
│    Class 01, 3-4 CV → 77000                                      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND: RcTableGrid component                              │
│    • Tracks change in state (editedCells Map)                   │
│    • Highlights cell in blue                                     │
│    • Enables "Sauvegarder" button                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. USER ACTION: Click "Sauvegarder"                             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. FRONTEND: Batch API calls                                    │
│    For each edited cell:                                         │
│    • If rule exists: PATCH /pricing-rules/:id                   │
│    • If new rule: POST /pricing-rules                           │
│    Data: {                                                       │
│      companyId, guaranteeId,                                     │
│      bonusMalusClass: 1,                                         │
│      minPower: 3, maxPower: 4,                                   │
│      fixedPremium: 77000                                         │
│    }                                                             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. BACKEND: PricingRulesController                              │
│    • Validates request                                           │
│    • Calls PricingRulesService                                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. BACKEND: PricingRulesService                                 │
│    • Creates/updates PricingRule in database                     │
│    • Returns saved rule                                          │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 7. DATABASE: Prisma ORM                                         │
│    INSERT/UPDATE PricingRule table                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 8. FRONTEND: Success feedback                                   │
│    • Clear editedCells state                                     │
│    • Remove blue highlighting                                    │
│    • Show success toast                                          │
│    • Refresh data                                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow - Quote Calculation (Unchanged)

```
┌──────────────────────────────────────────────────────────────────┐
│ USER: Creates simulation with vehicle data                      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ FRONTEND: Sends quote request                                   │
│ POST /quotes                                                     │
│ {                                                                │
│   companyId, vehicleData, selectedGuarantees, ...               │
│ }                                                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ BACKEND: QuotesController → QuotesService                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ PRICING ENGINE: PricingEngineService.calculatePremium()         │
│                                                                  │
│ 1. calculateRC()                                                 │
│    • Finds PricingRule by:                                       │
│      - companyId                                                 │
│      - guaranteeId (RC)                                          │
│      - bonusMalusClass                                           │
│      - minPower/maxPower (fiscalHorsepower)                      │
│    • Returns fixedPremium                                        │
│                                                                  │
│ 2. calculateVOL()                                                │
│    • Finds PricingRule                                           │
│    • Applies formula: ((VV * rate) + fixed) * reduction          │
│                                                                  │
│ 3. calculateINCENDIE()                                           │
│    • Same as VOL with different rate                             │
│                                                                  │
│ 4. calculateTOUS_RISQUES() (if selected)                         │
│    • Finds rule by franchiseRate                                 │
│    • Applies formula: ((VN * rate) + fixed) * reduction          │
│                                                                  │
│ 5. calculateDC_Progressive() or calculateDC_Matrix()             │
│    • Progressive: Tier-based degressive calculation              │
│    • Matrix: VV × Capital lookup                                 │
│                                                                  │
│ 6. calculateOtherGuarantees()                                    │
│    • CAS, ASSISTANCE, PTA, BG, etc.                              │
│                                                                  │
│ 7. Calculate taxes and fees                                      │
│    • 12% tax on (primeNette + frais)                             │
│    • 2% tax on (primeRC + frais)                                 │
│    • Add FPAC, FSSR, FG                                          │
│                                                                  │
│ Returns: {                                                       │
│   primeNette, frais, taxes, totalAPayer,                         │
│   items: [{ guaranteeCode, capital, prime }, ...]                │
│ }                                                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ BACKEND: Saves Quote to database                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ FRONTEND: Displays quote to user                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Points

### ✅ What Changed
```
┌─────────────────────────────────────────┐
│         FRONTEND ONLY                   │
│  • New unified page                     │
│  • Excel-like RC table                  │
│  • Simplified guarantee config          │
│  • Better navigation                    │
└─────────────────────────────────────────┘
```

### ✅ What Stayed the Same
```
┌─────────────────────────────────────────┐
│         BACKEND 100%                    │
│  • All calculations                     │
│  • All formulas                         │
│  • All APIs                             │
│  • Database schema                      │
│  • Business logic                       │
└─────────────────────────────────────────┘
```

---

## 📊 Component Hierarchy

```
PricingManagementPage
├── Tabs
│   ├── Tab: "Tableau RC"
│   │   └── RcTableGrid
│   │       ├── Company selector
│   │       ├── Excel grid (8×5)
│   │       ├── Import/Export buttons
│   │       └── Save button
│   │
│   ├── Tab: "Garanties"
│   │   └── GuaranteesConfig
│   │       ├── Company selector
│   │       ├── Export all button
│   │       └── Guarantee groups (collapsible)
│   │           ├── VOL
│   │           ├── INCENDIE
│   │           ├── TOUS_RISQUES_ZERO
│   │           ├── CAS
│   │           ├── ASSISTANCE
│   │           ├── PERSONNES_TRANSPORTEES
│   │           ├── BG
│   │           └── Others...
│   │               └── GuaranteeRuleModal (on Add/Edit)
│   │
│   └── Tab: "Dommages Collision"
│       └── DcConfigTab (existing component)
│           ├── Company selector
│           ├── Usage selector
│           ├── Method toggle (Progressive/Matrix)
│           ├── DcProgressiveConfig
│           └── DcMatrixConfig
```

---

## 🔐 Security & Permissions

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION                               │
│  • JWT-based authentication                                     │
│  • User must be logged in                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHORIZATION                                │
│  • Role: ADMINISTRATEUR_ARS required                            │
│  • Enforced at route level (frontend)                           │
│  • Enforced at controller level (backend)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ACCESS GRANTED                               │
│  • Can view/edit all pricing rules                              │
│  • Can configure DC methods                                     │
│  • Can import/export data                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

**Architecture Status:** ✅ VERIFIED
**Integration Status:** ✅ COMPLETE
**Security Status:** ✅ MAINTAINED
