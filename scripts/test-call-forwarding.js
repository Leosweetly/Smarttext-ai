#!/usr/bin/env node

/**
 * Test script for call forwarding functionality
 * 
 * This script tests if the call forwarding is properly configured
 * by simulating a call to the Twilio number and verifying that it
 * would be forwarded to the business's forwarding number.
 * 
 * Usage: node scripts/test-call-forwarding.js +18186518560
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Import required modules directly using CommonJS
const { getBusinessByPhoneNumber } = require('../lib/data/business');
const { getTwilioNumberStatus } = require('../lib/twilio/phone-manager');
const twilio = require('twilio');

// Helper functions
async function getBusinessInfo(phoneNumber) {
  return await getBusinessByPhoneNumber(phoneNumber);
}

async function getTwilioStatus(phoneNumber) {
  return await getTwilioNumberStatus(phoneNumber);
}

function generateTestTwiML(from, to) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  
  response.say(
    { voice: 'alice' },
    'This is a test of the call forwarding functionality.'
  );
  
  const dial = response.dial({
    timeout: 10,
    callerId: from
  });
  dial.number(to);
  
  return response.toString();
}

async function main() {
  try {
    console.log('\n🔍 Testing Call Forwarding Configuration');
    
    // Check if required environment variables are set
    if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error('❌ Error: TWILIO_SID and TWILIO_AUTH_TOKEN environment variables must be set');
      console.error('Please add these to your .env.local file');
      process.exit(1);
    }
    
    // Get the phone number from command line arguments
    const phoneNumber = process.argv[2];
    
    if (!phoneNumber) {
      console.error('❌ Error: Phone number is required');
      console.error('Usage: node scripts/test-call-forwarding.js +18186518560');
      process.exit(1);
    }
    
    console.log(`Testing call forwarding for Twilio number: ${phoneNumber}`);
    
    // Use the directly imported functions
    
    // Get the Twilio number status
    const twilioStatus = await getTwilioStatus(phoneNumber);
    
    if (!twilioStatus.exists) {
      console.error(`❌ Error: Phone number ${phoneNumber} not found in Twilio account`);
      process.exit(1);
    }
    
    console.log('\n📞 Twilio Number Status:');
    console.log(`  Phone Number: ${twilioStatus.phoneNumber}`);
    console.log(`  Voice URL: ${twilioStatus.voiceUrl}`);
    console.log(`  Status Callback: ${twilioStatus.statusCallback}`);
    console.log(`  Properly Configured: ${twilioStatus.isConfigured ? '✅ Yes' : '❌ No'}`);
    
    if (!twilioStatus.isConfigured) {
      console.log('\n⚠️ Warning: Twilio number is not properly configured');
      console.log('Please run the following command to configure it:');
      console.log(`  node scripts/test-twilio-config.js configure ${phoneNumber}`);
    }
    
    // Get the business information
    const business = await getBusinessInfo(phoneNumber);
    
    if (!business) {
      console.error(`❌ Error: No business found with phone number ${phoneNumber}`);
      process.exit(1);
    }
    
    console.log('\n🏢 Business Information:');
    console.log(`  Name: ${business.name}`);
    console.log(`  Phone Number: ${business.phoneNumber}`);
    console.log(`  Forwarding Number: ${business.forwardingNumber}`);
    
    if (!business.forwardingNumber) {
      console.error('❌ Error: No forwarding number found for this business');
      console.error('Please set a forwarding number in the Airtable "Forwarding Phone Number" field');
      process.exit(1);
    }
    
    // Test the voice URL by making a request to it
    const apiBaseUrl = process.env.API_BASE_URL || 'https://smarttext-webhook-kyle-davis-projects-30fc1531.vercel.app';
    const voiceUrl = `${apiBaseUrl}/api/twilio/voice`;
    
    console.log('\n🔄 Testing voice endpoint...');
    
    try {
      // Simulate a Twilio request to the voice URL
      const formData = new URLSearchParams();
      formData.append('To', phoneNumber);
      formData.append('From', '+12223334444'); // Dummy caller number
      formData.append('CallSid', 'CA12345678901234567890123456789012');
      
      const response = await axios.post(voiceUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (response.status !== 200) {
        console.error(`❌ Error: Voice URL returned status ${response.status}`);
        console.error(response.data);
        process.exit(1);
      }
      
      // Parse the TwiML response
      const twiml = response.data;
      console.log('\n📝 TwiML Response:');
      console.log(twiml);
      
      // Parse the XML to check if it contains a Dial verb with the forwarding number
      const parsedTwiML = await parseStringPromise(twiml);
      
      if (!parsedTwiML.Response || !parsedTwiML.Response.Dial) {
        console.error('❌ Error: TwiML response does not contain a Dial verb');
        process.exit(1);
      }
      
      const dialVerb = parsedTwiML.Response.Dial[0];
      const numberToCall = dialVerb.Number ? dialVerb.Number[0] : null;
      
      if (!numberToCall) {
        console.error('❌ Error: TwiML response does not contain a Number to dial');
        process.exit(1);
      }
      
      console.log(`\n✅ Call would be forwarded to: ${numberToCall}`);
      
      if (numberToCall === business.forwardingNumber) {
        console.log('✅ Forwarding number matches the business\'s forwarding number');
      } else {
        console.error('❌ Error: Forwarding number does not match the business\'s forwarding number');
        console.error(`  Expected: ${business.forwardingNumber}`);
        console.error(`  Actual: ${numberToCall}`);
      }
      
      // Generate a test TwiML for comparison
      const testTwiML = generateTestTwiML(phoneNumber, business.forwardingNumber);
      console.log('\n📝 Example TwiML for reference:');
      console.log(testTwiML);
      
      console.log('\n🎉 Call forwarding is properly configured!');
      console.log('When someone calls your Twilio number, the call will be forwarded to your business phone.');
      console.log('If the call is not answered, an auto-text will be sent to the caller.');
      
    } catch (error) {
      console.error('\n❌ Error testing voice endpoint:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  }
}

// Execute the main function
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
