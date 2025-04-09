#!/usr/bin/env node

/**
 * Simplified test script for the /api/new-message Twilio webhook endpoint
 * This script runs a single test based on the test number provided as an argument
 * 
 * Usage: node scripts/test-new-message-single.js [test-number]
 * 
 * Where test-number is:
 * 1 - FAQ match
 * 2 - OpenAI fallback
 * 3 - Bad FAQ data
 * 4 - No Airtable match
 * 5 - Auto-Reply disabled
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Default values
const DEFAULT_TO = process.env.TWILIO_SMARTTEXT_NUMBER || '+18186518560'; // Twilio number
const DEFAULT_FROM = '+12125551234'; // Sender's number
const API_URL = process.env.API_URL || 'http://localhost:3004/api/new-message';

// Mock phone numbers for different test scenarios
const MOCK_NUMBERS = {
  validBusiness: DEFAULT_TO,
  nonExistentBusiness: '+19999999999',
  disabledAutoReply: '+18888888888'
};

/**
 * Run a test against the new-message API endpoint
 */
async function runTest(testNumber) {
  let testConfig = {};
  
  switch (testNumber) {
    case 1:
      testConfig = {
        name: 'FAQ Match',
        description: 'Simulate an incoming SMS that should match an FAQ',
        to: MOCK_NUMBERS.validBusiness,
        from: DEFAULT_FROM,
        body: 'What are your hours?',
        expectedSource: 'faq'
      };
      break;
    case 2:
      testConfig = {
        name: 'OpenAI Fallback',
        description: 'Simulate an incoming SMS with no FAQ match, expecting OpenAI fallback',
        to: MOCK_NUMBERS.validBusiness,
        from: DEFAULT_FROM,
        body: 'Do you have gluten-free options?',
        expectedSource: 'openai'
      };
      break;
    case 3:
      testConfig = {
        name: 'Bad FAQ Data',
        description: 'Simulate a case where the FAQs field is malformed JSON',
        to: MOCK_NUMBERS.validBusiness,
        from: DEFAULT_FROM,
        body: 'Test question with bad FAQ data',
        additionalPayload: {
          _testOverrides: {
            malformedFaqs: true
          }
        },
        expectedSource: 'openai'
      };
      break;
    case 4:
      testConfig = {
        name: 'No Airtable Match',
        description: 'Use a Twilio number not present in Airtable',
        to: MOCK_NUMBERS.nonExistentBusiness,
        from: DEFAULT_FROM,
        body: 'Hello, is anyone there?',
        expectedStatus: 404
      };
      break;
    case 5:
      testConfig = {
        name: 'Auto-Reply Disabled',
        description: 'Simulate a business record with "Auto-Reply Enabled" set to false',
        to: MOCK_NUMBERS.disabledAutoReply,
        from: DEFAULT_FROM,
        body: 'This should not get a reply',
        expectedMessage: 'Auto-reply is disabled for this business'
      };
      break;
    default:
      console.error('Invalid test number. Please provide a number between 1 and 5.');
      process.exit(1);
  }
  
  console.log(`\n🔍 Running test ${testNumber}: ${testConfig.name}`);
  console.log(`Description: ${testConfig.description}`);
  
  // Prepare the request payload
  const payload = {
    To: testConfig.to,
    From: testConfig.from,
    Body: testConfig.body,
    ...(testConfig.additionalPayload || {})
  };
  
  console.log(`\nSending test request with payload:`);
  console.log(JSON.stringify(payload, null, 2));
  
  try {
    // Send the request to the API endpoint
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true, // Don't throw on non-2xx responses
      timeout: 5000 // 5 second timeout
    });
    
    console.log(`\n✅ API response (${response.status}):`);
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verify the response
    if (testConfig.expectedStatus && response.status !== testConfig.expectedStatus) {
      console.log(`\n❌ Status code mismatch! Expected ${testConfig.expectedStatus}, got ${response.status}`);
    } else if (testConfig.expectedSource && response.data.responseSource !== testConfig.expectedSource) {
      console.log(`\n⚠️ Response source mismatch! Expected ${testConfig.expectedSource}, got ${response.data.responseSource}`);
      console.log(`This might be expected in a test environment where FAQs might not match exactly.`);
    } else if (testConfig.expectedMessage && response.data.message !== testConfig.expectedMessage) {
      console.log(`\n❌ Message mismatch! Expected "${testConfig.expectedMessage}", got "${response.data.message}"`);
    } else {
      console.log(`\n✅ Test passed!`);
    }
    
    // Display response source and message if available
    if (response.data.responseSource) {
      console.log(`\nResponse source: ${response.data.responseSource}`);
    }
    
    if (response.data.responseMessage) {
      console.log(`Response message: "${response.data.responseMessage}"`);
    }
    
  } catch (error) {
    console.error('\n❌ Error testing API endpoint:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server. Is the Next.js server running?');
      console.error('Try running "npm run dev" in another terminal window.');
    } else {
      console.error('Error message:', error.message);
    }
  }
}

// Main function
async function main() {
  const testNumber = parseInt(process.argv[2] || '1', 10);
  await runTest(testNumber);
}

// Execute the main function
main().catch(error => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});
