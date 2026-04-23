const axios = require('axios');

// Test webhook endpoint locally
async function testWebhook() {
  const BACKEND_URL = 'http://localhost:3000';
  
  console.log('🧪 Testing Webhook Endpoint...\n');

  // Test payload simulating Flouci webhook
  const webhookPayload = {
    payment_id: 'test_flouci_payment_' + Date.now(),
    developer_tracking_id: 'ARS-Q2024000001-1234567890', // Replace with real orderId from your DB
    amount: 500000, // 500 DT in millimes
    status: 'SUCCESS',
  };

  console.log('📤 Webhook Payload:');
  console.log(JSON.stringify(webhookPayload, null, 2));
  console.log('\n');

  try {
    console.log('🌐 Calling webhook endpoint...');
    const response = await axios.post(
      `${BACKEND_URL}/payments/webhook`,
      webhookPayload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    console.log('✅ SUCCESS! Webhook Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n');
    console.log('Status Code:', response.status);
  } catch (error) {
    console.error('❌ ERROR! Webhook Failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Error Message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Connection refused - Is the backend running?');
      console.error('    Start backend with: npm run start:dev');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n⚠️  Request timeout - Backend is too slow');
    } else if (error.response?.status === 400) {
      console.error('\n⚠️  Bad request - Check payload format');
    } else if (error.response?.status === 404) {
      console.error('\n⚠️  Endpoint not found - Check webhook route');
    }
  }
}

console.log('═══════════════════════════════════════════════════════');
console.log('  FLOUCI WEBHOOK ENDPOINT TEST');
console.log('═══════════════════════════════════════════════════════\n');
console.log('⚠️  IMPORTANT: Before running this test:\n');
console.log('1. Start your backend server:');
console.log('   cd backend && npm run start:dev\n');
console.log('2. Create a test payment using:');
console.log('   node create-payment-test-scenario.js\n');
console.log('3. Update the developer_tracking_id in this script');
console.log('   with a real orderId from your database\n');
console.log('4. Run this script:');
console.log('   node test-webhook.js\n');
console.log('═══════════════════════════════════════════════════════\n');

testWebhook();
