const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestPaymentScenario() {
  console.log('🚀 Creating complete test scenario for payment testing...\n');

  try {
    // Step 1: Create or get test client
    console.log('👤 Step 1: Creating test client...');
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    
    let testUser = await prisma.user.findUnique({
      where: { email: 'test.payment@example.com' },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test.payment@example.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'Payment',
          phone: '+21612345678',
          role: 'CLIENT_ADHERENT',
          isActive: true,
        },
      });
      console.log('✅ Test client created:', testUser.email);
    } else {
      console.log('✅ Test client already exists:', testUser.email);
    }

    // Step 2: Create driver profile
    console.log('\n🚗 Step 2: Creating driver profile...');
    let driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: testUser.id },
    });

    if (!driverProfile) {
      driverProfile = await prisma.driverProfile.create({
        data: {
          userId: testUser.id,
          birthDate: new Date('1990-01-01'),
          licenseDate: new Date('2010-01-01'),
          experienceYears: 14,
        },
      });
      console.log('✅ Driver profile created');
    } else {
      console.log('✅ Driver profile already exists');
    }

    // Step 3: Create vehicle
    console.log('\n🚙 Step 3: Creating vehicle...');
    const vehicle = await prisma.vehicle.create({
      data: {
        registration: 'TEST-123-TN',
        fiscalHorsepower: 7,
        numberOfSeats: 5,
        newValue: 50000,
        marketValue: 45000,
        firstCirculationDate: new Date('2020-01-01'),
      },
    });
    console.log('✅ Vehicle created:', vehicle.registration);

    // Step 4: Get usage type (PRIVATE_BUSINESS)
    console.log('\n📋 Step 4: Getting usage type...');
    const usage = await prisma.usage.findFirst({
      where: { code: 'PRIVATE_BUSINESS' },
    });
    if (!usage) {
      throw new Error('PRIVATE_BUSINESS usage type not found. Please seed the database first.');
    }
    console.log('✅ Usage type found:', usage.nameFr);

    // Step 5: Create simulation
    console.log('\n🎯 Step 5: Creating simulation...');
    const simulation = await prisma.simulation.create({
      data: {
        userId: testUser.id,
        vehicleId: vehicle.id,
        usageId: usage.id,
        bonusMalus: 1.0,
        formulaType: 'STANDARD',
        fractionnement: 'ANNUEL',
        status: 'APPROVED',
      },
    });
    console.log('✅ Simulation created:', simulation.id);

    // Step 6: Get company (first active company)
    console.log('\n🏢 Step 6: Getting insurance company...');
    const company = await prisma.company.findFirst({
      where: { isActive: true },
    });
    if (!company) {
      throw new Error('No active company found. Please seed the database first.');
    }
    console.log('✅ Company found:', company.name);

    // Step 7: Get mandatory guarantees
    console.log('\n🛡️ Step 7: Getting guarantees...');
    const guarantees = await prisma.guarantee.findMany({
      where: {
        isActive: true,
        systemRole: {
          in: ['MANDATORY_RC', 'MANDATORY_VOL', 'MANDATORY_INCENDIE'],
        },
      },
    });
    console.log(`✅ Found ${guarantees.length} guarantees`);

    // Step 8: Create quote
    console.log('\n📄 Step 8: Creating quote...');
    const quoteNumber = `Q${new Date().getFullYear()}${String(
      (await prisma.quote.count()) + 1
    ).padStart(6, '0')}`;

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        simulationId: simulation.id,
        userId: testUser.id,
        companyId: company.id,
        status: 'VALIDATED', // Already validated for payment
        primeNette: 450.500,
        frais: 15.000,
        taxes: 34.500,
        fpac: 2.250,
        fssr: 1.350,
        fg: 13.500,
        totalAPayer: 500.000,
        fractionnement: 'ANNUEL',
        pricingSnapshot: {
          vehicleValue: 45000,
          bonusMalus: 1.0,
          formulaType: 'STANDARD',
        },
      },
    });
    console.log('✅ Quote created:', quote.quoteNumber);

    // Step 9: Create quote items
    console.log('\n📦 Step 9: Creating quote items...');
    for (const guarantee of guarantees) {
      await prisma.quoteItem.create({
        data: {
          quoteId: quote.id,
          guaranteeId: guarantee.id,
          capital: 10000,
          prime: 150.000,
          isNotCovered: false,
        },
      });
    }
    console.log(`✅ Created ${guarantees.length} quote items`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✨ TEST SCENARIO CREATED SUCCESSFULLY! ✨');
    console.log('='.repeat(60));
    console.log('\n📋 Test Data Summary:');
    console.log('─'.repeat(60));
    console.log(`👤 Client Email:    test.payment@example.com`);
    console.log(`🔑 Password:        Test123!`);
    console.log(`📄 Quote Number:    ${quote.quoteNumber}`);
    console.log(`📄 Quote ID:        ${quote.id}`);
    console.log(`💰 Total Amount:    ${quote.totalAPayer} DT`);
    console.log(`✅ Quote Status:    ${quote.status}`);
    console.log(`🏢 Company:         ${company.name}`);
    console.log(`🚗 Vehicle:         ${vehicle.registration}`);
    console.log('─'.repeat(60));
    console.log('\n🎯 Next Steps:');
    console.log('1. Start backend: npm run start:dev');
    console.log('2. Start frontend: npm run dev');
    console.log('3. Login with: test.payment@example.com / Test123!');
    console.log('4. Go to "Mes Devis" and find quote:', quote.quoteNumber);
    console.log('5. Click "Procéder au paiement"');
    console.log('6. Complete the checkout process');
    console.log('\n📊 Check backend console for detailed payment logs!');
    console.log('='.repeat(60) + '\n');

    return {
      user: testUser,
      vehicle,
      simulation,
      quote,
      company,
    };
  } catch (error) {
    console.error('\n❌ Error creating test scenario:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestPaymentScenario()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
