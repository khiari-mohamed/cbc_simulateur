import { PrismaClient, Role, ConventionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed: Clients, Organizations & Conventions...\n');

  // ============================================
  // 1. CREATE ORGANIZATIONS
  // ============================================
  console.log('📋 Creating Organizations...');

  const org1 = await prisma.clientOrganization.upsert({
    where: { code: 'ORG_TUNISAIR' },
    update: {},
    create: {
      name: 'Tunisair',
      code: 'ORG_TUNISAIR',
      joinKey: 'TUNISAIR2024',
      isActive: true,
    },
  });
  console.log('✅ Created: Tunisair');

  const org2 = await prisma.clientOrganization.upsert({
    where: { code: 'ORG_STEG' },
    update: {},
    create: {
      name: 'STEG (Société Tunisienne de l\'Électricité et du Gaz)',
      code: 'ORG_STEG',
      joinKey: 'STEG2024',
      isActive: true,
    },
  });
  console.log('✅ Created: STEG');

  const org3 = await prisma.clientOrganization.upsert({
    where: { code: 'ORG_SNCFT' },
    update: {},
    create: {
      name: 'SNCFT (Société Nationale des Chemins de Fer Tunisiens)',
      code: 'ORG_SNCFT',
      joinKey: 'SNCFT2024',
      isActive: true,
    },
  });
  console.log('✅ Created: SNCFT');

  const org4 = await prisma.clientOrganization.upsert({
    where: { code: 'ORG_SONEDE' },
    update: {},
    create: {
      name: 'SONEDE (Société Nationale d\'Exploitation et de Distribution des Eaux)',
      code: 'ORG_SONEDE',
      joinKey: 'SONEDE2024',
      isActive: true,
    },
  });
  console.log('✅ Created: SONEDE');

  const org5 = await prisma.clientOrganization.upsert({
    where: { code: 'ORG_BANQUE_CENTRALE' },
    update: {},
    create: {
      name: 'Banque Centrale de Tunisie',
      code: 'ORG_BANQUE_CENTRALE',
      joinKey: 'BCT2024',
      isActive: true,
    },
  });
  console.log('✅ Created: Banque Centrale de Tunisie\n');

  // ============================================
  // 2. CREATE CONVENTIONS
  // ============================================
  console.log('📜 Creating Conventions...');

  // Get companies for conventions
  const amana = await prisma.company.findFirst({ where: { code: 'AMANA' } });
  const lloyd = await prisma.company.findFirst({ where: { code: 'LLOYD' } });

  if (!amana || !lloyd) {
    throw new Error('❌ Companies (AMANA, LLOYD) not found. Please run seed.ts first.');
  }

  // Convention 1: Tunisair with AMANA & LLOYD
  const conv1 = await prisma.convention.upsert({
    where: { id: 'conv-tunisair-2024' },
    update: {},
    create: {
      id: 'conv-tunisair-2024',
      name: 'Convention Tunisair 2024',
      organizationId: org1.id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: ConventionStatus.ACTIVE,
      isActive: true,
    },
  });
  console.log('✅ Created: Convention Tunisair 2024');

  // Link companies to convention
  await prisma.conventionCompany.upsert({
    where: {
      conventionId_companyId: {
        conventionId: conv1.id,
        companyId: amana.id,
      },
    },
    update: {},
    create: {
      conventionId: conv1.id,
      companyId: amana.id,
    },
  });
  await prisma.conventionCompany.upsert({
    where: {
      conventionId_companyId: {
        conventionId: conv1.id,
        companyId: lloyd.id,
      },
    },
    update: {},
    create: {
      conventionId: conv1.id,
      companyId: lloyd.id,
    },
  });
  console.log('  → Linked to: AMANA, LLOYD');

  // Convention 2: STEG with AMANA only
  const conv2 = await prisma.convention.upsert({
    where: { id: 'conv-steg-2024' },
    update: {},
    create: {
      id: 'conv-steg-2024',
      name: 'Convention STEG 2024',
      organizationId: org2.id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: ConventionStatus.ACTIVE,
      isActive: true,
    },
  });
  console.log('✅ Created: Convention STEG 2024');

  await prisma.conventionCompany.upsert({
    where: {
      conventionId_companyId: {
        conventionId: conv2.id,
        companyId: amana.id,
      },
    },
    update: {},
    create: {
      conventionId: conv2.id,
      companyId: amana.id,
    },
  });
  console.log('  → Linked to: AMANA');

  // Convention 3: SNCFT with LLOYD only
  const conv3 = await prisma.convention.upsert({
    where: { id: 'conv-sncft-2024' },
    update: {},
    create: {
      id: 'conv-sncft-2024',
      name: 'Convention SNCFT 2024',
      organizationId: org3.id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: ConventionStatus.ACTIVE,
      isActive: true,
    },
  });
  console.log('✅ Created: Convention SNCFT 2024');

  await prisma.conventionCompany.upsert({
    where: {
      conventionId_companyId: {
        conventionId: conv3.id,
        companyId: lloyd.id,
      },
    },
    update: {},
    create: {
      conventionId: conv3.id,
      companyId: lloyd.id,
    },
  });
  console.log('  → Linked to: LLOYD');

  // Convention 4: Banque Centrale with AMANA & LLOYD
  const conv4 = await prisma.convention.upsert({
    where: { id: 'conv-bct-2024' },
    update: {},
    create: {
      id: 'conv-bct-2024',
      name: 'Convention Banque Centrale 2024',
      organizationId: org5.id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: ConventionStatus.ACTIVE,
      isActive: true,
    },
  });
  console.log('✅ Created: Convention Banque Centrale 2024');

  await prisma.conventionCompany.upsert({
    where: {
      conventionId_companyId: {
        conventionId: conv4.id,
        companyId: amana.id,
      },
    },
    update: {},
    create: {
      conventionId: conv4.id,
      companyId: amana.id,
    },
  });
  await prisma.conventionCompany.upsert({
    where: {
      conventionId_companyId: {
        conventionId: conv4.id,
        companyId: lloyd.id,
      },
    },
    update: {},
    create: {
      conventionId: conv4.id,
      companyId: lloyd.id,
    },
  });
  console.log('  → Linked to: AMANA, LLOYD\n');

  // ============================================
  // 3. CREATE CLIENTS (USERS)
  // ============================================
  console.log('👥 Creating Clients...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Clients for Tunisair
  const client1 = await prisma.user.upsert({
    where: { email: 'ahmed.ben.ali@tunisair.tn' },
    update: {},
    create: {
      email: 'ahmed.ben.ali@tunisair.tn',
      password: hashedPassword,
      firstName: 'Ahmed',
      lastName: 'Ben Ali',
      phone: '+216 20 123 456',
      role: Role.CLIENT_ADHERENT,
      organizationId: org1.id,
      isActive: true,
    },
  });
  console.log('✅ Created: Ahmed Ben Ali (Tunisair)');

  const client2 = await prisma.user.upsert({
    where: { email: 'fatma.trabelsi@tunisair.tn' },
    update: {},
    create: {
      email: 'fatma.trabelsi@tunisair.tn',
      password: hashedPassword,
      firstName: 'Fatma',
      lastName: 'Trabelsi',
      phone: '+216 20 234 567',
      role: Role.CLIENT_ADHERENT,
      organizationId: org1.id,
      isActive: true,
    },
  });
  console.log('✅ Created: Fatma Trabelsi (Tunisair)');

  // Clients for STEG
  const client3 = await prisma.user.upsert({
    where: { email: 'mohamed.gharbi@steg.tn' },
    update: {},
    create: {
      email: 'mohamed.gharbi@steg.tn',
      password: hashedPassword,
      firstName: 'Mohamed',
      lastName: 'Gharbi',
      phone: '+216 20 345 678',
      role: Role.CLIENT_ADHERENT,
      organizationId: org2.id,
      isActive: true,
    },
  });
  console.log('✅ Created: Mohamed Gharbi (STEG)');

  const client4 = await prisma.user.upsert({
    where: { email: 'salma.ben.salem@steg.tn' },
    update: {},
    create: {
      email: 'salma.ben.salem@steg.tn',
      password: hashedPassword,
      firstName: 'Salma',
      lastName: 'Ben Salem',
      phone: '+216 20 456 789',
      role: Role.CLIENT_ADHERENT,
      organizationId: org2.id,
      isActive: true,
    },
  });
  console.log('✅ Created: Salma Ben Salem (STEG)');

  // Clients for SNCFT
  const client5 = await prisma.user.upsert({
    where: { email: 'karim.jebali@sncft.tn' },
    update: {},
    create: {
      email: 'karim.jebali@sncft.tn',
      password: hashedPassword,
      firstName: 'Karim',
      lastName: 'Jebali',
      phone: '+216 20 567 890',
      role: Role.CLIENT_ADHERENT,
      organizationId: org3.id,
      isActive: true,
    },
  });
  console.log('✅ Created: Karim Jebali (SNCFT)');

  // Clients for SONEDE (no convention)
  const client6 = await prisma.user.upsert({
    where: { email: 'amira.mansour@sonede.tn' },
    update: {},
    create: {
      email: 'amira.mansour@sonede.tn',
      password: hashedPassword,
      firstName: 'Amira',
      lastName: 'Mansour',
      phone: '+216 20 678 901',
      role: Role.CLIENT_ADHERENT,
      organizationId: org4.id,
      isActive: true,
    },
  });
  console.log('✅ Created: Amira Mansour (SONEDE - No Convention)');

  // Clients for Banque Centrale
  const client7 = await prisma.user.upsert({
    where: { email: 'youssef.ben.youssef@bct.gov.tn' },
    update: {},
    create: {
      email: 'youssef.ben.youssef@bct.gov.tn',
      password: hashedPassword,
      firstName: 'Youssef',
      lastName: 'Ben Youssef',
      phone: '+216 20 789 012',
      role: Role.CLIENT_ADHERENT,
      organizationId: org5.id,
      isActive: true,
    },
  });
  console.log('✅ Created: Youssef Ben Youssef (Banque Centrale)');

  // Independent clients (no organization)
  const client8 = await prisma.user.upsert({
    where: { email: 'nadia.hamdi@gmail.com' },
    update: {},
    create: {
      email: 'nadia.hamdi@gmail.com',
      password: hashedPassword,
      firstName: 'Nadia',
      lastName: 'Hamdi',
      phone: '+216 20 890 123',
      role: Role.CLIENT_ADHERENT,
      organizationId: null,
      isActive: true,
    },
  });
  console.log('✅ Created: Nadia Hamdi (Independent - No Organization)');

  const client9 = await prisma.user.upsert({
    where: { email: 'rami.ben.amor@gmail.com' },
    update: {},
    create: {
      email: 'rami.ben.amor@gmail.com',
      password: hashedPassword,
      firstName: 'Rami',
      lastName: 'Ben Amor',
      phone: '+216 20 901 234',
      role: Role.CLIENT_ADHERENT,
      organizationId: null,
      isActive: true,
    },
  });
  console.log('✅ Created: Rami Ben Amor (Independent - No Organization)\n');

  // ============================================
  // 4. CREATE DRIVER PROFILES
  // ============================================
  console.log('🚗 Creating Driver Profiles...');

  const clients = [client1, client2, client3, client4, client5, client6, client7, client8, client9];

  for (const client of clients) {
    await prisma.driverProfile.upsert({
      where: { userId: client.id },
      update: {},
      create: {
        userId: client.id,
        birthDate: new Date('1985-05-15'),
        licenseDate: new Date('2005-03-20'),
        experienceYears: 19,
      },
    });
  }
  console.log('✅ Created driver profiles for all clients\n');

  // ============================================
  // 5. SUMMARY
  // ============================================
  console.log('📊 SUMMARY:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Organizations Created: 5');
  console.log('  • Tunisair (Convention: AMANA + LLOYD)');
  console.log('  • STEG (Convention: AMANA)');
  console.log('  • SNCFT (Convention: LLOYD)');
  console.log('  • SONEDE (No Convention)');
  console.log('  • Banque Centrale (Convention: AMANA + LLOYD)');
  console.log('');
  console.log('Conventions Created: 4');
  console.log('  • Convention Tunisair 2024');
  console.log('  • Convention STEG 2024');
  console.log('  • Convention SNCFT 2024');
  console.log('  • Convention Banque Centrale 2024');
  console.log('');
  console.log('Clients Created: 9');
  console.log('  • 2 clients in Tunisair');
  console.log('  • 2 clients in STEG');
  console.log('  • 1 client in SNCFT');
  console.log('  • 1 client in SONEDE');
  console.log('  • 1 client in Banque Centrale');
  console.log('  • 2 independent clients');
  console.log('');
  console.log('Default Password: password123');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
