/**
 * 🔍 RECHERCHE DES DEVIS TR DU 10 AVRIL 2026
 * 
 * Le client a envoyé l'email le 10 avril 2026 à 11:01 AM
 * Il dit que "pour certaines couvertures" les réductions ne sont pas appliquées
 * 
 * Cherchons les devis TR créés ce jour-là pour trouver le cas exact
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('🔍 RECHERCHE DES DEVIS TR DU 10 AVRIL 2026\n');
  console.log('='.repeat(80));

  try {
    // Date de l'email : 10 avril 2026, 11:01 AM
    const emailDate = new Date('2026-04-10T11:01:00.000Z');
    
    // Chercher les devis TR créés le 10 avril 2026 (toute la journée)
    const startDate = new Date('2026-04-10T00:00:00.000Z');
    const endDate = new Date('2026-04-10T23:59:59.999Z');

    console.log(`📅 Recherche des devis TR créés le 10 avril 2026`);
    console.log(`   Entre: ${startDate.toISOString()}`);
    console.log(`   Et: ${endDate.toISOString()}`);
    console.log(`   Email envoyé à: ${emailDate.toISOString()}\n`);

    const trQuotes = await prisma.quote.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        simulation: {
          formulaType: 'TOUS_RISQUES_0'
        }
      },
      include: {
        items: {
          include: { guarantee: true }
        },
        simulation: {
          include: {
            vehicle: true,
            usage: true
          }
        },
        company: true,
        user: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`✅ Trouvé ${trQuotes.length} devis TR le 10 avril 2026\n`);
    console.log('='.repeat(80));

    if (trQuotes.length === 0) {
      console.log('❌ Aucun devis TR trouvé ce jour-là');
      return;
    }

    // Analyser chaque devis
    for (const quote of trQuotes) {
      const vehicle = quote.simulation.vehicle;
      const vn = parseFloat(vehicle.newValue);
      const franchiseRate = quote.simulation.franchiseRate || 0;
      const conventionId = quote.simulation.conventionId;

      console.log(`\n📋 DEVIS: ${quote.quoteNumber}`);
      console.log('─'.repeat(80));
      console.log(`   Heure: ${quote.createdAt.toISOString()}`);
      console.log(`   Client: ${quote.user.firstName} ${quote.user.lastName}`);
      console.log(`   Compagnie: ${quote.company.name}`);
      console.log(`   VN: ${vn} DT`);
      console.log(`   Franchise: ${franchiseRate}%`);
      console.log(`   Convention: ${conventionId || 'Aucune'}`);

      // Trouver l'item TR
      const trItem = quote.items.find(i => 
        i.guarantee.code === 'TOUS_RISQUES_ZERO' || 
        i.guarantee.systemRole === 'OPTIONAL_TOUS_RISQUES'
      );

      if (!trItem) {
        console.log('   ⚠️  Garantie TR non trouvée');
        continue;
      }

      const primeTR = parseFloat(trItem.prime);
      console.log(`   Prime TR: ${primeTR} DT`);

      // Vérifier si une réduction devrait être appliquée
      if (conventionId) {
        const reductionRules = await prisma.conventionReductionRule.findMany({
          where: {
            conventionId: conventionId,
            companyId: quote.companyId,
            guarantee: { systemRole: 'OPTIONAL_TOUS_RISQUES' },
            formulaType: 'TOUS_RISQUES_0',
            isActive: true
          }
        });

        if (reductionRules.length > 0) {
          console.log(`   Réductions configurées: ${reductionRules.length}`);
          
          // Trouver la règle applicable
          const applicableRules = reductionRules.filter(rule => {
            if (rule.minValue && vn < parseFloat(rule.minValue)) return false;
            if (rule.maxValue && vn > parseFloat(rule.maxValue)) return false;
            
            const now = quote.createdAt;
            if (rule.validFrom > now) return false;
            if (rule.validTo && rule.validTo < now) return false;
            
            return true;
          });

          if (applicableRules.length > 0) {
            applicableRules.sort((a, b) => b.priority - a.priority);
            const bestRule = applicableRules[0];
            
            console.log(`   Réduction applicable: ${bestRule.discountPercent}%`);
            
            // Calculer la prime attendue
            const guarantee = await prisma.guarantee.findFirst({
              where: { systemRole: 'OPTIONAL_TOUS_RISQUES', isActive: true }
            });

            const pricingRule = await prisma.pricingRule.findFirst({
              where: {
                companyId: quote.companyId,
                guaranteeId: guarantee.id,
                franchiseRate: franchiseRate,
                isActive: true
              }
            });

            if (pricingRule) {
              const taux = parseFloat(pricingRule.ratePercentage);
              const fixe = parseFloat(pricingRule.fixedPremium);
              const primeBase = (vn * taux) + fixe;
              const primeAvecReduction = primeBase * (1 - parseFloat(bestRule.discountPercent) / 100);

              console.log(`   Prime base: ${primeBase.toFixed(3)} DT`);
              console.log(`   Prime attendue (avec réduction): ${primeAvecReduction.toFixed(3)} DT`);
              console.log(`   Prime actuelle: ${primeTR} DT`);

              const diff = Math.abs(primeTR - primeAvecReduction);
              if (diff > 0.01) {
                console.log(`   🚨 BUG DÉTECTÉ: Différence de ${diff.toFixed(3)} DT`);
                console.log(`   → La réduction de ${bestRule.discountPercent}% n'a PAS été appliquée !`);
              } else {
                console.log(`   ✅ CORRECT: Réduction bien appliquée`);
              }
            }
          } else {
            console.log(`   ⚠️  Aucune réduction applicable`);
          }
        } else {
          console.log(`   ⚠️  Aucune réduction configurée`);
        }
      } else {
        console.log(`   ⚠️  Pas de convention`);
      }

      // Afficher toutes les garanties pour voir lesquelles ont des problèmes
      console.log(`\n   📦 Toutes les garanties:`);
      for (const item of quote.items) {
        const prime = parseFloat(item.prime);
        console.log(`      ${item.guarantee.code.padEnd(30)} ${prime.toString().padStart(10)} DT`);
      }
    }

    // Résumé
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ:\n');

    const quotesAvantEmail = trQuotes.filter(q => q.createdAt < emailDate);
    const quotesApresEmail = trQuotes.filter(q => q.createdAt >= emailDate);

    console.log(`   Devis créés AVANT l'email (avant 11:01): ${quotesAvantEmail.length}`);
    console.log(`   Devis créés APRÈS l'email (après 11:01): ${quotesApresEmail.length}`);

    if (quotesAvantEmail.length > 0) {
      console.log(`\n   📋 Devis créés AVANT l'email:`);
      quotesAvantEmail.forEach(q => {
        console.log(`      ${q.quoteNumber} - ${q.createdAt.toISOString()}`);
      });
    }

    if (quotesApresEmail.length > 0) {
      console.log(`\n   📋 Devis créés APRÈS l'email:`);
      quotesApresEmail.forEach(q => {
        console.log(`      ${q.quoteNumber} - ${q.createdAt.toISOString()}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎯 CONCLUSION:\n');
    console.log('   Le client a probablement testé un des devis ci-dessus');
    console.log('   et a constaté que les réductions n\'étaient pas appliquées.');
    console.log('\n   Cherchons maintenant les devis avec FRANCHISE > 0%...\n');

    // Chercher spécifiquement les devis avec franchise
    const quotesAvecFranchise = trQuotes.filter(q => 
      q.simulation.franchiseRate && q.simulation.franchiseRate > 0
    );

    if (quotesAvecFranchise.length > 0) {
      console.log('='.repeat(80));
      console.log(`🎯 DEVIS TR AVEC FRANCHISE (${quotesAvecFranchise.length}):\n`);
      
      quotesAvecFranchise.forEach(q => {
        console.log(`   ${q.quoteNumber}`);
        console.log(`      Franchise: ${q.simulation.franchiseRate}%`);
        console.log(`      Heure: ${q.createdAt.toISOString()}`);
        console.log(`      Compagnie: ${q.company.name}`);
        console.log('');
      });

      console.log('   👆 C\'est probablement UN DE CES DEVIS que le client a testé !');
    } else {
      console.log('⚠️  Aucun devis TR avec franchise trouvé ce jour-là');
      console.log('   Le client parlait peut-être de la franchise 0% ?');
    }

    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  }
})()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
