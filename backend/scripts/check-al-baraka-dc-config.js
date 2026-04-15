const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAlBarakaDcConfig() {
  try {
    // Find AL BARAKA company
    const alBaraka = await prisma.company.findFirst({
      where: {
        OR: [
          { name: { contains: 'AL BARAKA', mode: 'insensitive' } },
          { name: { contains: 'BARAKA', mode: 'insensitive' } },
        ],
      },
    });

    if (!alBaraka) {
      console.log('❌ AL BARAKA company not found');
      return;
    }

    console.log('✅ AL BARAKA Company:', alBaraka.name, '(ID:', alBaraka.id, ')');
    console.log('');

    // Get all usage types
    const usages = await prisma.usage.findMany({
      where: { isActive: true },
    });

    console.log('📋 Usage Types:', usages.length);
    console.log('');

    for (const usage of usages) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`📦 Usage: ${usage.nameFr} (${usage.code})`);
      console.log('═══════════════════════════════════════════════════════════');

      // Get DC Config
      const dcConfig = await prisma.dcConfig.findFirst({
        where: {
          companyId: alBaraka.id,
          usageId: usage.id,
          isActive: true,
        },
      });

      if (!dcConfig) {
        console.log('  ⚠️  No DC Config found for this usage');
        console.log('');
        continue;
      }

      console.log('  🔧 DC Config:');
      console.log('    - Method:', dcConfig.useMatrix ? 'MATRIX' : 'PROGRESSIVE');
      console.log('    - Min Capital:', dcConfig.minCapital.toString(), 'DT');
      console.log('    - Max Capital %:', dcConfig.maxCapitalPercent.toString(), '%');
      console.log('    - Max Capital Absolute:', dcConfig.maxCapitalAbsolute.toString(), 'DT');
      console.log('    - Base Premium:', dcConfig.basePremium.toString(), 'DT');
      console.log('    - Discount %:', dcConfig.discountPercent.toString(), '%');
      console.log('    - Reference Value:', dcConfig.referenceValue);
      console.log('    - Franchise:', dcConfig.franchise.toString(), '%');
      console.log('');

      if (dcConfig.useMatrix) {
        // MATRIX METHOD
        console.log('  📊 MATRIX METHOD - VV Ranges:');
        const vvRanges = await prisma.dcMatrixVvRange.findMany({
          where: {
            companyId: alBaraka.id,
            usageId: usage.id,
            isActive: true,
          },
          orderBy: { minVv: 'asc' },
        });

        for (const range of vvRanges) {
          console.log(`    - Range: ${range.minVv} - ${range.maxVv || 'unlimited'} DT (Reduction: ${range.reductionRate || 0}%)`);
        }
        console.log('');

        console.log('  💰 MATRIX METHOD - Available Capitals:');
        const capitals = await prisma.dcMatrixCapital.findMany({
          where: {
            companyId: alBaraka.id,
            usageId: usage.id,
            isActive: true,
          },
          orderBy: { order: 'asc' },
        });

        for (const capital of capitals) {
          console.log(`    - ${capital.amount.toString()} DT (Order: ${capital.order})`);
        }
        console.log('');

        // Show sample prices for first VV range
        if (vvRanges.length > 0 && capitals.length > 0) {
          console.log('  💵 Sample Prices (First VV Range):');
          const firstRange = vvRanges[0];
          for (const capital of capitals) {
            const price = await prisma.dcMatrixPrice.findUnique({
              where: {
                vvRangeId_capitalId: {
                  vvRangeId: firstRange.id,
                  capitalId: capital.id,
                },
              },
            });
            if (price) {
              console.log(`    - Capital ${capital.amount} DT → Prime: ${price.prime} DT`);
            }
          }
        }
      } else {
        // PROGRESSIVE METHOD
        console.log('  📊 PROGRESSIVE METHOD - Capital Tiers:');
        const tiers = await prisma.dcCapitalTier.findMany({
          where: {
            companyId: alBaraka.id,
            usageId: usage.id,
            isActive: true,
          },
          orderBy: { minAmount: 'asc' },
        });

        if (tiers.length === 0) {
          console.log('    ⚠️  No capital tiers configured');
        } else {
          for (const tier of tiers) {
            console.log(`    - Tier: ${tier.minAmount} - ${tier.maxAmount || 'unlimited'} DT (Step: ${tier.step} DT)`);
          }
        }
        console.log('');

        console.log('  📈 PROGRESSIVE METHOD - Progressive Tiers:');
        const progressiveTiers = await prisma.dcProgressiveTier.findMany({
          where: {
            companyId: alBaraka.id,
            usageId: usage.id,
            isActive: true,
          },
          orderBy: { tierNumber: 'asc' },
        });

        if (progressiveTiers.length === 0) {
          console.log('    ⚠️  No progressive tiers configured');
        } else {
          for (const tier of progressiveTiers) {
            console.log(`    - Tier ${tier.tierNumber}: Rate = ${tier.tierRate}`);
          }
        }
      }

      console.log('');
    }

    console.log('✅ Check complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAlBarakaDcConfig();
