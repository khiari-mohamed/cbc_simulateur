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
*********************************************
# Guide Utilisateur - Partage de Conventions

## 📖 Guide Complet pour Administrateurs

---

## 🎯 Qu'est-ce que le Partage de Conventions ?

### Concept Simple

Imaginez que vous avez créé une convention avec des tarifs et des garanties spécifiques pour votre organisation "ATB". Maintenant, vous voulez que d'autres organisations (comme "BTK" ou "Client Particulier") puissent également bénéficier de cette même convention, **sans avoir à tout recréer**.

Le partage de conventions vous permet de faire exactement cela !

---

## 🔑 Concepts Clés à Comprendre

### 1. Organisation Propriétaire

**C'est quoi ?**
- L'organisation qui a créé la convention en premier
- Elle garde toujours le contrôle total
- Elle peut partager ou retirer l'accès à tout moment

**Exemple :**
- Vous créez la convention "ATB_CNV" pour votre organisation "ATB"
- "ATB" est l'organisation propriétaire
- "ATB" apparaît avec un badge bleu dans le système

### 2. Organisations Partagées

**C'est quoi ?**
- Les autres organisations qui ont reçu l'accès à votre convention
- Elles peuvent utiliser la convention mais ne peuvent pas la modifier
- Elles voient les mêmes tarifs, garanties et règles

**Exemple :**
- Vous partagez "ATB_CNV" avec "BTK"
- Les utilisateurs de "BTK" peuvent maintenant créer des simulations avec "ATB_CNV"
- "BTK" apparaît avec un badge vert dans le système

### 3. Convention Unique

**Important à comprendre :**
- Il n'y a qu'**UNE SEULE** convention "ATB_CNV"
- Pas de copie, pas de duplication
- Si vous modifiez les règles, tous les utilisateurs (ATB et BTK) voient les mêmes changements
- C'est comme partager un document Google Drive : tout le monde voit la même version

---

## 📋 Pourquoi Utiliser le Partage ?

### Cas d'Usage 1 : Clients Particuliers

**Situation :**
Vous avez des clients individuels qui ne font pas partie de votre organisation principale, mais vous voulez leur offrir les mêmes avantages.

**Solution :**
1. Créez une organisation "Client Particulier"
2. Partagez votre convention avec cette organisation
3. Donnez le code d'accès aux clients
4. Ils rejoignent "Client Particulier" et bénéficient de votre convention

**Avantage :**
- Pas besoin de recréer toutes les règles
- Un seul endroit pour gérer les tarifs
- Facile d'ajouter ou retirer l'accès

### Cas d'Usage 2 : Organisations Partenaires

**Situation :**
Vous travaillez avec plusieurs organisations partenaires (BTK, Partenaire A, Partenaire B) et vous voulez leur offrir les mêmes conditions.

**Solution :**
1. Créez une convention pour votre organisation
2. Partagez-la avec toutes les organisations partenaires
3. Chaque partenaire peut l'utiliser immédiatement

**Avantage :**
- Gestion centralisée
- Cohérence des tarifs entre partenaires
- Mise à jour instantanée pour tous

### Cas d'Usage 3 : Accès Temporaire

**Situation :**
Vous lancez un programme pilote avec une organisation pour 3 mois.

**Solution :**
1. Partagez votre convention avec l'organisation pilote
2. Après 3 mois, retirez l'accès en un clic
3. L'organisation n'a plus accès à la convention

**Avantage :**
- Contrôle total sur qui a accès
- Facile d'activer et désactiver
- Pas de contrat compliqué

---

## 🚀 Comment Partager une Convention (Étape par Étape)

### Étape 1 : Accéder à la Page Conventions

1. Connectez-vous en tant qu'administrateur
2. Allez dans le menu "Conventions"
3. Vous verrez la liste de toutes vos conventions

**Ce que vous voyez :**
```
┌─────────────────────────────────────┐
│ ATB_CNV                             │
│ ATB                                 │
│ Active                              │
│                                     │
│ Compagnies: 2                       │
│ Règles: 0                           │
│ Orgs: 0  ← Nombre d'organisations   │
│                                     │
│ [Partager] [Paliers] [✏️] [🗑️]     │
└─────────────────────────────────────┘
```

### Étape 2 : Cliquer sur "Partager"

1. Trouvez la convention que vous voulez partager (ex: ATB_CNV)
2. Cliquez sur le bouton **"Partager"**
3. Une fenêtre s'ouvre

**Ce que vous voyez :**
```
┌─────────────────────────────────────────────┐
│ Partager la convention                      │
│ ATB_CNV                                     │
│                                             │
│ 🔵 Organisation propriétaire                │
│    ATB                                      │
│    Cette organisation est le propriétaire   │
│    principal de la convention               │
│                                             │
│ Ajouter des organisations                   │
│ ☐ BTK (Code: BTK)                          │
│ ☐ Client Particulier (Code: CLIENT_PART)   │
│                                             │
│ 0 organisation(s) sélectionnée(s)          │
│                                             │
│ [Fermer] [Partager avec ...]               │
└─────────────────────────────────────────────┘
```

### Étape 3 : Sélectionner les Organisations

1. Cochez les organisations avec lesquelles vous voulez partager
2. Vous pouvez en sélectionner plusieurs
3. Le compteur se met à jour automatiquement

**Exemple :**
```
☑ BTK (Code: BTK)
☑ Client Particulier (Code: CLIENT_PART)

2 organisation(s) sélectionnée(s)
```

### Étape 4 : Confirmer le Partage

1. Cliquez sur **"Partager avec 2 org(s)"**
2. Un message de succès apparaît : ✅ "Convention partagée avec succès"
3. La fenêtre se ferme automatiquement

### Étape 5 : Vérifier le Partage

Retournez à la liste des conventions. Vous verrez maintenant :

```
┌─────────────────────────────────────┐
│ ATB_CNV                             │
│ ATB                                 │
│ Active                              │
│                                     │
│ 🟢 Partagée avec 2 org(s)           │
│    BTK, Client Particulier          │
│                                     │
│ Compagnies: 2                       │
│ Règles: 0                           │
│ Orgs: 2  ← Mis à jour !             │
│                                     │
│ [Partager] [Paliers] [✏️] [🗑️]     │
└─────────────────────────────────────┘
```

---

## 🗑️ Comment Retirer une Organisation (Étape par Étape)

### Étape 1 : Ouvrir le Partage

1. Cliquez sur **"Partager"** sur la convention
2. La fenêtre s'ouvre

### Étape 2 : Voir les Organisations Partagées

Vous verrez maintenant une nouvelle section :

```
┌─────────────────────────────────────────────┐
│ 🟢 Organisations avec accès (2)             │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ 🏢 BTK                              │    │
│ │ Code: BTK                           │    │
│ │ Partagé le 22/03/2026              │    │
│ │                          [🗑️ Retirer]│    │
│ └─────────────────────────────────────┘    │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ 🏢 Client Particulier               │    │
│ │ Code: CLIENT_PART                   │    │
│ │ Partagé le 22/03/2026              │    │
│ │                          [🗑️ Retirer]│    │
│ └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Étape 3 : Retirer une Organisation

1. Cliquez sur l'icône **🗑️ Retirer** à côté de l'organisation
2. Une confirmation apparaît : "Êtes-vous sûr de vouloir retirer cette organisation ?"
3. Cliquez sur **"Oui"** pour confirmer
4. Message de succès : ✅ "Organisation retirée avec succès"

### Étape 4 : Résultat

- L'organisation disparaît de la liste "Organisations avec accès"
- Elle réapparaît dans "Ajouter des organisations" (vous pouvez la repartager plus tard)
- Les utilisateurs de cette organisation ne peuvent plus accéder à la convention

---

## ❓ Questions Fréquentes

### Q1 : Que se passe-t-il quand je partage une convention ?

**Réponse :**
- Les utilisateurs de l'organisation partagée voient la convention dans leur liste
- Ils peuvent créer des simulations avec cette convention
- Ils bénéficient des mêmes tarifs et garanties que votre organisation
- Ils **NE PEUVENT PAS** modifier la convention (seul le propriétaire peut)

### Q2 : Si je modifie la convention, est-ce que les organisations partagées voient les changements ?

**Réponse :**
Oui ! C'est l'avantage principal :
- Il n'y a qu'une seule convention
- Toute modification est visible par tous immédiatement
- Pas besoin de mettre à jour plusieurs copies

**Exemple :**
1. Vous modifiez le taux de réduction de 10% à 15%
2. Instantanément, ATB et BTK voient 15%
3. Pas de synchronisation manuelle nécessaire

### Q3 : Puis-je partager avec l'organisation propriétaire ?

**Réponse :**
Non, ce n'est pas nécessaire :
- L'organisation propriétaire a déjà accès automatiquement
- Elle n'apparaît pas dans la liste des organisations disponibles
- C'est pour éviter la confusion

### Q4 : Puis-je partager avec une organisation inactive ?

**Réponse :**
Non, pour des raisons de sécurité :
- Seules les organisations actives apparaissent dans la liste
- Si une organisation est désactivée, elle perd automatiquement l'accès
- Vous devez réactiver l'organisation d'abord

### Q5 : Combien d'organisations puis-je ajouter ?

**Réponse :**
- Il n'y a pas de limite technique
- Vous pouvez partager avec autant d'organisations que nécessaire
- Le système affiche les 3 premières + un compteur (ex: "BTK, ATB, Org3 +2")

### Q6 : Que se passe-t-il si je supprime la convention ?

**Réponse :**
- La convention est supprimée pour tout le monde
- Toutes les organisations partagées perdent l'accès
- Les partages sont automatiquement nettoyés
- Aucune action manuelle nécessaire

### Q7 : Que se passe-t-il si je supprime une organisation ?

**Réponse :**
- L'organisation est supprimée du système
- Tous ses partages sont automatiquement retirés
- Les autres organisations gardent leur accès
- La convention continue de fonctionner normalement

### Q8 : Un utilisateur d'une organisation partagée peut-il voir qui d'autre a accès ?

**Réponse :**
Non :
- Les utilisateurs normaux voient seulement les conventions disponibles
- Ils ne voient pas la liste des organisations partagées
- Seuls les administrateurs voient ces informations

### Q9 : Puis-je partager plusieurs conventions en même temps ?

**Réponse :**
Actuellement non :
- Vous devez partager chaque convention individuellement
- Cliquez sur "Partager" pour chaque convention
- C'est pour éviter les erreurs et garder le contrôle

### Q10 : Comment savoir quelles conventions sont partagées ?

**Réponse :**
Plusieurs indicateurs :
- Badge vert "Partagée avec X org(s)" sur la carte
- Compteur "Orgs: X" dans les statistiques
- Liste détaillée quand vous cliquez sur "Partager"

---

## ⚠️ Points Importants à Retenir

### ✅ À Faire

1. **Vérifier avant de partager**
   - Assurez-vous que la convention est correctement configurée
   - Vérifiez les tarifs et garanties
   - Testez avec votre propre organisation d'abord

2. **Communiquer avec les organisations**
   - Informez-les qu'elles ont accès à la convention
   - Expliquez-leur comment l'utiliser
   - Donnez-leur le code d'accès si nécessaire

3. **Surveiller l'utilisation**
   - Vérifiez régulièrement qui a accès
   - Retirez les organisations qui n'en ont plus besoin
   - Gardez la liste à jour

4. **Documenter vos partages**
   - Notez pourquoi vous avez partagé avec chaque organisation
   - Gardez une trace des dates
   - Facilitez la gestion future

### ❌ À Éviter

1. **Ne pas partager sans réfléchir**
   - Ne partagez pas avec toutes les organisations "au cas où"
   - Partagez uniquement avec celles qui en ont vraiment besoin
   - Gardez le contrôle sur vos conventions

2. **Ne pas oublier de retirer l'accès**
   - Si une organisation n'a plus besoin d'accès, retirez-la
   - Ne laissez pas des accès inutiles
   - Sécurité et clarté avant tout

3. **Ne pas modifier sans prévenir**
   - Si vous modifiez une convention partagée, prévenez les organisations
   - Elles verront les changements immédiatement
   - Évitez les surprises

4. **Ne pas confondre avec la création**
   - Le partage n'est PAS la même chose que créer une nouvelle convention
   - Une convention partagée reste unique
   - Tous voient les mêmes données

---

## 🎓 Scénarios Pratiques

### Scénario 1 : Lancement d'un Programme Partenaire

**Contexte :**
Vous lancez un programme avec 3 organisations partenaires (BTK, Partenaire A, Partenaire B).

**Étapes :**
1. Créez la convention "Programme Partenaire 2026"
2. Configurez tous les tarifs et garanties
3. Testez avec votre organisation
4. Cliquez sur "Partager"
5. Sélectionnez BTK, Partenaire A, Partenaire B
6. Cliquez sur "Partager avec 3 org(s)"
7. Informez les partenaires par email

**Résultat :**
- Les 3 partenaires ont accès immédiatement
- Ils peuvent créer des simulations
- Vous gérez tout depuis un seul endroit

### Scénario 2 : Client Particulier Temporaire

**Contexte :**
Un client particulier veut bénéficier de votre convention pour 6 mois.

**Étapes :**
1. Créez l'organisation "Client Particulier - Mars 2026"
2. Partagez votre convention avec cette organisation
3. Donnez le code d'accès au client
4. Le client rejoint l'organisation et utilise la convention
5. Après 6 mois, cliquez sur "Partager"
6. Cliquez sur 🗑️ à côté de "Client Particulier - Mars 2026"
7. Confirmez le retrait

**Résultat :**
- Le client a eu accès pendant 6 mois
- Après retrait, il ne peut plus utiliser la convention
- Aucune trace ne reste dans le système

### Scénario 3 : Mise à Jour de Tarifs

**Contexte :**
Vous devez augmenter les tarifs de 5% pour tous.

**Étapes :**
1. Allez dans la convention partagée
2. Modifiez les tarifs (+5%)
3. Sauvegardez
4. Envoyez un email aux organisations partagées pour les informer

**Résultat :**
- Tous voient les nouveaux tarifs immédiatement
- Pas besoin de mettre à jour plusieurs conventions
- Cohérence garantie

---

## 📊 Comprendre les Indicateurs

### Sur la Carte de Convention

```
┌─────────────────────────────────────┐
│ ATB_CNV                             │
│ ATB                                 │
│ Active                              │
│                                     │
│ 🟢 Partagée avec 2 org(s)           │ ← Badge vert = partagée
│    BTK, Client Particulier          │ ← Noms des organisations
│                                     │
│ Compagnies: 2                       │ ← Nombre de compagnies
│ Règles: 0                           │ ← Nombre de règles de réduction
│ Orgs: 2                             │ ← Nombre d'organisations partagées
│                                     │
│ [Partager] [Paliers] [✏️] [🗑️]     │
└─────────────────────────────────────┘
```

**Légende :**
- **Badge bleu** = Organisation propriétaire
- **Badge vert** = Organisations partagées
- **Orgs: X** = Nombre total d'organisations avec accès (hors propriétaire)

### Dans la Fenêtre de Partage

```
🔵 Organisation propriétaire
   → Celle qui a créé la convention
   → Ne peut pas être retirée
   → A tous les droits

🟢 Organisations avec accès
   → Celles qui ont reçu l'accès
   → Peuvent être retirées
   → Peuvent utiliser mais pas modifier

⚪ Ajouter des organisations
   → Celles qui n'ont pas encore accès
   → Peuvent être ajoutées
   → Organisations actives uniquement
```

---

## 🔐 Sécurité et Contrôle

### Qui Peut Partager ?

**Seuls les administrateurs (ADMINISTRATEUR_ARS) peuvent :**
- Partager des conventions
- Retirer des organisations
- Voir la liste des partages

**Les utilisateurs normaux ne peuvent pas :**
- Voir qui a accès aux conventions
- Partager ou retirer des organisations
- Modifier les paramètres de partage

### Traçabilité

**Chaque action est enregistrée :**
- Qui a partagé la convention
- Quand elle a été partagée
- Avec quelle organisation
- Qui a retiré l'accès
- Quand l'accès a été retiré

**Vous pouvez consulter l'historique dans les logs d'audit.**

### Protection des Données

**Le système garantit :**
- Seules les organisations autorisées ont accès
- Les modifications sont instantanées pour tous
- Les suppressions sont automatiques et propres
- Aucune donnée orpheline ne reste

---

## 💡 Conseils d'Expert

### 1. Nommage Clair

**Mauvais :**
- "Conv1"
- "Test"
- "Nouvelle"

**Bon :**
- "ATB_CNV_2026"
- "Programme Partenaire BTK"
- "Client Particulier - Tarif Réduit"

### 2. Organisation Logique

**Créez des organisations par catégorie :**
- "Clients Particuliers"
- "Partenaires Commerciaux"
- "Programme Pilote"
- "Accès Temporaire"

### 3. Révision Régulière

**Tous les mois :**
- Vérifiez la liste des partages
- Retirez les accès inutiles
- Mettez à jour les conventions si nécessaire

### 4. Communication

**Avant de partager :**
- Informez l'organisation
- Expliquez les conditions
- Donnez les instructions d'utilisation

**Après modification :**
- Prévenez les organisations partagées
- Expliquez les changements
- Répondez aux questions

---

## 📞 Besoin d'Aide ?

### Si vous avez des questions :

1. **Vérifiez ce guide d'abord**
   - La réponse est probablement ici
   - Utilisez la recherche (Ctrl+F)

2. **Vérifiez les logs d'audit**
   - Historique de toutes les actions
   - Qui a fait quoi et quand

3. **Testez dans un environnement de test**
   - Créez une convention de test
   - Partagez avec une organisation de test
   - Vérifiez le comportement

4. **Contactez le support technique**
   - Décrivez le problème précisément
   - Donnez les noms des conventions et organisations
   - Indiquez ce que vous avez déjà essayé

---

## ✅ Checklist de Démarrage

Avant de commencer à utiliser le partage :

- [ ] J'ai compris la différence entre organisation propriétaire et organisations partagées
- [ ] J'ai vérifié que mes conventions sont correctement configurées
- [ ] J'ai créé les organisations nécessaires
- [ ] J'ai testé le partage avec une convention de test
- [ ] J'ai compris comment retirer l'accès
- [ ] J'ai lu les questions fréquentes
- [ ] Je sais où trouver les logs d'audit
- [ ] J'ai préparé la communication pour les organisations

---

**Version du guide :** 1.0.0  
**Date de création :** 22 Mars 2026  
**Dernière mise à jour :** 22 Mars 2026

---

**Ce guide est destiné aux administrateurs non-techniques. Pour la documentation technique, consultez les fichiers CONVENTION_SHARING_IMPLEMENTATION.md et CONVENTION_SHARING_QUICK_GUIDE.md.**
