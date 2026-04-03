# 🚀 System Role Implementation - Deployment Guide

## Overview
This deployment makes the guarantee system **fully dynamic** by introducing `systemRole` field. Admins can now use ANY guarantee code they want - the system finds guarantees by their role, not hardcoded codes.

---

## 📋 What Changed

### Before (Hardcoded)
```typescript
// ❌ System breaks if admin uses different code
const guarantee = await prisma.guarantee.findUnique({ 
  where: { code: 'INCENDIE' } 
});
```

### After (Dynamic with systemRole)
```typescript
// ✅ Works with ANY code - finds by role
const guarantee = await prisma.guarantee.findFirst({ 
  where: { systemRole: 'MANDATORY_INCENDIE', isActive: true } 
});
```

**Admin can now create:**
- Code: `INC` or `INCENDIE` or `FIRE_INSURANCE` ← Any code works!
- System Role: `MANDATORY_INCENDIE` ← System uses this to find it

---

## 🎯 Deployment Steps

### Step 1: Backup Production Database
```bash
# On production server
pg_dump -U postgres -d cbc_ars > backup_before_systemrole_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Deploy Backend Code
```bash
# On production server
cd /home/ars-simulator/backend

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate
```

### Step 3: Run Database Migration
```bash
# This adds systemRole field to guarantees table
npx prisma migrate deploy
```

### Step 4: Assign System Roles to Existing Guarantees
```bash
# Upload assign-system-roles-prod.ts to production
# Then run:
npx ts-node assign-system-roles-prod.ts
```

**Expected output:**
```
✅ RC                             → MANDATORY_RC
✅ VOL                            → MANDATORY_VOL
✅ INCENDIE                       → MANDATORY_INCENDIE
✅ CAS                            → MANDATORY_CAS
✅ PERSONNES_TRANSPORTEES         → MANDATORY_PERSONNES_TRANSPORTEES
✅ ASSISTANCE                     → MANDATORY_ASSISTANCE
✅ TOUS_RISQUES_ZERO              → OPTIONAL_TOUS_RISQUES
✅ DOMMAGES_COLLISIONS            → OPTIONAL_DOMMAGES_COLLISIONS
✅ BG                             → OPTIONAL_BRIS_GLACES
✅ CATASTROPHES_NATURELLES        → OPTIONAL_CATASTROPHES_NATURELLES
✅ DOMMAGES_EMEUTES               → OPTIONAL_DOMMAGES_EMEUTES
✅ INCENDIE_EMEUTES               → OPTIONAL_INCENDIE_EMEUTES
✅ DEFENSE_RECOURS                → OPTIONAL_DEFENSE_RECOURS
✅ ASSURANCE_CONDUCTEUR           → OPTIONAL_ASSURANCE_CONDUCTEUR
```

### Step 5: Restart Backend
```bash
pm2 restart backend
# or
npm run start:prod
```

### Step 6: Test Quote Generation
1. Create a new simulation
2. Generate quotes for all companies
3. Verify no "guarantee not found" errors

---

## 📊 System Roles Reference

### Mandatory Guarantees (Always Included)
| System Role | Description | Default Code |
|------------|-------------|--------------|
| `MANDATORY_RC` | Responsabilité Civile | RC |
| `MANDATORY_VOL` | Vol | VOL |
| `MANDATORY_INCENDIE` | Incendie | INCENDIE |
| `MANDATORY_CAS` | CAS / Défense et Recours | CAS |
| `MANDATORY_PERSONNES_TRANSPORTEES` | Personnes Transportées | PERSONNES_TRANSPORTEES |
| `MANDATORY_ASSISTANCE` | Assistance Remorquage | ASSISTANCE |

### Optional Guarantees (User Selects)
| System Role | Description | Default Code |
|------------|-------------|--------------|
| `OPTIONAL_TOUS_RISQUES` | Tous Risques 0% | TOUS_RISQUES_ZERO |
| `OPTIONAL_DOMMAGES_COLLISIONS` | Dommages Collision | DOMMAGES_COLLISIONS |
| `OPTIONAL_BRIS_GLACES` | Bris de Glaces | BG |
| `OPTIONAL_CATASTROPHES_NATURELLES` | Catastrophes Naturelles | CATASTROPHES_NATURELLES |
| `OPTIONAL_DOMMAGES_EMEUTES` | Dommages suite Émeutes | DOMMAGES_EMEUTES |
| `OPTIONAL_INCENDIE_EMEUTES` | Incendie suite Émeutes | INCENDIE_EMEUTES |
| `OPTIONAL_DEFENSE_RECOURS` | Défense et Recours | DEFENSE_RECOURS |
| `OPTIONAL_ASSURANCE_CONDUCTEUR` | Assurance Conducteur | ASSURANCE_CONDUCTEUR |

---

## ✅ Benefits

### For Admins
- ✅ **Flexibility**: Use ANY guarantee code (INC, INCENDIE, FIRE, etc.)
- ✅ **No Backend Changes**: Create new guarantees without touching code
- ✅ **Clear Roles**: System role shows what each guarantee does

### For System
- ✅ **Dynamic**: No hardcoded values
- ✅ **Maintainable**: Changes in one place (database)
- ✅ **Scalable**: Easy to add new guarantees

### For Users
- ✅ **Reliable**: No more "guarantee not found" errors
- ✅ **Consistent**: Works the same across all environments

---

## 🔧 Rollback Plan (If Needed)

If something goes wrong:

```bash
# 1. Restore database backup
psql -U postgres -d cbc_ars < backup_before_systemrole_YYYYMMDD_HHMMSS.sql

# 2. Revert code
git revert <commit-hash>

# 3. Restart backend
pm2 restart backend
```

---

## 📝 Admin Instructions

### Creating New Guarantees

**For Mandatory Guarantees (13 predefined roles):**
1. Go to Admin Panel → Guarantees
2. Click "Create Guarantee"
3. Fill in:
   - **Code**: Any code you want (e.g., `INC`, `INCENDIE`, `FIRE`)
   - **Name FR**: Display name (e.g., "Incendie")
   - **System Role**: Select from dropdown (e.g., `MANDATORY_INCENDIE`)
   - **Is Optional**: false
   - **Is Active**: true
4. Save

**For Optional Guarantees (New custom ones):**
1. Go to Admin Panel → Guarantees
2. Click "Create Guarantee"
3. Fill in:
   - **Code**: Any code you want (e.g., `PROTECTION_JURIDIQUE`)
   - **Name FR**: Display name
   - **System Role**: Leave empty (or select if available)
   - **Is Optional**: true
   - **Is Active**: true
4. Add pricing rules
5. Users can now select it!

---

## ⚠️ Important Notes

1. **System Roles are Unique**: Each role can only be assigned to ONE guarantee
2. **Mandatory Guarantees MUST Have Roles**: The 6 mandatory guarantees must have their system roles assigned
3. **Optional Guarantees Don't Need Roles**: New optional guarantees work without system roles
4. **Code Can Be Anything**: But use UPPERCASE_WITH_UNDERSCORES for consistency

---

## 🧪 Testing Checklist

- [ ] All guarantees have correct system roles assigned
- [ ] Create simulation with all formulas (STANDARD, DOMMAGES_COLLISIONS, TOUS_RISQUES_0)
- [ ] Generate quotes for Lloyd
- [ ] Generate quotes for Amana
- [ ] Verify no "guarantee not found" errors
- [ ] Check quote PDF generation
- [ ] Test optional guarantee selection
- [ ] Verify pricing calculations are correct

---

## 📞 Support

If you encounter issues:
1. Check logs: `pm2 logs backend`
2. Verify system roles: Run `assign-system-roles-prod.ts` again
3. Check database: `SELECT code, "systemRole", "isOptional", "isActive" FROM guarantees ORDER BY code;`

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Status**: ⬜ Success  ⬜ Rollback  
**Notes**: _____________
