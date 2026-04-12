const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBGConfig() {
  console.log('🔧 FIX BUG 3: BG Configuration\n');
  console.log('='.repeat(80));

  const bgGuarantee = await prisma.guarantee.findFirst({
    where: { systemRole: 'OPTIONAL_BRIS_GLACES' },
  });

  // Trouver toutes les configs BG avec status GRATUIT
  const bgConfigs = await prisma.guaranteeAvailability.findMany({
    where: {
      guaranteeId: bgGuarantee.id,
      status: 'GRATUIT',
    },
    include: {
      company: true,
    },
  });

  console.log(`\n📋 Trouvé ${bgConfigs.length} configs BG avec status GRATUIT\n`);

  for (const config of bgConfigs) {
    console.log(`Compagnie: ${config.company.name}`);
    console.log(`FormulaType: ${config.formulaType}`);
    console.log(`Status actuel: ${config.status}`);
    console.log(`→ Changement à: DEFAULT\n`);
  }

  console.log('='.repeat(80));
  console.log('\n⚠️  ATTENTION: Ce script va modifier la configuration BG !');
  console.log('Voulez-vous continuer ? (Exécutez avec --confirm pour appliquer)\n');

  if (process.argv.includes('--confirm')) {
    console.log('✅ Application des changements...\n');

    for (const config of bgConfigs) {
      await prisma.guaranteeAvailability.update({
        where: { id: config.id },
        data: { status: 'DEFAULT' },
      });
      console.log(`✅ ${config.company.name} - BG status changé à DEFAULT`);
    }

    console.log('\n🎉 FIX APPLIQUÉ !\n');
    console.log('📋 Résumé:');
    console.log(`- ${bgConfigs.length} configs BG modifiées`);
    console.log('- Status: GRATUIT → DEFAULT');
    console.log('- BG sera maintenant calculé normalement pour TR 0%\n');
  } else {
    console.log('ℹ️  Mode DRY-RUN - Aucun changement appliqué');
    console.log('Pour appliquer les changements, exécutez:');
    console.log('node fix-bg-config.js --confirm\n');
  }
}

fixBGConfig()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
