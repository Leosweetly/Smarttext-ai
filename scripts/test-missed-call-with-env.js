/**
 * Test script for the missed-call endpoint with environment variables
 * This script sets the SKIP_TWILIO_SIGNATURE environment variable to bypass Twilio signature validation
 */

import axios from 'axios';

// Set environment variables
process.env.SKIP_TWILIO_SIGNATURE = 'true';

// Define the endpoint URL
const url = 'https://smarttext-webhook-ptg1r9ixj-kyle-davis-projects-30fc1531.vercel.app/api/missed-call';

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
    
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Skip-Twilio-Signature': 'true'  // Custom header to indicate skipping signature validation
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
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
