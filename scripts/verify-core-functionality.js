#!/usr/bin/env node

/**
 * Core Functionality Verification Script
 * 
 * This script verifies that all core functionality is working correctly by:
 * 1. Checking if all required environment variables are set
 * 2. Testing the Auth0 integration
 * 3. Testing the Airtable integration
 * 4. Testing the Twilio integration
 * 5. Testing the Zapier webhook integration
 * 
 * Usage:
 * node scripts/verify-core-functionality.js
 */

require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const AUTH0_REQUIRED_VARS = [
  'AUTH0_SECRET',
  'AUTH0_ISSUER_BASE_URL',
  'AUTH0_BASE_URL',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
];

const AIRTABLE_REQUIRED_VARS = [
  'AIRTABLE_PAT',
  'AIRTABLE_BASE_ID',
];

const TWILIO_REQUIRED_VARS = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
];

const ZAPIER_REQUIRED_VARS = [
  'ZAPIER_MISSED_CALL_WEBHOOK_URL',
  'ZAPIER_NEW_MESSAGE_WEBHOOK_URL',
];

// Helper function to check if environment variables are set
function checkEnvironmentVariables(requiredVars, name) {
  console.log(`\n🔍 Checking ${name} environment variables...`);
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    console.log(`✅ All ${name} environment variables are set`);
    return true;
  } else {
    console.log(`❌ Missing ${name} environment variables:`);
    missingVars.forEach(varName => {
      console.log(`  - ${varName}`);
    });
    return false;
  }
}

// Helper function to run a test script
function runTestScript(scriptPath, name) {
  console.log(`\n🧪 Running ${name} test...`);
  
  try {
    const output = execSync(`node ${scriptPath}`, { encoding: 'utf8' });
    console.log(output);
    return true;
  } catch (error) {
    console.error(`❌ Error running ${name} test:`, error.message);
    if (error.stdout) {
      console.log(error.stdout);
    }
    if (error.stderr) {
      console.error(error.stderr);
    }
    return false;
  }
}

// Main function to verify core functionality
async function verifyCoreFunctionality() {
  console.log('🔄 Verifying Core Functionality');
  console.log('==============================');
  
  // Check if all test scripts exist
  const requiredScripts = [
    'scripts/test-auth0-flow.js',
    'scripts/test-airtable-integration.js',
    'scripts/test-twilio-integration.js',
    'scripts/test-zapier-webhook.js',
  ];
  
  const missingScripts = requiredScripts.filter(scriptPath => !fs.existsSync(path.resolve(scriptPath)));
  
  if (missingScripts.length > 0) {
    console.log('❌ Missing test scripts:');
    missingScripts.forEach(scriptPath => {
      console.log(`  - ${scriptPath}`);
    });
    console.log('\nPlease make sure all test scripts are available before running this verification script.');
    return;
  }
  
  // Check environment variables
  const auth0EnvOk = checkEnvironmentVariables(AUTH0_REQUIRED_VARS, 'Auth0');
  const airtableEnvOk = checkEnvironmentVariables(AIRTABLE_REQUIRED_VARS, 'Airtable');
  const twilioEnvOk = checkEnvironmentVariables(TWILIO_REQUIRED_VARS, 'Twilio');
  const zapierEnvOk = checkEnvironmentVariables(ZAPIER_REQUIRED_VARS, 'Zapier');
  
  // Run test scripts if environment variables are set
  let auth0TestOk = false;
  let airtableTestOk = false;
  let twilioTestOk = false;
  let zapierTestOk = false;
  
  if (auth0EnvOk) {
    auth0TestOk = runTestScript('scripts/test-auth0-flow.js', 'Auth0');
  } else {
    console.log('\n⚠️ Skipping Auth0 test due to missing environment variables');
  }
  
  if (airtableEnvOk) {
    airtableTestOk = runTestScript('scripts/test-airtable-integration.js', 'Airtable');
  } else {
    console.log('\n⚠️ Skipping Airtable test due to missing environment variables');
  }
  
  if (twilioEnvOk) {
    twilioTestOk = runTestScript('scripts/test-twilio-integration.js', 'Twilio');
  } else {
    console.log('\n⚠️ Skipping Twilio test due to missing environment variables');
  }
  
  if (zapierEnvOk) {
    zapierTestOk = runTestScript('scripts/test-zapier-webhook.js', 'Zapier');
  } else {
    console.log('\n⚠️ Skipping Zapier test due to missing environment variables');
  }
  
  // Summary
  console.log('\n📋 Verification Summary');
  console.log('====================');
  console.log(`Auth0 Integration: ${auth0EnvOk ? (auth0TestOk ? '✅ Working' : '❌ Failed') : '⚠️ Not Configured'}`);
  console.log(`Airtable Integration: ${airtableEnvOk ? (airtableTestOk ? '✅ Working' : '❌ Failed') : '⚠️ Not Configured'}`);
  console.log(`Twilio Integration: ${twilioEnvOk ? (twilioTestOk ? '✅ Working' : '❌ Failed') : '⚠️ Not Configured'}`);
  console.log(`Zapier Integration: ${zapierEnvOk ? (zapierTestOk ? '✅ Working' : '❌ Failed') : '⚠️ Not Configured'}`);
  
  // Overall status
  const allConfigured = auth0EnvOk && airtableEnvOk && twilioEnvOk && zapierEnvOk;
  const allWorking = auth0TestOk && airtableTestOk && twilioTestOk && zapierTestOk;
  
  if (allConfigured && allWorking) {
    console.log('\n🎉 All core functionality is working correctly!');
  } else if (!allConfigured) {
    console.log('\n⚠️ Some integrations are not configured. Please set the required environment variables.');
  } else {
    console.log('\n❌ Some integrations are not working correctly. Please check the test results above.');
  }
  
  // Next steps
  console.log('\n📝 Next Steps');
  console.log('===========');
  
  if (!auth0EnvOk || !auth0TestOk) {
    console.log('- Configure Auth0 integration: See AUTH0_INTEGRATION.md for details');
  }
  
  if (!airtableEnvOk || !airtableTestOk) {
    console.log('- Configure Airtable integration: See AIRTABLE_OAUTH.md for details');
  }
  
  if (!twilioEnvOk || !twilioTestOk) {
    console.log('- Configure Twilio integration: See TWILIO_INTEGRATION.md for details');
  }
  
  if (!zapierEnvOk || !zapierTestOk) {
    console.log('- Configure Zapier integration: See ZAPIER_WEBHOOK_INTEGRATION.md for details');
  }
  
  if (allConfigured && allWorking) {
    console.log('- Start the development server: npm run dev');
    console.log('- Open http://localhost:3000 in your browser');
    console.log('- Log in and explore the application');
  }
}

verifyCoreFunctionality();
