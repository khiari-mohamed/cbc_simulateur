-- ============================================
-- FOLLOW-UP VERIFICATION - Missing Items
-- ============================================

-- ============================================
-- 1. CHECK PRICING RULES FOR AC
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
-- 2. CHECK ALL PRICING RULES
-- ============================================
SELECT 
  c.name AS company_name,
  g.code AS guarantee_code,
  COUNT(*) as rule_count
FROM pricing_rules pr
JOIN companies c ON pr."companyId" = c.id
JOIN guarantees g ON pr."guaranteeId" = g.id
WHERE pr."isActive" = true
GROUP BY c.name, g.code
ORDER BY c.name, g.code;

-- ============================================
-- 3. CHECK RECENT SIMULATIONS WITH AC CAPITALS
-- ============================================
SELECT 
  id,
  "formulaType",
  "acCapitals",
  "createdAt"
FROM simulations
WHERE "acCapitals" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 3;

-- ============================================
-- 4. CHECK COMPANIES AND USAGE TYPES
-- ============================================
SELECT 
  c.name AS company_name,
  c.code AS company_code,
  c."isActive"
FROM companies c
WHERE c."isActive" = true
ORDER BY c.name;

SELECT 
  u."nameFr" AS usage_name,
  u.code AS usage_code,
  u."isActive"
FROM usage_types u
WHERE u."isActive" = true
ORDER BY u."nameFr";

-- ============================================
-- 5. CHECK CONVENTIONS
-- ============================================
SELECT 
  c.name AS convention_name,
  c.code AS convention_code,
  c.status,
  c."createdAt"
FROM conventions c
WHERE c.status = 'ACTIVE'
ORDER BY c.name;