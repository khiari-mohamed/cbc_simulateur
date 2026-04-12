import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllGuarantees() {
  console.log('🔍 VÉRIFICATION: Toutes les garanties ont-elles un systemRole ?\n');
  console.log('='.repeat(80));

  const allGuarantees = await prisma.guarantee.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' }
  });

  console.log(`\n📊 Total garanties actives: ${allGuarantees.length}\n`);

  const withoutSystemRole = allGuarantees.filter(g => !g.systemRole);
  const withSystemRole = allGuarantees.filter(g => g.systemRole);

  console.log('✅ GARANTIES AVEC SYSTEMROLE:\n');
  withSystemRole.forEach(g => {
    const optional = g.isOptional ? '(Optionnelle)' : '(Obligatoire)';
    console.log(`   ${g.code.padEnd(30)} ${optional.padEnd(15)} → ${g.systemRole}`);
  });

  if (withoutSystemRole.length > 0) {
    console.log('\n❌ GARANTIES SANS SYSTEMROLE:\n');
    withoutSystemRole.forEach(g => {
      const optional = g.isOptional ? '(Optionnelle)' : '(Obligatoire)';
      console.log(`   ${g.code.padEnd(30)} ${optional.padEnd(15)} → NULL`);
    });

    console.log('\n⚠️  ATTENTION: Ces garanties peuvent causer des bugs !');
    console.log('   Le pricing-engine cherche les garanties par systemRole.');
    console.log('   Si systemRole est NULL, la garantie ne sera pas trouvée.\n');

    console.log('💡 SOLUTION: Ajouter un systemRole pour chaque garantie:');
    console.log('   - Obligatoires: MANDATORY_XXX');
    console.log('   - Optionnelles: OPTIONAL_XXX\n');
  } else {
    console.log('\n✅ Toutes les garanties ont un systemRole configuré !\n');
  }

  console.log('='.repeat(80));
}

checkAllGuarantees()
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
