-- ============================================
-- SCRIPT DE VÉRIFICATION - Configuration DB (FIXED)
-- Date: 08/04/2026
-- Table names corrected for snake_case
-- ============================================

-- ============================================
-- 1. VÉRIFICATION MIGRATION AC CAPITALS
-- ============================================
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'simulations' 
  AND column_name IN ('dc_capitals', 'ac_capitals');

-- Résultat attendu:
-- dc_capitals | jsonb | YES
-- ac_capitals | jsonb | YES


-- ============================================
-- 2. VÉRIFICATION DC CONFIG
-- ============================================
SELECT 
  c.name AS company_name,
  u.name_fr AS usage_name,
  dc.max_capital_percent,
  dc.max_capital_absolute,
  dc.min_capital,
  dc.base_premium,
  dc.is_active
FROM dc_configs dc
JOIN companies c ON dc.company_id = c.id
JOIN usage_types u ON dc.usage_id = u.id
WHERE dc.is_active = true
ORDER BY c.name, u.name_fr;

-- Résultat attendu:
-- AL BARAKA | Privé/Affaires | 50 | 100000 | 1000 | 10 | true
-- LLOYD Assurances | Privé/Affaires | 50 | 100000 | 1000 | 10 | true


-- ============================================
-- 3. VÉRIFICATION DC CAPITAL TIERS
-- ============================================
SELECT 
  c.name AS company_name,
  u.name_fr AS usage_name,
  dct.min_amount,
  dct.max_amount,
  dct.step,
  dct.is_active
FROM dc_capital_tiers dct
JOIN companies c ON dct.company_id = c.id
JOIN usage_types u ON dct.usage_id = u.id
WHERE dct.is_active = true
ORDER BY c.name, u.name_fr, dct.min_amount;

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
  is_active,
  created_at
FROM franchise_values
WHERE is_active = true
ORDER BY value;

-- Résultat attendu:
-- 0 | Sans franchise (0%) | true | ...
-- 5 | 5% | true | ...
-- 10 | 10% | true | ...


-- ============================================
-- 5. VÉRIFICATION BG CAPITAL LIMITS
-- ============================================
SELECT 
  value,
  label,
  is_active,
  created_at
FROM bg_capital_limits
WHERE is_active = true
ORDER BY value;

-- Résultat attendu:
-- 1000 | 1 000 DT | true | ...
-- 2000 | 2 000 DT | true | ...
-- 3000 | 3 000 DT | true | ...


-- ============================================
-- 6. VÉRIFICATION FORMULA ELIGIBILITY
-- ============================================
SELECT 
  c.name AS company_name,
  u.name_fr AS usage_name,
  fe.formula_type,
  fe.max_age,
  fe.is_active
FROM formula_eligibilities fe
JOIN companies c ON fe.company_id = c.id
JOIN usage_types u ON fe.usage_id = u.id
WHERE fe.is_active = true
ORDER BY c.name, u.name_fr, fe.formula_type;

-- Résultat attendu pour chaque compagnie + usage:
-- LLOYD | Privé/Affaires | STANDARD | NULL | true
-- LLOYD | Privé/Affaires | TOUS_RISQUES_0 | 10 | true
-- LLOYD | Privé/Affaires | DOMMAGES_COLLISIONS | 15 | true


-- ============================================
-- 7. VÉRIFICATION GARANTIES
-- ============================================
SELECT 
  code,
  name_fr,
  is_optional,
  is_active
FROM guarantees
WHERE is_active = true
ORDER BY is_optional, code;

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
  pr.min_capital,
  pr.fixed_premium,
  pr.is_active
FROM pricing_rules pr
JOIN companies c ON pr.company_id = c.id
JOIN guarantees g ON pr.guarantee_id = g.id
WHERE g.code = 'ASSURANCE_CONDUCTEUR'
  AND pr.is_active = true
ORDER BY c.name, pr.min_capital;

-- Résultat attendu:
-- LLOYD | ASSURANCE_CONDUCTEUR | 10000 | 10 | true
-- AL BARAKA | ASSURANCE_CONDUCTEUR | 10000 | 10 | true


-- ============================================
-- 9. VÉRIFICATION CONVENTIONS
-- ============================================
SELECT 
  o.name AS organization_name,
  c.name AS convention_name,
  c.code AS convention_code,
  c.status,
  COUNT(cr.id) AS reduction_count
FROM conventions c
JOIN organizations o ON c.organization_id = o.id
LEFT JOIN convention_reduction_rules cr ON c.id = cr.convention_id
WHERE c.status = 'ACTIVE'
GROUP BY o.name, c.name, c.code, c.status
ORDER BY o.name, c.name;

-- Vérifier que les conventions ont des réductions configurées


-- ============================================
-- 10. VÉRIFICATION SIMULATIONS RÉCENTES
-- ============================================
SELECT 
  id,
  formula_type,
  dc_capitals,
  ac_capitals,
  created_at
FROM simulations
ORDER BY created_at DESC
LIMIT 5;

-- Vérifier que ac_capitals est bien rempli pour les nouvelles simulations


-- ============================================
-- 11. VÉRIFICATION TABLES EXISTANTES
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

-- Vérifier que toutes les tables nécessaires existent


-- ============================================
-- RÉSUMÉ DES VÉRIFICATIONS
-- ============================================
/*
✅ À VÉRIFIER:
1. Migration ac_capitals appliquée
2. DC Config configuré pour toutes les compagnies
3. DC Capital Tiers configuré pour toutes les compagnies
4. Franchise Values configurées
5. BG Capital Limits configurées
6. Formula Eligibility configurée pour toutes les compagnies/usages
7. Garanties actives (AC, BG, Catastrophes, Incendie Émeutes)
8. Pricing Rules AC configurées
9. Conventions avec réductions
10. Simulations récentes avec ac_capitals
11. Toutes les tables nécessaires existent

⚠️ SI MANQUANT:
- Certaines configurations doivent être ajoutées via l'interface admin
- Vérifier les IDs des compagnies et garanties
- Adapter les valeurs selon les besoins métier
*/