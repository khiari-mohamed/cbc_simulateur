import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addReductionRates() {
  console.log('🔧 Adding reduction rates...\n');

  const lloyd = await prisma.company.findFirst({ where: { name: { contains: 'LLOYD' } } });
  const amana = await prisma.company.findFirst({ where: { name: { contains: 'BARAKA' } } });

  if (!lloyd || !amana) {
    console.error('❌ Companies not found');
    return;
  }

  const guarantees = ['VOL', 'INCENDIE', 'TOUS_RISQUES_0', 'TOUS_RISQUES_ZERO', 'DOMMAGES_COLLISIONS'];

  for (const code of guarantees) {
    const guarantee = await prisma.guarantee.findUnique({ where: { code } });
    if (!guarantee) continue;

    // Check if rules already exist
    const existing = await prisma.pricingRule.findFirst({
      where: { companyId: lloyd.id, guaranteeId: guarantee.id },
    });

    if (!existing) {
      await prisma.pricingRule.create({
        data: {
          companyId: lloyd.id,
          guaranteeId: guarantee.id,
          reductionRate: 1.0,
          isActive: true,
        },
      });
      await prisma.pricingRule.create({
        data: {
          companyId: amana.id,
          guaranteeId: guarantee.id,
          reductionRate: 1.0,
          isActive: true,
        },
      });
      console.log(`✅ ${code}: reduction rate 1.0 for both companies`);
    } else {
      console.log(`⏭️  ${code}: already exists`);
    }
  }

  console.log('\n✅ All reduction rates added!\n');
}

addReductionRates()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
