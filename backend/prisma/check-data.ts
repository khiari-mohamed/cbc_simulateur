import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('Checking guarantees...');
  const guarantees = await prisma.guarantee.findMany();
  console.log('Guarantees:', guarantees.map(g => g.code));

  console.log('\nChecking pricing rules...');
  const rules = await prisma.pricingRule.findMany({
    include: { guarantee: true, company: true },
  });
  console.log('Total rules:', rules.length);
  
  const casCodes = ['CAS', 'ASSISTANCE', 'INCENDIE_EMEUTES', 'DOMMAGES_EMEUTES', 'CATASTROPHES_NATURELLES'];
  for (const code of casCodes) {
    const filtered = rules.filter(r => r.guarantee.code === code);
    console.log(`${code}: ${filtered.length} rules`);
    filtered.forEach(r => console.log(`  - ${r.company.name}: ${r.fixedPremium}`));
  }
}

checkData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
