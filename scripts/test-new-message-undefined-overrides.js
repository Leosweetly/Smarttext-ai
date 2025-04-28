#!/usr/bin/env node

/**
 * This script tests the new-message API endpoint with undefined _testOverrides
 * to verify the fix for the crash when _testOverrides is undefined.
 * 
 * Usage: node scripts/test-new-message-undefined-overrides.js
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
const DEFAULT_BODY = 'What are your hours?'; // Message text

async function testWithUndefinedOverrides() {
  try {
    console.log(`\n🔍 Testing new-message API endpoint with undefined _testOverrides...`);
    
    // Prepare the request payload with explicitly undefined _testOverrides
    const payload = {
      To: DEFAULT_TO,
      From: DEFAULT_FROM,
      Body: DEFAULT_BODY,
      _testOverrides: undefined
    };
    
    console.log(`Sending test request with payload:`);
    console.log(JSON.stringify({
      To: payload.To,
      From: payload.From,
      Body: payload.Body,
      _testOverrides: 'undefined (explicitly set to undefined)'
    }, null, 2));
    
    // Send the request to the API endpoint
    const response = await axios.post(
      'http://localhost:3000/api/new-message',
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`\n✅ API response (${response.status}):`);
    console.log(JSON.stringify(response.data, null, 2));
    console.log(`\n✅ SUCCESS: The API handled undefined _testOverrides correctly!`);
    
    return true;
  } catch (error) {
    console.error('\n❌ Error testing API endpoint:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server. Is the Next.js server running?');
      console.error('Try running "npm run dev" in another terminal window.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    return false;
  }
}

async function testWithNullOverrides() {
  try {
    console.log(`\n🔍 Testing new-message API endpoint with null _testOverrides...`);
    
    // Prepare the request payload with null _testOverrides
    const payload = {
      To: DEFAULT_TO,
      From: DEFAULT_FROM,
      Body: DEFAULT_BODY,
      _testOverrides: null
    };
    
    console.log(`Sending test request with payload:`);
    console.log(JSON.stringify({
      To: payload.To,
      From: payload.From,
      Body: payload.Body,
      _testOverrides: 'null (explicitly set to null)'
    }, null, 2));
    
    // Send the request to the API endpoint
    const response = await axios.post(
      'http://localhost:3000/api/new-message',
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`\n✅ API response (${response.status}):`);
    console.log(JSON.stringify(response.data, null, 2));
    console.log(`\n✅ SUCCESS: The API handled null _testOverrides correctly!`);
    
    return true;
  } catch (error) {
    console.error('\n❌ Error testing API endpoint:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server. Is the Next.js server running?');
      console.error('Try running "npm run dev" in another terminal window.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    return false;
  }
}

// Main function
async function main() {
  console.log(`\n🧪 TESTING FIX FOR UNDEFINED _testOverrides CRASH`);
  console.log(`=================================================`);
  
  let undefinedTest = await testWithUndefinedOverrides();
  let nullTest = await testWithNullOverrides();
  
  if (undefinedTest && nullTest) {
    console.log(`\n✅ ALL TESTS PASSED: The API now correctly handles undefined and null _testOverrides!`);
  } else {
    console.log(`\n❌ SOME TESTS FAILED: Please check the logs above for details.`);
    process.exit(1);
  }
}

// Execute the main function
main().catch(error => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});
