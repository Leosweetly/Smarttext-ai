#!/usr/bin/env node

/**
 * Debug script for the online ordering URL detection in /api/new-message
 * 
 * This script provides detailed debugging information about the online ordering URL detection logic
 * by sending a direct request to the API endpoint with the necessary test overrides and analyzing the response.
 * 
 * Usage: node scripts/test-online-ordering-debug.js
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
console.log(chalk.bold.green('  ONLINE ORDERING URL DETECTION DEBUG TEST'));
console.log(chalk.bold.green('================================================='));

// Local test function to verify our logic
function testLocalDetection(messageBody, onlineOrderingUrl) {
  console.log(chalk.cyan('\n----- LOCAL DETECTION TEST -----'));
  
  // Check if message contains ordering keywords
  const matchResult = messageBody.toLowerCase().match(/order|ordering|place an order/);
  const containsOrderingKeywords = matchResult !== null;
  
  // Determine if this is an online ordering request
  const isOnlineOrderingRequest = onlineOrderingUrl && containsOrderingKeywords;
  
  console.log('Message:', messageBody);
  console.log('Online ordering URL:', onlineOrderingUrl);
  console.log('Match result:', matchResult);
  console.log('Contains ordering keywords:', containsOrderingKeywords);
  console.log('Is online ordering request:', isOnlineOrderingRequest);
  
  return {
    matchResult,
    containsOrderingKeywords,
    isOnlineOrderingRequest
  };
}

async function testApiDetection() {
  // Test message
  const messageBody = "I want to place an order";
  const onlineOrderingUrl = "https://order.testrestaurant.com";
  
  // Run local test first
  const localResult = testLocalDetection(messageBody, onlineOrderingUrl);
  
  // Test payload with online ordering URL
  const payload = {
    To: DEFAULT_TO,
    From: DEFAULT_FROM,
    Body: messageBody,
    _testOverrides: {
      businessType: 'restaurant',
      online_ordering_url: onlineOrderingUrl
    },
    testMode: true,
    debug: true, // Request additional debugging information
    disableOpenAI: true // Disable OpenAI to ensure we're testing the direct detection
  };
  
  console.log(chalk.cyan('\n----- API REQUEST -----'));
  console.log('Request payload:');
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
    
    console.log(chalk.cyan('\n----- API RESPONSE -----'));
    console.log('Response status:', response.status);
    console.log('Response body:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if the response contains the online ordering URL
    const hasOnlineOrderingUrl = response.data.responseMessage && 
      response.data.responseMessage.includes(onlineOrderingUrl);
    
    // Check if the response source is 'online_ordering_direct'
    const isOnlineOrderingDirect = response.data.responseSource === 'online_ordering_direct';
    
    // Check if the onlineOrderingRequest flag is set
    const hasOnlineOrderingFlag = response.data.onlineOrderingRequest === true;
    
    console.log(chalk.cyan('\n----- COMPARISON -----'));
    console.log('LOCAL: Is online ordering request:', localResult.isOnlineOrderingRequest);
    console.log('API: Response contains online ordering URL:', hasOnlineOrderingUrl);
    console.log('API: Response source is "online_ordering_direct":', isOnlineOrderingDirect);
    console.log('API: Has onlineOrderingRequest flag:', hasOnlineOrderingFlag);
    
    const passed = hasOnlineOrderingUrl && isOnlineOrderingDirect && hasOnlineOrderingFlag;
    console.log(chalk.cyan('\n----- RESULT -----'));
    console.log(passed ? chalk.green('✅ TEST PASSED') : chalk.red('❌ TEST FAILED'));
    
    if (!passed) {
      console.log(chalk.yellow('\n----- POSSIBLE ISSUES -----'));
      if (!hasOnlineOrderingUrl) {
        console.log('- The response message does not contain the online ordering URL');
        console.log('  This suggests the online ordering detection logic is not being triggered');
      }
      if (!isOnlineOrderingDirect) {
        console.log('- The response source is not "online_ordering_direct"');
        console.log('  This suggests the online ordering detection logic is not setting the correct source');
      }
      if (!hasOnlineOrderingFlag) {
        console.log('- The onlineOrderingRequest flag is not set');
        console.log('  This suggests the online ordering detection logic is not setting the flag');
      }
      
      console.log(chalk.yellow('\n----- TROUBLESHOOTING STEPS -----'));
      console.log('1. Verify the test overrides are being applied correctly');
      console.log('2. Check if the regex matching is working correctly');
      console.log('3. Ensure the online ordering URL is being set correctly in the business object');
      console.log('4. Check if the online ordering detection logic is being executed');
      console.log('5. Verify the response is being constructed correctly');
    }
    
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
testApiDetection().then(passed => {
  console.log(chalk.bold.green('\n================================================='));
  console.log(chalk.bold.green(`Test ${passed ? 'PASSED' : 'FAILED'}`));
  console.log(chalk.bold.green('================================================='));
  
  if (!passed) {
    process.exit(1);
  }
});
