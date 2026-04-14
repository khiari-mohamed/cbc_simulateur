// scripts/debug-capitals.js
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function debug() {
  const company = await prisma.company.findFirst({ where: { name: 'AL BARAKA' } });
  const usage = await prisma.usage.findFirst({ where: { nameFr: 'Privé/Affaires' } });

  const capitals = await prisma.dcMatrixCapital.findMany({
    where: { companyId: company.id, usageId: usage.id, isActive: true },
    orderBy: { order: 'asc' }
  });

  console.log('Capitaux trouvés:');
  capitals.forEach(c => {
    console.log(`  ID: ${c.id}`);
    console.log(`  Amount: ${c.amount} (type: ${typeof c.amount})`);
    console.log(`  Order: ${c.order}`);
    console.log('---');
  });

  const testAmount = 1000;
  const found = capitals.find(c => c.amount === testAmount);
  console.log(`\nTest find(c => c.amount === ${testAmount}):`, found ? 'TROUVÉ' : 'NON TROUVÉ');
  
  const foundNumber = capitals.find(c => c.amount === Number(testAmount));
  console.log(`Test find(c => c.amount === Number(${testAmount})):`, foundNumber ? 'TROUVÉ' : 'NON TROUVÉ');

  await prisma.$disconnect();
}

debug().catch(console.error);
