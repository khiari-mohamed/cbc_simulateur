import { PrismaClient, SystemRole } from '@prisma/client';

const prisma = new PrismaClient();

async function assignSystemRoles() {
  console.log('🔧 Assigning system roles to existing guarantees...\n');

  const roleMappings = [
    { code: 'RC', role: SystemRole.MANDATORY_RC },
    { code: 'VOL', role: SystemRole.MANDATORY_VOL },
    { code: 'INCENDIE', role: SystemRole.MANDATORY_INCENDIE },
    { code: 'CAS', role: SystemRole.MANDATORY_CAS },
    { code: 'PERSONNES_TRANSPORTEES', role: SystemRole.MANDATORY_PERSONNES_TRANSPORTEES },
    { code: 'ASSISTANCE', role: SystemRole.MANDATORY_ASSISTANCE },
    { code: 'TOUS_RISQUES_ZERO', role: SystemRole.OPTIONAL_TOUS_RISQUES },
    { code: 'DOMMAGES_COLLISIONS', role: SystemRole.OPTIONAL_DOMMAGES_COLLISIONS },
    { code: 'BG', role: SystemRole.OPTIONAL_BRIS_GLACES },
    { code: 'CATASTROPHES_NATURELLES', role: SystemRole.OPTIONAL_CATASTROPHES_NATURELLES },
    { code: 'DOMMAGES_EMEUTES', role: SystemRole.OPTIONAL_DOMMAGES_EMEUTES },
    { code: 'INCENDIE_EMEUTES', role: SystemRole.OPTIONAL_INCENDIE_EMEUTES },
    { code: 'DEFENSE_RECOURS', role: SystemRole.OPTIONAL_DEFENSE_RECOURS },
    { code: 'ASSURANCE_CONDUCTEUR', role: SystemRole.OPTIONAL_ASSURANCE_CONDUCTEUR },
  ];

  for (const mapping of roleMappings) {
    const guarantee = await prisma.guarantee.findUnique({
      where: { code: mapping.code },
    });

    if (guarantee) {
      await prisma.guarantee.update({
        where: { id: guarantee.id },
        data: { systemRole: mapping.role },
      });
      console.log(`✅ ${mapping.code.padEnd(30)} → ${mapping.role}`);
    } else {
      console.log(`⚠️  ${mapping.code.padEnd(30)} → Not found, skipping`);
    }
  }

  console.log('\n📋 Final guarantee list with roles:');
  const allGuarantees = await prisma.guarantee.findMany({
    orderBy: { code: 'asc' },
  });

  for (const g of allGuarantees) {
    const role = g.systemRole || 'NO_ROLE';
    const status = g.isActive ? '✅' : '❌';
    console.log(`  ${status} ${g.code.padEnd(30)} | ${role.padEnd(40)} | ${g.nameFr}`);
  }

  await prisma.$disconnect();
}

assignSystemRoles().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
