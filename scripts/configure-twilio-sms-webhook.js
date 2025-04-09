#!/usr/bin/env node

/**
 * This script configures a Twilio phone number to use the SMS auto-reply webhook.
 * 
 * Usage: node scripts/configure-twilio-sms-webhook.js +18186518560 https://your-domain.com
 * 
 * Where:
 * - First argument is the Twilio phone number to configure
 * - Second argument is the base URL of your API (without the /api/new-message path)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import twilio from 'twilio';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Default values
const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

async function configureTwilioWebhook(phoneNumber, baseUrl) {
  try {
    console.log(`\n🔍 Configuring Twilio webhook for SMS auto-reply...`);
    
    // Check if Twilio credentials are set
    const TWILIO_SID = process.env.TWILIO_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    
    if (!TWILIO_SID || !TWILIO_AUTH_TOKEN) {
      console.error("❌ Error: Twilio credentials not found in environment variables");
      console.error("Please add TWILIO_SID and TWILIO_AUTH_TOKEN to your .env.local file");
      process.exit(1);
    }
    
    // Initialize Twilio client
    const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
    
    // Find the phone number in your Twilio account
    console.log(`Looking up Twilio number: ${phoneNumber}...`);
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: phoneNumber
    });
    
    if (incomingPhoneNumbers.length === 0) {
      console.error(`❌ Error: Phone number ${phoneNumber} not found in your Twilio account`);
      process.exit(1);
    }
    
    const numberSid = incomingPhoneNumbers[0].sid;
    console.log(`Found phone number with SID: ${numberSid}`);
    
    // Construct the webhook URL
    const webhookUrl = `${baseUrl}/api/new-message`;
    console.log(`Setting SMS webhook URL to: ${webhookUrl}`);
    
    // Update the phone number configuration
    const updatedNumber = await client.incomingPhoneNumbers(numberSid).update({
      smsUrl: webhookUrl,
      smsMethod: 'POST'
    });
    
    console.log(`\n✅ Successfully configured Twilio number for SMS auto-reply!`);
    console.log(`Phone Number: ${updatedNumber.phoneNumber}`);
    console.log(`SMS Webhook URL: ${updatedNumber.smsUrl}`);
    console.log(`SMS Method: ${updatedNumber.smsMethod}`);
    
    console.log(`\n🧪 To test, send an SMS to ${updatedNumber.phoneNumber} and you should receive an auto-reply.`);
    
  } catch (error) {
    console.error('\n❌ Error configuring Twilio webhook:');
    console.error(error.message);
    
    if (error.code === 20003) {
      console.error('Error 20003: Authentication Error - Your Twilio credentials are invalid.');
    } else if (error.code === 20404) {
      console.error('Error 20404: Resource not found - The phone number SID may be incorrect.');
    } else if (error.code === 20422) {
      console.error('Error 20422: Invalid parameter - One of the parameters provided is invalid.');
    }
  }
}

// Main function
async function main() {
  // Get arguments from command line or use defaults
  const phoneNumber = process.argv[2];
  const baseUrl = process.argv[3] || DEFAULT_BASE_URL;
  
  if (!phoneNumber) {
    console.error('❌ Error: Phone number is required');
    console.error('Usage: node scripts/configure-twilio-sms-webhook.js +18186518560 https://your-domain.com');
    process.exit(1);
  }
  
  // Validate phone number
  const phoneRegex = /^\+\d{10,15}$/;
  if (!phoneRegex.test(phoneNumber)) {
    console.error('❌ Error: Phone number must be in E.164 format (e.g., +18186518560)');
    process.exit(1);
  }
  
  // Configure Twilio webhook
  await configureTwilioWebhook(phoneNumber, baseUrl);
}

// Execute the main function
main().catch(error => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});
