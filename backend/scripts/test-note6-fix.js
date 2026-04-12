/**
 * TEST NOTE 6 FIX : Reproduire le devis Q20261775813985498653
 * Vérifier que les garanties NON ACCORDÉES ont prime = 0
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('🧪 TEST NOTE 6 FIX : Reproduction du devis Q20261775813985498653\n');
  console.log('='.repeat(80));

  try {
    // 1. Récupérer le devis original pour voir les paramètres
    const originalQuote = await prisma.quote.findUnique({
      where: { quoteNumber: 'Q20261775813985498653' },
      include: {
        items: { include: { guarantee: true } },
        vehicle: true,
        company: true
      }
    });

    if (!originalQuote) {
      console.log('❌ Devis original non trouvé');
      return;
    }

    console.log('📋 DEVIS ORIGINAL:');
    console.log(`   Client: ${originalQuote.firstName} ${originalQuote.lastName}`);
    console.log(`   Compagnie: ${originalQuote.company.name}`);
    console.log(`   Véhicule: ${originalQuote.vehicle.brand} ${originalQuote.vehicle.model}`);
    console.log(`   Formule: ${originalQuote.formulaType}`);
    console.log(`   Total: ${originalQuote.totalPremium} DT`);
    
    console.log('\n📦 Garanties du devis original:');
    originalQuote.items.forEach(item => {
      const status = item.isNotCovered ? '❌ NON ACCORDÉE' : 
                     item.isFree ? '🎁 GRATUITE' : '✅ ACCORDÉE';
      console.log(`   ${status} ${item.guarantee.name}: ${item.premium} DT`);
    });

    // 2. Appeler l'API de simulation avec les mêmes paramètres
    console.log('\n' + '='.repeat(80));
    console.log('🔄 CRÉATION D\'UN NOUVEAU DEVIS AVEC LES MÊMES PARAMÈTRES...\n');

    const axios = require('axios');
    const API_URL = 'http://localhost:3000/api/pricing/simulate';

    // Construire la requête de simulation
    const simulationRequest = {
      companyId: originalQuote.companyId,
      vehicleId: originalQuote.vehicleId,
      formulaType: originalQuote.formulaType,
      selectedGuarantees: originalQuote.items.map(item => item.guarantee.code),
      driverAge: originalQuote.driverAge,
      driverExperience: originalQuote.driverExperience,
      usageType: originalQuote.usageType,
      parkingType: originalQuote.parkingType,
      hasAntiTheft: originalQuote.hasAntiTheft,
      hasTrailer: originalQuote.hasTrailer,
      previousInsurer: originalQuote.previousInsurer,
      bonusMalus: originalQuote.bonusMalus
    };

    console.log('📤 Requête de simulation:');
    console.log(JSON.stringify(simulationRequest, null, 2));

    const response = await axios.post(API_URL, simulationRequest);
    const newQuote = response.data;

    console.log('\n✅ NOUVEAU DEVIS CRÉÉ:');
    console.log(`   Total: ${newQuote.totalPremium} DT`);
    
    console.log('\n📦 Garanties du nouveau devis:');
    newQuote.items.forEach(item => {
      const status = item.isNotCovered ? '❌ NON ACCORDÉE' : 
                     item.isFree ? '🎁 GRATUITE' : '✅ ACCORDÉE';
      console.log(`   ${status} ${item.guaranteeName}: ${item.premium} DT`);
    });

    // 3. VÉRIFICATION DU FIX
    console.log('\n' + '='.repeat(80));
    console.log('🔍 VÉRIFICATION DU FIX:\n');

    let bugFound = false;
    let totalShouldBe = 0;

    newQuote.items.forEach(item => {
      if (item.isNotCovered && item.premium > 0) {
        console.log(`❌ BUG ENCORE PRÉSENT: ${item.guaranteeName}`);
        console.log(`   isNotCovered: true`);
        console.log(`   Prime: ${item.premium} DT ← DEVRAIT ÊTRE 0 DT !`);
        bugFound = true;
      } else if (item.isNotCovered && item.premium === 0) {
        console.log(`✅ CORRECT: ${item.guaranteeName}`);
        console.log(`   isNotCovered: true`);
        console.log(`   Prime: 0 DT ✓`);
      }

      // Calculer le total correct (exclure les NON ACCORDÉES)
      if (!item.isNotCovered) {
        totalShouldBe += parseFloat(item.premium);
      }
    });

    console.log('\n💰 VÉRIFICATION DU TOTAL:');
    console.log(`   Total calculé: ${newQuote.totalPremium} DT`);
    console.log(`   Total attendu: ${totalShouldBe.toFixed(3)} DT`);
    
    if (Math.abs(newQuote.totalPremium - totalShouldBe) < 0.01) {
      console.log('   ✅ TOTAL CORRECT !');
    } else {
      console.log('   ❌ TOTAL INCORRECT !');
      bugFound = true;
    }

    // 4. RÉSULTAT FINAL
    console.log('\n' + '='.repeat(80));
    if (bugFound) {
      console.log('❌ TEST ÉCHOUÉ : Le bug est encore présent');
      console.log('\n💡 Actions à faire:');
      console.log('   1. Vérifier que le code a été déployé');
      console.log('   2. Redémarrer le serveur backend');
      console.log('   3. Relancer ce test');
    } else {
      console.log('✅ TEST RÉUSSI : Le bug est corrigé !');
      console.log('\n🎉 Les garanties NON ACCORDÉES ont bien prime = 0');
      console.log('🎉 Le total n\'inclut pas les garanties NON ACCORDÉES');
    }
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('Réponse API:', error.response.data);
    }
  }
})()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
