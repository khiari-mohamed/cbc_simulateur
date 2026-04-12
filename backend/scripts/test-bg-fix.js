const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

  // 2. Créer un nouveau devis avec les mêmes paramètres
  console.log('\n' + '='.repeat(80));
  console.log('\n🔄 Création d\'un NOUVEAU devis avec les mêmes paramètres...\n');

  const PricingEngineService = require('../src/pricing-engine/pricing-engine.service').PricingEngineService;
  const ReductionRatesService = require('../src/pricing-engine/reduction-rates.service').ReductionRatesService;
  const FormulaEvaluatorService = require('../src/pricing-engine/formula-evaluator.service').FormulaEvaluatorService;
  const GuaranteeAvailabilityService = require('../src/guarantee-availability/guarantee-availability.service').GuaranteeAvailabilityService;
  const UsageFeeConfigService = require('../src/usage-fee-config/usage-fee-config.service').UsageFeeConfigService;

  const reductionRatesService = new ReductionRatesService(prisma);
  const formulaEvaluator = new FormulaEvaluatorService();
  const guaranteeAvailabilityService = new GuaranteeAvailabilityService(prisma);
  const usageFeeConfigService = new UsageFeeConfigService(prisma);
  
  const pricingEngine = new PricingEngineService(
    prisma,
    reductionRatesService,
    formulaEvaluator,
    guaranteeAvailabilityService,
    usageFeeConfigService,
  );

  const vehicle = {
    fiscalHorsepower: oldQuote.simulation.vehicle.fiscalHorsepower,
    numberOfSeats: oldQuote.simulation.vehicle.numberOfSeats,
    newValue: oldQuote.simulation.vehicle.newValue,
    marketValue: oldQuote.simulation.vehicle.marketValue,
    firstCirculationDate: oldQuote.simulation.vehicle.firstCirculationDate,
  };

  const simulation = {
    bonusMalus: oldQuote.simulation.bonusMalus,
    usageId: oldQuote.simulation.usageId,
    formulaType: oldQuote.simulation.formulaType,
    selectedGuarantees: [
      'RC', 'CAS', 'VOL', 'INCENDIE', 'PERSONNES_TRANSPORTEES', 'ASSISTANCE',
      'TOUS_RISQUES_ZERO', 'BG', 'CATASTROPHES_NATURELLES', 'DOMMAGES_EMEUTES',
      'ASSURANCE_CONDUCTEUR'
    ],
    selectedCapitals: {
      BG: oldBG.capital,
      PERSONNES_TRANSPORTEES: oldQuote.items.find(i => i.guarantee.code === 'PERSONNES_TRANSPORTEES').capital,
      ASSURANCE_CONDUCTEUR: oldQuote.items.find(i => i.guarantee.code === 'ASSURANCE_CONDUCTEUR').capital,
    },
    franchiseRate: oldQuote.simulation.franchiseRate,
    fractionnement: oldQuote.fractionnement,
  };

  const result = await pricingEngine.calculatePremium(
    oldQuote.companyId,
    vehicle,
    simulation,
    oldQuote.simulation.conventionId,
  );

  console.log('✅ Calcul terminé\n');

  const newBG = result.items.find(i => i.guaranteeCode === 'BG');
  console.log('💰 BG (après fix):');
  console.log(`Prime: ${newBG.prime} DT`);
  console.log(`Capital: ${newBG.capital} DT`);

  // 3. Sauvegarder le nouveau devis
  const newQuoteNumber = `Q${Date.now()}${Math.floor(Math.random() * 1000)}`;
  
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
      fractionnement: simulation.fractionnement,
      pricingSnapshot: result,
      items: {
        create: result.items.map(item => ({
          guaranteeId: item.guaranteeId,
          capital: item.capital,
          prime: item.prime,
          isNotCovered: item.isNotCovered || false,
        })),
      },
    },
  });

  console.log(`\n✅ Nouveau devis créé: ${newQuoteNumber}`);

  // 4. Comparaison
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 COMPARAISON FINALE:\n');

  console.log('Garantie BG:');
  console.log(`ANCIEN devis (${oldQuote.quoteNumber}): ${oldBG.prime} DT`);
  console.log(`NOUVEAU devis (${newQuoteNumber}): ${newBG.prime} DT`);
  console.log(`Différence: ${parseFloat(newBG.prime) - parseFloat(oldBG.prime)} DT`);

  if (parseFloat(newBG.prime) > 0 && parseFloat(oldBG.prime) === 0) {
    console.log('\n🎉 LE FIX FONCTIONNE !');
    console.log('BG est maintenant calculé correctement (prime > 0 DT)');
  } else if (parseFloat(newBG.prime) === 0) {
    console.log('\n⚠️  BG est toujours à 0 DT');
    console.log('Le fix n\'a peut-être pas été appliqué correctement');
  }

  console.log('\n' + '='.repeat(80));
}

testBGFix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
