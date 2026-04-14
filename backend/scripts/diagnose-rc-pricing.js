/**
 * Script to diagnose RC pricing issue
 * Client reported: RC shows 31,680,000 DT instead of 316,800 DT
 * 
 * Test scenario:
 * - Company: LLOYD Assurances
 * - CV: 25
 * - Bonus/Malus: Classe 5
 * - VN: 100,000 DT
 * - VV: 48,000 DT
 * - Formula: DOMMAGES_COLLISIONS
 * 
 * Usage:
 * node scripts/diagnose-rc-pricing.js dev
 * node scripts/diagnose-rc-pricing.js prod
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Decimal } = require('@prisma/client/runtime/library');

// Determine which database to use
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

async function diagnoseRcPricing() {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  RC PRICING DIAGNOSTIC - ${environment.toUpperCase()} DATABASE`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Get LLOYD company
    const lloyd = await prisma.company.findFirst({
      where: { name: 'LLOYD Assurances', isActive: true },
    });

    if (!lloyd) {
      console.error('❌ LLOYD Assurances not found');
      return;
    }

    console.log(`✅ Company found: ${lloyd.name} (${lloyd.id})\n`);

    // Get RC guarantee
    const rcGuarantee = await prisma.guarantee.findFirst({
      where: { systemRole: 'MANDATORY_RC', isActive: true },
    });

    if (!rcGuarantee) {
      console.error('❌ RC guarantee not found');
      return;
    }

    console.log(`✅ RC Guarantee found: ${rcGuarantee.code} (${rcGuarantee.id})\n`);

    // Get ALL RC pricing rules for LLOYD
    const allRcRules = await prisma.pricingRule.findMany({
      where: {
        companyId: lloyd.id,
        guaranteeId: rcGuarantee.id,
        isActive: true,
      },
      orderBy: [
        { bonusMalusClass: 'asc' },
        { minPower: 'asc' },
      ],
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  ALL RC PRICING RULES FOR LLOYD (${allRcRules.length} rules)`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Group by Bonus/Malus class
    const rulesByBM = {};
    allRcRules.forEach(rule => {
      const bm = rule.bonusMalusClass || 'NULL';
      if (!rulesByBM[bm]) {
        rulesByBM[bm] = [];
      }
      rulesByBM[bm].push(rule);
    });

    for (const [bm, rules] of Object.entries(rulesByBM)) {
      console.log(`┌─ Bonus/Malus Classe ${bm} ─────────────────────────────────`);
      console.log(`│  Rules: ${rules.length}\n│`);
      
      rules.forEach((rule, index) => {
        console.log(`│  Rule #${index + 1}:`);
        console.log(`│    CV Range: ${rule.minPower || 'null'} → ${rule.maxPower || 'null'}`);
        console.log(`│    Fixed Premium: ${rule.fixedPremium ? rule.fixedPremium.toString() : 'null'} DT`);
        console.log(`│    Convention: ${rule.conventionId || 'General'}`);
        console.log(`│    Created: ${rule.createdAt.toISOString().split('T')[0]}`);
        if (index < rules.length - 1) console.log('│');
      });
      
      console.log('└────────────────────────────────────────────────────────────\n');
    }

    // Test specific scenario: CV=25, BM=5
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  TEST SCENARIO: Client Case');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const testParams = {
      cv: 25,
      bonusMalus: 5,
      vn: 100000,
      vv: 48000,
      seats: 5,
      firstCirculation: '2026-01-01',
      formula: 'STANDARD',
    };

    console.log('Test Parameters (Exact Client Case):');
    console.log(`  Company: LLOYD Assurances`);
    console.log(`  Formula: STANDARD`);
    console.log(`  CV (Puissance fiscale): ${testParams.cv}`);
    console.log(`  Bonus/Malus: Classe ${testParams.bonusMalus}`);
    console.log(`  VN (Valeur à neuf): ${testParams.vn.toLocaleString()} DT`);
    console.log(`  VV (Valeur vénale): ${testParams.vv.toLocaleString()} DT`);
    console.log(`  Nombre de places: ${testParams.seats}`);
    console.log(`  Date 1ère circulation: ${testParams.firstCirculation}`);
    console.log(`  Usage: Privé/Affaires`);
    console.log(`  Garanties optionnelles: Aucune (formule Standard)\n`);

    // Find matching RC rule
    const matchingRule = await prisma.pricingRule.findFirst({
      where: {
        companyId: lloyd.id,
        guaranteeId: rcGuarantee.id,
        isActive: true,
        bonusMalusClass: testParams.bonusMalus,
        minPower: { lte: testParams.cv },
        maxPower: { gte: testParams.cv },
        conventionId: null, // General rule (no convention)
      },
    });

    if (matchingRule) {
      console.log('✅ Matching RC Rule Found:\n');
      console.log(`   CV Range: ${matchingRule.minPower} → ${matchingRule.maxPower}`);
      console.log(`   Bonus/Malus: Classe ${matchingRule.bonusMalusClass}`);
      console.log(`   Fixed Premium: ${matchingRule.fixedPremium.toString()} DT`);
      console.log(`   Convention: ${matchingRule.conventionId || 'General (no convention)'}`);
      console.log(`   Created: ${matchingRule.createdAt.toISOString().split('T')[0]}\n`);

      // Check if the value is correct
      const expectedPremium = 316800; // From RC table
      const actualPremium = parseFloat(matchingRule.fixedPremium.toString());

      console.log('═══════════════════════════════════════════════════════════════');
      console.log('  VERIFICATION');
      console.log('═══════════════════════════════════════════════════════════════\n');

      console.log(`Expected RC Premium (from RC table): ${expectedPremium.toLocaleString()} DT`);
      console.log(`Actual RC Premium (from database):   ${actualPremium.toLocaleString()} DT\n`);

      if (actualPremium === expectedPremium) {
        console.log('✅ CORRECT: Database value matches expected value!');
      } else if (actualPremium === expectedPremium * 100) {
        console.log('❌ ERROR: Database value is 100x too large!');
        console.log(`   Database has: ${actualPremium.toLocaleString()} DT`);
        console.log(`   Should be:    ${expectedPremium.toLocaleString()} DT`);
        console.log(`   Difference:   Factor of 100`);
      } else if (actualPremium === expectedPremium / 100) {
        console.log('❌ ERROR: Database value is 100x too small!');
        console.log(`   Database has: ${actualPremium.toLocaleString()} DT`);
        console.log(`   Should be:    ${expectedPremium.toLocaleString()} DT`);
        console.log(`   Difference:   Factor of 0.01`);
      } else {
        console.log('⚠️  WARNING: Database value does not match expected value!');
        console.log(`   Difference: ${(actualPremium - expectedPremium).toLocaleString()} DT`);
      }

      // Check decimal places
      const decimalPlaces = (matchingRule.fixedPremium.toString().split('.')[1] || '').length;
      console.log(`\n📊 Decimal Analysis:`);
      console.log(`   Value in DB: ${matchingRule.fixedPremium.toString()}`);
      console.log(`   Decimal places: ${decimalPlaces}`);
      console.log(`   Type: Decimal(15, 6) - allows up to 6 decimal places`);

    } else {
      console.log('❌ No matching RC rule found for CV=25, BM=5\n');
      console.log('Available rules for BM=5:');
      const bm5Rules = allRcRules.filter(r => r.bonusMalusClass === 5);
      if (bm5Rules.length === 0) {
        console.log('   No rules found for Bonus/Malus Classe 5');
      } else {
        bm5Rules.forEach((rule, i) => {
          console.log(`   ${i + 1}. CV ${rule.minPower}-${rule.maxPower}: ${rule.fixedPremium} DT`);
        });
      }
    }

    // Check if there are any rules with suspiciously large values
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ANOMALY DETECTION: Suspiciously Large RC Premiums');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const suspiciousRules = allRcRules.filter(rule => {
      const premium = parseFloat(rule.fixedPremium.toString());
      return premium > 1000000; // More than 1 million DT
    });

    if (suspiciousRules.length > 0) {
      console.log(`⚠️  Found ${suspiciousRules.length} rules with premiums > 1,000,000 DT:\n`);
      suspiciousRules.forEach((rule, i) => {
        console.log(`   ${i + 1}. BM=${rule.bonusMalusClass}, CV=${rule.minPower}-${rule.maxPower}`);
        console.log(`      Premium: ${parseFloat(rule.fixedPremium.toString()).toLocaleString()} DT`);
        console.log(`      Possible issue: Value might be 100x too large\n`);
      });
    } else {
      console.log('✅ No suspiciously large premiums found (all < 1,000,000 DT)');
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
diagnoseRcPricing()
  .then(() => {
    console.log('✅ Diagnostic completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Diagnostic failed:', error);
    process.exit(1);
  });
