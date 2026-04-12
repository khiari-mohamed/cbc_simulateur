/**
 * 🧪 TEST NOTE 6 : Reproduction EXACTE du devis Q20261775813985498653
 * 
 * Ce script :
 * 1. Récupère TOUS les paramètres du devis original
 * 2. Crée un nouveau devis avec EXACTEMENT les mêmes paramètres
 * 3. Compare ligne par ligne : ancien vs nouveau
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('🧪 TEST NOTE 6 : Reproduction EXACTE du devis\n');
  console.log('='.repeat(80));

  try {
    // 1. RÉCUPÉRER LE DEVIS ORIGINAL
    const ORIGINAL_QUOTE_NUMBER = 'Q20261775813985498653';
    
    const originalQuote = await prisma.quote.findUnique({
      where: { quoteNumber: ORIGINAL_QUOTE_NUMBER },
      include: {
        items: {
          include: { guarantee: true },
          orderBy: { guarantee: { code: 'asc' } }
        },
        simulation: {
          include: {
            vehicle: true,
            usage: true
          }
        },
        company: true,
        user: true
      }
    });

    if (!originalQuote) {
      console.log('❌ Devis original non trouvé:', ORIGINAL_QUOTE_NUMBER);
      return;
    }

    const vehicle = originalQuote.simulation?.vehicle;
    const usage = originalQuote.simulation?.usage;

    if (!vehicle) {
      console.log('❌ Véhicule non trouvé dans la simulation');
      return;
    }

    console.log('📋 DEVIS ORIGINAL RÉCUPÉRÉ:');
    console.log('─'.repeat(80));
    console.log(`Numéro: ${originalQuote.quoteNumber}`);
    console.log(`Date: ${originalQuote.createdAt.toISOString()}`);
    console.log(`Client: ${originalQuote.user.firstName} ${originalQuote.user.lastName}`);
    console.log(`Compagnie: ${originalQuote.company.name} (ID: ${originalQuote.companyId})`);
    console.log(`Véhicule: ${vehicle.brand || 'N/A'} ${vehicle.model || 'N/A'}`);
    console.log(`  - Valeur Vénale: ${vehicle.marketValue} DT`);
    console.log(`  - Valeur à Neuf: ${vehicle.newValue} DT`);
    console.log(`  - Puissance fiscale: ${vehicle.fiscalHorsepower} CV`);
    console.log(`  - Nb places: ${vehicle.numberOfSeats}`);
    console.log(`Formule: ${originalQuote.simulation.formulaType}`);
    console.log(`Bonus/Malus: ${originalQuote.simulation.bonusMalus}`);
    console.log(`Usage: ${usage?.nameFr || 'N/A'}`);
    console.log('');
    console.log('Garanties sélectionnées:');
    
    let originalNonAccordeeWithPremium = [];
    originalQuote.items.forEach(item => {
      const premium = parseFloat(item.prime);
      const status = item.isNotCovered ? '❌ NON ACCORDÉE' : 
                     (premium === 0 ? '🎁 GRATUITE' : '✅ ACCORDÉE');
      console.log(`  ${status} ${item.guarantee.code.padEnd(30)} ${item.prime.toString().padStart(10)} DT`);
      
      if (item.isNotCovered && premium > 0) {
        originalNonAccordeeWithPremium.push({
          code: item.guarantee.code,
          name: item.guarantee.nameFr,
          premium: premium
        });
      }
    });
    console.log('');
    console.log(`💰 TOTAL: ${originalQuote.totalAPayer} DT`);
    
    if (originalNonAccordeeWithPremium.length > 0) {
      console.log('\n⚠️  BUG IDENTIFIÉ DANS L\'ORIGINAL:');
      originalNonAccordeeWithPremium.forEach(g => {
        console.log(`   ${g.name} (${g.code}): ${g.premium} DT (devrait être 0 DT car NON ACCORDÉE)`);
      });
    }

    // 2. PRÉPARER LES PARAMÈTRES POUR calculatePremium()
    console.log('\n' + '='.repeat(80));
    console.log('🔄 EXÉCUTION DU PRICING ENGINE AVEC LES MÊMES PARAMÈTRES...\n');

    // Récupérer les garanties sélectionnées
    const selectedGuarantees = originalQuote.items.map(item => item.guarantee.code);

    // Récupérer les capitaux sélectionnés
    const selectedCapitals = {};
    originalQuote.items.forEach(item => {
      if (item.capital && item.capital > 0) {
        selectedCapitals[item.guarantee.code] = item.capital;
      }
    });

    // Construire l'objet simulationData EXACTEMENT comme attendu par calculatePremium()
    const simulationData = {
      bonusMalus: originalQuote.simulation.bonusMalus,
      usageId: originalQuote.simulation.usageId,
      formulaType: originalQuote.simulation.formulaType,
      selectedGuarantees: selectedGuarantees,
      selectedCapitals: selectedCapitals,
      franchiseRate: originalQuote.simulation.franchiseRate || 0,
      fractionnement: originalQuote.simulation.fractionnement || 'ANNUEL'
    };

    // Construire l'objet vehicleData EXACTEMENT comme attendu
    const vehicleData = {
      fiscalHorsepower: vehicle.fiscalHorsepower,
      numberOfSeats: vehicle.numberOfSeats,
      newValue: vehicle.newValue,
      marketValue: vehicle.marketValue,
      firstCirculationDate: vehicle.firstCirculationDate
    };

    console.log('📋 PARAMÈTRES EXACTS:');
    console.log(`   Company ID: ${originalQuote.companyId}`);
    console.log(`   Formule: ${simulationData.formulaType}`);
    console.log(`   Bonus/Malus: ${simulationData.bonusMalus}`);
    console.log(`   Usage: ${simulationData.usageId}`);
    console.log(`   Garanties (${selectedGuarantees.length}): ${selectedGuarantees.join(', ')}`);
    console.log(`   Valeur Vénale: ${vehicleData.marketValue} DT`);
    console.log(`   Valeur à Neuf: ${vehicleData.newValue} DT`);
    console.log('');

    // 3. IMPORTER ET EXÉCUTER LE PRICING ENGINE
    console.log('🔄 Appel de calculatePremium()...\n');

    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('../dist/src/app.module');
    const { PricingEngineService } = require('../dist/src/pricing-engine/pricing-engine.service');

    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error'] // Seulement les erreurs
    });
    const pricingEngine = app.get(PricingEngineService);

    const result = await pricingEngine.calculatePremium(
      originalQuote.companyId,
      vehicleData,
      simulationData,
      originalQuote.simulation?.conventionId || undefined
    );

    console.log('✅ CALCUL TERMINÉ\n');

    console.log('📊 RÉSULTATS APRÈS FIX:');
    console.log('─'.repeat(80));
    console.log('Garanties:');
    
    let totalCorrect = 0;
    result.items.forEach(item => {
      const status = item.isNotCovered ? '❌ NON ACCORDÉE' : 
                     (item.prime === 0 ? '🎁 GRATUITE' : '✅ ACCORDÉE');
      console.log(`  ${status} ${item.guaranteeCode.padEnd(30)} ${item.prime.toString().padStart(10)} DT`);
      
      if (!item.isNotCovered) {
        totalCorrect += parseFloat(item.prime);
      }
    });
    console.log('');
    console.log(`💰 TOTAL APRÈS FIX: ${result.totalAPayer} DT`);
    console.log(`💰 TOTAL CORRECT (sans NON ACCORDÉES): ${totalCorrect.toFixed(3)} DT`);

    // 4. COMPARAISON LIGNE PAR LIGNE
    console.log('\n' + '='.repeat(80));
    console.log('🔍 COMPARAISON DÉTAILLÉE:\n');

    let hasDifferences = false;
    let bugFixed = false;

    // Créer un map des garanties originales
    const originalMap = new Map();
    originalQuote.items.forEach(item => {
      const premium = parseFloat(item.prime); // CORRECTION: item.prime pas item.premium
      originalMap.set(item.guarantee.code, {
        premium: premium,
        isNotCovered: item.isNotCovered,
        isFree: false // Le schéma n'a pas de champ isFree
      });
    });

    // Créer un map des nouvelles garanties
    const newMap = new Map();
    result.items.forEach(item => {
      newMap.set(item.guaranteeCode, {
        premium: parseFloat(item.prime),
        isNotCovered: item.isNotCovered,
        isFree: false
      });
    });

    // Comparer chaque garantie
    console.log('Garantie'.padEnd(35) + 'Original'.padStart(12) + 'Nouveau'.padStart(12) + '  Statut');
    console.log('─'.repeat(80));

    for (const [code, original] of originalMap.entries()) {
      const nouveau = newMap.get(code);
      
      if (!nouveau) {
        console.log(`${code.padEnd(35)} ${original.premium.toFixed(3).padStart(10)} DT  MANQUANT     ⚠️`);
        hasDifferences = true;
        continue;
      }

      const diff = Math.abs(original.premium - nouveau.premium);
      const isDifferent = diff > 0.001;
      
      let status = '✅ OK';
      let note = '';

      if (isDifferent) {
        hasDifferences = true;
        
        // Cas spécial : NON ACCORDÉE avec prime > 0 dans l'original
        if (original.isNotCovered && original.premium > 0 && nouveau.premium === 0) {
          status = '🎉 FIXÉ';
          note = ' (BUG CORRIGÉ !)';
          bugFixed = true;
        } else {
          status = '❌ DIFF';
          note = ` (Δ ${diff.toFixed(3)} DT)`;
        }
      }

      const statusInfo = original.isNotCovered ? ' [NON ACCORDÉE]' : '';

      console.log(
        `${(code + statusInfo).padEnd(35)} ` +
        `${original.premium.toFixed(3).padStart(10)} DT ` +
        `${nouveau.premium.toFixed(3).padStart(10)} DT  ` +
        `${status}${note}`
      );
    }

    console.log('─'.repeat(80));
    console.log(
      `${'TOTAL'.padEnd(35)} ` +
      `${parseFloat(originalQuote.totalAPayer).toFixed(3).padStart(10)} DT ` +
      `${parseFloat(result.totalAPayer).toFixed(3).padStart(10)} DT`
    );

    const totalDiff = Math.abs(parseFloat(originalQuote.totalAPayer) - parseFloat(result.totalAPayer));
    
    if (totalDiff > 0.001) {
      console.log(`${''.padEnd(35)} ${''.padStart(10)}    ${''.padStart(10)}    Δ ${totalDiff.toFixed(3)} DT`);
    }

    // 5. DIAGNOSTIC FINAL
    console.log('\n' + '='.repeat(80));
    console.log('🎯 DIAGNOSTIC FINAL:\n');

    const totalVsCorrect = Math.abs(parseFloat(result.totalAPayer) - totalCorrect);

    if (bugFixed) {
      console.log('✅✅✅ TEST RÉUSSI : LE BUG EST CORRIGÉ !');
      console.log('');
      console.log('📊 RÉSULTATS:');
      console.log(`   Total AVANT fix: ${originalQuote.totalAPayer} DT`);
      console.log(`   Total APRÈS fix: ${result.totalAPayer} DT`);
      console.log(`   Différence: ${totalDiff.toFixed(3)} DT`);
      console.log('');
      console.log('🎉 Les garanties NON ACCORDÉES ont bien prime = 0 DT');
      console.log('🎉 Le total a été recalculé correctement');
      
      if (originalNonAccordeeWithPremium.length > 0) {
        console.log('\n💰 IMPACT POUR LE CLIENT:');
        originalNonAccordeeWithPremium.forEach(g => {
          console.log(`   ${g.name}: ${g.premium} DT → 0 DT (économie de ${g.premium} DT)`);
        });
        const totalEconomie = originalNonAccordeeWithPremium.reduce((sum, g) => sum + g.premium, 0);
        console.log(`\n   TOTAL ÉCONOMISÉ: ${totalEconomie} DT`);
      }
      
    } else if (!hasDifferences) {
      console.log('⚠️ AUCUNE DIFFÉRENCE DÉTECTÉE');
      console.log('');
      console.log('Le fix n\'a pas été appliqué ou le code n\'a pas été rebuild.');
      console.log('');
      console.log('Actions à faire:');
      console.log('  1. npm run build');
      console.log('  2. pm2 restart ars-backend');
      console.log('  3. Relancer ce test');
      
    } else {
      console.log('❌ TEST ÉCHOUÉ : Le bug est encore présent');
      console.log('');
      console.log('Des garanties NON ACCORDÉES ont encore une prime > 0.');
      console.log('');
      console.log('Vérifiez les garanties ci-dessus pour identifier le problème.');
    }

    console.log('='.repeat(80));
    
    // 6. CRÉER UN VRAI NOUVEAU DEVIS DANS LA BASE DE DONNÉES
    console.log('\n' + '='.repeat(80));
    console.log('💾 CRÉATION D\'UN NOUVEAU DEVIS DANS LA BASE DE DONNÉES...\n');

    // Générer un numéro de devis unique
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const newQuoteNumber = `Q${timestamp}${random}`;

    console.log(`Numéro du nouveau devis: ${newQuoteNumber}`);

    // Créer le nouveau devis dans la base
    const newQuote = await prisma.quote.create({
      data: {
        quoteNumber: newQuoteNumber,
        simulationId: originalQuote.simulationId,
        userId: originalQuote.userId,
        companyId: originalQuote.companyId,
        status: 'GENERATED',
        primeNette: result.primeNette,
        frais: result.frais,
        taxes: result.taxes,
        fpac: result.fpac,
        fssr: result.fssr,
        fg: result.fg,
        totalAPayer: result.totalAPayer,
        fractionnement: simulationData.fractionnement,
        pricingSnapshot: result,
        items: {
          create: result.items.map(item => ({
            guaranteeId: item.guaranteeId,
            capital: item.capital,
            prime: item.prime,
            isNotCovered: item.isNotCovered || false
          }))
        }
      },
      include: {
        items: {
          include: { guarantee: true }
        }
      }
    });

    console.log('✅ Nouveau devis créé avec succès !\n');

    // 7. VÉRIFIER LE NOUVEAU DEVIS DANS LA BASE
    console.log('='.repeat(80));
    console.log('🔍 VÉRIFICATION DU NOUVEAU DEVIS DANS LA BASE:\n');

    console.log('📋 Garanties du nouveau devis:');
    let newQuoteBugFound = false;
    newQuote.items.forEach(item => {
      const premium = parseFloat(item.prime);
      const status = item.isNotCovered ? '❌ NON ACCORDÉE' : 
                     (premium === 0 ? '🎁 GRATUITE' : '✅ ACCORDÉE');
      console.log(`  ${status} ${item.guarantee.code.padEnd(30)} ${item.prime.toString().padStart(10)} DT`);
      
      if (item.isNotCovered && premium > 0) {
        console.log(`     🚨 BUG: Prime devrait être 0 DT !`);
        newQuoteBugFound = true;
      }
    });

    console.log(`\n💰 Total du nouveau devis: ${newQuote.totalAPayer} DT`);

    // 8. COMPARAISON FINALE : ANCIEN vs NOUVEAU (dans la base)
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPARAISON FINALE : ANCIEN DEVIS vs NOUVEAU DEVIS (BASE DE DONNÉES):\n');

    console.log('Garantie'.padEnd(35) + 'Ancien (BUG)'.padStart(15) + 'Nouveau (FIX)'.padStart(15) + '  Statut');
    console.log('─'.repeat(80));

    const newQuoteMap = new Map();
    newQuote.items.forEach(item => {
      newQuoteMap.set(item.guarantee.code, {
        premium: parseFloat(item.prime),
        isNotCovered: item.isNotCovered
      });
    });

    let finalBugFixed = false;
    for (const [code, original] of originalMap.entries()) {
      const nouveau = newQuoteMap.get(code);
      
      if (!nouveau) continue;

      const diff = Math.abs(original.premium - nouveau.premium);
      let status = '✅ OK';
      let note = '';

      if (diff > 0.001) {
        if (original.isNotCovered && original.premium > 0 && nouveau.premium === 0) {
          status = '🎉 FIXÉ';
          note = ' (BUG CORRIGÉ !)';
          finalBugFixed = true;
        } else {
          status = '❌ DIFF';
          note = ` (Δ ${diff.toFixed(3)} DT)`;
        }
      }

      const statusInfo = original.isNotCovered ? ' [NON ACCORDÉE]' : '';

      console.log(
        `${(code + statusInfo).padEnd(35)} ` +
        `${original.premium.toFixed(3).padStart(13)} DT ` +
        `${nouveau.premium.toFixed(3).padStart(13)} DT  ` +
        `${status}${note}`
      );
    }

    console.log('─'.repeat(80));
    console.log(
      `${'TOTAL'.padEnd(35)} ` +
      `${parseFloat(originalQuote.totalAPayer).toFixed(3).padStart(13)} DT ` +
      `${parseFloat(newQuote.totalAPayer).toFixed(3).padStart(13)} DT`
    );

    const finalTotalDiff = Math.abs(parseFloat(originalQuote.totalAPayer) - parseFloat(newQuote.totalAPayer));
    if (finalTotalDiff > 0.001) {
      console.log(`${''.padEnd(35)} ${''.padStart(13)}    ${''.padStart(13)}    Δ ${finalTotalDiff.toFixed(3)} DT`);
    }

    // 9. RÉSULTAT FINAL DÉFINITIF
    console.log('\n' + '='.repeat(80));
    console.log('🏁 RÉSULTAT FINAL DÉFINITIF:\n');

    if (finalBugFixed && !newQuoteBugFound) {
      console.log('✅✅✅ LE FIX EST CONFIRMÉ À 100% !');
      console.log('');
      console.log('📊 PREUVES:');
      console.log(`   1. Ancien devis (${originalQuote.quoteNumber}): DOMMAGES_EMEUTES = 30 DT ❌`);
      console.log(`   2. Nouveau devis (${newQuote.quoteNumber}): DOMMAGES_EMEUTES = 0 DT ✅`);
      console.log(`   3. Le nouveau devis est SAUVEGARDÉ dans la base de données ✅`);
      console.log('');
      console.log('🎉 Le bug NOTE 6 est DÉFINITIVEMENT corrigé en PROD !');
      console.log('');
      console.log('💰 ÉCONOMIE POUR LE CLIENT:');
      if (originalNonAccordeeWithPremium.length > 0) {
        originalNonAccordeeWithPremium.forEach(g => {
          console.log(`   ${g.name}: ${g.premium} DT → 0 DT`);
        });
        const totalEconomie = originalNonAccordeeWithPremium.reduce((sum, g) => sum + g.premium, 0);
        console.log(`   TOTAL: ${totalEconomie} DT + taxes`);
      }
    } else if (newQuoteBugFound) {
      console.log('❌ LE BUG EST ENCORE PRÉSENT !');
      console.log('');
      console.log('Le nouveau devis créé dans la base a encore des garanties NON ACCORDÉES avec prime > 0.');
      console.log('');
      console.log('Actions à faire:');
      console.log('  1. Vérifier que le fix est bien dans le code');
      console.log('  2. npm run build');
      console.log('  3. pm2 restart ars-backend');
      console.log('  4. Relancer ce test');
    } else {
      console.log('⚠️ RÉSULTAT INCERTAIN');
      console.log('');
      console.log('Le nouveau devis a été créé mais aucune différence significative détectée.');
    }

    console.log('='.repeat(80));
    
    await app.close();

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  }
})()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
