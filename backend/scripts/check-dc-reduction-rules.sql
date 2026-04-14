-- ========================================
-- CHECK DC REDUCTION RULES
-- ========================================
-- This script checks convention reduction rules for Dommages Collision (DC)
-- Run this on BOTH PROD and DEV databases to compare

-- 1. Check if DC guarantee exists and get its ID
SELECT 
  id,
  code,
  "nameFr" as name_fr,
  "systemRole" as system_role,
  "isActive" as is_active
FROM guarantees
WHERE "systemRole" = 'OPTIONAL_DOMMAGES_COLLISIONS';

-- 2. Check all convention reduction rules for DC
SELECT 
  crr.id,
  c.name as company_name,
  c.code as company_code,
  conv.name as convention_name,
  g.code as guarantee_code,
  g."nameFr" as guarantee_name,
  crr."discountPercent" as discount_percent,
  crr.metric,
  crr."formulaType" as formula_type,
  crr."usageId" as usage_id,
  u."nameFr" as usage_name,
  crr."minValue" as min_value,
  crr."maxValue" as max_value,
  crr."minInclusive" as min_inclusive,
  crr."maxInclusive" as max_inclusive,
  crr.priority,
  crr."isActive" as is_active,
  crr."validFrom" as valid_from,
  crr."validTo" as valid_to,
  crr."createdAt" as created_at
FROM convention_reduction_rules crr
JOIN guarantees g ON g.id = crr."guaranteeId"
LEFT JOIN companies c ON c.id = crr."companyId"
LEFT JOIN conventions conv ON conv.id = crr."conventionId"
LEFT JOIN usage_types u ON u.id = crr."usageId"
WHERE g."systemRole" = 'OPTIONAL_DOMMAGES_COLLISIONS'
  AND crr."isActive" = true
  AND (crr."validTo" IS NULL OR crr."validTo" >= CURRENT_DATE)
ORDER BY 
  c.name NULLS FIRST,
  conv.name,
  crr.priority DESC,
  crr."createdAt" DESC;

-- 3. Check specifically for LLOYD + DC rules
SELECT 
  crr.id,
  c.name as company_name,
  conv.name as convention_name,
  g.code as guarantee_code,
  crr."discountPercent" as discount_percent,
  crr.metric,
  crr."formulaType" as formula_type,
  u."nameFr" as usage_name,
  crr."minValue" as min_value,
  crr."maxValue" as max_value,
  crr.priority,
  crr."isActive" as is_active
FROM convention_reduction_rules crr
JOIN guarantees g ON g.id = crr."guaranteeId"
JOIN companies c ON c.id = crr."companyId"
LEFT JOIN conventions conv ON conv.id = crr."conventionId"
LEFT JOIN usage_types u ON u.id = crr."usageId"
WHERE g."systemRole" = 'OPTIONAL_DOMMAGES_COLLISIONS'
  AND c.code = 'LLOYD'
  AND crr."isActive" = true
  AND (crr."validTo" IS NULL OR crr."validTo" >= CURRENT_DATE)
ORDER BY crr.priority DESC;

-- 4. Check for AL BARAKA + DC rules (for comparison)
SELECT 
  crr.id,
  c.name as company_name,
  conv.name as convention_name,
  g.code as guarantee_code,
  crr."discountPercent" as discount_percent,
  crr.metric,
  crr."formulaType" as formula_type,
  u."nameFr" as usage_name,
  crr."minValue" as min_value,
  crr."maxValue" as max_value,
  crr.priority,
  crr."isActive" as is_active
FROM convention_reduction_rules crr
JOIN guarantees g ON g.id = crr."guaranteeId"
JOIN companies c ON c.id = crr."companyId"
LEFT JOIN conventions conv ON conv.id = crr."conventionId"
LEFT JOIN usage_types u ON u.id = crr."usageId"
WHERE g."systemRole" = 'OPTIONAL_DOMMAGES_COLLISIONS'
  AND c.code = 'AL_BARAKA'
  AND crr."isActive" = true
  AND (crr."validTo" IS NULL OR crr."validTo" >= CURRENT_DATE)
ORDER BY crr.priority DESC;

-- 5. Check VOL and INCENDIE rules for comparison (these work correctly)
SELECT 
  g.code as guarantee_code,
  c.name as company_name,
  conv.name as convention_name,
  crr."discountPercent" as discount_percent,
  crr.metric,
  crr."formulaType" as formula_type,
  u."nameFr" as usage_name,
  crr."minValue" as min_value,
  crr."maxValue" as max_value,
  crr.priority,
  crr."isActive" as is_active
FROM convention_reduction_rules crr
JOIN guarantees g ON g.id = crr."guaranteeId"
JOIN companies c ON c.id = crr."companyId"
LEFT JOIN conventions conv ON conv.id = crr."conventionId"
LEFT JOIN usage_types u ON u.id = crr."usageId"
WHERE g."systemRole" IN ('MANDATORY_VOL', 'MANDATORY_INCENDIE')
  AND c.code = 'LLOYD'
  AND crr."isActive" = true
  AND (crr."validTo" IS NULL OR crr."validTo" >= CURRENT_DATE)
ORDER BY g.code, crr.priority DESC;

-- 6. Count total DC reduction rules
SELECT 
  COUNT(*) as total_dc_rules,
  COUNT(DISTINCT crr."companyId") as companies_with_rules,
  COUNT(DISTINCT crr."conventionId") as conventions_with_rules
FROM convention_reduction_rules crr
JOIN guarantees g ON g.id = crr."guaranteeId"
WHERE g."systemRole" = 'OPTIONAL_DOMMAGES_COLLISIONS'
  AND crr."isActive" = true;
