// Quick Flouci API Test - No backend needed
// Run: node quick-flouci-test.js

const https = require('https');

const FLOUCI_APP_TOKEN = '15430dda-ea57-4b9e-8075-25923b645941';
const FLOUCI_APP_SECRET = '6d756839-b8ae-4a4b-9a98-17b9a947d91f';

const payload = JSON.stringify({
  app_token: FLOUCI_APP_TOKEN,
  app_secret: FLOUCI_APP_SECRET,
  amount: 50000, // 50 DT test
  accept_card: 'true',
  session_timeout_secs: 1200,
  success_link: 'http://localhost:5173/payment/success',
  fail_link: 'http://localhost:5173/payment/cancel',
  developer_tracking_id: `TEST-${Date.now()}`,
});

const options = {
  hostname: 'developers.flouci.com',
  port: 443,
  path: '/api/generate_payment',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  },
};

console.log('🔍 Testing Flouci API...\n');
console.log('📤 Sending request to: https://developers.flouci.com/api/generate_payment');
console.log('📦 Payload:', JSON.parse(payload));
console.log('\n⏳ Waiting for response...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Status Message: ${res.statusMessage}\n`);

    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200) {
        console.log('✅ SUCCESS! Flouci API is working!\n');
        console.log('📄 Response:', JSON.stringify(response, null, 2));
        
        if (response.result?.link) {
          console.log('\n🔗 Payment Link:', response.result.link);
          console.log('💳 Payment ID:', response.result.payment_id);
          console.log('\n✨ Your Flouci integration is working correctly!');
        }
      } else {
        console.log('❌ ERROR! Flouci API returned an error:\n');
        console.log(JSON.stringify(response, null, 2));
        
        if (res.statusCode === 401) {
          console.log('\n⚠️  Authentication failed - Check your app_token and app_secret');
        } else if (res.statusCode === 400) {
          console.log('\n⚠️  Bad request - Check the payload format');
        }
      }
    } catch (e) {
      console.log('❌ Failed to parse response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  
  if (error.code === 'ENOTFOUND') {
    console.error('\n⚠️  Cannot reach Flouci API - Check your internet connection');
  } else if (error.code === 'ETIMEDOUT') {
    console.error('\n⚠️  Request timeout - Flouci API is too slow or unreachable');
  }
});

req.write(payload);
req.end();
