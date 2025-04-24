#!/usr/bin/env node

/**
 * Test script for the simple test endpoint
 * 
 * This script tests the /api/test-simple endpoint with both missed call and connected call scenarios.
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3002';

/**
 * Test a missed call
 */
async function testMissedCall() {
  console.log('\n=== TEST 1: MISSED CALL ===');
  console.log('Testing missed call scenario...');
  
  const callData = {
    To: '+18186518560',
    From: '+16195551234',
    CallSid: `TEST_CALL_${Date.now()}`,
    CallStatus: 'no-answer',
    Direction: 'inbound',
    ConnectDuration: '0'
  };
  
  const url = `${API_BASE_URL}/api/test-simple`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(callData)
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.smsResponse) {
        console.log('✅ Auto-text was sent as expected for missed call');
      } else {
        console.error('❌ No auto-text was sent for missed call');
      }
    } else {
      const text = await response.text();
      console.error('Error:', text);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

/**
 * Test a connected call
 */
async function testConnectedCall() {
  console.log('\n=== TEST 2: CONNECTED CALL ===');
  console.log('Testing connected call scenario...');
  
  const callData = {
    To: '+18186518560',
    From: '+16195551234',
    CallSid: `TEST_CALL_${Date.now()}`,
    CallStatus: 'completed',
    Direction: 'inbound',
    ConnectDuration: '30'
  };
  
  const url = `${API_BASE_URL}/api/test-simple`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(callData)
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!data.smsResponse && data.connected) {
        console.log('✅ No auto-text was sent as expected for connected call');
      } else {
        console.error('❌ Auto-text was incorrectly sent for connected call');
      }
    } else {
      const text = await response.text();
      console.error('Error:', text);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

/**
 * Test a new message
 */
async function testNewMessage() {
  console.log('\n=== TEST 3: NEW MESSAGE ===');
  console.log('Testing new message scenario...');
  
  const messageData = {
    To: '+18186518560',
    From: '+16195551234',
    Body: 'What are your hours?',
    MessageSid: `TEST_MSG_${Date.now()}`,
    // Add CallSid to satisfy the validation
    CallSid: `TEST_CALL_${Date.now()}`
  };
  
  const url = `${API_BASE_URL}/api/test-simple`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
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
  console.log('🧪 Starting tests for /api/test-simple endpoint');
  
  await testMissedCall();
  await testConnectedCall();
  await testNewMessage();
  
  console.log('\n🧪 All tests completed');
}

runTests().catch(console.error);
