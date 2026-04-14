const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRCValues() {
  console.log('🔧 Starting RC pricing rules fix...\n');

  try {
    // Get RC guarantee
    const rcGuarantee = await prisma.guarantee.findFirst({
      where: { systemRole: 'MANDATORY_RC', isActive: true }
    });

    if (!rcGuarantee) {
      console.log('❌ RC guarantee not found');
      return;
    }

    console.log(`✅ Found RC guarantee: ${rcGuarantee.id}\n`);

    // Get all RC pricing rules
    const rcRules = await prisma.pricingRule.findMany({
      where: {
        guaranteeId: rcGuarantee.id,
        isActive: true
      },
      include: {
        company: true
      }
    });

    console.log(`📋 Found ${rcRules.length} RC pricing rules\n`);

    // Show current values
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('CURRENT RC VALUES (BEFORE FIX)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const rule of rcRules) {
      console.log(`Company: ${rule.company.name}`);
      console.log(`  BM Class: ${rule.bonusMalusClass}, CV: ${rule.minPower}-${rule.maxPower}`);
      console.log(`  Current Value: ${rule.fixedPremium}`);
      if (rule.minPower >= 15 && Number(rule.fixedPremium) >= 1000 && Number(rule.fixedPremium) <= 10000) {
        console.log(`  New Value: ${Number(rule.fixedPremium) / 10} DT (complete ÷1000 conversion)`);
      } else {
        console.log(`  New Value: ${rule.fixedPremium} DT (no change needed)`);
      }
      console.log('');
    }

    // Ask for confirmation
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('⚠️  WARNING: This will divide RC values for CV ≥15 by 10 to complete the millimes→DT conversion!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Update only RC rules for CV ≥15 that are between 1000-10000 (were divided by 100, need to divide by 10 more)
    let updatedCount = 0;
    for (const rule of rcRules) {
      // Only fix rules where CV ≥15 AND value is between 1000-10000 (these were divided by 100 instead of 1000)
      if (rule.minPower >= 15 && Number(rule.fixedPremium) >= 1000 && Number(rule.fixedPremium) <= 10000) {
        const newValue = Number(rule.fixedPremium) / 10; // Divide by 10 more to complete the ÷1000 conversion
        
        await prisma.pricingRule.update({
          where: { id: rule.id },
          data: {
            fixedPremium: newValue
          }
        });

        updatedCount++;
        console.log(`✅ Updated rule ${rule.id}: ${rule.fixedPremium} → ${newValue} DT (BM: ${rule.bonusMalusClass}, CV: ${rule.minPower}-${rule.maxPower})`);
      } else {
        console.log(`⏭️  Skipped rule ${rule.id}: ${rule.fixedPremium} DT (BM: ${rule.bonusMalusClass}, CV: ${rule.minPower}-${rule.maxPower}) - No change needed`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`✅ SUCCESS: Updated ${updatedCount} RC pricing rules`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Verify the fix
    console.log('🔍 Verifying fix...\n');

    const verifyRules = await prisma.pricingRule.findMany({
      where: {
        guaranteeId: rcGuarantee.id,
        isActive: true,
        bonusMalusClass: 5,
        minPower: { lte: 25 },
        maxPower: { gte: 25 }
      },
      include: {
        company: true
      }
    });

    for (const rule of verifyRules) {
      console.log(`Company: ${rule.company.name}`);
      console.log(`  BM Class: ${rule.bonusMalusClass}, CV: ${rule.minPower}-${rule.maxPower}`);
      console.log(`  Fixed Premium: ${rule.fixedPremium} DT ✅`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixRCValues()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
