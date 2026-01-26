import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAllPricing() {
  console.log('🔧 Fixing All Pricing Values...\n');

  const lloyd = await prisma.company.findFirst({ where: { name: { contains: 'LLOYD' } } });
  const amana = await prisma.company.findFirst({ where: { name: { contains: 'BARAKA' } } });

  if (!lloyd || !amana) {
    console.error('❌ Companies not found');
    console.log('Lloyd:', lloyd);
    console.log('Amana:', amana);
    return;
  }

  // Get all guarantees
  const cas = await prisma.guarantee.findUnique({ where: { code: 'CAS' } });
  const assistance = await prisma.guarantee.findUnique({ where: { code: 'ASSISTANCE' } });
  const incendieEmeutes = await prisma.guarantee.findUnique({ where: { code: 'INCENDIE_EMEUTES' } });
  const dommagesEmeutes = await prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_EMEUTES' } });
  const catnat = await prisma.guarantee.findUnique({ where: { code: 'CATASTROPHES_NATURELLES' } });

  // Delete old pricing rules for these guarantees
  const guaranteeIds = [cas?.id, assistance?.id, incendieEmeutes?.id, dommagesEmeutes?.id, catnat?.id].filter(Boolean);
  await prisma.pricingRule.deleteMany({
    where: { guaranteeId: { in: guaranteeIds as string[] } },
  });

  // CAS: LLOYD=45, AMANA=20
  if (cas) {
    await prisma.pricingRule.create({
      data: {
        companyId: lloyd.id,
        guaranteeId: cas.id,
        fixedPremium: 45,
        isActive: true,
      },
    });
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: cas.id,
        fixedPremium: 20,
        isActive: true,
      },
    });
    console.log('✅ CAS: LLOYD=45 DT, AMANA=20 DT');
  }

  // ASSISTANCE: LLOYD=115, AMANA=90
  if (assistance) {
    await prisma.pricingRule.create({
      data: {
        companyId: lloyd.id,
        guaranteeId: assistance.id,
        fixedPremium: 115,
        isActive: true,
      },
    });
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: assistance.id,
        fixedPremium: 90,
        isActive: true,
      },
    });
    console.log('✅ ASSISTANCE: LLOYD=115 DT, AMANA=90 DT');
  }

  // INCENDIE_EMEUTES: LLOYD=15, AMANA=NC (not covered)
  if (incendieEmeutes) {
    await prisma.pricingRule.create({
      data: {
        companyId: lloyd.id,
        guaranteeId: incendieEmeutes.id,
        fixedPremium: 15,
        isActive: true,
      },
    });
    console.log('✅ INCENDIE_EMEUTES: LLOYD=15 DT, AMANA=NC');
  }

  // DOMMAGES_EMEUTES: Both=30
  if (dommagesEmeutes) {
    await prisma.pricingRule.create({
      data: {
        companyId: lloyd.id,
        guaranteeId: dommagesEmeutes.id,
        fixedPremium: 30,
        isActive: true,
      },
    });
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: dommagesEmeutes.id,
        fixedPremium: 30,
        isActive: true,
      },
    });
    console.log('✅ DOMMAGES_EMEUTES: LLOYD=30 DT, AMANA=30 DT');
  }

  // CATASTROPHES_NATURELLES: AMANA only=40 (Tous Risques only)
  if (catnat) {
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: catnat.id,
        fixedPremium: 40,
        formulaType: 'TOUS_RISQUES_0',
        isActive: true,
      },
    });
    console.log('✅ CATASTROPHES_NATURELLES: AMANA=40 DT (Tous Risques only)');
  }

  console.log('\n✅ All Pricing Values Fixed!\n');
}

fixAllPricing()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
