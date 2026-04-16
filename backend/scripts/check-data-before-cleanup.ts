import { PrismaClient, Role } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

/**
 * 🔍 PRE-CLEANUP VERIFICATION SCRIPT
 * 
 * Run this BEFORE clean-test-data-for-prod.ts to see what will be deleted
 */

async function checkDataBeforeCleanup() {
  console.log('🔍 Checking current database state...\n');
  console.log('='.repeat(60));
  console.log('📊 Environment:', process.env.NODE_ENV || 'unknown');
  console.log('🗄️  Database:', process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'unknown');
  console.log('='.repeat(60));

  try {
    // ========================================
    // DATA THAT WILL BE DELETED
    // ========================================
    console.log('\n❌ DATA THAT WILL BE DELETED:\n');

    const clientUsers = await prisma.user.count({ where: { role: Role.CLIENT_ADHERENT } });
    console.log(`   👤 Client accounts: ${clientUsers}`);

    const simulations = await prisma.simulation.count();
    console.log(`   🎯 Simulations: ${simulations}`);

    const quotes = await prisma.quote.count();
    console.log(`   📄 Quotes: ${quotes}`);

    const contracts = await prisma.contract.count();
    console.log(`   📋 Contracts: ${contracts}`);

    const documents = await prisma.document.count();
    console.log(`   📎 Documents: ${documents}`);

    const notifications = await prisma.notification.count();
    console.log(`   🔔 Notifications: ${notifications}`);

    const payments = await prisma.payment.count();
    console.log(`   💳 Payments: ${payments}`);

    const auditLogs = await prisma.auditLog.count();
    console.log(`   📝 Audit logs: ${auditLogs}`);

    const quoteComparisons = await prisma.quoteComparison.count();
    console.log(`   🔄 Quote comparisons: ${quoteComparisons}`);

    const vehicles = await prisma.vehicle.count();
    console.log(`   🚗 Vehicles: ${vehicles}`);

    const driverProfiles = await prisma.driverProfile.count();
    console.log(`   🪪  Driver profiles: ${driverProfiles}`);

    console.log('\n   ⚠️  NOTE: Client organizations will be KEPT (linked to conventions)');

    // ========================================
    // DATA THAT WILL BE PRESERVED
    // ========================================
    console.log('\n✅ DATA THAT WILL BE PRESERVED:\n');

    const adminUsers = await prisma.user.count({ where: { role: Role.ADMINISTRATEUR_ARS } });
    console.log(`   👑 Admin accounts: ${adminUsers}`);

    const gestionnaireUsers = await prisma.user.count({ where: { role: Role.GESTIONNAIRE_VALIDATION_ARS } });
    console.log(`   👔 Gestionnaire accounts: ${gestionnaireUsers}`);

    const companies = await prisma.company.count();
    console.log(`   🏢 Companies: ${companies}`);

    const guarantees = await prisma.guarantee.count();
    console.log(`   🛡️  Guarantees: ${guarantees}`);

    const pricingRules = await prisma.pricingRule.count();
    console.log(`   💰 Pricing rules: ${pricingRules}`);

    const conventions = await prisma.convention.count();
    console.log(`   📋 Conventions: ${conventions}`);

    const reductionRules = await prisma.conventionReductionRule.count();
    console.log(`   🎯 Reduction rules: ${reductionRules}`);

    const dcConfigs = await prisma.dcConfig.count();
    console.log(`   🚗 DC configs: ${dcConfigs}`);

    const dcCapitalTiers = await prisma.dcCapitalTier.count();
    console.log(`   📊 DC capital tiers: ${dcCapitalTiers}`);

    const dcProgressiveTiers = await prisma.dcProgressiveTier.count();
    console.log(`   📈 DC progressive tiers: ${dcProgressiveTiers}`);

    const dcMatrixVvRanges = await prisma.dcMatrixVvRange.count();
    console.log(`   📉 DC matrix VV ranges: ${dcMatrixVvRanges}`);

    const dcMatrixCapitals = await prisma.dcMatrixCapital.count();
    console.log(`   💵 DC matrix capitals: ${dcMatrixCapitals}`);

    const dcMatrixPrices = await prisma.dcMatrixPrice.count();
    console.log(`   💲 DC matrix prices: ${dcMatrixPrices}`);

    const bgCapitalLimits = await prisma.bgCapitalLimit.count();
    console.log(`   🪟 BG capital limits: ${bgCapitalLimits}`);

    const franchiseValues = await prisma.franchiseValue.count();
    console.log(`   🔢 Franchise values: ${franchiseValues}`);

    const usageTypes = await prisma.usage.count();
    console.log(`   🚙 Usage types: ${usageTypes}`);

    const usageFeeConfigs = await prisma.usageFeeConfig.count();
    console.log(`   💵 Usage fee configs: ${usageFeeConfigs}`);

    const formulaEligibility = await prisma.formulaEligibilityAgeRule.count();
    console.log(`   📅 Formula eligibility rules: ${formulaEligibility}`);

    const guaranteeBundlings = await prisma.guaranteeBundling.count();
    console.log(`   🔗 Guarantee bundlings: ${guaranteeBundlings}`);

    const guaranteeAvailabilities = await prisma.guaranteeAvailability.count();
    console.log(`   ✓  Guarantee availabilities: ${guaranteeAvailabilities}`);

    const organizations = await prisma.clientOrganization.count();
    console.log(`   🏢 Client organizations: ${organizations}`);

    // ========================================
    // DETAILED USER BREAKDOWN
    // ========================================
    console.log('\n👥 DETAILED USER BREAKDOWN:\n');

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
      orderBy: { role: 'asc' }
    });

    const adminList = allUsers.filter(u => u.role === Role.ADMINISTRATEUR_ARS);
    const gestionnaireList = allUsers.filter(u => u.role === Role.GESTIONNAIRE_VALIDATION_ARS);
    const clientList = allUsers.filter(u => u.role === Role.CLIENT_ADHERENT);

    console.log('   🔴 ADMINS (WILL BE KEPT):');
    adminList.forEach(u => {
      console.log(`      - ${u.email} (${u.firstName} ${u.lastName}) ${u.isActive ? '✅' : '❌'}`);
    });

    console.log('\n   🟡 GESTIONNAIRES (WILL BE KEPT):');
    gestionnaireList.forEach(u => {
      console.log(`      - ${u.email} (${u.firstName} ${u.lastName}) ${u.isActive ? '✅' : '❌'}`);
    });

    console.log('\n   🟢 CLIENTS (WILL BE DELETED):');
    if (clientList.length === 0) {
      console.log('      - None found');
    } else {
      clientList.forEach(u => {
        console.log(`      - ${u.email} (${u.firstName} ${u.lastName}) ${u.isActive ? '✅' : '❌'}`);
      });
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));

    const totalToDelete = clientUsers + simulations + quotes + contracts + documents + 
                         notifications + payments + auditLogs + quoteComparisons + 
                         vehicles + driverProfiles;

    const totalToKeep = adminUsers + gestionnaireUsers + companies + guarantees + 
                       pricingRules + conventions + reductionRules + dcConfigs + 
                       dcCapitalTiers + bgCapitalLimits + usageTypes + usageFeeConfigs + 
                       formulaEligibility + guaranteeBundlings + guaranteeAvailabilities + 
                       organizations;

    console.log(`\n   ❌ Total records to DELETE: ${totalToDelete}`);
    console.log(`   ✅ Total records to PRESERVE: ${totalToKeep}`);

    if (clientUsers === 0 && simulations === 0 && quotes === 0) {
      console.log('\n   ⚠️  WARNING: No test data found! Database might already be clean.');
    }

    if (adminUsers === 0) {
      console.log('\n   🚨 CRITICAL: No admin accounts found! DO NOT RUN CLEANUP!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Verification complete!');
    console.log('='.repeat(60) + '\n');

    if (adminUsers > 0 && (clientUsers > 0 || simulations > 0 || quotes > 0)) {
      console.log('💡 Next step: Run clean-test-data-for-prod.ts to clean the database\n');
    } else if (adminUsers === 0) {
      console.log('🚨 DO NOT PROCEED: Create admin accounts first!\n');
    } else {
      console.log('✅ Database appears clean already. No cleanup needed.\n');
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
if (require.main === module) {
  checkDataBeforeCleanup()
    .then(() => {
      console.log('✅ Verification script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verification script failed:', error);
      process.exit(1);
    });
}
