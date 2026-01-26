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

  // Create guarantees
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
    { code: 'TOUS_RISQUES_ZERO', nameFr: 'Tous Risques 0%', nameEn: 'All Risks 0%', nameAr: 'جميع المخاطر 0٪', isOptional: true },
  ];

  for (const g of guarantees) {
    await prisma.guarantee.upsert({
      where: { code: g.code },
      update: {},
      create: g,
    });
  }
  console.log('✅ Guarantees created');

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
