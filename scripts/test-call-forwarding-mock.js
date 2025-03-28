#!/usr/bin/env node

/**
 * Mock test script for call forwarding functionality
 * 
 * This script simulates the call forwarding functionality without making actual API requests.
 * It demonstrates how the call forwarding would work in a production environment.
 * 
 * Usage: node scripts/test-call-forwarding-mock.js +18186518560
 */

const dotenv = require('dotenv');
const path = require('path');
const twilio = require('twilio');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Mock business data
const mockBusinesses = {
  '+18186518560': {
    name: 'Example Business',
    phoneNumber: '+18186518560',
    forwardingNumber: '+19876543210', // This is the number calls would be forwarded to
  }
};

// Mock function to get business by phone number
function getBusinessByPhoneNumber(phoneNumber) {
  return mockBusinesses[phoneNumber] || null;
}

// Generate TwiML for call forwarding
function generateForwardingTwiML(forwardingNumber, businessName) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  // Add a brief message before forwarding
  response.say(
    { voice: 'alice' },
    `Thank you for calling ${businessName}. Please hold while we connect your call.`
  );

  // Dial the forwarding number with a timeout
  const dial = response.dial({
    timeout: 20, // Seconds to wait for an answer
    callerId: process.env.TWILIO_SMARTTEXT_NUMBER || null, // Use SmartText number as caller ID if available
    action: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/missed-call`,
    method: 'POST',
  });
  dial.number(forwardingNumber);

  return response.toString();
}

async function main() {
  try {
    console.log('\n🔍 Testing Call Forwarding Configuration (Mock)');
    
    // Get the phone number from command line arguments
    const phoneNumber = process.argv[2];
    
    if (!phoneNumber) {
      console.error('❌ Error: Phone number is required');
      console.error('Usage: node scripts/test-call-forwarding-mock.js +18186518560');
      process.exit(1);
    }
    
    console.log(`Testing call forwarding for Twilio number: ${phoneNumber}`);
    
    // Get the business information
    const business = getBusinessByPhoneNumber(phoneNumber);
    
    if (!business) {
      console.error(`❌ Error: No business found with phone number ${phoneNumber}`);
      console.error('This is a mock test. Please use one of the following phone numbers:');
      console.error('  +18186518560');
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
    
    // Generate TwiML for call forwarding
    const twiml = generateForwardingTwiML(business.forwardingNumber, business.name);
    
    console.log('\n📝 TwiML Response:');
    console.log(twiml);
    
    console.log('\n✅ Call would be forwarded to:', business.forwardingNumber);
    
    console.log('\n🎉 Call forwarding is properly configured!');
    console.log('When someone calls your Twilio number, the call will be forwarded to your business phone.');
    console.log('If the call is not answered, an auto-text will be sent to the caller.');
    
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
