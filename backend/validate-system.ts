import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateSystem() {
  console.log('🔍 SYSTEM VALIDATION CHECKLIST\n');
  console.log('='.repeat(80) + '\n');

  let allGood = true;

  // 1. Check guarantees have systemRole
  console.log('1️⃣  Checking guarantees have systemRole assigned...');
  const guarantees = await prisma.guarantee.findMany({
    where: { isActive: true },
    select: { code: true, nameFr: true, systemRole: true, isOptional: true }
  });

  const mandatoryGuarantees = ['RC', 'VOL', 'INCENDIE', 'CAS', 'PERSONNES_TRANSPORTEES', 'ASSISTANCE'];
  const missingRoles: string[] = [];

  guarantees.forEach(g => {
    if (mandatoryGuarantees.includes(g.code) && !g.systemRole) {
      missingRoles.push(g.code);
      allGood = false;
    }
  });

  if (missingRoles.length > 0) {
    console.log(`   ❌ FAIL: ${missingRoles.length} guarantees missing systemRole: ${missingRoles.join(', ')}`);
    console.log(`   → Run: npx ts-node assign-system-roles.ts\n`);
  } else {
    console.log(`   ✅ PASS: All guarantees have systemRole assigned\n`);
  }

  // 2. Check pricing rules exist for mandatory guarantees
  console.log('2️⃣  Checking pricing rules for mandatory guarantees...');
  const companies = await prisma.company.findMany({ where: { isActive: true } });
  
  for (const guarantee of guarantees.filter(g => mandatoryGuarantees.includes(g.code))) {
    const guaranteeEntity = await prisma.guarantee.findFirst({
      where: { code: guarantee.code }
    });

    if (!guaranteeEntity) continue;

    for (const company of companies) {
      const rules = await prisma.pricingRule.findMany({
        where: {
          guaranteeId: guaranteeEntity.id,
          companyId: company.id,
          isActive: true
        }
      });

      if (rules.length === 0) {
        console.log(`   ❌ FAIL: No pricing rules for ${guarantee.code} - ${company.name}`);
        allGood = false;
      } else {
        console.log(`   ✅ ${guarantee.code} - ${company.name}: ${rules.length} rule(s)`);
      }
    }
  }
  console.log('');

  // 3. Check usage types exist
  console.log('3️⃣  Checking usage types...');
  const usages = await prisma.usage.findMany({ where: { isActive: true } });
  if (usages.length === 0) {
    console.log(`   ❌ FAIL: No usage types found`);
    allGood = false;
  } else {
    console.log(`   ✅ PASS: ${usages.length} usage type(s) found`);
    usages.forEach((u: any) => console.log(`      • ${u.code} - ${u.nameFr}`));
  }
  console.log('');

  // 4. Check companies exist
  console.log('4️⃣  Checking companies...');
  if (companies.length === 0) {
    console.log(`   ❌ FAIL: No companies found`);
    allGood = false;
  } else {
    console.log(`   ✅ PASS: ${companies.length} compan${companies.length > 1 ? 'ies' : 'y'} found`);
    companies.forEach(c => console.log(`      • ${c.name}`));
  }
  console.log('');

  // 5. Check RC pricing rules (most critical)
  console.log('5️⃣  Checking RC pricing rules coverage...');
  const rcGuarantee = await prisma.guarantee.findFirst({
    where: { systemRole: 'MANDATORY_RC' }
  });

  if (!rcGuarantee) {
    console.log(`   ❌ FAIL: RC guarantee not found`);
    allGood = false;
  } else {
    for (const company of companies) {
      const rcRules = await prisma.pricingRule.findMany({
        where: {
          guaranteeId: rcGuarantee.id,
          companyId: company.id,
          isActive: true
        }
      });

      // RC should have rules for different bonus-malus classes and power ranges
      if (rcRules.length < 10) {
        console.log(`   ⚠️  WARNING: ${company.name} has only ${rcRules.length} RC rules (expected ~40)`);
      } else {
        console.log(`   ✅ ${company.name}: ${rcRules.length} RC rules`);
      }
    }
  }
  console.log('');

  // 6. Check test user exists
  console.log('6️⃣  Checking test user...');
  const testUser = await prisma.user.findUnique({
    where: { email: 'client@test.com' }
  });

  if (!testUser) {
    console.log(`   ❌ FAIL: Test user (client@test.com) not found`);
    console.log(`   → Run: npx ts-node prisma/seed.ts\n`);
    allGood = false;
  } else {
    console.log(`   ✅ PASS: Test user exists (client@test.com / client123)\n`);
  }

  // Summary
  console.log('='.repeat(80));
  if (allGood) {
    console.log('🎉 SYSTEM READY: All checks passed!');
    console.log('   You can now run: npx ts-node test-quote-generation.ts');
  } else {
    console.log('⚠️  SYSTEM NOT READY: Some checks failed');
    console.log('   Fix the issues above before running tests');
  }
  console.log('='.repeat(80) + '\n');

  await prisma.$disconnect();
}

validateSystem().catch(console.error);
