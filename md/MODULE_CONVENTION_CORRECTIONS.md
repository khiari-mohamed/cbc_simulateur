# ✅ Module Convention - Corrections Complètes

## 🎯 Problème Identifié et Résolu

**Ce que le client demandait:**
> "Il serait préférable d'ajouter les règles de réduction au niveau de la convention et non au niveau de la garantie. Dans le module Convention, lorsque l'on sélectionne la compagnie, on appliquerait le taux de réduction **par formule**, par tranche de valeur et par garantie."

**Problème:**
- ✅ Les réductions étaient DÉJÀ au niveau Convention (correct)
- ❌ Mais l'UI ne permettait PAS de filtrer par **Type de Formule** et **Type d'Usage**
- ❌ Impossible de créer des réductions spécifiques à une formule (STANDARD, DC, TR 0%)
- ❌ Impossible de créer des réductions spécifiques à un usage (Privé/Affaires, Commercial, Taxi, Location)

**Solution appliquée:**
- ✅ Ajout du champ **Type de Formule** dans le formulaire
- ✅ Ajout du champ **Type d'Usage** dans le formulaire
- ✅ Affichage des badges pour visualiser les filtres appliqués
- ✅ Backend mis à jour pour supporter la modification de tous les champs

---

## 📱 Guide d'Utilisation Complet

### Architecture à 2 Niveaux (Comme Demandé)

#### **Niveau 1: Gestion de Tarification (Tarifs Standards)**

```
Admin → Gestion de Tarification → Onglet "Garanties"
```

**Configuration:**
- Sélectionner compagnie: Lloyd
- Sélectionner usage: Privé/Affaires
- Configurer VOL:
  - Taux: 0.236% (sur Valeur Vénale)
  - Prime fixe: 30 DT
  - Réduction: 0% (AUCUNE réduction ici)
- Configurer INCENDIE:
  - Taux: 0.275% (sur Valeur Vénale)
  - Prime fixe: 30 DT
  - Réduction: 0% (AUCUNE réduction ici)

**Important:** Les tarifs standards ne contiennent AUCUNE réduction. Ce sont les tarifs de base de la compagnie.

---

#### **Niveau 2: Convention (Réductions par Formule/Usage/Tranche)**

```
Admin → Conventions → [Sélectionner Convention] → Règles de Réduction → Bouton "+"
```

**Formulaire de Réduction (Tous les champs):**

1. **Compagnie** (optionnel)
   - Laissez vide = s'applique à toutes les compagnies de la convention
   - Sélectionnez une compagnie = s'applique uniquement à cette compagnie

2. **Garantie** (obligatoire)
   - VOL
   - INCENDIE
   - TOUS_RISQUES_ZERO
   - DOMMAGES_COLLISIONS
   - BG

3. **Type de Formule** (optionnel) ⭐ NOUVEAU
   - Laissez vide = s'applique à toutes les formules
   - Standard = uniquement pour formule Standard
   - Dommages Collision = uniquement pour formule DC
   - Tous Risques 0% = uniquement pour formule TR 0%

4. **Type d'Usage** (optionnel) ⭐ NOUVEAU
   - Laissez vide = s'applique à tous les usages
   - Privé/Affaires
   - Commercial
   - Taxi
   - Location

5. **Métrique** (obligatoire)
   - Valeur Vénale (MARKET_VALUE)
   - Valeur à Neuf (NEW_VALUE)
   - Capital DC (DC_CAPITAL)
   - Capital/VV % (CAPITAL_OVER_VV_PERCENT)

6. **Tranche de Valeur** (optionnel)
   - Valeur Min: ex: 0
   - Min Inclusif: ✓ (≥) ou ✗ (>)
   - Valeur Max: ex: 50000
   - Max Inclusif: ✓ (≤) ou ✗ (<)

7. **Pourcentage de Réduction** (obligatoire)
   - Ex: 15 (pour 15%)

8. **Priorité** (optionnel)
   - Plus élevé = prioritaire
   - Ex: 1, 2, 3...

---

## 🎯 Exemples Concrets

### Exemple 1: Réduction VOL par Formule

**Objectif:** Réduction de 20% sur VOL uniquement pour la formule Tous Risques 0%

**Configuration:**
```
Compagnie: (vide = toutes)
Garantie: VOL
Type de Formule: Tous Risques 0%
Type d'Usage: (vide = tous)
Métrique: Valeur Vénale
Tranche: (vide = toutes valeurs)
Réduction: 20%
Priorité: 1
```

**Résultat:**
- Client avec formule TR 0% → Réduction 20% sur VOL ✅
- Client avec formule Standard → Pas de réduction ❌
- Client avec formule DC → Pas de réduction ❌

---

### Exemple 2: Réduction INCENDIE par Usage

**Objectif:** Réduction de 10% sur INCENDIE uniquement pour usage Commercial

**Configuration:**
```
Compagnie: (vide = toutes)
Garantie: INCENDIE
Type de Formule: (vide = toutes)
Type d'Usage: Commercial
Métrique: Valeur Vénale
Tranche: (vide = toutes valeurs)
Réduction: 10%
Priorité: 1
```

**Résultat:**
- Client Commercial → Réduction 10% sur INCENDIE ✅
- Client Privé/Affaires → Pas de réduction ❌
- Client Taxi → Pas de réduction ❌

---

### Exemple 3: Réduction VOL par Formule + Usage + Tranche

**Objectif:** Réduction progressive sur VOL pour formule Standard, usage Privé/Affaires, par tranches de valeur

**Tranche 1 (0 - 50,000 DT):**
```
Compagnie: Lloyd
Garantie: VOL
Type de Formule: Standard
Type d'Usage: Privé/Affaires
Métrique: Valeur Vénale
Min: 0 (Inclusif ✓)
Max: 50000 (Exclusif)
Réduction: 15%
Priorité: 1
```

**Tranche 2 (50,001 - 100,000 DT):**
```
Compagnie: Lloyd
Garantie: VOL
Type de Formule: Standard
Type d'Usage: Privé/Affaires
Métrique: Valeur Vénale
Min: 50000 (Exclusif)
Max: 100000 (Inclusif ✓)
Réduction: 20%
Priorité: 2
```

**Tranche 3 (> 100,000 DT):**
```
Compagnie: Lloyd
Garantie: VOL
Type de Formule: Standard
Type d'Usage: Privé/Affaires
Métrique: Valeur Vénale
Min: 100000 (Exclusif)
Max: (vide = illimité)
Réduction: 25%
Priorité: 3
```

**Résultat:**
- Lloyd, Standard, Privé/Affaires, VV = 30,000 DT → Réduction 15% ✅
- Lloyd, Standard, Privé/Affaires, VV = 75,000 DT → Réduction 20% ✅
- Lloyd, Standard, Privé/Affaires, VV = 150,000 DT → Réduction 25% ✅
- Lloyd, TR 0%, Privé/Affaires, VV = 30,000 DT → Pas de réduction (formule différente) ❌
- Lloyd, Standard, Commercial, VV = 30,000 DT → Pas de réduction (usage différent) ❌
- Amana, Standard, Privé/Affaires, VV = 30,000 DT → Pas de réduction (compagnie différente) ❌

---

## 🎨 Affichage UI

**Liste des Règles:**

Chaque règle affiche maintenant des badges colorés:
- 🟢 **Réduction %** (vert) - Ex: "15% de réduction"
- 🔵 **Compagnie** (bleu) - Ex: "Lloyd Tunisien"
- 🟣 **Formule** (violet) - Ex: "Standard", "DC", "TR 0%"
- 🟠 **Usage** (orange) - Ex: "Privé/Affaires", "Commercial", "Taxi", "Location"

**Détails de la Règle:**
- Métrique: Valeur Vénale
- Tranche: ≥ 0 - < 50000
- Priorité: 1

---

## 🔧 Modifications Techniques

### Frontend

**Fichier:** `frontend/src/pages/admin/reduction-rules/ConventionReductionRulesPage.tsx`

**Ajouts:**
1. Champ `formulaType` dans le state
2. Champ `usageType` dans le state
3. Select "Type de Formule" dans le formulaire
4. Select "Type d'Usage" dans le formulaire
5. Badges d'affichage pour formulaType et usageType
6. Affichage amélioré des tranches de valeur

### Backend

**Fichier:** `backend/src/convention-reduction-rules/convention-reduction-rules.controller.ts`

**Modifications:**
- Méthode `update` accepte maintenant `formulaType` et `usageType`

**Fichier:** `backend/src/convention-reduction-rules/convention-reduction-rules.service.ts`

**Modifications:**
- Méthode `update` permet la modification de tous les champs
- Validation de `companyId` et `guaranteeId` lors de la modification
- Support complet de `formulaType` et `usageType`

---

## ✅ Validation

### Test 1: Réduction par Formule

**Étapes:**
1. Créer une convention
2. Ajouter règle: VOL, Formule = TR 0%, Réduction = 20%
3. Créer devis avec formule TR 0%
4. Vérifier que VOL a 20% de réduction ✅
5. Créer devis avec formule Standard
6. Vérifier que VOL n'a PAS de réduction ✅

### Test 2: Réduction par Usage

**Étapes:**
1. Créer une convention
2. Ajouter règle: INCENDIE, Usage = Commercial, Réduction = 10%
3. Créer devis avec usage Commercial
4. Vérifier que INCENDIE a 10% de réduction ✅
5. Créer devis avec usage Privé/Affaires
6. Vérifier que INCENDIE n'a PAS de réduction ✅

### Test 3: Réduction par Formule + Usage + Tranche

**Étapes:**
1. Créer 3 règles comme dans l'Exemple 3 ci-dessus
2. Créer devis: Lloyd, Standard, Privé/Affaires, VV = 30,000 DT
3. Vérifier réduction 15% ✅
4. Créer devis: Lloyd, Standard, Privé/Affaires, VV = 75,000 DT
5. Vérifier réduction 20% ✅
6. Créer devis: Lloyd, TR 0%, Privé/Affaires, VV = 30,000 DT
7. Vérifier AUCUNE réduction (formule différente) ✅

---

## 📋 Récapitulatif

**Ce qui a été corrigé:**
- ✅ Ajout du champ "Type de Formule" dans l'UI
- ✅ Ajout du champ "Type d'Usage" dans l'UI
- ✅ Backend mis à jour pour supporter la modification complète
- ✅ Affichage amélioré avec badges colorés
- ✅ Affichage optimisé des tranches de valeur

**Ce qui était déjà correct:**
- ✅ Réductions au niveau Convention (pas au niveau Garantie)
- ✅ Backend supportait déjà formulaType et usageType
- ✅ Calcul des réductions fonctionnait correctement
- ✅ Système de priorité fonctionnait correctement

**Résultat:**
Le module Convention permet maintenant EXACTEMENT ce que le client demandait:
- ✅ Tarifs standards dans Gestion de Tarification
- ✅ Réductions dans Convention
- ✅ Filtrage par compagnie
- ✅ Filtrage par garantie
- ✅ Filtrage par formule ⭐ NOUVEAU
- ✅ Filtrage par usage ⭐ NOUVEAU
- ✅ Filtrage par tranche de valeur
- ✅ Système de priorité

---

## 🎉 Conclusion

Le module Convention est maintenant **PARFAIT** et correspond **EXACTEMENT** à ce que le client a demandé !

Toutes les fonctionnalités sont opérationnelles et testables immédiatement après `npm run prisma:seed`.
