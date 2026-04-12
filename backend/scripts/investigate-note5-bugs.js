const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateBugs() {
  console.log('🔍 INVESTIGATION DES 3 BUGS NOTE 5\n');
  console.log('='.repeat(80));

  const lloydCompany = await prisma.company.findFirst({
    where: { name: 'LLOYD Assurances' },
  });

  const albarakaCompany = await prisma.company.findFirst({
    where: { name: 'AL BARAKA' },
  });

  // BUG 1: VOL - Réduction non appliquée
  console.log('\n📋 BUG 1: VOL (LLOYD) - Réduction 45% non appliquée\n');
  
  const volGuarantee = await prisma.guarantee.findFirst({
    where: { systemRole: 'MANDATORY_VOL' },
  });

  const volReductions = await prisma.conventionReductionRule.findMany({
    where: {
      conventionId: 'd484b4b6-52a4-4baf-b361-94a0953b4e8c',
      companyId: lloydCompany.id,
      guaranteeId: volGuarantee.id,
      isActive: true,
    },
  });

  console.log(`Réductions VOL pour LLOYD: ${volReductions.length}`);
  volReductions.forEach(r => {
    console.log(`  - ${r.discountPercent}% (metric: ${r.metric}, formulaType: ${r.formulaType})`);
    console.log(`    validFrom: ${r.validFrom}`);
    console.log(`    validTo: ${r.validTo || 'Illimité'}`);
  });

  // BUG 2: RC - Calcul incorrect
  console.log('\n📋 BUG 2: RC - Calcul incorrect (bonus-malus ?)\n');
  
  const rcGuarantee = await prisma.guarantee.findFirst({
    where: { systemRole: 'MANDATORY_RC' },
  });

  const rcRulesLloyd = await prisma.pricingRule.findMany({
    where: {
      companyId: lloydCompany.id,
      guaranteeId: rcGuarantee.id,
      minPower: { lte: 5 },
      maxPower: { gte: 5 },
      isActive: true,
    },
  });

  console.log(`Règles RC pour LLOYD (CV=5): ${rcRulesLloyd.length}`);
  rcRulesLloyd.forEach(r => {
    console.log(`  - Bonus-Malus: ${r.bonusMalusClass}, Prime: ${r.fixedPremium} DT`);
  });

  const rcRulesAlbaraka = await prisma.pricingRule.findMany({
    where: {
      companyId: albarakaCompany.id,
      guaranteeId: rcGuarantee.id,
      minPower: { lte: 5 },
      maxPower: { gte: 5 },
      isActive: true,
    },
  });

  console.log(`\nRègles RC pour AL BARAKA (CV=5): ${rcRulesAlbaraka.length}`);
  rcRulesAlbaraka.forEach(r => {
    console.log(`  - Bonus-Malus: ${r.bonusMalusClass}, Prime: ${r.fixedPremium} DT`);
  });

  // Vérifier le bonus-malus du devis
  const quote = await prisma.quote.findFirst({
    where: { quoteNumber: 'Q20261775812913778843' },
    include: {
      simulation: true,
    },
  });

  console.log(`\nBonus-Malus du devis LLOYD: ${quote.simulation.bonusMalus}`);

  // BUG 3: BG - Prime à 0
  console.log('\n📋 BUG 3: BG - Prime à 0 au lieu de 16250-17500 DT\n');
  
  const bgGuarantee = await prisma.guarantee.findFirst({
    where: { systemRole: 'OPTIONAL_BRIS_GLACES' },
  });

  // Vérifier la config de disponibilité BG
  const bgAvailabilityLloyd = await prisma.guaranteeAvailability.findFirst({
    where: {
      companyId: lloydCompany.id,
      guaranteeId: bgGuarantee.id,
      formulaType: 'TOUS_RISQUES_0',
    },
  });

  const bgAvailabilityAlbaraka = await prisma.guaranteeAvailability.findFirst({
    where: {
      companyId: albarakaCompany.id,
      guaranteeId: bgGuarantee.id,
      formulaType: 'TOUS_RISQUES_0',
    },
  });

  console.log('Config BG pour LLOYD:');
  if (bgAvailabilityLloyd) {
    console.log(`  Status: ${bgAvailabilityLloyd.status}`);
    console.log(`  Active: ${bgAvailabilityLloyd.isActive}`);
  } else {
    console.log('  Aucune config (DEFAULT)');
  }

  console.log('\nConfig BG pour AL BARAKA:');
  if (bgAvailabilityAlbaraka) {
    console.log(`  Status: ${bgAvailabilityAlbaraka.status}`);
    console.log(`  Active: ${bgAvailabilityAlbaraka.isActive}`);
  } else {
    console.log('  Aucune config (DEFAULT)');
  }

  // Vérifier les règles de pricing BG
  const bgRulesLloyd = await prisma.pricingRule.findMany({
    where: {
      companyId: lloydCompany.id,
      guaranteeId: bgGuarantee.id,
      isActive: true,
    },
  });

  console.log(`\nRègles BG pour LLOYD: ${bgRulesLloyd.length}`);
  bgRulesLloyd.forEach(r => {
    console.log(`  - Capital: ${r.minCapital}-${r.maxCapital}, Taux: ${r.ratePercentage}`);
  });

  const bgRulesAlbaraka = await prisma.pricingRule.findMany({
    where: {
      companyId: albarakaCompany.id,
      guaranteeId: bgGuarantee.id,
      isActive: true,
    },
  });

  console.log(`\nRègles BG pour AL BARAKA: ${bgRulesAlbaraka.length}`);
  bgRulesAlbaraka.forEach(r => {
    console.log(`  - Capital: ${r.minCapital}-${r.maxCapital}, Taux: ${r.ratePercentage}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n🎯 CONCLUSION:\n');
  console.log('BUG 1 (VOL): Les réductions sont configurées, mais peut-être pas appliquées dans les anciens devis');
  console.log('BUG 2 (RC): Vérifier si le bonus-malus est bien passé au calcul');
  console.log('BUG 3 (BG): Vérifier si BG est marqué GRATUIT dans la config\n');
}

investigateBugs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
