import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQuoteGeneration() {
  console.log('🧪 Testing Quote Generation with Client Values...\n');

  // Client test data from document
  const testData = {
    valeurANeuf: 100000,
    valeurVenale: 100000,
    cv: 5,
    classeBM: 4,
    usage: 'PRIVATE_BUSINESS',
    formulaType: 'TOUS_RISQUES_0',
  };

  console.log('Test Data:', testData);
  console.log('\n📊 Checking Database...\n');

  // Check companies
  const companies = await prisma.company.findMany();
  console.log('Companies:', companies.map(c => c.name));

  // Check RC rules for CV=5, Classe=4
  const rcGuarantee = await prisma.guarantee.findUnique({ where: { code: 'RC' } });
  if (rcGuarantee) {
    const rcRules = await prisma.pricingRule.findMany({
      where: {
        guaranteeId: rcGuarantee.id,
        minPower: { lte: testData.cv },
        maxPower: { gte: testData.cv },
        bonusMalusClass: testData.classeBM,
      },
      include: { company: true },
    });
    console.log('\nRC Rules for CV=5, Classe BM=4:');
    rcRules.forEach(r => {
      console.log(`  ${r.company.name}: ${r.fixedPremium} DT (CV ${r.minPower}-${r.maxPower}, Classe ${r.bonusMalusClass})`);
    });
  }

  // Check CAS rules
  const casGuarantee = await prisma.guarantee.findUnique({ where: { code: 'CAS' } });
  if (casGuarantee) {
    const casRules = await prisma.pricingRule.findMany({
      where: { guaranteeId: casGuarantee.id },
      include: { company: true },
    });
    console.log('\nCAS Rules:');
    if (casRules.length === 0) {
      console.log('  ❌ No CAS rules found');
    } else {
      casRules.forEach(r => {
        console.log(`  ${r.company.name}: ${r.fixedPremium} DT`);
      });
    }
  }

  // Check ASSISTANCE rules
  const assistanceGuarantee = await prisma.guarantee.findUnique({ where: { code: 'ASSISTANCE' } });
  if (assistanceGuarantee) {
    const assistanceRules = await prisma.pricingRule.findMany({
      where: { guaranteeId: assistanceGuarantee.id },
      include: { company: true },
    });
    console.log('\nASSISTANCE Rules:');
    if (assistanceRules.length === 0) {
      console.log('  ❌ No ASSISTANCE rules found');
    } else {
      assistanceRules.forEach(r => {
        console.log(`  ${r.company.name}: ${r.fixedPremium} DT`);
      });
    }
  }

  console.log('\n✅ Database check complete\n');
  console.log('Expected Results (from client doc):');
  console.log('  LLOYD:');
  console.log('    RC: 140 DT (Classe 4, 5CV)');
  console.log('    CAS: 45 DT');
  console.log('    ASSISTANCE: 115 DT');
  console.log('    FRAIS: 30 DT');
  console.log('  AMANA:');
  console.log('    RC: 140 DT (Classe 4, 5CV)');
  console.log('    CAS: 20 DT');
  console.log('    ASSISTANCE: 90 DT');
  console.log('    FRAIS: 20 DT');
}

testQuoteGeneration()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
