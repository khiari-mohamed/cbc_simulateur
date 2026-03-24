import { PrismaClient, Role, FormulaType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function purgeAll() {
  console.log('🧹 Purging existing data...');
  // Order matters due to FK constraints
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
  await prisma.guaranteeBundling.deleteMany();
  await prisma.guarantee.deleteMany();
  // DC tables
  await prisma.dcMatrixPrice.deleteMany();
  await prisma.dcMatrixCapital.deleteMany();
  await prisma.dcMatrixVvRange.deleteMany();
  await prisma.dcProgressiveTier.deleteMany();
  await prisma.dcCapitalTier.deleteMany();
  await prisma.dcConfig.deleteMany();
  await prisma.company.deleteMany();
  await prisma.usage.deleteMany();
  await prisma.driverProfile.deleteMany();
  await prisma.quoteComparison.deleteMany();
  await prisma.franchiseValue.deleteMany();
  await prisma.bgCapitalLimit.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log('🌱 Seeding database (CDC exact)...');

  // Purge switch: always purge to avoid confusion as requested
  await purgeAll();

  // Create admin users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@ars.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'ARS',
      role: Role.ADMINISTRATEUR_ARS,
      phone: '+212600000001',
    },
  });
  const managerPassword = await bcrypt.hash('gestionnaire123', 10);
  const manager = await prisma.user.create({
    data: {
      email: 'gestionnaire@ars.com',
      password: managerPassword,
      firstName: 'Gestionnaire',
      lastName: 'Validation',
      role: Role.GESTIONNAIRE_VALIDATION_ARS,
      phone: '+212600000002',
    },
  });
  const clientPassword = await bcrypt.hash('client123', 10);
  const client = await prisma.user.create({
    data: {
      email: 'client@test.com',
      password: clientPassword,
      firstName: 'Test',
      lastName: 'Client',
      role: Role.CLIENT_ADHERENT,
      phone: '+212600000003',
    },
  });
  console.log('✅ Users created:', { admin: admin.email, gestionnaire: manager.email, client: client.email });

  // Companies with fees
  // ⚠️ IMPORTANT: Modify company names below as needed for display in dropdown
  const lloyd = await prisma.company.create({
    data: { name: 'Lloyd Tunisien', code: 'LLOYD', contractFees: 30.0, fpac: 0.5, fssr: 0.3, fg: 3.0 },
  });
  const amana = await prisma.company.create({
    data: { name: 'Assurances Amana', code: 'AMANA', contractFees: 20.0, fpac: 0.5, fssr: 0.3, fg: 3.0 },
  });
  console.log('✅ Companies created:', lloyd.name, amana.name);

  // Create admin-manageable Usage rows with upsert logic
  const usageSeed = [
    { code: 'PRIVATE_BUSINESS', nameFr: 'Privé/Affaires', nameAr: 'خاص/أعمال', nameEn: 'Private/Business' },
    { code: 'UTILITY_UNDER_3_5T', nameFr: 'Utilitaire inférieure à 3.5 tonnes', nameAr: 'نفعية أقل من 3.5 طن', nameEn: 'Utility under 3.5 tons' },
    { code: 'UTILITY_OVER_3_5T', nameFr: 'Utilitaires supérieur à 3.5 tonnes', nameAr: 'نفعية أكثر من 3.5 طن', nameEn: 'Utility over 3.5 tons' },
    { code: 'RENTAL', nameFr: 'Location', nameAr: 'إيجار', nameEn: 'Rental' },
  ];
  const createdUsages: Record<string, any> = {};
  for (const u of usageSeed) {
    const existing = await prisma.usage.findUnique({ where: { code: u.code } });
    if (existing) {
      createdUsages[u.code] = existing;
      console.log(`  ↪️ Usage ${u.code} already exists, reusing`);
    } else {
      const created = await prisma.usage.create({ data: u });
      createdUsages[u.code] = created;
      console.log(`  ✅ Created usage ${u.code}`);
    }
  }
  console.log('✅ Usage types ready:', Object.keys(createdUsages).join(', '));

  // Guarantees catalogue
  const guaranteesSeed = [
    { code: 'RC', nameFr: 'Responsabilité Civile', nameEn: 'Civil Liability', nameAr: 'المسؤولية المدنية', isOptional: false },
    { code: 'CAS', nameFr: 'CAS / Défense et Recours', nameEn: 'Legal Defense', nameAr: 'الدفاع والطعن', isOptional: false },
    { code: 'VOL', nameFr: 'Vol', nameEn: 'Theft', nameAr: 'السرقة', isOptional: false },
    { code: 'INCENDIE', nameFr: 'Incendie', nameEn: 'Fire', nameAr: 'الحريق', isOptional: false },
    { code: 'PERSONNES_TRANSPORTEES', nameFr: 'Personnes Transportées (PTA)', nameEn: 'Passengers', nameAr: 'الأشخاص المنقولون', isOptional: false },
    { code: 'ASSISTANCE', nameFr: 'Assistance Remorquage', nameEn: 'Roadside Assistance', nameAr: 'المساعدة على الطريق', isOptional: false },
    { code: 'BG', nameFr: 'Bris de Glaces', nameEn: 'Glass Breakage', nameAr: 'كسر الزجاج', isOptional: true },
    { code: 'INCENDIE_EMEUTES', nameFr: 'Incendie suite émeutes', nameEn: 'Fire following riots', nameAr: 'الحريق بعد الشغب', isOptional: true },
    { code: 'ASSURANCE_CONDUCTEUR', nameFr: 'Assurance Conducteur', nameEn: 'Driver Insurance', nameAr: 'تأمين السائق', isOptional: true },
    { code: 'DOMMAGES_EMEUTES', nameFr: 'Dommages suite émeutes', nameEn: 'Damage following riots', nameAr: 'الأضرار بعد الشغب', isOptional: true },
    { code: 'CATASTROPHES_NATURELLES', nameFr: 'Extension Catastrophes Naturelles', nameEn: 'Natural Disasters Extension', nameAr: 'تمديد الكوارث الطبيعية', isOptional: true },
    { code: 'TOUS_RISQUES_ZERO', nameFr: 'Tous Risques', nameEn: 'All Risks', nameAr: 'جميع المخاطر', isOptional: true },
    { code: 'DOMMAGES_COLLISIONS', nameFr: 'Dommages Collision', nameEn: 'Collision Damage', nameAr: 'أضرار التصادم', isOptional: true },
    { code: 'DEFENSE_RECOURS', nameFr: 'Défense et Recours', nameEn: 'Legal Defense', nameAr: 'الدفاع والطعن', isOptional: true },
  ];
  const guarantees = {} as Record<string, { id: string }>;
  for (const g of guaranteesSeed) {
    const created = await prisma.guarantee.create({ data: g });
    guarantees[g.code] = created;
  }
  console.log('✅ Guarantees created');

  // Franchise Values (for dropdown in UI)
  const franchiseValuesSeed = [
    { value: 0, label: 'Couverture maximale', description: 'Aucune franchise - couverture complète', isStandard: true },
    { value: 1, label: 'Équilibre optimal', description: 'Franchise 1% - bon compromis entre prime et reste à charge', isStandard: true },
    { value: 2, label: 'Économie modérée', description: 'Franchise 2% - prime réduite', isStandard: true },
    { value: 4, label: 'Économie maximale', description: 'Franchise 4% - prime minimale', isStandard: true },
  ];
  for (const fv of franchiseValuesSeed) {
    await prisma.franchiseValue.create({ data: fv });
  }
  console.log('✅ Franchise values created');

  // BG Capital Limits (for dropdown in UI)
  const bgCapitalLimitsSeed = [
    { value: 1000, label: '1,000 DT', description: 'Couverture minimale', isStandard: true },
    { value: 2000, label: '2,000 DT', description: 'Couverture standard', isStandard: true },
    { value: 3000, label: '3,000 DT', description: 'Couverture étendue', isStandard: true },
  ];
  for (const bg of bgCapitalLimitsSeed) {
    await prisma.bgCapitalLimit.create({ data: bg });
  }
  console.log('✅ BG capital limits created');

  // RC Table (8 classes x 5 CV bands) - VALUES IN DT (Tunisian Dinars)
  const rcTable = [
    { class: 1, cv: [3, 4], premium: 77000 }, { class: 1, cv: [5, 6], premium: 98000 }, { class: 1, cv: [7, 10], premium: 119000 }, { class: 1, cv: [11, 14], premium: 154000 }, { class: 1, cv: [15, 999], premium: 184800 },
    { class: 2, cv: [3, 4], premium: 88000 }, { class: 2, cv: [5, 6], premium: 112000 }, { class: 2, cv: [7, 10], premium: 136000 }, { class: 2, cv: [11, 14], premium: 176000 }, { class: 2, cv: [15, 999], premium: 211200 },
    { class: 3, cv: [3, 4], premium: 99000 }, { class: 3, cv: [5, 6], premium: 126000 }, { class: 3, cv: [7, 10], premium: 153000 }, { class: 3, cv: [11, 14], premium: 198000 }, { class: 3, cv: [15, 999], premium: 237600 },
    { class: 4, cv: [3, 4], premium: 110000 }, { class: 4, cv: [5, 6], premium: 140000 }, { class: 4, cv: [7, 10], premium: 170000 }, { class: 4, cv: [11, 14], premium: 220000 }, { class: 4, cv: [15, 999], premium: 264000 },
    { class: 5, cv: [3, 4], premium: 132000 }, { class: 5, cv: [5, 6], premium: 168000 }, { class: 5, cv: [7, 10], premium: 204000 }, { class: 5, cv: [11, 14], premium: 264000 }, { class: 5, cv: [15, 999], premium: 316800 },
    { class: 6, cv: [3, 4], premium: 154000 }, { class: 6, cv: [5, 6], premium: 196000 }, { class: 6, cv: [7, 10], premium: 238000 }, { class: 6, cv: [11, 14], premium: 308000 }, { class: 6, cv: [15, 999], premium: 369600 },
    { class: 7, cv: [3, 4], premium: 176000 }, { class: 7, cv: [5, 6], premium: 224000 }, { class: 7, cv: [7, 10], premium: 272000 }, { class: 7, cv: [11, 14], premium: 352000 }, { class: 7, cv: [15, 999], premium: 422400 },
    { class: 8, cv: [3, 4], premium: 220000 }, { class: 8, cv: [5, 6], premium: 280000 }, { class: 8, cv: [7, 10], premium: 340000 }, { class: 8, cv: [11, 14], premium: 440000 }, { class: 8, cv: [15, 999], premium: 528000 },
  ];
  for (const company of [lloyd, amana]) {
    for (const rule of rcTable) {
      await prisma.pricingRule.create({
        data: {
          companyId: company.id,
          guaranteeId: guarantees['RC'].id,
          bonusMalusClass: rule.class,
          minPower: rule.cv[0],
          maxPower: rule.cv[1],
          fixedPremium: rule.premium,
          usageId: createdUsages['PRIVATE_BUSINESS'].id,
          isActive: true,
        },
      });
    }
  }

  // CAS fixed premium per company
  await prisma.pricingRule.create({ data: { companyId: lloyd.id, guaranteeId: guarantees['CAS'].id, fixedPremium: 45.0, isActive: true } });
  await prisma.pricingRule.create({ data: { companyId: amana.id, guaranteeId: guarantees['CAS'].id, fixedPremium: 20.0, isActive: true } });

  // VOL & INCENDIE with ratePercentage + fixedPremium (parameterized)
  await prisma.pricingRule.create({ data: { companyId: lloyd.id, guaranteeId: guarantees['VOL'].id, ratePercentage: 0.00236, fixedPremium: 30, reductionRate: 0, isActive: true } });
  await prisma.pricingRule.create({ data: { companyId: amana.id, guaranteeId: guarantees['VOL'].id, ratePercentage: 0.00236, fixedPremium: 30, reductionRate: 0, isActive: true } });
  await prisma.pricingRule.create({ data: { companyId: lloyd.id, guaranteeId: guarantees['INCENDIE'].id, ratePercentage: 0.00275, fixedPremium: 30, reductionRate: 0, isActive: true } });
  await prisma.pricingRule.create({ data: { companyId: amana.id, guaranteeId: guarantees['INCENDIE'].id, ratePercentage: 0.00275, fixedPremium: 30, reductionRate: 0, isActive: true } });

  // PTA per company (CDC EXACT: LLOYD 5k=21, 10k=42; AMANA 4k=32, 8k=64)
  await prisma.pricingRule.create({ data: { companyId: lloyd.id, guaranteeId: guarantees['PERSONNES_TRANSPORTEES'].id, minCapital: 5000, fixedPremium: 21.0, isActive: true } });
  await prisma.pricingRule.create({ data: { companyId: lloyd.id, guaranteeId: guarantees['PERSONNES_TRANSPORTEES'].id, minCapital: 10000, fixedPremium: 42.0, isActive: true } });
  await prisma.pricingRule.create({ data: { companyId: amana.id, guaranteeId: guarantees['PERSONNES_TRANSPORTEES'].id, minCapital: 4000, fixedPremium: 32.0, isActive: true } });
  await prisma.pricingRule.create({ data: { companyId: amana.id, guaranteeId: guarantees['PERSONNES_TRANSPORTEES'].id, minCapital: 8000, fixedPremium: 64.0, isActive: true } });

  // Assistance fixed
  await prisma.pricingRule.create({ data: { companyId: lloyd.id, guaranteeId: guarantees['ASSISTANCE'].id, fixedPremium: 115.0, isActive: true } });
  await prisma.pricingRule.create({ data: { companyId: amana.id, guaranteeId: guarantees['ASSISTANCE'].id, fixedPremium: 90.0, isActive: true } });

  // Tous Risques 0%: 4 franchise levels
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
          guaranteeId: guarantees['TOUS_RISQUES_ZERO'].id,
          franchiseRate: tr.franchise,
          ratePercentage: tr.rate,
          fixedPremium: tr.fixed,
          reductionRate: 0,
          isActive: true,
        },
      });
    }
  }

  // BG with capital ranges per company
  // Lloyd: 0-5k = 6.5%, >5k = 7%
  await prisma.pricingRule.create({
    data: {
      companyId: lloyd.id,
      guaranteeId: guarantees['BG'].id,
      minCapital: 0,
      maxCapital: 5000,
      ratePercentage: 0.065,
      reductionRate: 0,
      isActive: true,
    },
  });
  await prisma.pricingRule.create({
    data: {
      companyId: lloyd.id,
      guaranteeId: guarantees['BG'].id,
      minCapital: 5001,
      maxCapital: null,  // No upper limit
      ratePercentage: 0.07,
      reductionRate: 0,
      isActive: true,
    },
  });
  // Amana: 0-5k = 7%, >5k = 8%
  await prisma.pricingRule.create({
    data: {
      companyId: amana.id,
      guaranteeId: guarantees['BG'].id,
      minCapital: 0,
      maxCapital: 5000,
      ratePercentage: 0.07,
      reductionRate: 0,
      isActive: true,
    },
  });
  await prisma.pricingRule.create({
    data: {
      companyId: amana.id,
      guaranteeId: guarantees['BG'].id,
      minCapital: 5001,
      maxCapital: null,  // No upper limit
      ratePercentage: 0.08,
      reductionRate: 0,
      isActive: true,
    },
  });

  // Dommages Collisions
  // PRIVATE_BUSINESS (Promenade et Affaire): base + 5 tier rates
  const dcTiers = [
    { tier: 1, rate: 0.067 },
    { tier: 2, rate: 0.063 },
    { tier: 3, rate: 0.058 },
    { tier: 4, rate: 0.055 },
    { tier: 5, rate: 0.05 },
  ];
  for (const company of [lloyd, amana]) {
    await prisma.pricingRule.create({ data: { companyId: company.id, guaranteeId: guarantees['DOMMAGES_COLLISIONS'].id, basePremium: 10.0, reductionRate: 0, usageId: createdUsages['PRIVATE_BUSINESS'].id, isActive: true } });
    for (const tier of dcTiers) {
      await prisma.pricingRule.create({ data: { companyId: company.id, guaranteeId: guarantees['DOMMAGES_COLLISIONS'].id, tierLevel: tier.tier, tierRate: tier.rate, usageId: createdUsages['PRIVATE_BUSINESS'].id, isActive: true } });
    }
  }

  // COMMERCIAL (Affaire) matrix for DC - REMOVED (usage type no longer exists)
  // Client now uses: PRIVATE_BUSINESS (current), UTILITY_UNDER_3_5T, UTILITY_OVER_3_5T, RENTAL (future)
  // Matrix configuration can be added later for new usage types if needed
  /*
  const dcMatrix = [
    { minVV: 8000, maxVV: 30000, primes: [77, 142.7, 205.3, 265.7, 322.7, 393, 449.5, 506, 560, 612.5, 894] },
    { minVV: 30000.01, maxVV: 60000, primes: [77, 144, 211, 278, 343.7, 408, 471, 534, 595.3, 656.7, 947, 1220, 1768] },
    { minVV: 60000.01, maxVV: 80000, primes: [77, 144, 211, 278, 345, 412, 479, 544, 607, 670, 983, 1275, 1827.5, 2354] },
    { minVV: 80000.01, maxVV: 100000, primes: [77, 144, 211, 278, 345, 412, 479, 546, 613, 678, 993, 1303, 1878.5, 2418.5, 2940] },
    { minVV: 100000.01, maxVV: 150000, primes: [77, 144, 211, 278, 345, 412, 479, 546, 613, 680, 1007, 1322, 1932, 2504.8, 3051, 4405] },
    { minVV: 150000.01, maxVV: 200000, primes: [77, 144, 211, 278, 345, 412, 479, 546, 613, 680, 1015, 1342, 1972, 2582, 3160.8, 4528, 5870] },
    { minVV: 200000.01, maxVV: null, primes: [77, 144, 211, 278, 345, 412, 479, 546, 613, 680, 1015, 1350, 2020, 2670, 3300, 4837.5, 6285] },
  ];
  const capitals = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 15000, 20000, 30000, 40000, 50000, 75000, 100000];
  for (const company of [lloyd, amana]) {
    for (const range of dcMatrix) {
      for (let i = 0; i < capitals.length; i++) {
        const capital = capitals[i];
        const prime = range.primes[i];
        if (prime !== undefined) {
          await prisma.pricingRule.create({
            data: {
              companyId: company.id,
              guaranteeId: guarantees['DOMMAGES_COLLISIONS'].id,
              usageId: createdUsages['COMMERCIAL'].id,
              minMarketValue: range.minVV,
              maxMarketValue: range.maxVV,
              minCapital: capital,
              maxCapital: capital,
              fixedPremium: prime,
              reductionRate: 0,
              isActive: true,
            },
          });
        }
      }
    }
  }
  */

  // Optional guarantees (company-specific)
  // Incendie Suite Émeutes: LLOYD only
  await prisma.pricingRule.create({ data: { companyId: lloyd.id, guaranteeId: guarantees['INCENDIE_EMEUTES'].id, fixedPremium: 15.0, isActive: true } });
  // Dommages suite émeutes: LLOYD (all formulas), AMANA (TR 0% only)
  await prisma.pricingRule.create({ data: { companyId: lloyd.id, guaranteeId: guarantees['DOMMAGES_EMEUTES'].id, fixedPremium: 30.0, isActive: true } });
  await prisma.pricingRule.create({ data: { companyId: amana.id, guaranteeId: guarantees['DOMMAGES_EMEUTES'].id, formulaType: FormulaType.TOUS_RISQUES_0, fixedPremium: 30.0, isActive: true } });
  // CAT NAT: AMANA only, Tous Risques only (franchise 0)
  await prisma.pricingRule.create({ data: { companyId: amana.id, guaranteeId: guarantees['CATASTROPHES_NATURELLES'].id, formulaType: FormulaType.TOUS_RISQUES_0, fixedPremium: 40.0, isActive: true } });
  
  // Défense et Recours: FREE for AMANA with TR 0%, otherwise paid
  await prisma.pricingRule.create({ data: { companyId: lloyd.id, guaranteeId: guarantees['DEFENSE_RECOURS'].id, fixedPremium: 0.0, isActive: true } });
  await prisma.pricingRule.create({ data: { companyId: amana.id, guaranteeId: guarantees['DEFENSE_RECOURS'].id, formulaType: FormulaType.TOUS_RISQUES_0, fixedPremium: 0.0, isActive: true } });
  await prisma.pricingRule.create({ data: { companyId: amana.id, guaranteeId: guarantees['DEFENSE_RECOURS'].id, fixedPremium: 0.0, isActive: true } });

  console.log('✅ Pricing rules created');

  // GUARANTEE BUNDLINGS - Lloyd's DOMMAGES_EMEUTES includes CATASTROPHES_NATURELLES
  console.log('\n🔗 Creating guarantee bundlings...');
  const existingBundling = await prisma.guaranteeBundling.findFirst({
    where: {
      companyId: lloyd.id,
      parentGuaranteeId: guarantees['DOMMAGES_EMEUTES'].id,
      includedGuaranteeId: guarantees['CATASTROPHES_NATURELLES'].id,
    },
  });

  if (!existingBundling) {
    await prisma.guaranteeBundling.create({
      data: {
        companyId: lloyd.id,
        parentGuaranteeId: guarantees['DOMMAGES_EMEUTES'].id,
        includedGuaranteeId: guarantees['CATASTROPHES_NATURELLES'].id,
        formulaType: null, // Applies to all formulas
        isActive: true,
      },
    });
    console.log('✅ LLOYD bundling created: DOMMAGES_EMEUTES includes CATASTROPHES_NATURELLES');
  } else {
    console.log('⏭️  LLOYD bundling already exists');
  }

  // DC Progressive Configuration for PRIVATE_BUSINESS
  console.log('🔧 Creating DC Progressive configurations...');
  for (const company of [lloyd, amana]) {
    // Create DcConfig
    await prisma.dcConfig.create({
      data: {
        companyId: company.id,
        usageId: createdUsages['PRIVATE_BUSINESS'].id,
        useMatrix: false,
        franchise: 5,
        minCapital: 1000,
        maxCapitalPercent: 80,
        maxCapitalAbsolute: 100000,
        basePremium: 10,
        discountPercent: 0,
        isActive: true,
      },
    });

    // Create Progressive Tiers
    const progressiveTiers = [
      { tierNumber: 1, tierRate: 0.067 },
      { tierNumber: 2, tierRate: 0.063 },
      { tierNumber: 3, tierRate: 0.058 },
      { tierNumber: 4, tierRate: 0.055 },
      { tierNumber: 5, tierRate: 0.050 },
    ];
    for (const tier of progressiveTiers) {
      await prisma.dcProgressiveTier.create({
        data: {
          companyId: company.id,
          usageId: createdUsages['PRIVATE_BUSINESS'].id,
          tierNumber: tier.tierNumber,
          tierRate: tier.tierRate,
          isActive: true,
        },
      });
    }

    // Create Capital Tiers
    await prisma.dcCapitalTier.create({
      data: {
        companyId: company.id,
        usageId: createdUsages['PRIVATE_BUSINESS'].id,
        minAmount: 0,
        maxAmount: 100000,
        step: 1000,
        isActive: true,
      },
    });
  }
  console.log('✅ DC Progressive configurations created');

  // Debug validations
  console.log('🔎 Running CDC validations...');

  const rcCount = await prisma.pricingRule.count({ where: { guaranteeId: guarantees['RC'].id } });
  if (rcCount !== 80 * 2 / 2) { // 8 classes * 5 bands = 40 per company; two companies => 80 total
    console.warn(`⚠️ RC rules count expected 80, got ${rcCount}`);
  } else {
    console.log('✅ RC rules count = 80');
  }

  const tr0 = await prisma.pricingRule.findFirst({ where: { guaranteeId: guarantees['TOUS_RISQUES_ZERO'].id, companyId: lloyd.id, franchiseRate: 0 } });
  if (!tr0 || Number(tr0.ratePercentage) !== 0.032 || Number(tr0.fixedPremium) !== 22) {
    console.warn('⚠️ TR 0% (LLOYD) mismatch');
  } else {
    console.log('✅ TR 0% (LLOYD) OK');
  }

  const bgLloyd = await prisma.pricingRule.findFirst({ where: { guaranteeId: guarantees['BG'].id, companyId: lloyd.id, minCapital: 0, maxCapital: 5000 } });
  const bgAmana = await prisma.pricingRule.findFirst({ where: { guaranteeId: guarantees['BG'].id, companyId: amana.id, minCapital: 0, maxCapital: 5000 } });
  if (!bgLloyd || Number(bgLloyd.ratePercentage) !== 0.065) console.warn('⚠️ BG LLOYD 0-5k rate mismatch'); else console.log('✅ BG LLOYD 0-5k = 6.5%');
  if (!bgAmana || Number(bgAmana.ratePercentage) !== 0.07) console.warn('⚠️ BG AMANA 0-5k rate mismatch'); else console.log('✅ BG AMANA 0-5k = 7%');

  const ptaLloyd5 = await prisma.pricingRule.findFirst({ where: { guaranteeId: guarantees['PERSONNES_TRANSPORTEES'].id, companyId: lloyd.id, minCapital: 5000 } });
  const ptaAmana8 = await prisma.pricingRule.findFirst({ where: { guaranteeId: guarantees['PERSONNES_TRANSPORTEES'].id, companyId: amana.id, minCapital: 8000 } });
  if (!ptaLloyd5 || Number(ptaLloyd5.fixedPremium) !== 21) console.warn('⚠️ PTA LLOYD 5k mismatch'); else console.log('✅ PTA LLOYD 5k=21');
  if (!ptaAmana8 || Number(ptaAmana8.fixedPremium) !== 64) console.warn('⚠️ PTA AMANA 8k mismatch'); else console.log('✅ PTA AMANA 8k=64');

  const casLloyd = await prisma.pricingRule.findFirst({ where: { guaranteeId: guarantees['CAS'].id, companyId: lloyd.id } });
  const casAmana = await prisma.pricingRule.findFirst({ where: { guaranteeId: guarantees['CAS'].id, companyId: amana.id } });
  if (!casLloyd || Number(casLloyd.fixedPremium) !== 45) console.warn('⚠️ CAS LLOYD mismatch'); else console.log('✅ CAS LLOYD 45');
  if (!casAmana || Number(casAmana.fixedPremium) !== 20) console.warn('⚠️ CAS AMANA mismatch'); else console.log('✅ CAS AMANA 20');

  const incEmeutesLloyd = await prisma.pricingRule.findFirst({ where: { guaranteeId: guarantees['INCENDIE_EMEUTES'].id, companyId: lloyd.id } });
  const incEmeutesAmana = await prisma.pricingRule.findFirst({ where: { guaranteeId: guarantees['INCENDIE_EMEUTES'].id, companyId: amana.id } });
  if (!incEmeutesLloyd || Number(incEmeutesLloyd.fixedPremium) !== 15) console.warn('⚠️ Incendie Suite Émeutes LLOYD mismatch'); else console.log('✅ Incendie Suite Émeutes LLOYD 15');
  if (incEmeutesAmana) console.warn('⚠️ Incendie Suite Émeutes AMANA should be NC (absent)'); else console.log('✅ Incendie Suite Émeutes AMANA absent');

  const catnatAmana = await prisma.pricingRule.findFirst({ where: { guaranteeId: guarantees['CATASTROPHES_NATURELLES'].id, companyId: amana.id, formulaType: FormulaType.TOUS_RISQUES_0 } });
  const catnatLloyd = await prisma.pricingRule.findFirst({ where: { guaranteeId: guarantees['CATASTROPHES_NATURELLES'].id, companyId: lloyd.id } });
  if (!catnatAmana || Number(catnatAmana.fixedPremium) !== 40) console.warn('⚠️ CAT NAT AMANA mismatch'); else console.log('✅ CAT NAT AMANA 40 (TR only)');
  if (catnatLloyd) console.warn('⚠️ CAT NAT should not exist for LLOYD'); else console.log('✅ CAT NAT LLOYD absent');

  // DC COMMERCIAL sample validation - REMOVED (usage type no longer exists)
  // Can be re-added when new usage types are configured with matrix pricing

  console.log('🎉 Seeding completed!');
  console.log('📝 Test Credentials:');
  console.log('   Admin: admin@ars.com / admin123');
  console.log('   Gestionnaire: gestionnaire@ars.com / gestionnaire123');
  console.log('   Client: client@test.com / client123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
