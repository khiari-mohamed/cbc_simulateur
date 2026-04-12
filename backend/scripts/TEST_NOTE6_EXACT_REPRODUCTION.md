# 🎯 TEST NOTE 6 : Reproduction EXACTE

## Ce que fait ce script :

1. ✅ Récupère le devis original `Q20261775813985498653`
2. ✅ Extrait TOUS les paramètres (compagnie, véhicule, garanties, âge, etc.)
3. ✅ Appelle le pricing-engine avec EXACTEMENT les mêmes paramètres
4. ✅ Compare ligne par ligne : ANCIEN vs NOUVEAU
5. ✅ Détecte si le bug est corrigé

---

## 🚀 Exécution sur PROD :

```bash
cd /home/ars-simulator/backend/scripts

# Copier le script
cat > test-note6-exact-reproduction.js << 'EOF'
[Copier le contenu du fichier test-note6-exact-reproduction.js]
EOF

# Exécuter
node test-note6-exact-reproduction.js
```

---

## 📊 Résultat AVANT le fix :

```
🔍 COMPARAISON DÉTAILLÉE:

Garantie                            Original      Nouveau  Statut
────────────────────────────────────────────────────────────────────────────────
RC                                  1200.000 DT  1200.000 DT  ✅ OK
INCENDIE                             350.000 DT   350.000 DT  ✅ OK
DOMMAGES_EMEUTES [NON ACCORDÉE]       30.000 DT    30.000 DT  ✅ OK
────────────────────────────────────────────────────────────────────────────────
TOTAL                               1594.724 DT  1594.724 DT

🎯 DIAGNOSTIC FINAL:

⚠️ AUCUNE DIFFÉRENCE DÉTECTÉE
Le bug est toujours présent (DOMMAGES_EMEUTES = 30 DT au lieu de 0 DT)
```

---

## 📊 Résultat APRÈS le fix :

```
🔍 COMPARAISON DÉTAILLÉE:

Garantie                            Original      Nouveau  Statut
────────────────────────────────────────────────────────────────────────────────
RC                                  1200.000 DT  1200.000 DT  ✅ OK
INCENDIE                             350.000 DT   350.000 DT  ✅ OK
DOMMAGES_EMEUTES [NON ACCORDÉE]       30.000 DT     0.000 DT  🎉 FIXÉ (BUG CORRIGÉ !)
────────────────────────────────────────────────────────────────────────────────
TOTAL                               1594.724 DT  1564.724 DT
                                                              Δ 30.000 DT

🎯 DIAGNOSTIC FINAL:

✅ BUG CORRIGÉ !

Les garanties NON ACCORDÉES qui avaient une prime > 0 ont maintenant prime = 0
Le total a été recalculé correctement

Détails:
  - DOMMAGES_EMEUTES: 30 DT → 0 DT ✓

Total corrigé: 1594.724 DT → 1564.724 DT
Économie pour le client: 30.000 DT
```

---

## ✅ Critères de succès :

Le test est réussi si tu vois :
- 🎉 FIXÉ à côté de DOMMAGES_EMEUTES
- Prime passe de 30 DT → 0 DT
- Total diminue de 30 DT
- Message "✅ BUG CORRIGÉ !"

---

## 🔧 Si le test échoue :

1. Vérifier que le fix a été appliqué dans le code
2. Rebuild : `npm run build`
3. Redémarrer : `pm2 restart ars-backend`
4. Relancer le test

---

## 💡 Avantages de ce script :

✅ Reproduction EXACTE (mêmes paramètres)
✅ Comparaison automatique ligne par ligne
✅ Détection automatique du fix
✅ Pas besoin de créer un nouveau devis manuellement
✅ Résultat clair : FIXÉ ou PAS FIXÉ
