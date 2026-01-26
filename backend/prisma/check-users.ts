import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('🔍 Checking users...\n');

  const users = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      password: true,
      isActive: true,
    },
  });

  for (const user of users) {
    console.log(`📧 ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    
    // Test password
    const testPassword = user.email.includes('admin') ? 'admin123' : 
                        user.email.includes('manager') ? 'manager123' : 'client123';
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log(`   Password "${testPassword}": ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log('');
  }

  await prisma.$disconnect();
}

checkUsers();
