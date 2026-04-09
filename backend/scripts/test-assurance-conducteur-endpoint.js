const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEndpoint() {
  console.log('🧪 Testing Assurance Conducteur endpoint logic...\n');

  // Get all active companies
  const companies = await prisma.company.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true }
  });

  console.log(`📊 Found ${companies.length} active companies:\n`);

  for (const company of companies) {
    console.log(`\n🏢 Testing for: ${company.name} (${company.code})`);
    console.log(`   Company ID: ${company.id}`);

    // Simulate the backend endpoint logic
    const guarantee = await prisma.guarantee.findFirst({
      where: { systemRole: 'OPTIONAL_ASSURANCE_CONDUCTEUR', isActive: true },
    });

    if (!guarantee) {
      console.log('   ❌ Guarantee not found');
      continue;
    }

    console.log(`   ✅ Guarantee found: ${guarantee.nameFr} (${guarantee.code})`);

    const rules = await prisma.pricingRule.findMany({
      where: {
        companyId: company.id,
        guaranteeId: guarantee.id,
        isActive: true,
        minCapital: { not: null },
      },
      include: {
        company: { select: { id: true, name: true, code: true } },
        guarantee: { select: { id: true, code: true, nameFr: true } },
      },
      orderBy: { minCapital: 'asc' },
    });

    console.log(`   📋 Found ${rules.length} pricing rules:`);
    
    if (rules.length === 0) {
      console.log('   ⚠️  No pricing rules configured for this company!');
    } else {
      rules.forEach(rule => {
        console.log(`      - Capital: ${Number(rule.minCapital).toLocaleString('fr-FR')} DT`);
        console.log(`        Prime: ${Number(rule.fixedPremium || 0).toLocaleString('fr-FR')} DT`);
      });
    }
  }

  await prisma.$disconnect();
  console.log('\n✅ Test completed');
}

testEndpoint().catch(console.error);
