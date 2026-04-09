-- ============================================
-- SCRIPT: Création de règles de réduction
-- ============================================
-- Ce script aide à créer des règles de réduction pour les conventions
-- Remplacer <CONVENTION_ID> par l'ID de votre convention

-- ============================================
-- ÉTAPE 1: Trouver les IDs nécessaires
-- ============================================

-- Lister toutes les conventions actives
SELECT id, name, "organizationId", status 
FROM conventions 
WHERE "isActive" = true;

-- Lister toutes les compagnies actives
SELECT id, name, code 
FROM companies 
WHERE "isActive" = true;

-- Lister toutes les garanties avec leur systemRole
SELECT id, code, "nameFr", "systemRole", "isOptional"
FROM guarantees 
WHERE "isActive" = true
ORDER BY "isOptional", code;

-- Lister tous les types d'usage
SELECT id, code, "nameFr"
FROM usage_types
WHERE "isActive" = true;

-- ============================================
-- ÉTAPE 2: Créer les règles de réduction
-- ============================================

-- IMPORTANT: Remplacer <CONVENTION_ID> par l'ID réel de votre convention

-- ────────────────────────────────────────────
-- Règle 1: VOL - 35% de réduction
-- ────────────────────────────────────────────
INSERT INTO convention_reduction_rules (
  id,
  "conventionId",
  "companyId",
  "guaranteeId",
  "formulaType",
  "usageId",
  metric,
  "minValue",
  "maxValue",
  "minInclusive",
  "maxInclusive",
  "discountPercent",
  priority,
  "validFrom",
  "validTo",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '<CONVENTION_ID>',  -- ⚠️ REMPLACER ICI
  NULL,               -- NULL = toutes les compagnies
  g.id,
  NULL,               -- NULL = toutes les formules
  NULL,               -- NULL = tous les usages
  'MARKET_VALUE',
  0,
  NULL,
  true,
  false,
  35.00,              -- 35% de réduction
  0,
  NOW(),
  NULL,
  true,
  NOW(),
  NOW()
FROM guarantees g
WHERE g."systemRole" = 'MANDATORY_VOL';

-- ────────────────────────────────────────────
-- Règle 2: INCENDIE - 30% de réduction
-- ────────────────────────────────────────────
INSERT INTO convention_reduction_rules (
  id, "conventionId", "companyId", "guaranteeId", "formulaType", "usageId",
  metric, "minValue", "maxValue", "minInclusive", "maxInclusive",
  "discountPercent", priority, "validFrom", "validTo", "isActive", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '<CONVENTION_ID>',  -- ⚠️ REMPLACER ICI
  NULL,
  g.id,
  NULL,
  NULL,
  'MARKET_VALUE',
  0,
  NULL,
  true,
  false,
  30.00,              -- 30% de réduction
  0,
  NOW(),
  NULL,
  true,
  NOW(),
  NOW()
FROM guarantees g
WHERE g."systemRole" = 'MANDATORY_INCENDIE';

-- ────────────────────────────────────────────
-- Règle 3: TOUS RISQUES 0% - 25% de réduction
-- ────────────────────────────────────────────
INSERT INTO convention_reduction_rules (
  id, "conventionId", "companyId", "guaranteeId", "formulaType", "usageId",
  metric, "minValue", "maxValue", "minInclusive", "maxInclusive",
  "discountPercent", priority, "validFrom", "validTo", "isActive", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '<CONVENTION_ID>',  -- ⚠️ REMPLACER ICI
  NULL,
  g.id,
  'TOUS_RISQUES_0',   -- Seulement pour cette formule
  NULL,
  'MARKET_VALUE',
  0,
  NULL,
  true,
  false,
  25.00,              -- 25% de réduction
  0,
  NOW(),
  NULL,
  true,
  NOW(),
  NOW()
FROM guarantees g
WHERE g."systemRole" = 'OPTIONAL_TOUS_RISQUES';

-- ────────────────────────────────────────────
-- Règle 4: DOMMAGES COLLISIONS - 20% de réduction
-- ────────────────────────────────────────────
INSERT INTO convention_reduction_rules (
  id, "conventionId", "companyId", "guaranteeId", "formulaType", "usageId",
  metric, "minValue", "maxValue", "minInclusive", "maxInclusive",
  "discountPercent", priority, "validFrom", "validTo", "isActive", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '<CONVENTION_ID>',  -- ⚠️ REMPLACER ICI
  NULL,
  g.id,
  'DOMMAGES_COLLISIONS',
  NULL,
  'DC_CAPITAL',       -- ⚠️ Métrique différente pour DC
  0,
  NULL,
  true,
  false,
  20.00,              -- 20% de réduction
  0,
  NOW(),
  NULL,
  true,
  NOW(),
  NOW()
FROM guarantees g
WHERE g."systemRole" = 'OPTIONAL_DOMMAGES_COLLISIONS';

-- ────────────────────────────────────────────
-- Règle 5: BRIS DE GLACES - 15% de réduction
-- ────────────────────────────────────────────
INSERT INTO convention_reduction_rules (
  id, "conventionId", "companyId", "guaranteeId", "formulaType", "usageId",
  metric, "minValue", "maxValue", "minInclusive", "maxInclusive",
  "discountPercent", priority, "validFrom", "validTo", "isActive", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '<CONVENTION_ID>',  -- ⚠️ REMPLACER ICI
  NULL,
  g.id,
  NULL,
  NULL,
  'NEW_VALUE',        -- ⚠️ Métrique différente pour BG
  0,
  NULL,
  true,
  false,
  15.00,              -- 15% de réduction
  0,
  NOW(),
  NULL,
  true,
  NOW(),
  NOW()
FROM guarantees g
WHERE g."systemRole" = 'OPTIONAL_BRIS_GLACES';

-- ============================================
-- ÉTAPE 3: Vérifier les règles créées
-- ============================================

SELECT 
  crr.id,
  c.name as convention_name,
  comp.name as company_name,
  g.code as guarantee_code,
  g."nameFr" as guarantee_name,
  crr."formulaType",
  crr.metric,
  crr."minValue",
  crr."maxValue",
  crr."discountPercent" as reduction_percent,
  crr."isActive"
FROM convention_reduction_rules crr
LEFT JOIN conventions c ON c.id = crr."conventionId"
LEFT JOIN companies comp ON comp.id = crr."companyId"
LEFT JOIN guarantees g ON g.id = crr."guaranteeId"
WHERE crr."conventionId" = '<CONVENTION_ID>'  -- ⚠️ REMPLACER ICI
  AND crr."isActive" = true
ORDER BY g.code;

-- ============================================
-- ÉTAPE 4: Tester avec une simulation
-- ============================================

-- Créer une simulation avec la convention
-- Puis vérifier les logs du backend pour voir:
-- [ReductionRates] Searching reduction for: ...
-- [ReductionRates] Found X potential rules
-- [ReductionRates] ✅ Applying X% reduction for ...

-- ============================================
-- EXEMPLES AVANCÉS
-- ============================================

-- ────────────────────────────────────────────
-- Exemple 1: Réduction par paliers de valeur vénale
-- 40% pour VV < 100,000 DH
-- 30% pour VV entre 100,000 et 200,000 DH
-- 20% pour VV > 200,000 DH
-- ────────────────────────────────────────────

-- Palier 1: VV < 100,000
INSERT INTO convention_reduction_rules (
  id, "conventionId", "companyId", "guaranteeId", "formulaType", "usageId",
  metric, "minValue", "maxValue", "minInclusive", "maxInclusive",
  "discountPercent", priority, "validFrom", "validTo", "isActive", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '<CONVENTION_ID>',
  NULL,
  g.id,
  NULL,
  NULL,
  'MARKET_VALUE',
  0,
  100000,
  true,
  false,              -- maxInclusive = false, donc < 100,000
  40.00,
  10,                 -- Priorité plus élevée
  NOW(),
  NULL,
  true,
  NOW(),
  NOW()
FROM guarantees g
WHERE g."systemRole" = 'MANDATORY_VOL';

-- Palier 2: 100,000 <= VV < 200,000
INSERT INTO convention_reduction_rules (
  id, "conventionId", "companyId", "guaranteeId", "formulaType", "usageId",
  metric, "minValue", "maxValue", "minInclusive", "maxInclusive",
  "discountPercent", priority, "validFrom", "validTo", "isActive", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '<CONVENTION_ID>',
  NULL,
  g.id,
  NULL,
  NULL,
  'MARKET_VALUE',
  100000,
  200000,
  true,               -- >= 100,000
  false,              -- < 200,000
  30.00,
  9,
  NOW(),
  NULL,
  true,
  NOW(),
  NOW()
FROM guarantees g
WHERE g."systemRole" = 'MANDATORY_VOL';

-- Palier 3: VV >= 200,000
INSERT INTO convention_reduction_rules (
  id, "conventionId", "companyId", "guaranteeId", "formulaType", "usageId",
  metric, "minValue", "maxValue", "minInclusive", "maxInclusive",
  "discountPercent", priority, "validFrom", "validTo", "isActive", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '<CONVENTION_ID>',
  NULL,
  g.id,
  NULL,
  NULL,
  'MARKET_VALUE',
  200000,
  NULL,
  true,               -- >= 200,000
  false,
  20.00,
  8,
  NOW(),
  NULL,
  true,
  NOW(),
  NOW()
FROM guarantees g
WHERE g."systemRole" = 'MANDATORY_VOL';

-- ────────────────────────────────────────────
-- Exemple 2: Réduction spécifique à une compagnie
-- ────────────────────────────────────────────
INSERT INTO convention_reduction_rules (
  id, "conventionId", "companyId", "guaranteeId", "formulaType", "usageId",
  metric, "minValue", "maxValue", "minInclusive", "maxInclusive",
  "discountPercent", priority, "validFrom", "validTo", "isActive", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '<CONVENTION_ID>',
  '<COMPANY_ID>',     -- ⚠️ Spécifier l'ID de la compagnie
  g.id,
  NULL,
  NULL,
  'MARKET_VALUE',
  0,
  NULL,
  true,
  false,
  45.00,              -- 45% pour cette compagnie spécifique
  20,                 -- Priorité très élevée
  NOW(),
  NULL,
  true,
  NOW(),
  NOW()
FROM guarantees g
WHERE g."systemRole" = 'MANDATORY_VOL';

-- ────────────────────────────────────────────
-- Exemple 3: Réduction spécifique à un usage
-- ────────────────────────────────────────────
INSERT INTO convention_reduction_rules (
  id, "conventionId", "companyId", "guaranteeId", "formulaType", "usageId",
  metric, "minValue", "maxValue", "minInclusive", "maxInclusive",
  "discountPercent", priority, "validFrom", "validTo", "isActive", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '<CONVENTION_ID>',
  NULL,
  g.id,
  NULL,
  '<USAGE_ID>',       -- ⚠️ Spécifier l'ID de l'usage (ex: TOURISME)
  'MARKET_VALUE',
  0,
  NULL,
  true,
  false,
  40.00,              -- 40% pour cet usage spécifique
  15,
  NOW(),
  NULL,
  true,
  NOW(),
  NOW()
FROM guarantees g
WHERE g."systemRole" = 'MANDATORY_VOL';

-- ============================================
-- NETTOYAGE (si nécessaire)
-- ============================================

-- Désactiver toutes les règles d'une convention
-- UPDATE convention_reduction_rules 
-- SET "isActive" = false, "updatedAt" = NOW()
-- WHERE "conventionId" = '<CONVENTION_ID>';

-- Supprimer toutes les règles d'une convention
-- DELETE FROM convention_reduction_rules 
-- WHERE "conventionId" = '<CONVENTION_ID>';
