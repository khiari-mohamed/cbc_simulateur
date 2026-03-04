import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up partial migration data...');

  await prisma.dcMatrixPrice.deleteMany({});
  await prisma.dcMatrixCapital.deleteMany({});
  await prisma.dcMatrixVvRange.deleteMany({});
  await prisma.dcConfig.deleteMany({});
  await prisma.dcProgressiveTier.deleteMany({});
  await prisma.dcCapitalTier.deleteMany({});

  console.log('✅ Cleanup completed!');
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
