import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSpecificRcValue() {
  console.log('🔧 FIXING SPECIFIC RC VALUE: 7,700,000 → 77,000\n');
  
  try {
    // Fix the specific rule that became 7,700,000
    const result = await prisma.pricingRule.update({
      where: { id: '6d999cb6-dead-4b5b-8a79-cdd62fb9799e' },
      data: { fixedPremium: 77000 }
    });

    console.log('✅ Fixed specific rule:');
    console.log(`   Rule ID: ${result.id}`);
    console.log(`   Class: ${result.bonusMalusClass}, CV: ${result.minPower}-${result.maxPower}`);
    console.log(`   Value: 7,700,000 → 77,000`);
    console.log('');
    console.log('🎉 All RC values should now match Excel exactly!');

  } catch (error) {
    console.error('❌ Error fixing specific RC value:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSpecificRcValue();