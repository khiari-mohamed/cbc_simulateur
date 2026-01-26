import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function fixAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.update({
    where: { email: 'admin@ars.com' },
    data: { password: hashedPassword },
  });

  console.log('✅ Admin password fixed: admin@ars.com / admin123');
  await prisma.$disconnect();
}

fixAdmin();
