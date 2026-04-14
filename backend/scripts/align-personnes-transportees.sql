-- ============================================
-- ALIGN DEV TO PROD: Personnes Transportées
-- Fix the single pricing difference found
-- ============================================

\echo '=== ALIGNING PERSONNES TRANSPORTÉES PRICING ==='
\echo ''

-- Show current value
\echo 'BEFORE UPDATE:'
SELECT 
  c.name AS company,
  g."nameFr" AS guarantee,
  pr."minCapital",
  pr."fixedPremium" AS current_premium
FROM pricing_rules pr
JOIN companies c ON pr."companyId" = c.id
JOIN guarantees g ON pr."guaranteeId" = g.id
WHERE c.name = 'LLOYD Assurances'
  AND g."nameFr" = 'Personnes Transportées'
  AND pr."minCapital" = 5000;

\echo ''
\echo 'UPDATING...'

-- Update the value
UPDATE pricing_rules
SET "fixedPremium" = 25.000000,
    "updatedAt" = NOW()
WHERE "companyId" = (SELECT id FROM companies WHERE name = 'LLOYD Assurances')
  AND "guaranteeId" = (SELECT id FROM guarantees WHERE "nameFr" = 'Personnes Transportées')
  AND "minCapital" = 5000;

\echo ''
\echo 'AFTER UPDATE:'
SELECT 
  c.name AS company,
  g."nameFr" AS guarantee,
  pr."minCapital",
  pr."fixedPremium" AS new_premium,
  pr."updatedAt"
FROM pricing_rules pr
JOIN companies c ON pr."companyId" = c.id
JOIN guarantees g ON pr."guaranteeId" = g.id
WHERE c.name = 'LLOYD Assurances'
  AND g."nameFr" = 'Personnes Transportées'
  AND pr."minCapital" = 5000;

\echo ''
\echo '✅ ALIGNMENT COMPLETE: 21 DT → 25 DT'
\echo ''
