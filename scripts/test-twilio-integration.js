#!/usr/bin/env node

/**
 * Twilio Integration Test Script
 * 
 * This script tests the Twilio integration by:
 * 1. Checking if the Twilio credentials are configured
 * 2. Connecting to Twilio and fetching account information
 * 3. Sending a test SMS message (if a phone number is provided)
 * 
 * Usage:
 * node scripts/test-twilio-integration.js [phone_number]
 * 
 * Arguments:
 * phone_number - Optional. The phone number to send a test SMS to. If not provided, the script will only check the connection.
 */

require('dotenv').config({ path: '.env.local' });
const twilio = require('twilio');

// Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Get the phone number from command line arguments
const testPhoneNumber = process.argv[2];

async function testTwilioIntegration() {
  console.log('📱 Testing Twilio Integration');
  console.log('----------------------------');
  
  // Check if Twilio credentials are configured
  if (!TWILIO_ACCOUNT_SID) {
    console.error('❌ Twilio Account SID is not configured');
    console.log('\nPlease set the TWILIO_ACCOUNT_SID environment variable in your .env.local file:');
    console.log('TWILIO_ACCOUNT_SID=your_twilio_account_sid');
    return;
  }
  
  if (!TWILIO_AUTH_TOKEN) {
    console.error('❌ Twilio Auth Token is not configured');
    console.log('\nPlease set the TWILIO_AUTH_TOKEN environment variable in your .env.local file:');
    console.log('TWILIO_AUTH_TOKEN=your_twilio_auth_token');
    return;
  }
  
  if (!TWILIO_PHONE_NUMBER) {
    console.error('❌ Twilio Phone Number is not configured');
    console.log('\nPlease set the TWILIO_PHONE_NUMBER environment variable in your .env.local file:');
    console.log('TWILIO_PHONE_NUMBER=your_twilio_phone_number');
    return;
  }
  
  console.log('✅ Twilio credentials are configured');
  
  try {
    // Initialize Twilio client
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    console.log('\n📊 Fetching account information...');
    
    // Fetch account information
    const account = await client.api.accounts(TWILIO_ACCOUNT_SID).fetch();
    
    console.log('\n✅ Successfully connected to Twilio');
    console.log('\n📋 Account Information:');
    console.log(`  Account SID: ${account.sid}`);
    console.log(`  Account Name: ${account.friendlyName}`);
    console.log(`  Account Status: ${account.status}`);
    console.log(`  Account Type: ${account.type}`);
    
    // Fetch phone number information
    console.log('\n📊 Fetching phone number information...');
    
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: TWILIO_PHONE_NUMBER,
    });
    
    if (incomingPhoneNumbers.length === 0) {
      console.log(`\n⚠️ No phone number found matching ${TWILIO_PHONE_NUMBER}`);
      console.log('\nPlease check your TWILIO_PHONE_NUMBER environment variable.');
    } else {
      const phoneNumber = incomingPhoneNumbers[0];
      console.log('\n✅ Successfully fetched phone number information');
      console.log('\n📋 Phone Number Information:');
      console.log(`  Phone Number: ${phoneNumber.phoneNumber}`);
      console.log(`  Friendly Name: ${phoneNumber.friendlyName}`);
      console.log(`  SMS URL: ${phoneNumber.smsUrl || 'Not configured'}`);
      console.log(`  Voice URL: ${phoneNumber.voiceUrl || 'Not configured'}`);
    }
    
    // Send a test SMS message if a phone number is provided
    if (testPhoneNumber) {
      console.log(`\n📤 Sending a test SMS message to ${testPhoneNumber}...`);
      
      const message = await client.messages.create({
        body: 'This is a test message from SmartText AI. If you received this, the Twilio integration is working correctly!',
        from: TWILIO_PHONE_NUMBER,
        to: testPhoneNumber,
      });
      
      console.log('\n✅ Successfully sent a test SMS message');
      console.log('\n📋 Message Information:');
      console.log(`  Message SID: ${message.sid}`);
      console.log(`  Message Status: ${message.status}`);
      console.log(`  Message Direction: ${message.direction}`);
    } else {
      console.log('\n⚠️ No phone number provided for testing SMS sending');
      console.log('\nTo send a test SMS message, run the script with a phone number:');
      console.log('node scripts/test-twilio-integration.js +1234567890');
    }
    
    console.log('\n🎉 Twilio integration is working correctly!');
    
  } catch (error) {
    console.error('\n❌ Error testing Twilio integration:', error.message);
    
    if (error.code === 20003) {
      console.log('\nThe Account SID or Auth Token you provided is invalid. Please check your Twilio credentials.');
    } else if (error.code === 21211) {
      console.log('\nThe phone number you provided is invalid. Please check the phone number format.');
    } else if (error.code === 21608) {
      console.log('\nThe phone number you provided is not a valid Twilio phone number. Please check your TWILIO_PHONE_NUMBER environment variable.');
    } else {
      console.log('\nPlease check your Twilio configuration and try again.');
    }
  }
}

testTwilioIntegration();
