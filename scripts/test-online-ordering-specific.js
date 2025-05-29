#!/usr/bin/env node

/**
 * Specific test script for the online ordering URL detection in /api/new-message
 * 
 * This script specifically tests the online ordering URL detection logic
 * by sending a direct request to the API endpoint with the necessary test overrides.
 * 
 * Usage: node scripts/test-online-ordering-specific.js
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

console.log(chalk.bold.green('\n================================================='));
console.log(chalk.bold.green('  ONLINE ORDERING URL DETECTION SPECIFIC TEST'));
console.log(chalk.bold.green('================================================='));

async function testOnlineOrderingDetection() {
  // Test payload with online ordering URL
  const payload = {
    To: DEFAULT_TO,
    From: DEFAULT_FROM,
    Body: "I want to place an order",
    _testOverrides: {
      businessType: 'restaurant',
      online_ordering_url: 'https://order.testrestaurant.com'
    },
    testMode: true,
    disableOpenAI: true // Disable OpenAI to ensure we're testing the direct detection
  };
  
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
      timeout: 10000 // 10 second timeout
    });
    
    console.log(chalk.yellow(`\nResponse status: ${response.status}`));
    console.log(chalk.yellow('Response body:'));
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if the response contains the online ordering URL
    const hasOnlineOrderingUrl = response.data.responseMessage && 
      response.data.responseMessage.includes('https://order.testrestaurant.com');
    
    // Check if the response source is 'online_ordering_direct'
    const isOnlineOrderingDirect = response.data.responseSource === 'online_ordering_direct';
    
    // Check if the onlineOrderingRequest flag is set
    const hasOnlineOrderingFlag = response.data.onlineOrderingRequest === true;
    
    console.log(chalk.cyan('\nTest results:'));
    console.log(`Response contains online ordering URL: ${hasOnlineOrderingUrl ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`Response source is 'online_ordering_direct': ${isOnlineOrderingDirect ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`Response has onlineOrderingRequest flag: ${hasOnlineOrderingFlag ? chalk.green('Yes') : chalk.red('No')}`);
    
    const passed = hasOnlineOrderingUrl && isOnlineOrderingDirect && hasOnlineOrderingFlag;
    console.log(passed ? chalk.green('\n✅ TEST PASSED') : chalk.red('\n❌ TEST FAILED'));
    
    return passed;
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
    
    return false;
  }
}

// Run the test
testOnlineOrderingDetection().then(passed => {
  console.log(chalk.bold.green('\n================================================='));
  console.log(chalk.bold.green(`Test ${passed ? 'PASSED' : 'FAILED'}`));
  console.log(chalk.bold.green('================================================='));
  
  if (!passed) {
    process.exit(1);
  }
});
