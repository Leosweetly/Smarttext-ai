#!/usr/bin/env node

/**
 * Simple test script to test the test-endpoints.ts API endpoint
 */

import fetch from 'node-fetch';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

async function testMissedCall() {
  console.log('Testing missed call endpoint...');
  
  const missedCallData = {
    To: '+18186518560',
    From: '+16195551234',
    CallSid: `TEST_CALL_${Date.now()}`,
    CallStatus: 'no-answer',
    Direction: 'inbound',
    ConnectDuration: '0'
  };
  
  const url = `${API_BASE_URL}/api/test-endpoints?action=missed-call`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(missedCallData)
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('Response data:', data);
    } else {
      const text = await response.text();
      console.error('Error:', text);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

async function testNewMessage() {
  console.log('\nTesting new message endpoint...');
  
  const newMessageData = {
    To: '+18186518560',
    From: '+16195551234',
    Body: 'What are your hours?',
    MessageSid: `TEST_MSG_${Date.now()}`
  };
  
  const url = `${API_BASE_URL}/api/test-endpoints?action=new-message`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newMessageData)
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('Response data:', data);
    } else {
      const text = await response.text();
      console.error('Error:', text);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Run the tests
async function runTests() {
  await testMissedCall();
  await testNewMessage();
}

runTests().catch(console.error);
