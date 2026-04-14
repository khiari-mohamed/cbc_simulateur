/**
 * Script to check ALL reduction rules in the database
 * Compares dev vs prod to ensure consistency
 * 
 * Usage:
 * node scripts/check-all-reduction-rules.js dev
 * node scripts/check-all-reduction-rules.js prod
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Determine which database to use based on command line argument
const environment = process.argv[2] || 'dev';
const databaseUrl = environment === 'prod' 
  ? process.env.PROD_DATABASE_URL 
  : process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(`❌ ERROR: ${environment === 'prod' ? 'PROD_DATABASE_URL' : 'DATABASE_URL'} not found in .env file`);
  process.exit(1);
}

console.log(`\n🔍 Connecting to ${environment.toUpperCase()} database...`);
console.log(`📊 Database: ${databaseUrl.split('@')[1]?.split('/')[0] || 'unknown'}\n`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function checkReductionRules() {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  REDUCTION RULES DIAGNOSTIC - ${environment.toUpperCase()} DATABASE`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Get all companies
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    console.log(`📋 Found ${companies.length} active companies:\n`);
    companies.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.id})`);
    });
    console.log('\n');

    // Get all conventions
    const conventions = await prisma.convention.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    console.log(`📋 Found ${conventions.length} active conventions:\n`);
    conventions.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.id})`);
    });
    console.log('\n');

    // Get all guarantees
    const guarantees = await prisma.guarantee.findMany({
      where: { isActive: true },
      select: { id: true, code: true, systemRole: true },
      orderBy: { code: 'asc' },
    });

    console.log(`📋 Found ${guarantees.length} active guarantees:\n`);
    guarantees.forEach((g, i) => {
      console.log(`   ${i + 1}. ${g.code} (${g.systemRole})`);
    });
    console.log('\n');

    // Get all reduction rules
    const reductionRules = await prisma.conventionReductionRule.findMany({
      where: { isActive: true },
      include: {
        convention: { select: { name: true } },
        guarantee: { select: { code: true, systemRole: true } },
        company: { select: { name: true } },
        usage: { select: { code: true, nameFr: true } },
      },
      orderBy: [
        { convention: { name: 'asc' } },
        { guarantee: { code: 'asc' } },
        { priority: 'desc' },
      ],
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  TOTAL REDUCTION RULES: ${reductionRules.length}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Group by convention
    const rulesByConvention = {};
    reductionRules.forEach(rule => {
      const conventionName = rule.convention.name;
      if (!rulesByConvention[conventionName]) {
        rulesByConvention[conventionName] = [];
      }
      rulesByConvention[conventionName].push(rule);
    });

    // Display rules grouped by convention
    for (const [conventionName, rules] of Object.entries(rulesByConvention)) {
      console.log('┌─────────────────────────────────────────────────────────────┐');
      console.log(`│ CONVENTION: ${conventionName.padEnd(47)} │`);
      console.log('├─────────────────────────────────────────────────────────────┤');
      console.log(`│ Total Rules: ${rules.length.toString().padEnd(46)} │`);
      console.log('└─────────────────────────────────────────────────────────────┘\n');

      // Group by guarantee
      const rulesByGuarantee = {};
      rules.forEach(rule => {
        const guaranteeCode = rule.guarantee.code;
        if (!rulesByGuarantee[guaranteeCode]) {
          rulesByGuarantee[guaranteeCode] = [];
        }
        rulesByGuarantee[guaranteeCode].push(rule);
      });

      for (const [guaranteeCode, guaranteeRules] of Object.entries(rulesByGuarantee)) {
        console.log(`  ┌─ GUARANTEE: ${guaranteeCode} ─────────────────────────────────`);
        console.log(`  │  System Role: ${guaranteeRules[0].guarantee.systemRole}`);
        console.log(`  │  Rules: ${guaranteeRules.length}`);
        console.log('  │');

        guaranteeRules.forEach((rule, index) => {
          console.log(`  │  Rule #${index + 1}:`);
          console.log(`  │    Priority: ${rule.priority}`);
          console.log(`  │    Metric: ${rule.metric}`);
          console.log(`  │    Range: ${rule.minValue || 'null'} → ${rule.maxValue || 'null'} (${rule.minInclusive ? '[' : '('}min, max${rule.maxInclusive ? ']' : ')'})`);
          console.log(`  │    Discount: ${rule.discountPercent}%`);
          console.log(`  │    Company: ${rule.company?.name || 'ALL'}`);
          console.log(`  │    Usage: ${rule.usage?.nameFr || rule.usage?.code || 'ALL'}`);
          console.log(`  │    Formula: ${rule.formulaType || 'ALL'}`);
          console.log(`  │    Valid: ${rule.validFrom.toISOString().split('T')[0]} → ${rule.validTo ? rule.validTo.toISOString().split('T')[0] : 'null'}`);
          console.log(`  │    Created: ${rule.createdAt.toISOString().split('T')[0]}`);
          if (index < guaranteeRules.length - 1) {
            console.log('  │');
          }
        });

        console.log('  └────────────────────────────────────────────────────────────\n');
      }

      console.log('\n');
    }

    // CRITICAL ANALYSIS: Check for VOL vs INCENDIE discrepancy
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  CRITICAL ANALYSIS: VOL vs INCENDIE Comparison');
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const convention of conventions) {
      console.log(`\n📊 Convention: ${convention.name}`);
      console.log('─────────────────────────────────────────────────────────────\n');

      // Get VOL rules
      const volGuarantee = guarantees.find(g => g.systemRole === 'MANDATORY_VOL');
      const volRules = reductionRules.filter(
        r => r.conventionId === convention.id && r.guaranteeId === volGuarantee?.id
      );

      // Get INCENDIE rules
      const incendieGuarantee = guarantees.find(g => g.systemRole === 'MANDATORY_INCENDIE');
      const incendieRules = reductionRules.filter(
        r => r.conventionId === convention.id && r.guaranteeId === incendieGuarantee?.id
      );

      console.log(`  VOL Rules: ${volRules.length}`);
      volRules.forEach((rule, i) => {
        console.log(`    ${i + 1}. Metric: ${rule.metric}, Range: ${rule.minValue}-${rule.maxValue}, Discount: ${rule.discountPercent}%, Formula: ${rule.formulaType || 'ALL'}, Company: ${rule.company?.name || 'ALL'}`);
      });

      console.log(`\n  INCENDIE Rules: ${incendieRules.length}`);
      incendieRules.forEach((rule, i) => {
        console.log(`    ${i + 1}. Metric: ${rule.metric}, Range: ${rule.minValue}-${rule.maxValue}, Discount: ${rule.discountPercent}%, Formula: ${rule.formulaType || 'ALL'}, Company: ${rule.company?.name || 'ALL'}`);
      });

      // Check for discrepancies
      if (volRules.length !== incendieRules.length) {
        console.log(`\n  ⚠️  WARNING: VOL has ${volRules.length} rules but INCENDIE has ${incendieRules.length} rules`);
      }

      // Compare rules with same metric and range
      for (const volRule of volRules) {
        const matchingIncendieRule = incendieRules.find(
          ir =>
            ir.metric === volRule.metric &&
            ir.minValue?.toString() === volRule.minValue?.toString() &&
            ir.maxValue?.toString() === volRule.maxValue?.toString() &&
            ir.formulaType === volRule.formulaType &&
            ir.companyId === volRule.companyId
        );

        if (matchingIncendieRule) {
          if (volRule.discountPercent.toString() !== matchingIncendieRule.discountPercent.toString()) {
            console.log(`\n  ❌ DISCREPANCY FOUND:`);
            console.log(`     Metric: ${volRule.metric}, Range: ${volRule.minValue}-${volRule.maxValue}, Formula: ${volRule.formulaType || 'ALL'}`);
            console.log(`     VOL discount: ${volRule.discountPercent}%`);
            console.log(`     INCENDIE discount: ${matchingIncendieRule.discountPercent}%`);
            console.log(`     Difference: ${Math.abs(parseFloat(volRule.discountPercent.toString()) - parseFloat(matchingIncendieRule.discountPercent.toString()))}%`);
          }
        } else {
          console.log(`\n  ⚠️  VOL rule has no matching INCENDIE rule:`);
          console.log(`     Metric: ${volRule.metric}, Range: ${volRule.minValue}-${volRule.maxValue}, Discount: ${volRule.discountPercent}%, Formula: ${volRule.formulaType || 'ALL'}`);
        }
      }

      console.log('\n');
    }

    // TEST CASE: Simulate the exact client test
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  TEST CASE SIMULATION: Client Test Data');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const testData = {
      company: 'LLOYD Assurances',
      formula: 'TOUS_RISQUES_0',
      VN: 110000,
      VV: 80000,
      conventionName: conventions[0]?.name || 'Unknown', // Assuming first convention
    };

    console.log('Test Parameters:');
    console.log(`  Company: ${testData.company}`);
    console.log(`  Formula: ${testData.formula}`);
    console.log(`  VN (Valeur à neuf): ${testData.VN} DT`);
    console.log(`  VV (Valeur vénale): ${testData.VV} DT`);
    console.log(`  Convention: ${testData.conventionName}\n`);

    const lloydCompany = companies.find(c => c.name === testData.company);
    const testConvention = conventions[0]; // Assuming first convention

    if (lloydCompany && testConvention) {
      console.log('Expected Behavior:');
      console.log('  For TOUS_RISQUES_0, both VOL and INCENDIE should use NEW_VALUE metric (110,000 DT)\n');

      // Find matching VOL rule
      const volGuarantee = guarantees.find(g => g.systemRole === 'MANDATORY_VOL');
      const matchingVolRule = reductionRules.find(
        r =>
          r.conventionId === testConvention.id &&
          r.guaranteeId === volGuarantee?.id &&
          r.metric === 'NEW_VALUE' &&
          (r.companyId === lloydCompany.id || r.companyId === null) &&
          (r.formulaType === 'TOUS_RISQUES_0' || r.formulaType === null) &&
          (r.minValue === null || parseFloat(r.minValue.toString()) <= testData.VN) &&
          (r.maxValue === null || parseFloat(r.maxValue.toString()) >= testData.VN)
      );

      // Find matching INCENDIE rule
      const incendieGuarantee = guarantees.find(g => g.systemRole === 'MANDATORY_INCENDIE');
      const matchingIncendieRule = reductionRules.find(
        r =>
          r.conventionId === testConvention.id &&
          r.guaranteeId === incendieGuarantee?.id &&
          r.metric === 'NEW_VALUE' &&
          (r.companyId === lloydCompany.id || r.companyId === null) &&
          (r.formulaType === 'TOUS_RISQUES_0' || r.formulaType === null) &&
          (r.minValue === null || parseFloat(r.minValue.toString()) <= testData.VN) &&
          (r.maxValue === null || parseFloat(r.maxValue.toString()) >= testData.VN)
      );

      console.log('Matching Rules Found:\n');

      if (matchingVolRule) {
        console.log(`  ✅ VOL Rule:`);
        console.log(`     Discount: ${matchingVolRule.discountPercent}%`);
        console.log(`     Metric: ${matchingVolRule.metric}`);
        console.log(`     Range: ${matchingVolRule.minValue || 'null'} → ${matchingVolRule.maxValue || 'null'}`);
        console.log(`     Formula: ${matchingVolRule.formulaType || 'ALL'}`);
        console.log(`     Company: ${matchingVolRule.company?.name || 'ALL'}`);
        console.log(`     Priority: ${matchingVolRule.priority}`);
      } else {
        console.log(`  ❌ VOL Rule: NOT FOUND`);
      }

      console.log('');

      if (matchingIncendieRule) {
        console.log(`  ✅ INCENDIE Rule:`);
        console.log(`     Discount: ${matchingIncendieRule.discountPercent}%`);
        console.log(`     Metric: ${matchingIncendieRule.metric}`);
        console.log(`     Range: ${matchingIncendieRule.minValue || 'null'} → ${matchingIncendieRule.maxValue || 'null'}`);
        console.log(`     Formula: ${matchingIncendieRule.formulaType || 'ALL'}`);
        console.log(`     Company: ${matchingIncendieRule.company?.name || 'ALL'}`);
        console.log(`     Priority: ${matchingIncendieRule.priority}`);
      } else {
        console.log(`  ❌ INCENDIE Rule: NOT FOUND`);
      }

      console.log('\n');

      // Compare results
      if (matchingVolRule && matchingIncendieRule) {
        const volDiscount = parseFloat(matchingVolRule.discountPercent.toString());
        const incendieDiscount = parseFloat(matchingIncendieRule.discountPercent.toString());

        if (volDiscount === incendieDiscount) {
          console.log(`  ✅ RESULT: Both VOL and INCENDIE have the same discount: ${volDiscount}%`);
        } else {
          console.log(`  ❌ PROBLEM FOUND:`);
          console.log(`     VOL discount: ${volDiscount}%`);
          console.log(`     INCENDIE discount: ${incendieDiscount}%`);
          console.log(`     Expected: Both should be ${incendieDiscount}% (same as INCENDIE)`);
          console.log(`\n  🔧 FIX NEEDED: Update VOL rule to match INCENDIE discount`);
        }
      } else {
        console.log(`  ⚠️  Cannot compare: One or both rules are missing`);
      }
    } else {
      console.log('  ⚠️  Cannot run test: Company or Convention not found');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  END OF DIAGNOSTIC');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkReductionRules()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
