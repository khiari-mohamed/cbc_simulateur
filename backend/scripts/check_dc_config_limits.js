const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDcConfig() {
  try {
    console.log('🔍 Checking DC Configuration...\n');

    const alBaraka = await prisma.company.findFirst({
      where: { name: 'AL BARAKA' }
    });

    if (!alBaraka) {
      console.log('❌ AL BARAKA not found');
      return;
    }

    // Check DcConfig
    const dcConfig = await prisma.dcConfig.findFirst({
      where: { companyId: alBaraka.id }
    });

    if (!dcConfig) {
      console.log('❌ No DcConfiguration found for AL BARAKA\n');
      console.log('💡 This table controls DC capital limits and validation\n');
    } else {
      console.log('✅ DcConfiguration found:\n');
      console.log(`   Max Capital Absolute: ${dcConfig.maxCapitalAbsolute} DT`);
      console.log(`   Max Capital Percent: ${dcConfig.maxCapitalPercent}%`);
      console.log(`   Min Capital: ${dcConfig.minCapital} DT`);
      console.log(`   Is Active: ${dcConfig.isActive}\n`);

      if (dcConfig.maxCapitalAbsolute < 10000) {
        console.log('⚠️  WARNING: maxCapitalAbsolute is too low!');
        console.log(`   Current: ${dcConfig.maxCapitalAbsolute} DT`);
        console.log(`   Should be: 20000 DT or higher\n`);
        console.log('🔧 Fix: Update maxCapitalAbsolute to 20000\n');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDcConfig();
