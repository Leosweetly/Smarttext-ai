#!/usr/bin/env node

/**
 * This script tests calling a Twilio number to see if it sends an auto-text response.
 * It uses the Twilio API to make a test call to the specified number.
 * 
 * Usage: node scripts/test-twilio-number.js
 */

const dotenv = require('dotenv');
const path = require('path');
const twilio = require('twilio');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Twilio credentials
const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_TEST_NUMBER = process.env.TWILIO_TEST_NUMBER || '+18186518560'; // The number to test

// Check if Twilio credentials are set
if (!TWILIO_SID || !TWILIO_AUTH_TOKEN) {
  console.error('❌ Twilio credentials not found in environment variables');
  console.log('Please set TWILIO_SID and TWILIO_AUTH_TOKEN in your .env.local file');
  process.exit(1);
}

// Initialize Twilio client
const client = new twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

// Function to make a test call
async function makeTestCall(fromNumber, toNumber) {
  try {
    console.log(`📞 Making a test call from ${fromNumber} to ${toNumber}...`);
    
    // Make a call using Twilio
    const call = await client.calls.create({
      url: 'http://demo.twilio.com/docs/voice.xml', // TwiML URL for the call
      from: fromNumber,
      to: toNumber,
      statusCallback: 'https://your-app-url.com/api/missed-call', // Replace with your actual callback URL
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['completed', 'busy', 'no-answer', 'failed'],
    });
    
    console.log(`✅ Call initiated with SID: ${call.sid}`);
    console.log('Call will be marked as "missed" after a few seconds...');
    
    // Wait for a few seconds to let the call be processed
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check call status
    const callStatus = await client.calls(call.sid).fetch();
    console.log(`Call status: ${callStatus.status}`);
    
    // Check for SMS messages sent after the call
    console.log('\n📱 Checking for SMS responses...');
    const messages = await client.messages.list({
      from: toNumber,
      to: fromNumber,
      limit: 5,
    });
    
    if (messages.length > 0) {
      console.log(`✅ Found ${messages.length} message(s) sent from ${toNumber} to ${fromNumber}:`);
      messages.forEach((message, index) => {
        console.log(`\nMessage ${index + 1} (${message.dateCreated}):`);
        console.log(`Status: ${message.status}`);
        console.log(`Body: ${message.body}`);
      });
    } else {
      console.log(`❌ No messages found from ${toNumber} to ${fromNumber} in the last few minutes.`);
      console.log('This could mean:');
      console.log('1. The auto-text feature is not working');
      console.log('2. There might be a delay in sending the message');
      console.log('3. The test call was not properly registered as "missed"');
    }
    
  } catch (error) {
    console.error('❌ Error making test call:', error);
  }
}

// Function to list available phone numbers
async function listAvailableNumbers() {
  try {
    console.log('📋 Listing available Twilio phone numbers...');
    
    // List incoming phone numbers
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
      limit: 20,
    });
    
    if (incomingPhoneNumbers.length > 0) {
      console.log(`Found ${incomingPhoneNumbers.length} phone number(s):`);
      incomingPhoneNumbers.forEach((number, index) => {
        console.log(`${index + 1}. ${number.phoneNumber} (${number.friendlyName})`);
      });
      
      return incomingPhoneNumbers.map(number => number.phoneNumber);
    } else {
      console.log('No phone numbers found in your Twilio account.');
      return [];
    }
  } catch (error) {
    console.error('❌ Error listing phone numbers:', error);
    return [];
  }
}

// Main function
async function main() {
  try {
    console.log('🔍 Testing Twilio Number for Auto-Text Response...\n');
    
    // List available phone numbers
    const availableNumbers = await listAvailableNumbers();
    
    // Check if the test number is in the available numbers
    if (availableNumbers.length > 0 && !availableNumbers.includes(TWILIO_TEST_NUMBER)) {
      console.log(`\n⚠️ Warning: The test number ${TWILIO_TEST_NUMBER} is not in your Twilio account.`);
      console.log('You might want to use one of the available numbers listed above.');
    }
    
    // Get a Twilio number to make the call from
    let fromNumber;
    if (availableNumbers.length > 0) {
      // Use a different number than the test number
      fromNumber = availableNumbers.find(number => number !== TWILIO_TEST_NUMBER) || availableNumbers[0];
    } else {
      // If no numbers are available, use a default test number
      fromNumber = '+15005550006'; // Twilio test number
      console.log(`\n⚠️ No available numbers found. Using Twilio test number: ${fromNumber}`);
    }
    
    // Make the test call
    await makeTestCall(fromNumber, TWILIO_TEST_NUMBER);
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Error testing Twilio number:', error);
  }
}

// Execute the main function
main()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
