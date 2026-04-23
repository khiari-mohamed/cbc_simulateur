const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════');
console.log('  FLOUCI WEBHOOK CONFIGURATION CHECKER');
console.log('═══════════════════════════════════════════════════════\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.error('❌ .env file not found!');
  console.log('\n📝 Create a .env file with the following variables:\n');
  console.log('FLOUCI_URL=https://developers.flouci.com/api');
  console.log('FLOUCI_APP_TOKEN=your_app_token_here');
  console.log('FLOUCI_APP_SECRET=your_app_secret_here');
  console.log('FRONTEND_URL=http://localhost:5173');
  console.log('BACKEND_URL=http://localhost:3000');
  console.log('\n⚠️  For production, BACKEND_URL must be publicly accessible!');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

console.log('✅ .env file found\n');
console.log('Checking required variables...\n');

const requiredVars = [
  'FLOUCI_URL',
  'FLOUCI_APP_TOKEN',
  'FLOUCI_APP_SECRET',
  'FRONTEND_URL',
  'BACKEND_URL',
];

let allPresent = true;
let warnings = [];

requiredVars.forEach(varName => {
  const value = envVars[varName];
  if (!value || value === 'your_app_token_here' || value === 'your_app_secret_here') {
    console.log(`❌ ${varName}: Missing or not configured`);
    allPresent = false;
  } else {
    console.log(`✅ ${varName}: ${value}`);
    
    // Check for localhost in BACKEND_URL
    if (varName === 'BACKEND_URL' && value.includes('localhost')) {
      warnings.push('⚠️  BACKEND_URL uses localhost - Flouci webhooks will NOT work!');
      warnings.push('   Use ngrok or similar to expose your local server:');
      warnings.push('   1. Install ngrok: npm install -g ngrok');
      warnings.push('   2. Run: ngrok http 3000');
      warnings.push('   3. Update BACKEND_URL with the ngrok URL');
    }
  }
});

console.log('\n' + '═'.repeat(55));

if (!allPresent) {
  console.log('\n❌ Configuration incomplete!');
  console.log('\nPlease update your .env file with the missing values.');
  process.exit(1);
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:\n');
  warnings.forEach(warning => console.log(warning));
  console.log('\n📖 See FLOUCI_WEBHOOK_SETUP.md for detailed instructions.');
}

console.log('\n✅ All required variables are configured!');
console.log('\n📋 Next steps:');
console.log('1. Start backend: npm run start:dev');
console.log('2. Start frontend: npm run dev');
console.log('3. Test webhook: node test-webhook.js');
console.log('4. Test payment flow end-to-end');
console.log('\n📖 Full guide: FLOUCI_WEBHOOK_SETUP.md');
console.log('═'.repeat(55) + '\n');
