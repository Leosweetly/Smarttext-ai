#!/usr/bin/env node

/**
 * Test Custom Auto-Text Message
 * 
 * This script tests the custom auto-text message functionality by:
 * 1. Setting a custom auto-text message for a test business
 * 2. Simulating a missed call to trigger the auto-text
 * 
 * Usage:
 *   - Basic test: node scripts/test-custom-autotext.js
 *   - Custom message: node scripts/test-custom-autotext.js "Your custom message here"
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Constants
const DEFAULT_CUSTOM_MESSAGE = "Hey there! Thanks for calling Malibu Country Kitchen. We're sorry we missed your call. How can we help you today?";
const TEST_BUSINESS_ID = 'test-business-id'; // Replace with your test business ID if needed
const TEST_BUSINESS_PHONE = '+18186518560'; // Malibu Country Kitchen Twilio number
const CALLER_NUMBER = '+16193721633'; // Your test phone number

// Get custom message from command line args or use default
const customMessage = process.argv[2] || DEFAULT_CUSTOM_MESSAGE;

// Determine target environment (local or production)
const isProduction = process.env.TARGET === 'prod';
const baseUrl = isProduction 
  ? (process.env.WEBHOOK_BASE_URL || 'https://api.getsmarttext.com')
  : 'http://localhost:3000';

/**
 * Set a custom auto-text message for the test business
 */
async function setCustomAutoTextMessage() {
  const endpoint = `${baseUrl}/api/update-business-info`;
  
  // Prepare the request payload
  const payload = {
    name: 'Malibu Country Kitchen',
    phoneNumber: TEST_BUSINESS_PHONE,
    industry: 'restaurant',
    hoursJson: JSON.stringify({
      Monday: '9:00 AM - 9:00 PM',
      Tuesday: '9:00 AM - 9:00 PM',
      Wednesday: '9:00 AM - 9:00 PM',
      Thursday: '9:00 AM - 9:00 PM',
      Friday: '9:00 AM - 10:00 PM',
      Saturday: '9:00 AM - 10:00 PM',
      Sunday: '9:00 AM - 9:00 PM'
    }),
    recordId: TEST_BUSINESS_ID,
    customAutoTextMessage: customMessage
  };
  
  console.log(chalk.blue('🔧 Setting Custom Auto-Text Message'));
  console.log(chalk.gray('-----------------------------------'));
  console.log(chalk.cyan('Target:'), isProduction ? 'Production' : 'Local Development');
  console.log(chalk.cyan('Endpoint:'), endpoint);
  console.log(chalk.cyan('Business:'), 'Malibu Country Kitchen');
  console.log(chalk.cyan('Phone:'), TEST_BUSINESS_PHONE);
  console.log(chalk.cyan('Custom Message:'), customMessage);
  console.log(chalk.gray('-----------------------------------'));
  console.log(chalk.yellow('📤 Sending request...'));
  
  try {
    const response = await axios.post(endpoint, payload);
    
    console.log(chalk.green('✅ Custom auto-text message set successfully!'));
    console.log(chalk.cyan('Status:'), response.status);
    console.log(chalk.cyan('Response:'), response.data);
    
    return true;
  } catch (error) {
    console.log(chalk.red('❌ Failed to set custom auto-text message!'));
    
    if (error.response) {
      console.log(chalk.red('Status:'), error.response.status);
      console.log(chalk.red('Response:'), error.response.data);
    } else if (error.request) {
      console.log(chalk.red('No response received from server'));
    } else {
      console.log(chalk.red('Error:'), error.message);
    }
    
    return false;
  }
}

/**
 * Simulate a missed call to trigger the auto-text
 */
async function simulateMissedCall() {
  const endpoint = `${baseUrl}/api/missed-call`;
  
  // Prepare the webhook payload
  const formData = new URLSearchParams();
  formData.append('From', CALLER_NUMBER);
  formData.append('To', TEST_BUSINESS_PHONE);
  formData.append('CallStatus', 'no-answer');
  formData.append('CallSid', 'CA' + Math.random().toString(36).substring(2, 15));
  formData.append('ConnectDuration', '0'); // Ensure it's treated as a missed call
  
  console.log(chalk.blue('📱 Simulating Missed Call'));
  console.log(chalk.gray('-----------------------------------'));
  console.log(chalk.cyan('Target:'), isProduction ? 'Production' : 'Local Development');
  console.log(chalk.cyan('Endpoint:'), endpoint);
  console.log(chalk.cyan('From:'), CALLER_NUMBER);
  console.log(chalk.cyan('To:'), TEST_BUSINESS_PHONE);
  console.log(chalk.gray('-----------------------------------'));
  console.log(chalk.yellow('📤 Sending request...'));
  
  try {
    const response = await axios.post(endpoint, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log(chalk.green('✅ Missed call simulation successful!'));
    console.log(chalk.cyan('Status:'), response.status);
    console.log(chalk.cyan('Response:'), response.data);
    
    console.log(chalk.green('\n📱 Check your phone for the auto-text message!'));
    console.log(chalk.cyan('The message should match your custom message:'));
    console.log(chalk.cyan(`"${customMessage}"`));
    
    return true;
  } catch (error) {
    console.log(chalk.red('❌ Failed to simulate missed call!'));
    
    if (error.response) {
      console.log(chalk.red('Status:'), error.response.status);
      console.log(chalk.red('Response:'), error.response.data);
    } else if (error.request) {
      console.log(chalk.red('No response received from server'));
    } else {
      console.log(chalk.red('Error:'), error.message);
    }
    
    return false;
  }
}

/**
 * Run the test
 */
async function runTest() {
  console.log(chalk.blue.bold('\n🔍 Testing Custom Auto-Text Message Functionality\n'));
  
  // Step 1: Set the custom auto-text message
  const messageSet = await setCustomAutoTextMessage();
  if (!messageSet) {
    console.log(chalk.red('❌ Test failed: Could not set custom auto-text message'));
    return;
  }
  
  // Step 2: Simulate a missed call to trigger the auto-text
  const callSimulated = await simulateMissedCall();
  if (!callSimulated) {
    console.log(chalk.red('❌ Test failed: Could not simulate missed call'));
    return;
  }
  
  console.log(chalk.green.bold('\n✅ Test completed successfully!'));
  console.log(chalk.cyan('Check your phone for the auto-text message. It should arrive shortly.'));
  console.log(chalk.cyan('The message should match your custom message:'));
  console.log(chalk.cyan(`"${customMessage}"`));
}

// Execute the test
runTest()
  .then(() => {
    console.log(chalk.green('\n✨ Test script execution completed!'));
  })
  .catch((error) => {
    console.error(chalk.red('\n❌ Unhandled error:'), error);
    process.exit(1);
  });
