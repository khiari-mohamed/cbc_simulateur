const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNonAccordee() {
  try {
    console.log('🔍 Checking guarantees with NON_ACCORDEE status...\n');

    const nonAccordeeGuarantees = await prisma.guaranteeAvailability.findMany({
      where: {
        status: 'NON_ACCORDEE'
      },
      include: {
        guarantee: true,
        company: true
      }
    });

    if (nonAccordeeGuarantees.length === 0) {
      console.log('❌ No guarantees found with NON_ACCORDEE status');
      console.log('\n💡 To test the feature, you need to set some guarantees to NON_ACCORDEE status');
      console.log('   Example: Set "Catastrophes Naturelles" to NON_ACCORDEE for STANDARD formula\n');
    } else {
      console.log(`✅ Found ${nonAccordeeGuarantees.length} guarantees with NON_ACCORDEE status:\n`);
      
      nonAccordeeGuarantees.forEach((ga, index) => {
        console.log(`${index + 1}. ${ga.guarantee.nameFr} (${ga.guarantee.code})`);
        console.log(`   Company: ${ga.company.name}`);
        console.log(`   Formula: ${ga.formulaType || 'ALL'}`);
        console.log(`   Status: ${ga.status}`);
        console.log('');
      });

      console.log('\n📝 To test the NON_ACCORDÉE label:');
      console.log('   1. Create a simulation with the formula type shown above');
      console.log('   2. Select the company shown above');
      console.log('   3. The guarantee should appear with (NON ACCORDÉE) label in red\n');
    }

    // Also check HIDDEN status
    const hiddenGuarantees = await prisma.guaranteeAvailability.findMany({
      where: {
        status: 'HIDDEN'
      },
      include: {
        guarantee: true,
        company: true
      }
    });

    if (hiddenGuarantees.length > 0) {
      console.log(`\n🔒 Found ${hiddenGuarantees.length} guarantees with HIDDEN status (completely hidden):\n`);
      
      hiddenGuarantees.forEach((ga, index) => {
        console.log(`${index + 1}. ${ga.guarantee.nameFr} (${ga.guarantee.code})`);
        console.log(`   Company: ${ga.company.name}`);
        console.log(`   Formula: ${ga.formulaType || 'ALL'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkNonAccordee();
