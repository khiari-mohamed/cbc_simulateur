# BG Franchise Pricing Test

This test script validates that BG (Bris de Glaces) pricing works correctly with different franchise rates.

## Expected Behavior

- **TR 0% (Sans franchise)**: BG should be **FREE** (0 DT)
- **TR 4%**: BG should be **PAID** (based on pricing rules)

## Prerequisites

1. At least 2 active companies in the database
2. At least 1 CLIENT_ADHERENT user
3. TOURISME usage configured
4. BG guarantee configured with code 'BG'
5. BG pricing rules configured for both companies
6. GuaranteeAvailability configured with status GRATUIT for BG + TOUS_RISQUES_0

## How to Run

```bash
cd backend
npx ts-node scripts/test-bg-franchise-pricing.ts
```

## What the Script Does

1. Creates two simulations with **identical vehicle parameters**:
   - Registration: TUN-2025-001
   - Fiscal HP: 5 CV
   - Seats: 5
   - First Circulation: 01/02/2025
   - New Value: 10,000 DT
   - Market Value: 10,000 DT
   - Bonus/Malus: Classe 5

2. **Simulation 1**: TR 0% + BG 2000 DT
3. **Simulation 2**: TR 4% + BG 2000 DT

4. Generates quotes for both companies for each simulation

5. Compares BG pricing between the two cases

6. Generates PDF quotes in `backend/uploads/pdfs/`

## Expected Output

```
📊 COMPARISON SUMMARY
┌─────────────────────┬──────────────┬──────────────┐
│ Company             │ TR 0% (FREE) │ TR 4% (PAID) │
├─────────────────────┼──────────────┼──────────────┤
│ AL BARAKA           │ 0 DT         │ 40 DT        │
│ LLOYD Assurances    │ 0 DT         │ 40 DT        │
└─────────────────────┴──────────────┴──────────────┘
```

## Troubleshooting

If BG is showing as FREE for TR 4%:
1. Check that GuaranteeAvailability is configured correctly
2. Verify the backend is using the updated code
3. Check console logs for `🔍 BG Toggle Debug` messages
4. Verify pricing rules exist for BG with capital 2000 DT

If BG is showing as PAID for TR 0%:
1. Check that GuaranteeAvailability has status GRATUIT for BG + TOUS_RISQUES_0
2. Verify the backend resolveBulk method is receiving franchiseRate parameter
3. Check the special logic in guarantee-availability.service.ts line 75-78
