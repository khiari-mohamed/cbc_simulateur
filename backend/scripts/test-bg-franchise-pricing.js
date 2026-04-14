/**
 * Test Script: BG Pricing with Different Franchise Rates
 * 
 * This script tests that BG (Bris de Glaces) is:
 * - FREE at 0% franchise (TR 0%)
 * - PAID at 4% franchise (TR 4%)
 * 
 * Both quotes use identical vehicle parameters.
 * 
 * Usage: node scripts/test-bg-franchise-pricing.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

// ⚠️ IMPORTANT: Update these credentials with your test user!
// The user must have role CLIENT_ADHERENT
// You can create a test user via the admin panel or registration
const TEST_USER = {
  email: 'ramiabd2023@gmail.com', // ← UPDATE THIS
  password: 'Azerty123@',    // ← UPDATE THIS
};

// Common vehicle data
const VEHICLE_DATA = {
  registrationNumber: 'TUN-2025-001',
  fiscalHorsepower: 5,
  numberOfSeats: 5,
  firstCirculationDate: '2025-02-01',
  newValue: 10000,
  marketValue: 10000,
};

const BONUS_MALUS = 5; // Classe 5

async function login() {
  try {
    console.log(`   Attempting to login to ${API_URL}/auth/login`);
    console.log(`   Email: ${TEST_USER.email}`);
    const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    return response.data.accessToken; // Note: it's accessToken, not access_token
  } catch (error) {
    console.error('❌ Login failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   No response received from server');
      console.error('   Is the backend running on', API_URL, '?');
    } else {
      console.error('   Error:', error.message);
    }
    throw error;
  }
}

async function getUsages(token) {
  try {
    const response = await axios.get(`${API_URL}/usage-types`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get usages:', error.response?.status, error.response?.data);
    throw error;
  }
}

async function getCompanies(token) {
  try {
    const response = await axios.get(`${API_URL}/companies`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.filter(c => c.isActive);
  } catch (error) {
    console.error('❌ Failed to get companies:', error.response?.status, error.response?.data);
    throw error;
  }
}

async function getGuarantees(token) {
  try {
    const response = await axios.get(`${API_URL}/guarantees`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get guarantees:', error.response?.status, error.response?.data);
    throw error;
  }
}

async function createSimulation(token, data) {
  const response = await axios.post(`${API_URL}/simulations`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

async function updateSimulation(token, simulationId, data) {
  const response = await axios.patch(`${API_URL}/simulations/${simulationId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

async function generateQuote(token, simulationId, companyId) {
  const response = await axios.post(
    `${API_URL}/quotes/generate`,
    { simulationId, companyId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

async function main() {
  console.log('🧪 ========================================');
  console.log('🧪 BG FRANCHISE PRICING TEST');
  console.log('🧪 ========================================\n');

  // Login (this will also verify backend is running)
  console.log('🔐 Logging in to', API_URL, '...');
  const token = await login();
  console.log('✅ Logged in successfully\n');

  // Get usages
  console.log('📋 Fetching usages...');
  const usages = await getUsages(token);
  const tourismeUsage = usages.find(u => u.code === 'PRIVATE_BUSINESS');
  if (!tourismeUsage) {
    console.error('❌ PRIVATE_BUSINESS usage not found');
    console.error('   Available usages:', usages.map(u => `${u.code} (${u.nameFr})`).join(', '));
    return;
  }
  console.log(`✅ Using usage: ${tourismeUsage.nameFr}\n`);

  // Get companies
  console.log('🏢 Fetching companies...');
  const companies = await getCompanies(token);
  if (companies.length < 2) {
    console.error('❌ Need at least 2 active companies');
    return;
  }
  console.log(`✅ Using companies: ${companies.map(c => c.name).join(', ')}\n`);

  // Get guarantees
  console.log('🛡️ Fetching guarantees...');
  const guarantees = await getGuarantees(token);
  const bgGuarantee = guarantees.find(g => g.code === 'BG');
  if (!bgGuarantee) {
    console.error('❌ BG guarantee not found');
    return;
  }

  console.log('📋 Vehicle Parameters:');
  console.log(`   - Registration: ${VEHICLE_DATA.registrationNumber}`);
  console.log(`   - Fiscal HP: ${VEHICLE_DATA.fiscalHorsepower} CV`);
  console.log(`   - Seats: ${VEHICLE_DATA.numberOfSeats}`);
  console.log(`   - First Circulation: ${VEHICLE_DATA.firstCirculationDate}`);
  console.log(`   - New Value: ${VEHICLE_DATA.newValue} DT`);
  console.log(`   - Market Value: ${VEHICLE_DATA.marketValue} DT`);
  console.log(`   - Bonus/Malus: Classe ${BONUS_MALUS}`);
  console.log(`   - Usage: ${tourismeUsage.nameFr}\n`);

  // ========================================
  // TEST CASE 1: TR 0% (BG should be FREE)
  // ========================================
  console.log('🔵 ========================================');
  console.log('🔵 TEST CASE 1: TR 0% (BG should be FREE)');
  console.log('🔵 ========================================\n');

  const simulation1 = await createSimulation(token, {
    vehicle: VEHICLE_DATA,
    bonusMalus: BONUS_MALUS,
    usageId: tourismeUsage.id,
    formulaType: 'TOUS_RISQUES_0',
    franchiseRate: 0, // 0% franchise
    bgLimit: 2000, // BG capital 2000 DT
    selectedGuarantees: [bgGuarantee.id],
    fractionnement: 'ANNUEL',
    companyIds: companies.slice(0, 2).map(c => c.id),
  });

  console.log(`✅ Simulation 1 created: ${simulation1.id}`);
  console.log(`   - Formula: TOUS_RISQUES_0`);
  console.log(`   - Franchise: 0%`);
  console.log(`   - BG Limit: 2000 DT\n`);

  const quotes1 = [];
  for (const company of companies.slice(0, 2)) {
    try {
      const quote = await generateQuote(token, simulation1.id, company.id);
      quotes1.push(quote);

      console.log(`✅ Quote generated for ${company.name}:`);
      console.log(`   - Quote Number: ${quote.quoteNumber}`);
      console.log(`   - Total à Payer: ${quote.totalAPayer} DT`);

      const bgItem = quote.items.find(item => item.guarantee.code === 'BG');
      if (bgItem) {
        console.log(`   - BG Prime: ${bgItem.prime} DT (Capital: ${bgItem.capital} DT)`);
        if (parseFloat(bgItem.prime) === 0) {
          console.log(`   ✅ BG is FREE as expected!\n`);
        } else {
          console.log(`   ❌ ERROR: BG should be FREE but prime is ${bgItem.prime} DT\n`);
        }
      } else {
        console.log(`   ❌ ERROR: BG not found in quote items\n`);
      }
    } catch (error) {
      console.error(`❌ Error generating quote for ${company.name}:`, error.response?.data || error.message);
    }
  }

  // ========================================
  // TEST CASE 2: TR 4% (BG should be PAID)
  // ========================================
  console.log('\n🟠 ========================================');
  console.log('🟠 TEST CASE 2: TR 4% (BG should be PAID)');
  console.log('🟠 ========================================\n');

  const simulation2 = await createSimulation(token, {
    vehicle: VEHICLE_DATA,
    bonusMalus: BONUS_MALUS,
    usageId: tourismeUsage.id,
    formulaType: 'TOUS_RISQUES_0',
    franchiseRate: 4, // 4% franchise
    bgLimit: 2000, // BG capital 2000 DT
    selectedGuarantees: [bgGuarantee.id],
    fractionnement: 'ANNUEL',
    companyIds: companies.slice(0, 2).map(c => c.id),
  });

  console.log(`✅ Simulation 2 created: ${simulation2.id}`);
  console.log(`   - Formula: TOUS_RISQUES_0`);
  console.log(`   - Franchise: 4%`);
  console.log(`   - BG Limit: 2000 DT\n`);

  const quotes2 = [];
  for (const company of companies.slice(0, 2)) {
    try {
      const quote = await generateQuote(token, simulation2.id, company.id);
      quotes2.push(quote);

      console.log(`✅ Quote generated for ${company.name}:`);
      console.log(`   - Quote Number: ${quote.quoteNumber}`);
      console.log(`   - Total à Payer: ${quote.totalAPayer} DT`);

      const bgItem = quote.items.find(item => item.guarantee.code === 'BG');
      if (bgItem) {
        console.log(`   - BG Prime: ${bgItem.prime} DT (Capital: ${bgItem.capital} DT)`);
        if (parseFloat(bgItem.prime) !== 0) {
          console.log(`   ✅ BG is PAID as expected!\n`);
        } else {
          console.log(`   ❌ ERROR: BG should be PAID but prime is 0 DT\n`);
        }
      } else {
        console.log(`   ❌ ERROR: BG not found in quote items\n`);
      }
    } catch (error) {
      console.error(`❌ Error generating quote for ${company.name}:`, error.response?.data || error.message);
    }
  }

  // ========================================
  // COMPARISON SUMMARY
  // ========================================
  console.log('\n📊 ========================================');
  console.log('📊 COMPARISON SUMMARY');
  console.log('📊 ========================================\n');

  console.log('┌─────────────────────┬──────────────┬──────────────┐');
  console.log('│ Company             │ TR 0% (FREE) │ TR 4% (PAID) │');
  console.log('├─────────────────────┼──────────────┼──────────────┤');

  for (let i = 0; i < Math.min(companies.length, 2); i++) {
    const company = companies[i];
    const quote1 = quotes1[i];
    const quote2 = quotes2[i];

    if (quote1 && quote2) {
      const bg1 = quote1.items.find(item => item.guarantee.code === 'BG');
      const bg2 = quote2.items.find(item => item.guarantee.code === 'BG');

      const bg1Prime = bg1 ? `${bg1.prime} DT` : 'N/A';
      const bg2Prime = bg2 ? `${bg2.prime} DT` : 'N/A';

      const companyName = company.name.padEnd(19);
      const col1 = bg1Prime.padEnd(12);
      const col2 = bg2Prime.padEnd(12);

      console.log(`│ ${companyName} │ ${col1} │ ${col2} │`);
    }
  }

  console.log('└─────────────────────┴──────────────┴──────────────┘\n');

  console.log('✅ Test completed!\n');
  console.log('📄 Quote Numbers:');
  quotes1.forEach((q, i) => {
    console.log(`   - TR 0% ${companies[i].name}: ${q.quoteNumber}`);
  });
  quotes2.forEach((q, i) => {
    console.log(`   - TR 4% ${companies[i].name}: ${q.quoteNumber}`);
  });

  console.log('\n💡 Check the PDFs in backend/uploads/pdfs/ for detailed quotes');
}

main()
  .then(() => {
    console.log('\n✅ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed');
    if (error.message) {
      console.error('   Error:', error.message);
    }
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure backend is running: npm run start:dev');
    console.error('   2. Update TEST_USER credentials in the script');
    console.error('   3. Verify the user has CLIENT_ADHERENT role');
    console.error('   4. Check that required data exists (companies, usages, guarantees)');
    process.exit(1);
  });
