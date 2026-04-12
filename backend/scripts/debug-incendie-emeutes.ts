import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugIncendieEmeutes() {
  console.log('🔍 INVESTIGATION: Pourquoi INCENDIE_EMEUTES ne s\'affiche pas dans le PDF\n');
  console.log('='.repeat(80));
  
  // ========================================
  // ÉTAPE 1: Vérifier les BUNDLINGS
  // ========================================
  console.log('\n📦 ÉTAPE 1: Vérification des BUNDLINGS\n');
  
  const bundlings = await prisma.guaranteeBundling.findMany({
    where: {
      OR: [
        { includedGuarantee: { code: 'INCENDIE_EMEUTES' } },
        { parentGuarantee: { code: 'INCENDIE_EMEUTES' } }
      ]
    },
    include: {
      parentGuarantee: { select: { code: true, nameFr: true } },
      includedGuarantee: { select: { code: true, nameFr: true } },
      company: { select: { name: true } },
    }
  });

  if (bundlings.length === 0) {
    console.log('✅ Aucun bundling trouvé - La garantie INCENDIE_EMEUTES est indépendante');
  } else {
    console.log(`⚠️  ${bundlings.length} bundling(s) trouvé(s):\n`);
    bundlings.forEach((b, index) => {
      console.log(`   Bundling #${index + 1}:`);
      if (b.includedGuarantee.code === 'INCENDIE_EMEUTES') {
        console.log(`   ❌ INCENDIE_EMEUTES est INCLUDED dans: ${b.parentGuarantee.nameFr} (${b.parentGuarantee.code})`);
        console.log(`      → Cela signifie que INCENDIE_EMEUTES est cachée dans le PDF`);
        console.log(`      → Elle est affichée avec ${b.parentGuarantee.nameFr}`);
      }
      if (b.parentGuarantee.code === 'INCENDIE_EMEUTES') {
        console.log(`   📦 INCENDIE_EMEUTES contient: ${b.includedGuarantee.nameFr}`);
      }
      console.log(`      Compagnie: ${b.company?.name || 'Toutes les compagnies'}`);
      console.log(`      Formule: ${b.formulaType || 'Toutes les formules'}`);
      console.log(`      Active: ${b.isActive ? '✅' : '❌'}`);
      console.log('');
    });
  }

  // ========================================
  // ÉTAPE 2: Analyser un devis récent
  // ========================================
  console.log('\n📄 ÉTAPE 2: Analyse d\'un devis récent avec INCENDIE_EMEUTES\n');
  
  const recentQuote = await prisma.quote.findFirst({
    where: {
      items: {
        some: {
          guarantee: { code: 'INCENDIE_EMEUTES' }
        }
      }
    },
    include: {
      items: {
        include: { guarantee: true },
        orderBy: { guarantee: { code: 'asc' } }
      },
      company: true,
      simulation: { select: { formulaType: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!recentQuote) {
    console.log('❌ Aucun devis trouvé avec INCENDIE_EMEUTES');
  } else {
    console.log(`Devis: ${recentQuote.quoteNumber}`);
    console.log(`Compagnie: ${recentQuote.company.name}`);
    console.log(`Formule: ${recentQuote.simulation?.formulaType || 'N/A'}`);
    console.log(`\nGaranties dans ce devis (${recentQuote.items.length} items):\n`);
    
    let incendieEmeutesFound = false;
    recentQuote.items.forEach((item, index) => {
      const isIncendieEmeutes = item.guarantee.code === 'INCENDIE_EMEUTES';
      const icon = isIncendieEmeutes ? '🔥' : '  ';
      const highlight = isIncendieEmeutes ? ' ← CETTE GARANTIE' : '';
      
      console.log(`${icon} ${(index + 1).toString().padStart(2)}. ${item.guarantee.code.padEnd(30)} | ${item.guarantee.nameFr.padEnd(40)} | Prime: ${item.prime.toString().padStart(8)} DT | NotCovered: ${item.isNotCovered}${highlight}`);
      
      if (isIncendieEmeutes) {
        incendieEmeutesFound = true;
      }
    });
    
    if (incendieEmeutesFound) {
      console.log('\n✅ INCENDIE_EMEUTES est bien présente dans les quote_items');
    }
  }

  // ========================================
  // ÉTAPE 3: Vérifier les bundlings pour cette compagnie
  // ========================================
  if (recentQuote) {
    console.log('\n🔗 ÉTAPE 3: Bundlings actifs pour cette compagnie/formule\n');
    
    const companyBundlings = await prisma.guaranteeBundling.findMany({
      where: {
        companyId: recentQuote.companyId,
        isActive: true,
        OR: [
          { formulaType: null },
          { formulaType: recentQuote.simulation?.formulaType }
        ]
      },
      include: {
        parentGuarantee: { select: { code: true, nameFr: true } },
        includedGuarantee: { select: { code: true, nameFr: true } }
      }
    });

    if (companyBundlings.length === 0) {
      console.log('✅ Aucun bundling actif pour cette compagnie/formule');
    } else {
      console.log(`${companyBundlings.length} bundling(s) actif(s):\n`);
      
      const bundlingMap = new Map<string, string[]>();
      companyBundlings.forEach(b => {
        const parentCode = b.parentGuarantee.code;
        if (!bundlingMap.has(parentCode)) {
          bundlingMap.set(parentCode, []);
        }
        bundlingMap.get(parentCode)!.push(b.includedGuarantee.code);
      });

      bundlingMap.forEach((includedCodes, parentCode) => {
        const parent = companyBundlings.find(b => b.parentGuarantee.code === parentCode)!;
        console.log(`   📦 ${parent.parentGuarantee.nameFr} (${parentCode})`);
        console.log(`      Inclut: ${includedCodes.join(', ')}`);
        
        if (includedCodes.includes('INCENDIE_EMEUTES')) {
          console.log(`      ❌ PROBLÈME TROUVÉ: INCENDIE_EMEUTES est bundlée ici!`);
          console.log(`      → Dans le PDF, elle sera affichée avec ${parent.parentGuarantee.nameFr}`);
          console.log(`      → Elle n'apparaîtra PAS comme ligne séparée`);
        }
        console.log('');
      });
    }
  }

  // ========================================
  // ÉTAPE 4: Diagnostic final
  // ========================================
  console.log('\n🎯 DIAGNOSTIC FINAL\n');
  console.log('='.repeat(80));
  
  if (bundlings.length > 0 && bundlings.some(b => b.includedGuarantee.code === 'INCENDIE_EMEUTES')) {
    console.log('❌ CAUSE IDENTIFIÉE: BUNDLING');
    console.log('\nLa garantie INCENDIE_EMEUTES est configurée comme "incluse" dans une autre garantie.');
    console.log('Dans le PDF, elle est affichée avec la garantie parent, pas comme ligne séparée.');
    console.log('\n💡 SOLUTIONS POSSIBLES:');
    console.log('   1. Supprimer le bundling si INCENDIE_EMEUTES doit être affichée séparément');
    console.log('   2. Modifier le PDF pour afficher les garanties incluses en détail');
    console.log('   3. Confirmer avec le client si c\'est le comportement attendu');
  } else {
    console.log('✅ Aucun bundling problématique trouvé');
    console.log('\n🔍 AUTRES CAUSES POSSIBLES:');
    console.log('   1. Filtre dans le code du PDF (ex: masquer les primes à 0)');
    console.log('   2. Ordre d\'affichage dans le PDF');
    console.log('   3. Condition d\'affichage spécifique');
    console.log('\n💡 PROCHAINE ÉTAPE:');
    console.log('   → Analyser le code de pdf.service.ts ligne par ligne');
  }
  
  console.log('\n' + '='.repeat(80));
}

debugIncendieEmeutes()
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
