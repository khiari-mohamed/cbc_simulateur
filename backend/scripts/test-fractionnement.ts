import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000';

// Test credentials
const TEST_USER = {
  email: 'client@test.com',
  password: 'client123'
};

// Client's exact scenario from meeting
const CLIENT_SCENARIO = {
  vehicle: {
    registration: 'TEST-Fdhdhdhdhddh',
    fiscalHorsepower: 7,
    numberOfSeats: 4,
    firstCirculationDate: '2023-01-15',
    newValue: 50000,
    marketValue: 50000
  },
  simulation: {
    bonusMalus: 7, // Changed from 100 to 7 (Classe 7)
    usageType: 'PRIVATE_BUSINESS', // "privé et affaire"
    formulaType: 'STANDARD',
    selectedGuaranteesCodes: ['BG'], // Bris de Glaces - will be converted to UUIDs
    selectedCapitals: {
      'BG': 1000
    }
  }
};

class FractionnementTester {
  private token: string = '';
  private usageId: string = '';
  private companyIds: string[] = [];
  private guaranteeIds: { [code: string]: string } = {};

  async setup() {
    console.log('🔧 Setting up fractionnement test...\n');

    // Login
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, TEST_USER);
      this.token = loginResponse.data.accessToken; // Changed from access_token to accessToken
      console.log('✅ Logged in successfully');
      console.log(`   Token: ${this.token.substring(0, 20)}...\n`);
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      console.error('\n💡 Make sure:');
      console.error('   1. Backend is running on http://localhost:5000');
      console.error('   2. User client@test.com exists and is active');
      console.error('   3. Password is "client123"\n');
      throw error;
    }

    // Get usage ID for "PRIVATE_BUSINESS"
    const usage = await prisma.usage.findFirst({
      where: { code: 'PRIVATE_BUSINESS', isActive: true }
    });
    if (!usage) {
      throw new Error('Usage PRIVATE_BUSINESS not found');
    }
    this.usageId = usage.id;
    console.log(`✅ Usage loaded: ${usage.nameFr} (${usage.code})\n`);

    // Get active companies
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    this.companyIds = companies.map(c => c.id);
    console.log(`✅ Companies loaded: ${companies.map(c => c.name).join(', ')}\n`);

    // Get guarantee IDs
    const guarantees = await prisma.guarantee.findMany({
      where: { code: { in: ['BG'] } },
      select: { id: true, code: true, nameFr: true }
    });
    guarantees.forEach(g => {
      this.guaranteeIds[g.code] = g.id;
    });
    console.log(`✅ Guarantees loaded: ${guarantees.map(g => `${g.nameFr} (${g.code})`).join(', ')}\n`);
    
    console.log('='.repeat(80) + '\n');
  }

  async testFractionnement(fractionnement: 'ANNUEL' | 'SEMESTRIEL') {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 TESTING: ${fractionnement}`);
    console.log('='.repeat(80));
    console.log('\n📋 Scenario Details:');
    console.log(`   • Puissance fiscale: ${CLIENT_SCENARIO.vehicle.fiscalHorsepower} CV`);
    console.log(`   • Nombre de places: ${CLIENT_SCENARIO.vehicle.numberOfSeats}`);
    console.log(`   • Valeur vénale: ${CLIENT_SCENARIO.vehicle.marketValue} DT`);
    console.log(`   • Usage: Privé et Affaire`);
    console.log(`   • Formule: Standard`);
    console.log(`   • Garanties optionnelles: Bris de Glaces (1000 DT)`);
    console.log(`   • Fractionnement: ${fractionnement}\n`);

    try {
      // Create simulation with fractionnement
      const simulationPayload = {
        vehicle: CLIENT_SCENARIO.vehicle,
        bonusMalus: CLIENT_SCENARIO.simulation.bonusMalus,
        usageId: this.usageId,
        formulaType: CLIENT_SCENARIO.simulation.formulaType,
        selectedGuarantees: CLIENT_SCENARIO.simulation.selectedGuaranteesCodes.map(code => this.guaranteeIds[code]),
        bgLimit: 1000, // BG capital limit
        selectedCapitals: {
          [this.guaranteeIds['BG']]: 1000 // Also pass in selectedCapitals for pricing engine
        },
        fractionnement: fractionnement
      };

      console.log('📤 Creating simulation...');
      const simulationResponse = await axios.post(
        `${API_URL}/simulations`,
        simulationPayload,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const simulation = simulationResponse.data;
      console.log(`✅ Simulation created: ${simulation.id}`);
      console.log(`   Fractionnement stored: ${simulation.fractionnement || 'NOT STORED ❌'}\n`);

      // Generate quotes for all companies
      console.log('📤 Generating quotes for all companies...\n');
      const results: any[] = [];

      for (const companyId of this.companyIds) {
        try {
          const quoteResponse = await axios.post(
            `${API_URL}/quotes/generate`, // Changed from /quotes to /quotes/generate
            { simulationId: simulation.id, companyId },
            {
              headers: {
                Authorization: `Bearer ${this.token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          const quote = quoteResponse.data;
          results.push({
            company: quote.company.name,
            quoteNumber: quote.quoteNumber,
            primeNette: parseFloat(quote.primeNette),
            frais: parseFloat(quote.frais),
            taxes: parseFloat(quote.taxes),
            fpac: parseFloat(quote.fpac),
            fssr: parseFloat(quote.fssr),
            fg: parseFloat(quote.fg),
            totalAPayer: parseFloat(quote.totalAPayer),
            fractionnement: quote.fractionnement || 'NOT IN QUOTE ❌',
            success: true
          });

          console.log(`✅ ${quote.company.name}:`);
          console.log(`   Quote Number: ${quote.quoteNumber}`);
          console.log(`   Prime Nette: ${quote.primeNette} DT`);
          console.log(`   Frais: ${quote.frais} DT`);
          console.log(`   Taxes: ${quote.taxes} DT`);
          console.log(`   FPAC: ${quote.fpac} DT`);
          console.log(`   FSSR: ${quote.fssr} DT`);
          console.log(`   FG: ${quote.fg} DT`);
          console.log(`   TOTAL À PAYER: ${quote.totalAPayer} DT`);
          console.log(`   Fractionnement: ${quote.fractionnement || 'NOT STORED ❌'}\n`);

        } catch (error: any) {
          const errorMsg = error.response?.data?.message || error.message;
          console.log(`❌ ${companyId}: ${errorMsg}\n`);
          results.push({
            company: companyId,
            error: errorMsg,
            success: false
          });
        }
      }

      return results;

    } catch (error: any) {
      console.error('❌ Test failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async compareResults(annuelResults: any[], semestrielResults: any[]) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPARISON: ANNUEL vs SEMESTRIEL');
    console.log('='.repeat(80) + '\n');

    for (let i = 0; i < annuelResults.length; i++) {
      const annuel = annuelResults[i];
      const semestriel = semestrielResults[i];

      if (!annuel.success || !semestriel.success) {
        console.log(`⚠️  ${annuel.company}: Skipped (one or both failed)\n`);
        continue;
      }

      console.log(`🏢 ${annuel.company}:`);
      console.log('   ┌─────────────────────────────────────────────────────────────┐');
      console.log(`   │ Component          │ ANNUEL        │ SEMESTRIEL    │ Ratio  │`);
      console.log('   ├─────────────────────────────────────────────────────────────┤');

      const components = [
        { name: 'Prime Nette', key: 'primeNette' },
        { name: 'Frais', key: 'frais' },
        { name: 'Taxes', key: 'taxes' },
        { name: 'FPAC', key: 'fpac' },
        { name: 'FSSR', key: 'fssr' },
        { name: 'FG', key: 'fg' },
        { name: 'TOTAL À PAYER', key: 'totalAPayer' }
      ];

      components.forEach(comp => {
        const annuelVal = annuel[comp.key];
        const semestrielVal = semestriel[comp.key];
        const ratio = annuelVal > 0 ? (semestrielVal / annuelVal).toFixed(4) : 'N/A';
        const ratioStr = ratio === '0.5000' ? '✅ 0.5000' : 
                        ratio === '1.0000' ? '✅ 1.0000' : 
                        `⚠️  ${ratio}`;

        console.log(`   │ ${comp.name.padEnd(18)} │ ${annuelVal.toFixed(2).padStart(13)} │ ${semestrielVal.toFixed(2).padStart(13)} │ ${ratioStr.padEnd(6)} │`);
      });

      console.log('   └─────────────────────────────────────────────────────────────┘\n');

      // Validation
      const primeNetteRatio = annuel.primeNette > 0 ? semestriel.primeNette / annuel.primeNette : 0;
      const fraisRatio = annuel.frais > 0 ? semestriel.frais / annuel.frais : 0;

      console.log('   📋 Validation:');
      if (Math.abs(primeNetteRatio - 0.5) < 0.001) {
        console.log('   ✅ Prime Nette is correctly divided by 2');
      } else {
        console.log(`   ❌ Prime Nette ratio is ${primeNetteRatio.toFixed(4)}, expected 0.5000`);
      }

      if (Math.abs(fraisRatio - 1.0) < 0.001) {
        console.log('   ✅ Frais remain full (not divided)');
      } else {
        console.log(`   ⚠️  Frais ratio is ${fraisRatio.toFixed(4)}, expected 1.0000`);
      }

      console.log('\n');
    }
  }

  async run() {
    await this.setup();

    console.log('\n' + '█'.repeat(80));
    console.log('█' + ' '.repeat(78) + '█');
    console.log('█  🧪 FRACTIONNEMENT TEST - CLIENT SCENARIO' + ' '.repeat(35) + '█');
    console.log('█' + ' '.repeat(78) + '█');
    console.log('█'.repeat(80) + '\n');

    // Test ANNUEL
    const annuelResults = await this.testFractionnement('ANNUEL');

    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test SEMESTRIEL
    const semestrielResults = await this.testFractionnement('SEMESTRIEL');

    // Compare results
    await this.compareResults(annuelResults, semestrielResults);

    console.log('\n' + '█'.repeat(80));
    console.log('█' + ' '.repeat(78) + '█');
    console.log('█  ✅ FRACTIONNEMENT TEST COMPLETED' + ' '.repeat(43) + '█');
    console.log('█' + ' '.repeat(78) + '█');
    console.log('█'.repeat(80) + '\n');

    // Final summary
    console.log('📝 SUMMARY:');
    console.log('   • If Prime Nette ratio = 0.5000 → ✅ Semestriel is working');
    console.log('   • If Prime Nette ratio ≠ 0.5000 → ❌ Bug detected');
    console.log('   • Frais should always have ratio = 1.0000 (not divided)\n');
  }
}

// Run test
const tester = new FractionnementTester();
tester.run()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
