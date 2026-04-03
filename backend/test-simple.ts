import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000';

const TEST_USER = {
  email: 'client@test.com',
  password: 'client123'
};

interface TestScenario {
  name: string;
  description: string;
  vehicleData: {
    brand: string;
    model: string;
    fiscalHorsepower: number;
    numberOfSeats: number;
    firstCirculationDate: string;
    newValue: number;
    marketValue: number;
  };
  simulationData: {
    bonusMalus: number; // Class 1-8 (1=50%, 2=60%, 3=70%, 4=80%, 5=90%, 6=100%, 7=125%, 8=150%)
    usageType: string;
    formulaType: string;
    selectedGuarantees: string[];
    selectedCapitals?: Record<string, number>;
    franchiseRate?: number;
    fractionnement?: 'ANNUEL' | 'SEMESTRIEL';
  };
  expectedResult: 'SUCCESS' | 'ERROR';
  expectedError?: string;
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'Standard Formula - Basic Vehicle (Class 6 = 100%)',
    description: 'New vehicle, standard formula, class 6 bonus-malus',
    vehicleData: {
      brand: 'Peugeot',
      model: '208',
      fiscalHorsepower: 5,
      numberOfSeats: 5,
      firstCirculationDate: '2024-01-01',
      newValue: 50000,
      marketValue: 50000
    },
    simulationData: {
      bonusMalus: 6, // Class 6 = 100%
      usageType: 'PRIVATE_BUSINESS',
      formulaType: 'STANDARD',
      selectedGuarantees: [],
      fractionnement: 'ANNUEL'
    },
    expectedResult: 'SUCCESS'
  },

  {
    name: 'Standard Formula - With Optional Guarantees',
    description: 'Standard formula + BG + INCENDIE_EMEUTES',
    vehicleData: {
      brand: 'Renault',
      model: 'Clio',
      fiscalHorsepower: 6,
      numberOfSeats: 5,
      firstCirculationDate: '2023-06-15',
      newValue: 45000,
      marketValue: 42000
    },
    simulationData: {
      bonusMalus: 5, // Class 5 = 90%
      usageType: 'PRIVATE_BUSINESS',
      formulaType: 'STANDARD',
      selectedGuarantees: ['BG', 'INCENDIE_EMEUTES'],
      selectedCapitals: {
        'BG': 2000,
        'PERSONNES_TRANSPORTEES': 5000
      }
    },
    expectedResult: 'SUCCESS'
  },

  {
    name: 'Tous Risques 0% - New Vehicle',
    description: 'Brand new vehicle with TR 0%, franchise 0%',
    vehicleData: {
      brand: 'Mercedes',
      model: 'Classe A',
      fiscalHorsepower: 8,
      numberOfSeats: 5,
      firstCirculationDate: '2025-12-01',
      newValue: 120000,
      marketValue: 120000
    },
    simulationData: {
      bonusMalus: 6,
      usageType: 'PRIVATE_BUSINESS',
      formulaType: 'TOUS_RISQUES_0',
      selectedGuarantees: ['CATASTROPHES_NATURELLES'],
      franchiseRate: 0
    },
    expectedResult: 'SUCCESS'
  },

  {
    name: 'High Bonus - Class 1 (50%)',
    description: 'Client with excellent driving record',
    vehicleData: {
      brand: 'Toyota',
      model: 'Corolla',
      fiscalHorsepower: 6,
      numberOfSeats: 5,
      firstCirculationDate: '2022-01-01',
      newValue: 55000,
      marketValue: 48000
    },
    simulationData: {
      bonusMalus: 1, // Class 1 = 50%
      usageType: 'PRIVATE_BUSINESS',
      formulaType: 'STANDARD',
      selectedGuarantees: ['BG']
    },
    expectedResult: 'SUCCESS'
  },

  {
    name: 'High Malus - Class 8 (150%)',
    description: 'Client with poor driving record',
    vehicleData: {
      brand: 'Fiat',
      model: 'Punto',
      fiscalHorsepower: 5,
      numberOfSeats: 5,
      firstCirculationDate: '2020-01-01',
      newValue: 35000,
      marketValue: 25000
    },
    simulationData: {
      bonusMalus: 8, // Class 8 = 150%
      usageType: 'PRIVATE_BUSINESS',
      formulaType: 'STANDARD',
      selectedGuarantees: []
    },
    expectedResult: 'SUCCESS'
  },

  {
    name: 'Semestriel Payment',
    description: 'Test semestriel fractionnement',
    vehicleData: {
      brand: 'Volkswagen',
      model: 'Golf',
      fiscalHorsepower: 7,
      numberOfSeats: 5,
      firstCirculationDate: '2023-01-01',
      newValue: 60000,
      marketValue: 55000
    },
    simulationData: {
      bonusMalus: 6,
      usageType: 'PRIVATE_BUSINESS',
      formulaType: 'STANDARD',
      selectedGuarantees: [],
      fractionnement: 'SEMESTRIEL'
    },
    expectedResult: 'SUCCESS'
  }
];

class TestRunner {
  private token: string = '';
  private usageIds: Record<string, string> = {};
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

    this.companies = await prisma.company.findMany({ where: { isActive: true } });
    console.log('✅ Companies loaded:', this.companies.map(c => c.name).join(', '));
    console.log('\n' + '='.repeat(80) + '\n');
  }

  async runScenario(scenario: TestScenario, index: number) {
    console.log(`\n📋 TEST ${index + 1}/${TEST_SCENARIOS.length}: ${scenario.name}`);
    console.log(`   ${scenario.description}`);
    console.log(`   Bonus-Malus Class: ${scenario.simulationData.bonusMalus}`);

    const result: any = {
      scenario: scenario.name,
      success: false,
      error: null,
      quotes: [],
      duration: 0
    };

    const startTime = Date.now();

    try {
      const usageId = this.usageIds[scenario.simulationData.usageType];
      if (!usageId) {
        throw new Error(`Usage type ${scenario.simulationData.usageType} not found`);
      }

      const simulationPayload = {
        ...scenario.vehicleData,
        ...scenario.simulationData,
        usageId,
        selectedGuarantees: scenario.simulationData.selectedGuarantees || [],
        selectedCapitals: scenario.simulationData.selectedCapitals || {}
      };

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

      const simulationId = simulationResponse.data.id;
      console.log(`   ✅ Simulation created: ${simulationId}`);

      const quotePromises = this.companies.map(company =>
        axios.post(
          `${API_URL}/quotes`,
          { simulationId, companyId: company.id },
          { 
            headers: { 
              Authorization: `Bearer ${this.token}`,
              'Content-Type': 'application/json'
            } 
          }
        ).catch(error => ({
          error: true,
          company: company.name,
          message: error.response?.data?.message || error.message
        }))
      );

      const quoteResponses = await Promise.all(quotePromises);

      quoteResponses.forEach((response: any) => {
        if (response.error) {
          console.log(`   ❌ ${response.company}: ${response.message}`);
          result.quotes.push({
            company: response.company,
            success: false,
            error: response.message
          });
        } else {
          const quote = response.data;
          console.log(`   ✅ ${quote.company.name}: ${quote.totalAPayer} DT`);
          result.quotes.push({
            company: quote.company.name,
            success: true,
            totalAPayer: quote.totalAPayer,
            primeNette: quote.primeNette
          });
        }
      });

      const hasSuccessfulQuotes = result.quotes.some((q: any) => q.success);

      if (scenario.expectedResult === 'SUCCESS') {
        if (hasSuccessfulQuotes) {
          result.success = true;
          console.log(`   ✅ TEST PASSED`);
        } else {
          result.success = false;
          result.error = 'Expected success but all quotes failed';
          console.log(`   ❌ TEST FAILED`);
        }
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      result.error = errorMessage;
      result.success = false;
      console.log(`   ❌ TEST FAILED: ${errorMessage}`);
    }

    result.duration = Date.now() - startTime;
    this.results.push(result);
  }

  async runAll() {
    await this.setup();

    for (let i = 0; i < TEST_SCENARIOS.length; i++) {
      await this.runScenario(TEST_SCENARIOS[i], i);
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80) + '\n');

    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total Tests: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms\n`);

    if (failed > 0) {
      console.log('❌ FAILED TESTS:\n');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   • ${r.scenario}`);
          console.log(`     Error: ${r.error || 'Unknown error'}\n`);
        });
    }

    console.log('='.repeat(80));
    console.log(passed === this.results.length ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED');
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
