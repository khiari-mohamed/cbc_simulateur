const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNotifications() {
  try {
    console.log('=== Checking Notifications ===\n');
    
    // Get all notifications
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { email: true, firstName: true, lastName: true } } }
    });
    
    console.log(`Total notifications found: ${notifications.length}\n`);
    
    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.subject}`);
      console.log(`   User: ${notif.user.firstName} ${notif.user.lastName} (${notif.user.email})`);
      console.log(`   Type: ${notif.type}`);
      console.log(`   Status: ${notif.status}`);
      console.log(`   Content: ${notif.content}`);
      console.log(`   Created: ${notif.createdAt}`);
      console.log('');
    });
    
    // Get client users
    console.log('\n=== Client Users ===\n');
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT_ADHERENT' },
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    
    clients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.firstName} ${client.lastName} (${client.email})`);
      console.log(`   ID: ${client.id}`);
    });
    
    // Get recent quotes
    console.log('\n=== Recent Quotes ===\n');
    const quotes = await prisma.quote.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { 
        id: true, 
        quoteNumber: true, 
        status: true, 
        userId: true,
        validatedAt: true,
        modificationNote: true
      }
    });
    
    quotes.forEach((quote, index) => {
      console.log(`${index + 1}. ${quote.quoteNumber}`);
      console.log(`   Status: ${quote.status}`);
      console.log(`   User ID: ${quote.userId}`);
      console.log(`   Validated: ${quote.validatedAt || 'Not validated'}`);
      console.log(`   Note: ${quote.modificationNote || 'No note'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotifications();
