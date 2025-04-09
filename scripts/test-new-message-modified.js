#!/usr/bin/env node

/**
 * This script tests the new-message API endpoint by simulating a Twilio webhook request.
 * 
 * Usage: node scripts/test-new-message-modified.js +18186518560 "Opening hours?"
 * 
 * Where:
 * - First argument is the Twilio phone number (To)
 * - Second argument is the message text (Body)
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

async function testNewMessageEndpoint(to, from, body) {
  try {
    console.log(`\n🔍 Testing new-message API endpoint...`);
    
    // Prepare the request payload (simulating a Twilio webhook)
    const payload = {
      To: to,
      From: from,
      Body: body
    };
    
    console.log(`Sending test request with payload:`);
    console.log(JSON.stringify(payload, null, 2));
    
    // Send the request to the API endpoint
    const response = await axios.post(
      'http://localhost:3002/api/new-message',
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`\n✅ API response (${response.status}):`);
    console.log(JSON.stringify(response.data, null, 2));
    
    // Display response based on source
    if (response.data.responseSource === 'faq') {
      console.log(`\n✅ Successfully matched FAQ: "${response.data.matchedFaq}"`);
      console.log(`Response message: "${response.data.responseMessage}"`);
    } else if (response.data.responseSource === 'openai') {
      console.log(`\n🤖 Generated AI response (no matching FAQ found)`);
      console.log(`Response message: "${response.data.responseMessage}"`);
      console.log(`Processing time: ${response.data.processingTime}ms`);
    } else if (response.data.responseSource === 'custom_fallback') {
      console.log(`\n📝 Using custom fallback message (no matching FAQ found)`);
      console.log(`Response message: "${response.data.responseMessage}"`);
    } else {
      console.log(`\n⚠️ No matching FAQ found and AI generation failed or disabled.`);
      console.log(`Fallback response: "${response.data.responseMessage}"`);
      console.log(`Response source: ${response.data.responseSource}`);
    }
    
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
  }
}

// Main function
async function main() {
  // Get arguments from command line or use defaults
  const to = process.argv[2] || DEFAULT_TO;
  const from = DEFAULT_FROM;
  const body = process.argv[3] || DEFAULT_BODY;
  
  console.log(`Testing with phone number: ${to}`);
  console.log(`Testing with message: "${body}"`);
  
  // Test the API endpoint
  await testNewMessageEndpoint(to, from, body);
}

// Execute the main function
main().catch(error => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});
