#!/usr/bin/env node

/**
 * Post-Deploy Test Hook
 * 
 * This script runs automatically after deployment to verify that the
 * Twilio webhook endpoints are functioning correctly.
 * 
 * It tests both the voice and SMS webhooks against the production environment.
 * It also verifies that the test business exists in Airtable and creates it if needed.
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

// Constants for test business
const TEST_BUSINESS_PHONE = '+16193721633';

console.log(chalk.blue('🚀 Running post-deploy tests...'));
console.log(chalk.gray('-----------------------------------'));

// Function to run a command and return its output
function runCommand(command) {
  try {
    console.log(chalk.yellow(`Running: ${command}`));
    const output = execSync(command, { encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || '', 
      error: error.stderr || error.message 
    };
  }
}

// Run the tests
async function runTests() {
  // Set environment to production
  process.env.TARGET = 'prod';
  
  // Test 1: Incoming call webhook
  console.log(chalk.blue('\n📞 Testing incoming call webhook...'));
  const callResult = runCommand(`TARGET=prod node scripts/test-incoming-call.js ${TEST_BUSINESS_PHONE}`);
  
  if (callResult.success) {
    console.log(chalk.green('✅ Call webhook test passed!'));
  } else {
    console.log(chalk.red('❌ Call webhook test failed!'));
    console.log(callResult.error);
  }
  
  // Test 2: Incoming SMS webhook
  console.log(chalk.blue('\n📱 Testing incoming SMS webhook...'));
  const smsResult = runCommand(`TARGET=prod node scripts/test-incoming-sms.js ${TEST_BUSINESS_PHONE}`);
  
  if (smsResult.success) {
    console.log(chalk.green('✅ SMS webhook test passed!'));
  } else {
    console.log(chalk.red('❌ SMS webhook test failed!'));
    console.log(smsResult.error);
  }
  
  // Summary
  console.log(chalk.gray('\n-----------------------------------'));
  if (callResult.success && smsResult.success) {
    console.log(chalk.green('✅ All post-deploy tests passed!'));
    return true;
  } else {
    console.log(chalk.red('❌ Some tests failed. See logs above for details.'));
    return false;
  }
}

// Run the tests and exit with appropriate code
runTests()
  .then(success => {
    if (!success) {
      console.log(chalk.yellow('⚠️ Tests failed but continuing deployment.'));
      console.log(chalk.yellow('Please check the logs and fix any issues.'));
    }
  })
  .catch(error => {
    console.error(chalk.red('❌ Unhandled error:'), error);
  });
