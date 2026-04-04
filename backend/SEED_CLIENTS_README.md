# Seed Script: Clients, Organizations & Conventions

## 📋 What This Script Creates

### Organizations (5)
1. **Tunisair** - Code: `ORG_TUNISAIR`, Join Key: `TUNISAIR2024`
2. **STEG** - Code: `ORG_STEG`, Join Key: `STEG2024`
3. **SNCFT** - Code: `ORG_SNCFT`, Join Key: `SNCFT2024`
4. **SONEDE** - Code: `ORG_SONEDE`, Join Key: `SONEDE2024`
5. **Banque Centrale de Tunisie** - Code: `ORG_BANQUE_CENTRALE`, Join Key: `BCT2024`

### Conventions (4)
1. **Convention Tunisair 2024** - Linked to: AMANA + LLOYD
2. **Convention STEG 2024** - Linked to: AMANA
3. **Convention SNCFT 2024** - Linked to: LLOYD
4. **Convention Banque Centrale 2024** - Linked to: AMANA + LLOYD

### Clients (9)

#### Tunisair (2 clients)
- ahmed.ben.ali@tunisair.tn - Ahmed Ben Ali
- fatma.trabelsi@tunisair.tn - Fatma Trabelsi

#### STEG (2 clients)
- mohamed.gharbi@steg.tn - Mohamed Gharbi
- salma.ben.salem@steg.tn - Salma Ben Salem

#### SNCFT (1 client)
- karim.jebali@sncft.tn - Karim Jebali

#### SONEDE (1 client - No Convention)
- amira.mansour@sonede.tn - Amira Mansour

#### Banque Centrale (1 client)
- youssef.ben.youssef@bct.gov.tn - Youssef Ben Youssef

#### Independent (2 clients - No Organization)
- nadia.hamdi@gmail.com - Nadia Hamdi
- rami.ben.amor@gmail.com - Rami Ben Amor

**All clients have the same password:** `password123`

## 🚀 How to Run

### Option 1: Using ts-node (Recommended)
```bash
cd backend
npx ts-node seed-clients-organizations.ts
```

### Option 2: Using npm script
Add to `package.json`:
```json
"scripts": {
  "seed:clients": "ts-node seed-clients-organizations.ts"
}
```

Then run:
```bash
npm run seed:clients
```

## 📝 Prerequisites

Make sure you have:
1. ✅ Database is running
2. ✅ Prisma migrations are applied (`npx prisma migrate dev`)
3. ✅ Companies exist (AMANA, LLOYD) - Run main `seed.ts` first if needed

## 🧪 Testing Scenarios

### Scenario 1: Client with Convention
- Login as: `ahmed.ben.ali@tunisair.tn`
- Organization: Tunisair
- Convention: Available (AMANA + LLOYD)
- Expected: Can create simulations with convention benefits

### Scenario 2: Client with Single Company Convention
- Login as: `mohamed.gharbi@steg.tn`
- Organization: STEG
- Convention: Available (AMANA only)
- Expected: Can only get quotes from AMANA with convention benefits

### Scenario 3: Client with Organization but No Convention
- Login as: `amira.mansour@sonede.tn`
- Organization: SONEDE
- Convention: None
- Expected: Standard pricing, no convention benefits

### Scenario 4: Independent Client
- Login as: `nadia.hamdi@gmail.com`
- Organization: None
- Convention: None
- Expected: Standard pricing, no organization/convention benefits

## 🔍 Verification Queries

After running the script, verify with these SQL queries:

```sql
-- Check organizations
SELECT * FROM client_organizations;

-- Check conventions
SELECT c.name, co.name as organization, cc.company_id 
FROM conventions c
JOIN client_organizations co ON c.organization_id = co.id
LEFT JOIN convention_companies cc ON c.id = cc.convention_id;

-- Check clients
SELECT u.email, u.first_name, u.last_name, co.name as organization
FROM users u
LEFT JOIN client_organizations co ON u.organization_id = co.id
WHERE u.role = 'CLIENT_ADHERENT'
ORDER BY co.name, u.email;

-- Check driver profiles
SELECT u.email, dp.experience_years
FROM driver_profiles dp
JOIN users u ON dp.user_id = u.id;
```

## 🔄 Re-running the Script

The script uses `upsert` operations, so it's safe to run multiple times:
- Existing records will be updated (not duplicated)
- New records will be created
- No data loss

## 🗑️ Cleanup (Optional)

To remove all seeded data:

```sql
-- Delete clients (will cascade to driver profiles)
DELETE FROM users WHERE email LIKE '%@tunisair.tn';
DELETE FROM users WHERE email LIKE '%@steg.tn';
DELETE FROM users WHERE email LIKE '%@sncft.tn';
DELETE FROM users WHERE email LIKE '%@sonede.tn';
DELETE FROM users WHERE email LIKE '%@bct.gov.tn';
DELETE FROM users WHERE email IN ('nadia.hamdi@gmail.com', 'rami.ben.amor@gmail.com');

-- Delete conventions
DELETE FROM conventions WHERE id LIKE 'conv-%';

-- Delete organizations
DELETE FROM client_organizations WHERE code LIKE 'ORG_%';
```

## 📞 Support

If you encounter any issues:
1. Check that companies (AMANA, LLOYD) exist
2. Verify database connection
3. Check Prisma schema is up to date
4. Review console output for specific errors

PS D:\house_md\cbc> cd backend
PS D:\house_md\cbc\backend> npx ts-node seed-clients-organizations.ts
🌱 Starting seed: Clients, Organizations & Conventions...

📋 Creating Organizations...
✅ Created: Tunisair
✅ Created: STEG
✅ Created: SNCFT
✅ Created: SONEDE
✅ Created: Banque Centrale de Tunisie

📜 Creating Conventions...
✅ Created: Convention Tunisair 2024
  → Linked to: AMANA, LLOYD
✅ Created: Convention STEG 2024
  → Linked to: AMANA
✅ Created: Convention SNCFT 2024
  → Linked to: LLOYD
✅ Created: Convention Banque Centrale 2024
  → Linked to: AMANA, LLOYD

👥 Creating Clients...
✅ Created: Ahmed Ben Ali (Tunisair)
✅ Created: Fatma Trabelsi (Tunisair)
✅ Created: Mohamed Gharbi (STEG)
✅ Created: Salma Ben Salem (STEG)
✅ Created: Karim Jebali (SNCFT)
✅ Created: Amira Mansour (SONEDE - No Convention)
✅ Created: Youssef Ben Youssef (Banque Centrale)
✅ Created: Nadia Hamdi (Independent - No Organization)
✅ Created: Rami Ben Amor (Independent - No Organization)

🚗 Creating Driver Profiles...
✅ Created driver profiles for all clients

📊 SUMMARY:
═══════════════════════════════════════════════════════
Organizations Created: 5
  • Tunisair (Convention: AMANA + LLOYD)
  • STEG (Convention: AMANA)
  • SNCFT (Convention: LLOYD)
  • SONEDE (No Convention)
  • Banque Centrale (Convention: AMANA + LLOYD)

Conventions Created: 4
  • Convention Tunisair 2024
  • Convention STEG 2024
  • Convention SNCFT 2024
  • Convention Banque Centrale 2024

Clients Created: 9
  • 2 clients in Tunisair
  • 2 clients in STEG
  • 1 client in SNCFT
  • 1 client in SONEDE
  • 1 client in Banque Centrale
  • 2 independent clients

Default Password: password123
═══════════════════════════════════════════════════════

✅ Seed completed successfully!
PS D:\house_md\cbc\backend> 