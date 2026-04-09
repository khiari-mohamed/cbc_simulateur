# 🔍 DIAGNOSTIC: Pourquoi les réductions ne s'appliquent pas

## ✅ Issue 1: RÉSOLU - Bonus/Malus et Formule dans le PDF
- **Fichier modifié**: `src/pdf/pdf.service.ts`
- **Changements**: Ajout de `Classe Bonus/Malus` et `Formule` dans les PDFs de devis et contrats

---

## 🔎 Issue 2: Réductions non appliquées - DIAGNOSTIC

### Le code de réduction EXISTE et FONCTIONNE
Le système appelle bien `ReductionRatesService.getReductionPercent()` pour chaque garantie.

### ⚠️ Raisons possibles pourquoi les réductions ne s'appliquent PAS:

#### 1. **Aucune règle de réduction configurée dans la base de données**
```sql
-- Vérifier s'il existe des règles de réduction
SELECT COUNT(*) FROM convention_reduction_rules WHERE "isActive" = true;

-- Voir les règles existantes
SELECT 
  crr.id,
  c.name as convention_name,
  comp.name as company_name,
  g.code as guarantee_code,
  crr."formulaType",
  crr.metric,
  crr."minValue",
  crr."maxValue",
  crr."discountPercent",
  crr."isActive"
FROM convention_reduction_rules crr
LEFT JOIN conventions c ON c.id = crr."conventionId"
LEFT JOIN companies comp ON comp.id = crr."companyId"
LEFT JOIN guarantees g ON g.id = crr."guaranteeId"
WHERE crr."isActive" = true;
```

#### 2. **La simulation n'a pas de conventionId**
```sql
-- Vérifier les simulations avec/sans convention
SELECT 
  s.id,
  s."userId",
  s."conventionId",
  c.name as convention_name,
  s."formulaType",
  s."usageId"
FROM simulations s
LEFT JOIN conventions c ON c.id = s."conventionId"
ORDER BY s."createdAt" DESC
LIMIT 10;
```

#### 3. **Les critères de la règle ne correspondent pas**
Les règles de réduction ont plusieurs critères qui doivent TOUS correspondre:
- `conventionId` - doit correspondre à la simulation
- `companyId` - doit correspondre à la compagnie du devis (ou NULL pour toutes)
- `guaranteeId` - doit correspondre à la garantie
- `formulaType` - doit correspondre à la formule (ou NULL pour toutes)
- `usageId` - doit correspondre à l'usage (ou NULL pour tous)
- `metric` - le type de métrique (NEW_VALUE, MARKET_VALUE, DC_CAPITAL)
- `minValue` / `maxValue` - la valeur doit être dans cette plage
- `validFrom` / `validTo` - la date actuelle doit être dans cette période
- `isActive` = true

#### 4. **La métrique utilisée ne correspond pas**
Le système utilise différentes métriques selon la garantie:
- VOL: `MARKET_VALUE` (valeur vénale)
- INCENDIE: `MARKET_VALUE` (valeur vénale)
- TOUS_RISQUES_0: `MARKET_VALUE` (valeur vénale)
- DOMMAGES_COLLISIONS: `DC_CAPITAL` (capital DC)
- BRIS_GLACES: `NEW_VALUE` (valeur à neuf)

### 📋 SOLUTION: Créer des règles de réduction

Exemple pour créer une règle de réduction de 35% sur VOL pour une convention:

```sql
-- 1. Trouver les IDs nécessaires
SELECT id, name FROM conventions WHERE "isActive" = true;
SELECT id, name FROM companies WHERE "isActive" = true;
SELECT id, code, "systemRole" FROM guarantees WHERE "systemRole" = 'MANDATORY_VOL';
SELECT id, code FROM usage_types WHERE "isActive" = true;

-- 2. Créer la règle de réduction
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
) VALUES (
  gen_random_uuid(),
  '<CONVENTION_ID>',  -- ID de la convention
  '<COMPANY_ID>',     -- ID de la compagnie (ou NULL pour toutes)
  '<GUARANTEE_ID>',   -- ID de la garantie VOL
  NULL,               -- NULL = toutes les formules, ou 'STANDARD', 'DOMMAGES_COLLISIONS', 'TOUS_RISQUES_0'
  '<USAGE_ID>',       -- ID de l'usage (ou NULL pour tous)
  'MARKET_VALUE',     -- Métrique pour VOL
  0,                  -- Valeur minimale (0 = pas de minimum)
  NULL,               -- Valeur maximale (NULL = pas de maximum)
  true,               -- minInclusive
  false,              -- maxInclusive
  35.00,              -- 35% de réduction
  0,                  -- Priorité (plus élevé = plus prioritaire)
  NOW(),              -- Date de début
  NULL,               -- Date de fin (NULL = pas de fin)
  true,               -- Actif
  NOW(),
  NOW()
);
```

### 🔧 VÉRIFICATION: Tester si les réductions s'appliquent

Après avoir créé des règles de réduction:

1. **Créer une nouvelle simulation** avec une convention qui a des règles
2. **Générer un devis** pour cette simulation
3. **Vérifier dans les logs** si les réductions sont appliquées:
   - Le backend devrait logger les appels à `getReductionPercent()`
   - Vérifier que `discountPercent > 0` est retourné

### 📊 EXEMPLE COMPLET: Règles pour toutes les garanties principales

```sql
-- Réduction de 35% sur VOL pour toutes les valeurs vénales
INSERT INTO convention_reduction_rules (
  id, "conventionId", "companyId", "guaranteeId", "formulaType", "usageId",
  metric, "minValue", "maxValue", "minInclusive", "maxInclusive",
  "discountPercent", priority, "validFrom", "isActive", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '<CONVENTION_ID>',
  NULL,  -- Toutes les compagnies
  g.id,
  NULL,  -- Toutes les formules
  NULL,  -- Tous les usages
  'MARKET_VALUE',
  0,
  NULL,
  true,
  false,
  35.00,
  0,
  NOW(),
  true,
  NOW(),
  NOW()
FROM guarantees g
WHERE g."systemRole" = 'MANDATORY_VOL';

-- Réduction de 30% sur INCENDIE
INSERT INTO convention_reduction_rules (
  id, "conventionId", "companyId", "guaranteeId", "formulaType", "usageId",
  metric, "minValue", "maxValue", "minInclusive", "maxInclusive",
  "discountPercent", priority, "validFrom", "isActive", "createdAt", "updatedAt"
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
  NULL,
  true,
  false,
  30.00,
  0,
  NOW(),
  true,
  NOW(),
  NOW()
FROM guarantees g
WHERE g."systemRole" = 'MANDATORY_INCENDIE';

-- Réduction de 25% sur TOUS_RISQUES_0
INSERT INTO convention_reduction_rules (
  id, "conventionId", "companyId", "guaranteeId", "formulaType", "usageId",
  metric, "minValue", "maxValue", "minInclusive", "maxInclusive",
  "discountPercent", priority, "validFrom", "isActive", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '<CONVENTION_ID>',
  NULL,
  g.id,
  'TOUS_RISQUES_0',  -- Seulement pour cette formule
  NULL,
  'MARKET_VALUE',
  0,
  NULL,
  true,
  false,
  25.00,
  0,
  NOW(),
  true,
  NOW(),
  NOW()
FROM guarantees g
WHERE g."systemRole" = 'OPTIONAL_TOUS_RISQUES';

-- Réduction de 20% sur DOMMAGES_COLLISIONS
INSERT INTO convention_reduction_rules (
  id, "conventionId", "companyId", "guaranteeId", "formulaType", "usageId",
  metric, "minValue", "maxValue", "minInclusive", "maxInclusive",
  "discountPercent", priority, "validFrom", "isActive", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  '<CONVENTION_ID>',
  NULL,
  g.id,
  'DOMMAGES_COLLISIONS',
  NULL,
  'DC_CAPITAL',  -- Métrique différente pour DC
  0,
  NULL,
  true,
  false,
  20.00,
  0,
  NOW(),
  true,
  NOW(),
  NOW()
FROM guarantees g
WHERE g."systemRole" = 'OPTIONAL_DOMMAGES_COLLISIONS';
```

### 🎯 RÉSUMÉ

**Issue 1 (PDF)**: ✅ RÉSOLU - Bonus/Malus et Formule ajoutés au PDF

**Issue 2 (Réductions)**: ⚠️ Le code fonctionne, mais il faut:
1. Vérifier qu'il existe des règles de réduction dans la base de données
2. S'assurer que les simulations ont un `conventionId`
3. Vérifier que les critères des règles correspondent (compagnie, formule, usage, métrique, plage de valeurs)
4. Créer des règles de réduction si elles n'existent pas

Le système est prêt à appliquer les réductions, il suffit de configurer les règles dans la base de données.
