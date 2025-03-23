#!/usr/bin/env node

/**
 * This script lists all Twilio phone numbers in your account
 * and their configuration details.
 * 
 * Usage: node scripts/list-twilio-numbers.js
 */

const dotenv = require('dotenv');
const path = require('path');
const twilio = require('twilio');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function listTwilioNumbers() {
  try {
    console.log('\n📱 Listing Twilio phone numbers in your account...');
    
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
    
    // Get all incoming phone numbers
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list();
    
    if (incomingPhoneNumbers.length === 0) {
      console.log('No phone numbers found in your Twilio account.');
      return;
    }
    
    console.log(`Found ${incomingPhoneNumbers.length} phone numbers in your Twilio account:\n`);
    
    // Display each phone number and its configuration
    incomingPhoneNumbers.forEach((number, index) => {
      console.log(`📞 Phone Number ${index + 1}: ${number.phoneNumber}`);
      console.log(`   Friendly Name: ${number.friendlyName}`);
      console.log(`   SID: ${number.sid}`);
      console.log(`   SMS URL: ${number.smsUrl || 'Not configured'}`);
      console.log(`   SMS Method: ${number.smsMethod || 'Not configured'}`);
      console.log(`   Voice URL: ${number.voiceUrl || 'Not configured'}`);
      console.log(`   Voice Method: ${number.voiceMethod || 'Not configured'}`);
      console.log(`   Status Callback: ${number.statusCallback || 'Not configured'}`);
      console.log(`   SMS Fallback URL: ${number.smsFallbackUrl || 'Not configured'}`);
      console.log(`   Voice Fallback URL: ${number.voiceFallbackUrl || 'Not configured'}`);
      console.log(`   Capabilities: SMS: ${number.capabilities.sms ? 'Yes' : 'No'}, Voice: ${number.capabilities.voice ? 'Yes' : 'No'}, MMS: ${number.capabilities.mms ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    console.log('To use one of these numbers for testing, update your .env.local file with:');
    console.log('TWILIO_SMARTTEXT_NUMBER=+1234567890 (replace with one of the numbers above)');
    
  } catch (error) {
    console.error('\n❌ Error listing Twilio phone numbers:', error.message);
    
    if (error.code === 20003) {
      console.error('Authentication Error - Your Twilio credentials are invalid.');
    }
  }
}

// Run the function
listTwilioNumbers().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
