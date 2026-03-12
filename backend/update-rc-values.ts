import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateRcValues() {
  console.log('🔄 UPDATING RC VALUES: Converting from thousands to full values\n');
  
  try {
    // Get RC guarantee
    const rcGuarantee = await prisma.guarantee.findUnique({
      where: { code: 'RC' }
    });

    if (!rcGuarantee) {
      console.log('❌ RC guarantee not found');
      return;
    }

    // Get all RC pricing rules
    const rcRules = await prisma.pricingRule.findMany({
      where: {
        guaranteeId: rcGuarantee.id,
        isActive: true
      }
    });

    console.log(`Found ${rcRules.length} RC rules to update\n`);

    let updatedCount = 0;

    for (const rule of rcRules) {
      if (rule.fixedPremium) {
        const currentValue = parseFloat(rule.fixedPremium.toString());
        
        // If value is less than 10000, it's likely stored in thousands, so multiply by 1000
        if (currentValue < 10000) {
          const newValue = currentValue * 1000;
          
          await prisma.pricingRule.update({
            where: { id: rule.id },
            data: { fixedPremium: newValue }
          });

          console.log(`Updated rule ${rule.id}:`);
          console.log(`  Class: ${rule.bonusMalusClass}, CV: ${rule.minPower}-${rule.maxPower}`);
          console.log(`  Old: ${currentValue} → New: ${newValue}`);
          console.log('');
          
          updatedCount++;
        } else {
          console.log(`Skipped rule ${rule.id} (already full value: ${currentValue})`);
        }
      }
    }

    console.log('='.repeat(50));
    console.log(`✅ MIGRATION COMPLETE`);
    console.log(`Updated ${updatedCount} rules`);
    console.log(`Skipped ${rcRules.length - updatedCount} rules (already correct)`);

  } catch (error) {
    console.error('❌ Error updating RC values:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRcValues();