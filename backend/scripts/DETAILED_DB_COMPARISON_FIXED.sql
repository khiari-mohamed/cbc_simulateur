-- ============================================
-- DETAILED DATABASE COMPARISON SCRIPT (FIXED)
-- Checks actual data content, not just counts
-- Run on BOTH databases and compare outputs
-- ============================================

\echo '=== DETAILED DATABASE COMPARISON ==='
\echo 'Compare actual data content between databases'
\echo ''

-- ============================================
-- 1. COMPANIES - Full Data
-- ============================================
\echo '1. COMPANIES DATA'
SELECT 
  name,
  "isActive",
  "createdAt"::date as created_date
FROM companies
ORDER BY name;

-- ============================================
-- 2. USAGE TYPES - Full Data  
-- ============================================
\echo ''
\echo '2. USAGE TYPES DATA'
SELECT 
  "nameFr",
  "isActive",
  "createdAt"::date as created_date
FROM usage_types
ORDER BY "nameFr";

-- ============================================
-- 3. DC CONFIGS - Full Data
-- ============================================
\echo ''
\echo '3. DC CONFIGS DATA'
SELECT 
  c.name AS company,
  u."nameFr" AS usage,
  dc."maxCapitalPercent",
  dc."maxCapitalAbsolute",
  dc."minCapital",
  dc."basePremium",
  dc."isActive",
  dc."createdAt"::date as created_date
FROM dc_configs dc
JOIN companies c ON dc."companyId" = c.id
JOIN usage_types u ON dc."usageId" = u.id
ORDER BY c.name, u."nameFr";

-- ============================================
-- 4. DC CAPITAL TIERS - Full Data
-- ============================================
\echo ''
\echo '4. DC CAPITAL TIERS DATA'
SELECT 
  c.name AS company,
  u."nameFr" AS usage,
  dct."minAmount",
  dct."maxAmount", 
  dct."step",
  dct."isActive",
  dct."createdAt"::date as created_date
FROM dc_capital_tiers dct
JOIN companies c ON dct."companyId" = c.id
JOIN usage_types u ON dct."usageId" = u.id
ORDER BY c.name, u."nameFr", dct."minAmount";

-- ============================================
-- 5. FRANCHISE VALUES - Full Data
-- ============================================
\echo ''
\echo '5. FRANCHISE VALUES DATA'
SELECT 
  value,
  label,
  "isActive",
  "createdAt"::date as created_date
FROM franchise_values
ORDER BY value;

-- ============================================
-- 6. BG CAPITAL LIMITS - Full Data
-- ============================================
\echo ''
\echo '6. BG CAPITAL LIMITS DATA'
SELECT 
  value,
  label,
  "isActive", 
  "createdAt"::date as created_date
FROM bg_capital_limits
ORDER BY value;

-- ============================================
-- 7. GUARANTEES - Full Data
-- ============================================
\echo ''
\echo '7. GUARANTEES DATA'
SELECT 
  "nameFr",
  "isOptional",
  "isActive",
  "createdAt"::date as created_date
FROM guarantees
ORDER BY "isOptional", "nameFr";

-- ============================================
-- 8. PRICING RULES - Summary by Company/Guarantee
-- ============================================
\echo ''
\echo '8. PRICING RULES SUMMARY'
SELECT 
  c.name AS company,
  g."nameFr" AS guarantee,
  COUNT(*) as rule_count,
  MIN(pr."minCapital") as min_capital,
  MAX(pr."minCapital") as max_capital,
  MIN(pr."fixedPremium") as min_premium,
  MAX(pr."fixedPremium") as max_premium,
  COUNT(CASE WHEN pr."isActive" = true THEN 1 END) as active_rules
FROM pricing_rules pr
JOIN companies c ON pr."companyId" = c.id
JOIN guarantees g ON pr."guaranteeId" = g.id
GROUP BY c.name, g."nameFr"
ORDER BY c.name, g."nameFr";

-- ============================================
-- 9. PRICING RULES - AC Specific (Detailed)
-- ============================================
\echo ''
\echo '9. AC PRICING RULES DETAILED'
SELECT 
  c.name AS company,
  pr."minCapital",
  pr."fixedPremium",
  pr."isActive",
  pr."validFrom"::date as valid_from,
  pr."createdAt"::date as created_date
FROM pricing_rules pr
JOIN companies c ON pr."companyId" = c.id
JOIN guarantees g ON pr."guaranteeId" = g.id
WHERE g."nameFr" = 'Assurance Conducteur'
ORDER BY c.name, pr."minCapital";

-- ============================================
-- 10. CONVENTIONS - Full Data
-- ============================================
\echo ''
\echo '10. CONVENTIONS DATA'
SELECT 
  name,
  status,
  "createdAt"::date as created_date,
  "updatedAt"::date as updated_date
FROM conventions
ORDER BY name;

-- ============================================
-- 11. FORMULA ELIGIBILITY - Check if exists
-- ============================================
\echo ''
\echo '11. FORMULA ELIGIBILITY TABLE'
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_name = 'formula_eligibilities';

-- ============================================
-- 12. RECENT SIMULATIONS - Sample Data
-- ============================================
\echo ''
\echo '12. RECENT SIMULATIONS SAMPLE'
SELECT 
  "formulaType",
  "dcCapitals" IS NOT NULL as has_dc_capitals,
  "acCapitals" IS NOT NULL as has_ac_capitals,
  COUNT(*) as count
FROM simulations
GROUP BY "formulaType", ("dcCapitals" IS NOT NULL), ("acCapitals" IS NOT NULL)
ORDER BY "formulaType";

-- ============================================
-- 13. DATA INTEGRITY CHECKS
-- ============================================
\echo ''
\echo '13. DATA INTEGRITY CHECKS'

-- Check for orphaned records
SELECT 'DC_CONFIGS_WITHOUT_COMPANY' as check_name, COUNT(*) as count
FROM dc_configs dc
LEFT JOIN companies c ON dc."companyId" = c.id
WHERE c.id IS NULL

UNION ALL

SELECT 'DC_TIERS_WITHOUT_COMPANY', COUNT(*)
FROM dc_capital_tiers dct
LEFT JOIN companies c ON dct."companyId" = c.id
WHERE c.id IS NULL

UNION ALL

SELECT 'PRICING_RULES_WITHOUT_COMPANY', COUNT(*)
FROM pricing_rules pr
LEFT JOIN companies c ON pr."companyId" = c.id
WHERE c.id IS NULL

UNION ALL

SELECT 'PRICING_RULES_WITHOUT_GUARANTEE', COUNT(*)
FROM pricing_rules pr
LEFT JOIN guarantees g ON pr."guaranteeId" = g.id
WHERE g.id IS NULL;

-- ============================================
-- 14. CRITICAL CONFIGURATION SUMMARY
-- ============================================
\echo ''
\echo '14. CRITICAL CONFIGURATION SUMMARY'
SELECT 
  'MIGRATION_STATUS' as config_item,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'simulations' AND column_name = 'acCapitals'
  ) THEN 'APPLIED' ELSE 'MISSING' END as status

UNION ALL

SELECT 'COMPANIES_ACTIVE', COUNT(*)::text
FROM companies WHERE "isActive" = true

UNION ALL

SELECT 'DC_CONFIGS_ACTIVE', COUNT(*)::text  
FROM dc_configs WHERE "isActive" = true

UNION ALL

SELECT 'DC_TIERS_ACTIVE', COUNT(*)::text
FROM dc_capital_tiers WHERE "isActive" = true

UNION ALL

SELECT 'GUARANTEES_ACTIVE', COUNT(*)::text
FROM guarantees WHERE "isActive" = true

UNION ALL

SELECT 'PRICING_RULES_ACTIVE', COUNT(*)::text
FROM pricing_rules WHERE "isActive" = true

UNION ALL

SELECT 'CONVENTIONS_ACTIVE', COUNT(*)::text
FROM conventions WHERE status = 'ACTIVE';

\echo ''
\echo '=== END DETAILED COMPARISON ==='