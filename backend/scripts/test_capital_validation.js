const { PrismaClient } = require('@prisma/client');
const { Decimal } = require('@prisma/client/runtime/library');

const prisma = new PrismaClient();

async function testCapitalValidation() {
  try {
    console.log('🔍 Testing DC Capital Validation...\n');

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

    console.log(`✅ Company: ${alBaraka.name}`);
    console.log(`✅ Usage: ${usage.nameFr}\n`);

    const tiers = await prisma.dcCapitalTier.findMany({
      where: {
        companyId: alBaraka.id,
        usageId: usage.id,
        isActive: true
      },
      orderBy: { minAmount: 'asc' }
    });

    if (tiers.length === 0) {
      console.log('❌ No DC capital tiers found!');
      return;
    }

    console.log(`📊 Found ${tiers.length} tier(s):\n`);
    
    tiers.forEach((tier, index) => {
      console.log(`Tier ${index + 1}:`);
      console.log(`   Min: ${tier.minAmount} DT`);
      console.log(`   Max: ${tier.maxAmount || 'UNLIMITED'} DT`);
      console.log(`   Step: ${tier.step} DT\n`);
    });

    // Test capital value: 1000
    const testCapital = new Decimal(1000);
    console.log(`🧪 Testing capital: ${testCapital} DT\n`);

    for (const tier of tiers) {
      const minAmount = new Decimal(tier.minAmount);
      const maxAmount = tier.maxAmount ? new Decimal(tier.maxAmount) : null;
      const step = new Decimal(tier.step);

      if (testCapital.gte(minAmount) && (!maxAmount || testCapital.lte(maxAmount))) {
        console.log(`✅ Capital ${testCapital} DT falls in tier range`);
        console.log(`   Min: ${minAmount}, Max: ${maxAmount || 'UNLIMITED'}`);
        
        const offset = testCapital.sub(minAmount);
        const remainder = offset.mod(step);
        
        console.log(`   Offset: ${testCapital} - ${minAmount} = ${offset}`);
        console.log(`   Remainder: ${offset} % ${step} = ${remainder}`);
        console.log(`   Valid: ${remainder.eq(0) ? '✅ YES' : '❌ NO'}\n`);

        if (!remainder.eq(0)) {
          console.log(`❌ VALIDATION FAILED!`);
          console.log(`   Capital ${testCapital} is not a valid increment`);
          console.log(`   Valid values: ${minAmount}, ${minAmount.add(step)}, ${minAmount.add(step.mul(2))}, ...\n`);
        } else {
          console.log(`✅ VALIDATION PASSED!\n`);
        }
        
        return;
      }
    }

    console.log(`❌ Capital ${testCapital} DT does not fall in any tier range!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testCapitalValidation();
