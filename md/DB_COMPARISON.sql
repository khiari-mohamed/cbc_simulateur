-- ============================================
-- DATABASE COMPARISON SCRIPT
-- Run this on BOTH local and production databases
-- Compare the outputs to find differences
-- ============================================

\echo '=== DATABASE COMPARISON REPORT ==='
\echo 'Run this script on both LOCAL and PRODUCTION'
\echo 'Compare outputs to find differences'
\echo ''

-- ============================================
-- 1. MIGRATION STATUS
-- ============================================
\echo '1. MIGRATION STATUS (acCapitals field)'
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'simulations' 
  AND column_name IN ('dcCapitals', 'acCapitals');

-- ============================================
-- 2. COMPANIES COUNT & STATUS
-- ============================================
\echo ''
\echo '2. COMPANIES'
SELECT 
  name,
  code,
  "isActive",
  "createdAt"::date
FROM companies
ORDER BY name;

-- ============================================
-- 3. USAGE TYPES COUNT & STATUS
-- ============================================
\echo ''
\echo '3. USAGE TYPES'
SELECT 
  "nameFr",
  code,
  "isActive",
  "createdAt"::date
FROM usage_types
ORDER BY "nameFr";

-- ============================================
-- 4. DC CONFIG COMPARISON
-- ============================================
\echo ''
\echo '4. DC CONFIG'
SELECT 
  c.name AS company,
  u."nameFr" AS usage,
  dc."maxCapitalPercent",
  dc."maxCapitalAbsolute",
  dc."minCapital",
  dc."basePremium",
  dc."isActive"
FROM dc_configs dc
JOIN companies c ON dc."companyId" = c.id
JOIN usage_types u ON dc."usageId" = u.id
ORDER BY c.name, u."nameFr";

-- ============================================
-- 5. DC CAPITAL TIERS COMPARISON
-- ============================================
\echo ''
\echo '5. DC CAPITAL TIERS'
SELECT 
  c.name AS company,
  u."nameFr" AS usage,
  COUNT(*) AS tier_count,
  MIN(dct."minAmount") AS min_amount,
  MAX(dct."maxAmount") AS max_amount
FROM dc_capital_tiers dct
JOIN companies c ON dct."companyId" = c.id
JOIN usage_types u ON dct."usageId" = u.id
WHERE dct."isActive" = true
GROUP BY c.name, u."nameFr"
ORDER BY c.name, u."nameFr";

-- ============================================
-- 6. FRANCHISE VALUES COMPARISON
-- ============================================
\echo ''
\echo '6. FRANCHISE VALUES'
SELECT 
  value,
  label,
  "isActive",
  "createdAt"::date
FROM franchise_values
ORDER BY value;

-- ============================================
-- 7. BG CAPITAL LIMITS COMPARISON
-- ============================================
\echo ''
\echo '7. BG CAPITAL LIMITS'
SELECT 
  value,
  label,
  "isActive",
  "createdAt"::date
FROM bg_capital_limits
ORDER BY value;

-- ============================================
-- 8. GUARANTEES COMPARISON
-- ============================================
\echo ''
\echo '8. GUARANTEES'
SELECT 
  code,
  "nameFr",
  "isOptional",
  "isActive"
FROM guarantees
WHERE "isActive" = true
ORDER BY "isOptional", code;

-- ============================================
-- 9. PRICING RULES COUNT BY COMPANY/GUARANTEE
-- ============================================
\echo ''
\echo '9. PRICING RULES COUNT'
SELECT 
  c.name AS company,
  g.code AS guarantee,
  COUNT(*) AS rule_count,
  MIN(pr."minCapital") AS min_capital,
  MAX(pr."minCapital") AS max_capital
FROM pricing_rules pr
JOIN companies c ON pr."companyId" = c.id
JOIN guarantees g ON pr."guaranteeId" = g.id
WHERE pr."isActive" = true
GROUP BY c.name, g.code
ORDER BY c.name, g.code;

-- ============================================
-- 10. CONVENTIONS COMPARISON
-- ============================================
\echo ''
\echo '10. CONVENTIONS'
SELECT 
  name,
  code,
  status,
  "createdAt"::date
FROM conventions
ORDER BY name;

-- ============================================
-- 11. FORMULA ELIGIBILITY (if exists)
-- ============================================
\echo ''
\echo '11. FORMULA ELIGIBILITY TABLE'
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_name = 'formula_eligibilities';

-- If table exists, show data
SELECT 
  c.name AS company,
  u."nameFr" AS usage,
  fe."formulaType",
  fe."maxAge",
  fe."isActive"
FROM formula_eligibilities fe
JOIN companies c ON fe."companyId" = c.id
JOIN usage_types u ON fe."usageId" = u.id
WHERE fe."isActive" = true
ORDER BY c.name, u."nameFr", fe."formulaType";

-- ============================================
-- 12. RECENT SIMULATIONS WITH AC CAPITALS
-- ============================================
\echo ''
\echo '12. RECENT SIMULATIONS (acCapitals usage)'
SELECT 
  COUNT(*) AS total_simulations,
  COUNT("acCapitals") AS with_ac_capitals,
  MAX("createdAt")::date AS latest_simulation
FROM simulations;

-- ============================================
-- 13. TABLE COUNTS SUMMARY
-- ============================================
\echo ''
\echo '13. TABLE COUNTS SUMMARY'
SELECT 'companies' AS table_name, COUNT(*) AS total_rows FROM companies
UNION ALL
SELECT 'usage_types', COUNT(*) FROM usage_types
UNION ALL
SELECT 'dc_configs', COUNT(*) FROM dc_configs
UNION ALL
SELECT 'dc_capital_tiers', COUNT(*) FROM dc_capital_tiers
UNION ALL
SELECT 'franchise_values', COUNT(*) FROM franchise_values
UNION ALL
SELECT 'bg_capital_limits', COUNT(*) FROM bg_capital_limits
UNION ALL
SELECT 'guarantees', COUNT(*) FROM guarantees
UNION ALL
SELECT 'pricing_rules', COUNT(*) FROM pricing_rules
UNION ALL
SELECT 'conventions', COUNT(*) FROM conventions
UNION ALL
SELECT 'simulations', COUNT(*) FROM simulations
ORDER BY table_name;

\echo ''
\echo '=== END OF COMPARISON REPORT ==='
\echo 'Save this output and compare with other database'