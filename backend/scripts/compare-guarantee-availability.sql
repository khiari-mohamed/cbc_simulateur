-- ============================================
-- COMPARE GUARANTEE AVAILABILITY CONFIGS
-- Check if PROD and DEV have same configurations
-- ============================================

\echo '=== GUARANTEE AVAILABILITY COMPARISON ==='
\echo ''

-- Show all guarantee availability configurations
\echo 'GUARANTEE AVAILABILITY CONFIGURATIONS:'
\echo ''

SELECT 
  c.name AS company,
  g."nameFr" AS guarantee,
  g.code AS guarantee_code,
  ga.status,
  ga."formulaType",
  ga."isActive",
  ga."createdAt"::date as created_date
FROM guarantee_availabilities ga
JOIN companies c ON ga."companyId" = c.id
JOIN guarantees g ON ga."guaranteeId" = g.id
ORDER BY c.name, g."nameFr", ga."formulaType" NULLS LAST;

\echo ''
\echo '=== SUMMARY BY STATUS ==='
\echo ''

SELECT 
  status,
  COUNT(*) as total_configs,
  COUNT(CASE WHEN "isActive" = true THEN 1 END) as active_configs
FROM guarantee_availabilities
GROUP BY status
ORDER BY status;

\echo ''
\echo '=== SUMMARY BY COMPANY ==='
\echo ''

SELECT 
  c.name AS company,
  COUNT(*) as total_configs,
  COUNT(CASE WHEN ga.status = 'GRATUIT' THEN 1 END) as gratuit_count,
  COUNT(CASE WHEN ga.status = 'NON_ACCORDEE' THEN 1 END) as non_accordee_count,
  COUNT(CASE WHEN ga.status = 'HIDDEN' THEN 1 END) as hidden_count,
  COUNT(CASE WHEN ga.status = 'DEFAULT' THEN 1 END) as default_count
FROM guarantee_availabilities ga
JOIN companies c ON ga."companyId" = c.id
WHERE ga."isActive" = true
GROUP BY c.name
ORDER BY c.name;

\echo ''
\echo '=== END COMPARISON ==='
