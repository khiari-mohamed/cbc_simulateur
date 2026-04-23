const axios = require('axios');

// Test Flouci API directly
async function testFlouciAPI() {
  const FLOUCI_URL = 'https://developers.flouci.com/api';
  const FLOUCI_APP_TOKEN = '15430dda-ea57-4b9e-8075-25923b645941';
  const FLOUCI_APP_SECRET = '6d756839-b8ae-4a4b-9a98-17b9a947d91f';

  console.log('🔍 Testing Flouci API Connection...\n');

  const testPayload = {
    app_token: FLOUCI_APP_TOKEN,
    app_secret: FLOUCI_APP_SECRET,
    amount: 100000, // 100 DT in millimes
    accept_card: 'true',
    session_timeout_secs: 1200,
    success_link: 'http://localhost:5173/payment/success',
    fail_link: 'http://localhost:5173/payment/cancel',
    developer_tracking_id: `TEST-${Date.now()}`,
    webhook: 'http://localhost:3000/payments/webhook', // Add webhook URL
  };

  console.log('📤 Request Payload:');
  console.log(JSON.stringify(testPayload, null, 2));
  console.log('\n');

  try {
    console.log('🌐 Calling Flouci API...');
    const response = await axios.post(
      `${FLOUCI_URL}/generate_payment`,
      testPayload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );

    console.log('✅ SUCCESS! Flouci API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n');

    if (response.data?.result?.link) {
      console.log('🔗 Payment Link:', response.data.result.link);
      console.log('💳 Payment ID:', response.data.result.payment_id);
    }
  } catch (error) {
    console.error('❌ ERROR! Flouci API Failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Error Message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Connection refused - Check if Flouci API is accessible');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n⚠️  Request timeout - Flouci API is too slow');
    } else if (error.response?.status === 401) {
      console.error('\n⚠️  Authentication failed - Check app_token and app_secret');
    } else if (error.response?.status === 400) {
      console.error('\n⚠️  Bad request - Check payload format');
    }
  }
}

testFlouciAPI();
