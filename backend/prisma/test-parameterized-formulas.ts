import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function testParameterizedFormulas() {
  console.log('🧪 Testing Parameterized Formulas...\n');

  const lloyd = await prisma.company.findUnique({ where: { code: 'LLOYD' } });
  const amana = await prisma.company.findUnique({ where: { code: 'AMANA' } });

  if (!lloyd || !amana) {
    throw new Error('Companies not found');
  }

  // Test 1: VOL Formula
  console.log('📝 Test 1: VOL Formula');
  const volGuarantee = await prisma.guarantee.findUnique({ where: { code: 'VOL' } });
  if (volGuarantee) {
    const volRule = await prisma.pricingRule.findFirst({
      where: { companyId: lloyd.id, guaranteeId: volGuarantee.id },
    });
    
    if (volRule) {
      const marketValue = new Decimal(50000);
      // OLD: ((50000 * 2.36) / 1000 + 30) = 148
      // NEW: (50000 * 0.00236 + 30) = 148
      const prime = marketValue.mul(volRule.ratePercentage!).add(volRule.fixedPremium!);
      console.log(`  Market Value: ${marketValue}`);
      console.log(`  Rate: ${volRule.ratePercentage}`);
      console.log(`  Fixed Premium: ${volRule.fixedPremium}`);
      console.log(`  Calculated Prime: ${prime.toFixed(2)} DT`);
      console.log(`  Expected: 148.00 DT`);
      console.log(`  ✅ ${prime.toFixed(2) === '148.00' ? 'PASS' : 'FAIL'}\n`);
    }
  }

  // Test 2: INCENDIE Formula
  console.log('📝 Test 2: INCENDIE Formula');
  const incendieGuarantee = await prisma.guarantee.findUnique({ where: { code: 'INCENDIE' } });
  if (incendieGuarantee) {
    const incendieRule = await prisma.pricingRule.findFirst({
      where: { companyId: lloyd.id, guaranteeId: incendieGuarantee.id },
    });
    
    if (incendieRule) {
      const marketValue = new Decimal(50000);
      // OLD: ((50000 * 2.75) / 1000 + 30) = 167.5
      // NEW: (50000 * 0.00275 + 30) = 167.5
      const prime = marketValue.mul(incendieRule.ratePercentage!).add(incendieRule.fixedPremium!);
      console.log(`  Market Value: ${marketValue}`);
      console.log(`  Rate: ${incendieRule.ratePercentage}`);
      console.log(`  Fixed Premium: ${incendieRule.fixedPremium}`);
      console.log(`  Calculated Prime: ${prime.toFixed(2)} DT`);
      console.log(`  Expected: 167.50 DT`);
      console.log(`  ✅ ${prime.toFixed(2) === '167.50' ? 'PASS' : 'FAIL'}\n`);
    }
  }

  // Test 3: BG Formula
  console.log('📝 Test 3: BG Formula (Lloyd)');
  const bgGuarantee = await prisma.guarantee.findUnique({ where: { code: 'BG' } });
  if (bgGuarantee) {
    const bgRuleLloyd = await prisma.pricingRule.findFirst({
      where: { companyId: lloyd.id, guaranteeId: bgGuarantee.id },
    });
    
    if (bgRuleLloyd) {
      const capital = new Decimal(1000);
      // NEW: 1000 * 0.065 = 65
      const prime = capital.mul(bgRuleLloyd.ratePercentage!);
      console.log(`  Capital: ${capital}`);
      console.log(`  Rate: ${bgRuleLloyd.ratePercentage} (6.5%)`);
      console.log(`  Calculated Prime: ${prime.toFixed(2)} DT`);
      console.log(`  Expected: 65.00 DT`);
      console.log(`  ✅ ${prime.toFixed(2) === '65.00' ? 'PASS' : 'FAIL'}\n`);
    }
  }

  // Test 4: TOUS_RISQUES Formula
  console.log('📝 Test 4: TOUS_RISQUES 0% Formula');
  const trGuarantee = await prisma.guarantee.findUnique({ where: { code: 'TOUS_RISQUES_ZERO' } });
  if (trGuarantee) {
    const trRule = await prisma.pricingRule.findFirst({
      where: { 
        companyId: lloyd.id, 
        guaranteeId: trGuarantee.id,
        franchiseRate: 0,
      },
    });
    
    if (trRule) {
      const newValue = new Decimal(80000);
      // OLD: (80000 * 0.032 + 22) = 2582
      // NEW: (80000 * 0.032 + 22) = 2582
      const prime = newValue.mul(trRule.ratePercentage!).add(trRule.fixedPremium!);
      console.log(`  New Value: ${newValue}`);
      console.log(`  Rate: ${trRule.ratePercentage}`);
      console.log(`  Fixed Premium: ${trRule.fixedPremium}`);
      console.log(`  Calculated Prime: ${prime.toFixed(2)} DT`);
      console.log(`  Expected: 2582.00 DT`);
      console.log(`  ✅ ${prime.toFixed(2) === '2582.00' ? 'PASS' : 'FAIL'}\n`);
    }
  }

  // Test 5: DC Capital Tiers
  console.log('📝 Test 5: DC Capital Tiers');
  const dcTiers = await prisma.dcCapitalTier.findMany({
    where: { companyId: lloyd.id },
    orderBy: { minAmount: 'asc' },
    include: { usage: true },
  });
  console.log(`  Found ${dcTiers.length} tiers:`);
  dcTiers.forEach(tier => {
    console.log(`    ${tier.minAmount} - ${tier.maxAmount}: step ${tier.step} (${tier.usage?.code})`);
  });
  console.log(`  ✅ ${dcTiers.length === 8 ? 'PASS' : 'FAIL'}\n`);

  // Test 6: DC Progressive Tiers
  console.log('📝 Test 6: DC Progressive Tiers');
  const privateUsage = await prisma.usage.findUnique({ where: { code: 'PRIVATE_BUSINESS' } });
  const dcProgressiveTiers = await prisma.dcProgressiveTier.findMany({
    where: { companyId: lloyd.id, usageId: privateUsage?.id },
    orderBy: { tierNumber: 'asc' },
  });
  console.log(`  Found ${dcProgressiveTiers.length} progressive tiers (PRIVATE_BUSINESS):`);
  dcProgressiveTiers.forEach(tier => {
    console.log(`    Tier ${tier.tierNumber}: ${Number(tier.tierRate) * 100}%`);
  });
  console.log(`  ✅ ${dcProgressiveTiers.length === 5 ? 'PASS' : 'FAIL'}\n`);

  // Test 7: DC Config
  console.log('📝 Test 7: DC Config');
  const dcConfig = await prisma.dcConfig.findUnique({
    where: { 
      companyId_usageId: {
        companyId: lloyd.id,
        usageId: privateUsage!.id,
      }
    },
  });
  if (dcConfig) {
    console.log(`  Base Premium: ${dcConfig.basePremium}`);
    console.log(`  Min Capital: ${dcConfig.minCapital}`);
    console.log(`  Max Capital %: ${dcConfig.maxCapitalPercent}%`);
    console.log(`  Max Capital Absolute: ${dcConfig.maxCapitalAbsolute}`);
    console.log(`  Use Matrix: ${dcConfig.useMatrix}`);
    console.log(`  Discount Percent: ${dcConfig.discountPercent}%`);
    console.log(`  ✅ PASS\n`);
  }

  // Test 8: DC Matrix
  console.log('📝 Test 8: DC Matrix (COMMERCIAL)');
  const vvRanges = await prisma.dcMatrixVvRange.count({
    where: { companyId: lloyd.id },
  });
  const capitals = await prisma.dcMatrixCapital.count({
    where: { companyId: lloyd.id },
  });
  const prices = await prisma.dcMatrixPrice.count();
  console.log(`  VV Ranges: ${vvRanges}`);
  console.log(`  Capitals: ${capitals}`);
  console.log(`  Matrix Prices: ${prices}`);
  console.log(`  ✅ ${vvRanges > 0 && capitals > 0 && prices > 0 ? 'PASS' : 'FAIL'}\n`);

  console.log('✅ All tests completed!');
}

testParameterizedFormulas()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
