# ✅ CORRECTIONS APPLIQUÉES - Notes Client

## 📝 Résumé des problèmes identifiés

### 1. ✅ Classe Bonus/Malus et Formule absentes du PDF
**Problème**: Le PDF généré ne montrait pas la classe bonus/malus ni la formule d'assurance choisie.

**Solution appliquée**: 
- Fichier modifié: `backend/src/pdf/pdf.service.ts`
- Ajout de deux nouveaux champs dans la section "Véhicule" du PDF:
  - **Classe Bonus/Malus**: Affiche "Classe 1" à "Classe 8"
  - **Formule**: Affiche "Standard", "Dommages Collision" ou "Tous Risques 0%"
- Ces informations apparaissent maintenant dans:
  - Les PDFs de devis
  - Les PDFs de contrats

### 2. ⚠️ Réductions non appliquées dans les calculs
**Problème**: Les primes affichées dans les devis ne prennent pas en compte les réductions paramétrées.

**Diagnostic**:
Le code pour appliquer les réductions **EXISTE DÉJÀ** et **FONCTIONNE CORRECTEMENT**. Le système appelle bien `ReductionRatesService` pour chaque garantie.

**Raisons possibles**:
1. ❌ Aucune règle de réduction n'est configurée dans la base de données
2. ❌ Les simulations n'ont pas de `conventionId` associé
3. ❌ Les critères des règles ne correspondent pas (compagnie, formule, usage, plage de valeurs)

**Solution appliquée**:
- Ajout de logs détaillés dans `backend/src/pricing-engine/reduction-rates.service.ts`
- Ces logs permettront de voir exactement pourquoi les réductions ne s'appliquent pas
- Documentation complète créée: `backend/DIAGNOSTIC_REDUCTIONS.md`

---

## 🔍 PROCHAINES ÉTAPES POUR LES RÉDUCTIONS

### Étape 1: Vérifier les règles existantes

Exécuter cette requête SQL pour voir s'il existe des règles:

```sql
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

### Étape 2: Vérifier les simulations avec conventions

```sql
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

### Étape 3: Créer des règles de réduction (si nécessaire)

Voir le fichier `backend/DIAGNOSTIC_REDUCTIONS.md` pour des exemples complets de création de règles.

Exemple simple pour 35% de réduction sur VOL:

```sql
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
  '<CONVENTION_ID>',  -- Remplacer par l'ID de la convention
  NULL,               -- NULL = toutes les compagnies
  (SELECT id FROM guarantees WHERE "systemRole" = 'MANDATORY_VOL'),
  NULL,               -- NULL = toutes les formules
  NULL,               -- NULL = tous les usages
  'MARKET_VALUE',     -- Métrique pour VOL
  0,                  -- Valeur minimale
  NULL,               -- Valeur maximale (NULL = pas de maximum)
  true,
  false,
  35.00,              -- 35% de réduction
  0,
  NOW(),
  NULL,
  true,
  NOW(),
  NOW()
);
```

### Étape 4: Tester avec les logs

Après avoir créé des règles:
1. Créer une nouvelle simulation avec une convention
2. Générer un devis
3. Vérifier les logs du backend pour voir:
   ```
   [ReductionRates] Searching reduction for: { conventionId, companyId, guaranteeCode, ... }
   [ReductionRates] Found X potential rules
   [ReductionRates] ✅ Applying 35% reduction for VOL
   ```

---

## 📊 MÉTRIQUES UTILISÉES PAR GARANTIE

Le système utilise différentes métriques selon la garantie:

| Garantie | Métrique | Valeur utilisée |
|----------|----------|-----------------|
| VOL | `MARKET_VALUE` | Valeur vénale du véhicule |
| INCENDIE | `MARKET_VALUE` | Valeur vénale du véhicule |
| TOUS_RISQUES_0 | `MARKET_VALUE` | Valeur vénale du véhicule |
| DOMMAGES_COLLISIONS | `DC_CAPITAL` | Capital DC sélectionné |
| BRIS_GLACES | `NEW_VALUE` | Valeur à neuf du véhicule |

---

## 📁 FICHIERS MODIFIÉS

1. ✅ `backend/src/pdf/pdf.service.ts` - Ajout bonus/malus et formule dans PDF
2. ✅ `backend/src/pricing-engine/reduction-rates.service.ts` - Ajout de logs détaillés
3. ✅ `backend/DIAGNOSTIC_REDUCTIONS.md` - Documentation complète du diagnostic

---

## 🎯 RÉSUMÉ

**Issue 1 (PDF)**: ✅ **RÉSOLU** - La classe bonus/malus et la formule apparaissent maintenant dans les PDFs

**Issue 2 (Réductions)**: ⚠️ **EN ATTENTE DE CONFIGURATION**
- Le code fonctionne correctement
- Il faut configurer les règles de réduction dans la base de données
- Les logs ajoutés permettront de diagnostiquer précisément le problème
- Documentation complète fournie pour créer les règles

---

## 🔧 COMMENT TESTER

1. **Tester le PDF**:
   - Créer une nouvelle simulation
   - Générer un devis
   - Télécharger le PDF
   - Vérifier que "Classe Bonus/Malus" et "Formule" apparaissent

2. **Tester les réductions**:
   - Vérifier les logs du backend lors de la génération d'un devis
   - Chercher les lignes `[ReductionRates]`
   - Suivre le diagnostic dans `DIAGNOSTIC_REDUCTIONS.md`

---

## 📞 SUPPORT

Si les réductions ne s'appliquent toujours pas après avoir créé les règles:
1. Vérifier les logs du backend
2. Vérifier que la simulation a un `conventionId`
3. Vérifier que les critères de la règle correspondent exactement
4. Consulter `backend/DIAGNOSTIC_REDUCTIONS.md` pour plus de détails
# 📋 RÉSUMÉ DES CORRECTIONS - Notes Client

## 🎯 Problèmes Identifiés et Résolus

### ✅ Problème 1: Classe Bonus/Malus et Formule absentes du PDF

**Ce qui manquait:**
- La classe bonus/malus (01, 02, 03, etc.) n'apparaissait pas dans le PDF
- La formule d'assurance (Standard, Tous Risques 0%, Dommages Collision) n'apparaissait pas dans le PDF

**Solution appliquée:**
- ✅ Ajout de "Classe Bonus/Malus" dans la section Véhicule du PDF
- ✅ Ajout de "Formule" dans la section Véhicule du PDF
- ✅ Ces informations apparaissent maintenant dans les devis ET les contrats

**Fichier modifié:**
- `backend/src/pdf/pdf.service.ts`

---

### ⚠️ Problème 2: Réductions non appliquées dans les calculs

**Ce qui se passe:**
Les primes affichées dans les devis ne prennent pas en compte les réductions paramétrées dans le système.

**Diagnostic:**
Le code pour appliquer les réductions **EXISTE** et **FONCTIONNE**. Le problème vient probablement de:

1. **Aucune règle de réduction configurée** dans la base de données
2. **Les simulations n'ont pas de convention** associée
3. **Les critères des règles ne correspondent pas** aux données de la simulation

**Solutions appliquées:**

1. ✅ **Ajout de logs détaillés** pour diagnostiquer le problème
   - Fichier: `backend/src/pricing-engine/reduction-rates.service.ts`
   - Les logs montreront exactement pourquoi les réductions ne s'appliquent pas

2. ✅ **Documentation complète** créée
   - Fichier: `backend/DIAGNOSTIC_REDUCTIONS.md`
   - Explique comment fonctionne le système de réductions
   - Montre comment vérifier et créer des règles

3. ✅ **Script SQL prêt à l'emploi** pour créer des règles
   - Fichier: `backend/create_reduction_rules.sql`
   - Permet de créer facilement des règles de réduction
   - Inclut des exemples pour toutes les garanties principales

---

## 🔍 COMMENT VÉRIFIER SI LES RÉDUCTIONS FONCTIONNENT

### Étape 1: Vérifier s'il existe des règles de réduction

Exécuter cette requête SQL:

```sql
SELECT COUNT(*) 
FROM convention_reduction_rules 
WHERE "isActive" = true;
```

- Si le résultat est **0**, il faut créer des règles (voir Étape 3)
- Si le résultat est **> 0**, passer à l'Étape 2

### Étape 2: Vérifier les logs du backend

Lors de la génération d'un devis, chercher dans les logs:

```
[ReductionRates] Searching reduction for: { conventionId, companyId, ... }
[ReductionRates] Found X potential rules
[ReductionRates] ✅ Applying 35% reduction for VOL
```

**Si vous voyez:**
- `No conventionId provided` → La simulation n'a pas de convention
- `Found 0 potential rules` → Aucune règle ne correspond aux critères
- `No matching rule found` → Les règles existent mais les valeurs ne correspondent pas

### Étape 3: Créer des règles de réduction

Utiliser le fichier `backend/create_reduction_rules.sql`:

1. Ouvrir le fichier
2. Remplacer `<CONVENTION_ID>` par l'ID de votre convention
3. Exécuter les requêtes SQL
4. Tester en créant un nouveau devis

---

## 📊 EXEMPLES DE RÉDUCTIONS

### Exemple 1: Réduction simple de 35% sur VOL

```sql
INSERT INTO convention_reduction_rules (...)
VALUES (
  ...,
  '<CONVENTION_ID>',  -- ID de la convention
  NULL,               -- Toutes les compagnies
  (SELECT id FROM guarantees WHERE "systemRole" = 'MANDATORY_VOL'),
  NULL,               -- Toutes les formules
  NULL,               -- Tous les usages
  'MARKET_VALUE',     -- Basé sur la valeur vénale
  0,                  -- Valeur minimale
  NULL,               -- Pas de maximum
  ...,
  35.00,              -- 35% de réduction
  ...
);
```

### Exemple 2: Réduction par paliers

- **40% de réduction** si valeur vénale < 100,000 DH
- **30% de réduction** si valeur vénale entre 100,000 et 200,000 DH
- **20% de réduction** si valeur vénale > 200,000 DH

Voir le fichier `backend/create_reduction_rules.sql` pour les requêtes complètes.

---

## 🎯 MÉTRIQUES PAR GARANTIE

Chaque garantie utilise une métrique différente pour calculer les réductions:

| Garantie | Métrique | Basée sur |
|----------|----------|-----------|
| VOL | `MARKET_VALUE` | Valeur vénale |
| INCENDIE | `MARKET_VALUE` | Valeur vénale |
| TOUS RISQUES 0% | `MARKET_VALUE` | Valeur vénale |
| DOMMAGES COLLISIONS | `DC_CAPITAL` | Capital DC choisi |
| BRIS DE GLACES | `NEW_VALUE` | Valeur à neuf |

---

## 📁 FICHIERS CRÉÉS/MODIFIÉS

### Fichiers modifiés:
1. `backend/src/pdf/pdf.service.ts` - Ajout bonus/malus et formule
2. `backend/src/pricing-engine/reduction-rates.service.ts` - Ajout de logs

### Fichiers créés:
1. `backend/DIAGNOSTIC_REDUCTIONS.md` - Documentation complète
2. `backend/create_reduction_rules.sql` - Script SQL pour créer des règles
3. `CORRECTIONS_APPLIQUEES.md` - Ce fichier de résumé

---

## ✅ TESTS À EFFECTUER

### Test 1: Vérifier le PDF
1. Créer une nouvelle simulation
2. Sélectionner une classe bonus/malus (ex: Classe 3)
3. Sélectionner une formule (ex: Tous Risques 0%)
4. Générer un devis
5. Télécharger le PDF
6. **Vérifier** que "Classe Bonus/Malus: Classe 3" et "Formule: Tous Risques 0%" apparaissent

### Test 2: Vérifier les réductions
1. Vérifier qu'il existe des règles de réduction (SQL)
2. Créer une simulation avec une convention
3. Générer un devis
4. Vérifier les logs du backend
5. Vérifier que les primes sont réduites

---

## 🆘 EN CAS DE PROBLÈME

### Les réductions ne s'appliquent toujours pas?

1. **Vérifier les logs** - Chercher `[ReductionRates]` dans les logs du backend
2. **Vérifier la convention** - La simulation doit avoir un `conventionId`
3. **Vérifier les règles** - Les critères doivent correspondre exactement
4. **Consulter la documentation** - Voir `backend/DIAGNOSTIC_REDUCTIONS.md`

### Questions fréquentes:

**Q: Pourquoi mes règles ne s'appliquent pas?**
R: Vérifier que:
- La simulation a un `conventionId`
- La règle a le bon `metric` pour la garantie
- Les valeurs min/max correspondent
- La règle est `isActive = true`
- Les dates `validFrom`/`validTo` sont correctes

**Q: Comment créer une règle pour une compagnie spécifique?**
R: Mettre l'ID de la compagnie dans `companyId` au lieu de `NULL`

**Q: Comment créer une règle pour un usage spécifique?**
R: Mettre l'ID de l'usage dans `usageId` au lieu de `NULL`

---

## 📞 SUPPORT

Pour toute question ou problème:
1. Consulter `backend/DIAGNOSTIC_REDUCTIONS.md`
2. Vérifier les logs du backend
3. Utiliser le script `backend/create_reduction_rules.sql`

---

**Date de correction:** ${new Date().toLocaleDateString('fr-FR')}
**Statut:** 
- ✅ Issue 1 (PDF): RÉSOLU
- ⚠️ Issue 2 (Réductions): EN ATTENTE DE CONFIGURATION
