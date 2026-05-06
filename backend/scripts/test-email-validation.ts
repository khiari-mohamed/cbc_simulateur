import { PrismaClient, Role, QuoteStatus, FormulaType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing Email Validation Flow...\n');

  const testEmail = 'finalahmed290@gmail.com';
  const password = 'Test123!';

  // ============================================
  // 1. CREATE TEST CLIENT
  // ============================================
  console.log('👤 Step 1: Creating test client...');
  
  // Delete existing user if exists
  const existingUser = await prisma.user.findUnique({ where: { email: testEmail } });
  if (existingUser) {
    console.log('   ⚠️  User already exists, deleting old data...');
    await prisma.quote.deleteMany({ where: { userId: existingUser.id } });
    await prisma.simulation.deleteMany({ where: { userId: existingUser.id } });
    await prisma.vehicle.deleteMany({ where: { simulations: { some: { userId: existingUser.id } } } });
    await prisma.driverProfile.deleteMany({ where: { userId: existingUser.id } });
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const testUser = await prisma.user.create({
    data: {
      email: testEmail,
      password: hashedPassword,
      firstName: 'Ahmed',
      lastName: 'Test',
      phone: '+216 12 345 678',
      role: Role.CLIENT_ADHERENT,
      isActive: true,
      driverProfile: {
        create: {
          birthDate: new Date('1990-01-01'),
          licenseDate: new Date('2010-01-01'),
          experienceYears: 14,
        },
      },
    },
  });
  console.log('   ✅ Client created:', testUser.email);

  // ============================================
  // 2. GET REQUIRED DATA
  // ============================================
  console.log('\n📋 Step 2: Getting required data...');
  
  const company = await prisma.company.findFirst({ where: { code: 'LLOYD' } });
  if (!company) throw new Error('Company LLOYD not found');
  console.log('   ✅ Company:', company.name);

  const usage = await prisma.usage.findFirst({ where: { code: 'PRIVATE_BUSINESS' } });
  if (!usage) throw new Error('Usage PRIVATE_BUSINESS not found');
  console.log('   ✅ Usage:', usage.nameFr);

  const guarantees = await prisma.guarantee.findMany({ where: { isActive: true }, take: 3 });
  console.log('   ✅ Guarantees:', guarantees.length);

  // ============================================
  // 3. CREATE VEHICLE
  // ============================================
  console.log('\n🚗 Step 3: Creating vehicle...');
  
  const vehicle = await prisma.vehicle.create({
    data: {
      registration: 'TEST-2024-001',
      fiscalHorsepower: 6,
      numberOfSeats: 5,
      newValue: 50000,
      marketValue: 45000,
      firstCirculationDate: new Date('2022-01-15'),
    },
  });
  console.log('   ✅ Vehicle created:', vehicle.registration);

  // ============================================
  // 4. CREATE SIMULATION
  // ============================================
  console.log('\n🎯 Step 4: Creating simulation...');
  
  const simulation = await prisma.simulation.create({
    data: {
      userId: testUser.id,
      vehicleId: vehicle.id,
      usageId: usage.id,
      formulaType: FormulaType.STANDARD,
      bonusMalus: 1.0,
      franchiseRate: 0,
      bgLimit: 3000,
      status: 'SUBMITTED',
    },
  });
  console.log('   ✅ Simulation created:', simulation.id);

  // Add guarantees to simulation
  for (const guarantee of guarantees) {
    await prisma.simulationGuarantee.create({
      data: {
        simulationId: simulation.id,
        guaranteeId: guarantee.id,
        isSelected: true,
      },
    });
  }
  console.log('   ✅ Added', guarantees.length, 'guarantees');

  // ============================================
  // 5. CREATE QUOTE (MANUALLY)
  // ============================================
  console.log('\n💰 Step 5: Creating quote...');
  
  const quoteNumber = `TEST-${Date.now()}`;
  const primeNette = 450.50;
  const frais = 30;
  const fpac = 5;
  const fssr = 3;
  const fg = 2;
  const taxes = 50.25;
  const totalAPayer = primeNette + frais + taxes + fpac + fssr + fg;

  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      simulationId: simulation.id,
      userId: testUser.id,
      companyId: company.id,
      status: QuoteStatus.SUBMITTED,
      primeNette,
      frais,
      taxes,
      fpac,
      fssr,
      fg,
      totalAPayer,
      effectiveDate: new Date(),
      items: {
        create: guarantees.map((g) => ({
          guaranteeId: g.id,
          capital: 10000,
          prime: 150,
        })),
      },
    },
    include: {
      user: true,
      company: true,
    },
  });
  console.log('   ✅ Quote created:', quote.quoteNumber);
  console.log('   📊 Total:', totalAPayer.toFixed(3), 'DT');

  // ============================================
  // 6. GET GESTIONNAIRE USER
  // ============================================
  console.log('\n👨‍💼 Step 6: Getting Gestionnaire...');
  
  const gestionnaire = await prisma.user.findFirst({
    where: { role: Role.GESTIONNAIRE_VALIDATION_ARS },
  });
  if (!gestionnaire) throw new Error('No Gestionnaire found');
  console.log('   ✅ Gestionnaire:', gestionnaire.email);

  // ============================================
  // 7. VALIDATE QUOTE (THIS SHOULD SEND EMAIL)
  // ============================================
  console.log('\n✅ Step 7: VALIDATING QUOTE (Email should be sent now)...');
  
  const validatedQuote = await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: QuoteStatus.VALIDATED,
      validatedById: gestionnaire.id,
      validatedAt: new Date(),
    },
    include: { user: true },
  });

  console.log('   ✅ Quote validated!');
  console.log('   📧 Email should be sent to:', testEmail);
  console.log('   📝 Quote Number:', validatedQuote.quoteNumber);
  console.log('   ⏰ Validated At:', validatedQuote.validatedAt);

  // ============================================
  // 8. TRIGGER NOTIFICATION SERVICE MANUALLY
  // ============================================
  console.log('\n📧 Step 8: Triggering notification service...');
  
  // Import notification service and create instance with PrismaService wrapper
  const { NotificationsService } = await import('../src/notifications/notifications.service');
  const { ConfigService } = await import('@nestjs/config');
  const { PrismaService } = await import('../src/prisma/prisma.service');
  
  const configService = new ConfigService();
  const prismaService = new PrismaService();
  const notificationsService = new NotificationsService(configService, prismaService);
  
  try {
    await notificationsService.notifyQuoteValidated(
      validatedQuote.user,
      validatedQuote.quoteNumber,
    );
    console.log('   ✅ Notification sent successfully!');
  } catch (error: any) {
    console.error('   ❌ Failed to send notification:', error.message);
    console.error('   Full error:', error);
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('✅ Client Email:', testEmail);
  console.log('✅ Password:', password);
  console.log('✅ Quote Number:', validatedQuote.quoteNumber);
  console.log('✅ Status:', validatedQuote.status);
  console.log('✅ Total Amount:', totalAPayer.toFixed(3), 'DT');
  console.log('='.repeat(60));
  console.log('\n📧 CHECK YOUR EMAIL:', testEmail);
  console.log('Subject: "Devis validé - ARS"');
  console.log('From: ARS Tunisia <donotreply@arstunisie.com>');
  console.log('\n⚠️  If email not received, check:');
  console.log('   1. Spam/Junk folder');
  console.log('   2. SMTP configuration in .env');
  console.log('   3. Backend logs for errors');
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
