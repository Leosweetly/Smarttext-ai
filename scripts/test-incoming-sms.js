#!/usr/bin/env node

/**
 * Test Incoming SMS Webhook
 * 
 * This script simulates an incoming SMS webhook from Twilio to test the new-message endpoint.
 * It also verifies that the test business exists in Airtable and creates it if needed.
 * 
 * Usage:
 *   - Local testing: node scripts/test-incoming-sms.js
 *   - Production testing: TARGET=prod node scripts/test-incoming-sms.js
 *   - Custom phone number: node scripts/test-incoming-sms.js +16193721633
 *   - Custom sender: SENDER=+15551234567 node scripts/test-incoming-sms.js
 *   - Custom message: MESSAGE="Hello world" node scripts/test-incoming-sms.js
 * 
 * The script will send a POST request to the new-message webhook endpoint with a simulated
 * Twilio payload and display the response.
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { getTable } from '../lib/data/airtable-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Determine target environment (local or production)
const isProduction = process.env.TARGET === 'prod';
const baseUrl = isProduction 
  ? (process.env.WEBHOOK_BASE_URL || 'https://api.getsmarttext.com')
  : 'http://localhost:3000';

// Constants for test business
const TEST_BUSINESS_PHONE = '+16193721633';
const TEST_BUSINESS_NAME = 'Test Business';
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || '+18186518560';

// Get business phone number from command line args or use default test business
const businessPhone = process.argv[2] || TEST_BUSINESS_PHONE;

// Get sender phone number from env var or use Twilio number
const senderPhone = process.env.SENDER || TWILIO_PHONE;

// Get message text from env var or use default
const messageText = process.env.MESSAGE || 'Hello, I want to book an appointment!';

// Track if we created a new business record
let businessCreated = false;

// Generate a random MessageSid
const generateMessageSid = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'SM';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Verify that the test business exists in Airtable and create it if needed
 */
async function verifyTestBusiness() {
  console.log(chalk.blue('🔍 Verifying test business in Airtable...'));
  
  try {
    // Get the Businesses table
    const table = getTable('Businesses');
    
    // Check if the business already exists
    const records = await table.select({
      filterByFormula: `{Phone Number} = "${businessPhone}"`,
      maxRecords: 1
    }).firstPage();
    
    if (records.length > 0) {
      const business = records[0];
      console.log(chalk.green(`🧩 Found test record in Airtable (${business.get('Business Name')}) ✅`));
      return business;
    }
    
    // Business doesn't exist, create it
    console.log(chalk.yellow(`⚠️ Test business not found in Airtable. Creating...`));
    
    const newBusiness = await table.create({
      'Business Name': TEST_BUSINESS_NAME,
      'Phone Number': businessPhone,
      'Test Record': true,
      'Business Type': 'restaurant',
      'Auto-Reply Enabled': true,
      'FAQs': JSON.stringify([
        { question: "What are your hours?", answer: "We're open 9am-5pm Monday to Friday." },
        { question: "Do you deliver?", answer: "Yes, we offer delivery within 5 miles." }
      ])
    });
    
    businessCreated = true;
    console.log(chalk.green(`✅ Test business record created in Airtable: ${TEST_BUSINESS_NAME} (${businessPhone})`));
    return newBusiness;
  } catch (error) {
    console.log(chalk.red('❌ Error verifying test business:'), error.message);
    console.log(chalk.yellow('⚠️ Continuing with test anyway...'));
    return null;
  }
}

async function testIncomingSms() {
  // First verify the test business exists
  await verifyTestBusiness();
  
  const endpoint = `${baseUrl}/api/new-message?testMode=true`;
  const messageSid = generateMessageSid();
  
  // Prepare the webhook payload
  const payload = {
    To: businessPhone,
    From: senderPhone,
    Body: messageText,
    MessageSid: messageSid,
    NumMedia: '0',
    NumSegments: '1',
    // Add test mode parameters to bypass business lookup
    _testOverrides: {
      testMode: true
    },
    testMode: true
  };
  
  console.log(chalk.blue('🔍 Test Incoming SMS Webhook'));
  console.log(chalk.gray('-----------------------------------'));
  console.log(chalk.cyan('Target:'), isProduction ? 'Production' : 'Local Development');
  console.log(chalk.cyan('Endpoint:'), endpoint);
  console.log(chalk.cyan('Business Number:'), businessPhone);
  console.log(chalk.cyan('Sender Number:'), senderPhone);
  console.log(chalk.cyan('Message:'), messageText);
  console.log(chalk.cyan('Message SID:'), messageSid);
  if (businessCreated) {
    console.log(chalk.green('✨ Auto-created test record for clean test run'));
  }
  console.log(chalk.gray('-----------------------------------'));
  console.log(chalk.yellow('📤 Sending request...'));
  
  try {
    const startTime = Date.now();
    const response = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const duration = Date.now() - startTime;
    
    console.log(chalk.green('✅ Request successful!'));
    console.log(chalk.cyan('Status:'), response.status);
    console.log(chalk.cyan('Response time:'), `${duration}ms`);
    
    // Pretty print the response data
    console.log(chalk.green('📝 Response:'));
    console.log(chalk.gray('-----------------------------------'));
    console.log(JSON.stringify(response.data, null, 2));
    console.log(chalk.gray('-----------------------------------'));
    
    // Check if auto-reply was sent
    if (response.data.success && response.data.messageSid) {
      console.log(chalk.green('✅ Auto-reply SMS was sent!'));
      console.log(chalk.cyan('Message SID:'), response.data.messageSid);
      console.log(chalk.cyan('Response message:'), response.data.responseMessage);
    }
    
    return response.data;
  } catch (error) {
    console.log(chalk.red('❌ Request failed!'));
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(chalk.red('Status:'), error.response.status);
      console.log(chalk.red('Response:'), error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.log(chalk.red('No response received from server'));
      console.log(chalk.red('Request:'), error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log(chalk.red('Error:'), error.message);
    }
    
    console.log(chalk.yellow('💡 Tip: Make sure your server is running if testing locally'));
    
    throw error;
  }
}

// Execute the test
testIncomingSms()
  .then(() => {
    console.log(chalk.green('✨ Test completed successfully!'));
  })
  .catch(() => {
    console.log(chalk.red('❌ Test failed'));
    process.exit(1);
  });
