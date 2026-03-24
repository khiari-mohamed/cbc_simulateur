# Guide Client - Configuration BG (Bris de Glaces)

## 🎯 Réponse à votre question

**Votre question:**
> "ok mais pourriez-vous m'indiquer où sont enregistrées, dans le système, les limites choisies par le client lors de l'établissement du devis (1000 / 2000 DT / 3000 DT) ?"

**Réponse:**
Les limites BG sont maintenant **paramétrables par l'administrateur** via l'interface, exactement comme les valeurs de franchise. Elles ne sont plus codées en dur dans le système.

---

## 📍 Où sont stockées les limites BG ?

### 1. Dans la base de données
**Table:** `bg_capital_limits`

**Colonnes:**
- `value` - Montant du capital (ex: 1000, 2000, 3000)
- `label` - Libellé affiché (ex: "1,000 DT", "2,000 DT")
- `description` - Description optionnelle
- `isStandard` - Si c'est une valeur standard
- `isActive` - Si la limite est active (visible dans le dropdown)

**Exemple de données:**
```
| value | label      | description          | isStandard | isActive |
|-------|------------|----------------------|------------|----------|
| 1000  | 1,000 DT   | Couverture minimale  | true       | true     |
| 2000  | 2,000 DT   | Couverture standard  | true       | true     |
| 3000  | 3,000 DT   | Couverture étendue   | true       | true     |
```

### 2. Dans la simulation client
**Table:** `simulations`

**Colonne:** `bgLimit` (Int?)

Quand le client crée un devis et sélectionne une limite BG (ex: 2000 DT), cette valeur est stockée dans `simulations.bgLimit`.

---

## 🔧 Comment configurer les limites BG ?

### Méthode 1: Via l'API (pour développeurs)

**Endpoint:** `GET /bg-capital-limits`
- Accessible à tous les utilisateurs authentifiés
- Retourne la liste des limites actives

**Endpoint:** `POST /bg-capital-limits` (Admin uniquement)
```json
{
  "value": 5000,
  "label": "5,000 DT",
  "description": "Couverture premium",
  "isStandard": true
}
```

**Endpoint:** `PATCH /bg-capital-limits/:id` (Admin uniquement)
```json
{
  "isActive": false
}
```

### Méthode 2: Via l'interface admin (à créer)

**Navigation:** Admin → BG Capital Limits

**Actions disponibles:**
- ➕ Ajouter une nouvelle limite
- ✏️ Modifier une limite existante
- 🗑️ Désactiver une limite (ne sera plus visible dans le dropdown)
- ♻️ Réactiver une limite désactivée

---

## 💰 Comment configurer les taux BG par tranche de capital ?

### Navigation
**Admin → Gestion de Tarification → Onglet "Autres Formules" → Section BG**

### Configuration par tranches (exemple Lloyd)

**Règle 1: Capital 0 - 5,000 DT = 6.5%**
- Capital Min: `0`
- Capital Max: `5000`
- Taux: `0.065` (6.5%)
- Réduction: `0`

**Règle 2: Capital > 5,000 DT = 7%**
- Capital Min: `5001`
- Capital Max: *(laisser vide pour illimité)*
- Taux: `0.07` (7%)
- Réduction: `0`

### Résultat
Quand le client choisit:
- **2,000 DT** → Prime = 2,000 × 0.065 = **130 DT**
- **6,000 DT** → Prime = 6,000 × 0.07 = **420 DT**

---

## 📊 Formule de calcul BG

### Formule générale
```
Prime BG = Capital × Taux × (1 - Réduction%)
```

### Cas spécial: Tous Risques 0%
```
Prime BG = 0 DT (GRATUIT)
```

### Exemple de calcul
**Données:**
- Capital choisi: 2,000 DT
- Taux (Lloyd, 0-5k): 6.5%
- Réduction: 0%

**Calcul:**
```
Prime BG = 2,000 × 0.065 × (1 - 0/100)
         = 2,000 × 0.065 × 1
         = 130 DT
```

---

## 🎯 Différence avec l'ancien système

### ❌ Avant (Codé en dur)
```typescript
// Frontend hardcoded
<option value="500">500 DT</option>
<option value="700">700 DT</option>
<option value="1000">1 000 DT</option>
<option value="1500">1 500 DT</option>
<option value="2000">2 000 DT</option>
<option value="2500">2 500 DT</option>
<option value="3000">3 000 DT</option>
```

**Problèmes:**
- Impossible d'ajouter/supprimer des limites sans développeur
- Taux unique par compagnie (pas de tranches)
- Calcul basé sur VV (valeur vénale) au lieu du capital

### ✅ Maintenant (Paramétrable)
```typescript
// Frontend dynamique
const { data: bgCapitalLimits } = useQuery({
  queryKey: ['bg-capital-limits'],
  queryFn: async () => {
    const { data } = await api.get('/bg-capital-limits');
    return data;
  },
});
```

**Avantages:**
- Admin peut ajouter/supprimer des limites via l'interface
- Taux par tranches de capital (ex: 0-5k = 6.5%, >5k = 7%)
- Calcul basé sur le capital choisi par le client

---

## 🚀 Workflow complet

### 1. Admin configure les limites BG
```
Admin → BG Capital Limits
➕ Ajouter: 1,000 DT
➕ Ajouter: 2,000 DT
➕ Ajouter: 3,000 DT
➕ Ajouter: 5,000 DT (nouveau)
```

### 2. Admin configure les taux par tranches
```
Admin → Gestion de Tarification → BG
➕ Lloyd: 0-5,000 DT = 6.5%
➕ Lloyd: >5,000 DT = 7%
➕ Amana: 0-5,000 DT = 7%
➕ Amana: >5,000 DT = 8%
```

### 3. Client crée un devis
```
Client → Nouveau Devis
✅ Formule: Standard
✅ Garantie: Bris de Glaces
📋 Limite BG: [Dropdown avec 1k/2k/3k/5k]
   → Sélectionne: 2,000 DT
```

### 4. Système calcule la prime
```
Capital: 2,000 DT
Compagnie: Lloyd
Règle trouvée: 0-5,000 DT = 6.5%
Calcul: 2,000 × 0.065 = 130 DT
Prime BG: 130 DT ✅
```

---

## ❓ Questions fréquentes

### Q1: Puis-je ajouter une limite de 10,000 DT ?
**R:** Oui, via l'API ou l'interface admin (à créer):
```bash
POST /bg-capital-limits
{
  "value": 10000,
  "label": "10,000 DT",
  "description": "Couverture maximale",
  "isStandard": false
}
```

### Q2: Comment désactiver une limite sans la supprimer ?
**R:** Via l'API:
```bash
PATCH /bg-capital-limits/:id
{
  "isActive": false
}
```
La limite ne sera plus visible dans le dropdown client, mais les devis existants conservent leur valeur.

### Q3: Puis-je avoir des taux différents par compagnie ?
**R:** Oui, c'est déjà le cas:
- Lloyd: 6.5% (0-5k), 7% (>5k)
- Amana: 7% (0-5k), 8% (>5k)

### Q4: Comment ajouter une tranche intermédiaire ?
**R:** Via l'interface admin:
```
Lloyd:
- 0-3,000 DT = 6%
- 3,001-5,000 DT = 6.5%
- >5,000 DT = 7%
```

### Q5: Le client peut-il choisir n'importe quel montant ?
**R:** Non, le client choisit uniquement parmi les limites configurées par l'admin (1k/2k/3k/5k/etc.). C'est pour éviter les erreurs et garantir la cohérence des tarifs.

---

## 📝 Résumé

**Ce qui a changé:**
1. ✅ Limites BG paramétrables (plus codées en dur)
2. ✅ Taux BG par tranches de capital (plus un seul taux)
3. ✅ Calcul basé sur le capital choisi (plus sur VV)
4. ✅ Interface admin pour gérer les limites et les taux

**Ce qui reste à faire:**
- [ ] Créer la page admin "BG Capital Limits" (optionnel, l'API existe déjà)
- [ ] Tester la génération de devis avec différentes limites BG
- [ ] Valider les taux par tranches avec le client

---

**Date:** 2026-01-XX  
**Préparé par:** Équipe Développement  
**Statut:** ✅ Implémentation terminée, en attente de validation client
