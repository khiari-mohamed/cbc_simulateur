/**
 * INVESTIGATION NOTE 6 : Garanties NON ACCORDÉES avec tarif
 * À exécuter sur PROD
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('🔍 INVESTIGATION NOTE 6 : Garanties NON ACCORDÉES avec tarif\n');
  console.log('='.repeat(80));

  // Trouver des devis récents
  const recentQuotes = await prisma.quote.findMany({
    include: {
      items: {
        include: { guarantee: true }
      },
      company: true,
      user: { select: { firstName: true, lastName: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log(`\n📊 Analyse de ${recentQuotes.length} devis récents\n`);

  let bugFound = false;

  for (const quote of recentQuotes) {
    // Chercher les items avec isNotCovered = true ET prime > 0
    const buggyItems = quote.items.filter(item => 
      item.isNotCovered === true && Number(item.prime) > 0
    );

    if (buggyItems.length > 0) {
      bugFound = true;
      console.log('─'.repeat(80));
      console.log(`\n❌ BUG TROUVÉ - Devis: ${quote.quoteNumber}`);
      console.log(`   Client: ${quote.user.firstName} ${quote.user.lastName}`);
      console.log(`   Compagnie: ${quote.company.name}`);
      console.log(`   Date: ${quote.createdAt.toISOString()}`);
      console.log(`\n   Garanties NON ACCORDÉES avec tarif :\n`);

      buggyItems.forEach(item => {
        console.log(`   🚨 ${item.guarantee.nameFr}`);
        console.log(`      Code: ${item.guarantee.code}`);
        console.log(`      isNotCovered: ${item.isNotCovered}`);
        console.log(`      Prime: ${item.prime} DT ← DEVRAIT ÊTRE 0 DT !`);
        console.log('');
      });

      // Calculer l'impact sur le total
      const wrongTotal = buggyItems.reduce((sum, item) => sum + Number(item.prime), 0);
      console.log(`   💰 Impact sur le total: +${wrongTotal} DT (FAUX)`);
      console.log(`   ✅ Total correct devrait être: ${Number(quote.totalAPayer) - wrongTotal} DT`);
    }
  }

  if (!bugFound) {
    console.log('✅ Aucun bug trouvé dans les devis récents');
    console.log('   Toutes les garanties NON ACCORDÉES ont une prime de 0 DT\n');
  } else {
    console.log('\n' + '='.repeat(80));
    console.log('\n🎯 DIAGNOSTIC:\n');
    console.log('❌ BUG CONFIRMÉ: Des garanties NON ACCORDÉES ont une prime > 0');
    console.log('   → Cela fausse le montant total du devis');
    console.log('   → Le client paie pour des garanties non accordées\n');
    console.log('💡 CAUSE PROBABLE:');
    console.log('   Le pricing-engine calcule la prime AVANT de vérifier isNotCovered');
    console.log('   Il faut forcer prime = 0 pour toutes les garanties NON ACCORDÉES\n');
  }

  console.log('='.repeat(80));

})().catch(e => console.error(e)).finally(() => prisma.$disconnect());
