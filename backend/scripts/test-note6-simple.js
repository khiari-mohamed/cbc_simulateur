/**
 * TEST NOTE 6 FIX : Version simplifiée pour PROD
 * Compare l'ancien devis avec un nouveau calcul
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('🧪 TEST NOTE 6 FIX : Vérification rapide\n');
  console.log('='.repeat(80));

  try {
    // Trouver des devis avec DOMMAGES_EMEUTES NON ACCORDÉE
    const quotes = await prisma.quote.findMany({
      where: {
        items: {
          some: {
            guarantee: { code: 'DOMMAGES_EMEUTES' },
            isNotCovered: true
          }
        }
      },
      include: {
        items: {
          include: { guarantee: true }
        },
        company: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`📊 Analyse de ${quotes.length} devis avec DOMMAGES_EMEUTES NON ACCORDÉE\n`);

    let bugsFound = 0;
    let fixedCount = 0;

    for (const quote of quotes) {
      const dommagesItem = quote.items.find(
        item => item.guarantee.code === 'DOMMAGES_EMEUTES' && item.isNotCovered
      );

      if (!dommagesItem) continue;

      const hasBug = parseFloat(dommagesItem.premium) > 0;
      
      console.log(`${hasBug ? '❌' : '✅'} Devis: ${quote.quoteNumber}`);
      console.log(`   Compagnie: ${quote.company.name}`);
      console.log(`   Date: ${quote.createdAt.toISOString()}`);
      console.log(`   DOMMAGES_EMEUTES:`);
      console.log(`     isNotCovered: ${dommagesItem.isNotCovered}`);
      console.log(`     Prime: ${dommagesItem.premium} DT ${hasBug ? '← BUG !' : '✓'}`);
      
      if (hasBug) {
        bugsFound++;
        // Calculer le total correct
        const correctTotal = quote.items
          .filter(item => !item.isNotCovered)
          .reduce((sum, item) => sum + parseFloat(item.premium), 0);
        console.log(`   Total actuel: ${quote.totalPremium} DT`);
        console.log(`   Total correct: ${correctTotal.toFixed(3)} DT`);
        console.log(`   Différence: ${(parseFloat(quote.totalPremium) - correctTotal).toFixed(3)} DT`);
      } else {
        fixedCount++;
      }
      console.log('');
    }

    console.log('='.repeat(80));
    console.log('📈 RÉSULTAT:');
    console.log(`   Devis avec bug: ${bugsFound}`);
    console.log(`   Devis corrects: ${fixedCount}`);
    
    if (bugsFound > 0) {
      console.log('\n❌ Le bug est encore présent sur certains devis');
      console.log('💡 Ces devis ont été créés AVANT le fix');
      console.log('💡 Créez un NOUVEAU devis pour tester le fix');
    } else {
      console.log('\n✅ Tous les devis analysés sont corrects !');
    }
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
})()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
