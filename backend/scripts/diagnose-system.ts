import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseSystem() {
  console.log('🔍 DIAGNOSTIC SYSTÈME - Vérification des Garanties et Règles\n');
  console.log('='.repeat(80));

  try {
    // 1. Check all guarantees
    console.log('\n📋 1. GARANTIES EXISTANTES\n');
    const guarantees = await prisma.guarantee.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    });

    const requiredGuarantees = [
      'RC', 'CAS', 'VOL', 'INCENDIE', 
      'PERSONNES_TRANSPORTEES', 'ASSISTANCE',
      'TOUS_RISQUES_ZERO', 'DOMMAGES_COLLISIONS', 'BG'
    ];

    console.log(`Total garanties actives: ${guarantees.length}\n`);
    
    requiredGuarantees.forEach(code => {
      const exists = guarantees.find(g => g.code === code);
      if (exists) {
        console.log(`✅ ${code.padEnd(25)} - ${exists.nameFr}`);
      } else {
        console.log(`❌ ${code.padEnd(25)} - MANQUANTE`);
      }
    });

    // 2. Check companies
    console.log('\n\n🏢 2. COMPAGNIES EXISTANTES\n');
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    console.log(`Total compagnies actives: ${companies.length}\n`);
    companies.forEach(c => {
      console.log(`✅ ${c.name} (${c.code})`);
    });

    // 3. Check pricing rules for mandatory guarantees
    console.log('\n\n⚙️  3. RÈGLES DE TARIFICATION OBLIGATOIRES\n');
    
    const mandatoryGuarantees = ['RC', 'CAS', 'VOL', 'INCENDIE', 'PERSONNES_TRANSPORTEES', 'ASSISTANCE'];
    
    for (const guaranteeCode of mandatoryGuarantees) {
      const guarantee = guarantees.find(g => g.code === guaranteeCode);
      if (!guarantee) {
        console.log(`\n❌ ${guaranteeCode}: Garantie non trouvée`);
        continue;
      }

      console.log(`\n📌 ${guaranteeCode} (${guarantee.nameFr}):`);
      
      for (const company of companies) {
        const rules = await prisma.pricingRule.findMany({
          where: {
            companyId: company.id,
            guaranteeId: guarantee.id,
            isActive: true,
          }
        });

        if (rules.length === 0) {
          console.log(`   ❌ ${company.name}: AUCUNE RÈGLE`);
        } else {
          console.log(`   ✅ ${company.name}: ${rules.length} règle(s)`);
          
          // Check for null values
          rules.forEach((rule, idx) => {
            const issues = [];
            if (guaranteeCode === 'RC' && rule.fixedPremium === null) {
              issues.push('fixedPremium NULL');
            }
            if (guaranteeCode === 'CAS' && rule.fixedPremium === null) {
              issues.push('fixedPremium NULL');
            }
            if (guaranteeCode === 'ASSISTANCE' && rule.fixedPremium === null) {
              issues.push('fixedPremium NULL');
            }
            if ((guaranteeCode === 'VOL' || guaranteeCode === 'INCENDIE') && 
                (rule.ratePercentage === null || rule.fixedPremium === null)) {
              issues.push('ratePercentage ou fixedPremium NULL');
            }
            if (guaranteeCode === 'PERSONNES_TRANSPORTEES' && 
                (rule.fixedPremium === null || rule.minCapital === null)) {
              issues.push('fixedPremium ou minCapital NULL');
            }

            if (issues.length > 0) {
              console.log(`      ⚠️  Règle ${idx + 1}: ${issues.join(', ')}`);
            }
          });
        }
      }
    }

    // 4. Check optional guarantees
    console.log('\n\n🔧 4. GARANTIES OPTIONNELLES\n');
    
    const optionalGuarantees = ['TOUS_RISQUES_ZERO', 'DOMMAGES_COLLISIONS', 'BG'];
    
    for (const guaranteeCode of optionalGuarantees) {
      const guarantee = guarantees.find(g => g.code === guaranteeCode);
      if (!guarantee) {
        console.log(`❌ ${guaranteeCode}: Garantie non trouvée`);
        continue;
      }

      const totalRules = await prisma.pricingRule.count({
        where: {
          guaranteeId: guarantee.id,
          isActive: true,
        }
      });

      console.log(`${totalRules > 0 ? '✅' : '⚠️ '} ${guaranteeCode}: ${totalRules} règle(s) configurée(s)`);
    }

    // 5. Summary
    console.log('\n\n📊 5. RÉSUMÉ\n');
    
    const missingGuarantees = requiredGuarantees.filter(
      code => !guarantees.find(g => g.code === code)
    );

    if (missingGuarantees.length > 0) {
      console.log(`❌ Garanties manquantes: ${missingGuarantees.join(', ')}`);
    } else {
      console.log('✅ Toutes les garanties requises existent');
    }

    // Check for companies without rules
    let companiesWithoutRules = 0;
    for (const company of companies) {
      for (const guaranteeCode of mandatoryGuarantees) {
        const guarantee = guarantees.find(g => g.code === guaranteeCode);
        if (!guarantee) continue;

        const rules = await prisma.pricingRule.count({
          where: {
            companyId: company.id,
            guaranteeId: guarantee.id,
            isActive: true,
          }
        });

        if (rules === 0) {
          companiesWithoutRules++;
          console.log(`❌ ${company.name} manque la règle ${guaranteeCode}`);
        }
      }
    }

    if (companiesWithoutRules === 0) {
      console.log('✅ Toutes les compagnies ont les règles obligatoires');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ DIAGNOSTIC TERMINÉ\n');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseSystem();
