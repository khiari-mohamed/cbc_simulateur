import { PrismaClient, Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * 🧹 PRODUCTION CLEANUP SCRIPT
 * 
 * This script removes ONLY test data before production deployment:
 * ✅ KEEPS:
 *   - Admin accounts (ADMINISTRATEUR_ARS)
 *   - Gestionnaires (GESTIONNAIRE_VALIDATION_ARS)
 *   - All pricing rules and configurations
 *   - All guarantee configurations
 *   - All company settings
 *   - All conventions and reduction rules
 *   - All DC/BG/AC configurations
 *   - All usage types and fee configs
 * 
 * ❌ DELETES:
 *   - Client accounts (CLIENT_ADHERENT)
 *   - All simulations
 *   - All quotes
 *   - All contracts
 *   - All documents uploaded by clients
 *   - All notifications
 *   - All payments
 *   - All audit logs
 *   - All quote comparisons
 *   - Uploaded files (documents/, pdfs/)
 */

async function cleanTestData() {
  console.log('🧹 PRODUCTION CLEANUP SCRIPT\n');
  console.log('='.repeat(60));
  console.log('⚠️  WARNING: This will permanently delete test data!');
  console.log('='.repeat(60));
  console.log('\n📊 Environment:', process.env.NODE_ENV || 'unknown');
  console.log('🗄️  Database:', process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'unknown');
  console.log('');

  // Safety confirmation
  const answer1 = await askQuestion('❓ Have you created a database backup? (yes/no): ');
  if (answer1.toLowerCase() !== 'yes') {
    console.log('\n❌ Cleanup cancelled. Please backup your database first!');
    rl.close();
    process.exit(0);
  }

  const answer2 = await askQuestion('❓ Are you sure you want to delete all test data? (yes/no): ');
  if (answer2.toLowerCase() !== 'yes') {
    console.log('\n❌ Cleanup cancelled by user.');
    rl.close();
    process.exit(0);
  }

  const answer3 = await askQuestion('❓ Type "DELETE" to confirm: ');
  if (answer3 !== 'DELETE') {
    console.log('\n❌ Cleanup cancelled. Confirmation text did not match.');
    rl.close();
    process.exit(0);
  }

  rl.close();

  console.log('\n🧹 Starting cleanup...\n');

  try {
    // ========================================
    // STEP 1: Delete uploaded files
    // ========================================
    console.log('📁 Step 1: Cleaning uploaded files...');
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    // Clean documents folder
    const documentsDir = path.join(uploadsDir, 'documents');
    if (fs.existsSync(documentsDir)) {
      const files = fs.readdirSync(documentsDir);
      files.forEach(file => {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(documentsDir, file));
        }
      });
      console.log(`   ✅ Deleted ${files.length - 1} document files`);
    }

    // Clean PDFs folder
    const pdfsDir = path.join(uploadsDir, 'pdfs');
    if (fs.existsSync(pdfsDir)) {
      const files = fs.readdirSync(pdfsDir);
      files.forEach(file => {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(pdfsDir, file));
        }
      });
      console.log(`   ✅ Deleted ${files.length - 1} PDF files`);
    }

    // ========================================
    // STEP 2: Delete database records
    // ========================================
    console.log('\n🗄️  Step 2: Cleaning database records...\n');

    // Delete notifications
    const notificationsCount = await prisma.notification.deleteMany({});
    console.log(`   ✅ Deleted ${notificationsCount.count} notifications`);

    // Delete payments
    const paymentsCount = await prisma.payment.deleteMany({});
    console.log(`   ✅ Deleted ${paymentsCount.count} payments`);

    // Delete audit logs
    const auditLogsCount = await prisma.auditLog.deleteMany({});
    console.log(`   ✅ Deleted ${auditLogsCount.count} audit logs`);

    // Delete documents (DB records)
    const documentsCount = await prisma.document.deleteMany({});
    console.log(`   ✅ Deleted ${documentsCount.count} document records`);

    // Delete quote comparisons
    const comparisonsCount = await prisma.quoteComparison.deleteMany({});
    console.log(`   ✅ Deleted ${comparisonsCount.count} quote comparisons`);

    // Delete contracts (will cascade to related records)
    const contractsCount = await prisma.contract.deleteMany({});
    console.log(`   ✅ Deleted ${contractsCount.count} contracts`);

    // Delete quote items (will be deleted with quotes, but explicit for clarity)
    const quoteItemsCount = await prisma.quoteItem.deleteMany({});
    console.log(`   ✅ Deleted ${quoteItemsCount.count} quote items`);

    // Delete quotes
    const quotesCount = await prisma.quote.deleteMany({});
    console.log(`   ✅ Deleted ${quotesCount.count} quotes`);

    // Delete simulation guarantees (will be deleted with simulations, but explicit)
    const simGuaranteesCount = await prisma.simulationGuarantee.deleteMany({});
    console.log(`   ✅ Deleted ${simGuaranteesCount.count} simulation guarantees`);

    // Delete simulations
    const simulationsCount = await prisma.simulation.deleteMany({});
    console.log(`   ✅ Deleted ${simulationsCount.count} simulations`);

    // Delete vehicles (orphaned after simulations deleted)
    const vehiclesCount = await prisma.vehicle.deleteMany({});
    console.log(`   ✅ Deleted ${vehiclesCount.count} vehicles`);

    // Delete driver profiles for client users
    const clientUsers = await prisma.user.findMany({
      where: { role: Role.CLIENT_ADHERENT },
      select: { id: true }
    });
    const clientUserIds = clientUsers.map(u => u.id);
    
    const driverProfilesCount = await prisma.driverProfile.deleteMany({
      where: { userId: { in: clientUserIds } }
    });
    console.log(`   ✅ Deleted ${driverProfilesCount.count} driver profiles`);

    // Delete client users (CLIENT_ADHERENT only)
    const clientUsersCount = await prisma.user.deleteMany({
      where: { role: Role.CLIENT_ADHERENT }
    });
    console.log(`   ✅ Deleted ${clientUsersCount.count} client accounts`);

    // NOTE: We keep client organizations because conventions are linked to them
    // Conventions are admin-configured and must be preserved
    console.log(`   ⚠️  Kept client organizations (linked to conventions)`);

    // ========================================
    // STEP 3: Verify what remains
    // ========================================
    console.log('\n✅ Step 3: Verifying remaining data...\n');

    const remainingUsers = await prisma.user.count();
    const adminUsers = await prisma.user.count({ where: { role: Role.ADMINISTRATEUR_ARS } });
    const gestionnaireUsers = await prisma.user.count({ where: { role: Role.GESTIONNAIRE_VALIDATION_ARS } });
    
    console.log(`   👥 Remaining users: ${remainingUsers}`);
    console.log(`      - Admins: ${adminUsers}`);
    console.log(`      - Gestionnaires: ${gestionnaireUsers}`);

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

    const bgCapitalLimits = await prisma.bgCapitalLimit.count();
    console.log(`   🪟 BG capital limits: ${bgCapitalLimits}`);

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
    // STEP 4: Final summary
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 PRODUCTION CLEANUP COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n✅ DELETED (Test Data):');
    console.log(`   - ${clientUsersCount.count} client accounts`);
    console.log(`   - ${simulationsCount.count} simulations`);
    console.log(`   - ${quotesCount.count} quotes`);
    console.log(`   - ${contractsCount.count} contracts`);
    console.log(`   - ${documentsCount.count} documents`);
    console.log(`   - ${notificationsCount.count} notifications`);
    console.log(`   - ${paymentsCount.count} payments`);
    console.log(`   - ${auditLogsCount.count} audit logs`);
    console.log(`   - All uploaded files (documents & PDFs)`);

    console.log('\n✅ PRESERVED (Configurations):');
    console.log(`   - ${adminUsers} admin accounts`);
    console.log(`   - ${gestionnaireUsers} gestionnaire accounts`);
    console.log(`   - ${organizations} client organizations (linked to conventions)`);
    console.log(`   - ${companies} companies`);
    console.log(`   - ${guarantees} guarantees`);
    console.log(`   - ${pricingRules} pricing rules`);
    console.log(`   - ${conventions} conventions`);
    console.log(`   - ${reductionRules} reduction rules`);
    console.log(`   - ${dcConfigs} DC configurations`);
    console.log(`   - ${dcCapitalTiers} DC capital tiers`);
    console.log(`   - ${bgCapitalLimits} BG capital limits`);
    console.log(`   - ${usageTypes} usage types`);
    console.log(`   - ${usageFeeConfigs} usage fee configs`);
    console.log(`   - ${formulaEligibility} formula eligibility rules`);
    console.log(`   - ${guaranteeBundlings} guarantee bundlings`);
    console.log(`   - ${guaranteeAvailabilities} guarantee availabilities`);

    console.log('\n🚀 Database is ready for production deployment!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
if (require.main === module) {
  cleanTestData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      rl.close();
      process.exit(1);
    });
}
