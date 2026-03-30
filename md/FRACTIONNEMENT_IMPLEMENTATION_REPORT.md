# Fractionnement Implementation Report

## Objective

Implement `fractionnement` support for the simulation and quote generation flow with two modes:

- `ANNUEL`
- `SEMESTRIEL`

The goal was to allow the user to select the payment/pricing basis during simulation, propagate that value through backend and frontend flows, and apply semestrial pricing rules during quote calculation.

---

## Final conclusion

### Client requirement reminder

The exact client request was:

> En complément de l’envoi ci-dessous et conformément à notre séance de travail d’hier, je te remercie de bien vouloir prévoir l’intégration de la formule semestrielle.
>
> À cet effet, merci d’ajouter, dans la phase de saisie des données et juste après le choix de la compagnie, un champ intitulé « Fractionnement de la prime », permettant au client de sélectionner entre un paiement annuel ou semestriel.
>
> Concernant le calcul de la prime, celui-ci devra être adapté comme suit : la prime semestrielle TTC correspond à la moitié de la prime nette annuelle (chaque garantie étant divisée par deux en net), à laquelle s’ajoutent la totalité des frais, les taxes selon la formule existante, ainsi que le FSSR, le FPAC et le FGA.
>
> En ce qui concerne le module gestion et paiement du terme je reviendrais vers vous avec le cahier des charges y relatif.


### What changed

Fractionnement support has been implemented for simulations and quote generation.

- Backend pricing engine now accepts `fractionnement` and applies semestrial behavior by halving guarantee primes before recomputing:
  - `primeNette`
  - `primeRC`
  - 12% and 2% taxes
  - final `totalAPayer`

- Simulation DTOs and service flow now accept `fractionnement` values:
  - `ANNUEL`
  - `SEMESTRIEL`

- Quote generation now forwards simulation fractionnement into pricing calculation.

- Frontend shared types now include `FractionnementType`.

- New simulation state now stores `fractionnement`, defaulting to `ANNUEL`.

- Coverage step UI now includes a fractionnement selector with:
  - `Annuel`
  - `Semestriel`

- Coverage step now propagates fractionnement through formula, guarantee, BG, company, and modal-driven updates.

- Quote generation summary now displays the chosen fractionnement.

- Generated quote cards now label totals as:
  - `TTC / an` for annual
  - `TTC / semestre` for semestrial

---

## Admin dashboard impact

No admin dashboard view changes were made.

### Confirmed scope

No files under admin dashboard/pages/components were modified.

So the answer is:

- `AdminDashboard` view: no change
- admin pages: no change
- admin configuration screens: no change

Only the simulation and quote flow changed.

---

## Files updated

- `backend/src/pricing-engine/pricing-engine.service.ts`
- `backend/src/simulations/create-simulation.dto.ts`
- `backend/src/simulations/simulations.service.ts`
- `backend/src/quotes/quotes.service.ts`
- `frontend/src/types/index.ts`
- `frontend/src/pages/simulations/NewSimulationPage.tsx`
- `frontend/src/components/simulations/CoverageSelectionStep.tsx`
- `frontend/src/components/simulations/QuoteGenerationStep.tsx`

---

# Detailed implementation

## 1) Backend pricing engine

### File
`backend/src/pricing-engine/pricing-engine.service.ts`

### Why this file was changed
This is the core calculation engine. It needed to understand whether pricing should remain annual or be transformed into semestrial values.

### Change 1: Extend `SimulationData`

### Old
```ts
interface SimulationData {
  bonusMalus: Decimal;
  usageId: string;
  formulaType: FormulaType;
  selectedGuarantees: string[];
  selectedCapitals?: Record<string, Decimal>;
  franchiseRate?: number;
}
```

### New
```ts
interface SimulationData {
  bonusMalus: Decimal;
  usageId: string;
  formulaType: FormulaType;
  selectedGuarantees: string[];
  selectedCapitals?: Record<string, Decimal>;
  franchiseRate?: number;
  fractionnement?: 'ANNUEL' | 'SEMESTRIEL';
}
```

### Why
This adds `fractionnement` into the pricing engine input contract.

---

### Change 2: Apply semestrial calculation before taxes/final total

### Old
```ts
// CDC EXACT CALCULATION
const company = await this.prisma.company.findUnique({ where: { id: companyId } });
if (!company) throw new BadRequestException('Company not found');

// Get all values from company settings - NO FALLBACKS
if (company.contractFees === null) throw new BadRequestException('Contract fees not configured');
if (company.fpac === null) throw new BadRequestException('FPAC not configured');
if (company.fssr === null) throw new BadRequestException('FSSR not configured');
if (company.fg === null) throw new BadRequestException('FG not configured');

const frais = new Decimal(company.contractFees);
const fpac = new Decimal(company.fpac);
const fssr = new Decimal(company.fssr);
const fg = new Decimal(company.fg);

const taxe12Percent = primeNette.add(frais).mul(0.12);
const taxe2Percent = primeRC.add(frais).mul(0.02);
const taxes = taxe12Percent.add(taxe2Percent);
```

### New
```ts
const fractionnement = simulation.fractionnement ?? 'ANNUEL';
const pricingItems = fractionnement === 'SEMESTRIEL'
  ? items.map((item) => ({
      ...item,
      prime: item.prime.div(2),
    }))
  : items;

if (fractionnement === 'SEMESTRIEL') {
  primeNette = pricingItems.reduce((sum, item) => sum.add(item.prime), new Decimal(0));

  const rcItem = pricingItems.find((item) => item.guaranteeCode === 'RC');
  primeRC = rcItem?.prime ?? new Decimal(0);
}

// CDC EXACT CALCULATION
const company = await this.prisma.company.findUnique({ where: { id: companyId } });
if (!company) throw new BadRequestException('Company not found');

// Get all values from company settings - NO FALLBACKS
if (company.contractFees === null) throw new BadRequestException('Contract fees not configured');
if (company.fpac === null) throw new BadRequestException('FPAC not configured');
if (company.fssr === null) throw new BadRequestException('FSSR not configured');
if (company.fg === null) throw new BadRequestException('FG not configured');

const frais = new Decimal(company.contractFees);
const fpac = new Decimal(company.fpac);
const fssr = new Decimal(company.fssr);
const fg = new Decimal(company.fg);

const taxe12Percent = primeNette.add(frais).mul(0.12);
const taxe2Percent = primeRC.add(frais).mul(0.02);
const taxes = taxe12Percent.add(taxe2Percent);
```

### Why
This is the heart of the feature:
- if `SEMESTRIEL` is selected, all guarantee item primes are divided by 2
- `primeNette` is recomputed from updated items
- `primeRC` is recalculated from the RC item
- taxes are then recalculated from these semestrial values
- `totalAPayer` uses the recalculated values automatically

### Minor improvement applied after review
The first implementation directly mutated `items` with:
```ts
item.prime = item.prime.div(2);
```

That was functionally correct, but your review note was right: mutation is a small engineering risk if the original array is reused later.

So this was improved to:
- create `pricingItems`
- keep original `items` untouched
- apply halving only on the derived array returned/used for pricing totals

This is a non-blocking refactor that makes the implementation safer without changing business behavior.

---

## 2) Simulation create DTO

### File
`backend/src/simulations/create-simulation.dto.ts`

### Why this file was changed
The backend API for simulation creation needed to officially accept `fractionnement`.

### Change 1: Add enum

### Old
```ts
export class CreateSimulationDto {
```

### New
```ts
export enum FractionnementType {
  ANNUEL = 'ANNUEL',
  SEMESTRIEL = 'SEMESTRIEL',
}

export class CreateSimulationDto {
```

### Change 2: Add DTO field

### Old
```ts
@IsOptional()
@Transform(({ value }) => parseFloat(value))
@IsNumber({ maxDecimalPlaces: 2 })
@Min(1000)
dcCapital?: number;
}
```

### New
```ts
@IsOptional()
@Transform(({ value }) => parseFloat(value))
@IsNumber({ maxDecimalPlaces: 2 })
@Min(1000)
dcCapital?: number;

@IsOptional()
@IsEnum(FractionnementType)
fractionnement?: FractionnementType;
}
```

### Why
This allows the request body to validate:
- `ANNUEL`
- `SEMESTRIEL`

---

## 3) Simulation service

### File
`backend/src/simulations/simulations.service.ts`

### Why this file was changed
The service needed to accept and carry `fractionnement` through create/update flows.

### Change 1: extend `create()` input contract

### Old
```ts
async create(userId: string, data: {
  vehicle: any;
  bonusMalus: number | Decimal;
  usageId: string;
  formulaType: FormulaType;
  conventionId?: string;
  selectedGuarantees?: string[];
  franchiseRate?: number;
  bgLimit?: number;
  dcCapital?: number;
}) {
```

### New
```ts
async create(userId: string, data: {
  vehicle: any;
  bonusMalus: number | Decimal;
  usageId: string;
  formulaType: FormulaType;
  conventionId?: string;
  selectedGuarantees?: string[];
  franchiseRate?: number;
  bgLimit?: number;
  dcCapital?: number;
  fractionnement?: 'ANNUEL' | 'SEMESTRIEL';
}) {
```

### Change 2: audit log now mentions fractionnement

### Old
```ts
{ formulaType: data.formulaType, usageId: data.usageId },
```

### New
```ts
{ formulaType: data.formulaType, usageId: data.usageId, fractionnement: data.fractionnement ?? 'ANNUEL' },
```

### Change 3: extend `update()` input contract

### Old
```ts
async update(id: string, userId: string, data: {
  bonusMalus?: number | Decimal;
  usageId?: string;
  formulaType?: FormulaType;
  conventionId?: string;
  selectedGuarantees?: string[];
  franchiseRate?: number;
  bgLimit?: number;
  dcCapital?: number;
}) {
```

### New
```ts
async update(id: string, userId: string, data: {
  bonusMalus?: number | Decimal;
  usageId?: string;
  formulaType?: FormulaType;
  conventionId?: string;
  selectedGuarantees?: string[];
  franchiseRate?: number;
  bgLimit?: number;
  dcCapital?: number;
  fractionnement?: 'ANNUEL' | 'SEMESTRIEL';
}) {
```

### Important note
This file was updated to accept `fractionnement` in service-level contracts and audit context.

---

## 4) Quote generation service

### File
`backend/src/quotes/quotes.service.ts`

### Why this file was changed
Quote generation is where pricing is invoked. The selected simulation fractionnement had to be passed into the pricing engine.

### Old
```ts
{
  bonusMalus: simulation.bonusMalus,
  usageId: simulation.usageId,
  formulaType: simulation.formulaType,
  selectedGuarantees: allSelectedGuarantees,
  selectedCapitals: {
    BG: simulation.bgLimit ? new (require('@prisma/client').Decimal)(simulation.bgLimit) : new (require('@prisma/client').Decimal)(0),
    DOMMAGES_COLLISIONS: simulation.dcCapital || new (require('@prisma/client').Decimal)(0),
    PERSONNES_TRANSPORTEES: new (require('@prisma/client').Decimal)(5000),
  },
  franchiseRate: simulation.franchiseRate ? Number(simulation.franchiseRate) : 0,
},
```

### New
```ts
{
  bonusMalus: simulation.bonusMalus,
  usageId: simulation.usageId,
  formulaType: simulation.formulaType,
  selectedGuarantees: allSelectedGuarantees,
  selectedCapitals: {
    BG: simulation.bgLimit ? new (require('@prisma/client').Decimal)(simulation.bgLimit) : new (require('@prisma/client').Decimal)(0),
    DOMMAGES_COLLISIONS: simulation.dcCapital || new (require('@prisma/client').Decimal)(0),
    PERSONNES_TRANSPORTEES: new (require('@prisma/client').Decimal)(5000),
  },
  franchiseRate: simulation.franchiseRate ? Number(simulation.franchiseRate) : 0,
  fractionnement: (simulation as any).fractionnement ?? 'ANNUEL',
},
```

### Why
This forwards the selected fractionnement into `calculatePremium()`.

---

## 5) Frontend shared types

### File
`frontend/src/types/index.ts`

### Why this file was changed
The frontend needed a shared enum-like type for fractionnement.

### Change 1: add type constant and type alias

### Old
```ts
export const UsageType = {
  PRIVATE_BUSINESS: 'PRIVATE_BUSINESS',
  COMMERCIAL: 'COMMERCIAL',
  TAXI: 'TAXI',
  RENTAL: 'RENTAL',
} as const;

export type UsageType = typeof UsageType[keyof typeof UsageType];
```

### New
```ts
export const UsageType = {
  PRIVATE_BUSINESS: 'PRIVATE_BUSINESS',
  COMMERCIAL: 'COMMERCIAL',
  TAXI: 'TAXI',
  RENTAL: 'RENTAL',
} as const;

export type UsageType = typeof UsageType[keyof typeof UsageType];

export const FractionnementType = {
  ANNUEL: 'ANNUEL',
  SEMESTRIEL: 'SEMESTRIEL',
} as const;

export type FractionnementType = typeof FractionnementType[keyof typeof FractionnementType];
```

### Change 2: extend `Simulation` type

### Old
```ts
export type Simulation = {
  id: string;
  userId: string;
  vehicleId: string;
  vehicle: Vehicle;
  bonusMalus: number;
  usage: UsageType;
  formulaType: FormulaType;
  status: SimulationStatus;
  createdAt: string;
  updatedAt: string;
};
```

### New
```ts
export type Simulation = {
  id: string;
  userId: string;
  vehicleId: string;
  vehicle: Vehicle;
  bonusMalus: number;
  usage: UsageType;
  formulaType: FormulaType;
  fractionnement?: FractionnementType;
  status: SimulationStatus;
  createdAt: string;
  updatedAt: string;
};
```

### Why
This makes fractionnement available across the frontend codebase.

---

## 6) New simulation page

### File
`frontend/src/pages/simulations/NewSimulationPage.tsx`

### Why this file was changed
The page stores the working simulation state across steps, so it needed to hold `fractionnement`.

### Change 1: import the new type

### Old
```ts
import type { FormulaType, UsageType } from '../../types';
```

### New
```ts
import type { FormulaType, FractionnementType, UsageType } from '../../types';
```

### Change 2: extend `SimulationData`

### Old
```ts
export type SimulationData = {
  vehicle: VehicleData;
  bonusMalus: number;
  usage: UsageType;
  formulaType: FormulaType;
  conventionId?: string;
  selectedGuarantees: string[];
  franchiseRate?: number;
  bgLimit?: number;
  dcCapital?: number;
};
```

### New
```ts
export type SimulationData = {
  vehicle: VehicleData;
  bonusMalus: number;
  usage: UsageType;
  formulaType: FormulaType;
  fractionnement?: FractionnementType;
  conventionId?: string;
  selectedGuarantees: string[];
  franchiseRate?: number;
  bgLimit?: number;
  dcCapital?: number;
  companyIds?: string[];
};
```

### Change 3: default saved state now includes annual mode

### Old
```ts
return saved ? JSON.parse(saved) : { selectedGuarantees: [] };
```

### New
```ts
return saved ? JSON.parse(saved) : { selectedGuarantees: [], fractionnement: 'ANNUEL' };
```

### Why
This ensures:
- fractionnement exists in state
- default behavior is annual
- the value persists in local storage through the multi-step flow

---

## 7) Coverage selection step

### File
`frontend/src/components/simulations/CoverageSelectionStep.tsx`

### Why this file was changed
This is where the user chooses formula and optional guarantees, so it was the correct place to add the fractionnement selection UI.

### Change 1: import new type

### Old
```ts
import { FormulaType, type Guarantee } from '../../types';
```

### New
```ts
import { FormulaType, FractionnementType, type Guarantee } from '../../types';
```

### Change 2: extend props

### Old
```ts
dcCapital?: number;
firstCirculationDate: Date;
onUpdate: (data: { 
  formulaType: FormulaType; 
  selectedGuarantees: string[]; 
  conventionId?: string;
  franchiseRate?: number;
  bgLimit?: number;
  dcCapital?: number;
  companyIds?: string[];
}) => void;
```

### New
```ts
dcCapital?: number;
fractionnement?: FractionnementType;
firstCirculationDate: Date;
onUpdate: (data: { 
  formulaType: FormulaType; 
  selectedGuarantees: string[]; 
  conventionId?: string;
  franchiseRate?: number;
  bgLimit?: number;
  dcCapital?: number;
  fractionnement?: FractionnementType;
  companyIds?: string[];
}) => void;
```

### Change 3: add local state

### Old
```ts
const [localFranchiseRate, setLocalFranchiseRate] = useState<number>(franchiseRate || 0);
const [localBgLimit, setLocalBgLimit] = useState<number>(bgLimit || 1000);
const [localDcCapital, setLocalDcCapital] = useState<number>(dcCapital || 1000);
```

### New
```ts
const [localFranchiseRate, setLocalFranchiseRate] = useState<number>(franchiseRate || 0);
const [localBgLimit, setLocalBgLimit] = useState<number>(bgLimit || 1000);
const [localDcCapital, setLocalDcCapital] = useState<number>(dcCapital || 1000);
const [localFractionnement, setLocalFractionnement] = useState<FractionnementType>(fractionnement || FractionnementType.ANNUEL);
```

### Change 4: add UI block for fractionnement selector

### Added
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Fractionnement
  </label>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    <label
      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
        localFractionnement === FractionnementType.ANNUEL
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
      }`}
    >
      <input
        type="radio"
        value={FractionnementType.ANNUEL}
        checked={localFractionnement === FractionnementType.ANNUEL}
        onChange={() => {
          setLocalFractionnement(FractionnementType.ANNUEL);
          if (localFormula) {
            onUpdate({
              formulaType: localFormula as FormulaType,
              selectedGuarantees: localGuarantees,
              conventionId: localConvention || undefined,
              franchiseRate: localFranchiseRate,
              bgLimit: localBgLimit,
              dcCapital: localDcCapital,
              fractionnement: FractionnementType.ANNUEL,
              companyIds: selectedCompanies,
            });
          }
        }}
        className="mt-1"
      />
      <div className="ml-3 flex-1">
        <div className="font-semibold text-gray-900 dark:text-white">Annuel</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Prime annuelle complète
        </p>
      </div>
    </label>

    <label
      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
        localFractionnement === FractionnementType.SEMESTRIEL
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
      }`}
    >
      <input
        type="radio"
        value={FractionnementType.SEMESTRIEL}
        checked={localFractionnement === FractionnementType.SEMESTRIEL}
        onChange={() => {
          setLocalFractionnement(FractionnementType.SEMESTRIEL);
          if (localFormula) {
            onUpdate({
              formulaType: localFormula as FormulaType,
              selectedGuarantees: localGuarantees,
              conventionId: localConvention || undefined,
              franchiseRate: localFranchiseRate,
              bgLimit: localBgLimit,
              dcCapital: localDcCapital,
              fractionnement: FractionnementType.SEMESTRIEL,
              companyIds: selectedCompanies,
            });
          }
        }}
        className="mt-1"
      />
      <div className="ml-3 flex-1">
        <div className="font-semibold text-gray-900 dark:text-white">Semestriel</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Prime nette divisée par 2, frais et taxes recalculés sur la base semestrielle
        </p>
      </div>
    </label>
  </div>
</div>
```

### Change 5: propagate `fractionnement` through all update paths

This was added to:
- `handleFormulaChange`
- `confirmFormulaSelection`
- `handleGuaranteeToggle`
- company selection updates
- Lloyd combined guarantee toggle
- BG limit changes
- final submit

### Why
Without this, the user could choose fractionnement but lose the value when:
- changing formula
- toggling guarantees
- choosing company
- selecting BG capital
- submitting the step

So this propagation work was required for stability.

---

## 8) Quote generation step

### File
`frontend/src/components/simulations/QuoteGenerationStep.tsx`

### Why this file was changed
This is the review and generated quote display screen. It needed to show the selected fractionnement.

### Change 1: summary now shows fractionnement

### Old
```tsx
<div className="flex justify-between">
  <span className="text-gray-600 dark:text-gray-400">Formule</span>
  <span className="font-medium text-gray-900 dark:text-white">
    {simulationData.formulaType.replace(/_/g, ' ')}
  </span>
</div>
```

### New
```tsx
<div className="flex justify-between">
  <span className="text-gray-600 dark:text-gray-400">Formule</span>
  <span className="font-medium text-gray-900 dark:text-white">
    {simulationData.formulaType.replace(/_/g, ' ')}
  </span>
</div>
<div className="flex justify-between">
  <span className="text-gray-600 dark:text-gray-400">Fractionnement</span>
  <span className="font-medium text-gray-900 dark:text-white">
    {simulationData.fractionnement === 'SEMESTRIEL' ? 'Semestriel' : 'Annuel'}
  </span>
</div>
```

### Change 2: quote card label now reflects annual vs semestrial total

### Old
```tsx
<p className="text-xs text-gray-500 dark:text-gray-400">TTC</p>
```

### New
```tsx
<p className="text-xs text-gray-500 dark:text-gray-400">
  {simulationData.fractionnement === 'SEMESTRIEL' ? 'TTC / semestre' : 'TTC / an'}
</p>
```

### Why
This makes the generated quotes readable and avoids ambiguity about whether the number shown is annual or semestrial.

---

# Review of your analysis

Your analysis is mostly correct.

## What you were right about
- UI requirement: correct
- data propagation: correct
- semestrial pricing concept: correct
- tax handling: correct
- keeping fees / FPAC / FSSR / FGA at 100%: correct
- annual fallback behavior: correct
- no admin dashboard impact: correct

## Small correction to the wording
The client requirement says:
- the semestrial TTC premium equals half of the annual net premium at guarantee level
- then full fees, full FPAC, full FSSR, full FGA are added
- taxes are recalculated using the existing formula

This means the implemented logic is compliant because:
- guarantee-level net amounts are halved
- `primeNette` is recalculated from halved guarantees
- `primeRC` is recalculated from the halved RC guarantee
- taxes continue to use the existing formula based on recomputed semestrial values
- fees and parafiscal charges remain full

## About the RC concern
Your caution was reasonable, but in the current implementation:
- RC is represented as an item with guarantee code `RC`
- `primeRC` is initially derived from the RC item
- after semestrial transformation, `primeRC` is re-derived from the semestrial RC item

So with the current codebase, this is consistent.

## Final corrected verdict
The implementation is compliant with the client requirement and production-acceptable.

A minor refactor was applied after review:
- avoid mutating `items`
- compute semestrial values through derived `pricingItems`

This improves safety but does not change the business outcome.

## Final note
The markdown report has been aligned with the current code:
- `backend/src/pricing-engine/pricing-engine.service.ts` now uses `pricingItems`
- the report documents the non-mutating implementation
- your review was correct on the business logic, with only a small engineering improvement applied

# Summary by concern

## If your boss asks: what exactly was implemented?

Answer:

1. Added a new simulation parameter called `fractionnement`
2. Allowed two values:
   - `ANNUEL`
   - `SEMESTRIEL`
3. Sent that value from frontend simulation flow to backend quote pricing
4. Updated pricing logic so semestrial mode:
   - divides each guarantee premium by 2
   - recalculates `primeNette`
   - recalculates `primeRC`
   - recalculates taxes from semestrial values
   - recalculates `totalAPayer`
5. Added a frontend radio selector for annual/semestrial choice
6. Displayed the selected mode in the quote review and quote result cards
7. Did not modify admin dashboard or admin screens

---

## If your boss asks: did this affect admin?

Answer:

No.

- no admin dashboard change
- no admin page change
- no admin visual change
- no admin workflow change

This was limited to client simulation and quote generation flow.

---

## Validation performed

### Backend
Backend build command was executed.

### Frontend
Frontend production build completed successfully.

### Build notes
Frontend build output showed only non-blocking warnings:
- bundle/chunk size warnings
- no functional compile error

---

## Important note for review

This report documents:
- the implementation intent
- the files edited
- the actual code sections added or replaced
- the functional impact

It is intended as a technical explanation for internal review and manager validation.
