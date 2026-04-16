import { PrismaClient, Role } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

/**
 * ✅ POST-CLEANUP VERIFICATION SCRIPT
 * 
 * Run this AFTER clean-test-data-for-prod.ts to verify production readiness
 */

async function verifyProductionReadiness() {
  console.log('✅ Verifying production readiness...\n');
  console.log('='.repeat(60));
  console.log('📊 Environment:', process.env.NODE_ENV || 'unknown');
  console.log('🗄️  Database:', process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'unknown');
  console.log('='.repeat(60));

  let allChecksPassed = true;
  const issues: string[] = [];

  try {
    // ========================================
    // CHECK 1: No client data remains
    // ========================================
    console.log('\n🔍 CHECK 1: Verifying test data removal...\n');

    const clientUsers = await prisma.user.count({ where: { role: Role.CLIENT_ADHERENT } });
    if (clientUsers === 0) {
      console.log('   ✅ No client accounts found');
    } else {
      console.log(`   ❌ FAIL: ${clientUsers} client accounts still exist`);
      allChecksPassed = false;
      issues.push(`${clientUsers} client accounts not deleted`);
    }

    const simulations = await prisma.simulation.count();
    if (simulations === 0) {
      console.log('   ✅ No simulations found');
    } else {
      console.log(`   ❌ FAIL: ${simulations} simulations still exist`);
      allChecksPassed = false;
      issues.push(`${simulations} simulations not deleted`);
    }

    const quotes = await prisma.quote.count();
    if (quotes === 0) {
      console.log('   ✅ No quotes found');
    } else {
      console.log(`   ❌ FAIL: ${quotes} quotes still exist`);
      allChecksPassed = false;
      issues.push(`${quotes} quotes not deleted`);
    }

    const contracts = await prisma.contract.count();
    if (contracts === 0) {
      console.log('   ✅ No contracts found');
    } else {
      console.log(`   ❌ FAIL: ${contracts} contracts still exist`);
      allChecksPassed = false;
      issues.push(`${contracts} contracts not deleted`);
    }

    const documents = await prisma.document.count();
    if (documents === 0) {
      console.log('   ✅ No documents found');
    } else {
      console.log(`   ❌ FAIL: ${documents} documents still exist`);
      allChecksPassed = false;
      issues.push(`${documents} documents not deleted`);
    }

    // ========================================
    // CHECK 2: Admin accounts exist
    // ========================================
    console.log('\n🔍 CHECK 2: Verifying admin accounts...\n');

    const adminUsers = await prisma.user.count({ where: { role: Role.ADMINISTRATEUR_ARS } });
    if (adminUsers > 0) {
      console.log(`   ✅ ${adminUsers} admin account(s) found`);
      
      const admins = await prisma.user.findMany({
        where: { role: Role.ADMINISTRATEUR_ARS },
        select: { email: true, firstName: true, lastName: true, isActive: true }
      });
      
      admins.forEach(admin => {
        console.log(`      - ${admin.email} (${admin.firstName} ${admin.lastName}) ${admin.isActive ? '✅' : '⚠️ INACTIVE'}`);
      });
    } else {
      console.log('   ❌ FAIL: No admin accounts found');
      allChecksPassed = false;
      issues.push('No admin accounts exist');
    }

    const gestionnaireUsers = await prisma.user.count({ where: { role: Role.GESTIONNAIRE_VALIDATION_ARS } });
    if (gestionnaireUsers > 0) {
      console.log(`   ✅ ${gestionnaireUsers} gestionnaire account(s) found`);
    } else {
      console.log('   ⚠️  WARNING: No gestionnaire accounts found (optional)');
    }

    // ========================================
    // CHECK 3: Configurations intact
    // ========================================
    console.log('\n🔍 CHECK 3: Verifying configurations...\n');

    const companies = await prisma.company.count();
    if (companies >= 2) {
      console.log(`   ✅ ${companies} companies configured`);
    } else {
      console.log(`   ⚠️  WARNING: Only ${companies} company found (expected 2+)`);
      issues.push(`Only ${companies} company configured`);
    }

    const guarantees = await prisma.guarantee.count();
    if (guarantees >= 10) {
      console.log(`   ✅ ${guarantees} guarantees configured`);
    } else {
      console.log(`   ❌ FAIL: Only ${guarantees} guarantees found (expected 10+)`);
      allChecksPassed = false;
      issues.push(`Only ${guarantees} guarantees configured`);
    }

    const pricingRules = await prisma.pricingRule.count();
    if (pricingRules >= 50) {
      console.log(`   ✅ ${pricingRules} pricing rules configured`);
    } else {
      console.log(`   ⚠️  WARNING: Only ${pricingRules} pricing rules found (expected 50+)`);
      issues.push(`Only ${pricingRules} pricing rules configured`);
    }

    const conventions = await prisma.convention.count();
    if (conventions >= 1) {
      console.log(`   ✅ ${conventions} convention(s) configured`);
    } else {
      console.log(`   ⚠️  WARNING: No conventions found`);
      issues.push('No conventions configured');
    }

    const reductionRules = await prisma.conventionReductionRule.count();
    if (reductionRules >= 10) {
      console.log(`   ✅ ${reductionRules} reduction rules configured`);
    } else {
      console.log(`   ⚠️  WARNING: Only ${reductionRules} reduction rules found`);
    }

    const dcConfigs = await prisma.dcConfig.count();
    if (dcConfigs >= 2) {
      console.log(`   ✅ ${dcConfigs} DC configurations`);
    } else {
      console.log(`   ⚠️  WARNING: Only ${dcConfigs} DC config found`);
    }

    const dcCapitalTiers = await prisma.dcCapitalTier.count();
    if (dcCapitalTiers >= 4) {
      console.log(`   ✅ ${dcCapitalTiers} DC capital tiers`);
    } else {
      console.log(`   ⚠️  WARNING: Only ${dcCapitalTiers} DC capital tiers found`);
    }

    const bgCapitalLimits = await prisma.bgCapitalLimit.count();
    if (bgCapitalLimits >= 5) {
      console.log(`   ✅ ${bgCapitalLimits} BG capital limits`);
    } else {
      console.log(`   ⚠️  WARNING: Only ${bgCapitalLimits} BG capital limits found`);
    }

    const usageTypes = await prisma.usage.count();
    if (usageTypes >= 2) {
      console.log(`   ✅ ${usageTypes} usage types`);
    } else {
      console.log(`   ❌ FAIL: Only ${usageTypes} usage type found (expected 2+)`);
      allChecksPassed = false;
      issues.push(`Only ${usageTypes} usage type configured`);
    }

    const usageFeeConfigs = await prisma.usageFeeConfig.count();
    if (usageFeeConfigs >= 2) {
      console.log(`   ✅ ${usageFeeConfigs} usage fee configs`);
    } else {
      console.log(`   ⚠️  WARNING: Only ${usageFeeConfigs} usage fee configs found`);
    }

    const formulaEligibility = await prisma.formulaEligibilityAgeRule.count();
    if (formulaEligibility >= 4) {
      console.log(`   ✅ ${formulaEligibility} formula eligibility rules`);
    } else {
      console.log(`   ⚠️  WARNING: Only ${formulaEligibility} formula eligibility rules found`);
    }

    const guaranteeBundlings = await prisma.guaranteeBundling.count();
    if (guaranteeBundlings >= 8) {
      console.log(`   ✅ ${guaranteeBundlings} guarantee bundlings`);
    } else {
      console.log(`   ⚠️  WARNING: Only ${guaranteeBundlings} guarantee bundlings found`);
    }

    const guaranteeAvailabilities = await prisma.guaranteeAvailability.count();
    if (guaranteeAvailabilities >= 10) {
      console.log(`   ✅ ${guaranteeAvailabilities} guarantee availabilities`);
    } else {
      console.log(`   ⚠️  WARNING: Only ${guaranteeAvailabilities} guarantee availabilities found`);
    }

    // ========================================
    // CHECK 4: Database integrity
    // ========================================
    console.log('\n🔍 CHECK 4: Database integrity checks...\n');

    // Check for orphaned records
    const orphanedDriverProfiles = await prisma.driverProfile.count({
      where: {
        user: {
          role: Role.CLIENT_ADHERENT
        }
      }
    });

    if (orphanedDriverProfiles === 0) {
      console.log('   ✅ No orphaned driver profiles');
    } else {
      console.log(`   ❌ FAIL: ${orphanedDriverProfiles} orphaned driver profiles found`);
      allChecksPassed = false;
      issues.push(`${orphanedDriverProfiles} orphaned driver profiles`);
    }

    const orphanedVehicles = await prisma.vehicle.count();
    if (orphanedVehicles === 0) {
      console.log('   ✅ No orphaned vehicles');
    } else {
      console.log(`   ⚠️  WARNING: ${orphanedVehicles} vehicles still exist (should be 0)`);
    }

    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(60));
    
    if (allChecksPassed && issues.length === 0) {
      console.log('🎉 ALL CHECKS PASSED - PRODUCTION READY!');
      console.log('='.repeat(60));
      console.log('\n✅ Database is clean and ready for production deployment');
      console.log('✅ All configurations are intact');
      console.log('✅ Admin accounts are available');
      console.log('✅ No test data remains');
      console.log('\n🚀 You can now deploy to production!\n');
    } else if (!allChecksPassed) {
      console.log('❌ CRITICAL ISSUES FOUND - NOT PRODUCTION READY!');
      console.log('='.repeat(60));
      console.log('\n🚨 Critical issues that must be fixed:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('\n⚠️  DO NOT DEPLOY until these issues are resolved!\n');
    } else {
      console.log('⚠️  WARNINGS FOUND - REVIEW BEFORE DEPLOYMENT');
      console.log('='.repeat(60));
      console.log('\n⚠️  Issues to review:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('\n💡 These are warnings, not critical errors.');
      console.log('   Review them and decide if deployment should proceed.\n');
    }

    console.log('='.repeat(60) + '\n');

    return allChecksPassed;

  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
if (require.main === module) {
  verifyProductionReadiness()
    .then((passed) => {
      if (passed) {
        console.log('✅ Verification completed - Production ready!');
        process.exit(0);
      } else {
        console.log('❌ Verification failed - Fix issues before deployment');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Verification script failed:', error);
      process.exit(1);
    });
}
