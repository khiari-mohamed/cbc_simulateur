# Réponse Client - Vol/Incendie Réductions & DC Progressif

## 📋 Résumé Exécutif

**Verdict:** Vous avez raison de soulever ces points. Les fonctionnalités sont implémentées dans le code, mais il y avait des problèmes de configuration initiale.

---

## ✅ Corrections Apportées

### 1. Seed Complété pour DC Progressif

**Problème identifié:**
- Le seed créait la garantie DOMMAGES_COLLISIONS ✅
- Mais ne créait PAS les configurations `DcConfig` et `DcProgressiveTier` ❌
- Résultat: DC Progressif nécessitait configuration manuelle

**Solution appliquée:**
- Ajout dans `backend/prisma/seed.ts` de la création automatique de:
  - `DcConfig` pour PRIVATE_BUSINESS (franchise 5%, capital min 1000, max 80% VV, prime base 10)
  - `DcProgressiveTier` avec 5 tiers (6.7%, 6.3%, 5.8%, 5.5%, 5.0%)
  - `DcCapitalTier` avec pas de 1000 DT

**Maintenant avec `npm run prisma:seed`:**
- ✅ Garanties créées (VOL, INCENDIE, DOMMAGES_COLLISIONS)
- ✅ Tarifs standards créés
- ✅ **DC Progressif configuré automatiquement**

---

## 🎯 Fonctionnalités Confirmées

### 1️⃣ Vol et Incendie - Système de Réductions à 2 Niveaux

**Architecture implémentée:**

**Niveau 1: Gestion de Tarification (Tarifs Standards)**
```
Admin → Gestion de Tarification → Onglet "Garanties"
→ Compagnie: Lloyd
→ Usage: Privé/Affaires
→ VOL: 0.236% + 30 DT (sur Valeur Vénale)
→ INCENDIE: 0.275% + 30 DT (sur Valeur Vénale)
```

**Niveau 2: Convention (Réductions par Tranches)**
```
Admin → Conventions → [Convention] → Règles de Réduction
→ Bouton "+" pour ajouter une règle
```

**Exemple de configuration:**

**Tranche 1 (0 - 50,000 DT):**
- Garantie: VOL
- Métrique: Valeur Vénale (MARKET_VALUE)
- Min: 0 (Inclusif ✓)
- Max: 50000 (Exclusif)
- Réduction: 15%
- Priorité: 1

**Tranche 2 (50,001 - 100,000 DT):**
- Garantie: VOL
- Métrique: Valeur Vénale
- Min: 50000 (Exclusif)
- Max: 100000 (Inclusif ✓)
- Réduction: 20%
- Priorité: 2

**Tranche 3 (> 100,000 DT):**
- Garantie: VOL
- Métrique: Valeur Vénale
- Min: 100000 (Exclusif)
- Max: (vide = illimité)
- Réduction: 25%
- Priorité: 3

**Calcul appliqué:**
```
Prime = ((VV × taux) + prime_fixe) × (1 - réduction%)
```

---

### 2️⃣ Dommages Collision - Taux Progressif

**Calcul vérifié - Exactement comme votre exemple:**

```
Capital: 6,000 DT
VV: 40,000 DT
Ratio: 15% (6000/40000)

Tranche 1: 1ères 10% VV (4,000 DT) × 6.7% = 268 DT
Tranche 2: 2èmes 5% VV (2,000 DT) × 6.3% = 126 DT
Prime Variable = 394 DT
Prime de Base = 10 DT
Total = 404 DT ✅
```

**Configuration UI:**
```
Admin → Gestion de Tarification → Onglet "Dommages Collision"
→ Compagnie: Lloyd
→ Usage: Privé/Affaires
→ Méthode: Progressif

Paramètres Généraux (déjà configurés par seed):
- Franchise %: 5
- Capital Min: 1000
- Capital Max (% VV): 80
- Plafond Absolu: 100000
- Prime de Base: 10
- Taux Réduction: 0

Taux Progressifs (déjà configurés par seed):
- Tier 1 (0-10%): 6.7%
- Tier 2 (10-20%): 6.3%
- Tier 3 (20-30%): 5.8%
- Tier 4 (30-40%): 5.5%
- Tier 5 (40-50%): 5.0%
```

**Logique de calcul backend:**
- Chaque tranche = 10% de VV
- Calcul progressif avec taux dégressifs
- Formule: (prime_variable + prime_base) × (1 - réduction%)

---

## 📱 Guide d'Utilisation

### Prérequis: Initialiser la Base de Données

**Si DB vide:**
```bash
cd backend
npm run prisma:seed
```

**Données créées:**
- ✅ 2 compagnies (Lloyd, Amana)
- ✅ 14 garanties (RC, CAS, VOL, INCENDIE, PTA, ASSISTANCE, BG, TR, DC, etc.)
- ✅ 80 règles RC (8 classes × 5 CV × 2 compagnies)
- ✅ Tarifs standards pour toutes garanties
- ✅ **DC Progressif configuré pour PRIVATE_BUSINESS**
- ✅ DC Matrice configuré pour COMMERCIAL

---

### Cas d'Usage 1: Créer Réductions Vol/Incendie

**Étape 1: Créer une Convention**
```
Admin → Conventions → Nouvelle Convention
→ Nom: "Convention Courtier ABC"
→ Organisation: [Sélectionner]
→ Compagnies: Lloyd
→ Dates: 01/01/2026 - 31/12/2026
→ Sauvegarder
```

**Étape 2: Ajouter Réductions par Tranches**
```
Admin → Conventions → [Cliquer sur Convention]
→ Onglet "Règles de Réduction"
→ Bouton "+" pour chaque tranche
```

**Champs du formulaire:**
- **Compagnie:** (optionnel - vide = toutes)
- **Garantie:** VOL ou INCENDIE
- **Type de Formule:** (optionnel - vide = toutes)
- **Type d'Usage:** (optionnel - vide = tous)
- **Métrique:** MARKET_VALUE (Valeur Vénale) ou NEW_VALUE (Valeur à Neuf)
- **Valeur Min:** Montant minimum (ex: 0)
- **Min Inclusif:** ✓ ou ✗
- **Valeur Max:** Montant maximum (ex: 50000) ou vide pour illimité
- **Max Inclusif:** ✓ ou ✗
- **Réduction %:** Pourcentage (ex: 15)
- **Priorité:** Ordre d'application (1, 2, 3...)

---

### Cas d'Usage 2: Vérifier DC Progressif

**Vérification Configuration:**
```
Admin → Gestion de Tarification → Onglet "Dommages Collision"
→ Compagnie: Lloyd
→ Usage: Privé/Affaires
→ Méthode: Progressif

Vous devriez voir:
✅ Paramètres généraux configurés
✅ Paliers de capital (0-100000, pas 1000)
✅ Taux progressifs (5 tiers)
```

**Test Calcul:**
```
Devis → Nouveau Devis
→ Véhicule: VV = 40,000 DT
→ Formule: Dommages Collision
→ Usage: Privé/Affaires
→ Capital DC: 6,000 DT
→ Calculer

Résultat attendu:
- Prime DC: 404 DT
  - Prime Variable: 394 DT
  - Prime de Base: 10 DT
```

---

## 🔧 Détails Techniques

### Modèle de Données - Réductions Convention

```prisma
model ConventionReductionRule {
  conventionId    String
  companyId       String?          // Optionnel
  guaranteeId     String           // VOL, INCENDIE, etc.
  formulaType     FormulaType?     // Optionnel
  usageType       UsageType?       // Optionnel
  metric          ReductionMetric  // NEW_VALUE, MARKET_VALUE, etc.
  minValue        Decimal?
  maxValue        Decimal?
  minInclusive    Boolean
  maxInclusive    Boolean
  discountPercent Decimal
  priority        Int
}
```

### Modèle de Données - DC Progressif

```prisma
model DcConfig {
  companyId         String
  usageType         UsageType
  useMatrix         Boolean   // false = Progressif
  franchise         Decimal
  minCapital        Decimal
  maxCapitalPercent Decimal
  maxCapitalAbsolute Decimal
  basePremium       Decimal
  discountPercent   Decimal
}

model DcProgressiveTier {
  companyId  String
  usageType  UsageType
  tierNumber Int
  tierRate   Decimal
}
```

### Calcul Backend - Vol/Incendie

```typescript
// Calcul de base
let prime = vehicle.marketValue.mul(rule.ratePercentage).add(rule.fixedPremium);

// Application réduction convention
if (conventionId) {
  const discountPercent = await getReductionPercent(
    companyId,
    'VOL',
    conventionId,
    vehicle.marketValue,
    'MARKET_VALUE'
  );
  prime = applyDiscount(prime, discountPercent);
}
```

### Calcul Backend - DC Progressif

```typescript
// Calcul progressif par tranches de 10% VV
let capitalRemaining = capital; // 6000
const trancheSize = vv.mul(0.1); // 4000
let primeVariable = 0;

while (capitalRemaining > 0) {
  const tier = tiers[tierIndex];
  const amountInTier = min(capitalRemaining, trancheSize);
  primeVariable += amountInTier * tier.tierRate;
  capitalRemaining -= amountInTier;
  tierIndex++;
}

let prime = primeVariable + dcConfig.basePremium;
```

---

## ✅ Conclusion

**Les 2 fonctionnalités sont maintenant complètement opérationnelles:**

1. ✅ **Vol/Incendie - Réductions Convention**
   - Architecture à 2 niveaux implémentée
   - Réductions par tranches de valeur
   - Filtrage par compagnie/garantie/formule/usage
   - Priorité d'application

2. ✅ **DC Progressif - Calcul par Tranches**
   - Calcul exact selon votre exemple
   - Configuration automatique par seed
   - Tranches de 10% VV avec taux dégressifs
   - Prime de base + prime variable

**Après `npm run prisma:seed`, tout est prêt à l'emploi !**

---

## 📞 Support

Si vous avez des questions ou besoin d'assistance pour configurer des cas spécifiques, n'hésitez pas à demander.
