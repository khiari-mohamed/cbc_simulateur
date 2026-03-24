import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createMissingGuarantees() {
  console.log('🔧 CRÉATION DES GARANTIES ET RÈGLES MANQUANTES\n');
  console.log('='.repeat(80));

  try {
    // 1. Create missing guarantees
    console.log('\n📋 1. CRÉATION DES GARANTIES MANQUANTES\n');

    const guaranteesToCreate = [
      { code: 'RC', nameFr: 'Responsabilité Civile', nameAr: 'المسؤولية المدنية', isOptional: false },
      { code: 'CAS', nameFr: 'Corporel Assuré', nameAr: 'الأضرار الجسدية للمؤمن', isOptional: false },
      { code: 'VOL', nameFr: 'Vol', nameAr: 'السرقة', isOptional: false },
      { code: 'INCENDIE', nameFr: 'Incendie', nameAr: 'الحريق', isOptional: false },
      { code: 'PERSONNES_TRANSPORTEES', nameFr: 'Personnes Transportées', nameAr: 'الأشخاص المنقولون', isOptional: false },
      { code: 'ASSISTANCE', nameFr: 'Assistance', nameAr: 'المساعدة', isOptional: false },
      { code: 'TOUS_RISQUES_ZERO', nameFr: 'Tous Risques 0%', nameAr: 'جميع المخاطر 0%', isOptional: true },
      { code: 'DOMMAGES_COLLISIONS', nameFr: 'Dommages Collisions', nameAr: 'أضرار التصادم', isOptional: true },
      { code: 'BG', nameFr: 'Bris de Glaces', nameAr: 'كسر الزجاج', isOptional: true },
      { code: 'INCENDIE_EMEUTES', nameFr: 'Incendie Émeutes', nameAr: 'حريق الشغب', isOptional: true },
      { code: 'CATASTROPHES_NATURELLES', nameFr: 'Catastrophes Naturelles', nameAr: 'الكوارث الطبيعية', isOptional: true },
      { code: 'DOMMAGES_EMEUTES', nameFr: 'Dommages Émeutes', nameAr: 'أضرار الشغب', isOptional: true },
      { code: 'DEFENSE_RECOURS', nameFr: 'Défense et Recours', nameAr: 'الدفاع والطعن', isOptional: true },
    ];

    for (const g of guaranteesToCreate) {
      const existing = await prisma.guarantee.findUnique({ where: { code: g.code } });
      if (!existing) {
        await prisma.guarantee.create({ data: g });
        console.log(`✅ Créé: ${g.code} - ${g.nameFr}`);
      } else {
        console.log(`⏭️  Existe déjà: ${g.code}`);
      }
    }

    // 2. Get all companies
    console.log('\n\n🏢 2. RÉCUPÉRATION DES COMPAGNIES\n');
    const companies = await prisma.company.findMany({ where: { isActive: true } });
    
    if (companies.length === 0) {
      console.log('❌ Aucune compagnie trouvée. Veuillez créer des compagnies d\'abord.');
      return;
    }

    console.log(`Trouvé ${companies.length} compagnie(s):`);
    companies.forEach(c => console.log(`   - ${c.name} (${c.code})`));

    // 3. Create basic pricing rules for mandatory guarantees
    console.log('\n\n⚙️  3. CRÉATION DES RÈGLES DE BASE\n');

    // CAS - Fixed premium for all companies
    const casGuarantee = await prisma.guarantee.findUnique({ where: { code: 'CAS' } });
    if (casGuarantee) {
      console.log('\n📌 CAS (Corporel Assuré):');
      for (const company of companies) {
        const existing = await prisma.pricingRule.findFirst({
          where: {
            companyId: company.id,
            guaranteeId: casGuarantee.id,
            isActive: true,
          }
        });

        if (!existing) {
          await prisma.pricingRule.create({
            data: {
              companyId: company.id,
              guaranteeId: casGuarantee.id,
              fixedPremium: 1000, // Default: 1000 DT
              isActive: true,
            }
          });
          console.log(`   ✅ ${company.name}: Créé (1000 DT)`);
        } else {
          console.log(`   ⏭️  ${company.name}: Existe déjà`);
        }
      }
    }

    // ASSISTANCE - Fixed premium for all companies
    const assistanceGuarantee = await prisma.guarantee.findUnique({ where: { code: 'ASSISTANCE' } });
    if (assistanceGuarantee) {
      console.log('\n📌 ASSISTANCE:');
      for (const company of companies) {
        const existing = await prisma.pricingRule.findFirst({
          where: {
            companyId: company.id,
            guaranteeId: assistanceGuarantee.id,
            isActive: true,
          }
        });

        if (!existing) {
          await prisma.pricingRule.create({
            data: {
              companyId: company.id,
              guaranteeId: assistanceGuarantee.id,
              fixedPremium: 50, // Default: 50 DT
              isActive: true,
            }
          });
          console.log(`   ✅ ${company.name}: Créé (50 DT)`);
        } else {
          console.log(`   ⏭️  ${company.name}: Existe déjà`);
        }
      }
    }

    // VOL - Basic rate for all companies
    const volGuarantee = await prisma.guarantee.findUnique({ where: { code: 'VOL' } });
    if (volGuarantee) {
      console.log('\n📌 VOL:');
      for (const company of companies) {
        const existing = await prisma.pricingRule.findFirst({
          where: {
            companyId: company.id,
            guaranteeId: volGuarantee.id,
            isActive: true,
          }
        });

        if (!existing) {
          await prisma.pricingRule.create({
            data: {
              companyId: company.id,
              guaranteeId: volGuarantee.id,
              ratePercentage: 0.0025, // 0.25%
              fixedPremium: 10,
              isActive: true,
            }
          });
          console.log(`   ✅ ${company.name}: Créé (0.25% + 10 DT)`);
        } else {
          console.log(`   ⏭️  ${company.name}: Existe déjà`);
        }
      }
    }

    // INCENDIE - Basic rate for all companies
    const incendieGuarantee = await prisma.guarantee.findUnique({ where: { code: 'INCENDIE' } });
    if (incendieGuarantee) {
      console.log('\n📌 INCENDIE:');
      for (const company of companies) {
        const existing = await prisma.pricingRule.findFirst({
          where: {
            companyId: company.id,
            guaranteeId: incendieGuarantee.id,
            isActive: true,
          }
        });

        if (!existing) {
          await prisma.pricingRule.create({
            data: {
              companyId: company.id,
              guaranteeId: incendieGuarantee.id,
              ratePercentage: 0.0015, // 0.15%
              fixedPremium: 10,
              isActive: true,
            }
          });
          console.log(`   ✅ ${company.name}: Créé (0.15% + 10 DT)`);
        } else {
          console.log(`   ⏭️  ${company.name}: Existe déjà`);
        }
      }
    }

    // PERSONNES_TRANSPORTEES - Basic capitals
    const ptaGuarantee = await prisma.guarantee.findUnique({ where: { code: 'PERSONNES_TRANSPORTEES' } });
    if (ptaGuarantee) {
      console.log('\n📌 PERSONNES_TRANSPORTEES:');
      const capitals = [
        { minCapital: 5000, fixedPremium: 20 },
        { minCapital: 10000, fixedPremium: 30 },
        { minCapital: 20000, fixedPremium: 50 },
      ];

      for (const company of companies) {
        for (const cap of capitals) {
          const existing = await prisma.pricingRule.findFirst({
            where: {
              companyId: company.id,
              guaranteeId: ptaGuarantee.id,
              minCapital: cap.minCapital,
              isActive: true,
            }
          });

          if (!existing) {
            await prisma.pricingRule.create({
              data: {
                companyId: company.id,
                guaranteeId: ptaGuarantee.id,
                minCapital: cap.minCapital,
                fixedPremium: cap.fixedPremium,
                isActive: true,
              }
            });
            console.log(`   ✅ ${company.name}: Créé capital ${cap.minCapital} DT (${cap.fixedPremium} DT)`);
          } else {
            console.log(`   ⏭️  ${company.name}: Capital ${cap.minCapital} existe déjà`);
          }
        }
      }
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('✅ CRÉATION TERMINÉE\n');
    console.log('⚠️  IMPORTANT:');
    console.log('   - Les règles RC doivent être créées via le tableau RC (seed-minimal.ts)');
    console.log('   - Les valeurs créées sont des EXEMPLES, ajustez-les selon vos besoins');
    console.log('   - Configurez les garanties optionnelles (TR, DC, BG) selon vos formules\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingGuarantees();
