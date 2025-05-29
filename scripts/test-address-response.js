#!/usr/bin/env node

/**
 * Test script for the address response functionality
 * 
 * This script tests if the system correctly responds with the business address
 * when a user texts a message containing the word "address".
 * 
 * Usage: node scripts/test-address-response.js
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
// Use localhost for testing to ensure we're hitting our local implementation
const API_URL = process.env.API_URL || 'http://localhost:3002/api/new-message';

// Test configuration
const TEST_MODE = true; // Set to true to prevent actual SMS sending

/**
 * Run a single test against the new-message API endpoint
 * @param {Object} options - Test options
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
    // Handle _testOverrides specially to ensure it's properly serialized
    const payloadForForm = { ...payload };
    if (payloadForForm._testOverrides) {
      payloadForForm._testOverrides = JSON.stringify(payloadForForm._testOverrides);
    }
    
    // Convert payload to x-www-form-urlencoded format (Twilio webhook format)
    const formData = querystring.stringify(payloadForForm);
    
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
    
    // Check for address in response
    const hasAddress = response.data.responseMessage && 
      response.data.responseMessage.includes('address');
    
    console.log(hasAddress 
      ? chalk.green('✅ Address found in response message') 
      : chalk.red('❌ Address not found in response message'));
    
    // Display response source and message
    if (response.data.responseSource) {
      console.log(chalk.yellow(`\nResponse source: ${chalk.bold(response.data.responseSource)}`));
    }
    
    if (response.data.responseMessage) {
      console.log(chalk.yellow(`Response message: "${response.data.responseMessage}"`));
    }
    
    // Determine overall test result
    // For the "No Address in Business Record" test, we don't expect the response to include the word "address"
    const isNoAddressTest = testName === 'No Address in Business Record';
    const passed = statusMatch && responseMatch && (isNoAddressTest || hasAddress);
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
  console.log(chalk.bold.green('  ADDRESS RESPONSE TEST SUITE FOR /api/new-message'));
  console.log(chalk.bold.green('================================================='));
  
  if (TEST_MODE) {
    console.log(chalk.yellow('\n⚠️ Running in TEST MODE - No actual SMS will be sent'));
  }
  
  const testResults = [];
  
  // Test 1: Direct address request
  testResults.push(await runTest({
    testName: 'Direct Address Request',
    description: 'Message directly asking for address: "What is your address?"',
    to: DEFAULT_TO,
    from: DEFAULT_FROM,
    body: 'What is your address?',
    expectedResponse: {
      success: true,
      responseSource: 'address_keyword_match'
    },
    additionalPayload: {
      _testOverrides: {
        business: {
          id: 'test-business-id',
          name: 'Test Business',
          business_type: 'restaurant',
          public_phone: DEFAULT_TO,
          twilio_phone: DEFAULT_TO,
          address: '123 Test St, San Diego, CA 92101',
          owner_phone: '+15551234567',
          custom_settings: { auto_reply_enabled: true }
        }
      }
    }
  }));
  
  // Test 2: Indirect address request
  testResults.push(await runTest({
    testName: 'Indirect Address Request',
    description: 'Message indirectly asking for address: "Can you tell me your address please?"',
    to: DEFAULT_TO,
    from: DEFAULT_FROM,
    body: 'Can you tell me your address please?',
    expectedResponse: {
      success: true,
      responseSource: 'address_keyword_match'
    },
    additionalPayload: {
      _testOverrides: {
        business: {
          id: 'test-business-id',
          name: 'Test Business',
          business_type: 'restaurant',
          public_phone: DEFAULT_TO,
          twilio_phone: DEFAULT_TO,
          address: '123 Test St, San Diego, CA 92101',
          owner_phone: '+15551234567',
          custom_settings: { auto_reply_enabled: true }
        }
      }
    }
  }));
  
  // Test 3: No address in business record
  testResults.push(await runTest({
    testName: 'No Address in Business Record',
    description: 'Message asking for address but business has no address: "What is your address?"',
    to: DEFAULT_TO,
    from: DEFAULT_FROM,
    body: 'What is your address?',
    expectedResponse: {
      success: true,
      // Should fall back to OpenAI
      responseSource: 'openai'
    },
    additionalPayload: {
      _testOverrides: {
        business: {
          id: 'test-business-id',
          name: 'Test Business',
          business_type: 'restaurant',
          public_phone: DEFAULT_TO,
          twilio_phone: DEFAULT_TO,
          // No address field
          owner_phone: '+15551234567',
          custom_settings: { auto_reply_enabled: true }
        }
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
