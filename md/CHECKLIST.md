# ✅ CHECKLIST RAPIDE - Vérification des Corrections

**Date:** 08/04/2026  
**Version:** 1.0

---

## 📋 NOTES CLIENT - STATUT

| # | Note Client | Statut | Fichiers Modifiés |
|---|-------------|--------|-------------------|
| 1 | **DC - Limites selon valeur véhicule** | ✅ CORRIGÉ | `CoverageSelectionStep.tsx`, `dc-config.controller.ts`, `NewSimulationPage.tsx` |
| 2 | **Garanties TR/DC masquées selon formule** | ✅ CORRIGÉ | `CoverageSelectionStep.tsx` (lignes 1050-1100) |
| 3 | **Franchise TR - Modal sélection** | ✅ CORRIGÉ | `CoverageSelectionStep.tsx` (modal + fetch) |
| 4 | **Garanties manquantes dans devis** | ⚠️ À VÉRIFIER | `pricing-engine.service.ts`, `pdf.service.ts` |
| 5 | **Réductions conventions non appliquées** | ⚠️ À VÉRIFIER | `pricing-engine.service.ts` |
| 6 | **Statuts garanties invisibles** | ⚠️ À VÉRIFIER | `pdf.service.ts` |
| 7 | **Classe et formule dans devis** | ⚠️ À IMPLÉMENTER | `pdf.service.ts` |
| 8 | **Éligibilité formules par âge** | ✅ CORRIGÉ | `CoverageSelectionStep.tsx` (fetch eligibility) |

---

## 🔧 MODIFICATIONS TECHNIQUES

### Frontend ✅
- [x] DC capitals filtrés dynamiquement par VV
- [x] Fonction `generateAllDcOptions` pour paliers
- [x] Fetch DC Config (maxCapitalPercent, plafondAbsolu)
- [x] Garanties TR/DC masquées selon formule sélectionnée
- [x] Modal franchise TR avec fetch des valeurs
- [x] AC capitals par compagnie (Record<string, number>)
- [x] Modal séquentiel AC pour chaque compagnie
- [x] Fetch eligibility formules par âge véhicule
- [x] UI feedback pour formules non éligibles
- [x] Guide admin DC créé (DcCapitalTiersInfoModal)

### Backend ✅
- [x] DC Config endpoint accessible aux clients (roles guard supprimé)
- [x] AC capitals dans DTO (`CreateSimulationDto`)
- [x] AC capitals dans service (`simulations.service.ts`)
- [x] AC capitals extraction dans quotes (`quotes.service.ts`)
- [x] Migration Prisma `acCapitals` appliquée
- [x] Connection pool augmenté (9 → 20)

### Backend ⚠️ À VÉRIFIER
- [ ] Pricing engine utilise `selectedCapitals['ASSURANCE_CONDUCTEUR']`
- [ ] Toutes les garanties sélectionnées dans le devis PDF
- [ ] Réductions conventions appliquées à la prime
- [ ] Statuts garanties (Gratuit/Non accordée) dans PDF
- [ ] Classe Bonus/Malus dans PDF
- [ ] Formule sélectionnée dans PDF

---

## 💾 BASE DE DONNÉES

### Migrations ✅
- [x] `20260408093537_add_ac_capitals` appliquée
- [x] Champ `acCapitals` (JSONB) ajouté à table `Simulation`

### Configuration ⚠️ À VÉRIFIER
Exécuter le script `VERIFICATION_DB.sql` pour vérifier:

- [ ] **DC Config** configuré pour toutes les compagnies/usages
- [ ] **DC Capital Tiers** configuré pour toutes les compagnies/usages
- [ ] **Franchise Values** configurées (0%, 5%, 10%, etc.)
- [ ] **BG Capital Limits** configurées (1000, 2000, 3000, etc.)
- [ ] **Formula Eligibility** configurée (âge max par formule)
- [ ] **Pricing Rules AC** configurées pour toutes les compagnies
- [ ] **Conventions** avec réductions actives

---

## 🧪 TESTS À EFFECTUER

### Test 1: DC - Filtrage par valeur véhicule ✅
```
1. Créer simulation avec VV = 80,000 DT
2. Sélectionner formule DC
3. Sélectionner LLOYD
4. Vérifier dropdown DC:
   ✅ Doit afficher: 1k, 2k ... 40k (s'arrête à 50% de VV)
   ❌ Ne doit PAS afficher: 50k, 75k, 100k
```

### Test 2: Garanties masquées selon formule ✅
```
1. Sélectionner formule DC
2. Vérifier garanties optionnelles:
   ❌ "Tous Risques" ne doit PAS apparaître
   ❌ "Dommages Collision" ne doit PAS apparaître
   ✅ Autres garanties (BG, AC, etc.) doivent apparaître

3. Sélectionner formule TR
4. Vérifier garanties optionnelles:
   ❌ "Tous Risques" ne doit PAS apparaître
   ❌ "Dommages Collision" ne doit PAS apparaître
   ✅ Autres garanties doivent apparaître
```

### Test 3: Franchise TR ✅
```
1. Sélectionner formule TR
2. Vérifier:
   ✅ Modal franchise s'ouvre automatiquement
   ✅ Dropdown affiche: "Sans franchise (0%)", "5%", "10%", etc.
   ✅ Après confirmation, franchise affichée sous la formule
```

### Test 4: AC par compagnie ✅
```
1. Sélectionner LLOYD et AL BARAKA
2. Cocher "Assurance Conducteur"
3. Vérifier:
   ✅ Modal s'ouvre pour LLOYD → Sélectionner 10k → Confirmer
   ✅ Modal se rouvre pour AL BARAKA → Sélectionner 20k → Confirmer
   ✅ Affichage: "LLOYD: 10,000 DT | AL BARAKA: 20,000 DT"
```

### Test 5: Éligibilité formules ✅
```
1. Créer simulation avec véhicule > 10 ans
2. Vérifier:
   ❌ Formule TR désactivée avec message "Véhicule trop ancien"
   ✅ Formule DC disponible (si < 15 ans)
   ✅ Formule Standard disponible
```

### Test 6: Génération devis ⚠️ À TESTER
```
1. Créer simulation complète avec:
   - Formule: Standard
   - Garanties: AC (10k), BG (2k), Catastrophes Naturelles, Incendie Émeutes
   - Convention: OIT
   - Classe: 4

2. Générer devis et vérifier:
   [ ] Toutes les garanties sélectionnées apparaissent
   [ ] AC avec capital 10,000 DT affiché
   [ ] BG avec limite 2,000 DT affiché
   [ ] Réductions convention appliquées à la prime
   [ ] Statut "Gratuit" affiché pour garanties gratuites
   [ ] Classe Bonus/Malus "Classe 4" affichée
   [ ] Formule "Standard" affichée
```

---

## 📁 FICHIERS MODIFIÉS - RÉSUMÉ

### Frontend (6 fichiers)
```
✅ frontend/src/components/simulations/CoverageSelectionStep.tsx  [1750 lignes]
✅ frontend/src/pages/simulations/NewSimulationPage.tsx           [+1 prop]
✅ frontend/src/pages/admin/DcCapitalTiersPage.tsx                [+import +modal]
✅ frontend/src/pages/admin/DcCapitalTiersInfoModal.tsx           [CRÉÉ - 300 lignes]
```

### Backend (6 fichiers)
```
✅ backend/src/dc-config/dc-config.controller.ts                  [roles guard]
✅ backend/src/simulations/create-simulation.dto.ts               [+acCapitals]
✅ backend/src/simulations/simulations.service.ts                 [+acCapitals]
✅ backend/src/quotes/quotes.service.ts                           [+acCapitals extraction]
✅ backend/prisma/schema.prisma                                   [+acCapitals field]
✅ backend/.env                                                   [connection pool]
```

### Migrations (1 fichier)
```
✅ backend/prisma/migrations/20260408093537_add_ac_capitals/migration.sql
```

---

## 🚨 ACTIONS PRIORITAIRES

### Priorité 1 - URGENT ⚠️
1. **Exécuter `VERIFICATION_DB.sql`** pour vérifier la configuration DB
2. **Vérifier pricing engine** pour garanties manquantes dans devis
3. **Vérifier réductions conventions** dans le calcul de prime
4. **Tester génération PDF** avec toutes les garanties

### Priorité 2 - IMPORTANT ⚠️
1. **Ajouter classe et formule** dans le PDF du devis
2. **Ajouter statuts garanties** (Gratuit/Non accordée) dans le PDF
3. **Configurer données manquantes** dans la DB (si détectées par le script SQL)

### Priorité 3 - AMÉLIORATION 📈
1. **Tests end-to-end** complets du flow de simulation
2. **Documentation utilisateur** pour les nouvelles fonctionnalités
3. **Formation admin** sur la configuration DC (guide créé)

---

## 📞 CONTACT

**Développeur:** Mohamed  
**Date:** 08/04/2026

**Documents créés:**
- ✅ `FIXES_DOCUMENTATION.md` - Documentation complète (15 pages)
- ✅ `VERIFICATION_DB.sql` - Script de vérification DB
- ✅ `CHECKLIST.md` - Ce document (checklist rapide)

---

## ✅ VALIDATION FINALE

Avant de déployer en production:

- [ ] Tous les tests frontend passent ✅
- [ ] Script `VERIFICATION_DB.sql` exécuté et validé
- [ ] Génération devis testée avec toutes les garanties
- [ ] Réductions conventions vérifiées
- [ ] PDF devis contient toutes les informations requises
- [ ] Client a validé les corrections

**Signature:** ________________  
**Date:** ________________

---

**FIN DU CHECKLIST**
