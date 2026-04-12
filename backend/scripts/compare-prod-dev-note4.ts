import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// ========================================
// CONFIGURATION
// ========================================
const DEV_DATABASE_URL = process.env.DATABASE_URL;
const PROD_DATABASE_URL = process.env.PROD_DATABASE_URL || "postgresql://postgres:23044943@10.34.60.63:5432/cbc_ars?schema=public";

console.log('🔍 COMPARAISON PROD vs DEV - NOTE 4: Incendie Suite Emeutes\n');
console.log('='.repeat(80));

if (!PROD_DATABASE_URL) {
  console.log('⚠️  PROD_DATABASE_URL non configurée dans .env');
  console.log('   Ajoutez cette ligne dans backend/.env :');
  console.log('   PROD_DATABASE_URL="postgresql://user:password@prod-host:5432/dbname"\n');
  console.log('   Pour l\'instant, on va analyser uniquement DEV...\n');
}

// ========================================
// FONCTION: Analyser une base de données
// ========================================
async function analyzeDatabase(dbUrl: string, envName: string) {
  console.log(`\n📊 ANALYSE ${envName.toUpperCase()}\n`);
  console.log('─'.repeat(80));

  const prisma = new PrismaClient({
    datasources: {
      db: { url: dbUrl }
    }
  });

  try {
    // 1. Vérifier la garantie INCENDIE_EMEUTES
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
      return null;
    }

    console.log('✅ Garantie INCENDIE_EMEUTES trouvée');
    console.log(`   ID: ${guarantee.id}`);
    console.log(`   Nom: ${guarantee.nameFr}`);
    console.log(`   Active: ${guarantee.isActive ? '✅' : '❌'}`);
    console.log(`   Optionnelle: ${guarantee.isOptional ? '✅' : '❌'}\n`);

    // 2. Pricing Rules par compagnie
    console.log('💰 PRICING RULES:\n');
    
    const companies = await prisma.company.findMany({
      where: { isActive: true }
    });

    const pricingRulesMap: Record<string, any> = {};

    for (const company of companies) {
      const rule = guarantee.pricingRules.find(pr => pr.companyId === company.id);
      pricingRulesMap[company.name] = rule ? {
        fixedPremium: rule.fixedPremium?.toString() || null,
        formula: rule.formula || null,
        isActive: rule.isActive
      } : null;

      if (rule) {
        console.log(`   ✅ ${company.name}: ${rule.fixedPremium || rule.formula || 'N/A'} DT`);
      } else {
        console.log(`   ❌ ${company.name}: Pas de pricing rule`);
      }
    }

    // 3. Availability Status par compagnie
    console.log('\n🔒 DISPONIBILITÉ:\n');

    const availabilityMap: Record<string, any> = {};

    for (const company of companies) {
      const avail = guarantee.availabilityConfigs.find(av => av.companyId === company.id);
      availabilityMap[company.name] = avail ? {
        status: avail.status,
        formulaType: avail.formulaType,
        isActive: avail.isActive
      } : { status: 'DEFAULT', formulaType: null, isActive: true };

      const statusIcon = avail?.status === 'NON_ACCORDEE' ? '❌' : 
                         avail?.status === 'GRATUIT' ? '🆓' : 
                         avail?.status === 'HIDDEN' ? '👻' : '✅';
      
      console.log(`   ${statusIcon} ${company.name}: ${avail?.status || 'DEFAULT'}`);
    }

    // 4. Bundlings
    console.log('\n📦 BUNDLINGS:\n');

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

    const bundlingsData: any[] = [];

    if (bundlings.length === 0) {
      console.log('   ✅ Aucun bundling - Garantie indépendante');
    } else {
      bundlings.forEach(b => {
        const data = {
          company: b.company.name,
          parent: b.parentGuarantee.code,
          included: b.includedGuarantee.code,
          formulaType: b.formulaType
        };
        bundlingsData.push(data);

        if (b.includedGuarantee.code === 'INCENDIE_EMEUTES') {
          console.log(`   ⚠️  INCENDIE_EMEUTES incluse dans ${b.parentGuarantee.nameFr}`);
          console.log(`      Compagnie: ${b.company.name}`);
          console.log(`      Formule: ${b.formulaType || 'Toutes'}`);
        }
      });
    }

    // 5. Devis récents avec INCENDIE_EMEUTES
    console.log('\n📄 DEVIS RÉCENTS:\n');

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
        company: true
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    const quotesData: any[] = [];

    if (recentQuotes.length === 0) {
      console.log('   ⚠️  Aucun devis récent avec INCENDIE_EMEUTES');
    } else {
      recentQuotes.forEach(q => {
        const item = q.items[0];
        const data = {
          quoteNumber: q.quoteNumber,
          company: q.company.name,
          prime: item.prime.toString(),
          isNotCovered: item.isNotCovered,
          pdfPath: q.pdfPath,
          createdAt: q.createdAt.toISOString()
        };
        quotesData.push(data);

        console.log(`   📋 ${q.quoteNumber}`);
        console.log(`      Compagnie: ${q.company.name}`);
        console.log(`      Prime: ${item.prime} DT`);
        console.log(`      NotCovered: ${item.isNotCovered ? '❌ OUI' : '✅ NON'}`);
        console.log(`      PDF: ${q.pdfPath ? '✅' : '❌'}`);
        console.log('');
      });
    }

    await prisma.$disconnect();

    return {
      guarantee: {
        id: guarantee.id,
        code: guarantee.code,
        nameFr: guarantee.nameFr,
        isActive: guarantee.isActive,
        isOptional: guarantee.isOptional
      },
      pricingRules: pricingRulesMap,
      availability: availabilityMap,
      bundlings: bundlingsData,
      recentQuotes: quotesData
    };

  } catch (error: any) {
    console.log(`❌ ERREUR lors de l'analyse ${envName}:`);
    console.log(`   ${error.message}`);
    await prisma.$disconnect();
    return null;
  }
}

// ========================================
// FONCTION: Comparer DEV et PROD
// ========================================
function compareEnvironments(devData: any, prodData: any) {
  console.log('\n' + '='.repeat(80));
  console.log('\n🔄 COMPARAISON DEV vs PROD\n');
  console.log('─'.repeat(80));

  if (!devData || !prodData) {
    console.log('⚠️  Impossible de comparer - Données manquantes');
    return;
  }

  let hasDifferences = false;

  // 1. Comparer Pricing Rules
  console.log('\n💰 PRICING RULES:\n');
  
  const allCompanies = new Set([
    ...Object.keys(devData.pricingRules),
    ...Object.keys(prodData.pricingRules)
  ]);

  allCompanies.forEach(company => {
    const devRule = devData.pricingRules[company];
    const prodRule = prodData.pricingRules[company];

    const devPremium = devRule?.fixedPremium || 'N/A';
    const prodPremium = prodRule?.fixedPremium || 'N/A';

    if (devPremium !== prodPremium) {
      console.log(`   ⚠️  ${company}:`);
      console.log(`      DEV:  ${devPremium} DT`);
      console.log(`      PROD: ${prodPremium} DT`);
      hasDifferences = true;
    } else {
      console.log(`   ✅ ${company}: ${devPremium} DT (identique)`);
    }
  });

  // 2. Comparer Availability
  console.log('\n🔒 DISPONIBILITÉ:\n');

  allCompanies.forEach(company => {
    const devAvail = devData.availability[company];
    const prodAvail = prodData.availability[company];

    const devStatus = devAvail?.status || 'DEFAULT';
    const prodStatus = prodAvail?.status || 'DEFAULT';

    if (devStatus !== prodStatus) {
      console.log(`   ⚠️  ${company}:`);
      console.log(`      DEV:  ${devStatus}`);
      console.log(`      PROD: ${prodStatus}`);
      hasDifferences = true;
    } else {
      console.log(`   ✅ ${company}: ${devStatus} (identique)`);
    }
  });

  // 3. Comparer Bundlings
  console.log('\n📦 BUNDLINGS:\n');

  if (devData.bundlings.length !== prodData.bundlings.length) {
    console.log(`   ⚠️  Nombre différent:`);
    console.log(`      DEV:  ${devData.bundlings.length} bundling(s)`);
    console.log(`      PROD: ${prodData.bundlings.length} bundling(s)`);
    hasDifferences = true;
  } else if (devData.bundlings.length === 0) {
    console.log('   ✅ Aucun bundling dans les deux environnements');
  } else {
    console.log('   ✅ Même nombre de bundlings');
  }

  // 4. Résumé
  console.log('\n' + '='.repeat(80));
  console.log('\n🎯 RÉSUMÉ:\n');

  if (!hasDifferences) {
    console.log('✅ DEV et PROD sont IDENTIQUES pour INCENDIE_EMEUTES');
    console.log('   → Le problème n\'est PAS une différence de configuration\n');
  } else {
    console.log('⚠️  DEV et PROD ont des DIFFÉRENCES');
    console.log('   → Le problème peut venir de la configuration PROD\n');
  }
}

// ========================================
// FONCTION: Extraire le contenu d'un PDF
// ========================================
async function extractPdfContent(pdfPath: string) {
  console.log('\n📄 EXTRACTION DU CONTENU PDF\n');
  console.log('─'.repeat(80));

  if (!fs.existsSync(pdfPath)) {
    console.log(`❌ PDF non trouvé: ${pdfPath}`);
    return;
  }

  console.log(`✅ PDF trouvé: ${pdfPath}`);
  
  const stats = fs.statSync(pdfPath);
  console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`   Modifié: ${stats.mtime.toLocaleString('fr-FR')}\n`);

  console.log('⚠️  Note: L\'extraction du texte d\'un PDF nécessite une librairie externe (pdf-parse)');
  console.log('   Pour l\'instant, vérifiez manuellement en ouvrant le PDF.\n');
  console.log(`   Chemin: ${pdfPath}\n`);
  console.log('   Recherchez "Incendie Suite Emeutes" dans le PDF (Ctrl+F)\n');
}

// ========================================
// MAIN
// ========================================
async function main() {
  // Analyser DEV
  const devData = await analyzeDatabase(DEV_DATABASE_URL!, 'DEV');

  // Analyser PROD (si configuré)
  let prodData = null;
  if (PROD_DATABASE_URL && PROD_DATABASE_URL !== DEV_DATABASE_URL) {
    prodData = await analyzeDatabase(PROD_DATABASE_URL, 'PROD');
  }

  // Comparer
  if (devData && prodData) {
    compareEnvironments(devData, prodData);
  }

  // Extraire PDF (DEV)
  if (devData && devData.recentQuotes.length > 0) {
    const latestQuote = devData.recentQuotes[0];
    if (latestQuote.pdfPath) {
      await extractPdfContent(latestQuote.pdfPath);
    }
  }

  console.log('='.repeat(80));
  console.log('\n💡 PROCHAINES ÉTAPES:\n');
  console.log('1. Si PROD_DATABASE_URL n\'est pas configurée, ajoutez-la dans .env');
  console.log('2. Ouvrez le PDF manuellement et cherchez "Incendie Suite Emeutes"');
  console.log('3. Si la garantie n\'apparaît pas dans le PDF, c\'est un bug dans pdf.service.ts');
  console.log('4. Si elle apparaît, le client se trompe ou regarde un vieux PDF\n');
  console.log('='.repeat(80));
}

main().catch(console.error);
