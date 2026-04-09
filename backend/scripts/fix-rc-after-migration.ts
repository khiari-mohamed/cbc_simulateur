import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRcValuesAfterMigration() {
  console.log('🔧 FIXING RC VALUES AFTER MIGRATION\n');
  
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

    console.log(`Found ${rcRules.length} RC rules to fix\n`);

    let updatedCount = 0;

    for (const rule of rcRules) {
      if (rule.fixedPremium) {
        const currentValue = parseFloat(rule.fixedPremium.toString());
        
        // If value is less than 10000, it needs to be multiplied by 1000
        if (currentValue < 10000) {
          const newValue = currentValue * 1000;
          
          await prisma.pricingRule.update({
            where: { id: rule.id },
            data: { fixedPremium: newValue }
          });

          console.log(`✅ Fixed rule ${rule.id}:`);
          console.log(`   Class: ${rule.bonusMalusClass}, CV: ${rule.minPower}-${rule.maxPower || '∞'}`);
          console.log(`   ${currentValue} → ${newValue}`);
          console.log('');
          
          updatedCount++;
        } else {
          console.log(`⏭️  Skipped rule ${rule.id} (already correct: ${currentValue})`);
        }
      }
    }

    console.log('='.repeat(60));
    console.log(`🎉 MIGRATION FIX COMPLETE`);
    console.log(`✅ Updated: ${updatedCount} rules`);
    console.log(`⏭️  Skipped: ${rcRules.length - updatedCount} rules (already correct)`);
    console.log('');
    console.log('Expected values after fix:');
    console.log('77 → 77,000');
    console.log('98 → 98,000');
    console.log('119 → 119,000');
    console.log('etc...');

  } catch (error) {
    console.error('❌ Error fixing RC values:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRcValuesAfterMigration();