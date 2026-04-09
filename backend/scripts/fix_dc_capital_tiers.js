const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDcCapitalTiers() {
  try {
    console.log('🔧 Adding DC Capital Tiers for AL BARAKA...\n');

    // Get company and usage
    const alBaraka = await prisma.company.findFirst({
      where: { name: 'AL BARAKA' }
    });

    const usages = await prisma.usage.findMany({
      where: { isActive: true }
    });

    if (!alBaraka) {
      console.log('❌ AL BARAKA company not found!');
      return;
    }

    if (usages.length === 0) {
      console.log('❌ No active usages found!');
      return;
    }

    console.log(`✅ Found company: ${alBaraka.name} (${alBaraka.id})`);
    console.log(`✅ Found ${usages.length} active usages\n`);

    // Add DC capital tiers for each usage
    for (const usage of usages) {
      console.log(`📝 Adding DC capital tier for usage: ${usage.nameFr}...`);

      const existing = await prisma.dcCapitalTier.findFirst({
        where: {
          companyId: alBaraka.id,
          usageId: usage.id
        }
      });

      if (existing) {
        console.log(`   ℹ️  Tier already exists for ${usage.nameFr}`);
      } else {
        await prisma.dcCapitalTier.create({
          data: {
            companyId: alBaraka.id,
            usageId: usage.id,
            minAmount: 5000,
            maxAmount: 20000,
            step: 1000,
            isActive: true
          }
        });
        console.log(`   ✅ Created tier: 5,000 - 20,000 DT (step: 1,000)`);
      }
    }

    console.log('\n✅ DC Capital Tiers configured!\n');
    console.log('📋 Summary:');
    console.log('   - Company: AL BARAKA');
    console.log('   - Capital range: 5,000 - 20,000 DT');
    console.log('   - Step: 1,000 DT');
    console.log('   - Options: 5K, 6K, 7K, ... 20K\n');
    console.log('🎯 Now refresh the frontend and the dropdown will show capital options!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDcCapitalTiers();
