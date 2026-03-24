# 🎯 Guide Complet : Système de Priorité des Conventions

## 📌 Table des Matières
1. [Qu'est-ce que la Priorité ?](#quest-ce-que-la-priorité)
2. [Quand la Priorité est-elle utilisée ?](#quand-la-priorité-est-elle-utilisée)
3. [Comment fonctionne le système ?](#comment-fonctionne-le-système)
4. [Exemples Concrets](#exemples-concrets)
5. [Bonnes Pratiques](#bonnes-pratiques)
6. [Cas d'Usage Réels](#cas-dusage-réels)

---

## Qu'est-ce que la Priorité ?

La **priorité** est un nombre entier qui détermine quelle règle de réduction sera appliquée lorsque **plusieurs règles correspondent** aux critères d'un devis.

### Règle Simple
```
Plus le nombre est élevé → Plus la règle est prioritaire
```

### Valeurs Recommandées
- **0-5** : Règles générales (s'appliquent largement)
- **5-15** : Règles spécifiques (tranches précises, conditions multiples)
- **15+** : Règles exceptionnelles (cas VIP, promotions spéciales)

---

## Quand la Priorité est-elle utilisée ?

### ✅ Cas 1 : Une seule règle correspond
**→ La priorité n'a AUCUN impact**

Le système applique automatiquement la seule règle qui correspond.

**Exemple :**
```
Client : Lloyd, VOL, Standard, Privé/Affaires, VV = 30,000 DT

Règle A : Lloyd, VOL, Standard, Privé/Affaires, VV: 0-50,000 DT → 15% (Priorité: 5)

✅ Résultat : 15% de réduction (seule règle correspondante)
```

---

### ⚠️ Cas 2 : Plusieurs règles correspondent
**→ Le système choisit la règle avec la priorité la plus élevée**

**Exemple :**
```
Client : Lloyd, VOL, Standard, Privé/Affaires, VV = 75,000 DT

Règle A : Lloyd, VOL, Standard, Privé/Affaires, VV: 0-100,000 DT → 15% (Priorité: 1)
Règle B : Lloyd, VOL, Standard, Privé/Affaires, VV: 50,000-100,000 DT → 20% (Priorité: 5)
Règle C : Lloyd, VOL, Standard, Privé/Affaires, VV: 70,000-80,000 DT → 25% (Priorité: 10)

✅ Résultat : 25% de réduction (Règle C a la priorité la plus élevée)
```

---

## Comment fonctionne le système ?

### Algorithme de Sélection

```
1. Le système trouve TOUTES les règles qui correspondent aux critères du devis
   ↓
2. Si une seule règle correspond → Appliquer cette règle
   ↓
3. Si plusieurs règles correspondent → Trier par priorité (décroissant)
   ↓
4. Appliquer la règle avec la priorité la plus élevée
   ↓
5. Si plusieurs règles ont la même priorité → Choisir la plus récente (createdAt)
```

### Critères de Correspondance

Une règle correspond si **TOUS** les critères suivants sont vrais :

| Critère | Condition |
|---------|-----------|
| **Convention** | Règle appartient à la convention du client |
| **Compagnie** | Règle.companyId = null OU Règle.companyId = Devis.companyId |
| **Garantie** | Règle.guaranteeId = Devis.guaranteeId |
| **Formule** | Règle.formulaType = null OU Règle.formulaType = Devis.formulaType |
| **Usage** | Règle.usageId = null OU Règle.usageId = Devis.usageId |
| **Tranche** | Valeur du devis est dans [minValue, maxValue] |
| **Date** | Date actuelle entre validFrom et validTo |
| **Statut** | Règle.isActive = true |

---

## Exemples Concrets

### Exemple 1 : Réductions par Tranches de Valeur

**Objectif :** Réduction progressive selon la valeur du véhicule

**Configuration :**

| Règle | Tranche VV | Réduction | Priorité |
|-------|------------|-----------|----------|
| A | 0 - 50,000 DT | 10% | 1 |
| B | 50,001 - 100,000 DT | 15% | 2 |
| C | 100,001 - 200,000 DT | 20% | 3 |
| D | > 200,000 DT | 25% | 4 |

**Résultats :**
- VV = 30,000 DT → Règle A (10%) ✅
- VV = 75,000 DT → Règle B (15%) ✅
- VV = 150,000 DT → Règle C (20%) ✅
- VV = 250,000 DT → Règle D (25%) ✅

**Pourquoi ça marche ?**
- Chaque tranche est exclusive (pas de chevauchement)
- Une seule règle correspond à chaque fois
- La priorité n'a pas d'impact ici (mais c'est une bonne pratique de l'incrémenter)

---

### Exemple 2 : Réduction Générale + Réduction Spécifique

**Objectif :** Réduction de base pour tous + bonus pour une tranche spécifique

**Configuration :**

| Règle | Tranche VV | Réduction | Priorité | Description |
|-------|------------|-----------|----------|-------------|
| A | Toutes valeurs | 10% | 0 | Réduction de base |
| B | 80,000 - 120,000 DT | 25% | 10 | Bonus pour tranche moyenne |

**Résultats :**
- VV = 30,000 DT → Règle A (10%) ✅ (seule règle)
- VV = 100,000 DT → Règle B (25%) ✅ (priorité 10 > priorité 0)
- VV = 200,000 DT → Règle A (10%) ✅ (seule règle)

**Pourquoi ça marche ?**
- Règle A s'applique partout (priorité basse = 0)
- Règle B est plus spécifique (priorité haute = 10)
- Quand les deux correspondent, B gagne grâce à sa priorité

---

### Exemple 3 : Réduction par Formule avec Override

**Objectif :** Réduction différente selon la formule + exception pour VIP

**Configuration :**

| Règle | Formule | Tranche VV | Réduction | Priorité | Description |
|-------|---------|------------|-----------|----------|-------------|
| A | Standard | Toutes | 10% | 1 | Base Standard |
| B | TR 0% | Toutes | 15% | 1 | Base TR 0% |
| C | Standard | > 150,000 DT | 30% | 20 | VIP Standard |
| D | TR 0% | > 150,000 DT | 35% | 20 | VIP TR 0% |

**Résultats :**
- Standard, VV = 50,000 DT → Règle A (10%) ✅
- TR 0%, VV = 50,000 DT → Règle B (15%) ✅
- Standard, VV = 200,000 DT → Règle C (30%) ✅ (priorité 20 > priorité 1)
- TR 0%, VV = 200,000 DT → Règle D (35%) ✅ (priorité 20 > priorité 1)

**Pourquoi ça marche ?**
- Règles A et B couvrent tous les cas (priorité basse)
- Règles C et D sont des exceptions VIP (priorité haute)
- Les règles VIP gagnent toujours grâce à leur priorité

---

### Exemple 4 : Réduction par Usage avec Cumul

**Objectif :** Réduction de base + bonus pour usage Commercial

**Configuration :**

| Règle | Usage | Tranche VV | Réduction | Priorité | Description |
|-------|-------|------------|-----------|----------|-------------|
| A | Tous | Toutes | 10% | 0 | Base pour tous |
| B | Commercial | Toutes | 20% | 5 | Bonus Commercial |
| C | Commercial | > 100,000 DT | 30% | 10 | Bonus Commercial VIP |

**Résultats :**
- Privé/Affaires, VV = 50,000 DT → Règle A (10%) ✅
- Commercial, VV = 50,000 DT → Règle B (20%) ✅ (priorité 5 > priorité 0)
- Commercial, VV = 150,000 DT → Règle C (30%) ✅ (priorité 10 > priorité 5)

**Pourquoi ça marche ?**
- Règle A = filet de sécurité (priorité 0)
- Règle B = bonus Commercial (priorité 5)
- Règle C = bonus Commercial VIP (priorité 10)
- Chaque niveau a une priorité plus élevée

---

## Bonnes Pratiques

### ✅ DO : Bonnes Pratiques

#### 1. Utilisez des priorités espacées
```
❌ Mauvais : Priorité 1, 2, 3, 4, 5
✅ Bon : Priorité 0, 5, 10, 15, 20
```
**Pourquoi ?** Permet d'insérer facilement de nouvelles règles entre deux existantes.

---

#### 2. Règles générales = Priorité basse
```
✅ Règle : Toutes compagnies, toutes formules, toutes valeurs → Priorité 0
```
**Pourquoi ?** Sert de filet de sécurité, sera toujours écrasée par des règles plus spécifiques.

---

#### 3. Règles spécifiques = Priorité moyenne
```
✅ Règle : Lloyd, VOL, Standard, VV: 50,000-100,000 DT → Priorité 10
```
**Pourquoi ?** Cible précise, doit avoir la priorité sur les règles générales.

---

#### 4. Règles exceptionnelles = Priorité haute
```
✅ Règle : Client VIP, toutes garanties, toutes valeurs → Priorité 20
```
**Pourquoi ?** Doit toujours gagner, même face à des règles spécifiques.

---

#### 5. Évitez les priorités identiques
```
❌ Mauvais : Règle A (Priorité 5) + Règle B (Priorité 5)
✅ Bon : Règle A (Priorité 5) + Règle B (Priorité 6)
```
**Pourquoi ?** Si deux règles ont la même priorité, le système choisit la plus récente (comportement imprévisible).

---

#### 6. Documentez vos priorités
```
✅ Créez un tableau de référence :
- 0-5 : Réductions de base
- 5-10 : Réductions par tranche
- 10-15 : Réductions par formule/usage
- 15-20 : Réductions VIP
- 20+ : Promotions exceptionnelles
```

---

### ❌ DON'T : Erreurs à Éviter

#### 1. Ne pas tester les chevauchements
```
❌ Règle A : VV: 0-100,000 DT → 10% (Priorité 1)
❌ Règle B : VV: 50,000-150,000 DT → 15% (Priorité 1)
```
**Problème :** Pour VV = 75,000 DT, les deux règles correspondent avec la même priorité → Comportement imprévisible.

**Solution :**
```
✅ Règle A : VV: 0-100,000 DT → 10% (Priorité 1)
✅ Règle B : VV: 50,000-150,000 DT → 15% (Priorité 5)
```

---

#### 2. Oublier la règle générale
```
❌ Règle A : VV: 0-50,000 DT → 10%
❌ Règle B : VV: 100,000-200,000 DT → 20%
```
**Problème :** Pour VV = 75,000 DT, aucune règle ne correspond → Pas de réduction.

**Solution :**
```
✅ Règle 0 : Toutes valeurs → 5% (Priorité 0) [Filet de sécurité]
✅ Règle A : VV: 0-50,000 DT → 10% (Priorité 5)
✅ Règle B : VV: 100,000-200,000 DT → 20% (Priorité 5)
```

---

#### 3. Priorités inversées
```
❌ Règle A : Toutes valeurs → 20% (Priorité 10)
❌ Règle B : VV: 100,000-200,000 DT → 30% (Priorité 5)
```
**Problème :** Règle A gagne toujours (priorité plus élevée), Règle B ne sera jamais appliquée.

**Solution :**
```
✅ Règle A : Toutes valeurs → 20% (Priorité 0)
✅ Règle B : VV: 100,000-200,000 DT → 30% (Priorité 10)
```

---

## Cas d'Usage Réels

### Cas 1 : Banque avec Réduction Progressive

**Contexte :** ATB Bank veut offrir des réductions croissantes selon la valeur du véhicule.

**Configuration :**

```
Convention : ATB Bank 2024
Compagnie : Lloyd Tunisien

Règle 1 : VOL, VV: 0-50,000 DT → 10% (Priorité: 1)
Règle 2 : VOL, VV: 50,001-100,000 DT → 15% (Priorité: 2)
Règle 3 : VOL, VV: 100,001-200,000 DT → 20% (Priorité: 3)
Règle 4 : VOL, VV: > 200,000 DT → 25% (Priorité: 4)

Règle 5 : INCENDIE, VV: 0-50,000 DT → 8% (Priorité: 1)
Règle 6 : INCENDIE, VV: 50,001-100,000 DT → 12% (Priorité: 2)
Règle 7 : INCENDIE, VV: 100,001-200,000 DT → 16% (Priorité: 3)
Règle 8 : INCENDIE, VV: > 200,000 DT → 20% (Priorité: 4)
```

**Résultat :**
- Employé avec VV = 40,000 DT → VOL: 10%, INCENDIE: 8%
- Employé avec VV = 80,000 DT → VOL: 15%, INCENDIE: 12%
- Cadre avec VV = 150,000 DT → VOL: 20%, INCENDIE: 16%
- Directeur avec VV = 300,000 DT → VOL: 25%, INCENDIE: 20%

---

### Cas 2 : Entreprise avec Flotte Commerciale

**Contexte :** Société de transport veut des réductions spéciales pour usage Commercial.

**Configuration :**

```
Convention : TransTunisia 2024
Compagnie : Toutes

Règle 1 : VOL, Tous usages, Toutes valeurs → 5% (Priorité: 0) [Base]
Règle 2 : VOL, Commercial, Toutes valeurs → 15% (Priorité: 5) [Bonus Commercial]
Règle 3 : VOL, Commercial, VV: > 100,000 DT → 25% (Priorité: 10) [Bonus Gros Véhicules]

Règle 4 : INCENDIE, Tous usages, Toutes valeurs → 5% (Priorité: 0) [Base]
Règle 5 : INCENDIE, Commercial, Toutes valeurs → 12% (Priorité: 5) [Bonus Commercial]
Règle 6 : INCENDIE, Commercial, VV: > 100,000 DT → 20% (Priorité: 10) [Bonus Gros Véhicules]
```

**Résultat :**
- Véhicule Privé, VV = 50,000 DT → VOL: 5%, INCENDIE: 5%
- Véhicule Commercial, VV = 50,000 DT → VOL: 15%, INCENDIE: 12%
- Véhicule Commercial, VV = 150,000 DT → VOL: 25%, INCENDIE: 20%

---

### Cas 3 : Promotion Temporaire VIP

**Contexte :** Offre spéciale pour clients VIP pendant 3 mois.

**Configuration :**

```
Convention : VIP Q1 2024
Compagnie : Toutes
Date : 01/01/2024 - 31/03/2024

Règle 1 : VOL, Toutes formules, Toutes valeurs → 10% (Priorité: 0) [Base]
Règle 2 : VOL, TR 0%, Toutes valeurs → 15% (Priorité: 5) [Bonus TR 0%]
Règle 3 : VOL, Toutes formules, Toutes valeurs → 30% (Priorité: 20) [Promo VIP]

Règle 4 : INCENDIE, Toutes formules, Toutes valeurs → 8% (Priorité: 0) [Base]
Règle 5 : INCENDIE, TR 0%, Toutes valeurs → 12% (Priorité: 5) [Bonus TR 0%]
Règle 6 : INCENDIE, Toutes formules, Toutes valeurs → 25% (Priorité: 20) [Promo VIP]
```

**Résultat :**
- Pendant la promo (01/01 - 31/03) : Tous les clients VIP → VOL: 30%, INCENDIE: 25%
- Après la promo (> 31/03) : Règles 3 et 6 expirées → Retour aux règles normales

---

## 📊 Tableau Récapitulatif

| Priorité | Type de Règle | Exemple | Quand l'utiliser |
|----------|---------------|---------|------------------|
| **0** | Filet de sécurité | Toutes valeurs → 5% | Garantir une réduction minimale |
| **1-5** | Règle générale | Toutes formules → 10% | Réduction de base pour tous |
| **5-10** | Règle par tranche | VV: 50k-100k → 15% | Réductions progressives |
| **10-15** | Règle spécifique | Lloyd + Standard + Commercial → 20% | Combinaison de critères |
| **15-20** | Règle VIP | Clients stratégiques → 30% | Cas exceptionnels |
| **20+** | Promotion | Offre limitée → 40% | Promotions temporaires |

---

## 🎓 Quiz de Validation

### Question 1
**Situation :** 3 règles correspondent avec les priorités suivantes : 5, 10, 15

**Quelle règle sera appliquée ?**
<details>
<summary>Voir la réponse</summary>

✅ **Réponse :** La règle avec priorité 15 (la plus élevée)
</details>

---

### Question 2
**Situation :** 2 règles correspondent avec la même priorité (10)

**Quelle règle sera appliquée ?**
<details>
<summary>Voir la réponse</summary>

✅ **Réponse :** La règle la plus récente (createdAt le plus récent)

⚠️ **Attention :** C'est un comportement imprévisible, évitez les priorités identiques !
</details>

---

### Question 3
**Situation :** Vous voulez une réduction de base (10%) pour tous + une réduction spéciale (25%) pour VV > 100,000 DT

**Quelles priorités utiliser ?**
<details>
<summary>Voir la réponse</summary>

✅ **Réponse :**
- Règle base : Priorité 0 (générale)
- Règle spéciale : Priorité 10 (spécifique)

La règle spéciale gagnera toujours quand elle correspond.
</details>

---

## 📞 Support

Si vous avez des questions sur le système de priorité :
1. Cliquez sur le bouton **"Guide Priorité"** dans l'interface
2. Consultez les exemples visuels dans le modal d'aide
3. Testez vos règles avec des devis réels
4. Contactez le support technique si nécessaire

---

## 🔄 Changelog

### Version 1.0 (Mars 2024)
- ✅ Système de priorité implémenté
- ✅ Interface d'aide interactive
- ✅ Documentation complète
- ✅ Exemples visuels dans l'UI
