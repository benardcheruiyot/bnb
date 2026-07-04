#!/usr/bin/env node

/**
 * M-Pesa Configuration Helper
 * Interactive script to set up M-Pesa credentials
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function main() {
  console.log('\n🚀 M-Pesa Configuration Setup\n');
  console.log('This script configures production M-Pesa credentials only.\n');
  await setupProduction();
}

async function setupProduction() {
  console.log('\n🔐 Production Configuration\n');
  console.log('⚠️  IMPORTANT: This will update your .env file with production credentials\n');

  const envPath = path.join(__dirname, '.env');

  const consumerKey = await question(
    'Enter your MPESA_CONSUMER_KEY (from Daraja): '
  );
  const consumerSecret = await question(
    'Enter your MPESA_CONSUMER_SECRET (from Daraja): '
  );
  const shortcode = await question('Enter your MPESA_SHORTCODE (business shortcode): ');
  const partyB = await question('Enter your MPESA_PARTYB (Buy Goods/Till or paybill destination): ');
  const passkey = await question('Enter your MPESA_PASSKEY (from M-Pesa Portal): ');
  const transactionType = await question(
    'Enter MPESA_TRANSACTION_TYPE (CustomerBuyGoodsOnline or CustomerPayBillOnline): '
  );
  const callbackUrl = await question(
    'Enter your MPESA_CALLBACK_URL (e.g., https://yourdomain.com/api/mpesa/callback): '
  );
  const frontendUrl = await question(
    'Enter your FRONTEND_URL (e.g., https://yourdomain.com): '
  );
  const mongoUri = await question(
    'Enter your MONGODB_URI (MongoDB Atlas connection string): '
  );

  // Generate JWT secret
  const crypto = require('crypto');
  const jwtSecret = crypto.randomBytes(32).toString('hex');

  let envContent = fs.readFileSync(envPath, 'utf8');

  // Update environment variables
  envContent = updateEnvVar(envContent, 'NODE_ENV', 'production');
  envContent = updateEnvVar(envContent, 'MPESA_ENVIRONMENT', 'production');
  envContent = updateEnvVar(envContent, 'MPESA_CONSUMER_KEY', consumerKey);
  envContent = updateEnvVar(envContent, 'MPESA_CONSUMER_SECRET', consumerSecret);
  envContent = updateEnvVar(envContent, 'MPESA_SHORTCODE', shortcode);
  envContent = updateEnvVar(envContent, 'MPESA_PARTYB', partyB);
  envContent = updateEnvVar(envContent, 'MPESA_PASSKEY', passkey);
  envContent = updateEnvVar(envContent, 'MPESA_TRANSACTION_TYPE', transactionType || 'CustomerBuyGoodsOnline');
  envContent = updateEnvVar(envContent, 'MPESA_CALLBACK_URL', callbackUrl);
  envContent = updateEnvVar(envContent, 'FRONTEND_URL', frontendUrl);
  envContent = updateEnvVar(envContent, 'MONGODB_URI', mongoUri);
  envContent = updateEnvVar(envContent, 'JWT_SECRET', jwtSecret);

  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Production configuration saved to .env\n');
  console.log('Next steps:');
  console.log('1. Restart your backend server');
  console.log('2. Test payment flow');
  console.log('3. Monitor M-Pesa Portal for transactions\n');

  rl.close();
}

function updateEnvVar(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  } else {
    return content + `\n${key}=${value}`;
  }
}

main().catch(console.error);
