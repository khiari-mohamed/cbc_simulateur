import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function setupDommagesCollisions() {
  console.log('🚀 DOMMAGES COLLISIONS - Complete Setup\n');
  console.log('=' .repeat(60));

  const dcGuarantee = await prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_COLLISIONS' } });
  const companies = await prisma.company.findMany();

  if (!dcGuarantee) {
    console.log('❌ DOMMAGES_COLLISIONS guarantee not found');
    return;
  }

  // Step 1: Clean all existing rules
  console.log('\n🧹 Step 1: Cleaning existing rules...');
  const deleted = await prisma.pricingRule.deleteMany({
    where: { guaranteeId: dcGuarantee.id }
  });
  console.log(`   ✅ Deleted ${deleted.count} old rules\n`);

  // Step 2: Add PRIVATE_BUSINESS (Promenade et Affaire) - Tiered System
  console.log('📊 Step 2: Adding PRIVATE_BUSINESS (Promenade et Affaire) - Tiered System');
  console.log('-'.repeat(60));

  const tiers = [
    { level: 1, rate: 0.067, description: '0-10% of VV' },
    { level: 2, rate: 0.063, description: '10-20% of VV' },
    { level: 3, rate: 0.058, description: '20-30% of VV' },
    { level: 4, rate: 0.055, description: '30-40% of VV' },
    { level: 5, rate: 0.05, description: '40-50% of VV' }
  ];

  for (const company of companies) {
    // Add base premium
    await prisma.pricingRule.create({
      data: {
        companyId: company.id,
        guaranteeId: dcGuarantee.id,
        usageType: 'PRIVATE_BUSINESS',
        basePremium: 10,
        isActive: true
      }
    });

    // Add tiered rates
    for (const tier of tiers) {
      await prisma.pricingRule.create({
        data: {
          companyId: company.id,
          guaranteeId: dcGuarantee.id,
          usageType: 'PRIVATE_BUSINESS',
          tierLevel: tier.level,
          tierRate: tier.rate,
          isActive: true
        }
      });
    }
    
    console.log(`   ✅ ${company.name}:`);
    console.log(`      - Base Premium: 10 DT`);
    tiers.forEach(t => console.log(`      - Tier ${t.level} (${t.description}): ${(t.rate * 100).toFixed(1)}%`));
  }

  // Step 3: Add COMMERCIAL (Affaire) - Lookup Table
  console.log('\n📋 Step 3: Adding COMMERCIAL (Affaire) - Lookup Table');
  console.log('-'.repeat(60));

  const lookupTable = [
    // 8,000 < VV <= 30,000
    { minVV: 8000, maxVV: 30000, capital: 1000, prime: 77 },
    { minVV: 8000, maxVV: 30000, capital: 2000, prime: 142.7 },
    { minVV: 8000, maxVV: 30000, capital: 3000, prime: 205.3 },
    { minVV: 8000, maxVV: 30000, capital: 4000, prime: 265.7 },
    { minVV: 8000, maxVV: 30000, capital: 5000, prime: 322.7 },
    { minVV: 8000, maxVV: 30000, capital: 6000, prime: 393 },
    { minVV: 8000, maxVV: 30000, capital: 7000, prime: 449.5 },
    { minVV: 8000, maxVV: 30000, capital: 8000, prime: 506 },
    { minVV: 8000, maxVV: 30000, capital: 9000, prime: 560 },
    { minVV: 8000, maxVV: 30000, capital: 10000, prime: 612.5 },
    { minVV: 8000, maxVV: 30000, capital: 15000, prime: 894 },

    // 30,000 < VV <= 60,000
    { minVV: 30000.01, maxVV: 60000, capital: 1000, prime: 77 },
    { minVV: 30000.01, maxVV: 60000, capital: 2000, prime: 144 },
    { minVV: 30000.01, maxVV: 60000, capital: 3000, prime: 211 },
    { minVV: 30000.01, maxVV: 60000, capital: 4000, prime: 278 },
    { minVV: 30000.01, maxVV: 60000, capital: 5000, prime: 343.7 },
    { minVV: 30000.01, maxVV: 60000, capital: 6000, prime: 408 },
    { minVV: 30000.01, maxVV: 60000, capital: 7000, prime: 471 },
    { minVV: 30000.01, maxVV: 60000, capital: 8000, prime: 534 },
    { minVV: 30000.01, maxVV: 60000, capital: 9000, prime: 595.3 },
    { minVV: 30000.01, maxVV: 60000, capital: 10000, prime: 656.7 },
    { minVV: 30000.01, maxVV: 60000, capital: 15000, prime: 947 },
    { minVV: 30000.01, maxVV: 60000, capital: 20000, prime: 1220 },
    { minVV: 30000.01, maxVV: 60000, capital: 30000, prime: 1768 },

    // 60,000 < VV <= 80,000 (80k is INCLUSIVE per client spec)
    { minVV: 60000.01, maxVV: 80000, capital: 1000, prime: 77 },
    { minVV: 60000.01, maxVV: 80000, capital: 2000, prime: 144 },
    { minVV: 60000.01, maxVV: 80000, capital: 3000, prime: 211 },
    { minVV: 60000.01, maxVV: 80000, capital: 4000, prime: 278 },
    { minVV: 60000.01, maxVV: 80000, capital: 5000, prime: 345 },
    { minVV: 60000.01, maxVV: 80000, capital: 6000, prime: 412 },
    { minVV: 60000.01, maxVV: 80000, capital: 7000, prime: 479 },
    { minVV: 60000.01, maxVV: 80000, capital: 8000, prime: 544 },
    { minVV: 60000.01, maxVV: 80000, capital: 9000, prime: 607 },
    { minVV: 60000.01, maxVV: 80000, capital: 10000, prime: 670 },
    { minVV: 60000.01, maxVV: 80000, capital: 15000, prime: 983 },
    { minVV: 60000.01, maxVV: 80000, capital: 20000, prime: 1275 },
    { minVV: 60000.01, maxVV: 80000, capital: 30000, prime: 1827.5 },
    { minVV: 60000.01, maxVV: 80000, capital: 40000, prime: 2354 },

    // 80,000 < VV <= 100,000 (80k is EXCLUSIVE - only > 80,000)
    { minVV: 80000.01, maxVV: 100000, capital: 1000, prime: 77 },
    { minVV: 80000.01, maxVV: 100000, capital: 2000, prime: 144 },
    { minVV: 80000.01, maxVV: 100000, capital: 3000, prime: 211 },
    { minVV: 80000.01, maxVV: 100000, capital: 4000, prime: 278 },
    { minVV: 80000.01, maxVV: 100000, capital: 5000, prime: 345 },
    { minVV: 80000.01, maxVV: 100000, capital: 6000, prime: 412 },
    { minVV: 80000.01, maxVV: 100000, capital: 7000, prime: 479 },
    { minVV: 80000.01, maxVV: 100000, capital: 8000, prime: 546 },
    { minVV: 80000.01, maxVV: 100000, capital: 9000, prime: 613 },
    { minVV: 80000.01, maxVV: 100000, capital: 10000, prime: 678 },
    { minVV: 80000.01, maxVV: 100000, capital: 15000, prime: 993 },
    { minVV: 80000.01, maxVV: 100000, capital: 20000, prime: 1303 },
    { minVV: 80000.01, maxVV: 100000, capital: 30000, prime: 1878.5 },
    { minVV: 80000.01, maxVV: 100000, capital: 40000, prime: 2418.5 },
    { minVV: 80000.01, maxVV: 100000, capital: 50000, prime: 2940 },

    // 100,000 < VV <= 150,000
    { minVV: 100000.01, maxVV: 150000, capital: 1000, prime: 77 },
    { minVV: 100000.01, maxVV: 150000, capital: 2000, prime: 144 },
    { minVV: 100000.01, maxVV: 150000, capital: 3000, prime: 211 },
    { minVV: 100000.01, maxVV: 150000, capital: 4000, prime: 278 },
    { minVV: 100000.01, maxVV: 150000, capital: 5000, prime: 345 },
    { minVV: 100000.01, maxVV: 150000, capital: 6000, prime: 412 },
    { minVV: 100000.01, maxVV: 150000, capital: 7000, prime: 479 },
    { minVV: 100000.01, maxVV: 150000, capital: 8000, prime: 546 },
    { minVV: 100000.01, maxVV: 150000, capital: 9000, prime: 613 },
    { minVV: 100000.01, maxVV: 150000, capital: 10000, prime: 680 },
    { minVV: 100000.01, maxVV: 150000, capital: 15000, prime: 1007 },
    { minVV: 100000.01, maxVV: 150000, capital: 20000, prime: 1322 },
    { minVV: 100000.01, maxVV: 150000, capital: 30000, prime: 1932 },
    { minVV: 100000.01, maxVV: 150000, capital: 40000, prime: 2504.8 },
    { minVV: 100000.01, maxVV: 150000, capital: 50000, prime: 3051 },
    { minVV: 100000.01, maxVV: 150000, capital: 75000, prime: 4405 },

    // 150,000 < VV <= 200,000
    { minVV: 150000.01, maxVV: 200000, capital: 1000, prime: 77 },
    { minVV: 150000.01, maxVV: 200000, capital: 2000, prime: 144 },
    { minVV: 150000.01, maxVV: 200000, capital: 3000, prime: 211 },
    { minVV: 150000.01, maxVV: 200000, capital: 4000, prime: 278 },
    { minVV: 150000.01, maxVV: 200000, capital: 5000, prime: 345 },
    { minVV: 150000.01, maxVV: 200000, capital: 6000, prime: 412 },
    { minVV: 150000.01, maxVV: 200000, capital: 7000, prime: 479 },
    { minVV: 150000.01, maxVV: 200000, capital: 8000, prime: 546 },
    { minVV: 150000.01, maxVV: 200000, capital: 9000, prime: 613 },
    { minVV: 150000.01, maxVV: 200000, capital: 10000, prime: 680 },
    { minVV: 150000.01, maxVV: 200000, capital: 15000, prime: 1015 },
    { minVV: 150000.01, maxVV: 200000, capital: 20000, prime: 1342 },
    { minVV: 150000.01, maxVV: 200000, capital: 30000, prime: 1972 },
    { minVV: 150000.01, maxVV: 200000, capital: 40000, prime: 2582 },
    { minVV: 150000.01, maxVV: 200000, capital: 50000, prime: 3160.8 },
    { minVV: 150000.01, maxVV: 200000, capital: 75000, prime: 4528 },
    { minVV: 150000.01, maxVV: 200000, capital: 100000, prime: 5870 },

    // VV > 200,000
    { minVV: 200000.01, maxVV: null, capital: 1000, prime: 77 },
    { minVV: 200000.01, maxVV: null, capital: 2000, prime: 144 },
    { minVV: 200000.01, maxVV: null, capital: 3000, prime: 211 },
    { minVV: 200000.01, maxVV: null, capital: 4000, prime: 278 },
    { minVV: 200000.01, maxVV: null, capital: 5000, prime: 345 },
    { minVV: 200000.01, maxVV: null, capital: 6000, prime: 412 },
    { minVV: 200000.01, maxVV: null, capital: 7000, prime: 479 },
    { minVV: 200000.01, maxVV: null, capital: 8000, prime: 546 },
    { minVV: 200000.01, maxVV: null, capital: 9000, prime: 613 },
    { minVV: 200000.01, maxVV: null, capital: 10000, prime: 680 },
    { minVV: 200000.01, maxVV: null, capital: 15000, prime: 1015 },
    { minVV: 200000.01, maxVV: null, capital: 20000, prime: 1350 },
    { minVV: 200000.01, maxVV: null, capital: 30000, prime: 2020 },
    { minVV: 200000.01, maxVV: null, capital: 40000, prime: 2670 },
    { minVV: 200000.01, maxVV: null, capital: 50000, prime: 3300 },
    { minVV: 200000.01, maxVV: null, capital: 75000, prime: 4837.5 },
    { minVV: 200000.01, maxVV: null, capital: 100000, prime: 6285 },
  ];

  for (const company of companies) {
    for (const entry of lookupTable) {
      await prisma.pricingRule.create({
        data: {
          companyId: company.id,
          guaranteeId: dcGuarantee.id,
          usageType: 'COMMERCIAL',
          minMarketValue: new Decimal(entry.minVV),
          maxMarketValue: entry.maxVV ? new Decimal(entry.maxVV) : null,
          minCapital: new Decimal(entry.capital),
          maxCapital: new Decimal(entry.capital),
          fixedPremium: new Decimal(entry.prime),
          isActive: true
        }
      });
    }
    console.log(`   ✅ ${company.name}: ${lookupTable.length} lookup entries added`);
  }

  // Step 4: Verification
  console.log('\n🔍 Step 4: Verification');
  console.log('-'.repeat(60));

  // Test case 1: VV = 80,000 DT, Capital = 10,000 DT (COMMERCIAL)
  console.log('\n   Test 1: COMMERCIAL - VV = 80,000 DT, Capital = 10,000 DT');
  const test1 = await prisma.pricingRule.findFirst({
    where: {
      guaranteeId: dcGuarantee.id,
      usageType: 'COMMERCIAL',
      minMarketValue: { lt: new Decimal(80000) },
      OR: [
        { maxMarketValue: { gte: new Decimal(80000) } },
        { maxMarketValue: null }
      ],
      minCapital: new Decimal(10000),
      maxCapital: new Decimal(10000),
    },
    orderBy: { minMarketValue: 'desc' }
  });
  console.log(`   Expected: 670 DT | Found: ${test1?.fixedPremium?.toString() || 'NOT FOUND'} DT`);
  console.log(`   ${test1?.fixedPremium?.eq(670) ? '✅ PASS' : '❌ FAIL'}`);

  // Test case 1B: VV = 80,001 DT, Capital = 10,000 DT (COMMERCIAL)
  console.log('\n   Test 1B: COMMERCIAL - VV = 80,001 DT, Capital = 10,000 DT');
  const test1b = await prisma.pricingRule.findFirst({
    where: {
      guaranteeId: dcGuarantee.id,
      usageType: 'COMMERCIAL',
      minMarketValue: { lt: new Decimal(80001) },
      OR: [
        { maxMarketValue: { gte: new Decimal(80001) } },
        { maxMarketValue: null }
      ],
      minCapital: new Decimal(10000),
      maxCapital: new Decimal(10000),
    },
    orderBy: { minMarketValue: 'desc' }
  });
  console.log(`   Expected: 678 DT | Found: ${test1b?.fixedPremium?.toString() || 'NOT FOUND'} DT`);
  console.log(`   ${test1b?.fixedPremium?.eq(678) ? '✅ PASS' : '❌ FAIL'}`);

  // Test case 2: VV = 30,000 DT, Capital = 6,000 DT (PRIVATE_BUSINESS)
  console.log('\n   Test 2: PRIVATE_BUSINESS - VV = 30,000 DT, Capital = 6,000 DT');
  console.log('   Expected: 400 DT (10 base + 201 + 189)');
  console.log('   Formula: 10 + (3000 * 0.067) + (3000 * 0.063) = 10 + 201 + 189 = 400');
  
  const baseRule = await prisma.pricingRule.findFirst({
    where: {
      guaranteeId: dcGuarantee.id,
      usageType: 'PRIVATE_BUSINESS',
      basePremium: { not: null }
    }
  });
  
  const tierRulesTest = await prisma.pricingRule.findMany({
    where: {
      guaranteeId: dcGuarantee.id,
      usageType: 'PRIVATE_BUSINESS',
      tierLevel: { not: null }
    },
    orderBy: { tierLevel: 'asc' }
  });
  
  if (baseRule && tierRulesTest.length === 5) {
    const vv = new Decimal(30000);
    const capital = new Decimal(6000);
    const tier1 = tierRulesTest[0];
    const tier2 = tierRulesTest[1];
    
    const base = new Decimal(baseRule.basePremium!);
    const first10 = vv.mul(0.1).mul(tier1.tierRate!);
    const second10 = capital.sub(vv.mul(0.1)).mul(tier2.tierRate!);
    const total = base.add(first10).add(second10);
    
    console.log(`   Calculated: ${total.toFixed(2)} DT`);
    console.log(`   ${total.eq(400) ? '✅ PASS' : '❌ FAIL'}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ DOMMAGES COLLISIONS - Setup Complete!\n');
  
  await prisma.$disconnect();
}

setupDommagesCollisions().catch(console.error);
