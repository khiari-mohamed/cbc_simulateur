# Test du Seed - Instructions

## Lancer le seed complet

```bash
cd backend
npm run prisma:seed
```

## Ce qui devrait se passer

```
🌱 Seeding database (CDC exact)...
🧹 Purging existing data...
✅ Users created: { admin: 'admin@ars.com', gestionnaire: 'gestionnaire@ars.com', client: 'client@test.com' }
✅ Companies created: Lloyd Tunisien Assurances Amana
✅ Guarantees created
✅ Pricing rules created
🔎 Running CDC validations...
✅ RC rules count = 80
✅ TR 0% (LLOYD) OK
✅ BG LLOYD 6.5%
✅ BG AMANA 7%
✅ PTA LLOYD 5k=21
✅ PTA AMANA 8k=64
✅ CAS LLOYD 45
✅ CAS AMANA 20
✅ Incendie Suite Émeutes LLOYD 15
✅ Incendie Suite Émeutes AMANA absent
✅ CAT NAT AMANA 40 (TR only)
✅ CAT NAT LLOYD absent
✅ DC COMMERCIAL sample OK (656.7)
🎉 Seeding completed!
📝 Test Credentials:
   Admin: admin@ars.com / admin123
   Gestionnaire: gestionnaire@ars.com / gestionnaire123
   Client: client@test.com / client123
```

## Après le seed, vérifier

```bash
# 1. Lancer le diagnostic
npx ts-node diagnose-system.ts

# Devrait afficher:
# ✅ Toutes les garanties requises existent
# ✅ Toutes les compagnies ont les règles obligatoires

# 2. Démarrer l'application
npm run start:dev

# 3. Tester dans le navigateur
# - Se connecter: admin@ars.com / admin123
# - Créer un devis
# - Vérifier qu'il n'y a plus d'erreur "CAS pricing rule not found"
```

## Si erreur pendant le seed

Vérifiez que:
1. PostgreSQL est démarré
2. La base de données existe
3. Le fichier .env contient DATABASE_URL correct
