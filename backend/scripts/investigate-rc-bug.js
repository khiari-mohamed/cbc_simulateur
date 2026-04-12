const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateRCBug() {
  console.log('🔍 INVESTIGATION BUG RC\n');
  console.log('='.repeat(80));

  const quote = await prisma.quote.findFirst({
    where: { quoteNumber: 'Q20261775812913778843' },
    include: {
      simulation: {
        include: {
          vehicle: true,
        },
      },
      items: {
        include: {
          guarantee: true,
        },
      },
    },
  });

  console.log('\n📋 DEVIS:', quote.quoteNumber);
  console.log('Compagnie:', quote.companyId);
  console.log('Date création:', quote.createdAt);
  console.log('\n🚗 VÉHICULE:');
  console.log('CV:', quote.simulation.vehicle.fiscalHorsepower);
  console.log('Bonus-Malus:', quote.simulation.bonusMalus);

  const rcItem = quote.items.find(i => i.guarantee.code === 'RC');
  console.log('\n💰 RC DANS LE DEVIS:');
  console.log('Prime:', rcItem.prime, 'DT');

  // Vérifier pricingSnapshot
  if (quote.pricingSnapshot) {
    console.log('\n📸 PRICING SNAPSHOT:');
    const snapshot = quote.pricingSnapshot;
    console.log(JSON.stringify(snapshot, null, 2));
  }

  // Chercher la règle qui devrait s'appliquer
  const rcGuarantee = await prisma.guarantee.findFirst({
    where: { systemRole: 'MANDATORY_RC' },
  });

  const bonusMalusClass = Math.round(parseFloat(quote.simulation.bonusMalus));
  
  const rule = await prisma.pricingRule.findFirst({
    where: {
      companyId: quote.companyId,
      guaranteeId: rcGuarantee.id,
      isActive: true,
      minPower: { lte: quote.simulation.vehicle.fiscalHorsepower },
      maxPower: { gte: quote.simulation.vehicle.fiscalHorsepower },
      bonusMalusClass: bonusMalusClass,
    },
  });

  console.log('\n📋 RÈGLE ATTENDUE:');
  if (rule) {
    console.log('ID:', rule.id);
    console.log('Bonus-Malus:', rule.bonusMalusClass);
    console.log('Prime:', rule.fixedPremium, 'DT');
    console.log('CV min-max:', rule.minPower, '-', rule.maxPower);
  } else {
    console.log('❌ Aucune règle trouvée !');
  }

  console.log('\n🔍 COMPARAISON:');
  console.log('Prime actuelle:', rcItem.prime, 'DT');
  console.log('Prime attendue:', rule?.fixedPremium || 'N/A', 'DT');
  console.log('Différence:', parseFloat(rcItem.prime) - parseFloat(rule?.fixedPremium || 0), 'DT');

  // Vérifier s'il y a une règle avec prime = 264
  const rule264 = await prisma.pricingRule.findFirst({
    where: {
      companyId: quote.companyId,
      guaranteeId: rcGuarantee.id,
      fixedPremium: 264,
    },
  });

  console.log('\n🔍 Y a-t-il une règle avec prime = 264 DT ?');
  if (rule264) {
    console.log('✅ OUI !');
    console.log('Bonus-Malus:', rule264.bonusMalusClass);
    console.log('CV min-max:', rule264.minPower, '-', rule264.maxPower);
    console.log('Active:', rule264.isActive);
  } else {
    console.log('❌ NON - 264 DT ne correspond à aucune règle !');
  }

  console.log('\n' + '='.repeat(80));
}

investigateRCBug()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
