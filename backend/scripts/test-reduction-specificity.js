/**
 * Test script to verify reduction rule specificity fix
 * Tests the exact client scenario: VN=110,000 DT, LLOYD, TR 0%
 * 
 * Usage: node scripts/test-reduction-specificity.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Decimal } = require('@prisma/client/runtime/library');

const prisma = new PrismaClient();

async function testReductionSpecificity() {
  try {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  TEST: Reduction Rule Specificity Fix');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Get LLOYD company
    const lloyd = await prisma.company.findFirst({
      where: { name: 'LLOYD Assurances', isActive: true },
    });

    if (!lloyd) {
      console.error('❌ LLOYD Assurances not found');
      return;
    }

    // Get Convention
    const convention = await prisma.convention.findFirst({
      where: { isActive: true },
    });

    if (!convention) {
      console.error('❌ No active convention found');
      return;
    }

    // Get VOL guarantee
    const volGuarantee = await prisma.guarantee.findFirst({
      where: { systemRole: 'MANDATORY_VOL', isActive: true },
    });

    if (!volGuarantee) {
      console.error('❌ VOL guarantee not found');
      return;
    }

    // Get INCENDIE guarantee
    const incendieGuarantee = await prisma.guarantee.findFirst({
      where: { systemRole: 'MANDATORY_INCENDIE', isActive: true },
    });

    if (!incendieGuarantee) {
      console.error('❌ INCENDIE guarantee not found');
      return;
    }

    // Get usage
    const usage = await prisma.usage.findFirst({
      where: { isActive: true },
    });

    if (!usage) {
      console.error('❌ Usage not found');
      return;
    }

    console.log('📋 Test Parameters:');
    console.log(`   Company: ${lloyd.name}`);
    console.log(`   Convention: ${convention.name}`);
    console.log(`   Formula: TOUS_RISQUES_0`);
    console.log(`   VN (Valeur à neuf): 110,000 DT`);
    console.log(`   Metric: NEW_VALUE`);
    console.log(`   Usage: ${usage.code}\n`);

    // Fetch VOL rules
    const volRules = await prisma.conventionReductionRule.findMany({
      where: {
        conventionId: convention.id,
        guaranteeId: volGuarantee.id,
        metric: 'NEW_VALUE',
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [
          { validTo: null },
          { validTo: { gte: new Date() } }
        ],
        AND: [
          {
            OR: [
              { companyId: lloyd.id },
              { companyId: null }
            ]
          },
          {
            OR: [
              { formulaType: 'TOUS_RISQUES_0' },
              { formulaType: null }
            ]
          },
          {
            OR: [
              { usageId: usage.id },
              { usageId: null }
            ]
          }
        ]
      },
      include: {
        company: { select: { name: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  VOL RULES (Before Sorting)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    volRules.forEach((rule, index) => {
      console.log(`${index + 1}. Range: ${rule.minValue || 'null'} → ${rule.maxValue || 'null'}`);
      console.log(`   Discount: ${rule.discountPercent}%`);
      console.log(`   Company: ${rule.company?.name || 'ALL'}`);
      console.log(`   Formula: ${rule.formulaType || 'ALL'}`);
      console.log(`   Priority: ${rule.priority}`);
      console.log(`   Created: ${rule.createdAt.toISOString().split('T')[0]}\n`);
    });

    // Apply specificity sorting (same logic as the fix)
    const sortedVolRules = volRules.sort((a, b) => {
      // 1. Prefer specific company over generic (null)
      const aCompanySpecific = a.companyId === lloyd.id ? 1 : 0;
      const bCompanySpecific = b.companyId === lloyd.id ? 1 : 0;
      if (aCompanySpecific !== bCompanySpecific) return bCompanySpecific - aCompanySpecific;

      // 2. Prefer specific formula over generic (null)
      const aFormulaSpecific = a.formulaType === 'TOUS_RISQUES_0' ? 1 : 0;
      const bFormulaSpecific = b.formulaType === 'TOUS_RISQUES_0' ? 1 : 0;
      if (aFormulaSpecific !== bFormulaSpecific) return bFormulaSpecific - aFormulaSpecific;

      // 3. Prefer specific usage over generic (null)
      const aUsageSpecific = a.usageId === usage.id ? 1 : 0;
      const bUsageSpecific = b.usageId === usage.id ? 1 : 0;
      if (aUsageSpecific !== bUsageSpecific) return bUsageSpecific - aUsageSpecific;

      // 4. Prefer specific range over catch-all (null-null)
      const aHasRange = (a.minValue !== null && a.minValue !== undefined) || (a.maxValue !== null && a.maxValue !== undefined) ? 1 : 0;
      const bHasRange = (b.minValue !== null && b.minValue !== undefined) || (b.maxValue !== null && b.maxValue !== undefined) ? 1 : 0;
      if (aHasRange !== bHasRange) return bHasRange - aHasRange;

      // 5. Prefer higher priority
      if (a.priority !== b.priority) return b.priority - a.priority;

      // 6. Prefer newer (createdAt desc)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  VOL RULES (After Specificity Sorting)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    sortedVolRules.forEach((rule, index) => {
      console.log(`${index + 1}. Range: ${rule.minValue || 'null'} → ${rule.maxValue || 'null'}`);
      console.log(`   Discount: ${rule.discountPercent}%`);
      console.log(`   Company: ${rule.company?.name || 'ALL'} ${rule.companyId === lloyd.id ? '✅ SPECIFIC' : '⚠️ GENERIC'}`);
      console.log(`   Formula: ${rule.formulaType || 'ALL'}`);
      console.log(`   Priority: ${rule.priority}`);
      console.log(`   Created: ${rule.createdAt.toISOString().split('T')[0]}\n`);
    });

    // Find matching rule for VN = 110,000
    const testValue = 110000;
    let matchedVolRule = null;

    for (const rule of sortedVolRules) {
      const min = rule.minValue?.toNumber();
      const max = rule.maxValue?.toNumber();

      const minCheck = min === null || min === undefined || 
        (rule.minInclusive ? testValue >= min : testValue > min);
      const maxCheck = max === null || max === undefined || 
        (rule.maxInclusive ? testValue <= max : testValue < max);

      if (minCheck && maxCheck) {
        matchedVolRule = rule;
        break;
      }
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  RESULT: VOL Reduction for VN = 110,000 DT');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (matchedVolRule) {
      const discount = matchedVolRule.discountPercent.toNumber();
      console.log(`✅ Matched Rule:`);
      console.log(`   Range: ${matchedVolRule.minValue || 'null'} → ${matchedVolRule.maxValue || 'null'}`);
      console.log(`   Discount: ${discount}%`);
      console.log(`   Company: ${matchedVolRule.company?.name || 'ALL'}`);
      console.log(`   Formula: ${matchedVolRule.formulaType || 'ALL'}\n`);

      if (discount === 45) {
        console.log('✅ SUCCESS: VOL gets 45% discount (CORRECT!)');
      } else if (discount === 35) {
        console.log('❌ FAILURE: VOL gets 35% discount (WRONG - should be 45%)');
      } else {
        console.log(`⚠️  UNEXPECTED: VOL gets ${discount}% discount`);
      }
    } else {
      console.log('❌ No matching rule found');
    }

    // Compare with INCENDIE
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  COMPARISON: VOL vs INCENDIE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const incendieRules = await prisma.conventionReductionRule.findMany({
      where: {
        conventionId: convention.id,
        guaranteeId: incendieGuarantee.id,
        metric: 'NEW_VALUE',
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [
          { validTo: null },
          { validTo: { gte: new Date() } }
        ],
        AND: [
          {
            OR: [
              { companyId: lloyd.id },
              { companyId: null }
            ]
          },
          {
            OR: [
              { formulaType: 'TOUS_RISQUES_0' },
              { formulaType: null }
            ]
          },
          {
            OR: [
              { usageId: usage.id },
              { usageId: null }
            ]
          }
        ]
      },
      include: {
        company: { select: { name: true } },
      },
    });

    // Apply same sorting
    const sortedIncendieRules = incendieRules.sort((a, b) => {
      const aCompanySpecific = a.companyId === lloyd.id ? 1 : 0;
      const bCompanySpecific = b.companyId === lloyd.id ? 1 : 0;
      if (aCompanySpecific !== bCompanySpecific) return bCompanySpecific - aCompanySpecific;

      const aFormulaSpecific = a.formulaType === 'TOUS_RISQUES_0' ? 1 : 0;
      const bFormulaSpecific = b.formulaType === 'TOUS_RISQUES_0' ? 1 : 0;
      if (aFormulaSpecific !== bFormulaSpecific) return bFormulaSpecific - aFormulaSpecific;

      const aUsageSpecific = a.usageId === usage.id ? 1 : 0;
      const bUsageSpecific = b.usageId === usage.id ? 1 : 0;
      if (aUsageSpecific !== bUsageSpecific) return bUsageSpecific - aUsageSpecific;

      const aHasRange = (a.minValue !== null && a.minValue !== undefined) || (a.maxValue !== null && a.maxValue !== undefined) ? 1 : 0;
      const bHasRange = (b.minValue !== null && b.minValue !== undefined) || (b.maxValue !== null && b.maxValue !== undefined) ? 1 : 0;
      if (aHasRange !== bHasRange) return bHasRange - aHasRange;

      if (a.priority !== b.priority) return b.priority - a.priority;

      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    let matchedIncendieRule = null;
    for (const rule of sortedIncendieRules) {
      const min = rule.minValue?.toNumber();
      const max = rule.maxValue?.toNumber();

      const minCheck = min === null || min === undefined || 
        (rule.minInclusive ? testValue >= min : testValue > min);
      const maxCheck = max === null || max === undefined || 
        (rule.maxInclusive ? testValue <= max : testValue < max);

      if (minCheck && maxCheck) {
        matchedIncendieRule = rule;
        break;
      }
    }

    if (matchedIncendieRule) {
      const incendieDiscount = matchedIncendieRule.discountPercent.toNumber();
      console.log(`INCENDIE: ${incendieDiscount}%`);
      
      if (matchedVolRule) {
        const volDiscount = matchedVolRule.discountPercent.toNumber();
        console.log(`VOL: ${volDiscount}%\n`);

        if (volDiscount === incendieDiscount) {
          console.log(`✅ PERFECT: Both VOL and INCENDIE have ${volDiscount}% discount`);
        } else {
          console.log(`❌ MISMATCH: VOL (${volDiscount}%) ≠ INCENDIE (${incendieDiscount}%)`);
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  END OF TEST');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testReductionSpecificity()
  .then(() => {
    console.log('✅ Test completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
