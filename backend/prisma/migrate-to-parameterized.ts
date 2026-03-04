import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migrating to parameterized formulas...');

  // Get companies
  const lloyd = await prisma.company.findUnique({ where: { code: 'LLOYD' } });
  const amana = await prisma.company.findUnique({ where: { code: 'AMANA' } });

  if (!lloyd || !amana) {
    throw new Error('Companies not found');
  }

  // 1. Update VOL & INCENDIE formulas
  console.log('📝 Updating VOL formulas...');
  const volGuarantee = await prisma.guarantee.findUnique({ where: { code: 'VOL' } });
  if (volGuarantee) {
    // OLD: ((marketValue * 2.36) / 1000 + 30)
    // NEW: ((marketValue * 0.00236) + 30) * (1 - 0/100) = same
    await prisma.pricingRule.updateMany({
      where: { guaranteeId: volGuarantee.id },
      data: {
        ratePercentage: 0.00236, // 2.36/1000
        fixedPremium: 30,
        reductionRate: 0, // 0% discount
      },
    });
  }

  console.log('📝 Updating INCENDIE formulas...');
  const incendieGuarantee = await prisma.guarantee.findUnique({ where: { code: 'INCENDIE' } });
  if (incendieGuarantee) {
    // OLD: ((marketValue * 2.75) / 1000 + 30)
    // NEW: ((marketValue * 0.00275) + 30) * (1 - 0/100) = same
    await prisma.pricingRule.updateMany({
      where: { guaranteeId: incendieGuarantee.id },
      data: {
        ratePercentage: 0.00275, // 2.75/1000
        fixedPremium: 30,
        reductionRate: 0, // 0% discount
      },
    });
  }

  console.log('📝 Updating BG formulas...');
  const bgGuarantee = await prisma.guarantee.findUnique({ where: { code: 'BG' } });
  if (bgGuarantee) {
    // Lloyd: 6.5%
    await prisma.pricingRule.updateMany({
      where: { guaranteeId: bgGuarantee.id, companyId: lloyd.id },
      data: {
        ratePercentage: 0.065,
        reductionRate: 0, // 0% discount
      },
    });
    // Amana: 7%
    await prisma.pricingRule.updateMany({
      where: { guaranteeId: bgGuarantee.id, companyId: amana.id },
      data: {
        ratePercentage: 0.07,
        reductionRate: 0, // 0% discount
      },
    });
  }

  // 2. Setup DC Capital Tiers (for both companies and usage types)
  console.log('📝 Creating DC Capital Tiers...');
  const dcTiers = [
    { minAmount: 1000, maxAmount: 10000, step: 1000 },
    { minAmount: 10000, maxAmount: 20000, step: 5000 },
    { minAmount: 20000, maxAmount: 50000, step: 10000 },
    { minAmount: 50000, maxAmount: 100000, step: 25000 },
  ];

  for (const company of [lloyd, amana]) {
    for (const usageType of ['PRIVATE_BUSINESS', 'COMMERCIAL']) {
      for (const tier of dcTiers) {
        await prisma.dcCapitalTier.create({
          data: {
            companyId: company.id,
            usageType: usageType as any,
            minAmount: tier.minAmount,
            maxAmount: tier.maxAmount,
            step: tier.step,
          },
        });
      }
    }
  }

  // 3. Setup DC Progressive Tiers (PRIVATE_BUSINESS only)
  console.log('📝 Creating DC Progressive Tiers...');
  const progressiveTiers = [
    { tierNumber: 1, tierRate: 0.067 },
    { tierNumber: 2, tierRate: 0.063 },
    { tierNumber: 3, tierRate: 0.058 },
    { tierNumber: 4, tierRate: 0.055 },
    { tierNumber: 5, tierRate: 0.05 },
  ];

  for (const company of [lloyd, amana]) {
    for (const tier of progressiveTiers) {
      await prisma.dcProgressiveTier.create({
        data: {
          companyId: company.id,
          usageType: 'PRIVATE_BUSINESS',
          tierNumber: tier.tierNumber,
          tierRate: tier.tierRate,
        },
      });
    }
  }

  // 4. Setup DC Config (per usage type)
  console.log('📝 Creating DC Configs...');
  for (const company of [lloyd, amana]) {
    // PRIVATE_BUSINESS config
    await prisma.dcConfig.create({
      data: {
        companyId: company.id,
        usageType: 'PRIVATE_BUSINESS',
        useMatrix: false,
        franchise: 0,
        minCapital: 1000,
        maxCapitalPercent: 50,
        maxCapitalAbsolute: 100000,
        basePremium: 10,
        discountPercent: 0, // 0% discount by default
      },
    });

    // COMMERCIAL config
    await prisma.dcConfig.create({
      data: {
        companyId: company.id,
        usageType: 'COMMERCIAL',
        useMatrix: false, // Will use legacy matrix from PricingRule
        franchise: 0,
        minCapital: 1000,
        maxCapitalPercent: 50,
        maxCapitalAbsolute: 100000,
        basePremium: 0, // No base premium for commercial matrix
        discountPercent: 0,
      },
    });
  }

  // 5. Setup DC Matrix for COMMERCIAL (migrate existing matrix data)
  console.log('📝 Creating DC Matrix for COMMERCIAL...');
  const dcGuarantee = await prisma.guarantee.findUnique({ where: { code: 'DOMMAGES_COLLISIONS' } });
  
  if (dcGuarantee) {
    // Get existing matrix rules for ONE company (they're the same for both)
    const existingRules = await prisma.pricingRule.findMany({
      where: {
        guaranteeId: dcGuarantee.id,
        usageType: 'COMMERCIAL',
        companyId: lloyd.id, // Just get from one company
      },
      orderBy: [{ minMarketValue: 'asc' }, { minCapital: 'asc' }],
    });

    // Group by VV ranges
    const vvRanges = new Map<string, any>();
    const capitals = new Set<number>();

    for (const rule of existingRules) {
      const key = `${rule.minMarketValue}-${rule.maxMarketValue}`;
      if (!vvRanges.has(key)) {
        vvRanges.set(key, {
          minVv: rule.minMarketValue,
          maxVv: rule.maxMarketValue,
          rules: [],
        });
      }
      vvRanges.get(key).rules.push(rule);
      if (rule.minCapital) capitals.add(Number(rule.minCapital));
    }

    // Create VV ranges and capitals for both companies
    for (const company of [lloyd, amana]) {
      const vvRangeMap = new Map<string, string>();
      const capitalMap = new Map<number, string>();

      // Create VV ranges
      for (const [key, data] of vvRanges) {
        const vvRange = await prisma.dcMatrixVvRange.create({
          data: {
            companyId: company.id,
            usageType: 'COMMERCIAL',
            minVv: data.minVv,
            maxVv: data.maxVv,
          },
        });
        vvRangeMap.set(key, vvRange.id);
      }

      // Create capitals
      const sortedCapitals = Array.from(capitals).sort((a, b) => a - b);
      for (let i = 0; i < sortedCapitals.length; i++) {
        const capital = await prisma.dcMatrixCapital.create({
          data: {
            companyId: company.id,
            usageType: 'COMMERCIAL',
            amount: sortedCapitals[i],
            order: i + 1,
          },
        });
        capitalMap.set(sortedCapitals[i], capital.id);
      }

      // Create matrix prices (deduplicate by vvRange + capital)
      const createdPairs = new Set<string>();
      for (const [key, data] of vvRanges) {
        const vvRangeId = vvRangeMap.get(key);
        if (!vvRangeId) continue;

        for (const rule of data.rules) {
          const capitalId = capitalMap.get(Number(rule.minCapital));
          if (!capitalId || !rule.fixedPremium) continue;

          const pairKey = `${vvRangeId}-${capitalId}`;
          if (createdPairs.has(pairKey)) continue; // Skip duplicates
          
          await prisma.dcMatrixPrice.create({
            data: {
              companyId: company.id,
              usageType: 'COMMERCIAL',
              vvRangeId,
              capitalId,
              prime: rule.fixedPremium,
            },
          });
          createdPairs.add(pairKey);
        }
      }
    }
  }

  console.log('✅ Migration completed!');
  console.log('📊 Summary:');
  console.log(`  - VOL & INCENDIE: Now use ratePercentage + fixedPremium`);
  console.log(`  - BG: Now use ratePercentage with reductionRate`);
  console.log(`  - DC Capital Tiers: ${dcTiers.length} tiers per company`);
  console.log(`  - DC Progressive Tiers: ${progressiveTiers.length} tiers per company`);
  console.log(`  - DC Matrix: Created for COMMERCIAL usage`);
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
