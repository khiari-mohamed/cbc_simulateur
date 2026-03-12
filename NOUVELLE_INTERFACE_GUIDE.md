# 🎯 Nouvelle Interface de Gestion de Tarification

## 📋 Vue d'ensemble

Cette nouvelle interface **unifie** les modules **Tarification** et **Formules** en une seule page claire et intuitive, inspirée d'Excel pour faciliter la saisie et la modification des données.

---

## ✨ Changements Principaux

### ✅ Avant (Ancien système)
- ❌ Deux modules séparés: "Règles de tarification" + "Configuration Formules"
- ❌ Interface confuse avec trop de champs
- ❌ Saisie manuelle cellule par cellule pour RC
- ❌ Pas d'import/export Excel
- ❌ Difficile de voir l'ensemble des données

### ✅ Après (Nouveau système)
- ✅ **Un seul module**: "Gestion Tarification"
- ✅ **3 onglets clairs**: Tableau RC | Garanties | Dommages Collision
- ✅ **Interface type Excel** pour le tableau RC
- ✅ **Import/Export CSV** pour toutes les données
- ✅ **Vue groupée** par garantie pour faciliter la navigation
- ✅ **Champs contextuels** - seuls les champs pertinents s'affichent

---

## 📊 Onglet 1: Tableau RC

### Fonctionnalités
- **Grille Excel-like** avec 8 classes × 5 tranches de puissance
- **Édition directe** dans les cellules
- **Surlignage** des cellules modifiées (bleu)
- **Sauvegarde groupée** de toutes les modifications
- **Export CSV** du tableau complet
- **Import CSV** pour charger des données en masse

### Utilisation
1. Sélectionner la compagnie (Lloyd/Amana)
2. Saisir les primes directement dans les cellules
3. Les cellules modifiées deviennent bleues
4. Cliquer sur "Sauvegarder" pour appliquer

### Format CSV pour Import/Export
```csv
CLASSE,3-4 CV,5-6 CV,7-10 CV,11-14 CV,≥15 CV
01,77000,98000,119000,154000,184800
02,88000,112000,136000,176000,211200
...
```

---

## 🛡️ Onglet 2: Garanties

### Organisation
Les garanties sont **groupées et pliables** pour une navigation facile:
- Cliquer sur une garantie pour voir/masquer ses règles
- Badge indiquant le nombre de règles configurées
- Bouton "Ajouter" pour chaque garantie

### Garanties Supportées

#### 1️⃣ **VOL (Vol)**
**Champs affichés:**
- Taux (décimal, ex: 0.00236)
- Prime fixe (DT)
- Taux de réduction (%)
- Formule personnalisée (optionnel)

**Formule standard:** `((VV × taux) + prime fixe) × réduction`

---

#### 2️⃣ **INCENDIE**
**Champs affichés:**
- Taux (décimal, ex: 0.00275)
- Prime fixe (DT)
- Taux de réduction (%)
- Formule personnalisée (optionnel)

**Formule standard:** `((VV × taux) + prime fixe) × réduction`

---

#### 3️⃣ **TOUS RISQUES (0%, 1%, 2%, 4%)**
**Champs affichés:**
- Franchise (%) - dropdown: 0%, 1%, 2%, 4%
- Taux (décimal)
- Prime fixe (DT)
- Taux de réduction (%)
- Formule personnalisée (optionnel)

**Formule standard:** `((VN × taux) + prime fixe) × réduction`

**Note:** Créer une règle par franchise

**Valeurs de référence:**
| Franchise | Taux    | Prime Fixe |
|-----------|---------|------------|
| 0%        | 0.032   | 22 DT      |
| 1%        | 0.0265  | 21.75 DT   |
| 2%        | 0.021   | 19 DT      |
| 4%        | 0.017   | 15 DT      |

---

#### 4️⃣ **CAS (Conducteur Assuré Supplémentaire)**
**Champs affichés:**
- Prime fixe (DT)

**Valeurs de référence:**
- LLOYD: 45 DT
- AMANA: 20 DT

---

#### 5️⃣ **ASSISTANCE**
**Champs affichés:**
- Prime fixe (DT)

**Valeurs de référence:**
- LLOYD: 115 DT
- AMANA: 90 DT

---

#### 6️⃣ **PTA (Personnes Transportées Assurées)**
**Champs affichés:**
- Capital (DT)
- Prime fixe (DT)

**Valeurs de référence:**
| Compagnie | Capital | Prime |
|-----------|---------|-------|
| LLOYD     | 5000    | 21 DT |
| LLOYD     | 10000   | 42 DT |
| AMANA     | 4000    | 32 DT |
| AMANA     | 8000    | 64 DT |

**Note:** Créer une règle par palier de capital

---

#### 7️⃣ **BG (Bris de Glace)**
**Champs affichés:**
- Taux (%)
- Formule personnalisée (optionnel)

**Formule standard:** `capital × taux`

**Valeurs de référence:**
- LLOYD: 6.5%
- AMANA: 7%

---

#### 8️⃣ **Garanties à Prime Fixe**
- **INCENDIE_EMEUTES**: LLOYD: 15 DT | AMANA: NC
- **DOMMAGES_EMEUTES**: 30 DT (les deux)
- **CATASTROPHES_NATURELLES**: AMANA: 40 DT (Tous Risques uniquement)

---

### Export des Garanties
Le bouton "Exporter tout" génère un CSV avec toutes les règles:
```csv
Garantie,Formule,Franchise (%),Taux (%),Prime Fixe (DT),Capital Min,Réduction (%),Usage,Formule Personnalisée
VOL,,,,30,,,,"((VV * rate) + fixed) * reduction"
TOUS_RISQUES_ZERO,,0,0.032,22000,,,0,
...
```

---

## 🚗 Onglet 3: Dommages Collision

Cet onglet conserve l'interface existante qui fonctionne parfaitement:
- Configuration Progressive (tranches dégressives)
- Configuration Matrice (VV × Capital)
- Le client a confirmé que cette partie est **parfaite** ✅

---

## 🎯 Avantages de la Nouvelle Interface

### Pour l'Administrateur
1. **Gain de temps**: Import/Export Excel pour modifications en masse
2. **Clarté**: Vue d'ensemble immédiate de toutes les règles
3. **Simplicité**: Seuls les champs pertinents s'affichent
4. **Sécurité**: Validation avant sauvegarde
5. **Traçabilité**: Surlignage des modifications non sauvegardées

### Pour le Client
1. **Familiarité**: Interface type Excel qu'il connaît déjà
2. **Rapidité**: Saisie directe sans navigation complexe
3. **Fiabilité**: Moins d'erreurs grâce à l'organisation claire
4. **Flexibilité**: Import de ses propres fichiers Excel

---

## 📝 Guide d'Utilisation Rapide

### Scénario 1: Modifier le Tableau RC
1. Aller dans "Gestion Tarification"
2. Onglet "Tableau RC"
3. Sélectionner la compagnie
4. Modifier les cellules directement
5. Cliquer "Sauvegarder"

### Scénario 2: Ajouter une Garantie VOL
1. Onglet "Garanties"
2. Sélectionner la compagnie
3. Cliquer sur "VOL" pour déplier
4. Cliquer "Ajouter"
5. Remplir: Taux = 0.00236, Prime fixe = 30
6. Enregistrer

### Scénario 3: Import Massif depuis Excel
1. Préparer le fichier CSV avec le format correct
2. Onglet "Tableau RC"
3. Sélectionner la compagnie
4. Cliquer "Importer"
5. Choisir le fichier CSV
6. Vérifier les données importées (cellules bleues)
7. Cliquer "Sauvegarder"

### Scénario 4: Export pour Vérification
1. Onglet "Tableau RC" ou "Garanties"
2. Sélectionner la compagnie
3. Cliquer "Exporter" ou "Exporter tout"
4. Ouvrir le CSV dans Excel
5. Vérifier les données
6. Modifier si nécessaire
7. Réimporter

---

## 🔧 Aspects Techniques

### Backend (Inchangé)
- ✅ Toute la logique de calcul reste identique
- ✅ Les formules fonctionnent exactement pareil
- ✅ La base de données n'a pas changé
- ✅ Les APIs existantes sont réutilisées

### Frontend (Nouveau)
- **Composants créés:**
  - `PricingManagementPage.tsx` - Page principale avec onglets
  - `RcTableGrid.tsx` - Grille Excel-like pour RC
  - `GuaranteesConfig.tsx` - Configuration des garanties
  - `GuaranteeRuleModal.tsx` - Modal simplifié par garantie

- **Fonctionnalités:**
  - Édition inline avec suivi des modifications
  - Import/Export CSV
  - Validation avant sauvegarde
  - Champs contextuels par garantie

---

## ✅ Checklist de Validation

### Fonctionnalités Implémentées
- ✅ Tableau RC type Excel avec édition directe
- ✅ Import/Export CSV pour RC
- ✅ Vue groupée des garanties
- ✅ Champs contextuels par type de garantie
- ✅ Export CSV de toutes les garanties
- ✅ Conservation de l'onglet DC (parfait selon client)
- ✅ Un seul module unifié
- ✅ Navigation simplifiée

### Exigences Client Satisfaites
- ✅ "Tableau Excel pour saisir RC"
- ✅ "Classes dédiées uniquement pour RC"
- ✅ "Combiné module tarification et configuration Formule"
- ✅ "Maintenir les mêmes paramètres" (backend inchangé)
- ✅ Interface intuitive et non confuse

---

## 🚀 Prochaines Étapes

### Phase 1: Test et Validation ✅ (Actuel)
- Tester l'interface avec le client
- Valider le format CSV
- Confirmer que tout fonctionne

### Phase 2: Améliorations Futures (Si demandé)
- Ajouter paliers de valeurs (min/max VV/VN) par garantie
- Taux de réduction par tranche pour DC Matrix
- Dropdowns pour choix VV/VN dans DC
- Templates Excel pré-remplis

---

## 📞 Support

Pour toute question ou modification:
1. Vérifier ce document d'abord
2. Consulter `EXCEL_TO_APP_MAPPING.md` pour le mapping complet
3. Consulter `formulas.md` pour les détails des formules

---

## 🎉 Résumé

**Avant:** 2 modules confus + saisie manuelle fastidieuse
**Après:** 1 module clair + interface Excel + import/export

**Résultat:** Gain de temps, moins d'erreurs, interface familière pour le client! 🚀
