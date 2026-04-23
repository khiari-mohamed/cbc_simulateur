const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database contents...\n');

  try {
    // Check usage types
    console.log('📋 Usage Types:');
    const usages = await prisma.usage.findMany({
      where: { isActive: true },
      select: { id: true, code: true, nameFr: true },
    });
    if (usages.length === 0) {
      console.log('  ❌ No usage types found!');
    } else {
      usages.forEach(u => console.log(`  ✅ ${u.code} - ${u.nameFr}`));
    }

    // Check companies
    console.log('\n🏢 Companies:');
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
    });
    if (companies.length === 0) {
      console.log('  ❌ No companies found!');
    } else {
      companies.forEach(c => console.log(`  ✅ ${c.code} - ${c.name}`));
    }

    // Check guarantees
    console.log('\n🛡️ Guarantees:');
    const guarantees = await prisma.guarantee.findMany({
      where: { isActive: true },
      select: { id: true, code: true, nameFr: true, systemRole: true },
      take: 10,
    });
    if (guarantees.length === 0) {
      console.log('  ❌ No guarantees found!');
    } else {
      guarantees.forEach(g => console.log(`  ✅ ${g.code} - ${g.nameFr} (${g.systemRole || 'N/A'})`));
      if (guarantees.length === 10) {
        const total = await prisma.guarantee.count({ where: { isActive: true } });
        console.log(`  ... and ${total - 10} more`);
      }
    }

    // Check users
    console.log('\n👥 Users:');
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true },
      take: 5,
    });
    if (users.length === 0) {
      console.log('  ❌ No users found!');
    } else {
      users.forEach(u => console.log(`  ✅ ${u.email} (${u.role})`));
    }

    // Check existing quotes
    console.log('\n📄 Existing Quotes:');
    const quotes = await prisma.quote.findMany({
      select: { id: true, quoteNumber: true, status: true, totalAPayer: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    if (quotes.length === 0) {
      console.log('  ❌ No quotes found!');
    } else {
      quotes.forEach(q => console.log(`  ✅ ${q.quoteNumber} - ${q.status} - ${q.totalAPayer} DT`));
    }

    console.log('\n' + '='.repeat(60));
    console.log('Database check complete!');
    console.log('='.repeat(60));

    return {
      usages,
      companies,
      guarantees,
      users,
      quotes,
    };
  } catch (error) {
    console.error('\n❌ Error checking database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
