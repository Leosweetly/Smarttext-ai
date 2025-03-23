#!/usr/bin/env node

/**
 * This script verifies the structure of the SmartText AI codebase modules
 * and logs the results.
 * 
 * Usage: node scripts/test-modules.js [module]
 * 
 * Options:
 *   [module] - Optional module name to test (ai, auth, data, payment, utils)
 *              If not provided, all modules will be tested
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Helper function to log section headers
function logSection(title) {
  console.log('\n' + colors.bright + colors.cyan + '='.repeat(50));
  console.log(` ${title} `);
  console.log('='.repeat(50) + colors.reset);
}

// Helper function to log success messages
function logSuccess(message) {
  console.log(colors.green + '✓ ' + message + colors.reset);
}

// Helper function to log error messages
function logError(message, error) {
  console.log(colors.red + '✗ ' + message + colors.reset);
  if (error) {
    console.error('  Error details:', error.message || error);
  }
}

// Helper function to log info messages
function logInfo(message) {
  console.log(colors.yellow + 'ℹ ' + message + colors.reset);
}

// Helper function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Helper function to read a file and check for exports
function checkExports(filePath, expectedExports) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const exportResults = {};
    
    expectedExports.forEach(exportName => {
      // More robust check for export presence using regex
      // This matches: export const/function/let/var exportName, export { exportName }, or export { something as exportName }
      const exportRegex = new RegExp(
        `export\\s+(const|function|let|var)\\s+${exportName}\\b|` +
        `export\\s+\\{[^}]*\\b${exportName}\\b[^}]*\\}|` +
        `export\\s+\\{[^}]*\\b\\w+\\s+as\\s+${exportName}\\b[^}]*\\}`
      );
      exportResults[exportName] = exportRegex.test(content);
    });
    
    return exportResults;
  } catch (error) {
    console.error('Error reading file:', error);
    return {};
  }
}

// Test the AI module
async function testAIModule() {
  logSection('Testing AI Module');
  
  const aiDir = path.resolve(__dirname, '../lib/ai');
  const indexFile = path.join(aiDir, 'index.js');
  const openaiFile = path.join(aiDir, 'openai.js');
  
  // Check if directory and files exist
  if (!fileExists(aiDir)) {
    logError('AI module directory not found');
    return false;
  }
  
  if (!fileExists(indexFile)) {
    logError('AI module index.js not found');
    return false;
  }
  
  if (!fileExists(openaiFile)) {
    logError('AI module openai.js not found');
    return false;
  }
  
  logSuccess('AI module structure verified');
  
  // Check for expected exports
  const expectedExports = ['generateIndustryQuestions', 'generateMissedCallResponse'];
  const exportResults = checkExports(indexFile, expectedExports);
  
  let allExportsFound = true;
  console.log('Checking for exports:');
  
  Object.entries(exportResults).forEach(([name, exists]) => {
    if (exists) {
      logSuccess(`${name} export found`);
    } else {
      logError(`${name} export not found`);
      allExportsFound = false;
    }
  });
  
  if (allExportsFound) {
    logSuccess('All expected AI module exports found');
  } else {
    logError('Some expected AI module exports are missing');
  }
  
  logInfo('Note: To fully test the AI module functionality, you would need to make API calls to OpenAI');
  
  return allExportsFound;
}

// Test the Auth module
async function testAuthModule() {
  logSection('Testing Auth Module');
  
  const authDir = path.resolve(__dirname, '../lib/auth');
  const indexFile = path.join(authDir, 'index.js');
  const auth0File = path.join(authDir, 'auth0.js');
  const contextFile = path.join(authDir, 'context.js');
  
  // Check if directory and files exist
  if (!fileExists(authDir)) {
    logError('Auth module directory not found');
    return false;
  }
  
  if (!fileExists(indexFile)) {
    logError('Auth module index.js not found');
    return false;
  }
  
  if (!fileExists(auth0File)) {
    logError('Auth module auth0.js not found');
    return false;
  }
  
  if (!fileExists(contextFile)) {
    logError('Auth module context.js not found');
    return false;
  }
  
  logSuccess('Auth module structure verified');
  
  // Check for expected exports
  const expectedExports = ['auth0', 'getSession', 'withApiAuthRequired', 'withPageAuthRequired', 'useAuth'];
  const exportResults = checkExports(indexFile, expectedExports);
  
  let allExportsFound = true;
  console.log('Checking for exports:');
  
  Object.entries(exportResults).forEach(([name, exists]) => {
    if (exists) {
      logSuccess(`${name} export found`);
    } else {
      logError(`${name} export not found`);
      allExportsFound = false;
    }
  });
  
  if (allExportsFound) {
    logSuccess('All expected Auth module exports found');
  } else {
    logError('Some expected Auth module exports are missing');
  }
  
  logInfo('Note: To fully test the Auth module functionality, you would need a browser session');
  
  return allExportsFound;
}

// Test the Data module
async function testDataModule() {
  logSection('Testing Data Module');
  
  const dataDir = path.resolve(__dirname, '../lib/data');
  const indexFile = path.join(dataDir, 'index.js');
  const airtableClientFile = path.join(dataDir, 'airtable-client.js');
  const businessFile = path.join(dataDir, 'business.js');
  const serverActionsFile = path.join(dataDir, 'server-actions.js');
  
  // Check if directory and files exist
  if (!fileExists(dataDir)) {
    logError('Data module directory not found');
    return false;
  }
  
  if (!fileExists(indexFile)) {
    logError('Data module index.js not found');
    return false;
  }
  
  if (!fileExists(airtableClientFile)) {
    logError('Data module airtable-client.js not found');
    return false;
  }
  
  if (!fileExists(businessFile)) {
    logError('Data module business.js not found');
    return false;
  }
  
  if (!fileExists(serverActionsFile)) {
    logError('Data module server-actions.js not found');
    return false;
  }
  
  logSuccess('Data module structure verified');
  
  // Check for expected exports
  const expectedExports = ['getTable', 'exploreTableSchema', 'createBusiness', 'getBusinessById', 'updateBusiness'];
  const exportResults = checkExports(indexFile, expectedExports);
  
  let allExportsFound = true;
  console.log('Checking for exports:');
  
  Object.entries(exportResults).forEach(([name, exists]) => {
    if (exists) {
      logSuccess(`${name} export found`);
    } else {
      logError(`${name} export not found`);
      allExportsFound = false;
    }
  });
  
  if (allExportsFound) {
    logSuccess('All expected Data module exports found');
  } else {
    logError('Some expected Data module exports are missing');
  }
  
  logInfo('Note: To fully test the Data module functionality, you would need to connect to Airtable');
  
  return allExportsFound;
}

// Test the Payment module
async function testPaymentModule() {
  logSection('Testing Payment Module');
  
  const paymentDir = path.resolve(__dirname, '../lib/payment');
  const indexFile = path.join(paymentDir, 'index.js');
  const stripeFile = path.join(paymentDir, 'stripe.js');
  
  // Check if directory and files exist
  if (!fileExists(paymentDir)) {
    logError('Payment module directory not found');
    return false;
  }
  
  if (!fileExists(indexFile)) {
    logError('Payment module index.js not found');
    return false;
  }
  
  if (!fileExists(stripeFile)) {
    logError('Payment module stripe.js not found');
    return false;
  }
  
  logSuccess('Payment module structure verified');
  
  // Check for expected exports
  const expectedExports = ['stripe', 'createCheckoutSession', 'createPortalSession', 'getCustomerSubscription'];
  const exportResults = checkExports(indexFile, expectedExports);
  
  let allExportsFound = true;
  console.log('Checking for exports:');
  
  Object.entries(exportResults).forEach(([name, exists]) => {
    if (exists) {
      logSuccess(`${name} export found`);
    } else {
      logError(`${name} export not found`);
      allExportsFound = false;
    }
  });
  
  if (allExportsFound) {
    logSuccess('All expected Payment module exports found');
  } else {
    logError('Some expected Payment module exports are missing');
  }
  
  logInfo('Note: To fully test the Payment module functionality, you would need to connect to Stripe');
  
  return allExportsFound;
}

// Test the Utils module
async function testUtilsModule() {
  logSection('Testing Utils Module');
  
  const utilsDir = path.resolve(__dirname, '../lib/utils');
  const indexFile = path.join(utilsDir, 'index.js');
  const sentryFile = path.join(utilsDir, 'sentry.js');
  
  // Check if directory and files exist
  if (!fileExists(utilsDir)) {
    logError('Utils module directory not found');
    return false;
  }
  
  if (!fileExists(indexFile)) {
    logError('Utils module index.js not found');
    return false;
  }
  
  if (!fileExists(sentryFile)) {
    logError('Utils module sentry.js not found');
    return false;
  }
  
  logSuccess('Utils module structure verified');
  
  // Check for expected exports
  const expectedExports = ['captureMessage', 'captureException', 'Sentry'];
  const exportResults = checkExports(indexFile, expectedExports);
  
  let allExportsFound = true;
  console.log('Checking for exports:');
  
  Object.entries(exportResults).forEach(([name, exists]) => {
    if (exists) {
      logSuccess(`${name} export found`);
    } else {
      logError(`${name} export not found`);
      allExportsFound = false;
    }
  });
  
  if (allExportsFound) {
    logSuccess('All expected Utils module exports found');
  } else {
    logError('Some expected Utils module exports are missing');
  }
  
  logInfo('Note: To fully test the Utils module functionality, you would need to connect to Sentry');
  
  return allExportsFound;
}

// Main function to run all tests
async function runTests(specificModule = null) {
  logSection('SmartText AI Module Tests');
  console.log('Testing each module to verify the new modular structure...\n');
  
  // Track test results
  const results = {
    ai: null,
    auth: null,
    data: null,
    payment: null,
    utils: null
  };
  
  try {
    // Test each module based on the specificModule parameter
    if (!specificModule || specificModule === 'ai') {
      results.ai = await testAIModule();
    }
    
    if (!specificModule || specificModule === 'auth') {
      results.auth = await testAuthModule();
    }
    
    if (!specificModule || specificModule === 'data') {
      results.data = await testDataModule();
    }
    
    if (!specificModule || specificModule === 'payment') {
      results.payment = await testPaymentModule();
    }
    
    if (!specificModule || specificModule === 'utils') {
      results.utils = await testUtilsModule();
    }
    
    // Print test summary
    logSection('Test Summary');
    
    const allTestsRun = Object.values(results).some(result => result !== null);
    const allTestsPassed = Object.values(results).every(result => result === true || result === null);
    
    if (allTestsRun) {
      if (allTestsPassed) {
        logSuccess('All tests completed successfully');
      } else {
        logError('Some tests failed - check the logs above for details');
      }
      
      console.log('\nModule Status:');
      Object.entries(results).forEach(([module, passed]) => {
        if (passed === null) {
          console.log(`  ${module}: ${colors.yellow}Not Tested${colors.reset}`);
        } else if (passed) {
          console.log(`  ${module}: ${colors.green}Passed${colors.reset}`);
        } else {
          console.log(`  ${module}: ${colors.red}Failed${colors.reset}`);
        }
      });
    } else {
      logError('No tests were run - check the module name');
      logInfo('Available modules: ai, auth, data, payment, utils');
    }
  } catch (error) {
    logError('Error running tests', error);
  }
}

// Parse command line arguments
const specificModule = process.argv[2];
if (specificModule && !['ai', 'auth', 'data', 'payment', 'utils'].includes(specificModule)) {
  console.log(`Unknown module: ${specificModule}`);
  console.log('Available modules: ai, auth, data, payment, utils');
  process.exit(1);
}

// Run the tests
runTests(specificModule)
  .then(() => {
    console.log('\nDone!');
  })
  .catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
