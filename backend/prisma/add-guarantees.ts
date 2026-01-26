import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addGuarantees() {
  console.log('🔧 Adding missing guarantees...\n');

  const guarantees = [
    { code: 'CAS', nameFr: 'Corporel Assuré Seul', nameEn: 'Personal Injury', nameAr: 'الإصابات الجسدية', isOptional: true },
    { code: 'VOL', nameFr: 'Vol', nameEn: 'Theft', nameAr: 'السرقة', isOptional: true },
    { code: 'INCENDIE', nameFr: 'Incendie', nameEn: 'Fire', nameAr: 'الحريق', isOptional: true },
    { code: 'INCENDIE_EMEUTES', nameFr: 'Incendie suite émeutes', nameEn: 'Fire following riots', nameAr: 'الحريق بعد الشغب', isOptional: true },
    { code: 'CATASTROPHES_NATURELLES', nameFr: 'Extension Catastrophes Naturelles', nameEn: 'Natural Disasters Extension', nameAr: 'تمديد الكوارث الطبيعية', isOptional: true },
    { code: 'DOMMAGES_EMEUTES', nameFr: 'Dommages suite émeutes', nameEn: 'Damage following riots', nameAr: 'الأضرار بعد الشغب', isOptional: true },
    { code: 'PERSONNES_TRANSPORTEES', nameFr: 'Personnes Transportées', nameEn: 'Passengers', nameAr: 'الأشخاص المنقولون', isOptional: true },
    { code: 'ASSISTANCE', nameFr: 'Assistance Remorquage', nameEn: 'Roadside Assistance', nameAr: 'المساعدة على الطريق', isOptional: true },
    { code: 'TOUS_RISQUES_0', nameFr: 'Tous Risques 0%', nameEn: 'All Risks 0%', nameAr: 'جميع المخاطر 0٪', isOptional: true },
    { code: 'TOUS_RISQUES_ZERO', nameFr: 'Tous Risques 0%', nameEn: 'All Risks 0%', nameAr: 'جميع المخاطر 0٪', isOptional: true },
    { code: 'DOMMAGES_COLLISIONS', nameFr: 'Dommages Collision', nameEn: 'Collision Damage', nameAr: 'أضرار التصادم', isOptional: true },
    { code: 'BG', nameFr: 'Bris de Glaces', nameEn: 'Glass Breakage', nameAr: 'كسر الزجاج', isOptional: true },
    { code: 'DEFENSE_RECOURS', nameFr: 'Défense et Recours', nameEn: 'Legal Defense', nameAr: 'الدفاع والطعن', isOptional: true },
  ];

  for (const g of guarantees) {
    const existing = await prisma.guarantee.findUnique({ where: { code: g.code } });
    if (!existing) {
      await prisma.guarantee.create({ data: g });
      console.log(`✅ Created: ${g.code}`);
    } else {
      console.log(`⏭️  Exists: ${g.code}`);
    }
  }

  console.log('\n✅ All guarantees added!\n');
}

addGuarantees()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
