const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeNote5() {
  console.log('🔍 ANALYSE COMPLÈTE NOTE 5 : Devis du 10 avril 2026\n');
  console.log('='.repeat(80));

  const quotes = await prisma.quote.findMany({
    where: {
      createdAt: {
        gte: new Date('2026-04-10T00:00:00.000Z'),
        lte: new Date('2026-04-10T23:59:59.999Z'),
      },
      simulation: {
        formulaType: 'TOUS_RISQUES_0',
      },
    },
    include: {
      company: true,
      simulation: {
        include: {
          convention: true,
          vehicle: true,
        },
      },
      items: {
        include: {
          guarantee: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`\n✅ Trouvé ${quotes.length} devis TR le 10 avril 2026\n`);

  for (const quote of quotes) {
    const sim = quote.simulation;
    console.log('='.repeat(80));
    console.log(`\n📋 DEVIS: ${quote.quoteNumber}`);
    console.log(`Heure: ${quote.createdAt.toISOString()}`);
    console.log(`Compagnie: ${quote.company.name}`);
    console.log(`VN: ${sim.vehicle.newValue} DT`);
    console.log(`Franchise: ${sim.franchiseRate}%`);
    console.log(`Convention: ${sim.conventionId || 'Aucune'}`);

    console.log('\n📦 ANALYSE DES GARANTIES:\n');

    for (const item of quote.items) {
      const guarantee = item.guarantee;
      
      console.log(`\n🔹 ${guarantee.code} (${guarantee.nameFr})`);
      console.log(`   Prime actuelle: ${item.prime} DT`);
      console.log(`   Capital: ${item.capital} DT`);
      console.log(`   Non couverte: ${item.isNotCovered ? 'OUI' : 'NON'}`);

      if (item.isNotCovered) {
        console.log(`   ⚠️  Garantie NON COUVERTE`);
        continue;
      }

      const rule = await prisma.pricingRule.findFirst({
        where: {
          companyId: quote.companyId,
          guaranteeId: guarantee.id,
          isActive: true,
          OR: [
            { franchiseRate: sim.franchiseRate },
            { franchiseRate: null },
          ],
        },
        orderBy: [
          { franchiseRate: 'desc' },
        ],
      });

      if (!rule) {
        console.log(`   ❌ Aucune règle de pricing trouvée`);
        continue;
      }

      console.log(`   📋 Règle: ${rule.id}`);
      console.log(`   Taux: ${rule.ratePercentage}%`);
      console.log(`   Fixe: ${rule.fixedPremium} DT`);
      console.log(`   Réduction règle: ${rule.reductionRate || 0}%`);
      
      if (rule.formula) {
        console.log(`   🔧 Formule custom: ${rule.formula}`);
      } else {
        console.log(`   🔧 Formule: (VN × ${rule.ratePercentage}) + ${rule.fixedPremium}`);
      }

      let expectedPrime;
      if (rule.formula) {
        const variables = {
          VN: parseFloat(sim.vehicle.newValue),
          rate: parseFloat(rule.ratePercentage || 0),
          fixed: parseFloat(rule.fixedPremium || 0),
          reduction: rule.reductionRate ? (1 - parseFloat(rule.reductionRate) / 100) : 1,
          franchise: parseFloat(sim.franchiseRate || 0),
        };
        
        try {
          let formula = rule.formula;
          Object.keys(variables).forEach(key => {
            formula = formula.replace(new RegExp(key, 'g'), variables[key]);
          });
          expectedPrime = eval(formula);
        } catch (e) {
          console.log(`   ❌ Erreur d'évaluation de la formule: ${e.message}`);
          continue;
        }
      } else {
        expectedPrime = parseFloat(sim.vehicle.newValue) * parseFloat(rule.ratePercentage || 0) + parseFloat(rule.fixedPremium || 0);
        
        if (rule.reductionRate && parseFloat(rule.reductionRate) > 0) {
          expectedPrime *= (1 - parseFloat(rule.reductionRate) / 100);
        }
      }

      if (sim.conventionId) {
        const reductions = await prisma.conventionReductionRule.findMany({
          where: {
            conventionId: sim.conventionId,
            companyId: quote.companyId,
            guarantee: {
              code: guarantee.code,
            },
            isActive: true,
            validFrom: { lte: quote.createdAt },
            OR: [
              { validTo: { gte: quote.createdAt } },
              { validTo: null },
            ],
          },
        });

        if (reductions.length > 0) {
          console.log(`   🎯 Réductions de convention: ${reductions.length}`);
          
          let bestReduction = 0;
          for (const red of reductions) {
            if (red.metric === 'NEW_VALUE') {
              const minOk = !red.minValue || parseFloat(sim.vehicle.newValue) >= parseFloat(red.minValue);
              const maxOk = !red.maxValue || parseFloat(sim.vehicle.newValue) <= parseFloat(red.maxValue);
              
              if (minOk && maxOk && parseFloat(red.discountPercent) > bestReduction) {
                bestReduction = parseFloat(red.discountPercent);
              }
            }
          }

          if (bestReduction > 0) {
            console.log(`   ✅ Meilleure réduction: ${bestReduction}%`);
            const primeBeforeConvention = expectedPrime;
            expectedPrime *= (1 - bestReduction / 100);
            console.log(`   Prime avant convention: ${primeBeforeConvention.toFixed(3)} DT`);
            console.log(`   Prime après convention: ${expectedPrime.toFixed(3)} DT`);
          }
        }
      }

      const actualPrime = parseFloat(item.prime);
      const diff = Math.abs(actualPrime - expectedPrime);
      
      console.log(`\n   💰 COMPARAISON:`);
      console.log(`   Prime actuelle: ${actualPrime} DT`);
      console.log(`   Prime attendue: ${expectedPrime.toFixed(3)} DT`);
      console.log(`   Différence: ${diff.toFixed(3)} DT`);
      
      if (diff > 0.01) {
        console.log(`   ❌ INCORRECT !`);
      } else {
        console.log(`   ✅ CORRECT`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n🎯 ANALYSE TERMINÉE\n');
}

analyzeNote5()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
