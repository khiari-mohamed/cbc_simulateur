import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Ars2025++@197.14.56.80:5432/cbc_ars?schema=public',
    },
  },
});

const ROLE_MAPPINGS = {
  // Mandatory guarantees
  'RC': 'MANDATORY_RC',
  'VOL': 'MANDATORY_VOL',
  'INCENDIE': 'MANDATORY_INCENDIE',
  'CAS': 'MANDATORY_CAS',
  'PERSONNES_TRANSPORTEES': 'MANDATORY_PERSONNES_TRANSPORTEES',
  'ASSISTANCE': 'MANDATORY_ASSISTANCE',
  
  // Optional guarantees
  'TOUS_RISQUES_ZERO': 'OPTIONAL_TOUS_RISQUES',
  'DOMMAGES_COLLISIONS': 'OPTIONAL_DOMMAGES_COLLISIONS',
  'BG': 'OPTIONAL_BRIS_GLACES',
  'CATASTROPHES_NATURELLES': 'OPTIONAL_CATASTROPHES_NATURELLES',
  'DOMMAGES_EMEUTES': 'OPTIONAL_DOMMAGES_EMEUTES',
  'INCENDIE_EMEUTES': 'OPTIONAL_INCENDIE_EMEUTES',
  'DEFENSE_RECOURS': 'OPTIONAL_DEFENSE_RECOURS',
  'ASSURANCE_CONDUCTEUR': 'OPTIONAL_ASSURANCE_CONDUCTEUR',
};

async function assignSystemRoles() {
  console.log('🔧 Assigning system roles to existing guarantees in PRODUCTION...\n');

  for (const [code, role] of Object.entries(ROLE_MAPPINGS)) {
    const guarantee = await prisma.guarantee.findFirst({
      where: { code },
    });

    if (guarantee) {
      await prisma.guarantee.update({
        where: { id: guarantee.id },
        data: { systemRole: role as any },
      });
      console.log(`✅ ${code.padEnd(30)} → ${role}`);
    } else {
      console.log(`⚠️  ${code.padEnd(30)} → NOT FOUND (skipping)`);
    }
  }

  console.log('\n📋 Final guarantee list with roles:');
  const allGuarantees = await prisma.guarantee.findMany({
    orderBy: { code: 'asc' },
  });

  for (const g of allGuarantees) {
    const roleDisplay = g.systemRole || 'NO_ROLE';
    const optionalDisplay = g.isOptional ? 'Optional' : 'Mandatory';
    console.log(`  ✅ ${g.code.padEnd(30)} | ${roleDisplay.padEnd(45)} | ${g.nameFr}`);
  }

  console.log('\n✅ All system roles assigned!');
}

assignSystemRoles()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
