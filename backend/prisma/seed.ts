import { PrismaClient, Role, FormulaType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
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
      phone: '+212600000001',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create validation manager
  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@ars.com' },
    update: {},
    create: {
      email: 'manager@ars.com',
      password: managerPassword,
      firstName: 'Manager',
      lastName: 'Validation',
      role: Role.GESTIONNAIRE_VALIDATION_ARS,
      phone: '+212600000002',
    },
  });
  console.log('✅ Manager user created:', manager.email);

  // Create test client
  const clientPassword = await bcrypt.hash('client123', 10);
  const client = await prisma.user.upsert({
    where: { email: 'client@test.com' },
    update: {},
    create: {
      email: 'client@test.com',
      password: clientPassword,
      firstName: 'Test',
      lastName: 'Client',
      role: Role.CLIENT_ADHERENT,
      phone: '+212600000003',
    },
  });
  console.log('✅ Client user created:', client.email);

  // Create insurance companies
  const lloyd = await prisma.company.upsert({
    where: { code: 'LLOYD' },
    update: {},
    create: {
      name: 'LLOYD',
      code: 'LLOYD',
    },
  });
  console.log('✅ Company created:', lloyd.name);

  const amana = await prisma.company.upsert({
    where: { code: 'AMANA' },
    update: {},
    create: {
      name: 'AMANA',
      code: 'AMANA',
    },
  });
  console.log('✅ Company created:', amana.name);

  // Create guarantees (CDC exact requirements)
  const guarantees = [
    { code: 'RC', nameFr: 'Responsabilité Civile', nameEn: 'Civil Liability', nameAr: 'المسؤولية المدنية', isOptional: false },
    { code: 'CAS', nameFr: 'Corporel Assuré Seul', nameEn: 'Personal Injury', nameAr: 'الإصابات الجسدية', isOptional: true },
    { code: 'VOL', nameFr: 'Vol', nameEn: 'Theft', nameAr: 'السرقة', isOptional: true },
    { code: 'INCENDIE', nameFr: 'Incendie', nameEn: 'Fire', nameAr: 'الحريق', isOptional: true },
    { code: 'INCENDIE_EMEUTES', nameFr: 'Incendie suite émeutes', nameEn: 'Fire following riots', nameAr: 'الحريق بعد الشغب', isOptional: true },
    { code: 'CATASTROPHES_NATURELLES', nameFr: 'Extension Catastrophes Naturelles', nameEn: 'Natural Disasters Extension', nameAr: 'تمديد الكوارث الطبيعية', isOptional: true },
    { code: 'DOMMAGES_EMEUTES', nameFr: 'Dommages suite émeutes', nameEn: 'Damage following riots', nameAr: 'الأضرار بعد الشغب', isOptional: true },
    { code: 'PERSONNES_TRANSPORTEES', nameFr: 'Personnes Transportées', nameEn: 'Passengers', nameAr: 'الأشخاص المنقولون', isOptional: true },
    { code: 'ASSISTANCE', nameFr: 'Assistance Remorquage', nameEn: 'Roadside Assistance', nameAr: 'المساعدة على الطريق', isOptional: true },
    { code: 'TOUS_RISQUES_0', nameFr: 'Tous Risques 0%', nameEn: 'All Risks 0%', nameAr: 'جميع المخاطر 0٪', isOptional: true },
    { code: 'DOMMAGES_COLLISIONS', nameFr: 'Dommages Collision', nameEn: 'Collision Damage', nameAr: 'أضرار التصادم', isOptional: true },
    { code: 'BG', nameFr: 'Bris de Glaces', nameEn: 'Glass Breakage', nameAr: 'كسر الزجاج', isOptional: true },
    { code: 'DEFENSE_RECOURS', nameFr: 'Défense et Recours', nameEn: 'Legal Defense', nameAr: 'الدفاع والطعن', isOptional: true },
  ];

  for (const g of guarantees) {
    const guarantee = await prisma.guarantee.upsert({
      where: { code: g.code },
      update: {},
      create: g,
    });
    console.log('✅ Guarantee created:', guarantee.nameFr);
  }

  // Create pricing rules for LLOYD
  const rcGuarantee = await prisma.guarantee.findUnique({ where: { code: 'RC' } });
  const volGuarantee = await prisma.guarantee.findUnique({ where: { code: 'VOL' } });
  const incendieGuarantee = await prisma.guarantee.findUnique({ where: { code: 'INCENDIE' } });
  const trGuarantee = await prisma.guarantee.findUnique({ where: { code: 'TOUS_RISQUES_0' } });

  if (rcGuarantee) {
    await prisma.pricingRule.upsert({
      where: { id: 'lloyd-rc' },
      update: {},
      create: {
        id: 'lloyd-rc',
        companyId: lloyd.id,
        guaranteeId: rcGuarantee.id,
        fixedPremium: 140,
        isActive: true,
      },
    });
    await prisma.pricingRule.upsert({
      where: { id: 'amana-rc' },
      update: {},
      create: {
        id: 'amana-rc',
        companyId: amana.id,
        guaranteeId: rcGuarantee.id,
        fixedPremium: 140,
        isActive: true,
      },
    });
  }

  if (volGuarantee) {
    await prisma.pricingRule.upsert({
      where: { id: 'lloyd-vol' },
      update: {},
      create: {
        id: 'lloyd-vol',
        companyId: lloyd.id,
        guaranteeId: volGuarantee.id,
        reductionRate: 1.0,
        isActive: true,
      },
    });
    await prisma.pricingRule.upsert({
      where: { id: 'amana-vol' },
      update: {},
      create: {
        id: 'amana-vol',
        companyId: amana.id,
        guaranteeId: volGuarantee.id,
        reductionRate: 1.0,
        isActive: true,
      },
    });
  }

  if (incendieGuarantee) {
    await prisma.pricingRule.upsert({
      where: { id: 'lloyd-incendie' },
      update: {},
      create: {
        id: 'lloyd-incendie',
        companyId: lloyd.id,
        guaranteeId: incendieGuarantee.id,
        reductionRate: 1.0,
        isActive: true,
      },
    });
    await prisma.pricingRule.upsert({
      where: { id: 'amana-incendie' },
      update: {},
      create: {
        id: 'amana-incendie',
        companyId: amana.id,
        guaranteeId: incendieGuarantee.id,
        reductionRate: 1.0,
        isActive: true,
      },
    });
  }

  if (trGuarantee) {
    await prisma.pricingRule.upsert({
      where: { id: 'lloyd-tr' },
      update: {},
      create: {
        id: 'lloyd-tr',
        companyId: lloyd.id,
        guaranteeId: trGuarantee.id,
        formulaType: FormulaType.TOUS_RISQUES_0,
        baseRate: 0.03222,
        reductionRate: 1.0,
        isActive: true,
      },
    });
    await prisma.pricingRule.upsert({
      where: { id: 'amana-tr' },
      update: {},
      create: {
        id: 'amana-tr',
        companyId: amana.id,
        guaranteeId: trGuarantee.id,
        formulaType: FormulaType.TOUS_RISQUES_0,
        baseRate: 0.03222,
        reductionRate: 1.0,
        isActive: true,
      },
    });
  }

  console.log('✅ Pricing rules created');

  // Create conventions
  const lloydConvention = await prisma.convention.upsert({
    where: { id: 'lloyd-standard' },
    update: {},
    create: {
      id: 'lloyd-standard',
      name: 'Convention LLOYD Standard',
      companyId: lloyd.id,
    },
  });
  console.log('✅ Convention created:', lloydConvention.name);

  const amanaConvention = await prisma.convention.upsert({
    where: { id: 'amana-standard' },
    update: {},
    create: {
      id: 'amana-standard',
      name: 'Convention AMANA Standard',
      companyId: amana.id,
    },
  });
  console.log('✅ Convention created:', amanaConvention.name);

  console.log('\n🎉 Seeding completed!\n');
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
