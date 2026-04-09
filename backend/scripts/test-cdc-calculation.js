/**
 * CDC EXACT TEST CASE
 * 
 * Expected Results:
 * LLOYD: Prime nette: 4163, Taxes: 506.56, TOTAL: 4703.36
 * AMANA: Prime nette: 4145, Taxes: 503.00, TOTAL: 4671.80
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

// Login as client
async function login() {
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'client@test.com',
    password: 'client123',
  });
  return response.data.accessToken;
}

// Get companies
async function getCompanies(token) {
  const response = await axios.get(`${BASE_URL}/companies`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// Get guarantees
async function getGuarantees(token) {
  const response = await axios.get(`${BASE_URL}/guarantees`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// Create simulation
async function createSimulation(token, companyIds, guaranteeIds) {
  const payload = {
    vehicle: {
      registration: 'TUN-2025-CDC',
      fiscalHorsepower: 5,
      numberOfSeats: 5,
      firstCirculationDate: '2025-01-01',
      newValue: 100000,
      marketValue: 100000,
    },
    bonusMalus: 4,
    usage: 'PRIVATE_BUSINESS',
    formulaType: 'TOUS_RISQUES_0',
    franchiseRate: 0,
    bgLimit: 1000,
    dcCapital: 1000,
    selectedGuarantees: guaranteeIds,
    companyIds: companyIds,
  };

  console.log('\n📤 Creating simulation with payload:');
  console.log(JSON.stringify(payload, null, 2));

  const response = await axios.post(`${BASE_URL}/simulations`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// Generate quotes
async function generateQuotes(token, simulationId, companyIds) {
  const quotePromises = companyIds.map(companyId =>
    axios.post(
      `${BASE_URL}/quotes/generate`,
      { simulationId, companyId },
      { headers: { Authorization: `Bearer ${token}` } }
    ).then(res => res.data)
  );
  return Promise.all(quotePromises);
}

// Main test
async function runTest() {
  try {
    console.log('🧪 CDC EXACT TEST CASE');
    console.log('='.repeat(80));

    // 1. Login
    console.log('\n1️⃣ Logging in...');
    const token = await login();
    console.log('✅ Logged in');

    // 2. Get companies
    console.log('\n2️⃣ Fetching companies...');
    const companies = await getCompanies(token);
    const lloyd = companies.find(c => c.code === 'LLOYD');
    const amana = companies.find(c => c.code === 'AMANA');
    console.log(`✅ LLOYD: ${lloyd.id}`);
    console.log(`✅ AMANA: ${amana.id}`);

    // 3. Get guarantees
    console.log('\n3️⃣ Fetching guarantees...');
    const guarantees = await getGuarantees(token);
    const bg = guarantees.find(g => g.code === 'BG');
    const dommagesEmeutes = guarantees.find(g => g.code === 'DOMMAGES_EMEUTES');
    const incendieEmeutes = guarantees.find(g => g.code === 'INCENDIE_EMEUTES');
    const catnat = guarantees.find(g => g.code === 'CATASTROPHES_NATURELLES');

    console.log(`✅ BG: ${bg.id}`);
    console.log(`✅ DOMMAGES_EMEUTES: ${dommagesEmeutes.id}`);
    console.log(`✅ INCENDIE_EMEUTES: ${incendieEmeutes.id}`);
    console.log(`✅ CATASTROPHES_NATURELLES: ${catnat.id}`);

    // 4. Create simulation
    console.log('\n4️⃣ Creating simulation...');
    const simulation = await createSimulation(
      token,
      [lloyd.id, amana.id],
      [bg.id, dommagesEmeutes.id, incendieEmeutes.id, catnat.id]
    );
    console.log(`✅ Simulation created: ${simulation.id}`);

    // 5. Generate quotes
    console.log('\n5️⃣ Generating quotes...');
    const quotes = await generateQuotes(token, simulation.id, [lloyd.id, amana.id]);
    console.log(`✅ Generated ${quotes.length} quotes`);

    // 6. Display results
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULTS COMPARISON');
    console.log('='.repeat(80));

    for (const quote of quotes) {
      const company = companies.find(c => c.id === quote.companyId);
      const primeNette = parseFloat(quote.primeNette);
      const taxes = parseFloat(quote.taxes);
      const total = parseFloat(quote.totalAPayer);

      console.log(`\n${company.name.toUpperCase()}:`);
      console.log(`  Prime nette: ${primeNette.toFixed(2)} DT`);
      console.log(`  Taxes: ${taxes.toFixed(2)} DT`);
      console.log(`  TOTAL: ${total.toFixed(2)} DT`);

      // Expected values
      if (company.code === 'LLOYD') {
        console.log(`\n  Expected:`);
        console.log(`  Prime nette: 4163.00 DT`);
        console.log(`  Taxes: 506.56 DT`);
        console.log(`  TOTAL: 4703.36 DT`);
        console.log(`\n  Difference:`);
        console.log(`  Prime nette: ${(primeNette - 4163).toFixed(2)} DT ${primeNette === 4163 ? '✅' : '❌'}`);
        console.log(`  Taxes: ${(taxes - 506.56).toFixed(2)} DT ${Math.abs(taxes - 506.56) < 0.01 ? '✅' : '❌'}`);
        console.log(`  TOTAL: ${(total - 4703.36).toFixed(2)} DT ${Math.abs(total - 4703.36) < 0.01 ? '✅' : '❌'}`);
      } else if (company.code === 'AMANA') {
        console.log(`\n  Expected:`);
        console.log(`  Prime nette: 4145.00 DT`);
        console.log(`  Taxes: 503.00 DT`);
        console.log(`  TOTAL: 4671.80 DT`);
        console.log(`\n  Difference:`);
        console.log(`  Prime nette: ${(primeNette - 4145).toFixed(2)} DT ${primeNette === 4145 ? '✅' : '❌'}`);
        console.log(`  Taxes: ${(taxes - 503).toFixed(2)} DT ${Math.abs(taxes - 503) < 0.01 ? '✅' : '❌'}`);
        console.log(`  TOTAL: ${(total - 4671.80).toFixed(2)} DT ${Math.abs(total - 4671.80) < 0.01 ? '✅' : '❌'}`);
      }

      // Show breakdown
      console.log(`\n  Breakdown:`);
      for (const item of quote.items) {
        const guaranteeCode = item.guarantee?.code || 'UNKNOWN';
        console.log(`    ${guaranteeCode}: ${parseFloat(item.prime).toFixed(2)} DT`);
      }
    }

    // 7. CDC Compliance Percentage
    console.log('\n' + '='.repeat(80));
    console.log('🎯 CDC COMPLIANCE PERCENTAGE');
    console.log('='.repeat(80));

    let totalChecks = 0;
    let passedChecks = 0;

    for (const quote of quotes) {
      const company = companies.find(c => c.id === quote.companyId);
      const primeNette = parseFloat(quote.primeNette);
      const taxes = parseFloat(quote.taxes);
      const total = parseFloat(quote.totalAPayer);

      console.log(`\n${company.name}:`);

      if (company.code === 'LLOYD') {
        // Check Prime Nette
        totalChecks++;
        if (Math.abs(primeNette - 4163) < 0.01) {
          passedChecks++;
          console.log('  ✅ Prime nette: 4163.00 DT');
        } else {
          console.log(`  ❌ Prime nette: Expected 4163.00, Got ${primeNette.toFixed(2)}`);
        }

        // Check Taxes
        totalChecks++;
        if (Math.abs(taxes - 506.56) < 0.01) {
          passedChecks++;
          console.log('  ✅ Taxes: 506.56 DT');
        } else {
          console.log(`  ❌ Taxes: Expected 506.56, Got ${taxes.toFixed(2)}`);
        }

        // Check Total
        totalChecks++;
        if (Math.abs(total - 4703.36) < 0.01) {
          passedChecks++;
          console.log('  ✅ Total: 4703.36 DT');
        } else {
          console.log(`  ❌ Total: Expected 4703.36, Got ${total.toFixed(2)}`);
        }

        // Check individual guarantees
        const items = quote.items;
        const checks = [
          { code: 'RC', expected: 140, name: 'RC' },
          { code: 'CAS', expected: 45, name: 'CAS' },
          { code: 'VOL', expected: 266, name: 'VOL' },
          { code: 'INCENDIE', expected: 305, name: 'INCENDIE' },
          { code: 'INCENDIE_EMEUTES', expected: 15, name: 'Incendie Suite Émeutes' },
          { code: 'PERSONNES_TRANSPORTEES', expected: 25, name: 'PTA' },
          { code: 'ASSISTANCE', expected: 115, name: 'ASSISTANCE' },
          { code: 'BG', expected: 0, name: 'BG (free with TR)' },
          { code: 'DOMMAGES_EMEUTES', expected: 30, name: 'Dommages Émeutes' },
          { code: 'TOUS_RISQUES_ZERO', expected: 3222, name: 'TOUS RISQUES 0%' },
        ];

        for (const check of checks) {
          totalChecks++;
          const item = items.find(i => i.guarantee?.code === check.code);
          const prime = item ? parseFloat(item.prime) : 0;
          if (Math.abs(prime - check.expected) < 0.01) {
            passedChecks++;
            console.log(`  ✅ ${check.name}: ${check.expected.toFixed(2)} DT`);
          } else {
            console.log(`  ❌ ${check.name}: Expected ${check.expected.toFixed(2)}, Got ${prime.toFixed(2)}`);
          }
        }

      } else if (company.code === 'AMANA') {
        // Check Prime Nette
        totalChecks++;
        if (Math.abs(primeNette - 4145) < 0.01) {
          passedChecks++;
          console.log('  ✅ Prime nette: 4145.00 DT');
        } else {
          console.log(`  ❌ Prime nette: Expected 4145.00, Got ${primeNette.toFixed(2)}`);
        }

        // Check Taxes
        totalChecks++;
        if (Math.abs(taxes - 503) < 0.01) {
          passedChecks++;
          console.log('  ✅ Taxes: 503.00 DT');
        } else {
          console.log(`  ❌ Taxes: Expected 503.00, Got ${taxes.toFixed(2)}`);
        }

        // Check Total
        totalChecks++;
        if (Math.abs(total - 4671.80) < 0.01) {
          passedChecks++;
          console.log('  ✅ Total: 4671.80 DT');
        } else {
          console.log(`  ❌ Total: Expected 4671.80, Got ${total.toFixed(2)}`);
        }

        // Check individual guarantees
        const items = quote.items;
        const checks = [
          { code: 'RC', expected: 140, name: 'RC' },
          { code: 'CAS', expected: 20, name: 'CAS' },
          { code: 'VOL', expected: 266, name: 'VOL' },
          { code: 'INCENDIE', expected: 305, name: 'INCENDIE' },
          { code: 'PERSONNES_TRANSPORTEES', expected: 32, name: 'PTA' },
          { code: 'ASSISTANCE', expected: 90, name: 'ASSISTANCE' },
          { code: 'BG', expected: 0, name: 'BG (free with TR)' },
          { code: 'DOMMAGES_EMEUTES', expected: 30, name: 'Dommages Émeutes' },
          { code: 'CATASTROPHES_NATURELLES', expected: 40, name: 'CAT NAT' },
          { code: 'TOUS_RISQUES_ZERO', expected: 3222, name: 'TOUS RISQUES 0%' },
        ];

        for (const check of checks) {
          totalChecks++;
          const item = items.find(i => i.guarantee?.code === check.code);
          const prime = item ? parseFloat(item.prime) : 0;
          if (Math.abs(prime - check.expected) < 0.01) {
            passedChecks++;
            console.log(`  ✅ ${check.name}: ${check.expected.toFixed(2)} DT`);
          } else {
            console.log(`  ❌ ${check.name}: Expected ${check.expected.toFixed(2)}, Got ${prime.toFixed(2)}`);
          }
        }
      }
    }

    // Final Score
    const percentage = ((passedChecks / totalChecks) * 100).toFixed(2);
    console.log('\n' + '='.repeat(80));
    console.log(`🎯 FINAL COMPLIANCE SCORE: ${passedChecks}/${totalChecks} checks passed`);
    console.log(`📊 MATCH PERCENTAGE: ${percentage}%`);
    console.log('='.repeat(80));

    if (passedChecks === totalChecks) {
      console.log('\n🎉 ✅ 100% CDC COMPLIANT - PERFECT MATCH!');
    } else {
      console.log(`\n⚠️  ${totalChecks - passedChecks} checks failed - review above for details`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST COMPLETED');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runTest();
