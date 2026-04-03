import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkIncendieRules() {
  console.log('🔍 Checking INCENDIE guarantee and pricing rules...\n');

  // Find INCENDIE guarantee
  const guarantee = await prisma.guarantee.findFirst({
    where: { systemRole: 'MANDATORY_INCENDIE' }
  });

  if (!guarantee) {
    console.log('❌ INCENDIE guarantee not found with systemRole MANDATORY_INCENDIE');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ INCENDIE Guarantee found:');
  console.log(`   ID: ${guarantee.id}`);
  console.log(`   Code: ${guarantee.code}`);
  console.log(`   Name: ${guarantee.nameFr}`);
  console.log(`   System Role: ${guarantee.systemRole}`);
  console.log(`   Is Active: ${guarantee.isActive}\n`);

  // Find all pricing rules for INCENDIE
  const rules = await prisma.pricingRule.findMany({
    where: { guaranteeId: guarantee.id },
    include: {
      company: { select: { name: true } }
    },
    orderBy: [
      { companyId: 'asc' },
      { minMarketValue: 'asc' }
    ]
  });

  console.log(`📋 Found ${rules.length} pricing rule(s) for INCENDIE:\n`);

  if (rules.length === 0) {
    console.log('❌ NO PRICING RULES FOUND - This is why you get the error!');
    console.log('   You need to create pricing rules for INCENDIE in Admin → Pricing Rules\n');
  } else {
    rules.forEach((rule, index) => {
      console.log(`Rule ${index + 1}:`);
      console.log(`   Company: ${rule.company.name}`);
      console.log(`   Min Market Value: ${rule.minMarketValue || 'null'}`);
      console.log(`   Max Market Value: ${rule.maxMarketValue || 'null'}`);
      console.log(`   Rate: ${rule.ratePercentage || 'null'}`);
      console.log(`   Fixed Premium: ${rule.fixedPremium || 'null'}`);
      console.log(`   Is Active: ${rule.isActive}`);
      console.log(`   Convention: ${rule.conventionId || 'null'}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

checkIncendieRules().catch(console.error);
