import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function testAllFormulas() {
  console.log('🧪 COMPREHENSIVE FORMULA VALIDATION\n');
  console.log('='.repeat(80));

  const lloyd = await prisma.company.findUnique({ where: { code: 'LLOYD' } });
  const amana = await prisma.company.findUnique({ where: { code: 'AMANA' } });

  if (!lloyd || !amana) {
    console.log('❌ Companies not found');
    return;
  }

  let totalTests = 0;
  let passedTests = 0;

  // Test 1: RC Table
  console.log('\n📋 Test 1: RC Table (Class 4, 5CV)');
  const rcRule = await prisma.pricingRule.findFirst({
    where: {
      companyId: lloyd.id,
      guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'RC' } }))!.id,
      bonusMalusClass: 4,
      minPower: 5,
      maxPower: 6,
    },
  });
  totalTests++;
  if (rcRule && Number(rcRule.fixedPremium) === 140) {
    console.log('✅ PASS: RC Class 4, 5-6CV = 140 DT');
    passedTests++;
  } else {
    console.log(`❌ FAIL: Expected 140, got ${rcRule?.fixedPremium}`);
  }

  // Test 2: CAS
  console.log('\n📋 Test 2: CAS Fixed Premiums');
  const casLloyd = await prisma.pricingRule.findFirst({
    where: { companyId: lloyd.id, guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'CAS' } }))!.id },
  });
  const casAmana = await prisma.pricingRule.findFirst({
    where: { companyId: amana.id, guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'CAS' } }))!.id },
  });
  totalTests += 2;
  if (casLloyd && Number(casLloyd.fixedPremium) === 45) {
    console.log('✅ PASS: CAS LLOYD = 45 DT');
    passedTests++;
  } else {
    console.log(`❌ FAIL: CAS LLOYD expected 45, got ${casLloyd?.fixedPremium}`);
  }
  if (casAmana && Number(casAmana.fixedPremium) === 20) {
    console.log('✅ PASS: CAS AMANA = 20 DT');
    passedTests++;
  } else {
    console.log(`❌ FAIL: CAS AMANA expected 20, got ${casAmana?.fixedPremium}`);
  }

  // Test 3: PTA
  console.log('\n📋 Test 3: PTA (Personnes Transportées)');
  const ptaLloyd5 = await prisma.pricingRule.findFirst({
    where: {
      companyId: lloyd.id,
      guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'PERSONNES_TRANSPORTEES' } }))!.id,
      minCapital: 5000,
    },
  });
  const ptaLloyd10 = await prisma.pricingRule.findFirst({
    where: {
      companyId: lloyd.id,
      guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'PERSONNES_TRANSPORTEES' } }))!.id,
      minCapital: 10000,
    },
  });
  const ptaAmana4 = await prisma.pricingRule.findFirst({
    where: {
      companyId: amana.id,
      guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'PERSONNES_TRANSPORTEES' } }))!.id,
      minCapital: 4000,
    },
  });
  const ptaAmana8 = await prisma.pricingRule.findFirst({
    where: {
      companyId: amana.id,
      guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'PERSONNES_TRANSPORTEES' } }))!.id,
      minCapital: 8000,
    },
  });
  totalTests += 4;
  if (ptaLloyd5 && Number(ptaLloyd5.fixedPremium) === 21) {
    console.log('✅ PASS: PTA LLOYD 5k = 21 DT');
    passedTests++;
  } else {
    console.log(`❌ FAIL: PTA LLOYD 5k expected 21, got ${ptaLloyd5?.fixedPremium}`);
  }
  if (ptaLloyd10 && Number(ptaLloyd10.fixedPremium) === 42) {
    console.log('✅ PASS: PTA LLOYD 10k = 42 DT');
    passedTests++;
  } else {
    console.log(`❌ FAIL: PTA LLOYD 10k expected 42, got ${ptaLloyd10?.fixedPremium}`);
  }
  if (ptaAmana4 && Number(ptaAmana4.fixedPremium) === 32) {
    console.log('✅ PASS: PTA AMANA 4k = 32 DT');
    passedTests++;
  } else {
    console.log(`❌ FAIL: PTA AMANA 4k expected 32, got ${ptaAmana4?.fixedPremium}`);
  }
  if (ptaAmana8 && Number(ptaAmana8.fixedPremium) === 64) {
    console.log('✅ PASS: PTA AMANA 8k = 64 DT');
    passedTests++;
  } else {
    console.log(`❌ FAIL: PTA AMANA 8k expected 64, got ${ptaAmana8?.fixedPremium}`);
  }

  // Test 4: Assistance
  console.log('\n📋 Test 4: Assistance');
  const assistLloyd = await prisma.pricingRule.findFirst({
    where: { companyId: lloyd.id, guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'ASSISTANCE' } }))!.id },
  });
  const assistAmana = await prisma.pricingRule.findFirst({
    where: { companyId: amana.id, guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'ASSISTANCE' } }))!.id },
  });
  totalTests += 2;
  if (assistLloyd && Number(assistLloyd.fixedPremium) === 115) {
    console.log('✅ PASS: Assistance LLOYD = 115 DT');
    passedTests++;
  } else {
    console.log(`❌ FAIL: Assistance LLOYD expected 115, got ${assistLloyd?.fixedPremium}`);
  }
  if (assistAmana && Number(assistAmana.fixedPremium) === 90) {
    console.log('✅ PASS: Assistance AMANA = 90 DT');
    passedTests++;
  } else {
    console.log(`❌ FAIL: Assistance AMANA expected 90, got ${assistAmana?.fixedPremium}`);
  }

  // Test 5: Tous Risques 0%
  console.log('\n📋 Test 5: Tous Risques 0% (Franchise 0%)');
  const tr0 = await prisma.pricingRule.findFirst({
    where: {
      companyId: lloyd.id,
      guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'TOUS_RISQUES_ZERO' } }))!.id,
      franchiseRate: 0,
    },
  });
  totalTests++;
  if (tr0 && Number(tr0.ratePercentage) === 0.032 && Number(tr0.fixedPremium) === 22) {
    console.log('✅ PASS: TR 0% = 3.2% + 22 DT');
    passedTests++;
  } else {
    console.log(`❌ FAIL: TR 0% expected 0.032 + 22, got ${tr0?.ratePercentage} + ${tr0?.fixedPremium}`);
  }

  // Test 6: BG
  console.log('\n📋 Test 6: Bris de Glaces');
  const bgLloyd = await prisma.pricingRule.findFirst({
    where: { companyId: lloyd.id, guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'BG' } }))!.id },
  });
  const bgAmana = await prisma.pricingRule.findFirst({
    where: { companyId: amana.id, guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'BG' } }))!.id },
  });
  totalTests += 2;
  if (bgLloyd && Number(bgLloyd.ratePercentage) === 0.08) {
    console.log('✅ PASS: BG LLOYD = 8%');
    passedTests++;
  } else {
    console.log(`❌ FAIL: BG LLOYD expected 0.08, got ${bgLloyd?.ratePercentage}`);
  }
  if (bgAmana && Number(bgAmana.ratePercentage) === 0.07) {
    console.log('✅ PASS: BG AMANA = 7%');
    passedTests++;
  } else {
    console.log(`❌ FAIL: BG AMANA expected 0.07, got ${bgAmana?.ratePercentage}`);
  }

  // Test 7: DC Commercial Sample
  console.log('\n📋 Test 7: Dommages Collision Commercial (VV=30k, Capital=6k)');
  const dcComm = await prisma.pricingRule.findFirst({
    where: {
      companyId: lloyd.id,
      guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_COLLISIONS' } }))!.id,
      usageType: 'COMMERCIAL',
      minMarketValue: { lte: 30000 },
      maxMarketValue: { gte: 30000 },
      minCapital: 6000,
      maxCapital: 6000,
    },
  });
  totalTests++;
  if (dcComm && Number(dcComm.fixedPremium) === 393) {
    console.log('✅ PASS: DC Commercial 30k/6k = 393 DT');
    passedTests++;
  } else {
    console.log(`❌ FAIL: DC Commercial expected 393, got ${dcComm?.fixedPremium}`);
  }

  // Test 8: DC Private Business Tiers
  console.log('\n📋 Test 8: Dommages Collision Private Business Tiers');
  const dcBase = await prisma.pricingRule.findFirst({
    where: {
      companyId: lloyd.id,
      guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_COLLISIONS' } }))!.id,
      usageType: 'PRIVATE_BUSINESS',
      basePremium: { not: null },
    },
  });
  const dcTiers = await prisma.pricingRule.count({
    where: {
      companyId: lloyd.id,
      guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_COLLISIONS' } }))!.id,
      usageType: 'PRIVATE_BUSINESS',
      tierLevel: { not: null },
    },
  });
  totalTests += 2;
  if (dcBase && Number(dcBase.basePremium) === 10) {
    console.log('✅ PASS: DC Private Base = 10 DT');
    passedTests++;
  } else {
    console.log(`❌ FAIL: DC Private Base expected 10, got ${dcBase?.basePremium}`);
  }
  if (dcTiers === 5) {
    console.log('✅ PASS: DC Private has 5 tiers');
    passedTests++;
  } else {
    console.log(`❌ FAIL: DC Private expected 5 tiers, got ${dcTiers}`);
  }

  // Test 9: Optional Guarantees
  console.log('\n📋 Test 9: Optional Guarantees');
  const incEmeutesLloyd = await prisma.pricingRule.findFirst({
    where: { companyId: lloyd.id, guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'INCENDIE_EMEUTES' } }))!.id },
  });
  const incEmeutesAmana = await prisma.pricingRule.findFirst({
    where: { companyId: amana.id, guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'INCENDIE_EMEUTES' } }))!.id },
  });
  const catnatAmana = await prisma.pricingRule.findFirst({
    where: { companyId: amana.id, guaranteeId: (await prisma.guarantee.findUnique({ where: { code: 'CATASTROPHES_NATURELLES' } }))!.id },
  });
  totalTests += 3;
  if (incEmeutesLloyd && Number(incEmeutesLloyd.fixedPremium) === 15) {
    console.log('✅ PASS: Incendie Émeutes LLOYD = 15 DT');
    passedTests++;
  } else {
    console.log(`❌ FAIL: Incendie Émeutes LLOYD expected 15, got ${incEmeutesLloyd?.fixedPremium}`);
  }
  if (!incEmeutesAmana) {
    console.log('✅ PASS: Incendie Émeutes AMANA = NC (absent)');
    passedTests++;
  } else {
    console.log('❌ FAIL: Incendie Émeutes AMANA should be absent');
  }
  if (catnatAmana && Number(catnatAmana.fixedPremium) === 40) {
    console.log('✅ PASS: CAT NAT AMANA = 40 DT');
    passedTests++;
  } else {
    console.log(`❌ FAIL: CAT NAT AMANA expected 40, got ${catnatAmana?.fixedPremium}`);
  }

  // Test 10: Company Fees
  console.log('\n📋 Test 10: Company Fees');
  totalTests += 2;
  if (Number(lloyd.contractFees) === 30) {
    console.log('✅ PASS: LLOYD Frais = 30 DT');
    passedTests++;
  } else {
    console.log(`❌ FAIL: LLOYD Frais expected 30, got ${lloyd.contractFees}`);
  }
  if (Number(amana.contractFees) === 20) {
    console.log('✅ PASS: AMANA Frais = 20 DT');
    passedTests++;
  } else {
    console.log(`❌ FAIL: AMANA Frais expected 20, got ${amana.contractFees}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Final Results:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${totalTests - passedTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL FORMULAS VALIDATED! System is 100% ready.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the configuration.\n');
  }

  await prisma.$disconnect();
}

testAllFormulas().catch(console.error);
