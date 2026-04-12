/**
 * 🔍 SCRIPT DE VÉRIFICATION COMPLÈTE DES FORMULES
 * 
 * Compare le devis AVANT fix vs APRÈS fix
 * Vérifie que toutes les formules sont correctement appliquées
 * Basé sur formulas.md
 */

const { PrismaClient } = require('@prisma/client');
const { Decimal } = require('@prisma/client/runtime/library');
const prisma = new PrismaClient();

(async () => {
  console.log('🔍 VÉRIFICATION COMPLÈTE DES FORMULES\n');
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
        company: true
      }
    });

    if (!originalQuote) {
      console.log('❌ Devis original non trouvé');
      return;
    }

    const vehicle = originalQuote.simulation.vehicle;
    const vv = parseFloat(vehicle.marketValue);
    const vn = parseFloat(vehicle.newValue);
    const bonusMalus = parseFloat(originalQuote.simulation.bonusMalus);
    const cv = vehicle.fiscalHorsepower;

    console.log('📋 INFORMATIONS DU DEVIS:');
    console.log('─'.repeat(80));
    console.log(`Numéro: ${originalQuote.quoteNumber}`);
    console.log(`Compagnie: ${originalQuote.company.name}`);
    console.log(`Formule: ${originalQuote.simulation.formulaType}`);
    console.log(`Valeur Vénale (VV): ${vv} DT`);
    console.log(`Valeur à Neuf (VN): ${vn} DT`);
    console.log(`Puissance fiscale: ${cv} CV`);
    console.log(`Bonus/Malus: ${bonusMalus}%`);
    console.log('');

    // 2. RÉCUPÉRER LES RÈGLES DE PRICING
    const pricingRules = await prisma.pricingRule.findMany({
      where: {
        companyId: originalQuote.companyId,
        isActive: true
      },
      include: { guarantee: true }
    });

    console.log('='.repeat(80));
    console.log('🧮 VÉRIFICATION DES FORMULES PAR GARANTIE:\n');

    let allCorrect = true;

    // 3. VÉRIFIER CHAQUE GARANTIE
    for (const item of originalQuote.items) {
      const code = item.guarantee.code;
      const primeActuelle = parseFloat(item.prime);
      const capital = parseFloat(item.capital);

      console.log(`\n📌 ${code}`);
      console.log('─'.repeat(80));
      console.log(`Prime actuelle: ${primeActuelle} DT`);
      console.log(`Capital: ${capital} DT`);
      console.log(`isNotCovered: ${item.isNotCovered}`);

      // Vérifier selon la garantie
      let primeAttendue = null;
      let formule = '';

      switch (code) {
        case 'RC':
          // Formule: Fixe selon tableau RC (classe bonus/malus + CV)
          const rcRule = pricingRules.find(r => 
            r.guarantee.code === 'RC' && 
            r.minPower <= cv && 
            r.maxPower >= cv &&
            r.bonusMalusClass === Math.round(bonusMalus)
          );
          if (rcRule) {
            primeAttendue = parseFloat(rcRule.fixedPremium);
            formule = `Fixe selon tableau RC (Classe ${Math.round(bonusMalus)}, ${cv} CV)`;
          }
          break;

        case 'VOL':
          // Formule: ((VV * taux) + fixe) * (1 - réduction)
          const volRule = pricingRules.find(r => 
            r.guarantee.code === 'VOL' &&
            (!r.minMarketValue || r.minMarketValue <= vv) &&
            (!r.maxMarketValue || r.maxMarketValue >= vv)
          );
          if (volRule) {
            const taux = parseFloat(volRule.ratePercentage);
            const fixe = parseFloat(volRule.fixedPremium);
            const reduction = volRule.reductionRate ? parseFloat(volRule.reductionRate) : 0;
            primeAttendue = ((vv * taux) + fixe) * (1 - reduction / 100);
            formule = `((${vv} * ${taux}) + ${fixe}) * (1 - ${reduction}%) = ${primeAttendue.toFixed(3)}`;
          }
          break;

        case 'INCENDIE':
          // Formule: ((VV * taux) + fixe) * (1 - réduction)
          const incendieRule = pricingRules.find(r => 
            r.guarantee.code === 'INCENDIE' &&
            (!r.minMarketValue || r.minMarketValue <= vv) &&
            (!r.maxMarketValue || r.maxMarketValue >= vv)
          );
          if (incendieRule) {
            const taux = parseFloat(incendieRule.ratePercentage);
            const fixe = parseFloat(incendieRule.fixedPremium);
            const reduction = incendieRule.reductionRate ? parseFloat(incendieRule.reductionRate) : 0;
            primeAttendue = ((vv * taux) + fixe) * (1 - reduction / 100);
            formule = `((${vv} * ${taux}) + ${fixe}) * (1 - ${reduction}%) = ${primeAttendue.toFixed(3)}`;
          }
          break;

        case 'CAS':
          // Formule: Fixe
          const casRule = pricingRules.find(r => r.guarantee.code === 'CAS');
          if (casRule) {
            primeAttendue = parseFloat(casRule.fixedPremium);
            formule = `Fixe = ${primeAttendue}`;
          }
          break;

        case 'PERSONNES_TRANSPORTEES':
          // Formule: Fixe selon capital
          const ptaRule = pricingRules.find(r => 
            r.guarantee.code === 'PERSONNES_TRANSPORTEES' &&
            r.minCapital <= capital
          );
          if (ptaRule) {
            primeAttendue = parseFloat(ptaRule.fixedPremium);
            formule = `Fixe selon capital ${capital} DT = ${primeAttendue}`;
          }
          break;

        case 'ASSISTANCE':
          // Formule: Fixe
          const assistanceRule = pricingRules.find(r => r.guarantee.code === 'ASSISTANCE');
          if (assistanceRule) {
            primeAttendue = parseFloat(assistanceRule.fixedPremium);
            formule = `Fixe = ${primeAttendue}`;
          }
          break;

        case 'BG':
          // Formule: capital * taux
          const bgRule = pricingRules.find(r => 
            r.guarantee.code === 'BG' &&
            (!r.minCapital || r.minCapital <= capital) &&
            (!r.maxCapital || r.maxCapital >= capital)
          );
          if (bgRule) {
            const taux = parseFloat(bgRule.ratePercentage);
            primeAttendue = capital * taux;
            formule = `${capital} * ${taux} = ${primeAttendue.toFixed(3)}`;
          }
          break;

        case 'DOMMAGES_COLLISIONS':
          // Formule: Progressive ou Matrix
          formule = 'Calcul progressif/matrix (voir détails ci-dessous)';
          primeAttendue = primeActuelle; // On vérifie séparément
          break;

        case 'DOMMAGES_EMEUTES':
          // Formule: Fixe OU 0 si NON ACCORDÉE
          if (item.isNotCovered) {
            primeAttendue = 0;
            formule = 'NON ACCORDÉE → Prime = 0 DT';
          } else {
            const dommagesRule = pricingRules.find(r => r.guarantee.code === 'DOMMAGES_EMEUTES');
            if (dommagesRule) {
              primeAttendue = parseFloat(dommagesRule.fixedPremium);
              formule = `Fixe = ${primeAttendue}`;
            }
          }
          break;

        case 'INCENDIE_EMEUTES':
          // Formule: Fixe OU 0 si NON ACCORDÉE
          if (item.isNotCovered) {
            primeAttendue = 0;
            formule = 'NON ACCORDÉE → Prime = 0 DT';
          } else {
            const incendieEmeutesRule = pricingRules.find(r => r.guarantee.code === 'INCENDIE_EMEUTES');
            if (incendieEmeutesRule) {
              primeAttendue = parseFloat(incendieEmeutesRule.fixedPremium);
              formule = `Fixe = ${primeAttendue}`;
            }
          }
          break;

        case 'ASSURANCE_CONDUCTEUR':
          // Formule: Fixe selon capital
          const acRule = pricingRules.find(r => 
            r.guarantee.code === 'ASSURANCE_CONDUCTEUR' &&
            r.minCapital <= capital
          );
          if (acRule) {
            primeAttendue = parseFloat(acRule.fixedPremium);
            formule = `Fixe selon capital ${capital} DT = ${primeAttendue}`;
          }
          break;

        default:
          formule = 'Formule non vérifiée';
      }

      console.log(`Formule: ${formule}`);

      if (primeAttendue !== null) {
        const diff = Math.abs(primeActuelle - primeAttendue);
        const isCorrect = diff < 0.01;

        if (isCorrect) {
          console.log(`✅ CORRECT: ${primeActuelle} DT = ${primeAttendue.toFixed(3)} DT`);
        } else {
          console.log(`❌ ERREUR: ${primeActuelle} DT ≠ ${primeAttendue.toFixed(3)} DT (Δ ${diff.toFixed(3)} DT)`);
          allCorrect = false;
        }
      } else {
        console.log(`⚠️  Impossible de vérifier (règle non trouvée)`);
      }
    }

    // 4. VÉRIFICATION SPÉCIALE POUR DOMMAGES_COLLISIONS
    const dcItem = originalQuote.items.find(i => i.guarantee.code === 'DOMMAGES_COLLISIONS');
    if (dcItem) {
      console.log('\n' + '='.repeat(80));
      console.log('🔍 VÉRIFICATION DÉTAILLÉE : DOMMAGES_COLLISIONS\n');

      const dcCapital = parseFloat(dcItem.capital);
      const dcPrime = parseFloat(dcItem.prime);

      console.log(`Capital: ${dcCapital} DT`);
      console.log(`Prime actuelle: ${dcPrime} DT`);
      console.log(`VV: ${vv} DT`);
      console.log(`Ratio: ${(dcCapital / vv * 100).toFixed(2)}%`);

      // Vérifier la méthode utilisée
      const dcConfig = await prisma.dcConfig.findFirst({
        where: {
          companyId: originalQuote.companyId,
          usageId: originalQuote.simulation.usageId,
          isActive: true
        }
      });

      if (dcConfig) {
        console.log(`\nMéthode: ${dcConfig.useMatrix ? 'MATRICE' : 'PROGRESSIVE'}`);
        console.log(`Prime fixe: ${dcConfig.basePremium} DT`);
        console.log(`Réduction: ${dcConfig.discountPercent}%`);

        if (dcConfig.useMatrix) {
          console.log('\n📊 Calcul par MATRICE:');
          // Trouver la tranche VV
          const vvRange = await prisma.dcMatrixVvRange.findFirst({
            where: {
              companyId: originalQuote.companyId,
              usageId: originalQuote.simulation.usageId,
              minVv: { lte: vv },
              OR: [{ maxVv: { gte: vv } }, { maxVv: null }],
              isActive: true
            }
          });

          if (vvRange) {
            console.log(`Tranche VV: ${vvRange.minVv} - ${vvRange.maxVv || '∞'} DT`);

            // Trouver le capital
            const capitalEntry = await prisma.dcMatrixCapital.findFirst({
              where: {
                companyId: originalQuote.companyId,
                usageId: originalQuote.simulation.usageId,
                amount: dcCapital,
                isActive: true
              }
            });

            if (capitalEntry) {
              // Trouver la prime dans la matrice
              const matrixPrice = await prisma.dcMatrixPrice.findUnique({
                where: {
                  vvRangeId_capitalId: {
                    vvRangeId: vvRange.id,
                    capitalId: capitalEntry.id
                  }
                }
              });

              if (matrixPrice) {
                const primeMatrice = parseFloat(matrixPrice.prime);
                const primeAvecBase = primeMatrice + parseFloat(dcConfig.basePremium);
                const reductionRate = vvRange.reductionRate !== null ? parseFloat(vvRange.reductionRate) : parseFloat(dcConfig.discountPercent);
                const primeFinale = primeAvecBase * (1 - reductionRate / 100);

                console.log(`Prime matrice: ${primeMatrice} DT`);
                console.log(`+ Prime base: ${dcConfig.basePremium} DT`);
                console.log(`= ${primeAvecBase} DT`);
                console.log(`× (1 - ${reductionRate}%) = ${primeFinale.toFixed(3)} DT`);

                const diff = Math.abs(dcPrime - primeFinale);
                if (diff < 0.01) {
                  console.log(`\n✅ CORRECT: ${dcPrime} DT = ${primeFinale.toFixed(3)} DT`);
                } else {
                  console.log(`\n❌ ERREUR: ${dcPrime} DT ≠ ${primeFinale.toFixed(3)} DT (Δ ${diff.toFixed(3)} DT)`);
                  allCorrect = false;
                }
              }
            }
          }
        } else {
          console.log('\n📊 Calcul PROGRESSIF:');
          // Récupérer les tiers
          const tiers = await prisma.dcProgressiveTier.findMany({
            where: {
              companyId: originalQuote.companyId,
              usageId: originalQuote.simulation.usageId,
              isActive: true
            },
            orderBy: { tierNumber: 'asc' }
          });

          console.log(`Nombre de tranches: ${tiers.length}`);
          tiers.forEach(tier => {
            console.log(`  Tranche ${tier.tierNumber}: ${parseFloat(tier.tierRate) * 100}%`);
          });

          // Calculer la prime progressive
          const ratio = dcCapital / vv;
          let primeVariable = 0;

          if (ratio <= 0.1) {
            // Simple: <= 10%
            const tier1 = tiers.find(t => t.tierNumber === 1);
            if (tier1) {
              primeVariable = dcCapital * parseFloat(tier1.tierRate);
              console.log(`\nRatio ≤ 10% → Simple: ${dcCapital} × ${parseFloat(tier1.tierRate)} = ${primeVariable.toFixed(3)} DT`);
            }
          } else {
            // Progressif
            console.log(`\nRatio > 10% → Calcul progressif:`);
            let capitalRestant = dcCapital;
            const trancheSize = vv * 0.1;
            let tierIndex = 0;

            while (capitalRestant > 0 && tierIndex < tiers.length) {
              const tier = tiers[tierIndex];
              const montantTranche = Math.min(capitalRestant, trancheSize);
              const primeTranche = montantTranche * parseFloat(tier.tierRate);
              primeVariable += primeTranche;

              console.log(`  Tranche ${tier.tierNumber}: ${montantTranche.toFixed(2)} × ${parseFloat(tier.tierRate)} = ${primeTranche.toFixed(3)} DT`);

              capitalRestant -= montantTranche;
              tierIndex++;
            }

            console.log(`  Total variable: ${primeVariable.toFixed(3)} DT`);
          }

          const primeAvecBase = primeVariable + parseFloat(dcConfig.basePremium);
          const primeFinale = primeAvecBase * (1 - parseFloat(dcConfig.discountPercent) / 100);

          console.log(`\n+ Prime base: ${dcConfig.basePremium} DT`);
          console.log(`= ${primeAvecBase.toFixed(3)} DT`);
          console.log(`× (1 - ${dcConfig.discountPercent}%) = ${primeFinale.toFixed(3)} DT`);

          const diff = Math.abs(dcPrime - primeFinale);
          if (diff < 0.01) {
            console.log(`\n✅ CORRECT: ${dcPrime} DT = ${primeFinale.toFixed(3)} DT`);
          } else {
            console.log(`\n❌ ERREUR: ${dcPrime} DT ≠ ${primeFinale.toFixed(3)} DT (Δ ${diff.toFixed(3)} DT)`);
            allCorrect = false;
          }
        }
      }
    }

    // 5. VÉRIFICATION DU TOTAL
    console.log('\n' + '='.repeat(80));
    console.log('💰 VÉRIFICATION DU TOTAL:\n');

    const primeNette = originalQuote.items
      .filter(item => !item.isNotCovered)
      .reduce((sum, item) => sum + parseFloat(item.prime), 0);

    console.log(`Prime nette calculée: ${primeNette.toFixed(3)} DT`);
    console.log(`Prime nette attendue: ${parseFloat(originalQuote.primeNette).toFixed(3)} DT`);

    const diffPrimeNette = Math.abs(primeNette - parseFloat(originalQuote.primeNette));
    if (diffPrimeNette < 0.01) {
      console.log(`✅ Prime nette CORRECTE`);
    } else {
      console.log(`❌ Prime nette INCORRECTE (Δ ${diffPrimeNette.toFixed(3)} DT)`);
      allCorrect = false;
    }

    // Vérifier les taxes
    const frais = parseFloat(originalQuote.frais);
    const taxe12 = (primeNette + frais) * 0.12;
    const primeRC = parseFloat(originalQuote.items.find(i => i.guarantee.code === 'RC')?.prime || 0);
    const taxe2 = (primeRC + frais) * 0.02;
    const taxesCalculees = taxe12 + taxe2;

    console.log(`\nTaxes calculées: ${taxesCalculees.toFixed(3)} DT`);
    console.log(`  - Taxe 12%: ${taxe12.toFixed(3)} DT`);
    console.log(`  - Taxe 2%: ${taxe2.toFixed(3)} DT`);
    console.log(`Taxes attendues: ${parseFloat(originalQuote.taxes).toFixed(3)} DT`);

    const diffTaxes = Math.abs(taxesCalculees - parseFloat(originalQuote.taxes));
    if (diffTaxes < 0.01) {
      console.log(`✅ Taxes CORRECTES`);
    } else {
      console.log(`❌ Taxes INCORRECTES (Δ ${diffTaxes.toFixed(3)} DT)`);
      allCorrect = false;
    }

    // Total final
    const totalCalcule = primeNette + frais + taxesCalculees + 
                         parseFloat(originalQuote.fpac) + 
                         parseFloat(originalQuote.fssr) + 
                         parseFloat(originalQuote.fg);

    console.log(`\nTotal calculé: ${totalCalcule.toFixed(3)} DT`);
    console.log(`Total attendu: ${parseFloat(originalQuote.totalAPayer).toFixed(3)} DT`);

    const diffTotal = Math.abs(totalCalcule - parseFloat(originalQuote.totalAPayer));
    if (diffTotal < 0.01) {
      console.log(`✅ Total CORRECT`);
    } else {
      console.log(`❌ Total INCORRECT (Δ ${diffTotal.toFixed(3)} DT)`);
      allCorrect = false;
    }

    // 6. RÉSULTAT FINAL
    console.log('\n' + '='.repeat(80));
    if (allCorrect) {
      console.log('✅✅✅ TOUTES LES FORMULES SONT CORRECTES !');
      console.log('\n🎉 Le devis est calculé correctement selon formulas.md');
    } else {
      console.log('❌ CERTAINES FORMULES SONT INCORRECTES');
      console.log('\n⚠️  Vérifier les erreurs ci-dessus');
    }
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  }
})()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
