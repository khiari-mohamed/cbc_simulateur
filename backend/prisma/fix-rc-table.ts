import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRCTable() {
  console.log('🔧 Fixing RC Table...\n');

  const rcGuarantee = await prisma.guarantee.findUnique({ where: { code: 'RC' } });
  if (!rcGuarantee) {
    console.error('❌ RC guarantee not found');
    return;
  }

  const companies = await prisma.company.findMany();
  
  // RC Table from client document
  const rcTable = [
    // Classe 01 (70%)
    { classe: 1, minPower: 3, maxPower: 4, premium: 77 },
    { classe: 1, minPower: 5, maxPower: 6, premium: 98 },
    { classe: 1, minPower: 7, maxPower: 10, premium: 119 },
    { classe: 1, minPower: 11, maxPower: 14, premium: 154 },
    { classe: 1, minPower: 15, maxPower: 50, premium: 184.8 },
    
    // Classe 02 (80%)
    { classe: 2, minPower: 3, maxPower: 4, premium: 88 },
    { classe: 2, minPower: 5, maxPower: 6, premium: 112 },
    { classe: 2, minPower: 7, maxPower: 10, premium: 136 },
    { classe: 2, minPower: 11, maxPower: 14, premium: 176 },
    { classe: 2, minPower: 15, maxPower: 50, premium: 211.2 },
    
    // Classe 03 (90%)
    { classe: 3, minPower: 3, maxPower: 4, premium: 99 },
    { classe: 3, minPower: 5, maxPower: 6, premium: 126 },
    { classe: 3, minPower: 7, maxPower: 10, premium: 153 },
    { classe: 3, minPower: 11, maxPower: 14, premium: 198 },
    { classe: 3, minPower: 15, maxPower: 50, premium: 237.6 },
    
    // Classe 04 (100%)
    { classe: 4, minPower: 3, maxPower: 4, premium: 110 },
    { classe: 4, minPower: 5, maxPower: 6, premium: 140 },
    { classe: 4, minPower: 7, maxPower: 10, premium: 170 },
    { classe: 4, minPower: 11, maxPower: 14, premium: 220 },
    { classe: 4, minPower: 15, maxPower: 50, premium: 264 },
    
    // Classe 05 (120%)
    { classe: 5, minPower: 3, maxPower: 4, premium: 132 },
    { classe: 5, minPower: 5, maxPower: 6, premium: 168 },
    { classe: 5, minPower: 7, maxPower: 10, premium: 204 },
    { classe: 5, minPower: 11, maxPower: 14, premium: 264 },
    { classe: 5, minPower: 15, maxPower: 50, premium: 316.8 },
    
    // Classe 06 (140%)
    { classe: 6, minPower: 3, maxPower: 4, premium: 154 },
    { classe: 6, minPower: 5, maxPower: 6, premium: 196 },
    { classe: 6, minPower: 7, maxPower: 10, premium: 238 },
    { classe: 6, minPower: 11, maxPower: 14, premium: 308 },
    { classe: 6, minPower: 15, maxPower: 50, premium: 369.6 },
    
    // Classe 07 (160%)
    { classe: 7, minPower: 3, maxPower: 4, premium: 176 },
    { classe: 7, minPower: 5, maxPower: 6, premium: 224 },
    { classe: 7, minPower: 7, maxPower: 10, premium: 272 },
    { classe: 7, minPower: 11, maxPower: 14, premium: 352 },
    { classe: 7, minPower: 15, maxPower: 50, premium: 422.4 },
    
    // Classe 08 (200%)
    { classe: 8, minPower: 3, maxPower: 4, premium: 220 },
    { classe: 8, minPower: 5, maxPower: 6, premium: 280 },
    { classe: 8, minPower: 7, maxPower: 10, premium: 340 },
    { classe: 8, minPower: 11, maxPower: 14, premium: 440 },
    { classe: 8, minPower: 15, maxPower: 50, premium: 528 },
  ];

  // Delete old RC rules
  await prisma.pricingRule.deleteMany({
    where: { guaranteeId: rcGuarantee.id },
  });

  // Create new RC rules for both companies
  for (const company of companies) {
    for (const rule of rcTable) {
      await prisma.pricingRule.create({
        data: {
          companyId: company.id,
          guaranteeId: rcGuarantee.id,
          minPower: rule.minPower,
          maxPower: rule.maxPower,
          bonusMalusClass: rule.classe,
          fixedPremium: rule.premium,
          isActive: true,
        },
      });
    }
    console.log(`✅ RC rules created for ${company.name}: ${rcTable.length} rules`);
  }

  console.log('\n✅ RC Table fixed!\n');
}

fixRCTable()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
