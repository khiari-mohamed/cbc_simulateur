import { PrismaClient, FormulaType, QuoteStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed: Simulations & Quotes with Conventions...\n');

  // Get existing data
  const conventions = await prisma.convention.findMany({
    include: { organization: true, companies: true },
  });

  const users = await prisma.user.findMany({
    where: {
      organizationId: { not: null },
      role: 'CLIENT_ADHERENT',
    },
    include: { organization: true },
  });

  const vehicles = await prisma.vehicle.findMany({ take: 3 });
  const usages = await prisma.usage.findMany({ take: 2 });
  const guarantees = await prisma.guarantee.findMany({ take: 5 });

  if (conventions.length === 0) {
    console.log('❌ No conventions found. Run seed-clients-organizations.ts first!');
    return;
  }

  if (users.length === 0) {
    console.log('❌ No users with organizations found!');
    return;
  }

  console.log(`📊 Found ${conventions.length} conventions and ${users.length} users\n`);

  let simulationCount = 0;
  let quoteCount = 0;

  // Create simulations for each user with their organization's convention
  for (const user of users) {
    const userConvention = conventions.find(
      (c) => c.organizationId === user.organizationId
    );

    if (!userConvention) {
      console.log(`⚠️  No convention for ${user.email}, skipping...`);
      continue;
    }

    // Create 2-3 simulations per user
    const numSimulations = Math.floor(Math.random() * 2) + 2;

    for (let i = 0; i < numSimulations; i++) {
      const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
      const usage = usages[Math.floor(Math.random() * usages.length)];
      const formulaType = [FormulaType.STANDARD, FormulaType.DOMMAGES_COLLISIONS, FormulaType.TOUS_RISQUES_0][
        Math.floor(Math.random() * 3)
      ];

      // Create simulation
      const simulation = await prisma.simulation.create({
        data: {
          userId: user.id,
          vehicleId: vehicle.id,
          conventionId: userConvention.id,
          usageId: usage.id,
          formulaType,
          bonusMalus: 1.0,
          franchiseRate: 5,
          bgLimit: 5000,
          dcCapital: 50000,
          status: 'SUBMITTED',
        },
      });

      simulationCount++;

      // Add guarantees to simulation
      const selectedGuarantees = guarantees.slice(0, Math.floor(Math.random() * 3) + 2);
      for (const guarantee of selectedGuarantees) {
        await prisma.simulationGuarantee.create({
          data: {
            simulationId: simulation.id,
            guaranteeId: guarantee.id,
            isSelected: true,
            customValue: Math.random() > 0.5 ? 10000 : null,
          },
        });
      }

      // Create quotes for each company in the convention
      for (const convCompany of userConvention.companies) {
        const company = await prisma.company.findUnique({
          where: { id: convCompany.companyId },
        });

        if (!company) continue;

        const primeNette = Math.random() * 500 + 200;
        const frais = company.contractFees ? Number(company.contractFees) : 50;
        const fpac = (primeNette * Number(company.fpac)) / 100;
        const fssr = (primeNette * Number(company.fssr)) / 100;
        const fg = (primeNette * Number(company.fg)) / 100;
        const taxes = fpac + fssr + fg;
        const totalAPayer = primeNette + frais + taxes;

        const quote = await prisma.quote.create({
          data: {
            quoteNumber: `Q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            simulationId: simulation.id,
            userId: user.id,
            companyId: company.id,
            status: Math.random() > 0.7 ? QuoteStatus.VALIDATED : QuoteStatus.GENERATED,
            primeNette,
            frais,
            taxes,
            fpac,
            fssr,
            fg,
            totalAPayer,
            effectiveDate: new Date(),
          },
        });

        quoteCount++;

        // Add quote items
        for (const guarantee of selectedGuarantees) {
          await prisma.quoteItem.create({
            data: {
              quoteId: quote.id,
              guaranteeId: guarantee.id,
              capital: Math.random() * 50000 + 10000,
              prime: Math.random() * 100 + 50,
            },
          });
        }

        // Create some contracts (20% chance)
        if (Math.random() > 0.8 && quote.status === QuoteStatus.VALIDATED) {
          await prisma.contract.create({
            data: {
              contractNumber: `C-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              quoteId: quote.id,
              userId: user.id,
              status: 'ACTIVE',
              startDate: new Date(),
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              createdById: user.id,
              deliveryType: 'AGENCY_PICKUP',
            },
          });

          // Update quote status
          await prisma.quote.update({
            where: { id: quote.id },
            data: { status: QuoteStatus.TRANSFORMED_TO_CONTRACT },
          });
        }
      }

      console.log(
        `✅ Created simulation for ${user.firstName} ${user.lastName} (${userConvention.name})`
      );
    }
  }

  console.log('\n📊 SUMMARY:');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Simulations Created: ${simulationCount}`);
  console.log(`Quotes Created: ${quoteCount}`);
  console.log(`Conventions Used: ${conventions.length}`);
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
