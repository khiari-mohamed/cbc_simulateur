import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simulateManualCreation() {
  console.log('🔄 Step 1: Delete INCENDIE guarantee to simulate fresh start...\n');
  
  // First, delete any pricing rules that reference INCENDIE
  const incendieGuarantee = await prisma.guarantee.findUnique({
    where: { code: 'INCENDIE' },
  });

  if (incendieGuarantee) {
    console.log('Found INCENDIE guarantee:', incendieGuarantee.id);
    
    // Delete pricing rules
    const deletedRules = await prisma.pricingRule.deleteMany({
      where: { guaranteeId: incendieGuarantee.id },
    });
    console.log(`Deleted ${deletedRules.count} pricing rules`);

    // Delete convention reduction rules
    const deletedReductions = await prisma.conventionReductionRule.deleteMany({
      where: { guaranteeId: incendieGuarantee.id },
    });
    console.log(`Deleted ${deletedReductions.count} convention reduction rules`);

    // Delete the guarantee
    await prisma.guarantee.delete({
      where: { code: 'INCENDIE' },
    });
    console.log('✅ Deleted INCENDIE guarantee\n');
  } else {
    console.log('INCENDIE guarantee not found, skipping deletion\n');
  }

  console.log('🔄 Step 2: Recreate INCENDIE manually (like client did)...\n');
  
  // Create it manually with potential typos or issues
  const newIncendie = await prisma.guarantee.create({
    data: {
      code: 'INCENDIE',
      nameFr: 'Incendie',  // Client might have used different name
      nameAr: null,
      nameEn: null,
      isOptional: false,
      isActive: true,
    },
  });

  console.log('✅ Created INCENDIE guarantee:');
  console.log('   ID:', newIncendie.id);
  console.log('   Code:', newIncendie.code);
  console.log('   Name:', newIncendie.nameFr);
  console.log('   isOptional:', newIncendie.isOptional);
  console.log('   isActive:', newIncendie.isActive);
  console.log('\n');

  console.log('🔄 Step 3: Check all guarantees now...\n');
  const allGuarantees = await prisma.guarantee.findMany({
    orderBy: { code: 'asc' },
  });

  for (const g of allGuarantees) {
    console.log(`  - ${g.code.padEnd(30)} | ${g.nameFr.padEnd(40)} | Optional: ${g.isOptional} | Active: ${g.isActive}`);
  }

  console.log('\n✅ Done! Now try to generate a quote and see if it works.');
  
  await prisma.$disconnect();
}

simulateManualCreation().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
