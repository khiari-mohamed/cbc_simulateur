import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000';

// Test credentials
const CLIENT_USER = {
  email: 'client@test.com',
  password: 'client123'
};

const ADMIN_USER = {
  email: 'admin@ars.com',
  password: 'admin123'
};

class EndToEndContractTest {
  private clientToken: string = '';
  private adminToken: string = '';
  private usageId: string = '';
  private companyId: string = '';
  private guaranteeIds: { [code: string]: string } = {};

  async setup() {
    console.log('🔧 Setting up end-to-end contract test...\n');

    // Login as client
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, CLIENT_USER);
      this.clientToken = loginResponse.data.accessToken;
      console.log('✅ Client logged in successfully\n');
    } catch (error: any) {
      console.error('❌ Client login failed:', error.response?.data || error.message);
      throw error;
    }

    // Login as admin
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, ADMIN_USER);
      this.adminToken = loginResponse.data.accessToken;
      console.log('✅ Admin logged in successfully\n');
    } catch (error: any) {
      console.error('❌ Admin login failed:', error.response?.data || error.message);
      throw error;
    }

    // Get usage
    const usage = await prisma.usage.findFirst({
      where: { code: 'PRIVATE_BUSINESS', isActive: true }
    });
    if (!usage) throw new Error('Usage not found');
    this.usageId = usage.id;
    console.log(`✅ Usage loaded: ${usage.nameFr}\n`);

    // Get company
    const company = await prisma.company.findFirst({
      where: { isActive: true }
    });
    if (!company) throw new Error('Company not found');
    this.companyId = company.id;
    console.log(`✅ Company loaded: ${company.name}\n`);

    // Get guarantees
    const guarantees = await prisma.guarantee.findMany({
      where: { code: { in: ['BG'] } },
      select: { id: true, code: true }
    });
    guarantees.forEach(g => {
      this.guaranteeIds[g.code] = g.id;
    });
    console.log(`✅ Guarantees loaded\n`);
  }

  async createSimulation(fractionnement: 'ANNUEL' | 'SEMESTRIEL') {
    console.log(`📝 Creating simulation with fractionnement: ${fractionnement}...\n`);

    const payload = {
      vehicle: {
        registration: `TEST-CONTRACT-${Date.now()}`,
        fiscalHorsepower: 7,
        numberOfSeats: 5,
        firstCirculationDate: '2023-01-15',
        newValue: 50000,
        marketValue: 50000
      },
      bonusMalus: 7,
      usageId: this.usageId,
      formulaType: 'STANDARD',
      selectedGuarantees: [this.guaranteeIds['BG']],
      bgLimit: 1000,
      selectedCapitals: {
        [this.guaranteeIds['BG']]: 1000
      },
      fractionnement: fractionnement
    };

    try {
      const response = await axios.post(
        `${API_URL}/simulations`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.clientToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Simulation created: ${response.data.id}`);
      console.log(`   Fractionnement: ${response.data.fractionnement}\n`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create simulation:', error.response?.data || error.message);
      throw error;
    }
  }

  async generateQuote(simulationId: string) {
    console.log('📊 Generating quote...\n');

    try {
      const response = await axios.post(
        `${API_URL}/quotes/generate`,
        { simulationId, companyId: this.companyId },
        {
          headers: {
            Authorization: `Bearer ${this.clientToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Quote generated: ${response.data.quoteNumber}`);
      console.log(`   Total: ${response.data.totalAPayer} DT`);
      console.log(`   Fractionnement: ${response.data.fractionnement}\n`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to generate quote:', error.response?.data || error.message);
      throw error;
    }
  }



  async validateQuote(quoteId: string) {
    console.log('✅ Validating quote (as admin)...\n');

    try {
      const response = await axios.post(
        `${API_URL}/quotes/${quoteId}/validate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Quote validated: ${response.data.quoteNumber}`);
      console.log(`   Status: ${response.data.status}\n`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to validate quote:', error.response?.data || error.message);
      throw error;
    }
  }

  async createContract(quoteId: string) {
    console.log('📄 Creating contract (as admin)...\n');

    try {
      const response = await axios.post(
        `${API_URL}/contracts`,
        {
          quoteId,
          deliveryType: 'AGENCY_PICKUP'
        },
        {
          headers: {
            Authorization: `Bearer ${this.adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Contract created successfully!\n');
      console.log(`   📋 Contract Details:`);
      console.log(`   ├─ Contract Number: ${response.data.contractNumber}`);
      console.log(`   ├─ Status: ${response.data.status}`);
      console.log(`   ├─ Fractionnement: ${response.data.fractionnement}`);
      console.log(`   ├─ Company: ${response.data.quote.company.name}`);
      console.log(`   ├─ Total: ${response.data.quote.totalAPayer} DT`);
      console.log(`   └─ PDF Path: ${response.data.pdfPath}\n`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create contract:', error.response?.data || error.message);
      throw error;
    }
  }

  async run() {
    await this.setup();

    console.log('═'.repeat(80));
    console.log('🎨 END-TO-END CONTRACT PDF TEST');
    console.log('═'.repeat(80));
    console.log('\n');

    // Test with SEMESTRIEL to see fractionnement in action
    console.log('🧪 Testing with SEMESTRIEL fractionnement...\n');

    // Step 1: Create simulation
    const simulation = await this.createSimulation('SEMESTRIEL');

    // Step 2: Generate quote
    const quote = await this.generateQuote(simulation.id);

    // Step 3: Validate quote directly (bypassing document validation)
    await this.validateQuote(quote.id);

    // Step 4: Create contract
    const contract = await this.createContract(quote.id);

    console.log('═'.repeat(80));
    console.log('✅ END-TO-END TEST COMPLETED');
    console.log('═'.repeat(80));
    console.log('\n');
    console.log('📄 Contract PDF generated at:');
    console.log(`   ${contract.pdfPath}\n`);
    console.log('🎨 The new contract PDF should have:');
    console.log('   ✅ Dark navy header (#1a1a2e) with gold contract number (#e8b84b)');
    console.log('   ✅ Gold accent bar below header');
    console.log('   ✅ Horizontal meta strip showing: Fractionnement = Semestriel');
    console.log('   ✅ Two-column info cards (Assuré + Véhicule)');
    console.log('   ✅ Modern dark table for guarantees');
    console.log('   ✅ Split totals panel (terms box + dark totals card)\n');
    console.log('💡 Open the PDF to see the new design!\n');
  }
}

// Run test
const tester = new EndToEndContractTest();
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
