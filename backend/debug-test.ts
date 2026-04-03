import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000';

async function debugTest() {
  console.log('🔍 Debug Test - Checking API endpoints\n');

  try {
    // Step 1: Login
    console.log('1️⃣  Testing login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'client@test.com',
      password: 'client123'
    });
    
    console.log('   Login response:', loginResponse.data);
    
    // Check if token is in access_token or accessToken field
    const token = loginResponse.data.access_token || loginResponse.data.accessToken;
    if (!token) {
      throw new Error('No token found in login response');
    }
    
    console.log('   ✅ Login successful');
    console.log(`   Token: ${token.substring(0, 20)}...\n`);

    // Step 2: Get usage ID
    console.log('2️⃣  Getting usage ID...');
    const usage = await prisma.usage.findFirst({ where: { code: 'PRIVATE_BUSINESS' } });
    if (!usage) {
      throw new Error('Usage PRIVATE_BUSINESS not found');
    }
    console.log(`   ✅ Usage ID: ${usage.id}\n`);

    // Step 3: Create simulation
    console.log('3️⃣  Creating simulation...');
    const simulationPayload = {
      brand: 'Peugeot',
      model: '208',
      fiscalHorsepower: 5,
      numberOfSeats: 5,
      firstCirculationDate: '2024-01-01',
      newValue: 50000,
      marketValue: 50000,
      bonusMalus: 100,
      usageId: usage.id,
      formulaType: 'STANDARD',
      selectedGuarantees: [],
      selectedCapitals: {}
    };

    console.log('   Payload:', JSON.stringify(simulationPayload, null, 2));

    const simulationResponse = await axios.post(
      `${API_URL}/simulations`,
      simulationPayload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('   ✅ Simulation created');
    console.log(`   Simulation ID: ${simulationResponse.data.id}\n`);

    // Step 4: Get companies
    console.log('4️⃣  Getting companies...');
    const companies = await prisma.company.findMany({ where: { isActive: true } });
    console.log(`   ✅ Found ${companies.length} companies\n`);

    // Step 5: Generate quote for first company
    console.log('5️⃣  Generating quote...');
    const quotePayload = {
      simulationId: simulationResponse.data.id,
      companyId: companies[0].id
    };

    console.log('   Payload:', JSON.stringify(quotePayload, null, 2));

    const quoteResponse = await axios.post(
      `${API_URL}/quotes`,
      quotePayload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('   ✅ Quote generated');
    console.log(`   Company: ${quoteResponse.data.company.name}`);
    console.log(`   Total: ${quoteResponse.data.totalAPayer} DT`);
    console.log(`   Prime Nette: ${quoteResponse.data.primeNette} DT\n`);

    console.log('🎉 All tests passed! The API is working correctly.\n');

  } catch (error: any) {
    console.error('\n❌ Error occurred:');
    console.error('   Status:', error.response?.status);
    console.error('   Message:', error.message);
    
    if (error.response?.data) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.config) {
      console.error('   URL:', error.config.url);
      console.error('   Method:', error.config.method);
    }
  } finally {
    await prisma.$disconnect();
  }
}

debugTest();
