/**
 * SCRIPT À EXÉCUTER SUR LE SERVEUR PROD
 * 
 * Instructions:
 * 1. Copiez ce fichier sur le serveur PROD dans backend/scripts/
 * 2. Exécutez: npx ts-node scripts/check-prod-incendie-emeutes.ts
 * 3. Copiez le résultat et envoyez-le moi
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

console.log('🔍 ANALYSE PROD - NOTE 4: Incendie Suite Emeutes\n');
console.log('='.repeat(80));

async function analyzeProd() {
  try {
    // 1. Garantie
    const guarantee = await prisma.guarantee.findUnique({
      where: { code: 'INCENDIE_EMEUTES' },
      include: {
        pricingRules: { include: { company: true } },
        availabilityConfigs: { include: { company: true } }
      }
    });

    if (!guarantee) {
      console.log('❌ GARANTIE INCENDIE_EMEUTES N\'EXISTE PAS EN PROD !');
      console.log('   → C\'est le problème ! La garantie doit être créée en PROD\n');
      return;
    }

    console.log('✅ Garantie INCENDIE_EMEUTES trouvée en PROD');
    console.log(`   ID: ${guarantee.id}`);
    console.log(`   Nom: ${guarantee.nameFr}`);
    console.log(`   Active: ${guarantee.isActive ? '✅' : '❌'}`);
    console.log(`   Optionnelle: ${guarantee.isOptional ? '✅' : '❌'}\n`);

    // 2. Pricing Rules
    console.log('💰 PRICING RULES EN PROD:\n');
    
    const companies = await prisma.company.findMany({ where: { isActive: true } });
    
    for (const company of companies) {
      const rule = guarantee.pricingRules.find(pr => pr.companyId === company.id);
      if (rule) {
        console.log(`   ✅ ${company.name}: ${rule.fixedPremium || rule.formula || 'N/A'} DT`);
      } else {
        console.log(`   ❌ ${company.name}: Pas de pricing rule`);
      }
    }

    // 3. Availability
    console.log('\n🔒 DISPONIBILITÉ EN PROD:\n');
    
    for (const company of companies) {
      const avail = guarantee.availabilityConfigs.find(av => av.companyId === company.id);
      const statusIcon = avail?.status === 'NON_ACCORDEE' ? '❌' : 
                         avail?.status === 'GRATUIT' ? '🆓' : 
                         avail?.status === 'HIDDEN' ? '👻' : '✅';
      console.log(`   ${statusIcon} ${company.name}: ${avail?.status || 'DEFAULT'}`);
    }

    // 4. Bundlings
    console.log('\n📦 BUNDLINGS EN PROD:\n');
    
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
      console.log('   ✅ Aucun bundling');
    } else {
      bundlings.forEach(b => {
        if (b.includedGuarantee.code === 'INCENDIE_EMEUTES') {
          console.log(`   ⚠️  INCENDIE_EMEUTES incluse dans ${b.parentGuarantee.nameFr}`);
          console.log(`      Compagnie: ${b.company.name}`);
        }
      });
    }

    // 5. Devis récents
    console.log('\n📄 DEVIS RÉCENTS EN PROD:\n');
    
    const recentQuotes = await prisma.quote.findMany({
      where: {
        items: {
          some: { guarantee: { code: 'INCENDIE_EMEUTES' } }
        }
      },
      include: {
        items: {
          where: { guarantee: { code: 'INCENDIE_EMEUTES' } }
        },
        company: true,
        user: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (recentQuotes.length === 0) {
      console.log('   ⚠️  Aucun devis avec INCENDIE_EMEUTES en PROD');
    } else {
      recentQuotes.forEach((q, i) => {
        const item = q.items[0];
        console.log(`   ${i + 1}. ${q.quoteNumber}`);
        console.log(`      Client: ${q.user.firstName} ${q.user.lastName}`);
        console.log(`      Compagnie: ${q.company.name}`);
        console.log(`      Prime: ${item.prime} DT`);
        console.log(`      NotCovered: ${item.isNotCovered ? '❌ OUI' : '✅ NON'}`);
        console.log(`      PDF: ${q.pdfPath ? '✅' : '❌'}`);
        console.log(`      Date: ${q.createdAt.toLocaleString('fr-FR')}`);
        console.log('');
      });

      // Vérifier le dernier PDF
      const latestQuote = recentQuotes[0];
      if (latestQuote.pdfPath) {
        console.log('   📂 Dernier PDF:');
        console.log(`      ${latestQuote.pdfPath}`);
        
        if (fs.existsSync(latestQuote.pdfPath)) {
          const stats = fs.statSync(latestQuote.pdfPath);
          console.log(`      Taille: ${(stats.size / 1024).toFixed(2)} KB`);
          console.log(`      Modifié: ${stats.mtime.toLocaleString('fr-FR')}`);
        } else {
          console.log('      ⚠️  Fichier PDF non trouvé sur le serveur');
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n🎯 RÉSUMÉ PROD:\n');
    
    const hasPricingRules = guarantee.pricingRules.length > 0;
    const hasNonAccordee = guarantee.availabilityConfigs.some(av => av.status === 'NON_ACCORDEE');
    
    if (!hasPricingRules) {
      console.log('❌ PROBLÈME: Aucune pricing rule configurée en PROD');
      console.log('   → La garantie ne peut pas être calculée\n');
    } else {
      console.log('✅ Pricing rules configurées en PROD\n');
    }
    
    if (hasNonAccordee) {
      console.log('⚠️  Certaines compagnies ont INCENDIE_EMEUTES en NON_ACCORDEE');
      console.log('   → Normal si ces compagnies ne proposent pas cette garantie\n');
    }
    
    if (bundlings.length > 0) {
      console.log('📦 INCENDIE_EMEUTES est bundlée');
      console.log('   → Elle n\'apparaît pas comme ligne séparée dans le PDF\n');
    }

    console.log('='.repeat(80));

  } catch (error: any) {
    console.log('❌ ERREUR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeProd();
