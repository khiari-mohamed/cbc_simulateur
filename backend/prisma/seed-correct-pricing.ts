import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with CORRECT client specifications...');

  // 1. Create Admin User
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ars.com' },
    update: {},
    create: {
      email: 'admin@ars.com',
      password: hashedAdminPassword,
      firstName: 'Admin',
      lastName: 'ARS',
      phone: '+21671123456',
      role: 'ADMINISTRATEUR_ARS',
      isActive: true,
    },
  });
  console.log('✅ Admin user created');

  // 2. Create Manager User
  const hashedManagerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@ars.com' },
    update: {},
    create: {
      email: 'manager@ars.com',
      password: hashedManagerPassword,
      firstName: 'Manager',
      lastName: 'ARS',
      phone: '+21671123457',
      role: 'GESTIONNAIRE_VALIDATION_ARS',
      isActive: true,
    },
  });
  console.log('✅ Manager user created');

  // 3. Create Test Client
  const hashedClientPassword = await bcrypt.hash('client123', 10);
  const client = await prisma.user.upsert({
    where: { email: 'client@test.com' },
    update: {},
    create: {
      email: 'client@test.com',
      password: hashedClientPassword,
      firstName: 'Client',
      lastName: 'Test',
      phone: '+21671123458',
      role: 'CLIENT_ADHERENT',
      isActive: true,
    },
  });
  console.log('✅ Client user created');

  // 4. Create Companies with CORRECT fees
  const lloyd = await prisma.company.upsert({
    where: { code: 'LLOYD' },
    update: {
      contractFees: 30.00,
      fpac: 0.50,
      fssr: 0.30,
      fg: 3.00,
    },
    create: {
      name: 'LLOYD',
      code: 'LLOYD',
      contractFees: 30.00,
      fpac: 0.50,
      fssr: 0.30,
      fg: 3.00,
      isActive: true,
    },
  });
  console.log('✅ LLOYD company created');

  const amana = await prisma.company.upsert({
    where: { code: 'AMANA' },
    update: {
      contractFees: 20.00,
      fpac: 0.50,
      fssr: 0.30,
      fg: 3.00,
    },
    create: {
      name: 'AMANA',
      code: 'AMANA',
      contractFees: 20.00,
      fpac: 0.50,
      fssr: 0.30,
      fg: 3.00,
      isActive: true,
    },
  });
  console.log('✅ AMANA company created');

  // 5. Create Guarantees
  const guarantees = [
    { code: 'RC', nameFr: 'Responsabilité Civile', isOptional: false },
    { code: 'CAS', nameFr: 'Corporel Assuré Seul', isOptional: false },
    { code: 'VOL', nameFr: 'VOL', isOptional: true },
    { code: 'INCENDIE', nameFr: 'Incendie', isOptional: true },
    { code: 'INCENDIE_EMEUTES', nameFr: 'Incendie Suite Emeutes', isOptional: true },
    { code: 'CATASTROPHES_NATURELLES', nameFr: 'Extension Catastrophes Naturelles', isOptional: true },
    { code: 'DOMMAGES_EMEUTES', nameFr: 'Dommages suite émeutes', isOptional: true },
    { code: 'PERSONNES_TRANSPORTEES', nameFr: 'Personnes Transportées', isOptional: true },
    { code: 'ASSISTANCE', nameFr: 'Assistance Remorquage', isOptional: true },
    { code: 'TOUS_RISQUES_ZERO', nameFr: 'Tous Risques 0%', isOptional: true },
    { code: 'DOMMAGES_COLLISIONS', nameFr: 'Dommages Collision', isOptional: true },
    { code: 'BG', nameFr: 'Bris de Glaces', isOptional: true },
    { code: 'DEFENSE_RECOURS', nameFr: 'Défense et Recours', isOptional: true },
  ];

  for (const g of guarantees) {
    await prisma.guarantee.upsert({
      where: { code: g.code },
      update: {},
      create: g,
    });
  }
  console.log('✅ Guarantees created');

  // 6. Create CORRECT RC Pricing Rules (Tableau RC from client)
  const rcGuarantee = await prisma.guarantee.findUnique({ where: { code: 'RC' } });
  
  const rcRules = [
    // Classe 1 (70%)
    { bonusMalusClass: 1, minPower: 3, maxPower: 4, fixedPremium: 77.00 },
    { bonusMalusClass: 1, minPower: 5, maxPower: 6, fixedPremium: 98.00 },
    { bonusMalusClass: 1, minPower: 7, maxPower: 10, fixedPremium: 119.00 },
    { bonusMalusClass: 1, minPower: 11, maxPower: 14, fixedPremium: 154.00 },
    { bonusMalusClass: 1, minPower: 15, maxPower: 50, fixedPremium: 184.80 },
    // Classe 2 (80%)
    { bonusMalusClass: 2, minPower: 3, maxPower: 4, fixedPremium: 88.00 },
    { bonusMalusClass: 2, minPower: 5, maxPower: 6, fixedPremium: 112.00 },
    { bonusMalusClass: 2, minPower: 7, maxPower: 10, fixedPremium: 136.00 },
    { bonusMalusClass: 2, minPower: 11, maxPower: 14, fixedPremium: 176.00 },
    { bonusMalusClass: 2, minPower: 15, maxPower: 50, fixedPremium: 211.20 },
    // Classe 3 (90%)
    { bonusMalusClass: 3, minPower: 3, maxPower: 4, fixedPremium: 99.00 },
    { bonusMalusClass: 3, minPower: 5, maxPower: 6, fixedPremium: 126.00 },
    { bonusMalusClass: 3, minPower: 7, maxPower: 10, fixedPremium: 153.00 },
    { bonusMalusClass: 3, minPower: 11, maxPower: 14, fixedPremium: 198.00 },
    { bonusMalusClass: 3, minPower: 15, maxPower: 50, fixedPremium: 237.60 },
    // Classe 4 (100%)
    { bonusMalusClass: 4, minPower: 3, maxPower: 4, fixedPremium: 110.00 },
    { bonusMalusClass: 4, minPower: 5, maxPower: 6, fixedPremium: 140.00 },
    { bonusMalusClass: 4, minPower: 7, maxPower: 10, fixedPremium: 170.00 },
    { bonusMalusClass: 4, minPower: 11, maxPower: 14, fixedPremium: 220.00 },
    { bonusMalusClass: 4, minPower: 15, maxPower: 50, fixedPremium: 264.00 },
    // Classe 5 (120%)
    { bonusMalusClass: 5, minPower: 3, maxPower: 4, fixedPremium: 132.00 },
    { bonusMalusClass: 5, minPower: 5, maxPower: 6, fixedPremium: 168.00 },
    { bonusMalusClass: 5, minPower: 7, maxPower: 10, fixedPremium: 204.00 },
    { bonusMalusClass: 5, minPower: 11, maxPower: 14, fixedPremium: 264.00 },
    { bonusMalusClass: 5, minPower: 15, maxPower: 50, fixedPremium: 316.80 },
    // Classe 6 (140%)
    { bonusMalusClass: 6, minPower: 3, maxPower: 4, fixedPremium: 154.00 },
    { bonusMalusClass: 6, minPower: 5, maxPower: 6, fixedPremium: 196.00 },
    { bonusMalusClass: 6, minPower: 7, maxPower: 10, fixedPremium: 238.00 },
    { bonusMalusClass: 6, minPower: 11, maxPower: 14, fixedPremium: 308.00 },
    { bonusMalusClass: 6, minPower: 15, maxPower: 50, fixedPremium: 369.60 },
    // Classe 7 (160%)
    { bonusMalusClass: 7, minPower: 3, maxPower: 4, fixedPremium: 176.00 },
    { bonusMalusClass: 7, minPower: 5, maxPower: 6, fixedPremium: 224.00 },
    { bonusMalusClass: 7, minPower: 7, maxPower: 10, fixedPremium: 272.00 },
    { bonusMalusClass: 7, minPower: 11, maxPower: 14, fixedPremium: 352.00 },
    { bonusMalusClass: 7, minPower: 15, maxPower: 50, fixedPremium: 422.40 },
    // Classe 8 (200%)
    { bonusMalusClass: 8, minPower: 3, maxPower: 4, fixedPremium: 220.00 },
    { bonusMalusClass: 8, minPower: 5, maxPower: 6, fixedPremium: 280.00 },
    { bonusMalusClass: 8, minPower: 7, maxPower: 10, fixedPremium: 340.00 },
    { bonusMalusClass: 8, minPower: 11, maxPower: 14, fixedPremium: 440.00 },
    { bonusMalusClass: 8, minPower: 15, maxPower: 50, fixedPremium: 528.00 },
  ];

  for (const rule of rcRules) {
    for (const company of [lloyd, amana]) {
      await prisma.pricingRule.create({
        data: {
          companyId: company.id,
          guaranteeId: rcGuarantee!.id,
          bonusMalusClass: rule.bonusMalusClass,
          minPower: rule.minPower,
          maxPower: rule.maxPower,
          fixedPremium: rule.fixedPremium,
          isActive: true,
        },
      });
    }
  }
  console.log('✅ RC pricing rules created (CORRECT TABLE)');

  // 7. CAS Rules
  const casGuarantee = await prisma.guarantee.findUnique({ where: { code: 'CAS' } });
  await prisma.pricingRule.create({
    data: {
      companyId: lloyd.id,
      guaranteeId: casGuarantee!.id,
      fixedPremium: 45.00,
      isActive: true,
    },
  });
  await prisma.pricingRule.create({
    data: {
      companyId: amana.id,
      guaranteeId: casGuarantee!.id,
      fixedPremium: 20.00,
      isActive: true,
    },
  });
  console.log('✅ CAS pricing rules created');

  // 8. ASSISTANCE Rules
  const assistanceGuarantee = await prisma.guarantee.findUnique({ where: { code: 'ASSISTANCE' } });
  await prisma.pricingRule.create({
    data: {
      companyId: lloyd.id,
      guaranteeId: assistanceGuarantee!.id,
      fixedPremium: 115.00,
      isActive: true,
    },
  });
  await prisma.pricingRule.create({
    data: {
      companyId: amana.id,
      guaranteeId: assistanceGuarantee!.id,
      fixedPremium: 90.00,
      isActive: true,
    },
  });
  console.log('✅ ASSISTANCE pricing rules created');

  // 9. PTA Rules
  const ptaGuarantee = await prisma.guarantee.findUnique({ where: { code: 'PERSONNES_TRANSPORTEES' } });
  // LLOYD
  await prisma.pricingRule.create({
    data: {
      companyId: lloyd.id,
      guaranteeId: ptaGuarantee!.id,
      minCapital: 5000,
      fixedPremium: 21.00,
      isActive: true,
    },
  });
  await prisma.pricingRule.create({
    data: {
      companyId: lloyd.id,
      guaranteeId: ptaGuarantee!.id,
      minCapital: 10000,
      fixedPremium: 42.00,
      isActive: true,
    },
  });
  // AMANA
  await prisma.pricingRule.create({
    data: {
      companyId: amana.id,
      guaranteeId: ptaGuarantee!.id,
      minCapital: 4000,
      fixedPremium: 32.00,
      isActive: true,
    },
  });
  await prisma.pricingRule.create({
    data: {
      companyId: amana.id,
      guaranteeId: ptaGuarantee!.id,
      minCapital: 8000,
      fixedPremium: 64.00,
      isActive: true,
    },
  });
  console.log('✅ PTA pricing rules created');

  // 10. BG Rules
  const bgGuarantee = await prisma.guarantee.findUnique({ where: { code: 'BG' } });
  await prisma.pricingRule.create({
    data: {
      companyId: lloyd.id,
      guaranteeId: bgGuarantee!.id,
      ratePercentage: 0.08,
      isActive: true,
    },
  });
  await prisma.pricingRule.create({
    data: {
      companyId: amana.id,
      guaranteeId: bgGuarantee!.id,
      ratePercentage: 0.07,
      isActive: true,
    },
  });
  console.log('✅ BG pricing rules created');

  // 11. TOUS RISQUES Rules (4 franchises)
  const trGuarantee = await prisma.guarantee.findUnique({ where: { code: 'TOUS_RISQUES_ZERO' } });
  const trRates = [
    { franchiseRate: 0, ratePercentage: 0.032, fixedPremium: 22.00 },
    { franchiseRate: 1, ratePercentage: 0.0265, fixedPremium: 21.75 },
    { franchiseRate: 2, ratePercentage: 0.021, fixedPremium: 19.00 },
    { franchiseRate: 4, ratePercentage: 0.017, fixedPremium: 15.00 },
  ];

  for (const rate of trRates) {
    for (const company of [lloyd, amana]) {
      await prisma.pricingRule.create({
        data: {
          companyId: company.id,
          guaranteeId: trGuarantee!.id,
          franchiseRate: rate.franchiseRate,
          ratePercentage: rate.ratePercentage,
          fixedPremium: rate.fixedPremium,
          isActive: true,
        },
      });
    }
  }
  console.log('✅ TOUS RISQUES pricing rules created');

  // 12. INCENDIE EMEUTES
  const incendieEmeutesGuarantee = await prisma.guarantee.findUnique({ where: { code: 'INCENDIE_EMEUTES' } });
  await prisma.pricingRule.create({
    data: {
      companyId: lloyd.id,
      guaranteeId: incendieEmeutesGuarantee!.id,
      fixedPremium: 15.00,
      isActive: true,
    },
  });
  // AMANA: NC (Non Couvert) - no rule
  console.log('✅ INCENDIE EMEUTES pricing rules created');

  // 13. DOMMAGES EMEUTES
  const dommagesEmeutesGuarantee = await prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_EMEUTES' } });
  for (const company of [lloyd, amana]) {
    await prisma.pricingRule.create({
      data: {
        companyId: company.id,
        guaranteeId: dommagesEmeutesGuarantee!.id,
        fixedPremium: 30.00,
        isActive: true,
      },
    });
  }
  console.log('✅ DOMMAGES EMEUTES pricing rules created');

  // 14. CATASTROPHES NATURELLES
  const catnatGuarantee = await prisma.guarantee.findUnique({ where: { code: 'CATASTROPHES_NATURELLES' } });
  // LLOYD: 30 DT (combined with DOMMAGES EMEUTES)
  // AMANA: 40 DT (only for Tous Risques)
  await prisma.pricingRule.create({
    data: {
      companyId: amana.id,
      guaranteeId: catnatGuarantee!.id,
      formulaType: 'TOUS_RISQUES_0',
      fixedPremium: 40.00,
      isActive: true,
    },
  });
  console.log('✅ CATASTROPHES NATURELLES pricing rules created');

  // 15. DOMMAGES COLLISION Base + Tiers
  const dcGuarantee = await prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_COLLISIONS' } });
  for (const company of [lloyd, amana]) {
    // Base premium
    await prisma.pricingRule.create({
      data: {
        companyId: company.id,
        guaranteeId: dcGuarantee!.id,
        basePremium: 10.00,
        isActive: true,
      },
    });
    // Tier rates
    await prisma.pricingRule.create({
      data: {
        companyId: company.id,
        guaranteeId: dcGuarantee!.id,
        tierLevel: 1,
        tierRate: 0.067,
        isActive: true,
      },
    });
    await prisma.pricingRule.create({
      data: {
        companyId: company.id,
        guaranteeId: dcGuarantee!.id,
        tierLevel: 2,
        tierRate: 0.063,
        isActive: true,
      },
    });
    await prisma.pricingRule.create({
      data: {
        companyId: company.id,
        guaranteeId: dcGuarantee!.id,
        tierLevel: 3,
        tierRate: 0.058,
        isActive: true,
      },
    });
    await prisma.pricingRule.create({
      data: {
        companyId: company.id,
        guaranteeId: dcGuarantee!.id,
        tierLevel: 4,
        tierRate: 0.055,
        isActive: true,
      },
    });
    await prisma.pricingRule.create({
      data: {
        companyId: company.id,
        guaranteeId: dcGuarantee!.id,
        tierLevel: 5,
        tierRate: 0.05,
        isActive: true,
      },
    });
  }
  console.log('✅ DOMMAGES COLLISION pricing rules created');

  // 16. GUARANTEE BUNDLINGS - Lloyd's DOMMAGES_EMEUTES includes CATASTROPHES_NATURELLES
  console.log('\n🔗 Creating guarantee bundlings...');
  
  // Check if bundling already exists
  const existingBundling = await prisma.guaranteeBundling.findFirst({
    where: {
      companyId: lloyd.id,
      parentGuaranteeId: dommagesEmeutesGuarantee!.id,
      includedGuaranteeId: catnatGuarantee!.id,
    },
  });

  if (!existingBundling) {
    await prisma.guaranteeBundling.create({
      data: {
        companyId: lloyd.id,
        parentGuaranteeId: dommagesEmeutesGuarantee!.id,
        includedGuaranteeId: catnatGuarantee!.id,
        formulaType: null, // Applies to all formulas
        isActive: true,
      },
    });
    console.log('✅ LLOYD bundling created: DOMMAGES_EMEUTES includes CATASTROPHES_NATURELLES');
  } else {
    console.log('⏭️  LLOYD bundling already exists');
  }

  console.log('🎉 Seeding completed with CORRECT client specifications!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
