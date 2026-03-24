# 📋 Bris de Glaces (BG) - Capital Limits Documentation

## 🎯 Client Question Answered

**Question:** "où sont enregistrées, dans le système, les limites choisies par le client lors de l'établissement du devis (1000 / 2000 DT / 3000 DT) ?"

**Answer:**

### ❌ AVANT (Before):
- Les limites **n'étaient PAS enregistrées** dans la base de données
- Elles étaient **codées en dur** dans l'interface frontend
- **Impossible** de les gérer dynamiquement

### ✅ MAINTENANT (Now):
- Les limites sont **stockées dans la table `bg_capital_limits`**
- **Entièrement configurables** via l'interface admin
- **Même fonctionnement** que les franchises Tous Risques

---

## 📊 Architecture Implémentée

### 1. Table `bg_capital_limits`
```sql
CREATE TABLE bg_capital_limits (
  id          UUID PRIMARY KEY,
  value       DECIMAL(15,0) UNIQUE NOT NULL,  -- Capital en DT (1000, 2000, 3000...)
  label       TEXT,                            -- Label affiché (ex: "1,000 DT")
  description TEXT,                            -- Description (ex: "Couverture minimale")
  isStandard  BOOLEAN DEFAULT false,           -- Valeur standard recommandée
  isActive    BOOLEAN DEFAULT true,            -- Actif/Inactif
  createdAt   TIMESTAMP DEFAULT now(),
  updatedAt   TIMESTAMP DEFAULT now()
);
```

### 2. Valeurs par Défaut (Seed)
```
1,000 DT - Couverture minimale
2,000 DT - Couverture standard
3,000 DT - Couverture étendue
```

### 3. Tarification BG
**Actuellement (simplifié):**
- **Lloyd:** 6.5% pour tous les capitaux
- **Amana:** 7% pour tous les capitaux

**Formule:**
```
Prime BG = Capital × Taux × (1 - Réduction)
```

**Exemple:**
```
Capital: 2,000 DT
Taux Lloyd: 6.5%
Prime = 2,000 × 0.065 = 130 DT
```

---

## 🔧 Gestion Admin

### Endpoints API

#### 1. Lister toutes les limites
```http
GET /bg-capital-limits
Authorization: Bearer <admin_token>
```

**Réponse:**
```json
[
  {
    "id": "uuid",
    "value": 1000,
    "label": "1,000 DT",
    "description": "Couverture minimale",
    "isStandard": true,
    "isActive": true
  },
  ...
]
```

#### 2. Créer une nouvelle limite
```http
POST /bg-capital-limits
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "value": 5000,
  "label": "5,000 DT",
  "description": "Couverture premium",
  "isStandard": true
}
```

#### 3. Modifier une limite
```http
PATCH /bg-capital-limits/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "label": "5,000 DT (Recommandé)",
  "description": "Couverture premium pour véhicules haut de gamme"
}
```

#### 4. Désactiver une limite
```http
DELETE /bg-capital-limits/:id
Authorization: Bearer <admin_token>
```

#### 5. Réactiver une limite
```http
PATCH /bg-capital-limits/:id/reactivate
Authorization: Bearer <admin_token>
```

#### 6. Supprimer définitivement
```http
DELETE /bg-capital-limits/:id/permanent
Authorization: Bearer <admin_token>
```

---

## 📈 Évolution Future (Tarification par Tranches)

### Scénario: Ajouter des limites supérieures

**Si vous ajoutez des limites > 5,000 DT:**

1. **Ajouter les limites via l'interface admin:**
```json
POST /bg-capital-limits
{
  "value": 5000,
  "label": "5,000 DT",
  "description": "Couverture élevée"
}

POST /bg-capital-limits
{
  "value": 10000,
  "label": "10,000 DT",
  "description": "Couverture maximale"
}
```

2. **Configurer les règles de tarification par tranches:**

Via **Admin → Gestion de Tarification → Garanties → BG**:

**Lloyd:**
- Tranche 1: 0 - 5,000 DT → 6.5%
- Tranche 2: > 5,000 DT → 7%

**Amana:**
- Tranche 1: 0 - 5,000 DT → 7%
- Tranche 2: > 5,000 DT → 8%

**Le système appliquera automatiquement le bon taux selon le capital choisi.**

---

## 🔄 Flux Utilisateur

### 1. Client crée un devis
```
1. Sélectionne formule (Standard / DC / TR)
2. Sélectionne garanties optionnelles (dont BG)
3. Si BG sélectionné:
   → Choisit un capital parmi les limites disponibles (1k/2k/3k)
4. Système calcule la prime BG automatiquement
```

### 2. Stockage
```
Simulation.bgLimit = 2000  // Capital choisi par le client
```

### 3. Calcul de la prime
```
1. Récupère bgLimit de la simulation
2. Trouve la règle de tarification correspondante
3. Applique: Prime = bgLimit × taux
4. Ajoute au devis
```

---

## ⚠️ Notes Importantes

### 1. Tous Risques 0%
**BG est GRATUIT** si formule = Tous Risques 0%
```
Prime BG = 0 DT (inclus dans TR)
```

### 2. Validation
- Si client sélectionne BG mais **ne choisit pas de capital** → BG est **ignoré** (pas d'erreur)
- Si capital = 0 → BG est **ignoré**

### 3. Réductions Convention
Les réductions définies au niveau convention s'appliquent également à BG:
```
Prime finale = Prime BG × (1 - Réduction Convention)
```

---

## 📝 Audit Trail

Toutes les opérations sur `bg_capital_limits` sont **auditées**:
- Création
- Modification
- Désactivation
- Réactivation
- Suppression

**Table:** `audit_logs`
**Actions:**
- `BG_CAPITAL_LIMIT_CREATED`
- `BG_CAPITAL_LIMIT_UPDATED`
- `BG_CAPITAL_LIMIT_DEACTIVATED`
- `BG_CAPITAL_LIMIT_REACTIVATED`
- `BG_CAPITAL_LIMIT_DELETED`

---

## 🎯 Résumé

| Fonctionnalité | Statut | Description |
|----------------|--------|-------------|
| **Table BG Limits** | ✅ | Stockage des limites disponibles |
| **Admin CRUD** | ✅ | Gestion complète via API |
| **Valeurs par défaut** | ✅ | 1k, 2k, 3k DT |
| **Tarification simple** | ✅ | 1 taux par compagnie |
| **Tarification par tranches** | 🔄 | Prêt pour évolution future |
| **Audit complet** | ✅ | Toutes les modifications tracées |
| **Réductions convention** | ✅ | Supportées |

---

## 🚀 Pour Aller Plus Loin

### Ajouter des limites supérieures:
1. Créer les limites via l'interface admin (5k, 10k, etc.)
2. Configurer les règles de tarification par tranches
3. Le système appliquera automatiquement les bons taux

### Personnaliser par compagnie:
Actuellement, les limites sont **globales** (toutes les compagnies).
Si besoin de limites **spécifiques par compagnie**, nous pouvons ajouter:
```sql
ALTER TABLE bg_capital_limits ADD COLUMN companyId UUID REFERENCES companies(id);
```

---

**Date:** 2026-03-21
**Version:** 1.0
**Auteur:** Système ARS Insurance
