-- ============================================
-- SCRIPT DE VERIFICATION - Configuration DB (FINAL)
-- Date: 08/04/2026
-- Mixed naming: snake_case tables + camelCase columns
-- ============================================

-- ============================================
-- 1. VERIFICATION MIGRATION AC CAPITALS
-- ============================================
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'simulations' 
  AND column_name IN ('dcCapitals', 'acCapitals');

-- Resultat attendu:
-- dcCapitals | jsonb | YES
-- acCapitals | jsonb | YES


-- ============================================
-- 2. VERIFICATION DC CONFIG
-- ============================================
SELECT 
  c.name AS company_name,
  u."nameFr" AS usage_name,
  dc."maxCapitalPercent",
  dc."maxCapitalAbsolute",
  dc."minCapital",
  dc."basePremium",
  dc."isActive"
FROM dc_configs dc
JOIN companies c ON dc."companyId" = c.id
JOIN usage_types u ON dc."usageId" = u.id
WHERE dc."isActive" = true
ORDER BY c.name, u."nameFr";


-- ============================================
-- 3. VERIFICATION DC CAPITAL TIERS
-- ============================================
SELECT 
  c.name AS company_name,
  u."nameFr" AS usage_name,
  dct."minAmount",
  dct."maxAmount",
  dct."step",
  dct."isActive"
FROM dc_capital_tiers dct
JOIN companies c ON dct."companyId" = c.id
JOIN usage_types u ON dct."usageId" = u.id
WHERE dct."isActive" = true
ORDER BY c.name, u."nameFr", dct."minAmount";


-- ============================================
-- 4. VERIFICATION FRANCHISE VALUES
-- ============================================
SELECT 
  value,
  label,
  "isActive",
  "createdAt"
FROM franchise_values
WHERE "isActive" = true
ORDER BY value;


-- ============================================
-- 5. VERIFICATION BG CAPITAL LIMITS
-- ============================================
SELECT 
  value,
  label,
  "isActive",
  "createdAt"
FROM bg_capital_limits
WHERE "isActive" = true
ORDER BY value;


-- ============================================
-- 6. VERIFICATION FORMULA ELIGIBILITY
-- ============================================
-- Check if table exists first
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_name = 'formula_eligibilities';

-- If table exists, run this query:
/*
SELECT 
  c.name AS company_name,
  u."nameFr" AS usage_name,
  fe."formulaType",
  fe."maxAge",
  fe."isActive"
FROM formula_eligibilities fe
JOIN companies c ON fe."companyId" = c.id
JOIN usage_types u ON fe."usageId" = u.id
WHERE fe."isActive" = true
ORDER BY c.name, u."nameFr", fe."formulaType";
*/


-- ============================================
-- 7. VERIFICATION GARANTIES
-- ============================================
SELECT 
  code,
  "nameFr",
  "isOptional",
  "isActive"
FROM guarantees
WHERE "isActive" = true
ORDER BY "isOptional", code;


-- ============================================
-- 8. VERIFICATION PRICING RULES AC
-- ============================================
SELECT 
  c.name AS company_name,
  g.code AS guarantee_code,
  pr."minCapital",
  pr."fixedPremium",
  pr."isActive"
FROM pricing_rules pr
JOIN companies c ON pr."companyId" = c.id
JOIN guarantees g ON pr."guaranteeId" = g.id
WHERE g.code = 'ASSURANCE_CONDUCTEUR'
  AND pr."isActive" = true
ORDER BY c.name, pr."minCapital";


-- ============================================
-- 9. VERIFICATION CONVENTIONS
-- ============================================
-- Check if organizations table exists
SELECT COUNT(*) as organizations_table_exists 
FROM information_schema.tables 
WHERE table_name = 'organizations';

-- Basic conventions check
SELECT 
  c.name AS convention_name,
  c.code AS convention_code,
  c.status,
  c."createdAt"
FROM conventions c
WHERE c.status = 'ACTIVE'
ORDER BY c.name;


-- ============================================
-- 10. VERIFICATION SIMULATIONS RECENTES
-- ============================================
SELECT 
  id,
  "formulaType",
  "dcCapitals",
  "acCapitals",
  "createdAt"
FROM simulations
ORDER BY "createdAt" DESC
LIMIT 5;


-- ============================================
-- 11. VERIFICATION COMPANIES ET USAGE TYPES
-- ============================================
SELECT 
  c.name AS company_name,
  c.code AS company_code,
  c."isActive" AS company_active
FROM companies c
WHERE c."isActive" = true
ORDER BY c.name;

SELECT 
  u."nameFr" AS usage_name,
  u.code AS usage_code,
  u."isActive" AS usage_active
FROM usage_types u
WHERE u."isActive" = true
ORDER BY u."nameFr";


-- ============================================
-- 12. VERIFICATION STRUCTURE TABLES
-- ============================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'simulations', 'dc_configs', 'dc_capital_tiers', 
    'franchise_values', 'bg_capital_limits', 'formula_eligibilities',
    'guarantees', 'pricing_rules', 'conventions', 'companies', 'usage_types'
  )
ORDER BY table_name;


-- ============================================
-- RESUME DES VERIFICATIONS
-- ============================================
/*
TABLES TROUVEES:
- bg_capital_limits
- companies  
- conventions
- dc_capital_tiers
- dc_configs
- franchise_values
- guarantees
- pricing_rules
- simulations
- usage_types

TABLES MANQUANTES:
- formula_eligibilities (peut-etre pas encore creee)
- organizations (peut-etre pas encore creee)

A VERIFIER:
1. Migration acCapitals appliquee
2. DC Config configure pour toutes les compagnies
3. DC Capital Tiers configure pour toutes les compagnies  
4. Franchise Values configurees
5. BG Capital Limits configurees
6. Garanties actives
7. Pricing Rules AC configurees
8. Conventions actives
9. Simulations recentes avec acCapitals
10. Companies et Usage Types actifs
*/