#!/usr/bin/env node

/**
 * This script tests the Twilio number selection functionality
 * by listing available Twilio numbers and simulating the selection process.
 * 
 * Usage: node scripts/test-twilio-number-selection.js
 */

const dotenv = require('dotenv');
const path = require('path');
const twilio = require('twilio');
const { configureTwilioNumber, getTwilioNumberStatus } = require('../lib/twilio/phone-manager');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testTwilioNumberSelection() {
  try {
    console.log('\n🔍 Testing Twilio number selection functionality...');
    
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
    console.log('📱 Fetching available Twilio phone numbers...');
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list();
    
    if (incomingPhoneNumbers.length === 0) {
      console.log('❌ No phone numbers found in your Twilio account.');
      console.log('Please purchase a phone number in your Twilio account before running this test.');
      return;
    }
    
    console.log(`✅ Found ${incomingPhoneNumbers.length} phone numbers in your Twilio account.`);
    
    // Display available phone numbers
    console.log('\nAvailable phone numbers:');
    incomingPhoneNumbers.forEach((number, index) => {
      console.log(`${index + 1}. ${number.phoneNumber} (${number.friendlyName || 'No friendly name'})`);
    });
    
    // Select the first phone number for testing
    const selectedNumber = incomingPhoneNumbers[0];
    console.log(`\n🔄 Selected ${selectedNumber.phoneNumber} for testing...`);
    
    // Check the current status of the selected number
    console.log('\n🔍 Checking current configuration status...');
    const initialStatus = await getTwilioNumberStatus(selectedNumber.phoneNumber);
    
    console.log(`Current configuration status: ${initialStatus.isConfigured ? 'Configured ✅' : 'Not configured ❌'}`);
    console.log(`Voice URL: ${initialStatus.voiceUrl || 'Not set'}`);
    console.log(`Status Callback: ${initialStatus.statusCallback || 'Not set'}`);
    
    // Configure the number for SmartText AI
    console.log('\n🔄 Configuring number for SmartText AI...');
    const configResult = await configureTwilioNumber(selectedNumber.phoneNumber);
    
    console.log(`\n✅ Configuration result: ${configResult.success ? 'Success' : 'Failed'}`);
    console.log(`Voice URL set to: ${configResult.voiceUrl}`);
    console.log(`Status Callback set to: ${configResult.statusCallback}`);
    
    // Check the updated status
    console.log('\n🔍 Checking updated configuration status...');
    const updatedStatus = await getTwilioNumberStatus(selectedNumber.phoneNumber);
    
    console.log(`Updated configuration status: ${updatedStatus.isConfigured ? 'Configured ✅' : 'Not configured ❌'}`);
    
    console.log('\n✅ Twilio number selection test completed successfully!');
    console.log('This number is now configured for SmartText AI and can be used for missed call auto-texting.');
    
  } catch (error) {
    console.error('\n❌ Error testing Twilio number selection:', error.message);
    
    if (error.code === 20003) {
      console.error('Authentication Error - Your Twilio credentials are invalid.');
    }
  }
}

// Run the function
testTwilioNumberSelection().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
