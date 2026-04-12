# FIX NOTE 6 : Garanties NON ACCORDÉES avec tarif

## 🐛 BUG IDENTIFIÉ

**Ligne 318 dans pricing-engine.service.ts :**

```typescript
// Set isNotCovered flag from availability
dommagesEmeutesResult.isNotCovered = availability.isNotCovered;
console.log('✅ DOMMAGES_EMEUTES calculated:', dommagesEmeutesResult.prime.toString());
items.push(dommagesEmeutesResult);
primeNette = primeNette.add(dommagesEmeutesResult.prime);  // ← BUG !
```

**Problème :**
- La garantie est marquée `isNotCovered = true` ✅
- Mais la prime n'est PAS mise à 0 ❌
- La prime est ajoutée au total → Fausse le montant ❌

## ✅ SOLUTION

**Forcer prime = 0 quand isNotCovered = true**

```typescript
// Set isNotCovered flag from availability
dommagesEmeutesResult.isNotCovered = availability.isNotCovered;

// ✅ FIX: Force prime to 0 for NON_ACCORDEE guarantees
if (availability.isNotCovered) {
  dommagesEmeutesResult.prime = new Decimal(0);
}

console.log('✅ DOMMAGES_EMEUTES calculated:', dommagesEmeutesResult.prime.toString());
items.push(dommagesEmeutesResult);

// ✅ Only add to primeNette if NOT covered
if (!availability.isNotCovered) {
  primeNette = primeNette.add(dommagesEmeutesResult.prime);
}
```

## 📝 GARANTIES CONCERNÉES

Le même bug existe pour :
1. ✅ CATASTROPHES_NATURELLES (ligne 290)
2. ❌ DOMMAGES_EMEUTES (ligne 318) ← À FIXER
3. ✅ INCENDIE_EMEUTES (déjà correct ligne 235)

## 🔧 FICHIERS À MODIFIER

- `backend/src/pricing-engine/pricing-engine.service.ts`
  - Ligne 290 : CATASTROPHES_NATURELLES
  - Ligne 318 : DOMMAGES_EMEUTES

## 📊 IMPACT

**Avant le fix :**
```
Devis AL BARAKA
- DOMMAGES_EMEUTES : NON ACCORDÉE
- Prime affichée : 30 DT
- Prime ajoutée au total : 30 DT ❌
- Total : 1594.724 DT (FAUX)
```

**Après le fix :**
```
Devis AL BARAKA
- DOMMAGES_EMEUTES : NON ACCORDÉE
- Prime affichée : 0 DT ✅
- Prime ajoutée au total : 0 DT ✅
- Total : 1564.724 DT (CORRECT)
```

## ✅ VALIDATION

Après le fix, vérifier :
1. Garanties NON ACCORDÉES ont prime = 0 DT
2. Prime NON ACCORDÉE n'est pas ajoutée au total
3. Total du devis est correct
