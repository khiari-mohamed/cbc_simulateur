import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function populateDommagesCollisionsCommercial() {
  console.log('🔧 Populating DOMMAGES_COLLISIONS COMMERCIAL (Affaire) Lookup Table\n');

  const dcGuarantee = await prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_COLLISIONS' } });
  const companies = await prisma.company.findMany();

  if (!dcGuarantee) {
    console.log('❌ DOMMAGES_COLLISIONS guarantee not found');
    return;
  }

  // Delete existing COMMERCIAL rules
  await prisma.pricingRule.deleteMany({
    where: {
      guaranteeId: dcGuarantee.id,
      usageType: 'COMMERCIAL'
    }
  });

  // TARIFICATION TIERCE COLLISION USAGE "AFFAIRE" 0% FRANCHISE
  // Exact values from client specification
  const lookupTable = [
    // 8,000 < VV <= 30,000
    { minVV: 8000, maxVV: 30000, capital: 1000, prime: 77 },
    { minVV: 8000, maxVV: 30000, capital: 2000, prime: 142.7 },
    { minVV: 8000, maxVV: 30000, capital: 3000, prime: 205.3 },
    { minVV: 8000, maxVV: 30000, capital: 4000, prime: 265.7 },
    { minVV: 8000, maxVV: 30000, capital: 5000, prime: 322.7 },
    { minVV: 8000, maxVV: 30000, capital: 6000, prime: 393 },
    { minVV: 8000, maxVV: 30000, capital: 7000, prime: 449.5 },
    { minVV: 8000, maxVV: 30000, capital: 8000, prime: 506 },
    { minVV: 8000, maxVV: 30000, capital: 9000, prime: 560 },
    { minVV: 8000, maxVV: 30000, capital: 10000, prime: 612.5 },
    { minVV: 8000, maxVV: 30000, capital: 15000, prime: 894 },

    // 30,000 < VV <= 60,000
    { minVV: 30000, maxVV: 60000, capital: 1000, prime: 77 },
    { minVV: 30000, maxVV: 60000, capital: 2000, prime: 144 },
    { minVV: 30000, maxVV: 60000, capital: 3000, prime: 211 },
    { minVV: 30000, maxVV: 60000, capital: 4000, prime: 278 },
    { minVV: 30000, maxVV: 60000, capital: 5000, prime: 343.7 },
    { minVV: 30000, maxVV: 60000, capital: 6000, prime: 408 },
    { minVV: 30000, maxVV: 60000, capital: 7000, prime: 471 },
    { minVV: 30000, maxVV: 60000, capital: 8000, prime: 534 },
    { minVV: 30000, maxVV: 60000, capital: 9000, prime: 595.3 },
    { minVV: 30000, maxVV: 60000, capital: 10000, prime: 656.7 },
    { minVV: 30000, maxVV: 60000, capital: 15000, prime: 947 },
    { minVV: 30000, maxVV: 60000, capital: 20000, prime: 1220 },
    { minVV: 30000, maxVV: 60000, capital: 30000, prime: 1768 },

    // 60,000 < VV <= 80,000
    { minVV: 60000, maxVV: 80000, capital: 1000, prime: 77 },
    { minVV: 60000, maxVV: 80000, capital: 2000, prime: 144 },
    { minVV: 60000, maxVV: 80000, capital: 3000, prime: 211 },
    { minVV: 60000, maxVV: 80000, capital: 4000, prime: 278 },
    { minVV: 60000, maxVV: 80000, capital: 5000, prime: 345 },
    { minVV: 60000, maxVV: 80000, capital: 6000, prime: 412 },
    { minVV: 60000, maxVV: 80000, capital: 7000, prime: 479 },
    { minVV: 60000, maxVV: 80000, capital: 8000, prime: 544 },
    { minVV: 60000, maxVV: 80000, capital: 9000, prime: 607 },
    { minVV: 60000, maxVV: 80000, capital: 10000, prime: 670 },
    { minVV: 60000, maxVV: 80000, capital: 15000, prime: 983 },
    { minVV: 60000, maxVV: 80000, capital: 20000, prime: 1275 },
    { minVV: 60000, maxVV: 80000, capital: 30000, prime: 1827.5 },
    { minVV: 60000, maxVV: 80000, capital: 40000, prime: 2354 },

    // 80,000 < VV <= 100,000
    { minVV: 80000, maxVV: 100000, capital: 1000, prime: 77 },
    { minVV: 80000, maxVV: 100000, capital: 2000, prime: 144 },
    { minVV: 80000, maxVV: 100000, capital: 3000, prime: 211 },
    { minVV: 80000, maxVV: 100000, capital: 4000, prime: 278 },
    { minVV: 80000, maxVV: 100000, capital: 5000, prime: 345 },
    { minVV: 80000, maxVV: 100000, capital: 6000, prime: 412 },
    { minVV: 80000, maxVV: 100000, capital: 7000, prime: 479 },
    { minVV: 80000, maxVV: 100000, capital: 8000, prime: 546 },
    { minVV: 80000, maxVV: 100000, capital: 9000, prime: 613 },
    { minVV: 80000, maxVV: 100000, capital: 10000, prime: 678 },
    { minVV: 80000, maxVV: 100000, capital: 15000, prime: 993 },
    { minVV: 80000, maxVV: 100000, capital: 20000, prime: 1303 },
    { minVV: 80000, maxVV: 100000, capital: 30000, prime: 1878.5 },
    { minVV: 80000, maxVV: 100000, capital: 40000, prime: 2418.5 },
    { minVV: 80000, maxVV: 100000, capital: 50000, prime: 2940 },

    // 100,000 < VV <= 150,000
    { minVV: 100000, maxVV: 150000, capital: 1000, prime: 77 },
    { minVV: 100000, maxVV: 150000, capital: 2000, prime: 144 },
    { minVV: 100000, maxVV: 150000, capital: 3000, prime: 211 },
    { minVV: 100000, maxVV: 150000, capital: 4000, prime: 278 },
    { minVV: 100000, maxVV: 150000, capital: 5000, prime: 345 },
    { minVV: 100000, maxVV: 150000, capital: 6000, prime: 412 },
    { minVV: 100000, maxVV: 150000, capital: 7000, prime: 479 },
    { minVV: 100000, maxVV: 150000, capital: 8000, prime: 546 },
    { minVV: 100000, maxVV: 150000, capital: 9000, prime: 613 },
    { minVV: 100000, maxVV: 150000, capital: 10000, prime: 680 },
    { minVV: 100000, maxVV: 150000, capital: 15000, prime: 1007 },
    { minVV: 100000, maxVV: 150000, capital: 20000, prime: 1322 },
    { minVV: 100000, maxVV: 150000, capital: 30000, prime: 1932 },
    { minVV: 100000, maxVV: 150000, capital: 40000, prime: 2504.8 },
    { minVV: 100000, maxVV: 150000, capital: 50000, prime: 3051 },
    { minVV: 100000, maxVV: 150000, capital: 75000, prime: 4405 },

    // 150,000 < VV <= 200,000
    { minVV: 150000, maxVV: 200000, capital: 1000, prime: 77 },
    { minVV: 150000, maxVV: 200000, capital: 2000, prime: 144 },
    { minVV: 150000, maxVV: 200000, capital: 3000, prime: 211 },
    { minVV: 150000, maxVV: 200000, capital: 4000, prime: 278 },
    { minVV: 150000, maxVV: 200000, capital: 5000, prime: 345 },
    { minVV: 150000, maxVV: 200000, capital: 6000, prime: 412 },
    { minVV: 150000, maxVV: 200000, capital: 7000, prime: 479 },
    { minVV: 150000, maxVV: 200000, capital: 8000, prime: 546 },
    { minVV: 150000, maxVV: 200000, capital: 9000, prime: 613 },
    { minVV: 150000, maxVV: 200000, capital: 10000, prime: 680 },
    { minVV: 150000, maxVV: 200000, capital: 15000, prime: 1015 },
    { minVV: 150000, maxVV: 200000, capital: 20000, prime: 1342 },
    { minVV: 150000, maxVV: 200000, capital: 30000, prime: 1972 },
    { minVV: 150000, maxVV: 200000, capital: 40000, prime: 2582 },
    { minVV: 150000, maxVV: 200000, capital: 50000, prime: 3160.8 },
    { minVV: 150000, maxVV: 200000, capital: 75000, prime: 4528 },
    { minVV: 150000, maxVV: 200000, capital: 100000, prime: 5870 },

    // VV > 200,000
    { minVV: 200000, maxVV: null, capital: 1000, prime: 77 },
    { minVV: 200000, maxVV: null, capital: 2000, prime: 144 },
    { minVV: 200000, maxVV: null, capital: 3000, prime: 211 },
    { minVV: 200000, maxVV: null, capital: 4000, prime: 278 },
    { minVV: 200000, maxVV: null, capital: 5000, prime: 345 },
    { minVV: 200000, maxVV: null, capital: 6000, prime: 412 },
    { minVV: 200000, maxVV: null, capital: 7000, prime: 479 },
    { minVV: 200000, maxVV: null, capital: 8000, prime: 546 },
    { minVV: 200000, maxVV: null, capital: 9000, prime: 613 },
    { minVV: 200000, maxVV: null, capital: 10000, prime: 680 },
    { minVV: 200000, maxVV: null, capital: 15000, prime: 1015 },
    { minVV: 200000, maxVV: null, capital: 20000, prime: 1350 },
    { minVV: 200000, maxVV: null, capital: 30000, prime: 2020 },
    { minVV: 200000, maxVV: null, capital: 40000, prime: 2670 },
    { minVV: 200000, maxVV: null, capital: 50000, prime: 3300 },
    { minVV: 200000, maxVV: null, capital: 75000, prime: 4837.5 },
    { minVV: 200000, maxVV: null, capital: 100000, prime: 6285 },
  ];

  for (const company of companies) {
    console.log(`\n📋 ${company.name} - Adding ${lookupTable.length} COMMERCIAL lookup entries`);
    
    for (const entry of lookupTable) {
      await prisma.pricingRule.create({
        data: {
          companyId: company.id,
          guaranteeId: dcGuarantee.id,
          usageType: 'COMMERCIAL',
          minMarketValue: new Decimal(entry.minVV),
          maxMarketValue: entry.maxVV ? new Decimal(entry.maxVV) : null,
          minCapital: new Decimal(entry.capital),
          maxCapital: new Decimal(entry.capital),
          fixedPremium: new Decimal(entry.prime),
          isActive: true
        }
      });
    }
    
    console.log(`   ✅ ${company.name}: ${lookupTable.length} entries added`);
  }

  console.log('\n✅ DOMMAGES_COLLISIONS COMMERCIAL fully configured!');
  await prisma.$disconnect();
}

populateDommagesCollisionsCommercial().catch(console.error);
