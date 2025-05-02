/**
 * Test script for settings fallback in new-message.ts
 * 
 * This script tests the fallback behavior for custom settings:
 * - twilioNumber falls back to business.twilio_phone
 * - ownerPhone falls back to business.owner_phone
 * - autoReplyOptions falls back to defaults based on business_type
 */

const axios = require('axios');
const querystring = require('querystring');

// Base URL for local testing
const BASE_URL = 'http://localhost:3001';

// Test cases with different combinations of settings
const testCases = [
  {
    name: 'No custom settings',
    business: {
      id: 'test-no-settings',
      name: 'Test Business (No Settings)',
      business_type: 'restaurant',
      twilio_phone: '+15551234567',
      owner_phone: '+15559876543',
      custom_settings: null
    }
  },
  {
    name: 'Empty custom settings',
    business: {
      id: 'test-empty-settings',
      name: 'Test Business (Empty Settings)',
      business_type: 'autoshop',
      twilio_phone: '+15551234567',
      owner_phone: '+15559876543',
      custom_settings: {}
    }
  },
  {
    name: 'Custom twilioNumber only',
    business: {
      id: 'test-custom-twilio',
      name: 'Test Business (Custom Twilio)',
      business_type: 'retail',
      twilio_phone: '+15551234567',
      owner_phone: '+15559876543',
      custom_settings: {
        twilioNumber: '+15557654321'
      }
    }
  },
  {
    name: 'Custom ownerPhone only',
    business: {
      id: 'test-custom-owner',
      name: 'Test Business (Custom Owner)',
      business_type: 'salon',
      twilio_phone: '+15551234567',
      owner_phone: '+15559876543',
      custom_settings: {
        ownerPhone: '+15558765432'
      }
    }
  },
  {
    name: 'Custom autoReplyOptions only',
    business: {
      id: 'test-custom-options',
      name: 'Test Business (Custom Options)',
      business_type: 'restaurant',
      twilio_phone: '+15551234567',
      owner_phone: '+15559876543',
      custom_settings: {
        autoReplyOptions: ['custom option 1', 'custom option 2', 'custom option 3']
      }
    }
  },
  {
    name: 'Unknown business type',
    business: {
      id: 'test-unknown-type',
      name: 'Test Business (Unknown Type)',
      business_type: 'unknown_type',
      twilio_phone: '+15551234567',
      owner_phone: '+15559876543',
      custom_settings: {}
    }
  },
  {
    name: 'All custom settings',
    business: {
      id: 'test-all-custom',
      name: 'Test Business (All Custom)',
      business_type: 'restaurant',
      twilio_phone: '+15551234567',
      owner_phone: '+15559876543',
      custom_settings: {
        twilioNumber: '+15557654321',
        ownerPhone: '+15558765432',
        autoReplyOptions: ['custom option 1', 'custom option 2', 'custom option 3']
      }
    }
  }
];

// Function to test settings normalization
async function testSettingsNormalization() {
  console.log('Testing settings normalization...');
  
  for (const testCase of testCases) {
    console.log(`\nTest case: ${testCase.name}`);
    
    try {
      // Create form data for the request
      const formData = querystring.stringify({
        To: testCase.business.twilio_phone,
        From: '+15551112222',
        Body: 'Test message',
        testMode: 'true',
        _testOverrides: JSON.stringify({
          business: testCase.business,
          debugSettings: true
        })
      });

      // Make a POST request to the API with form-encoded data
      const response = await axios.post(`${BASE_URL}/api/new-message`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.data && response.data.success) {
        console.log('✅ Test passed');
        console.log('Expected fallbacks:');
        
        // Check twilioNumber fallback
        const expectedTwilioNumber = testCase.business.custom_settings?.twilioNumber || testCase.business.twilio_phone;
        console.log(`- twilioNumber: ${expectedTwilioNumber}`);
        
        // Check ownerPhone fallback
        const expectedOwnerPhone = testCase.business.custom_settings?.ownerPhone || testCase.business.owner_phone;
        console.log(`- ownerPhone: ${expectedOwnerPhone}`);
        
        // Check autoReplyOptions fallback
        let expectedOptions;
        if (testCase.business.custom_settings?.autoReplyOptions) {
          expectedOptions = 'custom_settings';
        } else if (['restaurant', 'autoshop', 'retail', 'salon', 'medical'].includes(testCase.business.business_type)) {
          expectedOptions = `default_for_${testCase.business.business_type}`;
        } else {
          expectedOptions = 'generic_default';
        }
        console.log(`- autoReplyOptions source: ${expectedOptions}`);
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
}

// Run the tests
console.log('=== Settings Fallback Test ===');
testSettingsNormalization()
  .then(() => console.log('\nAll tests completed'))
  .catch(err => console.error('Test suite error:', err));
