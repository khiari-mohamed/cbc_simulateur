# 🔍 VÉRIFICATION DES FORMULES - Instructions

## 📋 Ce que fait ce script :

1. ✅ Récupère le devis original Q20261775813985498653
2. ✅ Vérifie CHAQUE garantie selon les formules de `formulas.md`
3. ✅ Calcule la prime attendue pour chaque garantie
4. ✅ Compare avec la prime actuelle
5. ✅ Vérifie le calcul de DOMMAGES_COLLISIONS (progressif/matrice)
6. ✅ Vérifie les taxes et le total

---

## 🚀 Exécution sur PROD :

```bash
cd /home/ars-simulator/backend/scripts
node verify-formulas.js
```

---

## 📊 Résultat attendu :

```
🔍 VÉRIFICATION COMPLÈTE DES FORMULES

================================================================================
📋 INFORMATIONS DU DEVIS:
────────────────────────────────────────────────────────────────────────────────
Numéro: Q20261775813985498653
Compagnie: AL BARAKA
Formule: DOMMAGES_COLLISIONS
Valeur Vénale (VV): 50000 DT
Valeur à Neuf (VN): 50000 DT
Puissance fiscale: 8 CV
Bonus/Malus: 4%

================================================================================
🧮 VÉRIFICATION DES FORMULES PAR GARANTIE:

📌 RC
────────────────────────────────────────────────────────────────────────────────
Prime actuelle: 170 DT
Formule: Fixe selon tableau RC (Classe 4, 8 CV)
✅ CORRECT: 170 DT = 170.000 DT

📌 VOL
────────────────────────────────────────────────────────────────────────────────
Prime actuelle: 96.2 DT
Formule: ((50000 * 0.00236) + 30) * (1 - 35%) = 96.200
✅ CORRECT: 96.2 DT = 96.200 DT

📌 INCENDIE
────────────────────────────────────────────────────────────────────────────────
Prime actuelle: 108.875 DT
Formule: ((50000 * 0.00275) + 30) * (1 - 35%) = 108.875
✅ CORRECT: 108.875 DT = 108.875 DT

📌 DOMMAGES_EMEUTES
────────────────────────────────────────────────────────────────────────────────
Prime actuelle: 30 DT
isNotCovered: true
Formule: NON ACCORDÉE → Prime = 0 DT
❌ ERREUR: 30 DT ≠ 0.000 DT (Δ 30.000 DT)

================================================================================
🔍 VÉRIFICATION DÉTAILLÉE : DOMMAGES_COLLISIONS

Capital: 10000 DT
Prime actuelle: 700 DT
VV: 50000 DT
Ratio: 20.00%

Méthode: PROGRESSIVE
Prime fixe: 10 DT
Réduction: 0%

📊 Calcul PROGRESSIF:
Nombre de tranches: 5
  Tranche 1: 6.7%
  Tranche 2: 6.3%
  Tranche 3: 5.8%
  Tranche 4: 5.5%
  Tranche 5: 5.0%

Ratio > 10% → Calcul progressif:
  Tranche 1: 5000.00 × 0.067 = 335.000 DT
  Tranche 2: 5000.00 × 0.063 = 315.000 DT
  Total variable: 650.000 DT

+ Prime base: 10 DT
= 660.000 DT
× (1 - 0%) = 660.000 DT

❌ ERREUR: 700 DT ≠ 660.000 DT (Δ 40.000 DT)

================================================================================
💰 VÉRIFICATION DU TOTAL:

Prime nette calculée: 1367.075 DT
Prime nette attendue: 1397.075 DT
❌ Prime nette INCORRECTE (Δ 30.000 DT)

Taxes calculées: 194.049 DT
  - Taxe 12%: 166.449 DT
  - Taxe 2%: 27.600 DT
Taxes attendues: 197.649 DT
❌ Taxes INCORRECTES (Δ 3.600 DT)

Total calculé: 1561.124 DT
Total attendu: 1594.724 DT
❌ Total INCORRECT (Δ 33.600 DT)

================================================================================
❌ CERTAINES FORMULES SONT INCORRECTES

⚠️  Vérifier les erreurs ci-dessus
================================================================================
```

---

## 🎯 Ce que le script détecte :

### ✅ Formules correctes :
- RC : Tableau fixe selon classe + CV
- VOL : ((VV × taux) + fixe) × (1 - réduction)
- INCENDIE : ((VV × taux) + fixe) × (1 - réduction)
- CAS : Fixe
- PTA : Fixe selon capital
- ASSISTANCE : Fixe
- BG : capital × taux
- AC : Fixe selon capital

### ❌ Erreurs détectées :
- **DOMMAGES_EMEUTES** : 30 DT au lieu de 0 DT (NON ACCORDÉE)
- **Prime nette** : Inclut les 30 DT de DOMMAGES_EMEUTES
- **Taxes** : Calculées sur la prime incorrecte
- **Total** : Faussé par les 30 DT + taxes

---

## 💡 Utilité du script :

1. **Validation complète** : Vérifie toutes les formules du devis
2. **Détection d'erreurs** : Identifie les écarts entre attendu et réel
3. **Traçabilité** : Montre le détail de chaque calcul
4. **Documentation** : Prouve que les formules sont correctes

---

## 🔧 Après le fix :

Relancer le script sur un **nouveau devis** créé après le fix :

```bash
# Modifier le numéro de devis dans le script
# Puis relancer
node verify-formulas.js
```

**Résultat attendu après fix :**
```
✅✅✅ TOUTES LES FORMULES SONT CORRECTES !

🎉 Le devis est calculé correctement selon formulas.md
```
