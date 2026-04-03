import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:23044943@10.34.60.63:5432/cbc_ars?schema=public',
    },
  },
});

async function fixAllGuaranteeCodes() {
  console.log('🔧 Fixing all guarantee codes in production...\n');

  // Mapping of wrong codes to correct codes
  const fixes = [
    { wrong: 'INC', correct: 'INCENDIE', isOptional: false, nameFr: 'Incendie' },
    { wrong: 'DC', correct: 'DOMMAGES_COLLISIONS', isOptional: true, nameFr: 'Dommages Collision' },
    { wrong: 'TR', correct: 'TOUS_RISQUES_ZERO', isOptional: true, nameFr: 'Tous Risques' },
    { wrong: 'CATNAT', correct: 'CATASTROPHES_NATURELLES', isOptional: true, nameFr: 'Catastrophes Naturelles' },
    { wrong: 'GEMP', correct: 'DOMMAGES_EMEUTES', isOptional: true, nameFr: 'Dommages suite émeutes' },
    { wrong: 'PTA', correct: 'PERSONNES_TRANSPORTEES', isOptional: false, nameFr: 'Personnes Transportées' },
    { wrong: 'IAC', correct: 'ASSURANCE_CONDUCTEUR', isOptional: true, nameFr: 'Assurance Conducteur' },
  ];

  for (const fix of fixes) {
    console.log(`\n🔍 Checking ${fix.wrong} → ${fix.correct}...`);

    // Check if wrong code exists
    const wrongGuarantee = await prisma.guarantee.findUnique({
      where: { code: fix.wrong },
    });

    // Check if correct code already exists
    const correctGuarantee = await prisma.guarantee.findUnique({
      where: { code: fix.correct },
    });

    if (!wrongGuarantee && !correctGuarantee) {
      console.log(`   ⚠️  Neither ${fix.wrong} nor ${fix.correct} exists - skipping`);
      continue;
    }

    if (correctGuarantee) {
      console.log(`   ✅ ${fix.correct} already exists (ID: ${correctGuarantee.id})`);
      
      if (wrongGuarantee) {
        console.log(`   🗑️  Deleting duplicate ${fix.wrong} (ID: ${wrongGuarantee.id})...`);
        
        // First, update any pricing rules that reference the wrong guarantee
        const updatedRules = await prisma.pricingRule.updateMany({
          where: { guaranteeId: wrongGuarantee.id },
          data: { guaranteeId: correctGuarantee.id },
        });
        console.log(`      Updated ${updatedRules.count} pricing rules`);

        // Update convention reduction rules
        const updatedReductions = await prisma.conventionReductionRule.updateMany({
          where: { guaranteeId: wrongGuarantee.id },
          data: { guaranteeId: correctGuarantee.id },
        });
        console.log(`      Updated ${updatedReductions.count} convention reduction rules`);

        // Update simulation guarantees
        const updatedSimGuarantees = await prisma.simulationGuarantee.updateMany({
          where: { guaranteeId: wrongGuarantee.id },
          data: { guaranteeId: correctGuarantee.id },
        });
        console.log(`      Updated ${updatedSimGuarantees.count} simulation guarantees`);

        // Update quote items
        const updatedQuoteItems = await prisma.quoteItem.updateMany({
          where: { guaranteeId: wrongGuarantee.id },
          data: { guaranteeId: correctGuarantee.id },
        });
        console.log(`      Updated ${updatedQuoteItems.count} quote items`);

        // Now delete the wrong guarantee
        await prisma.guarantee.delete({
          where: { code: fix.wrong },
        });
        console.log(`   ✅ Deleted ${fix.wrong}`);
      }
    } else if (wrongGuarantee) {
      console.log(`   🔄 Updating ${fix.wrong} to ${fix.correct}...`);
      
      const updated = await prisma.guarantee.update({
        where: { code: fix.wrong },
        data: {
          code: fix.correct,
          nameFr: fix.nameFr,
          isOptional: fix.isOptional,
          isActive: true,
        },
      });

      console.log(`   ✅ Updated successfully!`);
      console.log(`      ID: ${updated.id}`);
      console.log(`      Code: ${updated.code}`);
      console.log(`      isOptional: ${updated.isOptional}`);
      console.log(`      isActive: ${updated.isActive}`);
    }
  }

  console.log('\n\n📋 Final guarantee list:');
  const allGuarantees = await prisma.guarantee.findMany({
    orderBy: { code: 'asc' },
  });

  for (const g of allGuarantees) {
    const status = g.isActive ? '✅' : '❌';
    const type = g.isOptional ? 'Optional' : 'Mandatory';
    console.log(`  ${status} ${g.code.padEnd(30)} | ${g.nameFr.padEnd(40)} | ${type}`);
  }

  console.log('\n✅ All guarantee codes fixed!');
  
  await prisma.$disconnect();
}

fixAllGuaranteeCodes().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
