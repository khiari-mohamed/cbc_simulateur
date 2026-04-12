import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPdfLogic() {
  console.log('🔍 TEST: Simulation de la logique d\'affichage du PDF\n');
  console.log('='.repeat(80));
  
  // Get a recent quote with INCENDIE_EMEUTES
  const quote = await prisma.quote.findFirst({
    where: {
      items: {
        some: {
          guarantee: { code: 'INCENDIE_EMEUTES' }
        }
      }
    },
    include: {
      items: {
        include: { guarantee: true }
      },
      company: true,
      simulation: { 
        include: { vehicle: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!quote) {
    console.log('❌ Aucun devis trouvé');
    return;
  }

  console.log(`\n📄 Devis: ${quote.quoteNumber}`);
  console.log(`Compagnie: ${quote.company.name}`);
  console.log(`Formule: ${quote.simulation?.formulaType}\n`);

  // Get bundlings for this company
  const bundlings = await prisma.guaranteeBundling.findMany({
    where: {
      companyId: quote.companyId,
      isActive: true,
      OR: [
        { formulaType: null },
        { formulaType: quote.simulation?.formulaType }
      ]
    },
    include: {
      parentGuarantee: true,
      includedGuarantee: true,
    },
  });

  const bundlingMap = new Map<string, string[]>();
  for (const bundling of bundlings) {
    const parentCode = bundling.parentGuarantee.code;
    if (!bundlingMap.has(parentCode)) {
      bundlingMap.set(parentCode, []);
    }
    bundlingMap.get(parentCode)!.push(bundling.includedGuarantee.code);
  }

  console.log('📦 Bundlings actifs:');
  if (bundlingMap.size === 0) {
    console.log('   Aucun bundling\n');
  } else {
    bundlingMap.forEach((included, parent) => {
      console.log(`   ${parent} → [${included.join(', ')}]`);
    });
    console.log('');
  }

  // Simulate PDF logic
  console.log('🖨️  SIMULATION DE LA LOGIQUE PDF:\n');
  console.log('─'.repeat(80));

  const processedGuarantees = new Set<string>();
  let displayedCount = 0;
  let skippedCount = 0;

  quote.items.forEach((item: any) => {
    const guaranteeCode = item.guarantee.code;
    const guaranteeName = item.guarantee.nameFr;
    const prime = Number(item.prime);
    const isNotCovered = item.isNotCovered || false;

    // Check if already processed
    if (processedGuarantees.has(guaranteeCode)) {
      console.log(`⏭️  SKIP: ${guaranteeCode.padEnd(30)} | Déjà traité`);
      skippedCount++;
      return;
    }

    // Check if this guarantee has bundled guarantees
    const includedCodes = bundlingMap.get(guaranteeCode);

    if (includedCodes && includedCodes.length > 0) {
      // Check if all included guarantees exist in quote items
      const includedItems = includedCodes
        .map(code => quote.items.find((i: any) => i.guarantee.code === code))
        .filter(Boolean);

      if (includedItems.length === includedCodes.length) {
        // All included guarantees found - display as combined row
        const combinedPrime = [item, ...includedItems]
          .reduce((sum, i) => sum + Number(i.prime), 0);

        processedGuarantees.add(guaranteeCode);
        includedCodes.forEach(code => processedGuarantees.add(code));

        const includedNames = includedItems.map((i: any) => i.guarantee.nameFr).join(' + ');
        
        console.log(`📦 COMBINED: ${guaranteeCode.padEnd(30)} | ${guaranteeName.padEnd(40)} | Prime: ${combinedPrime.toString().padStart(8)} DT`);
        console.log(`             Inclut: ${includedNames}`);
        displayedCount++;
        return;
      }
    }

    // Display as individual row
    processedGuarantees.add(guaranteeCode);
    
    const status = isNotCovered ? '(NON ACCORDÉE)' : (prime === 0 ? '(Gratuit)' : '');
    const icon = guaranteeCode === 'INCENDIE_EMEUTES' ? '🔥' : '✅';
    
    console.log(`${icon} DISPLAY: ${guaranteeCode.padEnd(30)} | ${guaranteeName.padEnd(40)} | Prime: ${prime.toString().padStart(8)} DT ${status}`);
    displayedCount++;
  });

  console.log('─'.repeat(80));
  console.log(`\n📊 RÉSUMÉ:`);
  console.log(`   Total items: ${quote.items.length}`);
  console.log(`   Affichés: ${displayedCount}`);
  console.log(`   Skippés: ${skippedCount}`);
  console.log(`   Traités: ${processedGuarantees.size}`);

  // Check if INCENDIE_EMEUTES was displayed
  const incendieEmeutesItem = quote.items.find((i: any) => i.guarantee.code === 'INCENDIE_EMEUTES');
  if (incendieEmeutesItem) {
    if (processedGuarantees.has('INCENDIE_EMEUTES')) {
      console.log(`\n✅ INCENDIE_EMEUTES a été traitée et devrait être affichée`);
    } else {
      console.log(`\n❌ INCENDIE_EMEUTES n'a PAS été traitée - BUG TROUVÉ!`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 CONCLUSION:');
  console.log('Si INCENDIE_EMEUTES apparaît avec ✅ DISPLAY ci-dessus,');
  console.log('alors le problème est ailleurs (peut-être dans le HTML généré).');
  console.log('\nSi elle n\'apparaît pas, le problème est dans la logique de traitement.');
}

testPdfLogic()
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
