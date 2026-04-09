const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const companyId = '480369c9-17aa-4b86-9ab0-9d75bfb92c77';
  const systemRole = 'OPTIONAL_ASSURANCE_CONDUCTEUR';
  
  console.log('Testing endpoint logic for AL BARAKA:', companyId);
  
  const guarantee = await prisma.guarantee.findFirst({
    where: { systemRole: systemRole, isActive: true }
  });
  
  console.log('Guarantee found:', guarantee ? guarantee.id : 'NOT FOUND');
  
  if (guarantee) {
    const rules = await prisma.pricingRule.findMany({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        isActive: true,
        minCapital: { not: null }
      },
      include: {
        company: { select: { id: true, name: true, code: true } },
        guarantee: { select: { id: true, code: true, nameFr: true } }
      },
      orderBy: { minCapital: 'asc' }
    });
    
    console.log('Rules found:', rules.length);
    console.log('Rules:', JSON.stringify(rules, null, 2));
  }
  
  await prisma.$disconnect();
}

test().catch(console.error);
