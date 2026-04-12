/**
 * DEBUG SCRIPT - Tracer la génération de devis pour INCENDIE_EMEUTES
 * À exécuter sur PROD
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('🔍 DEBUG: Génération de devis pour INCENDIE_EMEUTES\n');
  console.log('='.repeat(80));

  // Prendre la simulation la plus récente avec INCENDIE_EMEUTES
  const simulation = await prisma.simulation.findFirst({
    where: {
      guarantees: {
        some: {
          guarantee: { code: 'INCENDIE_EMEUTES' },
          isSelected: true
        }
      }
    },
    include: {
      guarantees: {
        include: { guarantee: true }
      },
      vehicle: true
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!simulation) {
    console.log('❌ Aucune simulation trouvée');
    return;
  }

  console.log('📋 SIMULATION:', simulation.id);
  console.log('Formule:', simulation.formulaType);
  console.log('Usage:', simulation.usageId);
  console.log('\n✅ GARANTIES DANS LA SIMULATION:\n');

  simulation.guarantees.forEach((sg, i) => {
    const icon = sg.isSelected ? '✅' : '❌';
    const optional = sg.guarantee.isOptional ? '(Optionnelle)' : '(Obligatoire)';
    console.log(`${icon} ${sg.guarantee.code.padEnd(30)} ${optional.padEnd(15)} isSelected: ${sg.isSelected}`);
  });

  // Simuler la logique de quotes.service.ts
  console.log('\n' + '='.repeat(80));
  console.log('\n🔧 SIMULATION DE LA LOGIQUE quotes.service.ts:\n');

  // Étape 1: Toutes les garanties actives
  const allGuarantees = await prisma.guarantee.findMany({
    where: { isActive: true }
  });

  console.log('1️⃣ Toutes les garanties actives:', allGuarantees.length);

  // Étape 2: Garanties obligatoires
  const mandatoryGuarantees = allGuarantees.filter(g => !g.isOptional).map(g => g.code);
  console.log('2️⃣ Garanties obligatoires:', mandatoryGuarantees.length);
  console.log('   ', mandatoryGuarantees.join(', '));

  // Étape 3: Garanties optionnelles sélectionnées (LIGNE PROBLÉMATIQUE)
  console.log('\n3️⃣ Garanties optionnelles sélectionnées:');
  
  // VERSION ACTUELLE (BUGGUÉE ?)
  const selectedOptionalGuarantees_CURRENT = simulation.guarantees
    .filter(sg => sg.guarantee.isOptional)
    .map(sg => sg.guarantee.code);
  
  console.log('   VERSION ACTUELLE (sans filtre isSelected):');
  console.log('   ', selectedOptionalGuarantees_CURRENT.join(', '));

  // VERSION CORRECTE
  const selectedOptionalGuarantees_CORRECT = simulation.guarantees
    .filter(sg => sg.guarantee.isOptional && sg.isSelected)
    .map(sg => sg.guarantee.code);
  
  console.log('\n   VERSION CORRECTE (avec filtre isSelected):');
  console.log('   ', selectedOptionalGuarantees_CORRECT.join(', '));

  // Étape 4: Combiner
  const allSelectedGuarantees_CURRENT = [...new Set([...mandatoryGuarantees, ...selectedOptionalGuarantees_CURRENT])];
  const allSelectedGuarantees_CORRECT = [...new Set([...mandatoryGuarantees, ...selectedOptionalGuarantees_CORRECT])];

  console.log('\n4️⃣ RÉSULTAT FINAL:');
  console.log('\n   VERSION ACTUELLE (BUGGUÉE):');
  console.log('   ', allSelectedGuarantees_CURRENT.join(', '));
  console.log('   INCENDIE_EMEUTES incluse:', allSelectedGuarantees_CURRENT.includes('INCENDIE_EMEUTES') ? '✅' : '❌');

  console.log('\n   VERSION CORRECTE:');
  console.log('   ', allSelectedGuarantees_CORRECT.join(', '));
  console.log('   INCENDIE_EMEUTES incluse:', allSelectedGuarantees_CORRECT.includes('INCENDIE_EMEUTES') ? '✅' : '❌');

  console.log('\n' + '='.repeat(80));
  console.log('\n🎯 DIAGNOSTIC:\n');

  if (allSelectedGuarantees_CURRENT.includes('INCENDIE_EMEUTES')) {
    console.log('✅ Le code actuel DEVRAIT inclure INCENDIE_EMEUTES');
    console.log('   → Le bug est ailleurs (pricing-engine ou availability)');
  } else {
    console.log('❌ Le code actuel N\'INCLUT PAS INCENDIE_EMEUTES');
    console.log('   → BUG TROUVÉ: Ligne 57-59 de quotes.service.ts');
    console.log('   → Il manque le filtre .filter(sg => sg.isSelected)');
  }

  console.log('\n' + '='.repeat(80));

})().catch(e => console.error(e)).finally(() => prisma.$disconnect());
