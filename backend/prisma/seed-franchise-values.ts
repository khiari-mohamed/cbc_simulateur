import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFranchiseValues() {
  console.log('🎯 Seeding franchise values...');

  const franchiseValues = [
    {
      value: new Prisma.Decimal(0),
      label: 'Couverture maximale',
      description: 'Franchise 0% - Prime la plus élevée, aucun reste à charge',
      isStandard: true,
    },
    {
      value: new Prisma.Decimal(1),
      label: 'Équilibre optimal',
      description: 'Franchise 1% - Bon compromis entre prime et reste à charge',
      isStandard: true,
    },
    {
      value: new Prisma.Decimal(2),
      label: 'Économie modérée',
      description: 'Franchise 2% - Prime réduite avec reste à charge modéré',
      isStandard: true,
    },
    {
      value: new Prisma.Decimal(4),
      label: 'Économie maximale',
      description: 'Franchise 4% - Prime la plus basse, reste à charge élevé',
      isStandard: true,
    },
  ];

  for (const franchise of franchiseValues) {
    await prisma.franchiseValue.upsert({
      where: { value: franchise.value },
      update: {},
      create: franchise,
    });
  }

  console.log('✅ Franchise values seeded successfully!');
}

seedFranchiseValues()
  .catch((e) => {
    console.error('❌ Error seeding franchise values:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
