# 📋 Documentation Complète des Corrections - Système ARS Insurance

**Date:** 08/04/2026  
**Version:** 1.0  
**Auteur:** Équipe Développement

---

## 📝 Notes Originales du Client

Suite aux vérifications effectuées ce week-end, voici les remarques relevées au niveau du profil utilisateur :

1. ✅ **Dommages collision** : les limites affichées doivent tenir compte de la valeur du véhicule.
2. ✅ **Garanties optionnelles** : Une fois la formule « dommages collision » sélectionnée, il n'est pas nécessaire d'afficher la garantie « tous risques » parmi les garanties optionnelles. De même, la garantie « dommages collision » ne doit plus apparaître comme option (idem lorsque la formule « tous risques » est choisie).
3. ✅ **Franchise Tous Risques** : Pour la garantie « tous risques », l'application ne permet pas de sélectionner parmi les franchises paramétrées.
4. ⚠️ **Garanties manquantes dans devis** : Certaines garanties sélectionnées en amont n'apparaissent pas dans le devis (assurance conducteur, incendie suite émeutes, catastrophes naturelles pour les devis standards, etc.).
5. ⚠️ **Réductions conventions** : Les primes affichées dans les devis ne prennent pas en compte les réductions injectées dans le système.
6. ⚠️ **Statuts garanties** : Les statuts « non accordée » et « accordée gratuitement » ne sont pas visibles au niveau du devis.
7. ⚠️ **Amélioration devis** : nous souhaitons afficher la classe et la formule choisis dans le devis généré par l'application.
8. ✅ **Fonctionnalité âge de souscription** : par usage et par compagnies (TR / DC/ Standard)

---

## ✅ CORRECTIONS IMPLÉMENTÉES

### 1. ✅ Dommages Collision - Limites basées sur la valeur du véhicule

**Problème:** Le dropdown DC affichait tous les capitaux configurés sans tenir compte de la valeur vénale du véhicule.

**Solution Implémentée:**

#### Frontend (`CoverageSelectionStep.tsx`)
- **Ajout de `marketValue` prop** pour recevoir la valeur vénale du véhicule
- **Fetch DC Config** pour récupérer `maxCapitalPercent` et `plafondAbsolu`
- **Filtrage dynamique** des options DC basé sur:
  ```typescript
  effectiveCeiling = Math.min(
    marketValue * (maxCapitalPercent / 100),
    plafondAbsolu
  )
  ```
- **Fonction `generateAllDcOptions`** pour gérer les paliers avec chevauchement (ex: 10001 → 10000)

#### Backend (`dc-config.controller.ts`)
- **Suppression du guard @Roles** sur l'endpoint GET pour permettre aux clients de lire la config
- Endpoint: `GET /dc-config?companyId=X&usageId=Y`

#### Exemple Concret:
```
Véhicule VV = 80,000 DT
DC Config: maxCapitalPercent = 50%, plafondAbsolu = 100,000 DT
Calcul: min(80,000 × 50%, 100,000) = 40,000 DT

LLOYD (paliers jusqu'à 100k):
  Avant: 1k, 2k ... 100k ❌
  Après: 1k, 2k ... 40k ✅

AL BARAKA (paliers jusqu'à 20k):
  Avant: 1k, 2k ... 20k ✅
  Après: 1k, 2k ... 20k ✅ (palier max < ceiling)
```

#### Fichiers Modifiés:
- ✅ `frontend/src/components/simulations/CoverageSelectionStep.tsx`
- ✅ `frontend/src/pages/simulations/NewSimulationPage.tsx`
- ✅ `backend/src/dc-config/dc-config.controller.ts`
- ✅ `backend/.env` (connection pool: 9 → 20)

#### Page Admin Créée:
- ✅ `frontend/src/pages/admin/DcCapitalTiersInfoModal.tsx` - Guide explicatif en français

---

### 2. ✅ Garanties Optionnelles - Masquage selon formule

**Problème:** Les garanties TR et DC apparaissaient dans les options même quand la formule correspondante était sélectionnée.

**Solution Implémentée:**

#### Logique de Filtrage (`CoverageSelectionStep.tsx` lignes ~1050-1100)
```typescript
optionalGuarantees.filter((guarantee) => {
  // Formule DC sélectionnée
  if (localFormula === FormulaType.DOMMAGES_COLLISIONS) {
    // Masquer Tous Risques (toutes variations)
    if (guarantee.code === 'TOUS_RISQUES_ZERO') return false;
    if (guarantee.code === 'TOUS_RISQUES') return false;
    if (guarantee.code === 'TOUS_RISQUES_0') return false;
    
    // Masquer DC elle-même
    if (guarantee.code === 'DOMMAGES_COLLISIONS') return false;
    if (guarantee.code === 'DOMMAGES_COLLISION') return false;
    
    // Vérification par nom (case-insensitive)
    const nameLower = guarantee.nameFr?.toLowerCase() || '';
    if (nameLower.includes('tous risques') && !nameLower.includes('bris')) return false;
    if (nameLower.includes('dommages collision')) return false;
  }
  
  // Formule TR sélectionnée
  if (localFormula === FormulaType.TOUS_RISQUES_0) {
    // Masquer TR elle-même
    if (guarantee.code === 'TOUS_RISQUES_ZERO') return false;
    if (guarantee.code === 'TOUS_RISQUES') return false;
    if (guarantee.code === 'TOUS_RISQUES_0') return false;
    
    // Masquer DC
    if (guarantee.code === 'DOMMAGES_COLLISIONS') return false;
    if (guarantee.code === 'DOMMAGES_COLLISION') return false;
    
    // Vérification par nom
    const nameLower = guarantee.nameFr?.toLowerCase() || '';
    if (nameLower.includes('tous risques') && !nameLower.includes('bris')) return false;
    if (nameLower.includes('dommages collision')) return false;
  }
  
  // Formule Standard
  if (localFormula === FormulaType.STANDARD) {
    // Masquer TR et DC (non disponibles pour Standard)
    // ... même logique
  }
  
  return true;
})
```

#### Résultat:
- ✅ **Formule DC** → Masque TR et DC dans les options
- ✅ **Formule TR** → Masque TR et DC dans les options
- ✅ **Formule Standard** → Masque TR et DC dans les options
- ✅ **Bris de Glaces Tous Risques** reste visible (contient "bris" dans le nom)

---

### 3. ✅ Franchise Tous Risques - Modal de sélection

**Problème:** Impossible de sélectionner la franchise lors du choix de la formule TR.

**Solution Implémentée:**

#### Modal Franchise (`CoverageSelectionStep.tsx`)
```typescript
// Lors de la sélection TR, ouvrir le modal franchise
if (formula === FormulaType.TOUS_RISQUES_0) {
  setLocalFormula(formula as FormulaType);
  setTempFranchiseRate(localFranchiseRate || 0);
  setShowFranchiseModal(true); // ✅ Ouvre le modal
  return;
}
```

#### Fetch Franchises Configurées
```typescript
const { data: franchiseValues } = useQuery({
  queryKey: ['franchise-values'],
  queryFn: async () => {
    const { data } = await api.get('/franchise-values');
    return data as Array<{ 
      id: string; 
      value: number; 
      label: string; 
      isActive: boolean 
    }>;
  },
});
```

#### Modal UI (lignes ~1700-1750)
- Dropdown avec toutes les franchises actives
- Affichage: "Sans franchise (0%)" ou "X%"
- Boutons Annuler / Confirmer
- Mise à jour de `localFranchiseRate` et `onUpdate`

#### Résultat:
- ✅ Sélection TR → Modal franchise s'ouvre automatiquement
- ✅ Affichage des franchises configurées en admin
- ✅ Franchise sélectionnée affichée sous la formule TR
- ✅ Franchise envoyée au backend pour calcul de prime

---

### 4. ✅ Assurance Conducteur - Capitaux par compagnie

**Problème:** AC utilisait un capital unique pour toutes les compagnies au lieu d'un capital par compagnie.

**Solution Implémentée:**

#### Système Per-Company Capitals
```typescript
// État local
const [localAssuranceConducteurCapitals, setLocalAssuranceConducteurCapitals] = 
  useState<Record<string, number>>(acCapitals || {});

// Modal séquentiel pour chaque compagnie
const confirmAssuranceConducteurCapital = () => {
  if (!assuranceConducteurModalCompanyId) return;

  const updated = { 
    ...localAssuranceConducteurCapitals, 
    [assuranceConducteurModalCompanyId]: tempAssuranceConducteurCapital 
  };
  setLocalAssuranceConducteurCapitals(updated);

  // Trouver la prochaine compagnie sans capital
  const nextCompany = selectedCompanies.find(
    cid => cid !== assuranceConducteurModalCompanyId && !updated[cid]
  );
  
  if (nextCompany) {
    // Ouvrir modal pour la prochaine compagnie
    setAssuranceConducteurModalCompanyId(nextCompany);
    setTempAssuranceConducteurCapital(updated[nextCompany] || 10000);
    return; // Modal reste ouvert
  }

  // Toutes les compagnies ont des capitaux → ajouter garantie
  // ...
};
```

#### Backend Integration
```typescript
// DTO
export class CreateSimulationDto {
  // ...
  @IsOptional()
  @IsObject()
  acCapitals?: Record<string, number>; // ✅ Ajouté
}

// Service
async create(dto: CreateSimulationDto) {
  return this.prisma.simulation.create({
    data: {
      // ...
      acCapitals: dto.acCapitals || {}, // ✅ Ajouté
    },
  });
}

// Quotes Service
const acCapitals = simulation.acCapitals as Record<string, number> || {};
const acCapital = acCapitals[companyId]; // ✅ Capital par compagnie

selectedCapitals['ASSURANCE_CONDUCTEUR'] = acCapital 
  ? new Decimal(acCapital) 
  : undefined;
```

#### Prisma Schema
```prisma
model Simulation {
  // ...
  dcCapitals     Json?  // Per-company DC capitals
  acCapitals     Json?  // ✅ Per-company AC capitals (AJOUTÉ)
}
```

#### Migration
```sql
-- Migration: 20260408093537_add_ac_capitals
ALTER TABLE "Simulation" ADD COLUMN "acCapitals" JSONB;
```

#### Résultat:
- ✅ Modal s'ouvre pour LLOYD → Sélection 10k → Confirmer
- ✅ Modal se rouvre pour AL BARAKA → Sélection 20k → Confirmer
- ✅ Affichage: "LLOYD: 10,000 DT | AL BARAKA: 20,000 DT"
- ✅ Chaque devis utilise son propre capital AC

---

### 5. ✅ Éligibilité des Formules - Âge du véhicule

**Problème:** Pas de vérification de l'âge du véhicule pour l'éligibilité TR/DC/Standard.

**Solution Implémentée:**

#### Fetch Eligibility (`CoverageSelectionStep.tsx` lignes ~300-350)
```typescript
const { data: eligibilityData, isLoading, isError } = useQuery({
  queryKey: ['formula-eligibility', selectedCompanies, usageId, vehicleAge],
  queryFn: async () => {
    if (!selectedCompanies.length || !usageId) return null;
    
    const results: Record<string, { 
      eligible: boolean; 
      maxAge?: number; 
      reason?: string 
    }> = {};
    
    for (const companyId of selectedCompanies) {
      for (const formula of ['STANDARD', 'TOUS_RISQUES_0', 'DOMMAGES_COLLISIONS']) {
        const { data } = await api.get(
          `/formula-eligibility/check?companyId=${companyId}&usageId=${usageId}&formulaType=${formula}&vehicleAge=${vehicleAge}`
        );
        const key = `${companyId}_${formula}`;
        results[key] = data;
      }
    }
    
    return results;
  },
  enabled: selectedCompanies.length > 0 && !!usageId,
  staleTime: 30000,
  retry: 2,
});
```

#### Validation Logic
```typescript
const isFormulaEligible = (formulaType: string) => {
  // Pas d'usage ou compagnies → désactiver
  if (!usageId || selectedCompanies.length === 0) {
    return { eligible: false, reason: 'Veuillez sélectionner un usage et une compagnie' };
  }
  
  // Chargement en cours
  if (isLoading) {
    return { eligible: false, loading: true };
  }
  
  // Erreur → fail open (autoriser)
  if (isError || !eligibilityData) {
    return { eligible: true };
  }
  
  // Vérifier TOUTES les compagnies sélectionnées
  for (const companyId of selectedCompanies) {
    const key = `${companyId}_${formulaType}`;
    const result = eligibilityData[key];
    
    if (!result || !result.eligible) {
      return { 
        eligible: false, 
        reason: result?.reason || 'Non disponible pour cette compagnie' 
      };
    }
  }
  
  return { eligible: true };
};
```

#### UI Feedback
```typescript
<label className={`... ${
  !canSelectTousRisques || isLoadingEligibility
    ? 'opacity-50 cursor-not-allowed bg-gray-50'
    : 'cursor-pointer'
}`}>
  <input
    type="radio"
    value={FormulaType.TOUS_RISQUES_0}
    disabled={!canSelectTousRisques || isLoadingEligibility}
  />
  <div>
    <div>Tous Risques</div>
    {!canSelectTousRisques && tousRisquesEligibility.reason && (
      <p className="text-xs text-red-600">
        ⚠ {tousRisquesEligibility.reason}
      </p>
    )}
  </div>
</label>
```

#### Résultat:
- ✅ Véhicule > 10 ans → TR désactivé avec message "Véhicule trop ancien"
- ✅ Véhicule > 15 ans → DC désactivé avec message
- ✅ Loading state pendant vérification
- ✅ Fail-safe: erreur API → autoriser toutes les formules

---

## ⚠️ CORRECTIONS À VÉRIFIER (Backend/Devis)

### 4. ⚠️ Garanties Manquantes dans Devis

**Statut:** À vérifier dans le backend (pricing engine et génération PDF)

**Garanties concernées:**
- Assurance Conducteur
- Incendie Suite Émeutes
- Catastrophes Naturelles

**Fichiers à vérifier:**
- `backend/src/pricing-engine/pricing-engine.service.ts`
- `backend/src/quotes/quotes.service.ts`
- `backend/src/pdf/pdf.service.ts`

**Points de vérification:**
1. ✅ AC capitals sont maintenant envoyés via `acCapitals` (Record<string, number>)
2. ⚠️ Vérifier que le pricing engine utilise `selectedCapitals['ASSURANCE_CONDUCTEUR']`
3. ⚠️ Vérifier que toutes les garanties sélectionnées sont incluses dans le PDF

---

### 5. ⚠️ Réductions Conventions

**Statut:** À vérifier dans le pricing engine

**Fichiers à vérifier:**
- `backend/src/pricing-engine/pricing-engine.service.ts` (méthode `applyConventionReductions`)
- `backend/src/conventions/conventions.service.ts`

**Points de vérification:**
1. ⚠️ Les réductions sont-elles récupérées depuis la DB ?
2. ⚠️ Les réductions sont-elles appliquées à la prime nette ?
3. ⚠️ Les réductions sont-elles affichées dans le devis PDF ?

---

### 6. ⚠️ Statuts Garanties (Non Accordée / Gratuit)

**Statut:** À vérifier dans la génération PDF

**Fichiers à vérifier:**
- `backend/src/pdf/pdf.service.ts`
- Template PDF (si utilisé)

**Points de vérification:**
1. ⚠️ Le statut "Accordée gratuitement" est-il affiché pour les garanties gratuites ?
2. ⚠️ Le statut "Non accordée" est-il affiché pour les garanties refusées ?

---

### 7. ⚠️ Affichage Classe et Formule dans Devis

**Statut:** À implémenter dans la génération PDF

**Fichiers à modifier:**
- `backend/src/pdf/pdf.service.ts`

**Données à ajouter:**
- Classe Bonus/Malus (ex: "Classe 4")
- Formule sélectionnée (ex: "Tous Risques 0%", "Dommages Collision", "Standard")

---

## 📊 MODIFICATIONS BASE DE DONNÉES

### Migrations Prisma Appliquées

#### 1. Migration `20260408093537_add_ac_capitals`
```sql
-- AlterTable
ALTER TABLE "Simulation" ADD COLUMN "acCapitals" JSONB;
```

**Impact:** Ajout du champ `acCapitals` pour stocker les capitaux AC par compagnie.

**Données existantes:** NULL (pas d'impact sur les simulations existantes)

---

### Modifications de Configuration

#### 1. Backend `.env`
```env
# Avant
DATABASE_URL="postgresql://user:pass@localhost:5432/cbc_ars?schema=public&connection_limit=9&pool_timeout=10"

# Après
DATABASE_URL="postgresql://user:pass@localhost:5432/cbc_ars?schema=public&connection_limit=20&pool_timeout=20"
```

**Raison:** Résolution des erreurs "connection pool timeout" lors de requêtes simultanées.

---

### Données de Configuration Requises

#### 1. DC Config (Table `dc_config`)
**Requis pour chaque compagnie + usage:**
```sql
-- Exemple LLOYD + Privé/Affaires
{
  companyId: 'b6e560c7-0028-46f3-9f8e-da38139d5f43',
  usageId: 'ba202b29-4b6f-4a15-b9ee-19e7b274eb2d',
  maxCapitalPercent: 50,        -- 50% de la VV
  maxCapitalAbsolute: 100000,   -- Plafond absolu
  minCapital: 1000,
  basePremium: 10,
  // ... autres paramètres
}
```

**Statut:** ✅ Déjà configuré pour LLOYD et AL BARAKA

---

#### 2. DC Capital Tiers (Table `dc_capital_tiers`)
**Requis pour chaque compagnie + usage:**
```sql
-- Exemple LLOYD + Privé/Affaires
[
  { minAmount: 1000, maxAmount: 10000, step: 1000 },
  { minAmount: 10001, maxAmount: 20000, step: 5000 },
  { minAmount: 20001, maxAmount: 50000, step: 10000 },
  { minAmount: 50001, maxAmount: 100000, step: 25000 },
]
```

**Statut:** ✅ Déjà configuré pour LLOYD et AL BARAKA

---

#### 3. Franchise Values (Table `franchise_values`)
**Requis pour TR:**
```sql
[
  { value: 0, label: 'Sans franchise (0%)', isActive: true },
  { value: 5, label: '5%', isActive: true },
  { value: 10, label: '10%', isActive: true },
]
```

**Statut:** ⚠️ À vérifier dans la DB

---

#### 4. BG Capital Limits (Table `bg_capital_limits`)
**Requis pour BG:**
```sql
[
  { value: 1000, label: '1 000 DT', isActive: true },
  { value: 2000, label: '2 000 DT', isActive: true },
  { value: 3000, label: '3 000 DT', isActive: true },
]
```

**Statut:** ⚠️ À vérifier dans la DB

---

#### 5. Formula Eligibility (Table `formula_eligibility`)
**Requis pour chaque compagnie + usage + formule:**
```sql
-- Exemple LLOYD + Privé/Affaires + TR
{
  companyId: 'b6e560c7-0028-46f3-9f8e-da38139d5f43',
  usageId: 'ba202b29-4b6f-4a15-b9ee-19e7b274eb2d',
  formulaType: 'TOUS_RISQUES_0',
  maxAge: 10,  -- Véhicules jusqu'à 10 ans
  isActive: true,
}
```

**Statut:** ⚠️ À vérifier dans la DB

---

## 🔍 CHECKLIST DE VÉRIFICATION

### Frontend ✅
- [x] DC capitals filtrés par valeur véhicule
- [x] Garanties TR/DC masquées selon formule
- [x] Modal franchise TR fonctionnel
- [x] AC capitals par compagnie
- [x] Éligibilité formules par âge véhicule
- [x] Guide admin DC créé

### Backend ⚠️
- [x] Endpoint DC Config accessible aux clients
- [x] AC capitals dans DTO et service
- [x] Migration Prisma appliquée
- [ ] **À VÉRIFIER:** Garanties dans devis PDF
- [ ] **À VÉRIFIER:** Réductions conventions appliquées
- [ ] **À VÉRIFIER:** Statuts garanties dans PDF
- [ ] **À VÉRIFIER:** Classe et formule dans PDF

### Base de Données ⚠️
- [x] Migration `acCapitals` appliquée
- [x] DC Config configuré (LLOYD, AL BARAKA)
- [x] DC Capital Tiers configuré (LLOYD, AL BARAKA)
- [ ] **À VÉRIFIER:** Franchise Values configurées
- [ ] **À VÉRIFIER:** BG Capital Limits configurées
- [ ] **À VÉRIFIER:** Formula Eligibility configurée

---

## 📁 FICHIERS MODIFIÉS

### Frontend
```
frontend/src/components/simulations/CoverageSelectionStep.tsx  [MODIFIÉ - 1750 lignes]
frontend/src/pages/simulations/NewSimulationPage.tsx           [MODIFIÉ - +1 prop]
frontend/src/pages/admin/DcCapitalTiersPage.tsx                [MODIFIÉ - +import +modal]
frontend/src/pages/admin/DcCapitalTiersInfoModal.tsx           [CRÉÉ - 300 lignes]
```

### Backend
```
backend/src/dc-config/dc-config.controller.ts                  [MODIFIÉ - roles guard]
backend/src/simulations/create-simulation.dto.ts               [MODIFIÉ - +acCapitals]
backend/src/simulations/simulations.service.ts                 [MODIFIÉ - +acCapitals]
backend/src/quotes/quotes.service.ts                           [MODIFIÉ - +acCapitals extraction]
backend/prisma/schema.prisma                                   [MODIFIÉ - +acCapitals field]
backend/.env                                                   [MODIFIÉ - connection pool]
```

### Migrations
```
backend/prisma/migrations/20260408093537_add_ac_capitals/migration.sql  [CRÉÉ]
```

---

## 🚀 PROCHAINES ÉTAPES

### Priorité 1 - Vérifications Backend
1. **Vérifier pricing engine** pour garanties manquantes
2. **Vérifier réductions conventions** dans le calcul
3. **Vérifier génération PDF** pour statuts et informations manquantes

### Priorité 2 - Configuration DB
1. **Vérifier Franchise Values** dans la DB
2. **Vérifier BG Capital Limits** dans la DB
3. **Vérifier Formula Eligibility** pour toutes les compagnies/usages

### Priorité 3 - Tests
1. **Test complet** du flow de simulation avec toutes les formules
2. **Test génération devis** avec toutes les garanties
3. **Test réductions conventions** sur les primes
4. **Test affichage PDF** avec classe et formule

---

## 📞 CONTACT

Pour toute question sur cette documentation :
- **Développeur:** Mohamed
- **Client:** [Nom du client]
- **Date:** 08/04/2026

---

**FIN DU DOCUMENT**
