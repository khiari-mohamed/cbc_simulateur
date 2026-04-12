/**
 * 🔍 DIAGNOSTIC COMPLET NOTE 5 : TR avec réductions de convention
 * 
 * Ce script :
 * 1. Analyse un devis TR existant (ANCIEN)
 * 2. Vérifie la configuration des réductions dans la base
 * 3. Recrée un NOUVEAU devis avec les mêmes paramètres
 * 4. Compare ANCIEN vs NOUVEAU
 * 5. Identifie la cause du bug
 */

const { PrismaClient } = require('@prisma/client');
const { Decimal } = require('@prisma/client/runtime/library');
const prisma = new PrismaClient();

(async () => {
  console.log('🔍 DIAGNOSTIC COMPLET NOTE 5 : TR avec réductions\n');
  console.log('='.repeat(80));

  try {
    // 1. SÉLECTIONNER UN DEVIS TR AVEC BUG
    const QUOTE_NUMBER = 'Q20261775487829643615'; // AL BARAKA, VN=50000, franchise=0%, bug confirmé

    console.log(`📋 ÉTAPE 1 : Analyse du devis ${QUOTE_NUMBER}\n`);

    const oldQuote = await prisma.quote.findUnique({
      where: { quoteNumber: QUOTE_NUMBER },
      include: {
        items: { include: { guarantee: true } },
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

    if (!oldQuote) {
      console.log('❌ Devis non trouvé');
      return;
    }

    const vehicle = oldQuote.simulation.vehicle;
    const vn = parseFloat(vehicle.newValue);
    const franchiseRate = oldQuote.simulation.franchiseRate || 0;
    const conventionId = oldQuote.simulation.conventionId;

    console.log('📊 ANCIEN DEVIS:');
    console.log(`   Numéro: ${oldQuote.quoteNumber}`);
    console.log(`   Compagnie: ${oldQuote.company.name}`);
    console.log(`   VN: ${vn} DT`);
    console.log(`   Franchise: ${franchiseRate}%`);
    console.log(`   Convention: ${conventionId || 'Aucune'}`);
    console.log(`   Date: ${oldQuote.createdAt.toISOString()}`);

    const oldTrItem = oldQuote.items.find(i => 
      i.guarantee.code === 'TOUS_RISQUES_ZERO' || 
      i.guarantee.systemRole === 'OPTIONAL_TOUS_RISQUES'
    );

    if (!oldTrItem) {
      console.log('❌ Garantie TR non trouvée');
      return;
    }

    const oldPrime = parseFloat(oldTrItem.prime);
    console.log(`   Prime TR: ${oldPrime} DT`);

    // 2. VÉRIFIER LA CONFIGURATION DES RÉDUCTIONS
    console.log('\n' + '='.repeat(80));
    console.log('📋 ÉTAPE 2 : Vérification de la configuration des réductions\n');

    if (!conventionId) {
      console.log('⚠️  Aucune convention configurée pour ce devis');
    } else {
      const reductionRules = await prisma.conventionReductionRule.findMany({
        where: {
          conventionId: conventionId,
          companyId: oldQuote.companyId,
          guarantee: { systemRole: 'OPTIONAL_TOUS_RISQUES' },
          isActive: true
        },
        include: { guarantee: true }
      });

      console.log(`📊 Règles de réduction trouvées: ${reductionRules.length}`);
      
      if (reductionRules.length === 0) {
        console.log('❌ PROBLÈME: Aucune règle de réduction trouvée !');
        console.log('   → Les réductions ne peuvent pas être appliquées');
      } else {
        console.log('\n📋 Détails des règles:');
        reductionRules.forEach((rule, index) => {
          console.log(`\n   Règle ${index + 1}:`);
          console.log(`     ID: ${rule.id}`);
          console.log(`     Réduction: ${rule.discountPercent}%`);
          console.log(`     Metric: ${rule.metric}`);
          console.log(`     FormulaType: ${rule.formulaType || 'Tous'}`);
          console.log(`     Min Value: ${rule.minValue || 'N/A'}`);
          console.log(`     Max Value: ${rule.maxValue || 'N/A'}`);
          console.log(`     Priority: ${rule.priority}`);
          console.log(`     Active: ${rule.isActive}`);
          console.log(`     Valid From: ${rule.validFrom.toISOString()}`);
          console.log(`     Valid To: ${rule.validTo?.toISOString() || 'Illimité'}`);
        });

        // Vérifier quelle règle devrait s'appliquer
        console.log('\n🔍 Analyse de la règle applicable:');
        
        const applicableRules = reductionRules.filter(rule => {
          // Vérifier formulaType
          if (rule.formulaType && rule.formulaType !== 'TOUS_RISQUES_0') {
            console.log(`   ❌ Règle ${rule.id}: formulaType ne correspond pas (${rule.formulaType})`);
            return false;
          }

          // Vérifier metric
          if (rule.metric !== 'NEW_VALUE') {
            console.log(`   ❌ Règle ${rule.id}: metric ne correspond pas (${rule.metric})`);
            return false;
          }

          // Vérifier minValue/maxValue
          if (rule.minValue && vn < parseFloat(rule.minValue)) {
            console.log(`   ❌ Règle ${rule.id}: VN trop petit (${vn} < ${rule.minValue})`);
            return false;
          }
          if (rule.maxValue && vn > parseFloat(rule.maxValue)) {
            console.log(`   ❌ Règle ${rule.id}: VN trop grand (${vn} > ${rule.maxValue})`);
            return false;
          }

          // Vérifier dates
          const now = new Date();
          if (rule.validFrom > now) {
            console.log(`   ❌ Règle ${rule.id}: Pas encore valide`);
            return false;
          }
          if (rule.validTo && rule.validTo < now) {
            console.log(`   ❌ Règle ${rule.id}: Expirée`);
            return false;
          }

          console.log(`   ✅ Règle ${rule.id}: APPLICABLE (${rule.discountPercent}%)`);
          return true;
        });

        if (applicableRules.length === 0) {
          console.log('\n❌ PROBLÈME: Aucune règle applicable trouvée !');
        } else {
          // Trier par priorité
          applicableRules.sort((a, b) => b.priority - a.priority);
          const bestRule = applicableRules[0];
          console.log(`\n✅ Meilleure règle: ${bestRule.discountPercent}% (priority: ${bestRule.priority})`);
          
          // Calculer la prime attendue
          const primeBase = (vn * 0.032) + 22; // Formule TR 0%
          const primeAvecReduction = primeBase * (1 - parseFloat(bestRule.discountPercent) / 100);
          
          console.log(`\n💰 Calcul attendu:`);
          console.log(`   Prime base: ${primeBase.toFixed(3)} DT`);
          console.log(`   Réduction: ${bestRule.discountPercent}%`);
          console.log(`   Prime finale: ${primeAvecReduction.toFixed(3)} DT`);
          console.log(`\n   Prime actuelle: ${oldPrime} DT`);
          console.log(`   Différence: ${(oldPrime - primeAvecReduction).toFixed(3)} DT`);
          
          if (Math.abs(oldPrime - primeAvecReduction) > 0.01) {
            console.log(`\n🚨 BUG CONFIRMÉ: La réduction n'a PAS été appliquée !`);
          }
        }
      }
    }

    // 3. RECRÉER UN NOUVEAU DEVIS
    console.log('\n' + '='.repeat(80));
    console.log('📋 ÉTAPE 3 : Création d\'un NOUVEAU devis avec les mêmes paramètres\n');

    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('../dist/src/app.module');
    const { PricingEngineService } = require('../dist/src/pricing-engine/pricing-engine.service');

    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error']
    });
    const pricingEngine = app.get(PricingEngineService);

    // Préparer les paramètres
    const selectedGuarantees = oldQuote.items.map(item => item.guarantee.code);
    const selectedCapitals = {};
    oldQuote.items.forEach(item => {
      if (item.capital && item.capital > 0) {
        selectedCapitals[item.guarantee.code] = item.capital;
      }
    });

    const simulationData = {
      bonusMalus: oldQuote.simulation.bonusMalus,
      usageId: oldQuote.simulation.usageId,
      formulaType: oldQuote.simulation.formulaType,
      selectedGuarantees: selectedGuarantees,
      selectedCapitals: selectedCapitals,
      franchiseRate: franchiseRate,
      fractionnement: oldQuote.simulation.fractionnement || 'ANNUEL'
    };

    const vehicleData = {
      fiscalHorsepower: vehicle.fiscalHorsepower,
      numberOfSeats: vehicle.numberOfSeats,
      newValue: vehicle.newValue,
      marketValue: vehicle.marketValue,
      firstCirculationDate: vehicle.firstCirculationDate
    };

    console.log('🔄 Appel du pricing engine...\n');

    const result = await pricingEngine.calculatePremium(
      oldQuote.companyId,
      vehicleData,
      simulationData,
      conventionId
    );

    console.log('✅ Calcul terminé\n');

    // Trouver l'item TR dans le nouveau résultat
    const newTrItem = result.items.find(i => 
      i.guaranteeCode === 'TOUS_RISQUES_ZERO'
    );

    if (!newTrItem) {
      console.log('❌ Garantie TR non trouvée dans le nouveau calcul');
      await app.close();
      return;
    }

    const newPrime = parseFloat(newTrItem.prime);
    console.log('📊 NOUVEAU CALCUL:');
    console.log(`   Prime TR: ${newPrime} DT`);
    
    if (newTrItem.reductionInfo) {
      console.log(`   Réduction appliquée: ${newTrItem.reductionInfo.discountPercent}%`);
      console.log(`   Prime avant réduction: ${newTrItem.reductionInfo.originalPrime} DT`);
      console.log(`   Prime après réduction: ${newTrItem.reductionInfo.finalPrime} DT`);
    } else {
      console.log(`   ⚠️  Aucune réduction appliquée`);
    }

    // 4. SAUVEGARDER LE NOUVEAU DEVIS
    console.log('\n' + '='.repeat(80));
    console.log('📋 ÉTAPE 4 : Sauvegarde du nouveau devis dans la base\n');

    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const newQuoteNumber = `Q${timestamp}${random}`;

    const newQuote = await prisma.quote.create({
      data: {
        quoteNumber: newQuoteNumber,
        simulationId: oldQuote.simulationId,
        userId: oldQuote.userId,
        companyId: oldQuote.companyId,
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
        items: { include: { guarantee: true } }
      }
    });

    console.log(`✅ Nouveau devis créé: ${newQuoteNumber}\n`);

    // 5. COMPARAISON FINALE
    console.log('='.repeat(80));
    console.log('📊 ÉTAPE 5 : COMPARAISON FINALE\n');

    console.log('Garantie TR:');
    console.log(`  ANCIEN devis (${oldQuote.quoteNumber}): ${oldPrime} DT`);
    console.log(`  NOUVEAU devis (${newQuote.quoteNumber}): ${newPrime} DT`);
    console.log(`  Différence: ${(newPrime - oldPrime).toFixed(3)} DT`);

    const diff = Math.abs(newPrime - oldPrime);
    
    if (diff < 0.01) {
      console.log('\n⚠️  AUCUNE DIFFÉRENCE: Le bug est toujours présent !');
      console.log('\n🔍 CAUSE PROBABLE:');
      console.log('   → Le service reductionRatesService.getReductionPercent() ne trouve pas les règles');
      console.log('   → Ou les règles sont mal configurées (dates, metric, formulaType)');
    } else {
      console.log('\n✅ DIFFÉRENCE DÉTECTÉE: Le nouveau calcul est différent !');
      
      if (newPrime < oldPrime) {
        console.log('\n🎉 LE FIX FONCTIONNE !');
        console.log(`   Le nouveau devis applique bien les réductions (économie: ${diff.toFixed(3)} DT)`);
      } else {
        console.log('\n⚠️  Le nouveau devis est PLUS CHER');
        console.log('   Cela peut indiquer un autre problème');
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎯 DIAGNOSTIC FINAL:\n');

    if (diff < 0.01) {
      console.log('❌ BUG CONFIRMÉ ET NON CORRIGÉ');
      console.log('\nActions nécessaires:');
      console.log('  1. Vérifier reductionRatesService.getReductionPercent()');
      console.log('  2. Vérifier les logs du pricing engine');
      console.log('  3. Débugger la logique de sélection des règles');
    } else if (newPrime < oldPrime) {
      console.log('✅ LE CODE FONCTIONNE CORRECTEMENT');
      console.log('\nConclusion:');
      console.log('  → Les anciens devis ont été créés AVANT la configuration des réductions');
      console.log('  → Les nouveaux devis appliquent bien les réductions');
      console.log('  → Pas de bug dans le code, juste des données historiques');
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
