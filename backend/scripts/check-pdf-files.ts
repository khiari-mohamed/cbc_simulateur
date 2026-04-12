import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function checkPdfFiles() {
  console.log('🔍 VÉRIFICATION DES FICHIERS PDF GÉNÉRÉS\n');
  console.log('='.repeat(80));

  // Get recent quotes with INCENDIE_EMEUTES
  const quotes = await prisma.quote.findMany({
    where: {
      items: {
        some: {
          guarantee: { code: 'INCENDIE_EMEUTES' }
        }
      },
      pdfPath: { not: null }
    },
    include: {
      items: {
        include: { guarantee: true }
      },
      company: true,
      user: { select: { firstName: true, lastName: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log(`\n📄 ${quotes.length} devis récents avec INCENDIE_EMEUTES et PDF généré:\n`);

  for (const quote of quotes) {
    console.log('─'.repeat(80));
    console.log(`\n📋 Devis: ${quote.quoteNumber}`);
    console.log(`   Client: ${quote.user.firstName} ${quote.user.lastName}`);
    console.log(`   Compagnie: ${quote.company.name}`);
    console.log(`   Date: ${quote.createdAt.toLocaleString('fr-FR')}`);
    console.log(`   PDF Path: ${quote.pdfPath}`);

    // Check if PDF file exists
    if (quote.pdfPath) {
      const pdfExists = fs.existsSync(quote.pdfPath);
      console.log(`   PDF existe: ${pdfExists ? '✅' : '❌'}`);

      if (pdfExists) {
        const stats = fs.statSync(quote.pdfPath);
        console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`   Modifié: ${stats.mtime.toLocaleString('fr-FR')}`);
      }
    }

    // Check INCENDIE_EMEUTES in items
    const incendieItem = quote.items.find(i => i.guarantee.code === 'INCENDIE_EMEUTES');
    if (incendieItem) {
      console.log(`\n   🔥 INCENDIE_EMEUTES:`);
      console.log(`      Capital: ${incendieItem.capital} DT`);
      console.log(`      Prime: ${incendieItem.prime} DT`);
      console.log(`      NotCovered: ${incendieItem.isNotCovered ? '❌ OUI' : '✅ NON'}`);
    }

    console.log(`\n   Total garanties: ${quote.items.length}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 RECOMMANDATIONS:\n');
  console.log('1. Demander au client de RÉGÉNÉRER un nouveau devis');
  console.log('2. Vérifier que le client teste avec la bonne compagnie (LLOYD a la pricing rule)');
  console.log('3. Vérifier que le client a bien sélectionné INCENDIE_EMEUTES dans la simulation');
  console.log('4. Si le problème persiste, générer un nouveau PDF manuellement pour ce devis');

  // Check which companies have pricing rules for INCENDIE_EMEUTES
  console.log('\n' + '='.repeat(80));
  console.log('\n🏢 COMPAGNIES AVEC PRICING RULES POUR INCENDIE_EMEUTES:\n');

  const pricingRules = await prisma.pricingRule.findMany({
    where: {
      guarantee: { code: 'INCENDIE_EMEUTES' },
      isActive: true
    },
    include: {
      company: { select: { name: true } }
    }
  });

  if (pricingRules.length === 0) {
    console.log('❌ AUCUNE pricing rule configurée pour INCENDIE_EMEUTES!');
    console.log('   → C\'est peut-être pour ça que la garantie n\'apparaît pas');
  } else {
    pricingRules.forEach(rule => {
      console.log(`✅ ${rule.company.name}`);
      console.log(`   Prime fixe: ${rule.fixedPremium || 'N/A'} DT`);
      console.log(`   Formule: ${rule.formula || 'N/A'}`);
      console.log('');
    });
  }

  // Check guarantee availability status
  console.log('='.repeat(80));
  console.log('\n🔒 STATUT DE DISPONIBILITÉ INCENDIE_EMEUTES PAR COMPAGNIE:\n');

  const availabilities = await prisma.guaranteeAvailability.findMany({
    where: {
      guarantee: { code: 'INCENDIE_EMEUTES' },
      isActive: true
    },
    include: {
      company: { select: { name: true } }
    }
  });

  if (availabilities.length === 0) {
    console.log('✅ Aucune restriction - Disponible pour toutes les compagnies');
  } else {
    availabilities.forEach(avail => {
      const statusIcon = avail.status === 'NON_ACCORDEE' ? '❌' : 
                         avail.status === 'GRATUIT' ? '🆓' : 
                         avail.status === 'HIDDEN' ? '👻' : '✅';
      console.log(`${statusIcon} ${avail.company.name}: ${avail.status}`);
      console.log(`   Formule: ${avail.formulaType || 'Toutes'}`);
      console.log('');
    });
  }

  console.log('='.repeat(80));
}

checkPdfFiles()
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
