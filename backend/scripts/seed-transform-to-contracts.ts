import { PrismaClient, QuoteStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed: Transform Quotes to Contracts...\n');

  // Get all validated quotes that are not yet transformed
  const quotes = await prisma.quote.findMany({
    where: {
      status: QuoteStatus.VALIDATED,
    },
    include: {
      user: true,
      company: true,
      simulation: {
        include: {
          convention: true,
        },
      },
    },
  });

  if (quotes.length === 0) {
    console.log('❌ No validated quotes found to transform!');
    console.log('💡 Run seed-simulations-with-conventions.ts first to create quotes.');
    return;
  }

  console.log(`📋 Found ${quotes.length} validated quotes\n`);

  let contractCount = 0;
  const transformPercentage = 0.6; // Transform 60% of validated quotes

  for (const quote of quotes) {
    // Randomly transform 60% of quotes
    if (Math.random() > transformPercentage) {
      console.log(`⏭️  Skipping quote ${quote.quoteNumber}`);
      continue;
    }

    try {
      // Create contract
      const contract = await prisma.contract.create({
        data: {
          contractNumber: `C-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          quoteId: quote.id,
          userId: quote.userId,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          createdById: quote.userId,
          deliveryType: Math.random() > 0.5 ? 'AGENCY_PICKUP' : 'HOME_DELIVERY',
          deliveryFee: Math.random() > 0.5 ? 0 : 50,
          quittanceNumber: `QT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        },
      });

      // Update quote status to TRANSFORMED_TO_CONTRACT
      await prisma.quote.update({
        where: { id: quote.id },
        data: { status: QuoteStatus.TRANSFORMED_TO_CONTRACT },
      });

      contractCount++;

      const conventionInfo = quote.simulation.convention
        ? ` (${quote.simulation.convention.name})`
        : '';

      console.log(
        `✅ Created contract ${contract.contractNumber} for ${quote.user.firstName} ${quote.user.lastName}${conventionInfo}`
      );
    } catch (error) {
      console.error(`❌ Error creating contract for quote ${quote.quoteNumber}:`, error);
    }
  }

  console.log('\n📊 SUMMARY:');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Total Validated Quotes: ${quotes.length}`);
  console.log(`Contracts Created: ${contractCount}`);
  console.log(`Transformation Rate: ${((contractCount / quotes.length) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('✅ Seed completed successfully!');
  console.log('\n💡 Tip: Refresh your Reports page to see the updated statistics!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
