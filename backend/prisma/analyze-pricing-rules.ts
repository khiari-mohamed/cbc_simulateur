import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeRules() {
  console.log('🔍 Analyzing all pricing rules...\n');

  // Fetch all active pricing rules with their guarantee info
  const rules = await prisma.pricingRule.findMany({
    where: { isActive: true },
    include: {
      guarantee: true,
      company: true,
      usage: true,
    },
    orderBy: [
      { companyId: 'asc' },
      { guaranteeId: 'asc' },
    ],
  });

  console.log(`📊 Total active rules: ${rules.length}\n`);

  // Categorize by guarantee code
  const categories = {
    VOL: [] as any[],
    INCENDIE: [] as any[],
    DOMMAGES_COLLISIONS: [] as any[],
    TOUS_RISQUES: [] as any[],
    OTHER: [] as any[],
  };

  rules.forEach((rule) => {
    const code = rule.guarantee.code;
    
    if (code === 'VOL') {
      categories.VOL.push(rule);
    } else if (code === 'INCENDIE' || code === 'INCENDIE_EMEUTES') {
      categories.INCENDIE.push(rule);
    } else if (code === 'DOMMAGES_COLLISIONS') {
      categories.DOMMAGES_COLLISIONS.push(rule);
    } else if (code === 'TOUS_RISQUES_ZERO') {
      categories.TOUS_RISQUES.push(rule);
    } else {
      categories.OTHER.push(rule);
    }
  });

  // Display results
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📋 CATÉGORISATION DES RÈGLES PAR FORMULE D\'ASSURANCE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // VOL
  console.log('🚗 VOL (Theft)');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`Total: ${categories.VOL.length} règles\n`);
  
  if (categories.VOL.length > 0) {
    categories.VOL.forEach((rule, index) => {
      console.log(`  ${index + 1}. ${rule.company.name}`);
      console.log(`     Garantie: ${rule.guarantee.nameFr}`);
      if (rule.usage) console.log(`     Usage: ${rule.usage.nameFr}`);
      if (rule.ratePercentage) console.log(`     Taux: ${rule.ratePercentage}`);
      if (rule.fixedPremium) console.log(`     Prime fixe: ${rule.fixedPremium} DT`);
      if (rule.reductionRate) console.log(`     Réduction: ${rule.reductionRate}%`);
      if (rule.referenceValue) console.log(`     Valeur de référence: ${rule.referenceValue}`);
      console.log('');
    });
  } else {
    console.log('  Aucune règle\n');
  }

  // INCENDIE
  console.log('🔥 INCENDIE (Fire)');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`Total: ${categories.INCENDIE.length} règles\n`);
  
  if (categories.INCENDIE.length > 0) {
    categories.INCENDIE.forEach((rule, index) => {
      console.log(`  ${index + 1}. ${rule.company.name}`);
      console.log(`     Garantie: ${rule.guarantee.nameFr}`);
      if (rule.usage) console.log(`     Usage: ${rule.usage.nameFr}`);
      if (rule.ratePercentage) console.log(`     Taux: ${rule.ratePercentage}`);
      if (rule.fixedPremium) console.log(`     Prime fixe: ${rule.fixedPremium} DT`);
      if (rule.reductionRate) console.log(`     Réduction: ${rule.reductionRate}%`);
      if (rule.referenceValue) console.log(`     Valeur de référence: ${rule.referenceValue}`);
      console.log('');
    });
  } else {
    console.log('  Aucune règle\n');
  }

  // DOMMAGES COLLISIONS
  console.log('💥 DOMMAGES COLLISION (Collision Damage)');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`Total: ${categories.DOMMAGES_COLLISIONS.length} règles\n`);
  
  if (categories.DOMMAGES_COLLISIONS.length > 0) {
    // Group by company
    const byCompany = categories.DOMMAGES_COLLISIONS.reduce((acc, rule) => {
      const companyName = rule.company.name;
      if (!acc[companyName]) acc[companyName] = [];
      acc[companyName].push(rule);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(byCompany).forEach(([companyName, companyRules]) => {
      console.log(`  ${companyName}: ${(companyRules as any[]).length} règles`);
      
      // Group by usage
      const byUsage = (companyRules as any[]).reduce((acc: Record<string, any[]>, rule: any) => {
        const usageName = rule.usage?.nameFr || 'Sans usage';
        if (!acc[usageName]) acc[usageName] = [];
        acc[usageName].push(rule);
        return acc;
      }, {} as Record<string, any[]>);

      Object.entries(byUsage).forEach(([usageName, usageRules]) => {
        console.log(`    └─ ${usageName}: ${(usageRules as any[]).length} règles`);
      });
      console.log('');
    });
  } else {
    console.log('  Aucune règle\n');
  }

  // TOUS RISQUES
  console.log('🛡️  TOUS RISQUES (All Risks)');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`Total: ${categories.TOUS_RISQUES.length} règles\n`);
  
  if (categories.TOUS_RISQUES.length > 0) {
    // Group by franchise
    const byFranchise = categories.TOUS_RISQUES.reduce((acc, rule) => {
      const franchise = rule.franchiseRate !== null ? `${rule.franchiseRate}%` : 'Sans franchise';
      if (!acc[franchise]) acc[franchise] = [];
      acc[franchise].push(rule);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(byFranchise).forEach(([franchise, franchiseRules]) => {
      console.log(`  Franchise ${franchise}: ${(franchiseRules as any[]).length} règles`);
      (franchiseRules as any[]).forEach((rule: any) => {
        console.log(`    └─ ${rule.company.name}`);
        if (rule.ratePercentage) console.log(`       Taux: ${rule.ratePercentage}`);
        if (rule.fixedPremium) console.log(`       Prime fixe: ${rule.fixedPremium} DT`);
        if (rule.referenceValue) console.log(`       Valeur de référence: ${rule.referenceValue}`);
      });
      console.log('');
    });
  } else {
    console.log('  Aucune règle\n');
  }

  // OTHER
  console.log('📦 AUTRES GARANTIES');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`Total: ${categories.OTHER.length} règles\n`);
  
  if (categories.OTHER.length > 0) {
    const byGuarantee = categories.OTHER.reduce((acc, rule) => {
      const guaranteeName = rule.guarantee.nameFr;
      if (!acc[guaranteeName]) acc[guaranteeName] = [];
      acc[guaranteeName].push(rule);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(byGuarantee).forEach(([guaranteeName, guaranteeRules]) => {
      console.log(`  ${guaranteeName}: ${(guaranteeRules as any[]).length} règles`);
    });
    console.log('');
  } else {
    console.log('  Aucune règle\n');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 RÉSUMÉ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`VOL:                 ${categories.VOL.length} règles`);
  console.log(`INCENDIE:            ${categories.INCENDIE.length} règles`);
  console.log(`DOMMAGES COLLISION:  ${categories.DOMMAGES_COLLISIONS.length} règles`);
  console.log(`TOUS RISQUES:        ${categories.TOUS_RISQUES.length} règles`);
  console.log(`AUTRES:              ${categories.OTHER.length} règles`);
  console.log(`─────────────────────────────────────────────────────────────`);
  console.log(`TOTAL:               ${rules.length} règles`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Check for rules with referenceValue
  console.log('🔍 ANALYSE DES VALEURS DE RÉFÉRENCE');
  console.log('─────────────────────────────────────────────────────────────');
  
  const withReferenceValue = rules.filter(r => r.referenceValue !== null);
  const withoutReferenceValue = rules.filter(r => r.referenceValue === null);
  
  console.log(`Règles avec valeur de référence:    ${withReferenceValue.length}`);
  console.log(`Règles sans valeur de référence:    ${withoutReferenceValue.length}\n`);

  if (withoutReferenceValue.length > 0) {
    console.log('⚠️  Règles sans valeur de référence:');
    withoutReferenceValue.forEach((rule) => {
      if (['VOL', 'INCENDIE', 'TOUS_RISQUES_ZERO', 'DOMMAGES_COLLISIONS'].includes(rule.guarantee.code)) {
        console.log(`  - ${rule.company.name} / ${rule.guarantee.nameFr} (ID: ${rule.id})`);
      }
    });
    console.log('');
  }

  await prisma.$disconnect();
}

analyzeRules()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
