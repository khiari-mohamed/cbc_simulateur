-- ============================================
-- SCRIPT DE VÉRIFICATION - Configuration DB
-- Date: 08/04/2026
-- ============================================

-- ============================================
-- 1. VÉRIFICATION MIGRATION AC CAPITALS
-- ============================================
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'Simulation' 
  AND column_name IN ('dcCapitals', 'acCapitals');

-- Résultat attendu:
-- dcCapitals | jsonb | YES
-- acCapitals | jsonb | YES


-- ============================================
-- 2. VÉRIFICATION DC CONFIG
-- ============================================
SELECT 
  c.name AS company_name,
  u."nameFr" AS usage_name,
  dc."maxCapitalPercent",
  dc."maxCapitalAbsolute",
  dc."minCapital",
  dc."basePremium",
  dc."isActive"
FROM "DcConfig" dc
JOIN "Company" c ON dc."companyId" = c.id
JOIN "UsageType" u ON dc."usageId" = u.id
WHERE dc."isActive" = true
ORDER BY c.name, u."nameFr";

-- Résultat attendu:
-- AL BARAKA | Privé/Affaires | 50 | 100000 | 1000 | 10 | true
-- LLOYD Assurances | Privé/Affaires | 50 | 100000 | 1000 | 10 | true


-- ============================================
-- 3. VÉRIFICATION DC CAPITAL TIERS
-- ============================================
SELECT 
  c.name AS company_name,
  u."nameFr" AS usage_name,
  dct."minAmount",
  dct."maxAmount",
  dct."step",
  dct."isActive"
FROM "DcCapitalTier" dct
JOIN "Company" c ON dct."companyId" = c.id
JOIN "UsageType" u ON dct."usageId" = u.id
WHERE dct."isActive" = true
ORDER BY c.name, u."nameFr", dct."minAmount";

-- Résultat attendu pour LLOYD:
-- LLOYD | Privé/Affaires | 1000 | 10000 | 1000 | true
-- LLOYD | Privé/Affaires | 10001 | 20000 | 5000 | true
-- LLOYD | Privé/Affaires | 20001 | 50000 | 10000 | true
-- LLOYD | Privé/Affaires | 50001 | 100000 | 25000 | true

-- Résultat attendu pour AL BARAKA:
-- AL BARAKA | Privé/Affaires | 1000 | 20000 | 1000 | true


-- ============================================
-- 4. VÉRIFICATION FRANCHISE VALUES
-- ============================================
SELECT 
  value,
  label,
  "isActive",
  "createdAt"
FROM "FranchiseValue"
WHERE "isActive" = true
ORDER BY value;

-- Résultat attendu:
-- 0 | Sans franchise (0%) | true | ...
-- 5 | 5% | true | ...
-- 10 | 10% | true | ...

-- ⚠️ SI VIDE, EXÉCUTER:
/*
INSERT INTO "FranchiseValue" (id, value, label, "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 0, 'Sans franchise (0%)', true, NOW(), NOW()),
  (gen_random_uuid(), 5, '5%', true, NOW(), NOW()),
  (gen_random_uuid(), 10, '10%', true, NOW(), NOW()),
  (gen_random_uuid(), 15, '15%', true, NOW(), NOW()),
  (gen_random_uuid(), 20, '20%', true, NOW(), NOW());
*/


-- ============================================
-- 5. VÉRIFICATION BG CAPITAL LIMITS
-- ============================================
SELECT 
  value,
  label,
  "isActive",
  "createdAt"
FROM "BgCapitalLimit"
WHERE "isActive" = true
ORDER BY value;

-- Résultat attendu:
-- 1000 | 1 000 DT | true | ...
-- 2000 | 2 000 DT | true | ...
-- 3000 | 3 000 DT | true | ...

-- ⚠️ SI VIDE, EXÉCUTER:
/*
INSERT INTO "BgCapitalLimit" (id, value, label, "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 1000, '1 000 DT', true, NOW(), NOW()),
  (gen_random_uuid(), 2000, '2 000 DT', true, NOW(), NOW()),
  (gen_random_uuid(), 3000, '3 000 DT', true, NOW(), NOW()),
  (gen_random_uuid(), 5000, '5 000 DT', true, NOW(), NOW());
*/


-- ============================================
-- 6. VÉRIFICATION FORMULA ELIGIBILITY
-- ============================================
SELECT 
  c.name AS company_name,
  u."nameFr" AS usage_name,
  fe."formulaType",
  fe."maxAge",
  fe."isActive"
FROM "FormulaEligibility" fe
JOIN "Company" c ON fe."companyId" = c.id
JOIN "UsageType" u ON fe."usageId" = u.id
WHERE fe."isActive" = true
ORDER BY c.name, u."nameFr", fe."formulaType";

-- Résultat attendu pour chaque compagnie + usage:
-- LLOYD | Privé/Affaires | STANDARD | NULL | true
-- LLOYD | Privé/Affaires | TOUS_RISQUES_0 | 10 | true
-- LLOYD | Privé/Affaires | DOMMAGES_COLLISIONS | 15 | true

-- ⚠️ SI VIDE, EXÉCUTER (exemple pour LLOYD + Privé/Affaires):
/*
INSERT INTO "FormulaEligibility" (id, "companyId", "usageId", "formulaType", "maxAge", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'b6e560c7-0028-46f3-9f8e-da38139d5f43', 'ba202b29-4b6f-4a15-b9ee-19e7b274eb2d', 'STANDARD', NULL, true, NOW(), NOW()),
  (gen_random_uuid(), 'b6e560c7-0028-46f3-9f8e-da38139d5f43', 'ba202b29-4b6f-4a15-b9ee-19e7b274eb2d', 'TOUS_RISQUES_0', 10, true, NOW(), NOW()),
  (gen_random_uuid(), 'b6e560c7-0028-46f3-9f8e-da38139d5f43', 'ba202b29-4b6f-4a15-b9ee-19e7b274eb2d', 'DOMMAGES_COLLISIONS', 15, true, NOW(), NOW());
*/


-- ============================================
-- 7. VÉRIFICATION GARANTIES
-- ============================================
SELECT 
  code,
  "nameFr",
  "isOptional",
  "isActive"
FROM "Guarantee"
WHERE "isActive" = true
ORDER BY "isOptional", code;

-- Vérifier que ces garanties existent:
-- ASSURANCE_CONDUCTEUR | Assurance Conducteur | true | true
-- BG | Bris de Glaces | true | true
-- CATASTROPHES_NATURELLES | Catastrophes Naturelles | true | true
-- INCENDIE_SUITE_EMEUTES | Incendie Suite Émeutes | true | true


-- ============================================
-- 8. VÉRIFICATION PRICING RULES AC
-- ============================================
SELECT 
  c.name AS company_name,
  g.code AS guarantee_code,
  pr."minCapital",
  pr."fixedPremium",
  pr."isActive"
FROM "PricingRule" pr
JOIN "Company" c ON pr."companyId" = c.id
JOIN "Guarantee" g ON pr."guaranteeId" = g.id
WHERE g.code = 'ASSURANCE_CONDUCTEUR'
  AND pr."isActive" = true
ORDER BY c.name, pr."minCapital";

-- Résultat attendu:
-- LLOYD | ASSURANCE_CONDUCTEUR | 10000 | 10 | true
-- AL BARAKA | ASSURANCE_CONDUCTEUR | 10000 | 10 | true

-- ⚠️ SI VIDE, EXÉCUTER:
/*
-- Récupérer les IDs
SELECT id, name FROM "Company" WHERE name IN ('LLOYD Assurances', 'AL BARAKA');
SELECT id, code FROM "Guarantee" WHERE code = 'ASSURANCE_CONDUCTEUR';

-- Insérer les règles
INSERT INTO "PricingRule" (id, "companyId", "guaranteeId", "minCapital", "fixedPremium", "isActive", "validFrom", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'b6e560c7-0028-46f3-9f8e-da38139d5f43', 'ae927a27-0adf-49b1-b726-266cfa4a4ec2', 5000, 5, true, NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'b6e560c7-0028-46f3-9f8e-da38139d5f43', 'ae927a27-0adf-49b1-b726-266cfa4a4ec2', 10000, 10, true, NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'b6e560c7-0028-46f3-9f8e-da38139d5f43', 'ae927a27-0adf-49b1-b726-266cfa4a4ec2', 15000, 15, true, NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'b6e560c7-0028-46f3-9f8e-da38139d5f43', 'ae927a27-0adf-49b1-b726-266cfa4a4ec2', 20000, 20, true, NOW(), NOW(), NOW());

-- Répéter pour AL BARAKA avec son ID
*/


-- ============================================
-- 9. VÉRIFICATION CONVENTIONS
-- ============================================
SELECT 
  o.name AS organization_name,
  c.name AS convention_name,
  c.code AS convention_code,
  c.status,
  COUNT(cr.id) AS reduction_count
FROM "Convention" c
JOIN "Organization" o ON c."organizationId" = o.id
LEFT JOIN "ConventionReduction" cr ON c.id = cr."conventionId"
WHERE c.status = 'ACTIVE'
GROUP BY o.name, c.name, c.code, c.status
ORDER BY o.name, c.name;

-- Vérifier que les conventions ont des réductions configurées


-- ============================================
-- 10. VÉRIFICATION SIMULATIONS RÉCENTES
-- ============================================
SELECT 
  id,
  "formulaType",
  "dcCapitals",
  "acCapitals",
  "createdAt"
FROM "Simulation"
ORDER BY "createdAt" DESC
LIMIT 5;

-- Vérifier que acCapitals est bien rempli pour les nouvelles simulations


-- ============================================
-- RÉSUMÉ DES VÉRIFICATIONS
-- ============================================
/*
✅ À VÉRIFIER:
1. Migration acCapitals appliquée
2. DC Config configuré pour toutes les compagnies
3. DC Capital Tiers configuré pour toutes les compagnies
4. Franchise Values configurées
5. BG Capital Limits configurées
6. Formula Eligibility configurée pour toutes les compagnies/usages
7. Garanties actives (AC, BG, Catastrophes, Incendie Émeutes)
8. Pricing Rules AC configurées
9. Conventions avec réductions
10. Simulations récentes avec acCapitals

⚠️ SI MANQUANT:
- Exécuter les INSERT commentés ci-dessus
- Vérifier les IDs des compagnies et garanties
- Adapter les valeurs selon les besoins métier
*/
