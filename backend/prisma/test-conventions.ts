import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Creating test conventions...');

  // Get existing data
  const lloyd = await prisma.company.findUnique({ where: { code: 'LLOYD' } });
  const amana = await prisma.company.findUnique({ where: { code: 'AMANA' } });
  const client = await prisma.user.findUnique({ where: { email: 'client@test.com' } });
  const allGuarantees = await prisma.guarantee.findMany({ where: { isActive: true } });

  if (!lloyd || !amana || !client) {
    throw new Error('❌ Base data not found. Run seed.ts first!');
  }

  console.log('✅ Found base data:', { lloyd: lloyd.name, amana: amana.name, client: client.email });

  // Convention 1: Standard LLOYD (no special reductions)
  const conv1 = await prisma.convention.create({
    data: {
      name: 'Convention Standard LLOYD',
      companyId: lloyd.id,
    },
  });
  console.log('✅ Created:', conv1.name);

  // Assign client to convention 1
  await prisma.userConvention.create({
    data: {
      userId: client.id,
      conventionId: conv1.id,
    },
  });
  console.log('   → Assigned client to convention');

  // Assign ALL guarantees to convention 1
  for (const guarantee of allGuarantees) {
    await prisma.conventionGuarantee.create({
      data: {
        conventionId: conv1.id,
        guaranteeId: guarantee.id,
      },
    });
  }
  console.log(`   → Assigned ${allGuarantees.length} guarantees`);

  // Convention 2: VIP AMANA (15% reduction on VOL, INCENDIE, TOUS_RISQUES, DOMMAGES_COLLISIONS)
  const conv2 = await prisma.convention.create({
    data: {
      name: 'Convention VIP AMANA',
      companyId: amana.id,
    },
  });
  console.log('✅ Created:', conv2.name);

  // Assign client to convention 2 (same client, different convention!)
  await prisma.userConvention.create({
    data: {
      userId: client.id,
      conventionId: conv2.id,
    },
  });
  console.log('   → Assigned client to convention');

  // Assign ALL guarantees to convention 2
  for (const guarantee of allGuarantees) {
    await prisma.conventionGuarantee.create({
      data: {
        conventionId: conv2.id,
        guaranteeId: guarantee.id,
      },
    });
  }
  console.log(`   → Assigned ${allGuarantees.length} guarantees`);

  // Create special pricing rules for Convention 2 (VIP rates)
  const volGuarantee = allGuarantees.find(g => g.code === 'VOL');
  const incendieGuarantee = allGuarantees.find(g => g.code === 'INCENDIE');
  const trGuarantee = allGuarantees.find(g => g.code === 'TOUS_RISQUES_ZERO');
  const dcGuarantee = allGuarantees.find(g => g.code === 'DOMMAGES_COLLISIONS');

  if (volGuarantee) {
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: volGuarantee.id,
        conventionId: conv2.id,
        reductionRate: 0.85, // 15% discount
        isActive: true,
      },
    });
    console.log('   → VOL: 15% reduction (0.85)');
  }

  if (incendieGuarantee) {
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: incendieGuarantee.id,
        conventionId: conv2.id,
        reductionRate: 0.85, // 15% discount
        isActive: true,
      },
    });
    console.log('   → INCENDIE: 15% reduction (0.85)');
  }

  if (trGuarantee) {
    // Create special TR rules for convention with 15% discount
    const trRates = [
      { franchise: 0, rate: 0.032, fixed: 22.0 },
      { franchise: 1, rate: 0.0265, fixed: 21.75 },
      { franchise: 2, rate: 0.021, fixed: 19.0 },
      { franchise: 4, rate: 0.017, fixed: 15.0 },
    ];
    for (const tr of trRates) {
      await prisma.pricingRule.create({
        data: {
          companyId: amana.id,
          guaranteeId: trGuarantee.id,
          conventionId: conv2.id,
          franchiseRate: tr.franchise,
          ratePercentage: tr.rate,
          fixedPremium: tr.fixed,
          reductionRate: 0.85, // 15% discount
          isActive: true,
        },
      });
    }
    console.log('   → TOUS_RISQUES: 15% reduction (0.85)');
  }

  if (dcGuarantee) {
    await prisma.pricingRule.create({
      data: {
        companyId: amana.id,
        guaranteeId: dcGuarantee.id,
        conventionId: conv2.id,
        basePremium: 10.0,
        reductionRate: 0.85, // 15% discount
        usageType: 'PRIVATE_BUSINESS',
        isActive: true,
      },
    });
    console.log('   → DOMMAGES_COLLISIONS: 15% reduction (0.85)');
  }

  console.log('\n🎉 Test conventions created successfully!');
  console.log('\n📋 Summary:');
  console.log('   Convention 1: "Convention Standard LLOYD"');
  console.log('     - Company: LLOYD');
  console.log('     - Client: client@test.com');
  console.log('     - Reduction: Standard (1.0 = no discount)');
  console.log('');
  console.log('   Convention 2: "Convention VIP AMANA"');
  console.log('     - Company: AMANA');
  console.log('     - Client: client@test.com (SAME CLIENT!)');
  console.log('     - Reduction: VIP (0.85 = 15% discount on VOL, INCENDIE, TR, DC)');
  console.log('');
  console.log('✅ This demonstrates:');
  console.log('   - Same client can have multiple conventions');
  console.log('   - Different companies per convention');
  console.log('   - Different reduction rates per convention');
  console.log('   - Convention-based pricing');
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
