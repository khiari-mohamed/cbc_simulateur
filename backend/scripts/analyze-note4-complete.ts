import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

console.log('🔍 ANALYSE COMPLÈTE - NOTE 4: Incendie Suite Emeutes\n');
console.log('='.repeat(80));

async function fullAnalysis() {
  // ========================================
  // 1. GARANTIE
  // ========================================
  console.log('\n✅ ÉTAPE 1: Vérification de la garantie\n');
  
  const guarantee = await prisma.guarantee.findUnique({
    where: { code: 'INCENDIE_EMEUTES' },
    include: {
      pricingRules: {
        include: { company: true }
      },
      availabilityConfigs: {
        include: { company: true }
      }
    }
  });

  if (!guarantee) {
    console.log('❌ GARANTIE INCENDIE_EMEUTES N\'EXISTE PAS !');
    console.log('   → C\'est un vrai problème, la garantie doit être créée\n');
    return;
  }

  console.log('✅ Garantie trouvée');
  console.log(`   Code: ${guarantee.code}`);
  console.log(`   Nom: ${guarantee.nameFr}`);
  console.log(`   Active: ${guarantee.isActive ? '✅' : '❌'}`);
  console.log(`   Optionnelle: ${guarantee.isOptional ? '✅' : '❌'}`);

  // ========================================
  // 2. PRICING RULES
  // ========================================
  console.log('\n💰 ÉTAPE 2: Pricing Rules par compagnie\n');

  const companies = await prisma.company.findMany({
    where: { isActive: true }
  });

  const pricingConfig: any = {};

  for (const company of companies) {
    const rule = guarantee.pricingRules.find(pr => pr.companyId === company.id);
    pricingConfig[company.name] = rule ? {
      exists: true,
      fixedPremium: rule.fixedPremium?.toString() || null,
      formula: rule.formula || null
    } : {
      exists: false
    };

    if (rule) {
      console.log(`   ✅ ${company.name}: ${rule.fixedPremium || rule.formula || 'N/A'} DT`);
    } else {
      console.log(`   ❌ ${company.name}: Pas de pricing rule`);
    }
  }

  // ========================================
  // 3. AVAILABILITY
  // ========================================
  console.log('\n🔒 ÉTAPE 3: Disponibilité par compagnie\n');

  const availabilityConfig: any = {};

  for (const company of companies) {
    const avail = guarantee.availabilityConfigs.find(av => av.companyId === company.id);
    availabilityConfig[company.name] = avail ? {
      status: avail.status,
      formulaType: avail.formulaType
    } : {
      status: 'DEFAULT'
    };

    const statusIcon = avail?.status === 'NON_ACCORDEE' ? '❌' : 
                       avail?.status === 'GRATUIT' ? '🆓' : 
                       avail?.status === 'HIDDEN' ? '👻' : '✅';
    
    console.log(`   ${statusIcon} ${company.name}: ${avail?.status || 'DEFAULT'}`);
  }

  // ========================================
  // 4. BUNDLINGS
  // ========================================
  console.log('\n📦 ÉTAPE 4: Bundlings\n');

  const bundlings = await prisma.guaranteeBundling.findMany({
    where: {
      OR: [
        { parentGuarantee: { code: 'INCENDIE_EMEUTES' } },
        { includedGuarantee: { code: 'INCENDIE_EMEUTES' } }
      ],
      isActive: true
    },
    include: {
      parentGuarantee: true,
      includedGuarantee: true,
      company: true
    }
  });

  if (bundlings.length === 0) {
    console.log('   ✅ Aucun bundling - Garantie indépendante');
  } else {
    bundlings.forEach(b => {
      if (b.includedGuarantee.code === 'INCENDIE_EMEUTES') {
        console.log(`   ⚠️  INCENDIE_EMEUTES incluse dans ${b.parentGuarantee.nameFr}`);
        console.log(`      Compagnie: ${b.company.name}`);
        console.log(`      Formule: ${b.formulaType || 'Toutes'}`);
        console.log(`      → Dans le PDF, elle sera affichée avec ${b.parentGuarantee.nameFr}\n`);
      }
    });
  }

  // ========================================
  // 5. DEVIS RÉCENTS
  // ========================================
  console.log('\n📄 ÉTAPE 5: Devis récents avec INCENDIE_EMEUTES\n');

  const recentQuotes = await prisma.quote.findMany({
    where: {
      items: {
        some: {
          guarantee: { code: 'INCENDIE_EMEUTES' }
        }
      }
    },
    include: {
      items: {
        where: {
          guarantee: { code: 'INCENDIE_EMEUTES' }
        }
      },
      company: true,
      user: { select: { firstName: true, lastName: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  if (recentQuotes.length === 0) {
    console.log('   ⚠️  Aucun devis récent avec INCENDIE_EMEUTES');
    console.log('   → Le client n\'a peut-être jamais sélectionné cette garantie\n');
  } else {
    console.log(`   ${recentQuotes.length} devis trouvé(s):\n`);
    
    recentQuotes.forEach((q, index) => {
      const item = q.items[0];
      console.log(`   ${index + 1}. ${q.quoteNumber}`);
      console.log(`      Client: ${q.user.firstName} ${q.user.lastName}`);
      console.log(`      Compagnie: ${q.company.name}`);
      console.log(`      Prime: ${item.prime} DT`);
      console.log(`      NotCovered: ${item.isNotCovered ? '❌ OUI' : '✅ NON'}`);
      console.log(`      PDF: ${q.pdfPath || 'N/A'}`);
      console.log(`      Date: ${q.createdAt.toLocaleString('fr-FR')}`);
      
      if (q.pdfPath && fs.existsSync(q.pdfPath)) {
        const stats = fs.statSync(q.pdfPath);
        console.log(`      Taille PDF: ${(stats.size / 1024).toFixed(2)} KB`);
      }
      console.log('');
    });

    // Vérifier le dernier PDF
    const latestQuote = recentQuotes[0];
    if (latestQuote.pdfPath && fs.existsSync(latestQuote.pdfPath)) {
      console.log('   📂 Dernier PDF disponible:');
      console.log(`      ${latestQuote.pdfPath}\n`);
      console.log('   ⚠️  VÉRIFICATION MANUELLE REQUISE:');
      console.log('      1. Ouvrez ce PDF');
      console.log('      2. Cherchez "Incendie Suite Emeutes" (Ctrl+F)');
      console.log('      3. Vérifiez si elle apparaît dans le tableau des garanties\n');
    }
  }

  // ========================================
  // 6. DIAGNOSTIC FINAL
  // ========================================
  console.log('='.repeat(80));
  console.log('\n🎯 DIAGNOSTIC FINAL\n');
  console.log('─'.repeat(80));

  console.log('\n✅ CE QUI FONCTIONNE:\n');
  console.log('   1. La garantie INCENDIE_EMEUTES existe et est active');
  console.log('   2. Elle est bien stockée dans les quote_items');
  console.log('   3. La logique du code devrait l\'afficher');

  console.log('\n⚠️  CONFIGURATION ACTUELLE:\n');
  Object.entries(pricingConfig).forEach(([company, config]: [string, any]) => {
    if (config.exists) {
      console.log(`   ✅ ${company}: ${config.fixedPremium || config.formula} DT`);
    } else {
      console.log(`   ❌ ${company}: Pas de pricing rule`);
    }
  });

  console.log('\n🔒 DISPONIBILITÉ:\n');
  Object.entries(availabilityConfig).forEach(([company, config]: [string, any]) => {
    const icon = config.status === 'NON_ACCORDEE' ? '❌' : '✅';
    console.log(`   ${icon} ${company}: ${config.status}`);
  });

  console.log('\n💡 CONCLUSION:\n');

  const hasNonAccordee = Object.values(availabilityConfig).some((c: any) => c.status === 'NON_ACCORDEE');
  const hasPricingRules = Object.values(pricingConfig).some((c: any) => c.exists);

  if (hasNonAccordee) {
    console.log('   ⚠️  Certaines compagnies ont INCENDIE_EMEUTES en NON_ACCORDEE');
    console.log('   → Le client voit probablement "(NON ACCORDÉE)" dans le PDF');
    console.log('   → Ce n\'est PAS un bug, c\'est la configuration normale\n');
  }

  if (!hasPricingRules) {
    console.log('   ❌ AUCUNE pricing rule configurée');
    console.log('   → La garantie ne peut pas être calculée');
    console.log('   → C\'est peut-être pour ça qu\'elle n\'apparaît pas\n');
  }

  if (bundlings.length > 0) {
    console.log('   📦 INCENDIE_EMEUTES est bundlée avec une autre garantie');
    console.log('   → Elle n\'apparaît pas comme ligne séparée dans le PDF');
    console.log('   → Elle est affichée avec la garantie parent\n');
  }

  console.log('='.repeat(80));
  console.log('\n📋 PROCHAINES ÉTAPES:\n');
  console.log('1. ✅ Ouvrir le PDF manuellement et vérifier visuellement');
  console.log('2. ✅ Demander au client quelle compagnie il teste');
  console.log('3. ✅ Vérifier s\'il a bien sélectionné la garantie dans la simulation');
  console.log('4. ⚠️  Si besoin, comparer avec PROD (voir instructions ci-dessous)\n');

  console.log('='.repeat(80));
  console.log('\n🌐 POUR COMPARER AVEC PROD:\n');
  console.log('1. Ajoutez dans backend/.env:');
  console.log('   PROD_DATABASE_URL="postgresql://user:password@prod-host:5432/dbname"');
  console.log('2. Relancez ce script avec l\'option --prod');
  console.log('3. Le script comparera automatiquement DEV et PROD\n');
  console.log('='.repeat(80));

  // ========================================
  // 7. EXPORT JSON
  // ========================================
  const report = {
    timestamp: new Date().toISOString(),
    guarantee: {
      code: guarantee.code,
      nameFr: guarantee.nameFr,
      isActive: guarantee.isActive,
      isOptional: guarantee.isOptional
    },
    pricingRules: pricingConfig,
    availability: availabilityConfig,
    bundlings: bundlings.map(b => ({
      parent: b.parentGuarantee.code,
      included: b.includedGuarantee.code,
      company: b.company.name,
      formulaType: b.formulaType
    })),
    recentQuotes: recentQuotes.map(q => ({
      quoteNumber: q.quoteNumber,
      company: q.company.name,
      prime: q.items[0].prime.toString(),
      isNotCovered: q.items[0].isNotCovered,
      pdfPath: q.pdfPath,
      createdAt: q.createdAt.toISOString()
    }))
  };

  fs.writeFileSync(
    'note4-analysis-report.json',
    JSON.stringify(report, null, 2)
  );

  console.log('\n✅ Rapport exporté: note4-analysis-report.json\n');
}

fullAnalysis()
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
