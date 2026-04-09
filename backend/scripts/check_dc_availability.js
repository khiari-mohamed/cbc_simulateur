const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDcAvailability() {
  try {
    console.log('🔍 Checking DOMMAGES_COLLISIONS guarantee availability...\n');

    const dcGuarantee = await prisma.guarantee.findFirst({
      where: { code: 'DOMMAGES_COLLISIONS' }
    });

    const alBaraka = await prisma.company.findFirst({
      where: { name: 'AL BARAKA' }
    });

    if (!dcGuarantee || !alBaraka) {
      console.log('❌ Guarantee or company not found');
      return;
    }

    console.log(`✅ Guarantee: ${dcGuarantee.nameFr} (${dcGuarantee.code})`);
    console.log(`✅ Company: ${alBaraka.name}\n`);

    const availabilities = await prisma.guaranteeAvailability.findMany({
      where: {
        guaranteeId: dcGuarantee.id,
        companyId: alBaraka.id
      }
    });

    if (availabilities.length === 0) {
      console.log('❌ NO availability records found!');
      console.log('   This means DC guarantee is not configured for AL BARAKA\n');
    } else {
      console.log(`✅ Found ${availabilities.length} availability record(s):\n`);
      availabilities.forEach((av, index) => {
        console.log(`${index + 1}. Formula: ${av.formulaType || 'ALL'}`);
        console.log(`   Status: ${av.status}`);
        console.log(`   Active: ${av.isActive}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDcAvailability();
