/**
 * 🔍 VÉRIFICATION DE TOUTES LES GARANTIES
 * 
 * Le client dit "pour certaines couvertures"
 * Vérifions TOUTES les garanties, pas seulement TR
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('🔍 VÉRIFICATION DE TOUTES LES GARANTIES\n');
  console.log('='.repeat(80));

  try {
    // Analyser les 2 devis du 10 avril
    const quoteNumbers = [
      'Q20261775812913755774', // AL BARAKA
      'Q20261775812913778843'  // LLOYD
    ];

    for (const quoteNumber of quoteNumbers) {
      const quote = await prisma.quote.findUnique({
        where: { quoteNumber },
        include: {
          items: { include: { guarantee: true } },
          simulation: {
            include: { vehicle: true }
          },
          company: true
        }
      });

      if (!quote) continue;

      console.log(`\n📋 DEVIS: ${quoteNumber}`);
      console.log(`   Compagnie: ${quote.company.name}`);
      console.log(`   Convention: ${quote.simulation.conventionId}`);
      console.log('─'.repeat(80));

      const vehicle = quote.simulation.vehicle;
      const vn = parseFloat(vehicle.newValue);
      const vv = parseFloat(vehicle.marketValue);
      const conventionId = quote.simulation.conventionId;

      // Pour chaque garantie, vérifier si une réduction devrait être appliquée
      for (const item of quote.items) {
        const guarantee = item.guarantee;
        const primeActuelle = parseFloat(item.prime);

        console.log(`\n   📦 ${guarantee.code}`);
        console.log(`      Prime actuelle: ${primeActuelle} DT`);

        if (!conventionId) {
          console.log(`      ⚠️  Pas de convention`);
          continue;
        }

        // Chercher les règles de réduction pour cette garantie
        const reductionRules = await prisma.conventionReductionRule.findMany({
          where: {
            conventionId: conventionId,
            companyId: quote.companyId,
            guaranteeId: guarantee.id,
            isActive: true
          }
        });

        if (reductionRules.length === 0) {
          console.log(`      ℹ️  Aucune réduction configurée`);
          continue;
        }

        console.log(`      Réductions configurées: ${reductionRules.length}`);

        // Trouver la règle applicable
        const applicableRules = reductionRules.filter(rule => {
          // Vérifier formulaType
          if (rule.formulaType && rule.formulaType !== quote.simulation.formulaType) {
            return false;
          }

          // Vérifier metric et valeur
          let metricValue;
          if (rule.metric === 'NEW_VALUE') {
            metricValue = vn;
          } else if (rule.metric === 'MARKET_VALUE') {
            metricValue = vv;
          } else {
            return false;
          }

          if (rule.minValue && metricValue < parseFloat(rule.minValue)) return false;
          if (rule.maxValue && metricValue > parseFloat(rule.maxValue)) return false;

          // Vérifier dates
          const now = quote.createdAt;
          if (rule.validFrom > now) return false;
          if (rule.validTo && rule.validTo < now) return false;

          return true;
        });

        if (applicableRules.length === 0) {
          console.log(`      ⚠️  Aucune règle applicable`);
          continue;
        }

        // Trier par priorité
        applicableRules.sort((a, b) => b.priority - a.priority);
        const bestRule = applicableRules[0];

        console.log(`      Réduction applicable: ${bestRule.discountPercent}% (metric: ${bestRule.metric})`);

        // Récupérer la règle de pricing pour calculer la prime de base
        const pricingRule = await prisma.pricingRule.findFirst({
          where: {
            companyId: quote.companyId,
            guaranteeId: guarantee.id,
            isActive: true
          }
        });

        if (!pricingRule) {
          console.log(`      ⚠️  Règle de pricing non trouvée`);
          continue;
        }

        // Calculer la prime de base selon le type de garantie
        let primeBase = 0;

        if (pricingRule.fixedPremium && pricingRule.ratePercentage) {
          // Formule: (valeur × taux) + fixe
          const valeur = bestRule.metric === 'NEW_VALUE' ? vn : vv;
          primeBase = (valeur * parseFloat(pricingRule.ratePercentage)) + parseFloat(pricingRule.fixedPremium);
        } else if (pricingRule.fixedPremium) {
          // Fixe seulement
          primeBase = parseFloat(pricingRule.fixedPremium);
        } else {
          console.log(`      ⚠️  Impossible de calculer la prime de base`);
          continue;
        }

        // Appliquer la réduction
        const primeAvecReduction = primeBase * (1 - parseFloat(bestRule.discountPercent) / 100);

        console.log(`      Prime base: ${primeBase.toFixed(3)} DT`);
        console.log(`      Prime attendue (avec réduction): ${primeAvecReduction.toFixed(3)} DT`);
        console.log(`      Prime actuelle: ${primeActuelle} DT`);

        const diff = Math.abs(primeActuelle - primeAvecReduction);
        if (diff > 0.01) {
          console.log(`      🚨 BUG: Différence de ${diff.toFixed(3)} DT`);
          console.log(`      → La réduction de ${bestRule.discountPercent}% n'a PAS été appliquée !`);
        } else {
          console.log(`      ✅ CORRECT`);
        }
      }

      console.log('\n' + '─'.repeat(80));
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎯 CONCLUSION:\n');
    console.log('   Si toutes les garanties sont correctes, alors:');
    console.log('   → Le client parlait peut-être d\'anciens devis (6 avril)');
    console.log('   → Ou d\'une autre franchise (1%, 4%)');
    console.log('   → Ou le problème a été corrigé entre temps');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  }
})()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
