import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedGuaranteeBundlings() {
  console.log('🔧 Seeding guarantee bundlings...\n');

  // Get Lloyd company
  const lloyd = await prisma.company.findUnique({ where: { code: 'LLOYD' } });
  if (!lloyd) {
    console.log('❌ Lloyd company not found');
    return;
  }

  // Get guarantees
  const dommagesEmeutes = await prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_EMEUTES' } });
  const catastrophesNaturelles = await prisma.guarantee.findUnique({ where: { code: 'CATASTROPHES_NATURELLES' } });

  if (!dommagesEmeutes || !catastrophesNaturelles) {
    console.log('❌ Required guarantees not found');
    return;
  }

  // Create bundling rule: LLOYD's DOMMAGES_EMEUTES includes CATASTROPHES_NATURELLES
  const existing = await prisma.guaranteeBundling.findFirst({
    where: {
      companyId: lloyd.id,
      parentGuaranteeId: dommagesEmeutes.id,
      includedGuaranteeId: catastrophesNaturelles.id,
    },
  });

  if (existing) {
    console.log('⏭️  Bundling rule already exists');
  } else {
    await prisma.guaranteeBundling.create({
      data: {
        companyId: lloyd.id,
        parentGuaranteeId: dommagesEmeutes.id,
        includedGuaranteeId: catastrophesNaturelles.id,
        formulaType: null, // Applies to all formulas
        isActive: true,
      },
    });
    console.log('✅ Created: LLOYD - DOMMAGES_EMEUTES includes CATASTROPHES_NATURELLES');
  }

  console.log('\n✅ Guarantee bundlings seeded!\n');
}

seedGuaranteeBundlings()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
