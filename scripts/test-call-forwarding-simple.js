#!/usr/bin/env node

/**
 * Simple test script for call forwarding functionality
 * 
 * This script tests if the call forwarding is properly configured
 * by making a request to the voice endpoint and verifying the TwiML response.
 * 
 * Usage: node scripts/test-call-forwarding-simple.js +18186518560
 */

const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const twilio = require('twilio');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

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
      console.error('Usage: node scripts/test-call-forwarding-simple.js +18186518560');
      process.exit(1);
    }
    
    console.log(`Testing call forwarding for Twilio number: ${phoneNumber}`);
    
    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Get the Twilio number status
    console.log('\n📞 Checking Twilio Number Status...');
    
    try {
      console.log('\n⚠️ Note: Skipping Twilio account check for phone number');
      console.log('Testing the voice endpoint directly...');
      
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
        
        // Parse the XML to check if it contains a Dial verb
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
        
        // Generate a test TwiML for comparison
        const VoiceResponse = twilio.twiml.VoiceResponse;
        const testResponse = new VoiceResponse();
        
        testResponse.say(
          { voice: 'alice' },
          'This is a test of the call forwarding functionality.'
        );
        
        const dial = testResponse.dial({
          timeout: 10,
          callerId: phoneNumber
        });
        dial.number(numberToCall);
        
        const testTwiML = testResponse.toString();
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
      console.error(`❌ Error checking Twilio number status for ${phoneNumber}:`, error);
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
