import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

interface TestCase {
  name: string;
  vv: number;
  van: number;
  capital: number;
  usage: 'COMMERCIAL' | 'PRIVATE_BUSINESS';
  expected: number;
  description: string;
}

async function testDommagesCollisions() {
  console.log('🧪 DOMMAGES COLLISIONS - Comprehensive Test Suite\n');
  console.log('='.repeat(70));

  const dcGuarantee = await prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_COLLISIONS' } });
  const lloyd = await prisma.company.findUnique({ where: { code: 'LLOYD' } });

  if (!dcGuarantee || !lloyd) {
    console.log('❌ Setup incomplete - run setup script first');
    return;
  }

  const testCases: TestCase[] = [
    // COMMERCIAL Tests
    {
      name: 'COM-1',
      vv: 80000,
      van: 80000,
      capital: 10000,
      usage: 'COMMERCIAL',
      expected: 670,
      description: 'Boundary - 80k VV should use 60k-80k range (670 DT)'
    },
    {
      name: 'COM-1B',
      vv: 80001,
      van: 80001,
      capital: 10000,
      usage: 'COMMERCIAL',
      expected: 678,
      description: 'Just over 80k - should use 80k-100k range (678 DT)'
    },
    {
      name: 'COM-2',
      vv: 30000,
      van: 30000,
      capital: 6000,
      usage: 'COMMERCIAL',
      expected: 393,
      description: 'Exact boundary - 30k VV, 6k capital'
    },
    {
      name: 'COM-3',
      vv: 100000,
      van: 100000,
      capital: 10000,
      usage: 'COMMERCIAL',
      expected: 678,
      description: 'Exact boundary - 100k VV (should use 80-100k range)'
    },
    {
      name: 'COM-4',
      vv: 100001,
      van: 100001,
      capital: 10000,
      usage: 'COMMERCIAL',
      expected: 680,
      description: 'Just over boundary - 100k+ VV'
    },
    {
      name: 'COM-5',
      vv: 60000,
      van: 60000,
      capital: 10000,
      usage: 'COMMERCIAL',
      expected: 656.7,
      description: 'Exact boundary - 60k VV (should use 30-60k range)'
    },
    {
      name: 'COM-6',
      vv: 60001,
      van: 60001,
      capital: 10000,
      usage: 'COMMERCIAL',
      expected: 670,
      description: 'Just over boundary - 60k+ VV'
    },

    // PRIVATE_BUSINESS Tests
    {
      name: 'PB-1',
      vv: 30000,
      van: 30000,
      capital: 6000,
      usage: 'PRIVATE_BUSINESS',
      expected: 400,
      description: 'Client example - 30k VV, 6k capital (20%)'
    },
    {
      name: 'PB-2',
      vv: 40000,
      van: 40000,
      capital: 6000,
      usage: 'PRIVATE_BUSINESS',
      expected: 404,
      description: 'Client example - 40k VV, 6k capital (15%)'
    },
    {
      name: 'PB-3',
      vv: 50000,
      van: 50000,
      capital: 5000,
      usage: 'PRIVATE_BUSINESS',
      expected: 345,
      description: 'Exactly 10% - single tier'
    },
    {
      name: 'PB-4',
      vv: 100000,
      van: 100000,
      capital: 50000,
      usage: 'PRIVATE_BUSINESS',
      expected: 2940,
      description: 'Maximum 50% - all 5 tiers (10+10k*6.7%+10k*6.3%+10k*5.8%+10k*5.5%+10k*5%)'
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    console.log(`\n📝 Test ${test.name}: ${test.description}`);
    console.log('-'.repeat(70));
    console.log(`   Input: VV=${test.vv}, Capital=${test.capital}, Usage=${test.usage}`);

    try {
      let calculatedPrime: Decimal;

      if (test.usage === 'COMMERCIAL') {
        // COMMERCIAL lookup
        const rule = await prisma.pricingRule.findFirst({
          where: {
            companyId: lloyd.id,
            guaranteeId: dcGuarantee.id,
            usageType: 'COMMERCIAL',
            minMarketValue: { lt: new Decimal(test.vv) },
            OR: [
              { maxMarketValue: { gte: new Decimal(test.vv) } },
              { maxMarketValue: null }
            ],
            minCapital: new Decimal(test.capital),
            maxCapital: new Decimal(test.capital),
          },
          orderBy: { minMarketValue: 'desc' }
        });

        if (!rule || !rule.fixedPremium) {
          console.log(`   ❌ FAIL: No rule found`);
          failed++;
          continue;
        }

        calculatedPrime = new Decimal(rule.fixedPremium);
      } else {
        // PRIVATE_BUSINESS tiered calculation
        const baseRule = await prisma.pricingRule.findFirst({
          where: {
            companyId: lloyd.id,
            guaranteeId: dcGuarantee.id,
            usageType: 'PRIVATE_BUSINESS',
            basePremium: { not: null }
          }
        });

        const tierRules = await prisma.pricingRule.findMany({
          where: {
            companyId: lloyd.id,
            guaranteeId: dcGuarantee.id,
            usageType: 'PRIVATE_BUSINESS',
            tierLevel: { not: null }
          },
          orderBy: { tierLevel: 'asc' }
        });

        if (!baseRule || !baseRule.basePremium || tierRules.length !== 5) {
          console.log(`   ❌ FAIL: Incomplete tier configuration`);
          failed++;
          continue;
        }

        const vv = new Decimal(test.vv);
        const capital = new Decimal(test.capital);
        let prime = new Decimal(baseRule.basePremium);

        const capitalPercent = capital.div(vv).mul(100);

        if (capitalPercent.lte(10)) {
          const tier1 = tierRules[0];
          prime = prime.add(capital.mul(tier1.tierRate!));
        } else if (capitalPercent.lte(20)) {
          const tier1 = tierRules[0];
          const tier2 = tierRules[1];
          const first10 = vv.mul(0.1).mul(tier1.tierRate!);
          const excess = capital.sub(vv.mul(0.1)).mul(tier2.tierRate!);
          prime = prime.add(first10).add(excess);
        } else if (capitalPercent.lte(30)) {
          const tier1 = tierRules[0];
          const tier2 = tierRules[1];
          const tier3 = tierRules[2];
          const first10 = vv.mul(0.1).mul(tier1.tierRate!);
          const second10 = vv.mul(0.1).mul(tier2.tierRate!);
          const excess = capital.sub(vv.mul(0.2)).mul(tier3.tierRate!);
          prime = prime.add(first10).add(second10).add(excess);
        } else if (capitalPercent.lte(40)) {
          const tier1 = tierRules[0];
          const tier2 = tierRules[1];
          const tier3 = tierRules[2];
          const tier4 = tierRules[3];
          const first10 = vv.mul(0.1).mul(tier1.tierRate!);
          const second10 = vv.mul(0.1).mul(tier2.tierRate!);
          const third10 = vv.mul(0.1).mul(tier3.tierRate!);
          const excess = capital.sub(vv.mul(0.3)).mul(tier4.tierRate!);
          prime = prime.add(first10).add(second10).add(third10).add(excess);
        } else {
          const tier1 = tierRules[0];
          const tier2 = tierRules[1];
          const tier3 = tierRules[2];
          const tier4 = tierRules[3];
          const tier5 = tierRules[4];
          const first10 = vv.mul(0.1).mul(tier1.tierRate!);
          const second10 = vv.mul(0.1).mul(tier2.tierRate!);
          const third10 = vv.mul(0.1).mul(tier3.tierRate!);
          const fourth10 = vv.mul(0.1).mul(tier4.tierRate!);
          const excess = capital.sub(vv.mul(0.4)).mul(tier5.tierRate!);
          prime = prime.add(first10).add(second10).add(third10).add(fourth10).add(excess);
        }

        calculatedPrime = prime;
      }

      const expected = new Decimal(test.expected);
      const match = calculatedPrime.eq(expected);

      console.log(`   Expected: ${expected.toFixed(2)} DT`);
      console.log(`   Calculated: ${calculatedPrime.toFixed(2)} DT`);
      
      if (match) {
        console.log(`   ✅ PASS`);
        passed++;
      } else {
        console.log(`   ❌ FAIL - Difference: ${calculatedPrime.sub(expected).toFixed(2)} DT`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ FAIL - Error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 Test Results:`);
  console.log(`   Total Tests: ${testCases.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Dommages Collisions is working perfectly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the setup.\n');
  }

  await prisma.$disconnect();
}

testDommagesCollisions().catch(console.error);
