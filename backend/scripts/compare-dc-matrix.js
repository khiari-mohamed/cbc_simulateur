// scripts/compare-dc-matrix.js
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL manquante dans .env');
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

async function compare() {
  console.log('🔍 AFFICHAGE MATRICE DC (AL BARAKA)\n');

  const companyName = 'AL BARAKA';
  const usageName = 'Privé/Affaires';

  const company = await prisma.company.findFirst({ where: { name: companyName } });
  const usage = await prisma.usage.findFirst({ where: { nameFr: usageName } });

  if (!company || !usage) {
    console.error('❌ Compagnie ou usage non trouvé');
    process.exit(1);
  }

  // 1. DC_CONFIG
  const config = await prisma.dcConfig.findFirst({
    where: { companyId: company.id, usageId: usage.id, isActive: true }
  });

  console.log('📋 DC_CONFIG :');
  console.log(`   use_matrix         : ${config?.useMatrix}`);
  console.log(`   maxCapitalPercent  : ${config?.maxCapitalPercent}`);
  console.log(`   maxCapitalAbsolute : ${config?.maxCapitalAbsolute}`);
  console.log(`   minCapital         : ${config?.minCapital}`);
  console.log(`   basePremium        : ${config?.basePremium}`);
  console.log(`   discountPercent    : ${config?.discountPercent}\n`);

  // 2. TRANCHES VV
  const ranges = await prisma.dcMatrixVvRange.findMany({
    where: { companyId: company.id, usageId: usage.id, isActive: true },
    orderBy: { minVv: 'asc' }
  });

  console.log('📊 TRANCHES VV :');
  console.log(`   ${ranges.length} tranches`);
  ranges.forEach(r => console.log(`      ${r.minVv} - ${r.maxVv} (réduction ${r.reductionRate}%)`));
  console.log('');

  // 3. CAPITAUX
  const caps = await prisma.dcMatrixCapital.findMany({
    where: { companyId: company.id, usageId: usage.id, isActive: true },
    orderBy: { order: 'asc' }
  });

  console.log('💰 CAPITAUX :');
  console.log(`   ${caps.map(c => c.amount).join(', ')}`);
  console.log('');

  // 4. MATRICE DES PRIX
  console.log('📊 MATRICE DES PRIX :');
  const prices = await prisma.dcMatrixPrice.findMany({
    where: {
      vvRange: { companyId: company.id, usageId: usage.id },
      capital: { companyId: company.id, usageId: usage.id }
    },
    include: { vvRange: true, capital: true }
  });

  console.log(`   ${prices.length} prix configurés`);
  prices.forEach(p => {
    console.log(`   VV ${p.vvRange.minVv}-${p.vvRange.maxVv} | Capital ${p.capital.amount} → Prime: ${p.prime}`);
  });

  await prisma.$disconnect();
}

compare().catch(console.error);
