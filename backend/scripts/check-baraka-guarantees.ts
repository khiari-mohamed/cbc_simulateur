import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function checkBarakaGuarantees() {
  console.log('🔍 Checking guarantee availability for BARAKA vs LLOYD...\n');

  try {
    // Get companies
    const baraka = await prisma.company.findFirst({ where: { name: { contains: 'BARAKA' } } });
    const lloyd = await prisma.company.findFirst({ where: { name: { contains: 'LLOYD' } } });

    if (!baraka || !lloyd) {
      console.log('❌ Companies not found');
      return;
    }

    console.log(`✅ BARAKA ID: ${baraka.id}`);
    console.log(`✅ LLOYD ID: ${lloyd.id}\n`);

    // Get guarantees related to émeutes (search French and English name fields)
    const emeuteGuarantees = await prisma.guarantee.findMany({
      where: {
        OR: [
          { nameFr: { contains: 'meute', mode: 'insensitive' } },
          { nameEn: { contains: 'meute', mode: 'insensitive' } },
          { nameFr: { contains: 'incendie', mode: 'insensitive' } },
          { nameEn: { contains: 'incendie', mode: 'insensitive' } }
        ]
      }
    });

    console.log('📋 Guarantees found:');
    emeuteGuarantees.forEach(g => {
      const displayName = g.nameFr || g.nameEn || g.code;
      console.log(`   - ${displayName} (ID: ${g.id})`);
    });
    console.log('');

    // Check availability for BARAKA
    console.log('🏢 BARAKA - Standard Formula:');
    for (const guarantee of emeuteGuarantees) {
      const availability = await prisma.guaranteeAvailability.findFirst({
        where: {
          companyId: baraka.id,
          guaranteeId: guarantee.id,
          formulaType: 'STANDARD'
        }
      });

      const displayName = guarantee.nameFr || guarantee.nameEn || guarantee.code;
      if (availability) {
        if (availability.status === 'NON_ACCORDEE') {
          console.log(`   ❌ ${displayName}`);
        } else if (availability.status === 'HIDDEN') {
          console.log(`   ⚠️ ${displayName} - HIDDEN`);
        } else {
          console.log(`   ✅ ${displayName}`);
        }
      } else {
        console.log(`   ⚠️  ${displayName} - NOT CONFIGURED`);
      }
    }

    console.log('\n🏢 LLOYD - Standard Formula:');
    for (const guarantee of emeuteGuarantees) {
      const availability = await prisma.guaranteeAvailability.findFirst({
        where: {
          companyId: lloyd.id,
          guaranteeId: guarantee.id,
          formulaType: 'STANDARD'
        }
      });

      const displayName = guarantee.nameFr || guarantee.nameEn || guarantee.code;
      if (availability) {
        if (availability.status === 'NON_ACCORDEE') {
          console.log(`   ❌ ${displayName}`);
        } else if (availability.status === 'HIDDEN') {
          console.log(`   ⚠️ ${displayName} - HIDDEN`);
        } else {
          console.log(`   ✅ ${displayName}`);
        }
      } else {
        console.log(`   ⚠️  ${displayName} - NOT CONFIGURED`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBarakaGuarantees();
