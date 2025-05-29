/**
 * Test script for the missed-call endpoint on production
 * This script adds a custom header to bypass Twilio signature validation
 */

import fetch from 'node-fetch';

// Define the endpoint URL - use the production URL
const url = 'https://smarttext-webhook-moeabdcvm-kyle-davis-projects-30fc1531.vercel.app/api/missed-call';

// Define the request payload
const payload = {
  To: "+18186518560",
  From: "+12125551234",
  CallSid: "TEST_CALL_1234567890",
  CallStatus: "no-answer",
  Duration: "0",
  CallDuration: "0",
  ConnectDuration: "0"
};

// Make the request
async function testMissedCall() {
  try {
    console.log('Sending request to:', url);
    console.log('With payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Skip-Twilio-Signature': 'true'  // Custom header to indicate skipping signature validation
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testMissedCall();
