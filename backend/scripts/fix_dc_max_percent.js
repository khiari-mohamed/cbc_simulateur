const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDcMaxPercent() {
  try {
    console.log('🔧 Updating DC maxCapitalPercent to 80%...\n');

    const alBaraka = await prisma.company.findFirst({
      where: { name: 'AL BARAKA' }
    });

    if (!alBaraka) {
      console.log('❌ AL BARAKA not found');
      return;
    }

    const dcConfigs = await prisma.dcConfig.findMany({
      where: { companyId: alBaraka.id }
    });

    if (dcConfigs.length === 0) {
      console.log('❌ No DC configs found for AL BARAKA');
      return;
    }

    console.log(`✅ Found ${dcConfigs.length} DC config(s) for AL BARAKA\n`);

    for (const config of dcConfigs) {
      console.log(`📝 Updating config for usage: ${config.usageId}`);
      console.log(`   Current maxCapitalPercent: ${config.maxCapitalPercent}%`);
      
      await prisma.dcConfig.update({
        where: { id: config.id },
        data: { maxCapitalPercent: 80 }
      });

      console.log(`   ✅ Updated to: 80%\n`);
    }

    console.log('✅ All DC configs updated!\n');
    console.log('📋 Summary:');
    console.log('   - maxCapitalPercent: 50% → 80%');
    console.log('   - For VV = 10,000 DT:');
    console.log('     • Old limit: 5,000 DT');
    console.log('     • New limit: 8,000 DT\n');
    console.log('🎯 Now you can select capital up to 8,000 DT for a 10,000 DT vehicle!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixDcMaxPercent();
