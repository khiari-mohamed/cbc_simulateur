import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000';

const TEST_USER = {
  email: 'client@test.com',
  password: 'client123'
};

class TestRunner {
  private token: string = '';
  private usageIds: Record<string, string> = {};
  private guaranteeIds: Record<string, string> = {};
  private companies: any[] = [];
  private results: any[] = [];

  async setup() {
    console.log('🔧 Setting up test environment...\n');

    const loginResponse = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    this.token = loginResponse.data.accessToken;
    console.log('✅ Logged in successfully\n');

    const usages = await prisma.usage.findMany({ where: { isActive: true } });
    usages.forEach(usage => {
      this.usageIds[usage.code] = usage.id;
    });
    console.log('✅ Usage types loaded:', Object.keys(this.usageIds).join(', '));

    const guarantees = await prisma.guarantee.findMany({ where: { isActive: true } });
    guarantees.forEach(g => {
      this.guaranteeIds[g.code] = g.id;
    });
    console.log('✅ Guarantees loaded:', Object.keys(this.guaranteeIds).length);

    this.companies = await prisma.company.findMany({ where: { isActive: true } });
    console.log('✅ Companies loaded:', this.companies.map(c => c.name).join(', '));
    console.log('\n' + '='.repeat(80) + '\n');
  }

  async testScenario1() {
    console.log('\n📋 TEST 1: Standard Formula - Basic Vehicle');
    
    try {
      const payload = {
        vehicle: {
          brand: 'Peugeot',
          model: '208',
          fiscalHorsepower: 5,
          numberOfSeats: 5,
          firstCirculationDate: '2024-01-01',
          newValue: 50000,
          marketValue: 50000
        },
        bonusMalus: 6,
        usageId: this.usageIds['PRIVATE_BUSINESS'],
        formulaType: 'STANDARD',
        selectedGuarantees: [],
        selectedCapitals: {},
        fractionnement: 'ANNUEL'
      };

      const simResponse = await axios.post(`${API_URL}/simulations`, payload, {
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      });

      console.log(`   ✅ Simulation created: ${simResponse.data.id}`);

      const quoteResponse = await axios.post(`${API_URL}/quotes`, {
        simulationId: simResponse.data.id,
        companyId: this.companies[0].id
      }, {
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      });

      console.log(`   ✅ Quote generated: ${quoteResponse.data.totalAPayer} DT`);
      return true;
    } catch (error: any) {
      console.log(`   ❌ FAILED: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  async testScenario2() {
    console.log('\n📋 TEST 2: With Optional Guarantees (BG + INCENDIE_EMEUTES)');
    
    try {
      const payload = {
        vehicle: {
          brand: 'Renault',
          model: 'Clio',
          fiscalHorsepower: 6,
          numberOfSeats: 5,
          firstCirculationDate: '2023-06-15',
          newValue: 45000,
          marketValue: 42000
        },
        bonusMalus: 5,
        usageId: this.usageIds['PRIVATE_BUSINESS'],
        formulaType: 'STANDARD',
        selectedGuarantees: [
          this.guaranteeIds['BG'],
          this.guaranteeIds['INCENDIE_EMEUTES']
        ],
        selectedCapitals: {
          [this.guaranteeIds['BG']]: 2000,
          [this.guaranteeIds['PERSONNES_TRANSPORTEES']]: 5000
        }
      };

      const simResponse = await axios.post(`${API_URL}/simulations`, payload, {
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      });

      console.log(`   ✅ Simulation created: ${simResponse.data.id}`);

      const quoteResponse = await axios.post(`${API_URL}/quotes`, {
        simulationId: simResponse.data.id,
        companyId: this.companies[0].id
      }, {
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      });

      console.log(`   ✅ Quote generated: ${quoteResponse.data.totalAPayer} DT`);
      return true;
    } catch (error: any) {
      console.log(`   ❌ FAILED: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  async testScenario3() {
    console.log('\n📋 TEST 3: Tous Risques 0% - New Vehicle');
    
    try {
      const payload = {
        vehicle: {
          brand: 'Mercedes',
          model: 'Classe A',
          fiscalHorsepower: 8,
          numberOfSeats: 5,
          firstCirculationDate: '2025-12-01',
          newValue: 120000,
          marketValue: 120000
        },
        bonusMalus: 6,
        usageId: this.usageIds['PRIVATE_BUSINESS'],
        formulaType: 'TOUS_RISQUES_0',
        selectedGuarantees: [this.guaranteeIds['CATASTROPHES_NATURELLES']],
        selectedCapitals: {},
        franchiseRate: 0
      };

      const simResponse = await axios.post(`${API_URL}/simulations`, payload, {
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      });

      console.log(`   ✅ Simulation created: ${simResponse.data.id}`);

      const quoteResponse = await axios.post(`${API_URL}/quotes`, {
        simulationId: simResponse.data.id,
        companyId: this.companies[0].id
      }, {
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      });

      console.log(`   ✅ Quote generated: ${quoteResponse.data.totalAPayer} DT`);
      return true;
    } catch (error: any) {
      console.log(`   ❌ FAILED: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  async testScenario4() {
    console.log('\n📋 TEST 4: Semestriel Payment');
    
    try {
      const payload = {
        vehicle: {
          brand: 'Volkswagen',
          model: 'Golf',
          fiscalHorsepower: 7,
          numberOfSeats: 5,
          firstCirculationDate: '2023-01-01',
          newValue: 60000,
          marketValue: 55000
        },
        bonusMalus: 6,
        usageId: this.usageIds['PRIVATE_BUSINESS'],
        formulaType: 'STANDARD',
        selectedGuarantees: [],
        selectedCapitals: {},
        fractionnement: 'SEMESTRIEL'
      };

      const simResponse = await axios.post(`${API_URL}/simulations`, payload, {
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      });

      console.log(`   ✅ Simulation created: ${simResponse.data.id}`);

      const quoteResponse = await axios.post(`${API_URL}/quotes`, {
        simulationId: simResponse.data.id,
        companyId: this.companies[0].id
      }, {
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      });

      console.log(`   ✅ Quote generated: ${quoteResponse.data.totalAPayer} DT`);
      return true;
    } catch (error: any) {
      console.log(`   ❌ FAILED: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  async runAll() {
    await this.setup();

    const results = [
      await this.testScenario1(),
      await this.testScenario2(),
      await this.testScenario3(),
      await this.testScenario4()
    ];

    const passed = results.filter(r => r).length;
    const failed = results.filter(r => !r).length;

    console.log('\n\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80) + '\n');
    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}\n`);
    console.log('='.repeat(80));
    console.log(passed === results.length ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED');
    console.log('='.repeat(80) + '\n');
  }
}

const runner = new TestRunner();
runner.runAll()
  .then(() => {
    console.log('✅ Test suite completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
