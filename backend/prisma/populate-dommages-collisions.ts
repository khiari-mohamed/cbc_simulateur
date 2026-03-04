import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateDommagesCollisions() {
  console.log('🔧 Populating DOMMAGES_COLLISIONS Tiered Rates (PRIVATE_BUSINESS)\n');

  const dcGuarantee = await prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_COLLISIONS' } });
  const companies = await prisma.company.findMany();

  if (!dcGuarantee) {
    console.log('❌ DOMMAGES_COLLISIONS guarantee not found');
    return;
  }

  // Delete existing PRIVATE_BUSINESS rules
  await prisma.pricingRule.deleteMany({
    where: {
      guaranteeId: dcGuarantee.id,
      usageType: 'PRIVATE_BUSINESS'
    }
  });

  // Client spec: Tiered rates for DOMMAGES_COLLISIONS (Promenade et Affaire)
  // Tier 1 (0-10%): 6.7%
  // Tier 2 (10-20%): 6.3%
  // Tier 3 (20-30%): 5.8%
  // Tier 4 (30-40%): 5.5%
  // Tier 5 (40-50%): 5.0%
  // Base premium: 10 DT

  const tiers = [
    { level: 1, rate: 0.067 },
    { level: 2, rate: 0.063 },
    { level: 3, rate: 0.058 },
    { level: 4, rate: 0.055 },
    { level: 5, rate: 0.05 }
  ];

  for (const company of companies) {
    // Add base premium rule
    await prisma.pricingRule.create({
      data: {
        companyId: company.id,
        guaranteeId: dcGuarantee.id,
        usageType: 'PRIVATE_BUSINESS',
        basePremium: 10,
        isActive: true
      }
    });
    console.log(`   ✅ ${company.name}: Base premium = 10 DT`);

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
    console.log(`   ✅ ${company.name}: 5 tiered rates added`);
  }

  console.log('\n✅ DOMMAGES_COLLISIONS PRIVATE_BUSINESS fully configured!');
  await prisma.$disconnect();
}

populateDommagesCollisions().catch(console.error);
