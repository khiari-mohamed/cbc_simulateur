const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDommagesCollisionConfig() {
  try {
    console.log('🔧 Fixing DOMMAGES_COLLISIONS configuration for AL BARAKA...\n');

    // Get guarantee and company
    const dcGuarantee = await prisma.guarantee.findFirst({
      where: { code: 'DOMMAGES_COLLISIONS' }
    });

    const alBaraka = await prisma.company.findFirst({
      where: { name: 'AL BARAKA' }
    });

    if (!dcGuarantee || !alBaraka) {
      console.log('❌ Guarantee or company not found!');
      return;
    }

    console.log(`✅ Found guarantee: ${dcGuarantee.nameFr} (${dcGuarantee.id})`);
    console.log(`✅ Found company: ${alBaraka.name} (${alBaraka.id})\n`);

    // 1. Add guarantee availability
    console.log('📝 Step 1: Adding guarantee availability...');
    
    const existingAvailability = await prisma.guaranteeAvailability.findFirst({
      where: {
        guaranteeId: dcGuarantee.id,
        companyId: alBaraka.id,
        formulaType: 'DOMMAGES_COLLISIONS'
      }
    });

    if (existingAvailability) {
      console.log('   ℹ️  Availability already exists, updating to DEFAULT status...');
      await prisma.guaranteeAvailability.update({
        where: { id: existingAvailability.id },
        data: { status: 'DEFAULT', isActive: true }
      });
    } else {
      console.log('   ➕ Creating new availability record...');
      await prisma.guaranteeAvailability.create({
        data: {
          guaranteeId: dcGuarantee.id,
          companyId: alBaraka.id,
          formulaType: 'DOMMAGES_COLLISIONS',
          status: 'DEFAULT',
          isActive: true
        }
      });
    }
    console.log('   ✅ Availability configured\n');

    // 2. Add capital values
    console.log('📝 Step 2: Adding capital values...');
    
    const capitalValuesToAdd = [
      { value: 5000, label: '5,000 DT' },
      { value: 10000, label: '10,000 DT' },
      { value: 15000, label: '15,000 DT' },
      { value: 20000, label: '20,000 DT' }
    ];

    for (const cv of capitalValuesToAdd) {
      const existing = await prisma.capitalValue.findFirst({
        where: {
          guaranteeId: dcGuarantee.id,
          companyId: alBaraka.id,
          formulaType: 'DOMMAGES_COLLISIONS',
          value: cv.value
        }
      });

      if (!existing) {
        await prisma.capitalValue.create({
          data: {
            guaranteeId: dcGuarantee.id,
            companyId: alBaraka.id,
            formulaType: 'DOMMAGES_COLLISIONS',
            value: cv.value,
            label: cv.label,
            isActive: true
          }
        });
        console.log(`   ✅ Added capital value: ${cv.label}`);
      } else {
        console.log(`   ℹ️  Capital value already exists: ${cv.label}`);
      }
    }

    console.log('\n✅ Configuration complete!\n');
    console.log('📋 Summary:');
    console.log('   - Guarantee availability: ✅ DEFAULT');
    console.log('   - Capital values: ✅ 4 options (5K, 10K, 15K, 20K)');
    console.log('\n🎯 Now you can test the simulation with DOMMAGES_COLLISIONS formula!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDommagesCollisionConfig();
