const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function cleanCarteGrise() {
  try {
    console.log('🧹 Cleaning old CARTE_GRISE documents...');
    
    const result = await prisma.document.deleteMany({
      where: {
        type: 'CARTE_GRISE',
        quoteId: null,
      },
    });

    console.log(`✅ Deleted ${result.count} old CARTE_GRISE document(s)`);
    console.log('✨ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanCarteGrise();
