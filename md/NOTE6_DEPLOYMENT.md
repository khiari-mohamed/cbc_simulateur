# 🚀 DÉPLOIEMENT FIX NOTE 6

## 📝 Résumé du fix

**Bug :** Les garanties NON ACCORDÉES avaient une prime > 0 qui était ajoutée au total du devis

**Fix :** Forcer prime = 0 pour toutes les garanties NON ACCORDÉES et ne pas les ajouter au total

**Fichier modifié :** `backend/src/pricing-engine/pricing-engine.service.ts`

---

## 🔧 ÉTAPES DE DÉPLOIEMENT

### 1️⃣ Sur ta machine locale (DEV)

```bash
# Vérifier que le fix est bien appliqué
cd d:\house_md\cbc\backend
git status

# Committer le fix
git add src/pricing-engine/pricing-engine.service.ts
git commit -m "fix(pricing): Force prime to 0 for NON_ACCORDEE guarantees (NOTE 6)"

# Pousser vers le repo
git push origin main
```

### 2️⃣ Sur le serveur PROD

```bash
# Se connecter au serveur
ssh arsadmin@arshosting

# Aller dans le dossier backend
cd /home/ars-simulator/backend

# Pull les dernières modifications
git pull origin main

# Rebuild l'application
npm run build

# Redémarrer le service
pm2 restart cbc-backend
# OU
pm2 restart all

# Vérifier que le service est bien démarré
pm2 status
pm2 logs cbc-backend --lines 50
```

### 3️⃣ Vérification post-déploiement

```bash
# Sur le serveur PROD, exécuter le script de vérification
cd /home/ars-simulator/backend/scripts
node investigate-note6.js
```

**Résultat attendu :**
```
✅ Aucun bug trouvé dans les devis récents
   Toutes les garanties NON ACCORDÉES ont une prime de 0 DT
```

---

## ⚠️ SI PAS DE GIT

Si le projet n'utilise pas Git, copier manuellement le fichier :

### Option A : SCP (depuis ta machine)

```bash
scp d:\house_md\cbc\backend\src\pricing-engine\pricing-engine.service.ts arsadmin@arshosting:/home/ars-simulator/backend/src/pricing-engine/
```

### Option B : Copier-coller manuel

1. Ouvrir le fichier local : `d:\house_md\cbc\backend\src\pricing-engine\pricing-engine.service.ts`
2. Sur le serveur : `nano /home/ars-simulator/backend/src/pricing-engine/pricing-engine.service.ts`
3. Remplacer le contenu
4. Sauvegarder (Ctrl+O, Enter, Ctrl+X)
5. Rebuild : `npm run build`
6. Restart : `pm2 restart cbc-backend`

---

## ✅ VALIDATION

### Test 1 : Créer un nouveau devis AL BARAKA avec DOMMAGES_EMEUTES

**Avant le fix :**
- Prime DOMMAGES_EMEUTES : 30 DT
- Total : 1594.724 DT (FAUX)

**Après le fix :**
- Prime DOMMAGES_EMEUTES : 0 DT
- Total : 1564.724 DT (CORRECT)

### Test 2 : Vérifier les anciens devis

Les anciens devis ne seront PAS modifiés (c'est normal).
Seuls les NOUVEAUX devis générés après le fix seront corrects.

---

## 📊 IMPACT

**Garanties concernées :**
- ✅ CATASTROPHES_NATURELLES
- ✅ DOMMAGES_EMEUTES
- ✅ INCENDIE_EMEUTES (déjà correct)

**Compagnies concernées :**
- AL BARAKA (principalement)
- Toute compagnie ayant des garanties NON ACCORDÉES

---

## 🎯 ROLLBACK (si problème)

Si le fix cause des problèmes :

```bash
# Sur le serveur PROD
cd /home/ars-simulator/backend
git revert HEAD
npm run build
pm2 restart cbc-backend
```

---

**Prêt à déployer ?** 🚀
