const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkACCapitals() {
  console.log('🔍 VÉRIFICATION : Assurance Conducteur - Capitaux disponibles\n');
  console.log('='.repeat(80));

  // 1. Récupérer la garantie AC
  const acGuarantee = await prisma.guarantee.findFirst({
    where: { systemRole: 'OPTIONAL_ASSURANCE_CONDUCTEUR' },
  });

  if (!acGuarantee) {
    console.log('❌ Garantie ASSURANCE_CONDUCTEUR non trouvée !');
    return;
  }

  console.log(`\n✅ Garantie trouvée: ${acGuarantee.nameFr} (${acGuarantee.code})`);
  console.log(`ID: ${acGuarantee.id}`);

  // 2. Récupérer toutes les compagnies actives
  const companies = await prisma.company.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  console.log(`\n📊 Compagnies actives: ${companies.length}`);

  // 3. Pour chaque compagnie, vérifier les règles AC
  for (const company of companies) {
    console.log('\n' + '='.repeat(80));
    console.log(`\n🏢 COMPAGNIE: ${company.name}`);
    console.log(`ID: ${company.id}`);

    const rules = await prisma.pricingRule.findMany({
      where: {
        companyId: company.id,
        guaranteeId: acGuarantee.id,
        isActive: true,
      },
      orderBy: { minCapital: 'asc' },
    });

    console.log(`\n📋 Règles AC trouvées: ${rules.length}`);

    if (rules.length === 0) {
      console.log('⚠️  Aucune règle configurée pour cette compagnie');
      continue;
    }

    console.log('\n💰 CAPITAUX DISPONIBLES:\n');
    rules.forEach((rule, index) => {
      console.log(`${index + 1}. Capital: ${rule.minCapital} DT`);
      console.log(`   Prime: ${rule.fixedPremium} DT`);
      console.log(`   Formule: ${rule.formulaType || 'Toutes'}`);
      console.log(`   Convention: ${rule.conventionId || 'Aucune'}`);
      console.log(`   Active: ${rule.isActive ? 'OUI' : 'NON'}`);
      console.log('');
    });

    // Vérifier s'il y a plusieurs capitaux
    const uniqueCapitals = [...new Set(rules.map(r => r.minCapital?.toString()))];
    console.log(`📊 RÉSUMÉ:`);
    console.log(`   Nombre de capitaux différents: ${uniqueCapitals.length}`);
    console.log(`   Capitaux: ${uniqueCapitals.join(', ')} DT`);

    if (uniqueCapitals.length === 1) {
      console.log(`   ⚠️  UN SEUL CAPITAL DISPONIBLE - Pas de choix pour l'utilisateur !`);
    } else {
      console.log(`   ✅ PLUSIEURS CAPITAUX - L'utilisateur peut choisir`);
    }
  }

  // 4. Vérification globale
  console.log('\n' + '='.repeat(80));
  console.log('\n🎯 DIAGNOSTIC GLOBAL:\n');

  for (const company of companies) {
    const rules = await prisma.pricingRule.findMany({
      where: {
        companyId: company.id,
        guaranteeId: acGuarantee.id,
        isActive: true,
      },
    });

    const uniqueCapitals = [...new Set(rules.map(r => r.minCapital?.toString()))];
    
    const status = uniqueCapitals.length > 1 ? '✅' : '⚠️';
    console.log(`${status} ${company.name}: ${uniqueCapitals.length} capital(aux) - [${uniqueCapitals.join(', ')} DT]`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📝 CONCLUSION:\n');
  console.log('Si une compagnie a UN SEUL capital configuré,');
  console.log('l\'utilisateur ne peut PAS choisir entre plusieurs capitaux.');
  console.log('\nPour corriger : Ajouter plusieurs règles AC avec des capitaux différents.');
  console.log('Exemple : 5000 DT, 10000 DT, 15000 DT, etc.\n');
}

checkACCapitals()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
