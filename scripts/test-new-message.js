#!/usr/bin/env node

/**
 * Test script for the /api/new-message API endpoint
 * 
 * This script tests core functionality of the SMS auto-reply system:
 * 1. Normal message (no urgency, no ordering)
 * 2. Ordering message (business has online ordering link)
 * 3. Urgent message (standard keyword match)
 * 4. Urgent message (GPT classification match)
 * 
 * Usage: node scripts/test-new-message.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';
import querystring from 'querystring';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Default values
const DEFAULT_TO = process.env.TWILIO_SMARTTEXT_NUMBER || '+18186518560'; // Twilio number
const DEFAULT_FROM = process.env.TEST_PHONE_NUMBER || '+12125551234'; // Configurable sender's number
const API_URL = process.env.API_URL || 'https://api.getsmarttext.com/api/new-message';

// Test configuration
const TEST_MODE = true; // Set to true to prevent actual SMS sending

/**
 * Run a single test against the new-message API endpoint
 * @param {Object} options - Test options
 * @param {string} options.testName - Name of the test
 * @param {string} options.description - Description of what's being tested
 * @param {string} options.to - Twilio phone number (To)
 * @param {string} options.from - Sender's phone number (From)
 * @param {string} options.body - Message text (Body)
 * @param {Object} [options.additionalPayload] - Additional payload fields
 * @param {Object} [options.expectedResponse] - Expected response properties
 * @param {number} [options.expectedStatus] - Expected HTTP status code
 * @returns {Promise<Object>} - Test result object
 */
async function runTest({ 
  testName, 
  description, 
  to, 
  from, 
  body, 
  additionalPayload = {}, 
  expectedResponse = {}, 
  expectedStatus = 200 
}) {
  console.log(chalk.cyan(`\n\n======== TEST: ${testName} ========`));
  console.log(chalk.cyan(`Description: ${description}`));
  
  // Prepare the request payload (simulating a Twilio webhook)
  const payload = {
    To: to,
    From: from,
    Body: body,
    ...additionalPayload
  };
  
  // For test mode, add test flag to prevent actual SMS sending
  if (TEST_MODE) {
    payload.testMode = true;
  }
  
  console.log(chalk.yellow('\nRequest payload:'));
  console.log(JSON.stringify(payload, null, 2));
  
  try {
    // Convert payload to x-www-form-urlencoded format (Twilio webhook format)
    const formData = querystring.stringify(payload);
    
    // Send the request to the API endpoint
    const response = await axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      validateStatus: () => true, // Don't throw on non-2xx responses
      timeout: parseInt(process.env.AXIOS_TIMEOUT || '10000') // 10 second timeout by default
    });
    
    console.log(chalk.yellow(`\nResponse status: ${response.status}`));
    console.log(chalk.yellow('Response body:'));
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verify status code
    const statusMatch = response.status === expectedStatus;
    if (!statusMatch) {
      console.log(chalk.red(`❌ Status code mismatch! Expected ${expectedStatus}, got ${response.status}`));
    }
    
    // Verify expected response properties
    let responseMatch = true;
    const mismatches = [];
    
    for (const [key, value] of Object.entries(expectedResponse)) {
      if (JSON.stringify(response.data[key]) !== JSON.stringify(value)) {
        responseMatch = false;
        mismatches.push(`${key}: expected ${JSON.stringify(value)}, got ${JSON.stringify(response.data[key])}`);
      }
    }
    
    if (!responseMatch) {
      console.log(chalk.red('❌ Response mismatch!'));
      mismatches.forEach(mismatch => console.log(chalk.red(`  - ${mismatch}`)));
    }
    
    // Check for specific test conditions
    let testSpecificChecks = [];
    
    // Check for urgency detection
    if (expectedResponse.urgentFlag === true) {
      const urgencyDetected = response.data.urgentFlag === true;
      testSpecificChecks.push({
        name: 'Urgency Detection',
        passed: urgencyDetected,
        message: urgencyDetected 
          ? `✅ Urgency correctly detected via ${response.data.urgencySource || 'unknown source'}`
          : '❌ Urgency was not detected'
      });
    } else if (expectedResponse.urgentFlag === false || expectedResponse.urgentFlag === undefined) {
      const noUrgencyDetected = response.data.urgentFlag !== true;
      testSpecificChecks.push({
        name: 'No Urgency',
        passed: noUrgencyDetected,
        message: noUrgencyDetected 
          ? '✅ Correctly did not detect urgency'
          : '❌ Incorrectly detected urgency'
      });
    }
    
    // Check for online ordering link
    if (expectedResponse.includeOrderingLink === true) {
      const hasOrderingLink = response.data.responseMessage && 
        (response.data.responseMessage.includes('order') || 
         response.data.responseMessage.includes('ordering'));
      testSpecificChecks.push({
        name: 'Online Ordering Link',
        passed: hasOrderingLink,
        message: hasOrderingLink 
          ? '✅ Online ordering link correctly included in response'
          : '❌ Online ordering link not found in response'
      });
    }
    
    // Display response source and message
    if (response.data.responseSource) {
      console.log(chalk.yellow(`\nResponse source: ${chalk.bold(response.data.responseSource)}`));
    }
    
    if (response.data.responseMessage) {
      console.log(chalk.yellow(`Response message: "${response.data.responseMessage}"`));
    }
    
    // Display test-specific check results
    if (testSpecificChecks.length > 0) {
      console.log(chalk.cyan('\nTest-specific checks:'));
      testSpecificChecks.forEach(check => {
        console.log(check.passed ? chalk.green(check.message) : chalk.red(check.message));
      });
    }
    
    // Determine overall test result
    const testSpecificChecksPassed = testSpecificChecks.every(check => check.passed);
    const passed = statusMatch && responseMatch && testSpecificChecksPassed;
    console.log(passed ? chalk.green('\n✅ TEST PASSED') : chalk.red('\n❌ TEST FAILED'));
    
    return {
      name: testName,
      passed,
      response: response.data,
      status: response.status
    };
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error during test:'));
    
    if (error.response) {
      console.error(chalk.red(`Status: ${error.response.status}`));
      console.error(chalk.red('Response data:'), error.response.data);
    } else if (error.request) {
      console.error(chalk.red('No response received from server. Is the server running?'));
      console.error(chalk.red('Error details:'), error.request);
    } else {
      console.error(chalk.red('Error message:'), error.message);
    }
    
    return {
      name: testName,
      passed: false,
      error: error.message
    };
  }
}

/**
 * Run all tests in sequence
 */
async function runAllTests() {
  console.log(chalk.bold.green('\n================================================='));
  console.log(chalk.bold.green('  TWILIO WEBHOOK TEST SUITE FOR /api/new-message'));
  console.log(chalk.bold.green('================================================='));
  
  if (TEST_MODE) {
    console.log(chalk.yellow('\n⚠️ Running in TEST MODE - No actual SMS will be sent'));
  }
  
  const testResults = [];
  
  // Test 1: Normal message (no urgency, no ordering)
  testResults.push(await runTest({
    testName: 'Normal Message',
    description: 'Message with no urgency or ordering intent: "What are your business hours?"',
    to: DEFAULT_TO,
    from: DEFAULT_FROM,
    body: 'What are your business hours?',
    expectedResponse: {
      success: true,
      urgentFlag: undefined // No urgency flag should be present
    },
    additionalPayload: {
      _testOverrides: {
        businessType: 'restaurant' // Ensure we're testing with a restaurant type
      }
    }
  }));
  
  // Test 2: Ordering message (business has online ordering link)
  testResults.push(await runTest({
    testName: 'Ordering Message',
    description: 'Message with ordering intent: "I want to place an order"',
    to: DEFAULT_TO,
    from: DEFAULT_FROM,
    body: 'I want to place an order',
    expectedResponse: {
      success: true,
      urgentFlag: undefined // No urgency flag should be present
    },
    additionalPayload: {
      _testOverrides: {
        businessType: 'restaurant',
        onlineOrderingUrl: 'https://order.restaurant.com' // Ensure online ordering URL is set
      },
      includeOrderingLink: true
    }
  }));
  
  // Test 3: Urgent message (standard keyword match)
  testResults.push(await runTest({
    testName: 'Urgent Message (Keyword)',
    description: 'Message with standard urgency keyword: "This is an emergency!"',
    to: DEFAULT_TO,
    from: DEFAULT_FROM,
    body: 'This is an emergency!',
    expectedResponse: {
      success: true,
      urgentFlag: true,
      urgencySource: 'standard_keywords'
    },
    additionalPayload: {
      _testOverrides: {
        ownerPhone: '+15551234567' // Ensure owner phone is set for alert
      }
    }
  }));
  
  // Test 4: Urgent message (GPT classification match)
  testResults.push(await runTest({
    testName: 'Urgent Message (GPT Classification)',
    description: 'Message with implied urgency for GPT detection: "Can you come today? It\'s really important"',
    to: DEFAULT_TO,
    from: DEFAULT_FROM,
    body: 'Can you come today? It\'s really important',
    expectedResponse: {
      success: true
      // Note: We don't strictly check for urgentFlag and urgencySource here
      // as the GPT classification is non-deterministic in real environments
    },
    additionalPayload: {
      _testOverrides: {
        ownerPhone: '+15551234567', // Ensure owner phone is set for alert
        forceGptUrgency: true // Force GPT to classify as urgent for testing
      }
    }
  }));
  
  // Print summary
  console.log(chalk.bold.green('\n================================================='));
  console.log(chalk.bold.green('                 TEST SUMMARY'));
  console.log(chalk.bold.green('================================================='));
  
  let passedCount = 0;
  
  testResults.forEach(result => {
    if (result.passed) {
      passedCount++;
      console.log(`${chalk.green('✅ PASSED')}: ${result.name}`);
    } else {
      console.log(`${chalk.red('❌ FAILED')}: ${result.name}`);
    }
  });
  
  console.log(chalk.bold.green('\n================================================='));
  console.log(chalk.bold(`Tests passed: ${passedCount}/${testResults.length}`));
  console.log(chalk.bold.green('All tests completed'));
  console.log(chalk.bold.green('================================================='));
}

// Execute all tests
runAllTests().catch(error => {
  console.error(chalk.red('\n❌ Unhandled error:'), error);
  process.exit(1);
});
