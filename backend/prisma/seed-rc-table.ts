import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function seedRCTable() {
  console.log('🔄 Seeding RC pricing table...');

  // Get companies
  const lloyd = await prisma.company.findUnique({ where: { code: 'LLOYD' } });
  const amana = await prisma.company.findUnique({ where: { code: 'AMANA' } });

  if (!lloyd || !amana) {
    console.error('❌ Companies not found. Please seed companies first.');
    return;
  }

  // Get RC guarantee
  const rcGuarantee = await prisma.guarantee.findUnique({ where: { code: 'RC' } });
  if (!rcGuarantee) {
    console.error('❌ RC guarantee not found. Please seed guarantees first.');
    return;
  }

  // RC Table from Excel (Page 4)
  // CLASSE | 3-4 CV | 5-6 CV | 7-10 CV | 11-14 CV | >=15 CV
  const rcTable = [
    { classe: 1, cv3_4: 77, cv5_6: 98, cv7_10: 119, cv11_14: 154, cv15plus: 184.8 },
    { classe: 2, cv3_4: 88, cv5_6: 112, cv7_10: 136, cv11_14: 176, cv15plus: 211.2 },
    { classe: 3, cv3_4: 99, cv5_6: 126, cv7_10: 153, cv11_14: 198, cv15plus: 237.6 },
    { classe: 4, cv3_4: 110, cv5_6: 140, cv7_10: 170, cv11_14: 220, cv15plus: 264 },
    { classe: 5, cv3_4: 132, cv5_6: 168, cv7_10: 204, cv11_14: 264, cv15plus: 316.8 },
    { classe: 6, cv3_4: 154, cv5_6: 196, cv7_10: 238, cv11_14: 308, cv15plus: 369.6 },
    { classe: 7, cv3_4: 176, cv5_6: 224, cv7_10: 272, cv11_14: 352, cv15plus: 422.4 },
    { classe: 8, cv3_4: 220, cv5_6: 280, cv7_10: 340, cv11_14: 440, cv15plus: 528 },
  ];

  // CV ranges mapping
  const cvRanges = [
    { minPower: 3, maxPower: 4, key: 'cv3_4' },
    { minPower: 5, maxPower: 6, key: 'cv5_6' },
    { minPower: 7, maxPower: 10, key: 'cv7_10' },
    { minPower: 11, maxPower: 14, key: 'cv11_14' },
    { minPower: 15, maxPower: 999, key: 'cv15plus' },
  ];

  let count = 0;

  // Create pricing rules for both companies
  for (const company of [lloyd, amana]) {
    for (const row of rcTable) {
      for (const cvRange of cvRanges) {
        // Check if rule already exists
        const existing = await prisma.pricingRule.findFirst({
          where: {
            companyId: company.id,
            guaranteeId: rcGuarantee.id,
            minPower: cvRange.minPower,
            maxPower: cvRange.maxPower,
          },
        });

        if (existing) {
          // Update existing
          await prisma.pricingRule.update({
            where: { id: existing.id },
            data: {
              fixedPremium: new Decimal(row[cvRange.key as keyof typeof row]),
              isActive: true,
            },
          });
        } else {
          // Create new
          await prisma.pricingRule.create({
            data: {
              companyId: company.id,
              guaranteeId: rcGuarantee.id,
              minPower: cvRange.minPower,
              maxPower: cvRange.maxPower,
              fixedPremium: new Decimal(row[cvRange.key as keyof typeof row]),
              isActive: true,
            },
          });
        }
        count++;
      }
    }
  }

  console.log(`✅ RC table seeded: ${count} pricing rules created/updated`);
}

async function seedTousRisquesFranchises() {
  console.log('🔄 Seeding Tous Risques franchise rates...');

  // Get companies
  const lloyd = await prisma.company.findUnique({ where: { code: 'LLOYD' } });
  const amana = await prisma.company.findUnique({ where: { code: 'AMANA' } });

  if (!lloyd || !amana) {
    console.error('❌ Companies not found.');
    return;
  }

  // Get TOUS_RISQUES_ZERO guarantee
  const trGuarantee = await prisma.guarantee.findUnique({ where: { code: 'TOUS_RISQUES_ZERO' } });
  if (!trGuarantee) {
    console.error('❌ TOUS_RISQUES_ZERO guarantee not found.');
    return;
  }

  // Tous Risques franchise rates from Excel (Page 4)
  // Franchise | Rate | Fixed
  const franchiseRates = [
    { franchise: 0, rate: 0.032, fixed: 22 },
    { franchise: 1, rate: 0.0265, fixed: 21.75 },
    { franchise: 2, rate: 0.021, fixed: 19 },
    { franchise: 4, rate: 0.017, fixed: 15 },
  ];

  let count = 0;

  // Create pricing rules for both companies
  for (const company of [lloyd, amana]) {
    for (const fr of franchiseRates) {
      // Check if rule already exists
      const existing = await prisma.pricingRule.findFirst({
        where: {
          companyId: company.id,
          guaranteeId: trGuarantee.id,
          formulaType: 'TOUS_RISQUES_0',
        },
      });

      if (existing && fr.franchise === 0) {
        // Update existing 0% franchise rule
        await prisma.pricingRule.update({
          where: { id: existing.id },
          data: {
            baseRate: new Decimal(fr.rate),
            fixedPremium: new Decimal(fr.fixed),
            isActive: true,
          },
        });
        count++;
      } else if (fr.franchise === 0) {
        // Create new 0% franchise rule
        await prisma.pricingRule.create({
          data: {
            companyId: company.id,
            guaranteeId: trGuarantee.id,
            formulaType: 'TOUS_RISQUES_0',
            baseRate: new Decimal(fr.rate),
            fixedPremium: new Decimal(fr.fixed),
            isActive: true,
          },
        });
        count++;
      }
      // Note: Other franchise rates (1%, 2%, 4%) would need additional schema support
      // Currently only 0% is implemented in the system
    }
  }

  console.log(`✅ Tous Risques franchise rates seeded: ${count} pricing rules created/updated`);
}

async function main() {
  try {
    await seedRCTable();
    await seedTousRisquesFranchises();
    console.log('✅ All pricing data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding pricing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
