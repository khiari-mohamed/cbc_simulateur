import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000';

// Test credentials
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
    bonusMalus: number;
    usageType: string; // Will be replaced with ID
    formulaType: string;
    selectedGuarantees: string[];
    selectedCapitals?: Record<string, number>;
    franchiseRate?: number;
  };
  expectedResult: 'SUCCESS' | 'ERROR';
  expectedError?: string;
}

const TEST_SCENARIOS: TestScenario[] = [
  // ✅ SCENARIO 1: Standard formula - Basic vehicle
  {
    name: 'Standard Formula - Basic Vehicle',
    description: 'New vehicle, standard formula, no optional guarantees',
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
      bonusMalus: 100,
      usageType: 'PRIVATE_BUSINESS',
      formulaType: 'STANDARD',
      selectedGuarantees: []
    },
    expectedResult: 'SUCCESS'
  },

  // ✅ SCENARIO 2: Standard formula with optional guarantees
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
      bonusMalus: 85,
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

  // ✅ SCENARIO 3: Tous Risques 0% - New vehicle
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
      bonusMalus: 100,
      usageType: 'PRIVATE_BUSINESS',
      formulaType: 'TOUS_RISQUES_0',
      selectedGuarantees: ['CATASTROPHES_NATURELLES'],
      franchiseRate: 0
    },
    expectedResult: 'SUCCESS'
  },

  // ✅ SCENARIO 4: Tous Risques 0% - With franchise
  {
    name: 'Tous Risques 0% - With Franchise 5%',
    description: 'New vehicle with TR 0%, franchise 5%',
    vehicleData: {
      brand: 'BMW',
      model: 'Serie 3',
      fiscalHorsepower: 10,
      numberOfSeats: 5,
      firstCirculationDate: '2025-06-01',
      newValue: 150000,
      marketValue: 150000
    },
    simulationData: {
      bonusMalus: 100,
      usageType: 'PRIVATE_BUSINESS',
      formulaType: 'TOUS_RISQUES_0',
      selectedGuarantees: [],
      franchiseRate: 5
    },
    expectedResult: 'SUCCESS'
  },

  // ✅ SCENARIO 5: Dommages Collision - Young vehicle
  {
    name: 'Dommages Collision - 5 Year Old Vehicle',
    description: 'DC formula with capital selection',
    vehicleData: {
      brand: 'Volkswagen',
      model: 'Golf',
      fiscalHorsepower: 7,
      numberOfSeats: 5,
      firstCirculationDate: '2021-03-15',
      newValue: 80000,
      marketValue: 60000
    },
    simulationData: {
      bonusMalus: 90,
      usageType: 'PRIVATE_BUSINESS',
      formulaType: 'DOMMAGES_COLLISIONS',
      selectedGuarantees: ['BG'],
      selectedCapitals: {
        'DOMMAGES_COLLISIONS': 30000,
        'BG': 3000,
        'PERSONNES_TRANSPORTEES': 8000
      }
    },
    expectedResult: 'SUCCESS'
  },

  // ✅ SCENARIO 6: High bonus-malus
  {
    name: 'High Bonus - 50% Reduction',
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
      bonusMalus: 50,
      usageType: 'PRIVATE_BUSINESS',
      formulaType: 'STANDARD',
      selectedGuarantees: ['BG', 'DEFENSE_RECOURS']
    },
    expectedResult: 'SUCCESS'
  },

  // ✅ SCENARIO 7: High malus
  {
    name: 'High Malus - 200%',
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
      bonusMalus: 200,
      usageType: 'PRIVATE_BUSINESS',
      formulaType: 'STANDARD',
      selectedGuarantees: []
    },
    expectedResult: 'SUCCESS'
  },

  // ✅ SCENARIO 8: Utility vehicle under 3.5T
  {
    name: 'Utility Vehicle - Under 3.5T',
    description: 'Commercial vehicle with utility usage',
    vehicleData: {
      brand: 'Renault',
      model: 'Kangoo',
      fiscalHorsepower: 6,
      numberOfSeats: 2,
      firstCirculationDate: '2023-01-01',
      newValue: 40000,
      marketValue: 38000
    },
    simulationData: {
      bonusMalus: 100,
      usageType: 'UTILITY_UNDER_3_5T',
      formulaType: 'STANDARD',
      selectedGuarantees: ['BG']
    },
    expectedResult: 'SUCCESS'
  },

  // ✅ SCENARIO 9: Low value vehicle
  {
    name: 'Low Value Vehicle - 10,000 DT',
    description: 'Old vehicle with low market value',
    vehicleData: {
      brand: 'Hyundai',
      model: 'i10',
      fiscalHorsepower: 4,
      numberOfSeats: 5,
      firstCirculationDate: '2015-01-01',
      newValue: 25000,
      marketValue: 10000
    },
    simulationData: {
      bonusMalus: 100,
      usageType: 'PRIVATE_BUSINESS',
      formulaType: 'STANDARD',
      selectedGuarantees: []
    },
    expectedResult: 'SUCCESS'
  },

  // ✅ SCENARIO 10: High value vehicle
  {
    name: 'High Value Vehicle - 300,000 DT',
    description: 'Luxury vehicle with high market value',
    vehicleData: {
      brand: 'Porsche',
      model: 'Cayenne',
      fiscalHorsepower: 15,
      numberOfSeats: 5,
      firstCirculationDate: '2024-01-01',
      newValue: 300000,
      marketValue: 300000
    },
    simulationData: {
      bonusMalus: 100,
      usageType: 'PRIVATE_BUSINESS',
      formulaType: 'STANDARD',
      selectedGuarantees: ['BG', 'INCENDIE_EMEUTES', 'DOMMAGES_EMEUTES']
    },
    expectedResult: 'SUCCESS'
  },

  // ❌ SCENARIO 11: TR 0% on old vehicle (should fail)
  {
    name: 'TR 0% on Old Vehicle - Should Fail',
    description: 'Trying TR 0% on 3 year old vehicle',
    vehicleData: {
      brand: 'Peugeot',
      model: '308',
      fiscalHorsepower: 7,
      numberOfSeats: 5,
      firstCirculationDate: '2022-01-01',
      newValue: 60000,
      marketValue: 45000
    },
    simulationData: {
      bonusMalus: 100,
      usageType: 'PRIVATE_BUSINESS',
      formulaType: 'TOUS_RISQUES_0',
      selectedGuarantees: [],
      franchiseRate: 0
    },
    expectedResult: 'ERROR',
    expectedError: 'Tous Risques 0% is only available for vehicles less than 2 years old'
  },

  // ❌ SCENARIO 12: DC on old vehicle (should fail)
  {
    name: 'DC on Old Vehicle - Should Fail',
    description: 'Trying DC on 11 year old vehicle',
    vehicleData: {
      brand: 'Renault',
      model: 'Megane',
      fiscalHorsepower: 6,
      numberOfSeats: 5,
      firstCirculationDate: '2014-01-01',
      newValue: 50000,
      marketValue: 20000
    },
    simulationData: {
      bonusMalus: 100,
      usageType: 'PRIVATE_BUSINESS',
      formulaType: 'DOMMAGES_COLLISIONS',
      selectedGuarantees: [],
      selectedCapitals: {
        'DOMMAGES_COLLISIONS': 15000
      }
    },
    expectedResult: 'ERROR',
    expectedError: 'Dommages Collision is only available for vehicles less than 10 years old'
  },

  // ✅ SCENARIO 13: All optional guarantees
  {
    name: 'Maximum Coverage - All Optional Guarantees',
    description: 'Standard formula with all possible optional guarantees',
    vehicleData: {
      brand: 'Audi',
      model: 'A4',
      fiscalHorsepower: 9,
      numberOfSeats: 5,
      firstCirculationDate: '2023-01-01',
      newValue: 100000,
      marketValue: 90000
    },
    simulationData: {
      bonusMalus: 100,
      usageType: 'PRIVATE_BUSINESS',
      formulaType: 'STANDARD',
      selectedGuarantees: [
        'BG',
        'INCENDIE_EMEUTES',
        'DOMMAGES_EMEUTES',
        'DEFENSE_RECOURS',
        'ASSURANCE_CONDUCTEUR'
      ],
      selectedCapitals: {
        'BG': 3000,
        'PERSONNES_TRANSPORTEES': 10000
      }
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

    // Login
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, TEST_USER);
      this.token = loginResponse.data.access_token;
      console.log('✅ Logged in successfully\n');
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      throw error;
    }

    // Get usage types
    const usages = await prisma.usage.findMany({ where: { isActive: true } });
    usages.forEach(usage => {
      this.usageIds[usage.code] = usage.id;
    });
    console.log('✅ Usage types loaded:', Object.keys(this.usageIds).join(', '));

    // Get companies
    this.companies = await prisma.company.findMany({ where: { isActive: true } });
    console.log('✅ Companies loaded:', this.companies.map(c => c.name).join(', '));
    console.log('\n' + '='.repeat(80) + '\n');
  }

  async runScenario(scenario: TestScenario, index: number) {
    console.log(`\n📋 TEST ${index + 1}/${TEST_SCENARIOS.length}: ${scenario.name}`);
    console.log(`   ${scenario.description}`);
    console.log(`   Expected: ${scenario.expectedResult}`);

    const result: any = {
      scenario: scenario.name,
      success: false,
      error: null,
      quotes: [],
      duration: 0
    };

    const startTime = Date.now();

    try {
      // Replace usage type code with ID
      const usageId = this.usageIds[scenario.simulationData.usageType];
      if (!usageId) {
        throw new Error(`Usage type ${scenario.simulationData.usageType} not found`);
      }

      // Create simulation
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

      // Generate quotes for all companies
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

      // Process results
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

      // Check if result matches expectation
      const hasSuccessfulQuotes = result.quotes.some((q: any) => q.success);
      const hasErrors = result.quotes.some((q: any) => !q.success);

      if (scenario.expectedResult === 'SUCCESS') {
        if (hasSuccessfulQuotes) {
          result.success = true;
          console.log(`   ✅ TEST PASSED: Quotes generated successfully`);
        } else {
          result.success = false;
          result.error = 'Expected success but all quotes failed';
          console.log(`   ❌ TEST FAILED: Expected success but all quotes failed`);
        }
      } else {
        if (hasErrors) {
          result.success = true;
          console.log(`   ✅ TEST PASSED: Expected error occurred`);
        } else {
          result.success = false;
          result.error = 'Expected error but quotes succeeded';
          console.log(`   ❌ TEST FAILED: Expected error but quotes succeeded`);
        }
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      result.error = errorMessage;

      if (scenario.expectedResult === 'ERROR') {
        result.success = true;
        console.log(`   ✅ TEST PASSED: Expected error occurred - ${errorMessage}`);
      } else {
        result.success = false;
        console.log(`   ❌ TEST FAILED: Unexpected error - ${errorMessage}`);
        // Log more details for debugging
        if (error.response?.status === 401) {
          console.log(`   🔍 Debug: Token might be expired or invalid`);
        }
      }
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

// Run tests
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
