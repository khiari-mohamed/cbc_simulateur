import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:<PASSWORD>@<HOST>:5432/cbc_ars?schema=public"
    }
  }
});

async function checkIncendieRules() {
  console.log('🔍 Checking INCENDIE guarantee and pricing rules on PRODUCTION...\n');

  // Find INCENDIE guarantee
  const guarantee = await prisma.guarantee.findFirst({
    where: { systemRole: 'MANDATORY_INCENDIE' }
  });

  if (!guarantee) {
    console.log('❌ INCENDIE guarantee not found with systemRole MANDATORY_INCENDIE');
    console.log('   Run: npx ts-node assign-system-roles-prod.ts\n');
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
    console.log('❌ NO PRICING RULES FOUND - This is why quotes fail!');
    console.log('   You need to create pricing rules for INCENDIE manually:\n');
    console.log('   1. Go to Admin → Pricing Rules');
    console.log('   2. Click "Nouvelle règle"');
    console.log('   3. Select Company (Lloyd or Amana)');
    console.log('   4. Select Guarantee: INCENDIE');
    console.log('   5. Set Rate: 0.00275 (0.275%)');
    console.log('   6. Set Fixed Premium: 30 DT');
    console.log('   7. Leave Min/Max Market Value empty (applies to all)');
    console.log('   8. Click "Créer"');
    console.log('   9. Repeat for other company\n');
  } else {
    rules.forEach((rule, index) => {
      console.log(`Rule ${index + 1}:`);
      console.log(`   Company: ${rule.company.name}`);
      console.log(`   Min Market Value: ${rule.minMarketValue || 'null (all values)'}`);
      console.log(`   Max Market Value: ${rule.maxMarketValue || 'null (all values)'}`);
      console.log(`   Rate: ${rule.ratePercentage || 'null'}`);
      console.log(`   Fixed Premium: ${rule.fixedPremium || 'null'}`);
      console.log(`   Is Active: ${rule.isActive}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

checkIncendieRules().catch(console.error);
