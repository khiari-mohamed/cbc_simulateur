import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function purgeAll() {
  console.log('🧹 Purging existing data...');
  await prisma.quoteItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.simulationGuarantee.deleteMany();
  await prisma.simulation.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.conventionReductionRule.deleteMany();
  await prisma.conventionCompany.deleteMany();
  await prisma.convention.deleteMany();
  await prisma.clientOrganization.deleteMany();
  await prisma.guarantee.deleteMany();
  await prisma.company.deleteMany();
  await prisma.driverProfile.deleteMany();
  await prisma.quoteComparison.deleteMany();
  await prisma.dcMatrixPrice.deleteMany();
  await prisma.dcMatrixCapital.deleteMany();
  await prisma.dcMatrixVvRange.deleteMany();
  await prisma.dcProgressiveTier.deleteMany();
  await prisma.dcCapitalTier.deleteMany();
  await prisma.dcConfig.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log('🌱 Seeding MINIMAL database (RC Table only)...');
  console.log('📝 Prerequisites: Admin must create Companies and RC Guarantee via UI first');

  // Only purge pricing rules, NOT companies/guarantees/users
  console.log('🧹 Purging only pricing rules...');
  await prisma.pricingRule.deleteMany();

  // Fetch existing companies (must be created by admin via UI)
  const companies = await prisma.company.findMany();
  if (companies.length === 0) {
    throw new Error('❌ No companies found! Admin must create companies via /admin/companies first.');
  }
  console.log(`✅ Found ${companies.length} companies:`, companies.map(c => c.name).join(', '));

  // Fetch RC guarantee (must be created by admin via UI)
  const rcGuarantee = await prisma.guarantee.findUnique({ where: { code: 'RC' } });
  if (!rcGuarantee) {
    throw new Error('❌ RC Guarantee not found! Admin must create RC guarantee via /admin/guarantees first.');
  }
  console.log('✅ RC Guarantee found:', rcGuarantee.nameFr);

  // RC Table (8 classes × 5 CV bands × 2 companies = 80 rules)
  const rcTable = [
    { class: 1, cv: [3, 4], premium: 77 }, { class: 1, cv: [5, 6], premium: 98 }, { class: 1, cv: [7, 10], premium: 119 }, { class: 1, cv: [11, 14], premium: 154 }, { class: 1, cv: [15, 999], premium: 184.8 },
    { class: 2, cv: [3, 4], premium: 88 }, { class: 2, cv: [5, 6], premium: 112 }, { class: 2, cv: [7, 10], premium: 136 }, { class: 2, cv: [11, 14], premium: 176 }, { class: 2, cv: [15, 999], premium: 211.2 },
    { class: 3, cv: [3, 4], premium: 99 }, { class: 3, cv: [5, 6], premium: 126 }, { class: 3, cv: [7, 10], premium: 153 }, { class: 3, cv: [11, 14], premium: 198 }, { class: 3, cv: [15, 999], premium: 237.6 },
    { class: 4, cv: [3, 4], premium: 110 }, { class: 4, cv: [5, 6], premium: 140 }, { class: 4, cv: [7, 10], premium: 170 }, { class: 4, cv: [11, 14], premium: 220 }, { class: 4, cv: [15, 999], premium: 264 },
    { class: 5, cv: [3, 4], premium: 132 }, { class: 5, cv: [5, 6], premium: 168 }, { class: 5, cv: [7, 10], premium: 204 }, { class: 5, cv: [11, 14], premium: 264 }, { class: 5, cv: [15, 999], premium: 316.8 },
    { class: 6, cv: [3, 4], premium: 154 }, { class: 6, cv: [5, 6], premium: 196 }, { class: 6, cv: [7, 10], premium: 238 }, { class: 6, cv: [11, 14], premium: 308 }, { class: 6, cv: [15, 999], premium: 369.6 },
    { class: 7, cv: [3, 4], premium: 176 }, { class: 7, cv: [5, 6], premium: 224 }, { class: 7, cv: [7, 10], premium: 272 }, { class: 7, cv: [11, 14], premium: 352 }, { class: 7, cv: [15, 999], premium: 422.4 },
    { class: 8, cv: [3, 4], premium: 220 }, { class: 8, cv: [5, 6], premium: 280 }, { class: 8, cv: [7, 10], premium: 340 }, { class: 8, cv: [11, 14], premium: 440 }, { class: 8, cv: [15, 999], premium: 528 },
  ];

  for (const company of companies) {
    for (const rule of rcTable) {
      await prisma.pricingRule.create({
        data: {
          companyId: company.id,
          guaranteeId: rcGuarantee.id,
          bonusMalusClass: rule.class,
          minPower: rule.cv[0],
          maxPower: rule.cv[1],
          fixedPremium: rule.premium,
          isActive: true,
        },
      });
    }
  }

  const expectedRules = 40 * companies.length; // 40 rules per company (8 classes × 5 CV bands)
  console.log(`✅ RC Table created (${expectedRules} rules for ${companies.length} companies)`);

  // Validation
  const rcCount = await prisma.pricingRule.count({ where: { guaranteeId: rcGuarantee.id } });
  if (rcCount !== expectedRules) {
    console.warn(`⚠️ RC rules count expected ${expectedRules}, got ${rcCount}`);
  } else {
    console.log(`✅ RC rules count = ${expectedRules}`);
  }

  console.log('');
  console.log('🎉 RC TABLE SEEDING COMPLETED!');
  console.log('');
  console.log('✅ RC Table is ready to use!');
  console.log('');
  console.log('⚙️  Admin TODO via UI:');
  console.log('   1. Create remaining Guarantees (/admin/guarantees)');
  console.log('      - CAS, VOL, INCENDIE, PERSONNES_TRANSPORTEES, ASSISTANCE');
  console.log('      - BG, TOUS_RISQUES_ZERO, DOMMAGES_COLLISIONS, etc.');
  console.log('   2. Create Pricing Rules for each guarantee (/admin/pricing-rules)');
  console.log('      - VOL, INCENDIE, CAS, ASSISTANCE, PTA, BG, TR, DC, etc.');
  console.log('   3. Configure DC formulas if needed (/admin/formulas)');
  console.log('   4. (Optional) Create Organizations & Conventions');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
