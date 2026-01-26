import { PrismaClient, Role, FormulaType, UsageType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Complete database seeding with CDC requirements...');

  // 1. Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ars.com' },
    update: {},
    create: {
      email: 'admin@ars.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'ARS',
      role: Role.ADMINISTRATEUR_ARS,
      phone: '+216 20 000 001',
    },
  });
  console.log('✅ Admin created');

  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@ars.com' },
    update: {},
    create: {
      email: 'manager@ars.com',
      password: managerPassword,
      firstName: 'Gestionnaire',
      lastName: 'Validation',
      role: Role.GESTIONNAIRE_VALIDATION_ARS,
      phone: '+216 20 000 002',
    },
  });
  console.log('✅ Manager created');

  const clientPassword = await bcrypt.hash('client123', 10);
  const client = await prisma.user.upsert({
    where: { email: 'client@test.com' },
    update: {},
    create: {
      email: 'client@test.com',
      password: clientPassword,
      firstName: 'Client',
      lastName: 'Test',
      role: Role.CLIENT_ADHERENT,
      phone: '+216 20 000 003',
    },
  });
  console.log('✅ Client created');

  // 2. Create companies with proper configuration
  const lloyd = await prisma.company.upsert({
    where: { code: 'LLOYD' },
    update: {
      contractFees: 30.0,
      fpac: 0.5,
      fssr: 0.3,
      fg: 3.0,
    },
    create: {
      name: 'LLOYD',
      code: 'LLOYD',
      contractFees: 30.0,
      fpac: 0.5,
      fssr: 0.3,
      fg: 3.0,
    },
  });
  console.log('✅ LLOYD company created');

  const amana = await prisma.company.upsert({
    where: { code: 'AMANA' },
    update: {
      contractFees: 20.0,
      fpac: 0.5,
      fssr: 0.3,
      fg: 3.0,
    },
    create: {
      name: 'AMANA',
      code: 'AMANA',
      contractFees: 20.0,
      fpac: 0.5,
      fssr: 0.3,
      fg: 3.0,
    },
  });
  console.log('✅ AMANA company created');

  // 3. Create guarantees
  const guarantees = [
    { code: 'RC', nameFr: 'Responsabilité Civile', nameEn: 'Civil Liability', nameAr: 'المسؤولية المدنية', isOptional: false },
    { code: 'CAS', nameFr: 'Corporel Assuré Seul', nameEn: 'Personal Injury', nameAr: 'الإصابات الجسدية', isOptional: true },
    { code: 'VOL', nameFr: 'Vol', nameEn: 'Theft', nameAr: 'السرقة', isOptional: true },
    { code: 'INCENDIE', nameFr: 'Incendie', nameEn: 'Fire', nameAr: 'الحريق', isOptional: true },
    { code: 'INCENDIE_EMEUTES', nameFr: 'Incendie suite émeutes', nameEn: 'Fire following riots', nameAr: 'الحريق بعد الشغب', isOptional: true },
    { code: 'CATASTROPHES_NATURELLES', nameFr: 'Extension Catastrophes Naturelles', nameEn: 'Natural Disasters', nameAr: 'الكوارث الطبيعية', isOptional: true },
    { code: 'DOMMAGES_EMEUTES', nameFr: 'Dommages suite émeutes', nameEn: 'Damage following riots', nameAr: 'الأضرار بعد الشغب', isOptional: true },
    { code: 'PERSONNES_TRANSPORTEES', nameFr: 'Personnes Transportées', nameEn: 'Passengers', nameAr: 'الأشخاص المنقولون', isOptional: true },
    { code: 'ASSISTANCE', nameFr: 'Assistance Remorquage', nameEn: 'Roadside Assistance', nameAr: 'المساعدة', isOptional: true },
    { code: 'TOUS_RISQUES_ZERO', nameFr: 'Tous Risques', nameEn: 'All Risks', nameAr: 'جميع المخاطر', isOptional: true },
    { code: 'DOMMAGES_COLLISIONS', nameFr: 'Dommages Collision', nameEn: 'Collision Damage', nameAr: 'أضرار التصادم', isOptional: true },
    { code: 'BG', nameFr: 'Bris de Glaces', nameEn: 'Glass Breakage', nameAr: 'كسر الزجاج', isOptional: true },
    { code: 'DEFENSE_RECOURS', nameFr: 'Défense et Recours', nameEn: 'Legal Defense', nameAr: 'الدفاع القانوني', isOptional: true },
  ];

  for (const g of guarantees) {
    await prisma.guarantee.upsert({
      where: { code: g.code },
      update: {},
      create: g,
    });
  }
  console.log('✅ Guarantees created');

  // 4. Get guarantee IDs
  const rcGuarantee = await prisma.guarantee.findUnique({ where: { code: 'RC' } });
  const casGuarantee = await prisma.guarantee.findUnique({ where: { code: 'CAS' } });
  const volGuarantee = await prisma.guarantee.findUnique({ where: { code: 'VOL' } });
  const incendieGuarantee = await prisma.guarantee.findUnique({ where: { code: 'INCENDIE' } });
  const ptaGuarantee = await prisma.guarantee.findUnique({ where: { code: 'PERSONNES_TRANSPORTEES' } });
  const assistanceGuarantee = await prisma.guarantee.findUnique({ where: { code: 'ASSISTANCE' } });
  const trGuarantee = await prisma.guarantee.findUnique({ where: { code: 'TOUS_RISQUES_ZERO' } });
  const bgGuarantee = await prisma.guarantee.findUnique({ where: { code: 'BG' } });
  const dcGuarantee = await prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_COLLISIONS' } });
  const incendieEmeutesGuarantee = await prisma.guarantee.findUnique({ where: { code: 'INCENDIE_EMEUTES' } });
  const catnatGuarantee = await prisma.guarantee.findUnique({ where: { code: 'CATASTROPHES_NATURELLES' } });
  const dommagesEmeutesGuarantee = await prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_EMEUTES' } });
  const defenseRecoursGuarantee = await prisma.guarantee.findUnique({ where: { code: 'DEFENSE_RECOURS' } });

  // 5. Create RC pricing rules (8 classes x 5 CV ranges x 2 companies = 80 rules)
  const rcTable = [
    // Classe 1 (70%)
    { class: 1, cv: [3, 4], premium: 77 },
    { class: 1, cv: [5, 6], premium: 98 },
    { class: 1, cv: [7, 10], premium: 119 },
    { class: 1, cv: [11, 14], premium: 154 },
    { class: 1, cv: [15, 999], premium: 184.8 },
    // Classe 2 (80%)
    { class: 2, cv: [3, 4], premium: 88 },
    { class: 2, cv: [5, 6], premium: 112 },
    { class: 2, cv: [7, 10], premium: 136 },
    { class: 2, cv: [11, 14], premium: 176 },
    { class: 2, cv: [15, 999], premium: 211.2 },
    // Classe 3 (90%)
    { class: 3, cv: [3, 4], premium: 99 },
    { class: 3, cv: [5, 6], premium: 126 },
    { class: 3, cv: [7, 10], premium: 153 },
    { class: 3, cv: [11, 14], premium: 198 },
    { class: 3, cv: [15, 999], premium: 237.6 },
    // Classe 4 (100%)
    { class: 4, cv: [3, 4], premium: 110 },
    { class: 4, cv: [5, 6], premium: 140 },
    { class: 4, cv: [7, 10], premium: 170 },
    { class: 4, cv: [11, 14], premium: 220 },
    { class: 4, cv: [15, 999], premium: 264 },
    // Classe 5 (120%)
    { class: 5, cv: [3, 4], premium: 132 },
    { class: 5, cv: [5, 6], premium: 168 },
    { class: 5, cv: [7, 10], premium: 204 },
    { class: 5, cv: [11, 14], premium: 264 },
    { class: 5, cv: [15, 999], premium: 316.8 },
    // Classe 6 (140%)
    { class: 6, cv: [3, 4], premium: 154 },
    { class: 6, cv: [5, 6], premium: 196 },
    { class: 6, cv: [7, 10], premium: 238 },
    { class: 6, cv: [11, 14], premium: 308 },
    { class: 6, cv: [15, 999], premium: 369.6 },
    // Classe 7 (160%)
    { class: 7, cv: [3, 4], premium: 176 },
    { class: 7, cv: [5, 6], premium: 224 },
    { class: 7, cv: [7, 10], premium: 272 },
    { class: 7, cv: [11, 14], premium: 352 },
    { class: 7, cv: [15, 999], premium: 422.4 },
    // Classe 8 (200%)
    { class: 8, cv: [3, 4], premium: 220 },
    { class: 8, cv: [5, 6], premium: 280 },
    { class: 8, cv: [7, 10], premium: 340 },
    { class: 8, cv: [11, 14], premium: 440 },
    { class: 8, cv: [15, 999], premium: 528 },
  ];

  if (rcGuarantee) {
    for (const company of [lloyd, amana]) {
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
    console.log('✅ RC pricing rules created (80 rules)');
  }

  // 6. CAS pricing rules
  if (casGuarantee) {
    await prisma.pricingRule.create({
      data: {
        companyId: lloyd.id,
        guaranteeId: casGuarantee.id,
        fixedPremium: 45.0,
        isActive: true,
      },
    });
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: casGuarantee.id,
        fixedPremium: 20.0,
        isActive: true,
      },
    });
    console.log('✅ CAS pricing rules created');
  }

  // 7. VOL & INCENDIE reduction rates
  if (volGuarantee) {
    await prisma.pricingRule.create({
      data: {
        companyId: lloyd.id,
        guaranteeId: volGuarantee.id,
        reductionRate: 1.0,
        isActive: true,
      },
    });
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: volGuarantee.id,
        reductionRate: 1.0,
        isActive: true,
      },
    });
  }

  if (incendieGuarantee) {
    await prisma.pricingRule.create({
      data: {
        companyId: lloyd.id,
        guaranteeId: incendieGuarantee.id,
        reductionRate: 1.0,
        isActive: true,
      },
    });
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: incendieGuarantee.id,
        reductionRate: 1.0,
        isActive: true,
      },
    });
  }
  console.log('✅ VOL & INCENDIE reduction rates created');

  // 8. PTA pricing rules
  if (ptaGuarantee) {
    // LLOYD
    await prisma.pricingRule.create({
      data: {
        companyId: lloyd.id,
        guaranteeId: ptaGuarantee.id,
        minCapital: 5000,
        fixedPremium: 21.0,
        isActive: true,
      },
    });
    await prisma.pricingRule.create({
      data: {
        companyId: lloyd.id,
        guaranteeId: ptaGuarantee.id,
        minCapital: 10000,
        fixedPremium: 42.0,
        isActive: true,
      },
    });
    // AMANA
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: ptaGuarantee.id,
        minCapital: 4000,
        fixedPremium: 32.0,
        isActive: true,
      },
    });
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: ptaGuarantee.id,
        minCapital: 8000,
        fixedPremium: 64.0,
        isActive: true,
      },
    });
    console.log('✅ PTA pricing rules created');
  }

  // 9. ASSISTANCE pricing rules
  if (assistanceGuarantee) {
    await prisma.pricingRule.create({
      data: {
        companyId: lloyd.id,
        guaranteeId: assistanceGuarantee.id,
        fixedPremium: 115.0,
        isActive: true,
      },
    });
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: assistanceGuarantee.id,
        fixedPremium: 90.0,
        isActive: true,
      },
    });
    console.log('✅ ASSISTANCE pricing rules created');
  }

  // 10. TOUS RISQUES pricing rules (4 franchise rates)
  if (trGuarantee) {
    const trRates = [
      { franchise: 0, rate: 0.032, fixed: 22.0 },
      { franchise: 1, rate: 0.0265, fixed: 21.75 },
      { franchise: 2, rate: 0.021, fixed: 19.0 },
      { franchise: 4, rate: 0.017, fixed: 15.0 },
    ];

    for (const company of [lloyd, amana]) {
      for (const tr of trRates) {
        await prisma.pricingRule.create({
          data: {
            companyId: company.id,
            guaranteeId: trGuarantee.id,
            franchiseRate: tr.franchise,
            ratePercentage: tr.rate,
            fixedPremium: tr.fixed,
            reductionRate: 1.0,
            isActive: true,
          },
        });
      }
    }
    console.log('✅ TOUS RISQUES pricing rules created');
  }

  // 11. BG pricing rules
  if (bgGuarantee) {
    await prisma.pricingRule.create({
      data: {
        companyId: lloyd.id,
        guaranteeId: bgGuarantee.id,
        ratePercentage: 0.08,
        isActive: true,
      },
    });
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: bgGuarantee.id,
        ratePercentage: 0.07,
        isActive: true,
      },
    });
    console.log('✅ BG pricing rules created');
  }

  // 12. DOMMAGES COLLISIONS pricing rules
  if (dcGuarantee) {
    const dcTiers = [
      { tier: 1, rate: 0.067 },
      { tier: 2, rate: 0.063 },
      { tier: 3, rate: 0.058 },
      { tier: 4, rate: 0.055 },
      { tier: 5, rate: 0.05 },
    ];

    for (const company of [lloyd, amana]) {
      // Base premium
      await prisma.pricingRule.create({
        data: {
          companyId: company.id,
          guaranteeId: dcGuarantee.id,
          basePremium: 10.0,
          reductionRate: 1.0,
          isActive: true,
        },
      });

      // Tier rates
      for (const tier of dcTiers) {
        await prisma.pricingRule.create({
          data: {
            companyId: company.id,
            guaranteeId: dcGuarantee.id,
            tierLevel: tier.tier,
            tierRate: tier.rate,
            isActive: true,
          },
        });
      }
    }
    console.log('✅ DOMMAGES COLLISIONS pricing rules created');
  }

  // 13. Optional guarantees
  if (incendieEmeutesGuarantee) {
    await prisma.pricingRule.create({
      data: {
        companyId: lloyd.id,
        guaranteeId: incendieEmeutesGuarantee.id,
        fixedPremium: 15.0,
        isActive: true,
      },
    });
    // AMANA: NC (not covered)
    console.log('✅ INCENDIE EMEUTES pricing rules created');
  }

  if (catnatGuarantee) {
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: catnatGuarantee.id,
        formulaType: FormulaType.TOUS_RISQUES_0,
        fixedPremium: 40.0,
        isActive: true,
      },
    });
    console.log('✅ CATASTROPHES NATURELLES pricing rules created');
  }

  if (dommagesEmeutesGuarantee) {
    await prisma.pricingRule.create({
      data: {
        companyId: lloyd.id,
        guaranteeId: dommagesEmeutesGuarantee.id,
        fixedPremium: 30.0,
        isActive: true,
      },
    });
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: dommagesEmeutesGuarantee.id,
        fixedPremium: 30.0,
        isActive: true,
      },
    });
    console.log('✅ DOMMAGES EMEUTES pricing rules created');
  }

  if (defenseRecoursGuarantee) {
    await prisma.pricingRule.create({
      data: {
        companyId: lloyd.id,
        guaranteeId: defenseRecoursGuarantee.id,
        fixedPremium: 0.0,
        isActive: true,
      },
    });
    // AMANA: FREE with Tous Risques 0%
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: defenseRecoursGuarantee.id,
        fixedPremium: 0.0,
        isActive: true,
      },
    });
    console.log('✅ DEFENSE RECOURS pricing rules created');
  }

  // 14. Create conventions
  const lloydConvention = await prisma.convention.upsert({
    where: { id: 'lloyd-standard' },
    update: {},
    create: {
      id: 'lloyd-standard',
      name: 'Convention LLOYD Standard',
      companyId: lloyd.id,
    },
  });

  const amanaConvention = await prisma.convention.upsert({
    where: { id: 'amana-standard' },
    update: {},
    create: {
      id: 'amana-standard',
      name: 'Convention AMANA Standard',
      companyId: amana.id,
    },
  });
  console.log('✅ Conventions created');

  console.log('\n🎉 Complete seeding finished!\n');
  console.log('📝 Test Credentials:');
  console.log('   Admin: admin@ars.com / admin123');
  console.log('   Manager: manager@ars.com / manager123');
  console.log('   Client: client@test.com / client123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
