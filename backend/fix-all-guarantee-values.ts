import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAllGuaranteeValues() {
  console.log('🔧 FIXING ALL GUARANTEE VALUES: Converting monetary fields from thousands to full values\n');
  
  try {
    // Get all guarantees except RC (we already fixed RC)
    const guarantees = await prisma.guarantee.findMany({
      where: {
        code: { not: 'RC' },
        isActive: true
      }
    });

    console.log(`Found ${guarantees.length} non-RC guarantees to process\n`);

    let totalUpdated = 0;

    for (const guarantee of guarantees) {
      console.log(`📋 Processing ${guarantee.code} (${guarantee.nameFr}):`);
      
      // Get all pricing rules for this guarantee
      const rules = await prisma.pricingRule.findMany({
        where: {
          guaranteeId: guarantee.id,
          isActive: true
        }
      });

      console.log(`  Found ${rules.length} rules`);
      let updatedInGuarantee = 0;

      for (const rule of rules) {
        const updates: any = {};
        let hasUpdates = false;

        // Check and update monetary fields that need scaling
        if (rule.fixedPremium && parseFloat(rule.fixedPremium.toString()) < 10000) {
          updates.fixedPremium = parseFloat(rule.fixedPremium.toString()) * 1000;
          hasUpdates = true;
          console.log(`    fixedPremium: ${rule.fixedPremium} → ${updates.fixedPremium}`);
        }

        if (rule.minCapital && parseFloat(rule.minCapital.toString()) < 10000) {
          updates.minCapital = parseFloat(rule.minCapital.toString()) * 1000;
          hasUpdates = true;
          console.log(`    minCapital: ${rule.minCapital} → ${updates.minCapital}`);
        }

        if (rule.maxCapital && parseFloat(rule.maxCapital.toString()) < 10000) {
          updates.maxCapital = parseFloat(rule.maxCapital.toString()) * 1000;
          hasUpdates = true;
          console.log(`    maxCapital: ${rule.maxCapital} → ${updates.maxCapital}`);
        }

        if (rule.minMarketValue && parseFloat(rule.minMarketValue.toString()) < 10000) {
          updates.minMarketValue = parseFloat(rule.minMarketValue.toString()) * 1000;
          hasUpdates = true;
          console.log(`    minMarketValue: ${rule.minMarketValue} → ${updates.minMarketValue}`);
        }

        if (rule.maxMarketValue && parseFloat(rule.maxMarketValue.toString()) < 10000) {
          updates.maxMarketValue = parseFloat(rule.maxMarketValue.toString()) * 1000;
          hasUpdates = true;
          console.log(`    maxMarketValue: ${rule.maxMarketValue} → ${updates.maxMarketValue}`);
        }

        if (rule.basePremium && parseFloat(rule.basePremium.toString()) < 10000) {
          updates.basePremium = parseFloat(rule.basePremium.toString()) * 1000;
          hasUpdates = true;
          console.log(`    basePremium: ${rule.basePremium} → ${updates.basePremium}`);
        }

        // Update the rule if there are changes
        if (hasUpdates) {
          await prisma.pricingRule.update({
            where: { id: rule.id },
            data: updates
          });
          updatedInGuarantee++;
          totalUpdated++;
        }
      }

      console.log(`  ✅ Updated ${updatedInGuarantee} rules for ${guarantee.code}\n`);
    }

    console.log('='.repeat(60));
    console.log(`🎉 GUARANTEE VALUES MIGRATION COMPLETE`);
    console.log(`✅ Total rules updated: ${totalUpdated}`);
    console.log('');
    console.log('Expected results after fix:');
    console.log('• Assistance: 115 → 115,000 DT');
    console.log('• Vol fixed: 30 → 30,000 DT');
    console.log('• Tous Risques 0%: 22 → 22,000 DT');
    console.log('• CAS: 45/20 → 45,000/20,000 DT');
    console.log('• PTA capitals: 5000/4000 → 5,000,000/4,000,000 DT');
    console.log('• Incendie Emeutes: 15 → 15,000 DT');
    console.log('');
    console.log('⚠️  Note: Percentages (rates, reductions) were NOT changed');

  } catch (error) {
    console.error('❌ Error fixing guarantee values:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllGuaranteeValues();