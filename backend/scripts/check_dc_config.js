const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDommagesCollisionConfig() {
  try {
    console.log('🔍 Checking Dommages Collision configuration...\n');

    // 1. Check if DOMMAGES_COLLISIONS guarantee exists
    const dcGuarantee = await prisma.guarantee.findFirst({
      where: {
        code: 'DOMMAGES_COLLISIONS'
      }
    });

    if (!dcGuarantee) {
      console.log('❌ DOMMAGES_COLLISIONS guarantee NOT FOUND in database!\n');
      return;
    }

    console.log('✅ DOMMAGES_COLLISIONS guarantee found:');
    console.log(`   ID: ${dcGuarantee.id}`);
    console.log(`   Name: ${dcGuarantee.nameFr}`);
    console.log(`   Code: ${dcGuarantee.code}`);
    console.log(`   System Role: ${dcGuarantee.systemRole}`);
    console.log('');

    // 2. Check guarantee availability for AL BARAKA
    const alBaraka = await prisma.company.findFirst({
      where: { name: 'AL BARAKA' }
    });

    if (!alBaraka) {
      console.log('❌ AL BARAKA company NOT FOUND!\n');
      return;
    }

    console.log(`✅ AL BARAKA company found: ${alBaraka.id}\n`);

    const availability = await prisma.guaranteeAvailability.findFirst({
      where: {
        guaranteeId: dcGuarantee.id,
        companyId: alBaraka.id,
        formulaType: 'DOMMAGES_COLLISIONS'
      }
    });

    if (!availability) {
      console.log('❌ No availability record for DOMMAGES_COLLISIONS in AL BARAKA for DOMMAGES_COLLISIONS formula');
      console.log('   This means the guarantee is not configured for this company/formula\n');
    } else {
      console.log('✅ Availability found:');
      console.log(`   Status: ${availability.status}`);
      console.log(`   Formula: ${availability.formulaType}`);
      console.log('');
    }

    // 3. Check pricing rules for DOMMAGES_COLLISIONS
    console.log('🔍 Checking pricing rules for DOMMAGES_COLLISIONS...\n');

    const pricingRules = await prisma.guaranteePricingRule.findMany({
      where: {
        guaranteeId: dcGuarantee.id,
        companyId: alBaraka.id,
        formulaType: 'DOMMAGES_COLLISIONS'
      },
      orderBy: {
        minCapital: 'asc'
      }
    });

    if (pricingRules.length === 0) {
      console.log('❌ NO PRICING RULES found for DOMMAGES_COLLISIONS!');
      console.log('   This is why the dropdown is empty - no capital options configured\n');
    } else {
      console.log(`✅ Found ${pricingRules.length} pricing rules:\n`);
      pricingRules.forEach((rule, index) => {
        console.log(`${index + 1}. Capital: ${rule.minCapital} - ${rule.maxCapital || 'UNLIMITED'} DT`);
        console.log(`   Rate Type: ${rule.rateType}`);
        console.log(`   Rate: ${rule.rate}`);
        console.log(`   Min Premium: ${rule.minPremium || 'N/A'} DT`);
        console.log('');
      });
    }

    // 4. Check capital values table
    console.log('🔍 Checking CapitalValue table for DOMMAGES_COLLISIONS...\n');

    const capitalValues = await prisma.capitalValue.findMany({
      where: {
        guaranteeId: dcGuarantee.id,
        companyId: alBaraka.id,
        formulaType: 'DOMMAGES_COLLISIONS',
        isActive: true
      },
      orderBy: {
        value: 'asc'
      }
    });

    if (capitalValues.length === 0) {
      console.log('❌ NO CAPITAL VALUES found in CapitalValue table!');
      console.log('   The dropdown needs capital values to display options\n');
      console.log('💡 Solution: Add capital values to the CapitalValue table for DOMMAGES_COLLISIONS\n');
    } else {
      console.log(`✅ Found ${capitalValues.length} capital values:\n`);
      capitalValues.forEach((cv, index) => {
        console.log(`${index + 1}. ${cv.value.toLocaleString()} DT - ${cv.label || 'No label'}`);
      });
      console.log('');
    }

    // 5. Summary
    console.log('\n📊 SUMMARY:');
    console.log('─────────────────────────────────────────────────');
    console.log(`Guarantee exists: ${dcGuarantee ? '✅' : '❌'}`);
    console.log(`Availability configured: ${availability ? '✅' : '❌'}`);
    console.log(`Pricing rules exist: ${pricingRules.length > 0 ? '✅' : '❌'}`);
    console.log(`Capital values exist: ${capitalValues.length > 0 ? '✅' : '❌'}`);
    console.log('─────────────────────────────────────────────────\n');

    if (capitalValues.length === 0) {
      console.log('🔧 TO FIX: You need to add capital values for DOMMAGES_COLLISIONS');
      console.log('   Run this SQL or use the admin panel:\n');
      console.log(`   INSERT INTO "CapitalValue" ("id", "guaranteeId", "companyId", "formulaType", "value", "label", "isActive")`);
      console.log(`   VALUES`);
      console.log(`     (gen_random_uuid(), '${dcGuarantee.id}', '${alBaraka.id}', 'DOMMAGES_COLLISIONS', 5000, '5,000 DT', true),`);
      console.log(`     (gen_random_uuid(), '${dcGuarantee.id}', '${alBaraka.id}', 'DOMMAGES_COLLISIONS', 10000, '10,000 DT', true),`);
      console.log(`     (gen_random_uuid(), '${dcGuarantee.id}', '${alBaraka.id}', 'DOMMAGES_COLLISIONS', 15000, '15,000 DT', true);\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDommagesCollisionConfig();
