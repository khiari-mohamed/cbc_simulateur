import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000';

// Test credentials - use admin/gestionnaire account
const TEST_USER = {
  email: 'admin@ars.com', // Change this to your admin email
  password: 'admin123'     // Change this to your admin password
};

class ContractGenerationTester {
  private token: string = '';

  async setup() {
    console.log('🔧 Setting up contract generation test...\n');

    // Login
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, TEST_USER);
      this.token = loginResponse.data.accessToken;
      console.log('✅ Logged in successfully');
      console.log(`   Token: ${this.token.substring(0, 20)}...\n`);
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      console.error('\n💡 Make sure:');
      console.error('   1. Backend is running on http://localhost:5000');
      console.error('   2. Admin user exists (admin@ars.com)');
      console.error('   3. Password is correct\n');
      throw error;
    }
  }

  async findValidatedQuotes() {
    console.log('🔍 Looking for validated quotes...\n');

    try {
      // Get all quotes
      const response = await axios.get(`${API_URL}/quotes`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      const quotes = response.data;
      
      // Filter for VALIDATED quotes without contracts
      const validatedQuotes = quotes.filter((q: any) => 
        q.status === 'VALIDATED' && !q.contract
      );

      if (validatedQuotes.length === 0) {
        console.log('⚠️  No validated quotes found without contracts.');
        console.log('   You need to:');
        console.log('   1. Create a simulation');
        console.log('   2. Generate quotes');
        console.log('   3. Submit the quote');
        console.log('   4. Validate the quote (as admin)');
        console.log('   5. Then run this script again\n');
        return [];
      }

      console.log(`✅ Found ${validatedQuotes.length} validated quote(s) ready for contract:\n`);
      
      validatedQuotes.forEach((q: any, index: number) => {
        console.log(`   ${index + 1}. Quote ${q.quoteNumber}`);
        console.log(`      Company: ${q.company.name}`);
        console.log(`      Total: ${q.totalAPayer} DT`);
        console.log(`      Fractionnement: ${q.fractionnement || 'ANNUEL'}`);
        console.log(`      Status: ${q.status}\n`);
      });

      return validatedQuotes;
    } catch (error: any) {
      console.error('❌ Failed to fetch quotes:', error.response?.data || error.message);
      throw error;
    }
  }

  async createContract(quoteId: string, quoteNumber: string) {
    console.log(`📄 Creating contract from quote ${quoteNumber}...\n`);

    try {
      const response = await axios.post(
        `${API_URL}/contracts`,
        {
          quoteId,
          deliveryType: 'AGENCY_PICKUP', // or 'HOME_DELIVERY'
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const contract = response.data;
      
      console.log('✅ Contract created successfully!\n');
      console.log(`   📋 Contract Details:`);
      console.log(`   ├─ Contract Number: ${contract.contractNumber}`);
      console.log(`   ├─ Status: ${contract.status}`);
      console.log(`   ├─ Start Date: ${new Date(contract.startDate).toLocaleDateString('fr-FR')}`);
      console.log(`   ├─ End Date: ${new Date(contract.endDate).toLocaleDateString('fr-FR')}`);
      console.log(`   ├─ Fractionnement: ${contract.fractionnement || 'ANNUEL'}`);
      console.log(`   ├─ Company: ${contract.quote.company.name}`);
      console.log(`   ├─ Total: ${contract.quote.totalAPayer} DT`);
      console.log(`   └─ PDF Path: ${contract.pdfPath}\n`);

      return contract;
    } catch (error: any) {
      console.error('❌ Failed to create contract:', error.response?.data || error.message);
      throw error;
    }
  }

  async run() {
    await this.setup();

    console.log('═'.repeat(80));
    console.log('🎨 CONTRACT PDF DESIGN TEST');
    console.log('═'.repeat(80));
    console.log('\n');

    // Find validated quotes
    const validatedQuotes = await this.findValidatedQuotes();

    if (validatedQuotes.length === 0) {
      console.log('❌ No quotes available to transform into contracts.');
      console.log('\n💡 TIP: Run the complete test instead:');
      console.log('   npx ts-node test-contract-pdf-design.ts');
      console.log('\n   That script will:');
      console.log('   1. Create a simulation');
      console.log('   2. Generate quotes');
      console.log('   3. Validate the quote');
      console.log('   4. Transform to contract');
      console.log('   5. Generate PDF with your new design!\n');
      return;
    }

    // Transform ALL validated quotes
    console.log(`📝 Transforming ${validatedQuotes.length} validated quote(s) into contracts...\n`);
    
    const contracts = [];
    for (const quote of validatedQuotes) {
      try {
        const contract = await this.createContract(quote.id, quote.quoteNumber);
        contracts.push(contract);
      } catch (error: any) {
        console.error(`❌ Failed to create contract for ${quote.quoteNumber}:`, error.message);
      }
    }

    console.log('═'.repeat(80));
    console.log(`✅ CONTRACT GENERATION TEST COMPLETED - ${contracts.length} contract(s) created`);
    console.log('═'.repeat(80));
    console.log('\n');
    
    if (contracts.length > 0) {
      console.log('📄 Generated PDFs:');
      contracts.forEach((contract, index) => {
        console.log(`   ${index + 1}. ${contract.contractNumber}`);
        console.log(`      Path: ${contract.pdfPath}`);
        console.log(`      Company: ${contract.quote.company.name}`);
        console.log(`      Fractionnement: ${contract.fractionnement}\n`);
      });
      
      console.log('🎨 The new contract PDFs should have:');
      console.log('   ✅ Your custom color scheme');
      console.log('   ✅ Horizontal meta strip with fractionnement');
      console.log('   ✅ Two-column info cards with vehicle data');
      console.log('   ✅ Modern guarantees table');
      console.log('   ✅ Split totals panel\n');
    }
  }
}

// Run test
const tester = new ContractGenerationTester();
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
