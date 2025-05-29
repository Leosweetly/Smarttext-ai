#!/usr/bin/env node

/**
 * This script tests the auto-text functionality for Malibu Country Kitchen
 * by directly calling the missed-call endpoint.
 * 
 * Usage: node scripts/test-malibu-autotext.js [test-type]
 * 
 * Where test-type can be:
 * - "missed-call" (default): Test the missed call auto-text
 * - "faq": Test the FAQ response functionality
 */

import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Phone numbers for Malibu Country Kitchen test
const CALLER_NUMBER = '+16193721633'; // Update this with your actual phone number
const MALIBU_TWILIO_NUMBER = '+18186518560'; // Malibu Country Kitchen Twilio number

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Test the missed call auto-text functionality
 */
async function testMissedCallAutotext() {
  try {
    console.log(`\n🔍 Testing Malibu Country Kitchen missed call auto-text...`);
    console.log(`Simulating missed call from ${CALLER_NUMBER} to ${MALIBU_TWILIO_NUMBER}`);
    
    // Create URL-encoded form data for the request
    const formData = new URLSearchParams();
    formData.append('From', CALLER_NUMBER);
    formData.append('To', MALIBU_TWILIO_NUMBER);
    formData.append('CallStatus', 'no-answer');
    formData.append('CallSid', 'CA' + Math.random().toString(36).substring(2, 15));
    formData.append('ConnectDuration', '0'); // Ensure it's treated as a missed call
    
    // Get the API base URL from environment or use default
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const missedCallUrl = `${apiBaseUrl}/api/missed-call`;
    
    console.log(`Sending request to: ${missedCallUrl}`);
    
    // Make the request to the missed-call endpoint
    const response = await axios.post(missedCallUrl, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    // Check the response
    if (response.status === 200) {
      console.log('\n✅ Malibu Country Kitchen auto-text test successful!');
      console.log('Response data:', response.data);
      console.log('\nCheck your phone for the text message. It should arrive shortly.');
      console.log('\nThe message should follow this format:');
      console.log('Hey! Thanks for calling Malibu Country Kitchen, sorry we missed your call. Were you calling about [business-type-specific topics]?');
    } else {
      console.error('\n❌ Malibu Country Kitchen auto-text test failed:');
      console.error(response.data);
    }
    
  } catch (error) {
    console.error('\n❌ Error testing Malibu Country Kitchen auto-text:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server. Is the server running?');
    } else {
      console.error('Error message:', error.message);
    }
  }
}

/**
 * Test the FAQ response functionality
 */
async function testFaqResponse() {
  try {
    console.log(`\n🔍 Testing Malibu Country Kitchen FAQ response...`);
    
    // Prompt the user for a question
    rl.question('Enter a question to test (e.g., "What are your hours?"): ', async (question) => {
      console.log(`Testing question: "${question}"`);
      
      // Get the business data from the mock implementation
      const { getBusinessByPhoneNumberSupabase } = await import('../lib/api-compat.js');
      const business = await getBusinessByPhoneNumberSupabase(MALIBU_TWILIO_NUMBER);
      
      // Use the handleIncomingSms function to get a response
      const { handleIncomingSms } = await import('../lib/openai.js');
      const response = await handleIncomingSms(question, business);
      
      console.log('\n✅ FAQ response generated:');
      console.log(`"${response}"`);
      
      rl.close();
    });
  } catch (error) {
    console.error('\n❌ Error testing FAQ response:', error);
    rl.close();
  }
}

// Main function to determine which test to run
async function main() {
  const testType = process.argv[2] || 'missed-call';
  
  if (testType === 'faq') {
    await testFaqResponse();
  } else {
    await testMissedCallAutotext();
    rl.close();
  }
}

// Execute the main function
main().catch(error => {
  console.error('\n❌ Unhandled error:', error);
  rl.close();
});
