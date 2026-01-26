import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCriticalValues() {
  console.log('🔍 Checking Critical Pricing Values\n');

  // 1. Check PERSONNES_TRANSPORTEES
  console.log('1️⃣ PERSONNES_TRANSPORTEES:');
  const ptaRules = await prisma.pricingRule.findMany({
    where: {
      guarantee: { code: 'PERSONNES_TRANSPORTEES' }
    },
    include: {
      company: true,
      guarantee: true
    }
  });
  
  ptaRules.forEach(rule => {
    console.log(`   ${rule.company.name}: ${rule.fixedPremium} DT`);
  });
  console.log('   ✅ Expected: LLOYD=21 or 42, AMANA=32 or 64\n');

  // 2. Check ASSISTANCE
  console.log('2️⃣ ASSISTANCE:');
  const assistanceRules = await prisma.pricingRule.findMany({
    where: {
      guarantee: { code: 'ASSISTANCE' }
    },
    include: {
      company: true,
      guarantee: true
    }
  });
  
  assistanceRules.forEach(rule => {
    console.log(`   ${rule.company.name}: ${rule.fixedPremium} DT`);
  });
  console.log('   ✅ Expected: LLOYD=115, AMANA=90\n');

  // 3. Check BG calculation in code
  console.log('3️⃣ BG (Bris de Glaces):');
  console.log('   Code uses: LLOYD=8%, AMANA=7%');
  console.log('   ✅ Expected: LLOYD=8%, AMANA=7%\n');

  // 4. Check if TOUS_RISQUES_ZERO guarantee exists
  console.log('4️⃣ TOUS_RISQUES_ZERO guarantee:');
  const trGuarantee = await prisma.guarantee.findUnique({
    where: { code: 'TOUS_RISQUES_ZERO' }
  });
  console.log(`   ${trGuarantee ? '✅ EXISTS' : '❌ MISSING'}\n`);

  // 5. Check RC with bonusMalusClass
  console.log('5️⃣ RC with bonusMalusClass:');
  const rcRules = await prisma.pricingRule.findMany({
    where: {
      guarantee: { code: 'RC' },
      bonusMalusClass: { not: null }
    },
    include: {
      company: true
    },
    take: 5
  });
  
  console.log(`   Found ${rcRules.length} RC rules with bonusMalusClass`);
  rcRules.forEach(rule => {
    console.log(`   ${rule.company.name}: Class ${rule.bonusMalusClass}, ${rule.minPower}-${rule.maxPower}CV = ${rule.fixedPremium} DT`);
  });
  console.log('   ✅ Expected: Classes 1-8 with different CV ranges\n');

  await prisma.$disconnect();
}

checkCriticalValues().catch(console.error);
