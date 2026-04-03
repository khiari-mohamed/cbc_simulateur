import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findSimilarGuarantees() {
  console.log('🔍 Searching for guarantees with codes similar to "INCENDIE"...\n');

  const allGuarantees = await prisma.guarantee.findMany();

  const searchTerm = 'incendie';
  const similar = allGuarantees.filter(g => 
    g.code.toLowerCase().includes(searchTerm) || 
    g.nameFr.toLowerCase().includes(searchTerm)
  );

  if (similar.length === 0) {
    console.log('❌ No guarantees found with "incendie" in code or name!\n');
  } else {
    console.log(`✅ Found ${similar.length} guarantee(s) with "incendie":\n`);
    for (const g of similar) {
      console.log(`📋 Guarantee:`);
      console.log(`   ID: ${g.id}`);
      console.log(`   Code: "${g.code}" (length: ${g.code.length})`);
      console.log(`   Name FR: "${g.nameFr}"`);
      console.log(`   isOptional: ${g.isOptional}`);
      console.log(`   isActive: ${g.isActive}`);
      console.log(`   Exact match for "INCENDIE": ${g.code === 'INCENDIE' ? '✅ YES' : '❌ NO'}`);
      console.log('');
    }
  }

  // Check exact match
  const exactMatch = await prisma.guarantee.findUnique({
    where: { code: 'INCENDIE' },
  });

  if (exactMatch) {
    console.log('✅ Exact match found for code "INCENDIE"');
  } else {
    console.log('❌ NO exact match for code "INCENDIE"');
    console.log('   The client probably created it with a different code!');
  }

  await prisma.$disconnect();
}

findSimilarGuarantees().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
