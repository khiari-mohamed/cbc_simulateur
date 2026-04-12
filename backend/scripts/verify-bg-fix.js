const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyBGFix() {
  console.log('🔍 VÉRIFICATION DU FIX BG\n');
  console.log('='.repeat(80));

  // 1. Vérifier la config BG
  const bgGuarantee = await prisma.guarantee.findFirst({
    where: { systemRole: 'OPTIONAL_BRIS_GLACES' },
  });

  const lloydCompany = await prisma.company.findFirst({
    where: { name: 'LLOYD Assurances' },
  });

  const albarakaCompany = await prisma.company.findFirst({
    where: { name: 'AL BARAKA' },
  });

  console.log('\n📋 VÉRIFICATION DE LA CONFIG BG:\n');

  const bgConfigLloyd = await prisma.guaranteeAvailability.findFirst({
    where: {
      companyId: lloydCompany.id,
      guaranteeId: bgGuarantee.id,
      formulaType: 'TOUS_RISQUES_0',
    },
  });

  const bgConfigAlbaraka = await prisma.guaranteeAvailability.findFirst({
    where: {
      companyId: albarakaCompany.id,
      guaranteeId: bgGuarantee.id,
      formulaType: 'TOUS_RISQUES_0',
    },
  });

  console.log('LLOYD Assurances:');
  if (bgConfigLloyd) {
    console.log(`  Status: ${bgConfigLloyd.status}`);
    if (bgConfigLloyd.status === 'DEFAULT') {
      console.log('  ✅ CORRECT - BG sera calculé normalement');
    } else if (bgConfigLloyd.status === 'GRATUIT') {
      console.log('  ❌ INCORRECT - BG sera gratuit (prime = 0)');
    }
  } else {
    console.log('  ℹ️  Aucune config (DEFAULT par défaut)');
  }

  console.log('\nAL BARAKA:');
  if (bgConfigAlbaraka) {
    console.log(`  Status: ${bgConfigAlbaraka.status}`);
    if (bgConfigAlbaraka.status === 'DEFAULT') {
      console.log('  ✅ CORRECT - BG sera calculé normalement');
    } else if (bgConfigAlbaraka.status === 'GRATUIT') {
      console.log('  ❌ INCORRECT - BG sera gratuit (prime = 0)');
    }
  } else {
    console.log('  ℹ️  Aucune config (DEFAULT par défaut)');
  }

  // 2. Vérifier les règles de pricing BG
  console.log('\n' + '='.repeat(80));
  console.log('\n📋 RÈGLES DE PRICING BG:\n');

  const bgRuleLloyd = await prisma.pricingRule.findFirst({
    where: {
      companyId: lloydCompany.id,
      guaranteeId: bgGuarantee.id,
      isActive: true,
    },
  });

  const bgRuleAlbaraka = await prisma.pricingRule.findFirst({
    where: {
      companyId: albarakaCompany.id,
      guaranteeId: bgGuarantee.id,
      isActive: true,
    },
  });

  console.log('LLOYD Assurances:');
  if (bgRuleLloyd) {
    console.log(`  Taux: ${bgRuleLloyd.ratePercentage} (${parseFloat(bgRuleLloyd.ratePercentage) * 100}%)`);
    console.log(`  Formule: capital × ${bgRuleLloyd.ratePercentage}`);
  }

  console.log('\nAL BARAKA:');
  if (bgRuleAlbaraka) {
    console.log(`  Taux: ${bgRuleAlbaraka.ratePercentage} (${parseFloat(bgRuleAlbaraka.ratePercentage) * 100}%)`);
    console.log(`  Formule: capital × ${bgRuleAlbaraka.ratePercentage}`);
  }

  // 3. Calculer ce que devrait être BG pour le devis test
  console.log('\n' + '='.repeat(80));
  console.log('\n💰 CALCUL ATTENDU POUR BG:\n');

  const capitalBG = 2000; // Capital du devis test

  console.log(`Capital BG: ${capitalBG} DT\n`);

  console.log('LLOYD Assurances:');
  if (bgRuleLloyd) {
    const primeLloyd = capitalBG * parseFloat(bgRuleLloyd.ratePercentage);
    console.log(`  ${capitalBG} × ${bgRuleLloyd.ratePercentage} = ${primeLloyd} DT`);
    
    if (bgConfigLloyd?.status === 'DEFAULT' || !bgConfigLloyd) {
      console.log(`  ✅ Avec le fix: BG = ${primeLloyd} DT`);
    } else if (bgConfigLloyd?.status === 'GRATUIT') {
      console.log(`  ❌ Sans le fix: BG = 0 DT`);
    }
  }

  console.log('\nAL BARAKA:');
  if (bgRuleAlbaraka) {
    const primeAlbaraka = capitalBG * parseFloat(bgRuleAlbaraka.ratePercentage);
    console.log(`  ${capitalBG} × ${bgRuleAlbaraka.ratePercentage} = ${primeAlbaraka} DT`);
    
    if (bgConfigAlbaraka?.status === 'DEFAULT' || !bgConfigAlbaraka) {
      console.log(`  ✅ Avec le fix: BG = ${primeAlbaraka} DT`);
    } else if (bgConfigAlbaraka?.status === 'GRATUIT') {
      console.log(`  ❌ Sans le fix: BG = 0 DT`);
    }
  }

  // 4. Vérifier un ancien devis
  console.log('\n' + '='.repeat(80));
  console.log('\n📋 ANCIEN DEVIS (avant fix):\n');

  const oldQuote = await prisma.quote.findFirst({
    where: { quoteNumber: 'Q20261775812913778843' },
    include: {
      items: {
        include: {
          guarantee: true,
        },
      },
      company: true,
    },
  });

  const oldBG = oldQuote.items.find(i => i.guarantee.code === 'BG');
  console.log(`Devis: ${oldQuote.quoteNumber}`);
  console.log(`Compagnie: ${oldQuote.company.name}`);
  console.log(`BG Prime: ${oldBG.prime} DT`);
  console.log(`BG Capital: ${oldBG.capital} DT`);

  const expectedPrime = parseFloat(oldBG.capital) * parseFloat(bgRuleLloyd.ratePercentage);
  console.log(`\nPrime attendue: ${expectedPrime} DT`);
  console.log(`Prime actuelle: ${oldBG.prime} DT`);

  if (parseFloat(oldBG.prime) === 0) {
    console.log(`❌ BG est à 0 DT (ancien devis créé avec config GRATUIT)`);
  }

  // 5. Conclusion
  console.log('\n' + '='.repeat(80));
  console.log('\n🎯 CONCLUSION:\n');

  const fixApplied = (bgConfigLloyd?.status === 'DEFAULT' || !bgConfigLloyd) && 
                     (bgConfigAlbaraka?.status === 'DEFAULT' || !bgConfigAlbaraka);

  if (fixApplied) {
    console.log('✅ LE FIX EST APPLIQUÉ !');
    console.log('Les nouveaux devis auront BG calculé correctement.');
    console.log('\n📝 Prochaine étape:');
    console.log('Créer un nouveau devis pour confirmer que BG est bien calculé.');
    console.log('Vous pouvez le faire via l\'interface web ou l\'API.');
  } else {
    console.log('❌ LE FIX N\'EST PAS APPLIQUÉ !');
    console.log('Relancez: node fix-bg-config.js --confirm');
  }

  console.log('\n' + '='.repeat(80));
}

verifyBGFix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
