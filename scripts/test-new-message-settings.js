/**
 * Test script for the new settings fallback in new-message.ts
 * 
 * This script sends a test message to the API with debug mode enabled
 * to verify the settings fallback functionality.
 */

const axios = require('axios');

// Base URL for local testing
const BASE_URL = 'http://localhost:3000';

// Test business with minimal settings
const testBusiness = {
  id: 'test-settings-fallback',
  name: 'Test Settings Fallback',
  business_type: 'restaurant',
  public_phone: '+15551234567',
  twilio_phone: '+15551234567',
  owner_phone: '+15559876543',
  // No custom_settings to test fallbacks
};

// Function to run the test
async function runTest() {
  console.log('=== Testing New Message Settings Fallback ===\n');
  console.log('Sending test message with debug mode enabled...');
  
  try {
    // Make a POST request to the API with test data
    const response = await axios.post(`${BASE_URL}/api/new-message`, {
      To: testBusiness.twilio_phone,
      From: '+15551112222',
      Body: 'What are your hours?',
      testMode: true,
      _testOverrides: {
        business: testBusiness,
        debugSettings: true
      }
    });
    
    console.log(`\nStatus: ${response.status}`);
    
    if (response.data && response.data.success) {
      console.log('\n✅ Test successful!');
      console.log('\nResponse details:');
      console.log(`- Business: ${response.data.businessName}`);
      console.log(`- Response message: "${response.data.responseMessage}"`);
      console.log(`- Response source: ${response.data.responseSource}`);
      
      console.log('\nExpected fallbacks:');
      console.log(`- twilioNumber: ${testBusiness.twilio_phone}`);
      console.log(`- ownerPhone: ${testBusiness.owner_phone}`);
      console.log(`- autoReplyOptions: default_for_restaurant`);
      
      console.log('\nCheck your server logs for detailed debug information about the settings normalization.');
    } else {
      console.log('❌ Test failed');
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
runTest()
  .then(() => console.log('\nTest completed'))
  .catch(err => console.error('Test error:', err));
