import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRcValues() {
  console.log('🔍 CHECKING RC VALUES IN DATABASE vs EXCEL\n');
  
  // Expected values from Excel (in DT)
  const expectedValues: Record<string, Record<string, number>> = {
    '01': { '3-4': 77000, '5-6': 98000, '7-10': 119000, '11-14': 154000, '>=15': 184800 },
    '02': { '3-4': 88000, '5-6': 112000, '7-10': 136000, '11-14': 176000, '>=15': 211200 },
    '03': { '3-4': 99000, '5-6': 126000, '7-10': 153000, '11-14': 198000, '>=15': 237600 },
    '04': { '3-4': 110000, '5-6': 140000, '7-10': 170000, '11-14': 220000, '>=15': 264000 },
    '05': { '3-4': 132000, '5-6': 168000, '7-10': 204000, '11-14': 264000, '>=15': 316800 },
    '06': { '3-4': 154000, '5-6': 196000, '7-10': 238000, '11-14': 308000, '>=15': 369600 },
    '07': { '3-4': 176000, '5-6': 224000, '7-10': 272000, '11-14': 352000, '>=15': 422400 },
    '08': { '3-4': 220000, '5-6': 280000, '7-10': 340000, '11-14': 440000, '>=15': 528000 }
  };

  try {
    // Get RC guarantee
    const rcGuarantee = await prisma.guarantee.findUnique({
      where: { code: 'RC' }
    });

    if (!rcGuarantee) {
      console.log('❌ RC guarantee not found in database');
      return;
    }

    // Get all RC pricing rules
    const rcRules = await prisma.pricingRule.findMany({
      where: {
        guaranteeId: rcGuarantee.id,
        isActive: true
      },
      orderBy: [
        { bonusMalusClass: 'asc' },
        { minPower: 'asc' }
      ]
    });

    console.log(`Found ${rcRules.length} RC rules in database\n`);

    // Check each rule
    let allCorrect = true;
    
    for (const rule of rcRules) {
      const classe = rule.bonusMalusClass?.toString().padStart(2, '0');
      let cvRange = '';
      
      // Determine CV range
      if (rule.minPower === 3 && rule.maxPower === 4) cvRange = '3-4';
      else if (rule.minPower === 5 && rule.maxPower === 6) cvRange = '5-6';
      else if (rule.minPower === 7 && rule.maxPower === 10) cvRange = '7-10';
      else if (rule.minPower === 11 && rule.maxPower === 14) cvRange = '11-14';
      else if (rule.minPower === 15 && rule.maxPower === null) cvRange = '>=15';
      
      if (classe && cvRange && expectedValues[classe] && expectedValues[classe][cvRange]) {
        const dbValue = parseFloat(rule.fixedPremium?.toString() || '0');
        const expectedValue = expectedValues[classe]![cvRange]!;
        const isCorrect = dbValue === expectedValue;
        
        console.log(`Classe ${classe}, CV ${cvRange}:`);
        console.log(`  Database: ${dbValue.toLocaleString('fr-FR')} DT`);
        console.log(`  Expected: ${expectedValue.toLocaleString('fr-FR')} DT`);
        console.log(`  Status: ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
        
        if (!isCorrect) {
          const ratio = dbValue / expectedValue;
          console.log(`  Ratio: ${ratio} (DB/Expected)`);
          allCorrect = false;
        }
        console.log('');
      }
    }

    console.log('='.repeat(50));
    if (allCorrect) {
      console.log('✅ ALL RC VALUES ARE CORRECT');
    } else {
      console.log('❌ SOME RC VALUES ARE INCORRECT');
      console.log('💡 Possible issues:');
      console.log('   - Values stored as thousands (77 instead of 77000)');
      console.log('   - UI display issue (missing thousand separators)');
      console.log('   - Data migration needed');
    }

  } catch (error) {
    console.error('Error checking RC values:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRcValues();