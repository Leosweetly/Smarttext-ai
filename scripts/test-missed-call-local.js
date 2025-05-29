/**
 * Test script for the missed-call endpoint locally
 * This script directly tests the missed-call.ts file locally
 */

import fetch from 'node-fetch';

// Define the endpoint URL - use localhost for local testing
const url = 'http://localhost:3001/api/missed-call';

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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the test
testMissedCall();
