import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAllHardcoded() {
  console.log('🔧 Fixing ALL Hardcoded Values\n');

  // 1. Update FPAC, FSSR, FG for both companies
  console.log('1️⃣ Setting FPAC, FSSR, FG...');
  await prisma.company.updateMany({
    data: {
      fpac: 0.5,
      fssr: 0.3,
      fg: 3.0
    }
  });
  console.log('   ✅ FPAC=0.5, FSSR=0.3, FG=3.0 for all companies');

  console.log('\n✅ All hardcoded values fixed!');
  await prisma.$disconnect();
}

fixAllHardcoded().catch(console.error);
