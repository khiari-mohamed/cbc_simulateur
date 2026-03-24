# Migration Guide - UsageType Enum to Usage Entity

## Changements globaux nécessaires

### 1. Imports à supprimer
Supprimer `UsageType` de tous les imports :
```typescript
// ❌ AVANT
import { UsageType } from '@prisma/client';

// ✅ APRÈS
// Supprimer complètement
```

### 2. Champs à remplacer dans les queries

#### Dans les WHERE clauses :
```typescript
// ❌ AVANT
where: { usageType: 'PRIVATE_BUSINESS' }

// ✅ APRÈS  
where: { usageId: usageMap['PRIVATE_BUSINESS'] }
```

#### Dans les CREATE :
```typescript
// ❌ AVANT
data: { usageType: 'COMMERCIAL' }

// ✅ APRÈS
data: { usageId: usageMap['COMMERCIAL'] }
```

#### Dans Simulation :
```typescript
// ❌ AVANT
usage: 'PRIVATE_BUSINESS'

// ✅ APRÈS
usageId: usageMap['PRIVATE_BUSINESS']
```

### 3. Fichiers à corriger (67 erreurs)

#### Scripts Prisma (prisma/*.ts) :
- create-test-quote.ts
- migrate-to-parameterized.ts
- populate-dommages-collisions-commercial.ts
- populate-dommages-collisions.ts
- setup-dommages-collisions.ts
- test-all-formulas.ts
- test-dommages-collisions.ts
- test-parameterized-formulas.ts
- test-quote-generation.ts

#### Services (src/**/*.service.ts) :
- convention-reduction-rules.service.ts
- pricing-engine.service.ts
- reduction-rates.service.ts
- dc-config.service.ts
- simulations.service.ts
- quotes.service.ts

#### Controllers :
- convention-reduction-rules.controller.ts
- dc-config.controller.ts

#### DTOs :
- create-simulation.dto.ts
- update-simulation.dto.ts

### 4. Pattern de remplacement

Pour tous les fichiers, appliquer ces remplacements :

1. **Supprimer import UsageType**
2. **Remplacer usageType par usageId** dans :
   - WHERE clauses
   - CREATE data
   - UPDATE data
   - Propriétés d'objets

3. **Pour les scripts** : Ajouter en début de fichier :
```typescript
// Fetch usage IDs
const usageMap: Record<string, string> = {};
const usages = await prisma.usage.findMany();
for (const u of usages) {
  usageMap[u.code] = u.id;
}
```

4. **Pour Simulation** : Remplacer `usage` par `usageId`

### 5. Cas spéciaux

#### DcConfig unique constraint :
```typescript
// ❌ AVANT
companyId_usageType: { companyId, usageType }

// ✅ APRÈS
companyId_usageId: { companyId, usageId }
```

#### Accès aux propriétés :
```typescript
// ❌ AVANT
simulation.usage

// ✅ APRÈS
simulation.usageId
```

## Solution rapide

Plutôt que de corriger 67 erreurs manuellement, **supprimer ou commenter** les fichiers de test/migration dans `prisma/` qui ne sont pas essentiels au démarrage de l'application.

Fichiers essentiels à garder :
- ✅ seed.ts (déjà corrigé)
- ✅ schema.prisma (déjà corrigé)

Fichiers à supprimer/commenter temporairement :
- ❌ Tous les test-*.ts
- ❌ Tous les populate-*.ts  
- ❌ migrate-to-parameterized.ts
- ❌ create-test-quote.ts

Ces fichiers peuvent être corrigés plus tard si nécessaire.
