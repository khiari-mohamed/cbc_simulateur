import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestQuote() {
  const company = await prisma.company.findFirst({
    where: { code: 'LLOYD' },
  });

  if (!company) {
    console.log('❌ LLOYD company not found');
    return;
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      fiscalHorsepower: 7,
      numberOfSeats: 5,
      newValue: 50000,
      marketValue: 50000,
      firstCirculationDate: new Date('2020-01-01'),
    },
  });

  const simulation = await prisma.simulation.create({
    data: {
      userId: 'b3326181-4ded-45b5-95b7-e54a6ffb111c',
      vehicleId: vehicle.id,
      bonusMalus: 1.0,
      usage: 'PRIVATE_BUSINESS',
      formulaType: 'STANDARD',
    },
  });

  const quote = await prisma.quote.create({
    data: {
      id: 'test-quote-flouci',
      quoteNumber: 'Q2026TEST001',
      simulationId: simulation.id,
      userId: 'b3326181-4ded-45b5-95b7-e54a6ffb111c',
      companyId: company.id,
      status: 'VALIDATED',
      primeNette: 4000.00,
      frais: 30.00,
      taxes: 500.00,
      fpac: 0.50,
      fssr: 0.30,
      fg: 3.00,
      totalAPayer: 4533.80,
    },
  });

  console.log('✅ Test quote created:');
  console.log(`   ID: ${quote.id}`);
  console.log(`   Number: ${quote.quoteNumber}`);
  console.log(`   Status: ${quote.status}`);
  console.log(`   Total: ${quote.totalAPayer} TND`);

  await prisma.$disconnect();
}

createTestQuote();
