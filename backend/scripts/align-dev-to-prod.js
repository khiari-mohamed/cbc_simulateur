// scripts/align-dev-to-prod.js
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function alignDevToProd() {
  console.log('🔄 ALIGNEMENT DEV → PROD pour AL BARAKA\n');

  const companyName = 'AL BARAKA';
  const usageName = 'Privé/Affaires';

  const company = await prisma.company.findFirst({ where: { name: companyName } });
  const usage = await prisma.usage.findFirst({ where: { nameFr: usageName } });

  if (!company || !usage) {
    console.error('❌ Compagnie ou usage non trouvé');
    process.exit(1);
  }

  console.log(`✅ Compagnie: ${company.name} (ID: ${company.id})`);
  console.log(`✅ Usage: ${usage.nameFr} (ID: ${usage.id})\n`);

  // 1. Vérifier si la tranche existe déjà
  let newRange = await prisma.dcMatrixVvRange.findFirst({
    where: {
      companyId: company.id,
      usageId: usage.id,
      minVv: 50001,
      isActive: true
    }
  });

  if (!newRange) {
    console.log('📊 Ajout de la tranche VV 50001-null...');
    newRange = await prisma.dcMatrixVvRange.create({
      data: {
        companyId: company.id,
        usageId: usage.id,
        minVv: 50001,
        maxVv: null,
        reductionRate: null,
        isActive: true
      }
    });
    console.log(`   ✅ Tranche créée (ID: ${newRange.id})\n`);
  } else {
    console.log(`📊 Tranche 50001-null existe déjà (ID: ${newRange.id})\n`);
  }

  // 2. Récupérer tous les capitaux
  const capitals = await prisma.dcMatrixCapital.findMany({
    where: { companyId: company.id, usageId: usage.id, isActive: true },
    orderBy: { order: 'asc' }
  });

  console.log(`💰 ${capitals.length} capitaux trouvés\n`);

  // 3. Créer les prix pour la nouvelle tranche
  console.log('💵 Création des prix pour la tranche 50001-null...');
  const prices = [
    { capital: 1000, prime: 70 },
    { capital: 2000, prime: 120 },
    { capital: 3000, prime: 210 },
    { capital: 4000, prime: 280 },
    { capital: 5000, prime: 350 },
    { capital: 6000, prime: 420 },
    { capital: 8000, prime: 560 },
    { capital: 10000, prime: 700 },
    { capital: 15000, prime: 1050 },
    { capital: 20000, prime: 1400 },
    { capital: 25000, prime: 1750 }
  ];

  let createdCount = 0;
  for (const priceData of prices) {
    const capital = capitals.find(c => c.amount.toNumber() === priceData.capital);
    if (!capital) {
      console.log(`   ⚠️ Capital ${priceData.capital} non trouvé`);
      continue;
    }

    // Vérifier si le prix existe déjà
    const existing = await prisma.dcMatrixPrice.findFirst({
      where: {
        vvRangeId: newRange.id,
        capitalId: capital.id
      }
    });

    if (existing) {
      console.log(`   ⏭️ Prix existe déjà: Capital ${priceData.capital} → Prime ${existing.prime}`);
      continue;
    }

    try {
      await prisma.dcMatrixPrice.create({
        data: {
          companyId: company.id,
          usageId: usage.id,
          vvRangeId: newRange.id,
          capitalId: capital.id,
          prime: priceData.prime
        }
      });
      console.log(`   ✅ Prix créé: Capital ${priceData.capital} → Prime ${priceData.prime}`);
      createdCount++;
    } catch (error) {
      console.log(`   ❌ Erreur création prix ${priceData.capital}: ${error.message}`);
    }
  }

  console.log(`\n✅ ${createdCount} prix créés!\n`);
  console.log('🔍 Vérification finale...\n');

  // Vérification
  const ranges = await prisma.dcMatrixVvRange.findMany({
    where: { companyId: company.id, usageId: usage.id, isActive: true },
    orderBy: { minVv: 'asc' }
  });

  const totalPrices = await prisma.dcMatrixPrice.count({
    where: {
      vvRange: { companyId: company.id, usageId: usage.id },
      capital: { companyId: company.id, usageId: usage.id }
    }
  });

  console.log(`📊 Tranches VV: ${ranges.length}`);
  ranges.forEach(r => console.log(`   ${r.minVv} - ${r.maxVv}`));
  console.log(`\n💵 Total prix configurés: ${totalPrices}`);
  
  if (totalPrices === 39) {
    console.log('\n✅ DEV est maintenant aligné avec PROD!');
  } else {
    console.log(`\n⚠️ DEV a ${totalPrices} prix, PROD en a 39. Différence: ${39 - totalPrices}`);
  }

  await prisma.$disconnect();
}

alignDevToProd().catch(console.error);
