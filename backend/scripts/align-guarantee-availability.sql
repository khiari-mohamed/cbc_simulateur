-- ============================================
-- ALIGN DEV TO PROD: Guarantee Availability
-- Fix the 2 critical differences found
-- ============================================

\echo '=== ALIGNING GUARANTEE AVAILABILITY CONFIGS ==='
\echo ''

-- Show current values
\echo 'BEFORE UPDATE:'
\echo ''

SELECT 
  c.name AS company,
  g."nameFr" AS guarantee,
  ga."formulaType",
  ga.status AS current_status
FROM guarantee_availabilities ga
JOIN companies c ON ga."companyId" = c.id
JOIN guarantees g ON ga."guaranteeId" = g.id
WHERE (
  (c.name = 'AL BARAKA' AND g.code = 'CATASTROPHES_NATURELLES' AND ga."formulaType" = 'STANDARD')
  OR
  (c.name = 'AL BARAKA' AND g.code = 'DOMMAGES_EMEUTES' AND ga."formulaType" = 'STANDARD')
)
ORDER BY g."nameFr";

\echo ''
\echo 'UPDATING...'
\echo ''

-- 1. Catastrophes Naturelles (STANDARD) → NON_ACCORDEE
UPDATE guarantee_availabilities
SET status = 'NON_ACCORDEE',
    "updatedAt" = NOW()
WHERE "companyId" = (SELECT id FROM companies WHERE name = 'AL BARAKA')
  AND "guaranteeId" = (SELECT id FROM guarantees WHERE code = 'CATASTROPHES_NATURELLES')
  AND "formulaType" = 'STANDARD'
  AND status = 'DEFAULT';

\echo '✓ Updated Catastrophes Naturelles (STANDARD)'

-- 2. Dommages suite émeutes (STANDARD) → NON_ACCORDEE
UPDATE guarantee_availabilities
SET status = 'NON_ACCORDEE',
    "updatedAt" = NOW()
WHERE "companyId" = (SELECT id FROM companies WHERE name = 'AL BARAKA')
  AND "guaranteeId" = (SELECT id FROM guarantees WHERE code = 'DOMMAGES_EMEUTES')
  AND "formulaType" = 'STANDARD'
  AND status = 'DEFAULT';

\echo '✓ Updated Dommages suite émeutes (STANDARD)'

\echo ''
\echo 'AFTER UPDATE:'
\echo ''

SELECT 
  c.name AS company,
  g."nameFr" AS guarantee,
  ga."formulaType",
  ga.status AS new_status,
  ga."updatedAt"
FROM guarantee_availabilities ga
JOIN companies c ON ga."companyId" = c.id
JOIN guarantees g ON ga."guaranteeId" = g.id
WHERE (
  (c.name = 'AL BARAKA' AND g.code = 'CATASTROPHES_NATURELLES' AND ga."formulaType" = 'STANDARD')
  OR
  (c.name = 'AL BARAKA' AND g.code = 'DOMMAGES_EMEUTES' AND ga."formulaType" = 'STANDARD')
)
ORDER BY g."nameFr";

\echo ''
\echo '✅ ALIGNMENT COMPLETE: DEV now matches PROD'
\echo ''
