import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateMissingData() {
  console.log('🔧 Populating Missing Pricing Data (100% Client Requirements)\n');

  // 1. Update Company contractFees
  console.log('1️⃣ Updating Company Contract Fees...');
  const lloyd = await prisma.company.findFirst({ where: { name: 'LLOYD Assurances' } });
  const amana = await prisma.company.findFirst({ where: { name: 'AL BARAKA' } });

  if (lloyd) {
    await prisma.company.update({
      where: { id: lloyd.id },
      data: { contractFees: 30 }
    });
    console.log('   ✅ LLOYD: 30 DT');
  }

  if (amana) {
    await prisma.company.update({
      where: { id: amana.id },
      data: { contractFees: 20 }
    });
    console.log('   ✅ AMANA: 20 DT');
  }

  // 2. Add PERSONNES_TRANSPORTEES rules (Structure doc values)
  console.log('\n2️⃣ Adding PERSONNES_TRANSPORTEES Rules...');
  const ptaGuarantee = await prisma.guarantee.findUnique({ where: { code: 'PERSONNES_TRANSPORTEES' } });

  if (ptaGuarantee && lloyd) {
    // LLOYD: 5000/21 and 10000/42 (from Structure doc)
    await prisma.pricingRule.create({
      data: {
        companyId: lloyd.id,
        guaranteeId: ptaGuarantee.id,
        minCapital: 5000,
        maxCapital: 9999,
        fixedPremium: 21,
        isActive: true
      }
    });
    await prisma.pricingRule.create({
      data: {
        companyId: lloyd.id,
        guaranteeId: ptaGuarantee.id,
        minCapital: 10000,
        maxCapital: 10000,
        fixedPremium: 42,
        isActive: true
      }
    });
    console.log('   ✅ LLOYD: 5000/21, 10000/42');
  }

  if (ptaGuarantee && amana) {
    // AMANA: 4000/32 and 8000/64 (from Structure doc)
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: ptaGuarantee.id,
        minCapital: 4000,
        maxCapital: 7999,
        fixedPremium: 32,
        isActive: true
      }
    });
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: ptaGuarantee.id,
        minCapital: 8000,
        maxCapital: 8000,
        fixedPremium: 64,
        isActive: true
      }
    });
    console.log('   ✅ AMANA: 4000/32, 8000/64');
  }

  // 3. Add BG (Bris de Glaces) rules
  console.log('\n3️⃣ Adding BG (Bris de Glaces) Rules...');
  const bgGuarantee = await prisma.guarantee.findUnique({ where: { code: 'BG' } });

  if (bgGuarantee && lloyd) {
    await prisma.pricingRule.create({
      data: {
        companyId: lloyd.id,
        guaranteeId: bgGuarantee.id,
        ratePercentage: 0.08, // 8%
        isActive: true
      }
    });
    console.log('   ✅ LLOYD: 8%');
  }

  if (bgGuarantee && amana) {
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: bgGuarantee.id,
        ratePercentage: 0.07, // 7%
        isActive: true
      }
    });
    console.log('   ✅ AMANA: 7%');
  }

  // 4. Add TOUS_RISQUES_ZERO franchise rules (same for both companies)
  console.log('\n4️⃣ Adding TOUS_RISQUES_ZERO Franchise Rules...');
  const trGuarantee = await prisma.guarantee.findUnique({ where: { code: 'TOUS_RISQUES_ZERO' } });

  const franchiseData = [
    { franchise: 0, rate: 0.032, fixed: 22 },
    { franchise: 1, rate: 0.0265, fixed: 21.75 },
    { franchise: 2, rate: 0.021, fixed: 19 },
    { franchise: 4, rate: 0.017, fixed: 15 }
  ];

  if (trGuarantee && lloyd) {
    for (const fd of franchiseData) {
      await prisma.pricingRule.create({
        data: {
          companyId: lloyd.id,
          guaranteeId: trGuarantee.id,
          franchiseRate: fd.franchise,
          ratePercentage: fd.rate,
          fixedPremium: fd.fixed,
          isActive: true
        }
      });
    }
    console.log('   ✅ LLOYD: 4 franchise rates (0%, 1%, 2%, 4%)');
  }

  if (trGuarantee && amana) {
    for (const fd of franchiseData) {
      await prisma.pricingRule.create({
        data: {
          companyId: amana.id,
          guaranteeId: trGuarantee.id,
          franchiseRate: fd.franchise,
          ratePercentage: fd.rate,
          fixedPremium: fd.fixed,
          isActive: true
        }
      });
    }
    console.log('   ✅ AMANA: 4 franchise rates (0%, 1%, 2%, 4%)');
  }

  console.log('\n✅ All missing data populated successfully!');
  console.log('\n📊 Summary:');
  console.log('   - Contract Fees: LLOYD=30, AMANA=20');
  console.log('   - PTA: LLOYD=5000/21 & 10000/42, AMANA=4000/32 & 8000/64');
  console.log('   - BG: LLOYD=8%, AMANA=7%');
  console.log('   - Tous Risques: 4 franchise rates for both companies');
  
  await prisma.$disconnect();
}

populateMissingData().catch(console.error);
