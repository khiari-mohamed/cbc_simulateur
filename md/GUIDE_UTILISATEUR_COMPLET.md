# Guide Utilisateur - Réponses aux Questions Client

## 📋 Table des Matières

1. [Fonction "Nettoyer la DB"](#1-fonction-nettoyer-la-db)
2. [Export Excel RC](#2-export-excel-rc)
3. [Filtrage par Usage](#3-filtrage-par-usage)
4. [Seed Minimal](#4-seed-minimal)
5. [Valeur de Référence](#5-valeur-de-référence)
6. [Franchise et Limites](#6-franchise-et-limites)
7. [Capital Assuré PTA/Conducteur](#7-capital-assuré-pta-conducteur)
8. [Système de Réductions](#8-système-de-réductions)
9. [Dommages Collision Progressif](#9-dommages-collision-progressif)
10. [Résolution Erreur CAS](#10-résolution-erreur-cas)
11. [Scripts de Diagnostic](#11-scripts-de-diagnostic)

---

## 1. Fonction "Nettoyer la DB"

### ⚠️ ATTENTION CRITIQUE

**La fonction "Nettoyer la DB" est un outil de DÉVELOPPEMENT uniquement.**

### Ce qu'elle fait
```
❌ Supprime TOUTES les données
❌ Efface l'historique complet
❌ Réinitialise le système
```

### Quand l'utiliser
- ✅ En développement pour tester
- ✅ Pour réinitialiser un environnement de test
- ❌ JAMAIS en production

### Impact sur les données
| Type de données | Impact |
|----------------|--------|
| Conventions validées | ❌ SUPPRIMÉES |
| Conventions en cours | ❌ SUPPRIMÉES |
| Devis | ❌ SUPPRIMÉS |
| Contrats | ❌ SUPPRIMÉS |
| Historique | ❌ SUPPRIMÉ |
| Utilisateurs | ❌ SUPPRIMÉS |

### Recommandation
**En production, cette fonction doit être DÉSACTIVÉE ou protégée par:**
1. Variable d'environnement `ALLOW_DB_WIPE=false`
2. Authentification super-admin
3. Confirmation multiple avec mot de passe

### Alternative recommandée
Créer une fonction "Archiver les anciennes données" qui:
- Déplace les données vers un historique
- Conserve les données importantes
- Permet la restauration si nécessaire

---

## 2. Export Excel RC

### ✅ Problème Résolu

Le problème d'export a été corrigé. Le fichier CSV généré est maintenant compatible avec Excel.

### Changements apportés
```typescript
// ✅ AVANT (problématique)
let csv = 'CLASSE,3-4 CV,5-6 CV,...\n';  // Virgules
const blob = new Blob([csv], { type: 'text/csv' });

// ✅ APRÈS (corrigé)
let csv = 'CLASSE;3-4 CV;5-6 CV;...\n';  // Points-virgules
const BOM = '\uFEFF';  // UTF-8 BOM pour Excel
const csvWithBOM = BOM + csv;
const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
```

### Comment utiliser
1. Sélectionnez une compagnie
2. Cliquez sur "Exporter"
3. Le fichier `RC_[Compagnie]_[Date].csv` est téléchargé
4. Ouvrez avec Excel → Le tableau est structuré correctement

### Format du fichier
```
CLASSE;3-4 CV;5-6 CV;7-10 CV;11-14 CV;≥15 CV
01;77000;98000;119000;154000;184800
02;88000;112000;136000;176000;211200
...
```

---

## 3. Filtrage par Usage

### ✅ Fonctionnalité Ajoutée

Un nouveau filtre "Usage" a été ajouté dans la page "Règles de tarification".

### Comment utiliser

1. Allez dans **Admin → Règles de tarification**
2. Vous verrez maintenant 4 filtres:
   - Compagnie
   - Garantie
   - **Usage** (NOUVEAU)
   - Classe Bonus-Malus

### Types d'usage disponibles
| Code | Libellé | Description |
|------|---------|-------------|
| `PRIVATE_BUSINESS` | Privé/Affaires | Usage personnel ou professionnel |
| `COMMERCIAL` | Commercial | Véhicules commerciaux |
| `TAXI` | Taxi | Taxis |
| `RENTAL` | Location | Véhicules de location |

### Exemple d'utilisation
Pour voir toutes les règles RC pour usage commercial:
1. Filtre Garantie: **RC**
2. Filtre Usage: **Commercial**
3. Résultat: Affiche uniquement les règles RC commerciales

---

## 4. Seed Minimal

### Clarification

Le "Seed Minimal" crée **UNIQUEMENT** le tableau RC.

### Ce qu'il fait
```bash
npm run seed:minimal
```

**Actions:**
1. ✅ Supprime les anciennes règles de tarification
2. ✅ Crée 40 règles RC par compagnie (8 classes × 5 CV)
3. ❌ NE crée PAS les garanties
4. ❌ NE crée PAS les compagnies
5. ❌ NE supprime PAS les autres garanties existantes

### Prérequis
Avant de lancer le seed minimal, vous devez avoir:
1. ✅ Au moins 1 compagnie créée
2. ✅ La garantie RC créée

### Pourquoi les autres garanties apparaissent?
**C'est NORMAL** si elles ont été créées avant. Le seed minimal ne les supprime pas.

### Si vous voulez UNIQUEMENT RC
1. Supprimez manuellement les autres garanties via l'interface admin
2. OU utilisez le script de nettoyage complet

### Nombre de compagnies
**Vous pouvez créer autant de compagnies que nécessaire.**

Le seed créera les règles RC pour TOUTES les compagnies:
- 2 compagnies → 80 règles RC
- 5 compagnies → 200 règles RC
- 10 compagnies → 400 règles RC

---

## 5. Valeur de Référence

### ⚠️ Problème Identifié

Actuellement, la valeur de référence est **hardcodée** dans le code:
- VOL/INCENDIE → Toujours Valeur Vénale (VV)
- TOUS_RISQUES → Toujours Valeur à Neuf (VN)

### Solution en cours

Nous ajoutons un champ `referenceValue` dans les règles de tarification:

```typescript
enum ReferenceValue {
  NEW_VALUE      // Valeur à neuf
  MARKET_VALUE   // Valeur vénale
}
```

### Migration nécessaire
```sql
-- Ajouter le champ referenceValue
ALTER TABLE pricing_rules 
ADD COLUMN reference_value TEXT;

-- Mettre à jour les règles existantes
UPDATE pricing_rules 
SET reference_value = 'MARKET_VALUE' 
WHERE guarantee_id IN (SELECT id FROM guarantees WHERE code IN ('VOL', 'INCENDIE'));

UPDATE pricing_rules 
SET reference_value = 'NEW_VALUE' 
WHERE guarantee_id IN (SELECT id FROM guarantees WHERE code = 'TOUS_RISQUES_ZERO');
```

### Après la migration
Vous pourrez choisir la valeur de référence dans l'interface admin pour chaque règle.

---

## 6. Franchise et Limites

### Franchise Tous Risques

**✅ Existe déjà** dans le système.

#### Comment configurer
1. Allez dans **Admin → Règles de tarification**
2. Créez/Modifiez une règle TOUS_RISQUES_ZERO
3. Champ **Franchise Rate**: Entrez le pourcentage (ex: 0, 5, 10)

#### Valeurs courantes
- 0% → Tous Risques sans franchise
- 5% → Franchise de 5%
- 10% → Franchise de 10%

### Limite Bris de Glaces

**❌ À ajouter** - Actuellement non configurable.

#### Solution proposée
Ajouter un champ `bgLimit` dans les règles BG:

```typescript
// Dans PricingRule
bgLimit?: number;  // Limite maximale pour BG
```

#### Exemple d'utilisation
```
Règle BG:
- Taux: 0.08% (0.0008)
- Limite: 3000 DT

Calcul:
- VV = 50,000 DT
- Prime calculée = 50,000 × 0.0008 = 40 DT
- Capital = min(VV, bgLimit) = min(50,000, 3,000) = 3,000 DT
```

---

## 7. Capital Assuré PTA/Conducteur

### Personnes Transportées (PTA)

**✅ Existe déjà** - Le capital est configurable.

#### Comment configurer
1. Allez dans **Admin → Règles de tarification**
2. Créez une règle PERSONNES_TRANSPORTEES
3. Champ **Min Capital**: Capital assuré (ex: 5000, 10000, 20000)
4. Champ **Fixed Premium**: Prime correspondante

#### Exemple
```
Capital 5,000 DT  → Prime 20 DT
Capital 10,000 DT → Prime 30 DT
Capital 20,000 DT → Prime 50 DT
```

### Garantie Conducteur

**❌ N'existe pas encore** dans le système.

#### À créer
1. Créer la garantie "CONDUCTEUR" dans l'interface admin
2. Créer les règles de tarification avec capitaux:
   ```
   Capital 10,000 DT  → Prime X DT
   Capital 20,000 DT  → Prime Y DT
   Capital 50,000 DT  → Prime Z DT
   ```

---

## 8. Système de Réductions

### ✅ Déjà Implémenté!

Le système que vous demandez **existe déjà** dans l'application.

### Architecture à 2 niveaux

#### Niveau 1: Tarifs Standards (Gestion de tarification)
Dans **Admin → Règles de tarification**, vous définissez:
- Tarifs de base par compagnie
- Formules de calcul
- Base de calcul (VN ou VV)
- **SANS réductions**

#### Niveau 2: Réductions (Convention)
Dans **Admin → Conventions → Règles de réduction**, vous appliquez:
- Réductions par compagnie
- Réductions par garantie
- Réductions par formule
- Réductions par usage
- Réductions par tranche de valeur

### Exemple Concret

#### Étape 1: Définir les tarifs standards
```
Compagnie: AMANA
Garantie: VOL
Formule: VV × 0.25% + 10 DT
Réduction: 0% (tarif standard)
```

#### Étape 2: Créer une convention avec réductions
```
Convention: "ENTREPRISE_X"
Compagnie: AMANA

Règle 1:
- Garantie: VOL
- Métrique: Valeur Vénale
- Tranche: 0 - 50,000 DT
- Réduction: 10%

Règle 2:
- Garantie: VOL
- Métrique: Valeur Vénale
- Tranche: 50,000 - 100,000 DT
- Réduction: 15%

Règle 3:
- Garantie: INCENDIE
- Métrique: Valeur Vénale
- Tranche: 0 - 50,000 DT
- Réduction: 10%
```

### Comment créer une règle de réduction

1. Allez dans **Admin → Conventions**
2. Sélectionnez une convention
3. Cliquez sur **Règles de réduction**
4. Cliquez sur **Nouvelle règle**
5. Remplissez:
   - Compagnie (optionnel - si vide, s'applique à toutes)
   - Garantie
   - Formule (optionnel)
   - Usage (optionnel)
   - Métrique: NEW_VALUE, MARKET_VALUE, DC_CAPITAL, etc.
   - Valeur Min
   - Valeur Max
   - Pourcentage de réduction

### Métriques disponibles

| Métrique | Description | Exemple |
|----------|-------------|---------|
| `NEW_VALUE` | Valeur à neuf | Pour TR 0% |
| `MARKET_VALUE` | Valeur vénale | Pour VOL, INCENDIE |
| `DC_CAPITAL` | Capital DC | Pour Dommages Collision |
| `CAPITAL_OVER_VV_PERCENT` | % Capital/VV | Pour DC progressif |

---

## 9. Dommages Collision Progressif

### ✅ Déjà Implémenté!

Le calcul progressif que vous décrivez est **déjà dans le système**.

### Comment ça marche

#### Configuration des tiers progressifs
1. Allez dans **Admin → Formules DC**
2. Sélectionnez une compagnie et un usage
3. Configurez les tiers:
   ```
   Tier 1: 6.7% (pour les 1ers 10% de VV)
   Tier 2: 6.3% (pour les 2èmes 10% de VV)
   Tier 3: 6.0% (pour les 3èmes 10% de VV)
   etc.
   ```

#### Exemple de calcul (votre cas)
```
Capital: 6,000 DT
VV: 40,000 DT
Ratio: 6,000 / 40,000 = 15%

Calcul automatique:
- Tranche 1 (10% de VV = 4,000 DT): 4,000 × 6.7% = 268 DT
- Tranche 2 (5% de VV = 2,000 DT):  2,000 × 6.3% = 126 DT
- Prime variable = 394 DT
- Prime de base = 10 DT
- Total = 404 DT
```

### Code correspondant
```typescript
// Dans pricing-engine.service.ts
const trancheSize = vv.mul(0.1); // 10% de VV
while (capitalRemaining.gt(0)) {
  const tier = tiers[tierIndex];
  const amountInTier = capitalRemaining.gt(trancheSize) 
    ? trancheSize 
    : capitalRemaining;
  primeVariable = primeVariable.add(amountInTier.mul(tier.tierRate));
  capitalRemaining = capitalRemaining.sub(amountInTier);
  tierIndex++;
}
```

### Vérification
Pour vérifier que c'est bien configuré:
1. Allez dans **Admin → Formules DC**
2. Vérifiez que les tiers progressifs sont créés
3. Testez avec un devis

---

## 10. Résolution Erreur CAS

### 🐛 Erreur: "CAS pricing rule not found for company"

Cette erreur signifie qu'il manque la règle de tarification CAS pour au moins une compagnie.

### Diagnostic

#### Étape 1: Vérifier les garanties
```bash
cd backend
npx ts-node diagnose-system.ts
```

Ce script affichera:
- ✅ Garanties existantes
- ❌ Garanties manquantes
- ⚠️ Règles manquantes par compagnie

#### Étape 2: Créer les garanties et règles manquantes
```bash
cd backend
npx ts-node create-missing-guarantees.ts
```

Ce script créera automatiquement:
- Toutes les garanties obligatoires
- Les règles de base pour CAS, ASSISTANCE, VOL, INCENDIE, PTA

### Solution Manuelle

Si vous préférez créer manuellement:

#### 1. Créer la garantie CAS
1. Allez dans **Admin → Garanties**
2. Cliquez sur **Nouvelle garantie**
3. Remplissez:
   - Code: `CAS`
   - Nom FR: `Corporel Assuré`
   - Nom AR: `الأضرار الجسدية للمؤمن`
   - Optionnel: Non

#### 2. Créer les règles CAS pour chaque compagnie
1. Allez dans **Admin → Règles de tarification**
2. Pour CHAQUE compagnie, créez une règle:
   - Compagnie: [Sélectionner]
   - Garantie: CAS
   - Prime fixe: 1000 DT (ou votre valeur)

### Vérification
Après création, testez en créant un devis. L'erreur ne devrait plus apparaître.

---

## 11. Scripts de Diagnostic

### Scripts disponibles

#### 1. Diagnostic complet
```bash
cd backend
npx ts-node diagnose-system.ts
```

**Affiche:**
- ✅ Garanties existantes
- ❌ Garanties manquantes
- 🏢 Compagnies actives
- ⚙️ Règles de tarification par garantie/compagnie
- ⚠️ Problèmes détectés

#### 2. Création automatique
```bash
cd backend
npx ts-node create-missing-guarantees.ts
```

**Crée:**
- Toutes les garanties obligatoires
- Règles de base pour CAS (1000 DT)
- Règles de base pour ASSISTANCE (50 DT)
- Règles de base pour VOL (0.25% + 10 DT)
- Règles de base pour INCENDIE (0.15% + 10 DT)
- Règles de base pour PTA (3 capitaux)

#### 3. Seed minimal RC
```bash
cd backend
npm run seed:minimal
```

**Crée:**
- 40 règles RC par compagnie (8 classes × 5 CV)

#### 4. Vérification RC
```bash
cd backend
npx ts-node check-rc-values.ts
```

**Vérifie:**
- Valeurs RC correctes
- Cohérence des données

---

## 📞 Support

### En cas de problème

1. **Lancez le diagnostic:**
   ```bash
   npx ts-node diagnose-system.ts
   ```

2. **Consultez les logs:**
   - Backend: Console du serveur NestJS
   - Frontend: Console du navigateur (F12)

3. **Vérifiez la base de données:**
   ```bash
   npx prisma studio
   ```

### Questions fréquentes

**Q: Pourquoi l'export Excel ne fonctionne pas?**
R: ✅ Corrigé - Utilisez la dernière version du code

**Q: Comment ajouter un filtre par usage?**
R: ✅ Ajouté - Disponible dans Règles de tarification

**Q: Les réductions sont au niveau garantie ou convention?**
R: ✅ Les deux - Tarifs standards dans Règles, réductions dans Conventions

**Q: Comment configurer DC progressif?**
R: ✅ Déjà implémenté - Configurez les tiers dans Admin → Formules DC

**Q: Erreur "CAS pricing rule not found"?**
R: ✅ Lancez `create-missing-guarantees.ts` pour créer automatiquement

---

## 🎯 Checklist de Démarrage

### Pour démarrer en production

- [ ] Créer les compagnies
- [ ] Lancer `create-missing-guarantees.ts` pour créer les garanties de base
- [ ] Lancer `seed:minimal` pour créer le tableau RC
- [ ] Configurer les règles spécifiques (TR, DC, BG)
- [ ] Créer les organisations clientes
- [ ] Créer les conventions avec réductions
- [ ] Tester la génération de devis
- [ ] Vérifier les calculs avec `diagnose-system.ts`
- [ ] **DÉSACTIVER** la fonction "Nettoyer la DB"

---

**Version:** 1.0  
**Date:** 15/03/2026  
**Auteur:** Équipe Développement
