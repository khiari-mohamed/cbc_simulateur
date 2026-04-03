import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:23044943@10.34.60.63:5432/cbc_ars?schema=public',
    },
  },
});

async function fixIncendieGuarantee() {
  console.log('🔧 Fixing INCENDIE guarantee in production...\n');

  // Step 1: Find the wrong guarantee (INC)
  const wrongGuarantee = await prisma.guarantee.findUnique({
    where: { code: 'INC' },
  });

  if (!wrongGuarantee) {
    console.log('❌ INC guarantee not found!');
    await prisma.$disconnect();
    return;
  }

  console.log('📋 Found wrong guarantee:');
  console.log(`   ID: ${wrongGuarantee.id}`);
  console.log(`   Code: "${wrongGuarantee.code}" ❌ (should be "INCENDIE")`);
  console.log(`   isOptional: ${wrongGuarantee.isOptional} ❌ (should be false)`);
  console.log(`   isActive: ${wrongGuarantee.isActive} ❌ (should be true)`);
  console.log('');

  // Step 2: Check if INCENDIE already exists
  const existingIncendie = await prisma.guarantee.findUnique({
    where: { code: 'INCENDIE' },
  });

  if (existingIncendie) {
    console.log('⚠️  INCENDIE already exists! Deleting INC instead...');
    await prisma.guarantee.delete({
      where: { code: 'INC' },
    });
    console.log('✅ Deleted INC guarantee');
  } else {
    // Step 3: Update INC to INCENDIE
    console.log('🔄 Updating INC to INCENDIE...');
    
    const updated = await prisma.guarantee.update({
      where: { code: 'INC' },
      data: {
        code: 'INCENDIE',
        isOptional: false,
        isActive: true,
      },
    });

    console.log('✅ Updated successfully!');
    console.log(`   New Code: "${updated.code}"`);
    console.log(`   isOptional: ${updated.isOptional}`);
    console.log(`   isActive: ${updated.isActive}`);
  }

  console.log('\n✅ Done! Now check if INCENDIE exists:');
  const finalCheck = await prisma.guarantee.findUnique({
    where: { code: 'INCENDIE' },
  });

  if (finalCheck) {
    console.log('✅ INCENDIE guarantee exists:');
    console.log(`   ID: ${finalCheck.id}`);
    console.log(`   Code: ${finalCheck.code}`);
    console.log(`   isOptional: ${finalCheck.isOptional}`);
    console.log(`   isActive: ${finalCheck.isActive}`);
  } else {
    console.log('❌ INCENDIE still not found! Creating it...');
    const created = await prisma.guarantee.create({
      data: {
        code: 'INCENDIE',
        nameFr: 'Incendie',
        isOptional: false,
        isActive: true,
      },
    });
    console.log('✅ Created INCENDIE:', created.id);
  }

  await prisma.$disconnect();
}

fixIncendieGuarantee().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
