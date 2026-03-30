import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting migration: Copy company fees to UsageFeeConfig for all usage×company combinations...');

  const usages = await prisma.usage.findMany({
    where: { isActive: true },
  });

  const companies = await prisma.company.findMany({
    where: {
      isActive: true,
      contractFees: { not: null },
    },
  });

  console.log(`📊 Found ${usages.length} usages and ${companies.length} companies`);
  console.log(`📦 Will create ${usages.length * companies.length} fee configurations`);

  let created = 0;
  let skipped = 0;

  for (const usage of usages) {
    for (const company of companies) {
      try {
        await prisma.usageFeeConfig.upsert({
          where: {
            usageId_companyId: {
              usageId: usage.id,
              companyId: company.id,
            },
          },
          create: {
            usageId: usage.id,
            companyId: company.id,
            contractFees: company.contractFees ?? 0,
            fpac: company.fpac ?? 0.5,
            fssr: company.fssr ?? 0.3,
            fg: company.fg ?? 3.0,
          },
          update: {}, // Don't overwrite if already exists
        });
        created++;
        console.log(`✅ Created config for ${usage.code} × ${company.name}`);
      } catch (error) {
        skipped++;
        console.log(`⚠️  Skipped ${usage.code} × ${company.name} (already exists or error)`);
      }
    }
  }

  console.log('\n✨ Migration complete!');
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${created + skipped}`);
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
