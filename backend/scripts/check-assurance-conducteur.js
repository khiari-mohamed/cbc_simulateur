const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAssuranceConducteur() {
  console.log('🔍 Checking Assurance Conducteur data...\n');

  // 1. Check if guarantee exists
  console.log('1️⃣ Checking Guarantee:');
  const guarantee = await prisma.guarantee.findFirst({
    where: { systemRole: 'OPTIONAL_ASSURANCE_CONDUCTEUR' }
  });
  
  if (!guarantee) {
    console.log('❌ Guarantee OPTIONAL_ASSURANCE_CONDUCTEUR not found!\n');
    return;
  }
  
  console.log(`✅ Guarantee found: ${guarantee.nameFr} (ID: ${guarantee.id})`);
  console.log(`   Active: ${guarantee.isActive}\n`);

  // 2. Check pricing rules for this guarantee
  console.log('2️⃣ Checking Pricing Rules:');
  const pricingRules = await prisma.pricingRule.findMany({
    where: { 
      guaranteeId: guarantee.id,
      isActive: true
    },
    include: {
      company: { select: { name: true } }
    },
    orderBy: [
      { companyId: 'asc' },
      { minCapital: 'asc' }
    ]
  });

  if (pricingRules.length === 0) {
    console.log('❌ No pricing rules found for Assurance Conducteur!\n');
  } else {
    console.log(`✅ Found ${pricingRules.length} pricing rules:\n`);
    
    const groupedByCompany = {};
    pricingRules.forEach(rule => {
      const companyName = rule.company.name;
      if (!groupedByCompany[companyName]) {
        groupedByCompany[companyName] = [];
      }
      groupedByCompany[companyName].push({
        minCapital: rule.minCapital?.toString() || 'N/A',
        maxCapital: rule.maxCapital?.toString() || 'N/A',
        fixedPremium: rule.fixedPremium?.toString() || 'N/A'
      });
    });

    Object.keys(groupedByCompany).forEach(companyName => {
      console.log(`   📊 ${companyName}:`);
      groupedByCompany[companyName].forEach(rule => {
        console.log(`      Capital: ${rule.minCapital} DT → Prime: ${rule.fixedPremium} DT`);
      });
      console.log('');
    });
  }

  // 3. Check if there's an API endpoint to get capitals
  console.log('3️⃣ Checking available capital options:');
  const uniqueCapitals = [...new Set(pricingRules
    .filter(r => r.minCapital)
    .map(r => r.minCapital.toString())
  )].sort((a, b) => parseFloat(a) - parseFloat(b));

  if (uniqueCapitals.length === 0) {
    console.log('❌ No capital options available!\n');
  } else {
    console.log(`✅ Available capitals: ${uniqueCapitals.join(', ')} DT\n`);
  }

  // 4. Summary
  console.log('📋 Summary:');
  console.log(`   Guarantee exists: ${guarantee ? '✅' : '❌'}`);
  console.log(`   Pricing rules: ${pricingRules.length > 0 ? '✅' : '❌'} (${pricingRules.length} rules)`);
  console.log(`   Capital options: ${uniqueCapitals.length > 0 ? '✅' : '❌'} (${uniqueCapitals.length} options)`);
  
  if (pricingRules.length === 0) {
    console.log('\n⚠️  PROBLEM: No pricing rules configured for Assurance Conducteur!');
    console.log('   The dropdown will be empty because there are no capital options.');
    console.log('   You need to add pricing rules in the admin panel.');
  }
}

checkAssuranceConducteur()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
