import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updateAllPasswords() {
  const newPassword = 'Azerty123@';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log('\n📋 User List (Before Update):');
  console.log('================================');
  users.forEach((user, index) => {
    console.log(`${index + 1}. Email: ${user.email} | Role: ${user.role}`);
  });

  await prisma.user.updateMany({
    data: {
      password: hashedPassword,
    },
  });

  console.log('\n✅ All passwords updated to: Azerty123@');
  console.log(`\n📊 Total users updated: ${users.length}`);
}

updateAllPasswords()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
