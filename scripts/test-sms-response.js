#!/usr/bin/env node

/**
 * Test SMS Response Functionality
 * 
 * This script tests the SMS response functionality by simulating an incoming SMS
 * to the Twilio SMS webhook endpoint.
 * 
 * Usage:
 *   - Basic test: node scripts/test-sms-response.js
 *   - Custom message: node scripts/test-sms-response.js "What are your hours?"
 *   - Custom phone: node scripts/test-sms-response.js "What are your hours?" +16193721633
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
const DEFAULT_MESSAGE = 'What are your hours?';
const DEFAULT_FROM_NUMBER = '+16193721633'; // Your test phone number
const DEFAULT_TO_NUMBER = '+18186518560'; // Malibu Country Kitchen Twilio number

// Get message and phone numbers from command line args or use defaults
const message = process.argv[2] || DEFAULT_MESSAGE;
const fromNumber = process.argv[3] || DEFAULT_FROM_NUMBER;
const toNumber = process.argv[4] || DEFAULT_TO_NUMBER;

// Determine target environment (local or production)
const isProduction = process.env.TARGET === 'prod';
const baseUrl = isProduction 
  ? (process.env.WEBHOOK_BASE_URL || 'https://api.getsmarttext.com')
  : 'http://localhost:3000';

/**
 * Test the SMS response functionality
 */
async function testSmsResponse() {
  const endpoint = `${baseUrl}/api/twilio/sms`;
  
  // Prepare the webhook payload
  const formData = new URLSearchParams();
  formData.append('Body', message);
  formData.append('From', fromNumber);
  formData.append('To', toNumber);
  formData.append('MessageSid', 'SM' + Math.random().toString(36).substring(2, 15));
  
  console.log(chalk.blue('🔍 Testing SMS Response Functionality'));
  console.log(chalk.gray('-----------------------------------'));
  console.log(chalk.cyan('Target:'), isProduction ? 'Production' : 'Local Development');
  console.log(chalk.cyan('Endpoint:'), endpoint);
  console.log(chalk.cyan('From:'), fromNumber);
  console.log(chalk.cyan('To:'), toNumber);
  console.log(chalk.cyan('Message:'), message);
  console.log(chalk.gray('-----------------------------------'));
  console.log(chalk.yellow('📤 Sending request...'));
  
  try {
    const startTime = Date.now();
    const response = await axios.post(endpoint, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const duration = Date.now() - startTime;
    
    console.log(chalk.green('✅ Request successful!'));
    console.log(chalk.cyan('Status:'), response.status);
    console.log(chalk.cyan('Response time:'), `${duration}ms`);
    
    // Parse the TwiML response to extract the message
    const twimlResponse = response.data;
    console.log(chalk.green('📝 TwiML Response:'));
    console.log(chalk.gray('-----------------------------------'));
    console.log(twimlResponse);
    console.log(chalk.gray('-----------------------------------'));
    
    // Extract the message from the TwiML response
    const messageMatch = twimlResponse.match(/<Message>(.*?)<\/Message>/);
    if (messageMatch && messageMatch[1]) {
      console.log(chalk.green('✅ Response message:'));
      console.log(chalk.cyan(messageMatch[1]));
    } else {
      console.log(chalk.yellow('⚠️ Could not extract message from TwiML response'));
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
testSmsResponse()
  .then(() => {
    console.log(chalk.green('✨ Test completed successfully!'));
  })
  .catch(() => {
    console.log(chalk.red('❌ Test failed'));
    process.exit(1);
  });
