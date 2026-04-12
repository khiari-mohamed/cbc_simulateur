const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

async function testBGFix() {
  console.log('🧪 TEST DU FIX BG\n');
  console.log('='.repeat(80));

  // 1. Récupérer un ancien devis (avant fix)
  const oldQuote = await prisma.quote.findFirst({
    where: { quoteNumber: 'Q20261775812913778843' },
    include: {
      simulation: {
        include: {
          vehicle: true,
          convention: true,
          user: true,
        },
      },
      items: {
        include: {
          guarantee: true,
        },
      },
      company: true,
    },
  });

  console.log('\n📋 ANCIEN DEVIS (avant fix):');
  console.log(`Numéro: ${oldQuote.quoteNumber}`);
  console.log(`Compagnie: ${oldQuote.company.name}`);
  console.log(`Date: ${oldQuote.createdAt}`);

  const oldBG = oldQuote.items.find(i => i.guarantee.code === 'BG');
  console.log(`\n💰 BG (avant fix):`);
  console.log(`Prime: ${oldBG.prime} DT`);
  console.log(`Capital: ${oldBG.capital} DT`);

  // 2. Créer une nouvelle simulation avec les mêmes paramètres
  console.log('\n' + '='.repeat(80));
  console.log('\n🔄 Création d\'une NOUVELLE simulation...\n');

  const newSimulation = await prisma.simulation.create({
    data: {
      userId: oldQuote.simulation.userId,
      vehicleId: oldQuote.simulation.vehicleId,
      conventionId: oldQuote.simulation.conventionId,
      bonusMalus: oldQuote.simulation.bonusMalus,
      usageId: oldQuote.simulation.usageId,
      formulaType: oldQuote.simulation.formulaType,
      franchiseRate: oldQuote.simulation.franchiseRate,
      bgLimit: 2000, // Capital BG
      fractionnement: oldQuote.fractionnement,
      status: 'DRAFT',
      guarantees: {
        create: [
          { guaranteeId: oldQuote.items.find(i => i.guarantee.code === 'BG').guaranteeId, isSelected: true },
          { guaranteeId: oldQuote.items.find(i => i.guarantee.code === 'CATASTROPHES_NATURELLES').guaranteeId, isSelected: true },
          { guaranteeId: oldQuote.items.find(i => i.guarantee.code === 'DOMMAGES_EMEUTES').guaranteeId, isSelected: true },
          { guaranteeId: oldQuote.items.find(i => i.guarantee.code === 'ASSURANCE_CONDUCTEUR').guaranteeId, isSelected: true, customValue: 10000 },
        ],
      },
    },
  });

  console.log(`✅ Simulation créée: ${newSimulation.id}`);

  // 3. Générer un devis via l'API (ou directement en base)
  console.log('\n🔄 Génération du devis...\n');

  // Appeler l'API de génération de devis
  try {
    const response = await axios.post('http://localhost:3000/simulations/generate-quotes', {
      simulationId: newSimulation.id,
      companyIds: [oldQuote.companyId],
    });

    console.log('✅ Devis généré via API');
    
    // Récupérer le nouveau devis
    const newQuote = await prisma.quote.findFirst({
      where: { simulationId: newSimulation.id },
      include: {
        items: {
          include: {
            guarantee: true,
          },
        },
      },
    });

    const newBG = newQuote.items.find(i => i.guarantee.code === 'BG');
    console.log('\n💰 BG (après fix):');
    console.log(`Prime: ${newBG.prime} DT`);
    console.log(`Capital: ${newBG.capital} DT`);

    // 4. Comparaison
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 COMPARAISON FINALE:\n');

    console.log('Garantie BG:');
    console.log(`ANCIEN devis (${oldQuote.quoteNumber}): ${oldBG.prime} DT`);
    console.log(`NOUVEAU devis (${newQuote.quoteNumber}): ${newBG.prime} DT`);
    console.log(`Différence: ${parseFloat(newBG.prime) - parseFloat(oldBG.prime)} DT`);

    if (parseFloat(newBG.prime) > 0 && parseFloat(oldBG.prime) === 0) {
      console.log('\n🎉 LE FIX FONCTIONNE !');
      console.log(`BG est maintenant calculé correctement : ${newBG.prime} DT`);
      console.log(`Formule: ${newBG.capital} × 0.065 = ${parseFloat(newBG.capital) * 0.065} DT`);
    } else if (parseFloat(newBG.prime) === 0) {
      console.log('\n⚠️  BG est toujours à 0 DT');
      console.log('Le fix n\'a peut-être pas été appliqué correctement');
    }

  } catch (error) {
    console.log('❌ Erreur lors de l\'appel API:', error.message);
    console.log('\n💡 Alternative: Génération manuelle du devis...\n');

    // Alternative: Calculer manuellement
    const bgRule = await prisma.pricingRule.findFirst({
      where: {
        companyId: oldQuote.companyId,
        guarantee: {
          systemRole: 'OPTIONAL_BRIS_GLACES',
        },
        isActive: true,
      },
    });

    if (bgRule) {
      const expectedPrime = 2000 * parseFloat(bgRule.ratePercentage);
      console.log('📋 Règle BG trouvée:');
      console.log(`Taux: ${bgRule.ratePercentage}`);
      console.log(`Prime attendue: ${expectedPrime} DT`);
      console.log(`\n✅ Avec le fix, BG devrait être: ${expectedPrime} DT au lieu de 0 DT`);
    }
  }

  console.log('\n' + '='.repeat(80));
}

testBGFix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
