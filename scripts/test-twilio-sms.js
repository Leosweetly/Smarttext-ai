#!/usr/bin/env node

/**
 * This script tests sending an SMS directly using the Twilio API.
 * 
 * Usage: node scripts/test-twilio-sms.js +16193721633
 * 
 * Where:
 * - First argument is the recipient's phone number
 */

const dotenv = require('dotenv');
const path = require('path');
const twilio = require('twilio');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Default recipient phone number
const DEFAULT_TO = '+16193721633'; // Your phone number

async function testTwilioSms(toNumber) {
  try {
    console.log(`\n🔍 Testing Twilio SMS functionality...`);
    
    // Check if Twilio credentials are set
    const TWILIO_SID = process.env.TWILIO_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_SMARTTEXT_NUMBER = process.env.TWILIO_SMARTTEXT_NUMBER;
    
    if (!TWILIO_SID || !TWILIO_AUTH_TOKEN) {
      console.error("❌ Error: Twilio credentials not found in environment variables");
      console.error("Please add TWILIO_SID and TWILIO_AUTH_TOKEN to your .env.local file");
      process.exit(1);
    }
    
    if (!TWILIO_SMARTTEXT_NUMBER) {
      console.error("❌ Error: TWILIO_SMARTTEXT_NUMBER not found in environment variables");
      console.error("Please add TWILIO_SMARTTEXT_NUMBER to your .env.local file");
      process.exit(1);
    }
    
    // Initialize Twilio client
    const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
    
    console.log(`Sending test SMS from ${TWILIO_SMARTTEXT_NUMBER} to ${toNumber}...`);
    
    // Send the test message
    const message = await client.messages.create({
      body: 'This is a test message from SmartText AI. If you receive this, the Twilio SMS functionality is working correctly.',
      from: TWILIO_SMARTTEXT_NUMBER,
      to: toNumber
    });
    
    console.log(`\n✅ Test message sent successfully!`);
    console.log(`Message SID: ${message.sid}`);
    console.log(`Status: ${message.status}`);
    console.log(`Check your phone for the test message. It should arrive shortly.`);
    
  } catch (error) {
    console.error('\n❌ Error sending test message:');
    console.error(error.message);
    
    if (error.code === 21608) {
      console.error('Error 21608: The "From" phone number provided is not a valid, SMS-capable Twilio phone number.');
    } else if (error.code === 21211) {
      console.error('Error 21211: The "To" phone number is not a valid phone number.');
    } else if (error.code === 20003) {
      console.error('Error 20003: Authentication Error - Your Twilio credentials are invalid.');
    }
  }
}

// Main function
async function main() {
  // Get recipient phone number from command line arguments or use default
  const toNumber = process.argv[2] || DEFAULT_TO;
  
  // Validate phone number
  const phoneRegex = /^\+\d{10,15}$/;
  if (!phoneRegex.test(toNumber)) {
    console.error('❌ Error: Phone number must be in E.164 format (e.g., +16193721633)');
    console.error(`To: ${toNumber}`);
    process.exit(1);
  }
  
  // Test Twilio SMS
  await testTwilioSms(toNumber);
}

// Execute the main function
main().catch(error => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});
