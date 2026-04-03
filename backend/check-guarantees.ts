import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGuarantees() {
  console.log('🔍 Checking mandatory guarantees...\n');

  const mandatoryGuarantees = [
    { code: 'RC', nameFr: 'Responsabilité Civile', isOptional: false },
    { code: 'CAS', nameFr: 'Corporel Accident Siège', isOptional: false },
    { code: 'VOL', nameFr: 'Vol', isOptional: false },
    { code: 'INCENDIE', nameFr: 'Incendie', isOptional: false },
    { code: 'PERSONNES_TRANSPORTEES', nameFr: 'Personnes Transportées', isOptional: false },
    { code: 'ASSISTANCE', nameFr: 'Assistance', isOptional: false },
  ];

  for (const g of mandatoryGuarantees) {
    const existing = await prisma.guarantee.findUnique({
      where: { code: g.code },
    });

    if (!existing) {
      console.log(`❌ MISSING: ${g.code} (${g.nameFr})`);
      console.log(`   Creating it now...`);
      
      const created = await prisma.guarantee.create({
        data: {
          code: g.code,
          nameFr: g.nameFr,
          isOptional: g.isOptional,
          isActive: true,
        },
      });
      
      console.log(`   ✅ Created: ${created.id}\n`);
    } else {
      console.log(`✅ EXISTS: ${g.code} (${g.nameFr})`);
      console.log(`   ID: ${existing.id}`);
      console.log(`   isOptional: ${existing.isOptional}`);
      console.log(`   isActive: ${existing.isActive}\n`);
    }
  }

  console.log('\n📋 All guarantees in database:');
  const allGuarantees = await prisma.guarantee.findMany({
    orderBy: { code: 'asc' },
  });

  for (const g of allGuarantees) {
    console.log(`  - ${g.code.padEnd(30)} | ${g.nameFr.padEnd(40)} | Optional: ${g.isOptional} | Active: ${g.isActive}`);
  }

  await prisma.$disconnect();
}

checkGuarantees().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
