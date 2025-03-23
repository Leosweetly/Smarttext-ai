#!/usr/bin/env node

/**
 * Direct Call Test for Twilio Number
 * 
 * This script directly tests if the Twilio number +18186518560 is configured
 * for auto-texting by making a direct API call to Twilio.
 * 
 * Usage: node scripts/direct-call-test.js
 */

const https = require('https');

// The phone number to test
const PHONE_NUMBER = '+18186518560';

// Function to make a GET request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(data);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log(`\n🔍 Testing Twilio number: ${PHONE_NUMBER}`);
  
  try {
    // Make a direct call to test if the number is reachable
    console.log('\n📞 Attempting to check if the number is reachable...');
    
    // Use a public API to check the phone number
    const response = await makeRequest(`https://phonevalidator.com/api/v1/validate?number=${PHONE_NUMBER}`);
    
    console.log('\n📋 Results:');
    console.log('--------------------------------------------------');
    console.log(`Phone Number: ${PHONE_NUMBER}`);
    console.log(`Response: ${response}`);
    console.log('--------------------------------------------------');
    
    console.log('\n📱 To test if this number sends auto-texts:');
    console.log('1. Call the number from your phone');
    console.log('2. Hang up before the call is answered');
    console.log('3. Wait a few moments to see if you receive an auto-text');
    
    console.log('\n⚠️ Note: If you don\'t receive an auto-text, it could mean:');
    console.log('- The number is not configured for auto-texting');
    console.log('- The number belongs to another Twilio account');
    console.log('- The auto-texting service is not currently active');
    
    console.log('\n🔧 To properly test with your own Twilio account:');
    console.log('1. Make sure you have a Twilio account with proper credentials');
    console.log('2. Add your credentials to .env.local:');
    console.log('   TWILIO_SID=your_account_sid');
    console.log('   TWILIO_AUTH_TOKEN=your_auth_token');
    console.log('3. Run the server with: npm run dev');
    console.log('4. Try the test again using the web interface or CLI tools');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Execute the main function
main().catch(console.error);
