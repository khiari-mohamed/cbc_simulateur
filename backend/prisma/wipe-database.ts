import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function wipeDatabase() {
  console.log('🗑️  Starting database wipe...\n');

  try {
    await prisma.$transaction([
      prisma.notification.deleteMany(),
      prisma.quoteComparison.deleteMany(),
      prisma.auditLog.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.document.deleteMany(),
      prisma.dcMatrixPrice.deleteMany(),
      prisma.dcMatrixCapital.deleteMany(),
      prisma.dcMatrixVvRange.deleteMany(),
      prisma.dcProgressiveTier.deleteMany(),
      prisma.dcCapitalTier.deleteMany(),
      prisma.dcConfig.deleteMany(),
      prisma.pricingRule.deleteMany(),
      prisma.quoteItem.deleteMany(),
      prisma.contract.deleteMany(),
      prisma.quote.deleteMany(),
      prisma.simulationGuarantee.deleteMany(),
      prisma.simulation.deleteMany(),
      prisma.driverProfile.deleteMany(),
      prisma.vehicle.deleteMany(),
      prisma.conventionReductionRule.deleteMany(),
      prisma.conventionCompany.deleteMany(),
      prisma.convention.deleteMany(),
      prisma.user.deleteMany(),
      prisma.clientOrganization.deleteMany(),
      prisma.guarantee.deleteMany(),
      prisma.company.deleteMany(),
    ]);

    console.log('✅ Database wiped successfully!\n');
    console.log('All tables are now empty. You can now:');
    console.log('  - Run seed scripts to populate with test data');
    console.log('  - Test with an empty database\n');
  } catch (error) {
    console.error('❌ Error wiping database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

wipeDatabase();
