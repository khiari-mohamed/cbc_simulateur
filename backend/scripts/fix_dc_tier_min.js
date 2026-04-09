const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDcTierMin() {
  try {
    console.log('🔧 Updating DC Capital Tier minimum to 1000 DT...\n');

    const alBaraka = await prisma.company.findFirst({
      where: { name: 'AL BARAKA' }
    });

    const usage = await prisma.usage.findFirst({
      where: { isActive: true }
    });

    if (!alBaraka || !usage) {
      console.log('❌ Company or usage not found');
      return;
    }

    const tier = await prisma.dcCapitalTier.findFirst({
      where: {
        companyId: alBaraka.id,
        usageId: usage.id
      }
    });

    if (!tier) {
      console.log('❌ No tier found');
      return;
    }

    console.log(`📊 Current tier:`);
    console.log(`   Min: ${tier.minAmount} DT`);
    console.log(`   Max: ${tier.maxAmount} DT`);
    console.log(`   Step: ${tier.step} DT\n`);

    await prisma.dcCapitalTier.update({
      where: { id: tier.id },
      data: { minAmount: 1000 }
    });

    console.log(`✅ Updated tier:`);
    console.log(`   Min: 1000 DT`);
    console.log(`   Max: ${tier.maxAmount} DT`);
    console.log(`   Step: ${tier.step} DT\n`);

    console.log('📋 Valid capital values now:');
    console.log('   1000, 2000, 3000, 4000, 5000, ... 20000 DT\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixDcTierMin();
