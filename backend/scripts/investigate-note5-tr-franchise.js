/**
 * 🔍 INVESTIGATION NOTE 5 : TR avec franchise - calcul incorrect
 * 
 * Ce script :
 * 1. Cherche des devis TR (TOUS_RISQUES_0) avec franchise
 * 2. Vérifie le calcul de la prime
 * 3. Compare avec la formule attendue
 * 4. Détecte les erreurs de calcul
 */

const { PrismaClient } = require('@prisma/client');
const { Decimal } = require('@prisma/client/runtime/library');
const prisma = new PrismaClient();

(async () => {
  console.log('🔍 INVESTIGATION NOTE 5 : TR avec franchise\n');
  console.log('='.repeat(80));

  try {
    // 1. CHERCHER DES DEVIS TR AVEC FRANCHISE
    console.log('📋 Recherche de devis TOUS_RISQUES_0 avec franchise...\n');

    const trQuotes = await prisma.quote.findMany({
      where: {
        simulation: {
          formulaType: 'TOUS_RISQUES_0',
          franchiseRate: { not: null }
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
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (trQuotes.length === 0) {
      console.log('❌ Aucun devis TR avec franchise trouvé');
      console.log('\n💡 Essayons de chercher tous les devis TR (avec ou sans franchise)...\n');

      const allTrQuotes = await prisma.quote.findMany({
        where: {
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
          company: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      console.log(`📊 Trouvé ${allTrQuotes.length} devis TR (toutes franchises confondues):\n`);
      
      allTrQuotes.forEach(quote => {
        console.log(`  - ${quote.quoteNumber}`);
        console.log(`    Compagnie: ${quote.company.name}`);
        console.log(`    Franchise: ${quote.simulation.franchiseRate || 0}%`);
        console.log(`    Date: ${quote.createdAt.toISOString()}`);
        console.log('');
      });

      if (allTrQuotes.length === 0) {
        console.log('❌ Aucun devis TR trouvé dans la base');
        return;
      }

      // Utiliser le premier devis TR trouvé
      console.log('='.repeat(80));
      console.log('📋 Analyse du premier devis TR trouvé:\n');
      await analyzeQuote(allTrQuotes[0]);
      return;
    }

    console.log(`✅ Trouvé ${trQuotes.length} devis TR avec franchise\n`);

    // 2. ANALYSER CHAQUE DEVIS
    for (const quote of trQuotes) {
      console.log('='.repeat(80));
      console.log(`\n📋 DEVIS: ${quote.quoteNumber}\n`);
      await analyzeQuote(quote);
      console.log('\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  }
})()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

/**
 * Analyse un devis TR et vérifie le calcul
 */
async function analyzeQuote(quote) {
  const vehicle = quote.simulation.vehicle;
  const vn = parseFloat(vehicle.newValue);
  const franchiseRate = quote.simulation.franchiseRate || 0;

  console.log('📊 INFORMATIONS:');
  console.log(`   Compagnie: ${quote.company.name}`);
  console.log(`   Formule: ${quote.simulation.formulaType}`);
  console.log(`   Franchise: ${franchiseRate}%`);
  console.log(`   Valeur à Neuf: ${vn} DT`);
  console.log(`   Date: ${quote.createdAt.toISOString()}`);

  // Trouver l'item TR
  const trItem = quote.items.find(item => 
    item.guarantee.code === 'TOUS_RISQUES_ZERO' || 
    item.guarantee.systemRole === 'OPTIONAL_TOUS_RISQUES'
  );

  if (!trItem) {
    console.log('\n⚠️  Aucune garantie TR trouvée dans ce devis');
    return;
  }

  const primeActuelle = parseFloat(trItem.prime);
  console.log(`\n💰 Prime TR actuelle: ${primeActuelle} DT`);

  // Récupérer la règle de pricing
  const guarantee = await prisma.guarantee.findFirst({
    where: { systemRole: 'OPTIONAL_TOUS_RISQUES', isActive: true }
  });

  if (!guarantee) {
    console.log('❌ Garantie TR non trouvée');
    return;
  }

  const rule = await prisma.pricingRule.findFirst({
    where: {
      companyId: quote.companyId,
      guaranteeId: guarantee.id,
      franchiseRate: franchiseRate,
      isActive: true,
      AND: [
        {
          OR: [
            { minMarketValue: null },
            { minMarketValue: { lte: vn } }
          ]
        },
        {
          OR: [
            { maxMarketValue: null },
            { maxMarketValue: { gte: vn } }
          ]
        }
      ]
    }
  });

  if (!rule) {
    console.log(`\n❌ Aucune règle de pricing trouvée pour:`);
    console.log(`   - Compagnie: ${quote.company.name}`);
    console.log(`   - Franchise: ${franchiseRate}%`);
    console.log(`   - VN: ${vn} DT`);
    return;
  }

  console.log(`\n📋 RÈGLE DE PRICING TROUVÉE:`);
  console.log(`   ID: ${rule.id}`);
  console.log(`   Franchise: ${rule.franchiseRate}%`);
  console.log(`   Taux: ${rule.ratePercentage}`);
  console.log(`   Fixe: ${rule.fixedPremium} DT`);
  console.log(`   Réduction: ${rule.reductionRate || 0}%`);
  console.log(`   Formule custom: ${rule.formula || 'Non'}`);

  // Calculer la prime attendue
  let primeAttendue;

  if (rule.formula) {
    console.log(`\n🧮 CALCUL AVEC FORMULE CUSTOM:`);
    console.log(`   Formule: ${rule.formula}`);
    
    // Simuler l'évaluation de la formule
    const variables = {
      VN: vn,
      rate: parseFloat(rule.ratePercentage) || 0,
      fixed: parseFloat(rule.fixedPremium) || 0,
      reduction: rule.reductionRate ? (1 - parseFloat(rule.reductionRate) / 100) : 1,
      franchise: franchiseRate
    };
    
    console.log(`   Variables:`);
    console.log(`     VN = ${variables.VN}`);
    console.log(`     rate = ${variables.rate}`);
    console.log(`     fixed = ${variables.fixed}`);
    console.log(`     reduction = ${variables.reduction}`);
    console.log(`     franchise = ${variables.franchise}`);

    // Essayer d'évaluer la formule
    try {
      const formulaStr = rule.formula
        .replace(/VN/g, variables.VN)
        .replace(/rate/g, variables.rate)
        .replace(/fixed/g, variables.fixed)
        .replace(/reduction/g, variables.reduction)
        .replace(/franchise/g, variables.franchise);
      
      console.log(`   Formule évaluée: ${formulaStr}`);
      primeAttendue = eval(formulaStr);
      console.log(`   Résultat: ${primeAttendue.toFixed(3)} DT`);
    } catch (e) {
      console.log(`   ⚠️  Impossible d'évaluer la formule: ${e.message}`);
      primeAttendue = null;
    }
  } else {
    console.log(`\n🧮 CALCUL AVEC FORMULE PAR DÉFAUT:`);
    console.log(`   Formule: (VN × taux) + fixe`);
    
    const taux = parseFloat(rule.ratePercentage);
    const fixe = parseFloat(rule.fixedPremium);
    const reduction = rule.reductionRate ? parseFloat(rule.reductionRate) : 0;

    primeAttendue = (vn * taux) + fixe;
    console.log(`   = (${vn} × ${taux}) + ${fixe}`);
    console.log(`   = ${primeAttendue.toFixed(3)} DT`);

    if (reduction > 0) {
      const primeAvantReduction = primeAttendue;
      primeAttendue = primeAttendue * (1 - reduction / 100);
      console.log(`   Avec réduction ${reduction}%:`);
      console.log(`   = ${primeAvantReduction.toFixed(3)} × (1 - ${reduction}%)`);
      console.log(`   = ${primeAttendue.toFixed(3)} DT`);
    }
  }

  // Vérifier les réductions de convention
  if (quote.simulation.conventionId) {
    console.log(`\n🔍 Convention détectée: ${quote.simulation.conventionId}`);
    
    const reductionRules = await prisma.conventionReductionRule.findMany({
      where: {
        conventionId: quote.simulation.conventionId,
        companyId: quote.companyId,
        guarantee: { systemRole: 'OPTIONAL_TOUS_RISQUES' },
        formulaType: 'TOUS_RISQUES_0',
        isActive: true
      }
    });

    if (reductionRules.length > 0) {
      console.log(`   Réductions de convention trouvées: ${reductionRules.length}`);
      reductionRules.forEach(r => {
        console.log(`     - ${r.discountPercent}% (metric: ${r.metric})`);
      });

      // Appliquer la première réduction trouvée
      const reduction = reductionRules[0];
      const primeAvantReduction = primeAttendue;
      primeAttendue = primeAttendue * (1 - parseFloat(reduction.discountPercent) / 100);
      console.log(`   Prime après réduction convention:`);
      console.log(`   = ${primeAvantReduction.toFixed(3)} × (1 - ${reduction.discountPercent}%)`);
      console.log(`   = ${primeAttendue.toFixed(3)} DT`);
    } else {
      console.log(`   Aucune réduction de convention trouvée`);
    }
  }

  // Comparer
  console.log(`\n📊 COMPARAISON:`);
  console.log(`   Prime actuelle: ${primeActuelle} DT`);
  console.log(`   Prime attendue: ${primeAttendue ? primeAttendue.toFixed(3) : 'N/A'} DT`);

  if (primeAttendue !== null) {
    const diff = Math.abs(primeActuelle - primeAttendue);
    
    if (diff < 0.01) {
      console.log(`   ✅ CORRECT (Δ ${diff.toFixed(3)} DT)`);
    } else {
      console.log(`   ❌ INCORRECT (Δ ${diff.toFixed(3)} DT)`);
      console.log(`\n🚨 BUG DÉTECTÉ !`);
      console.log(`   La prime devrait être ${primeAttendue.toFixed(3)} DT`);
      console.log(`   Mais elle est ${primeActuelle} DT`);
    }
  }
}
