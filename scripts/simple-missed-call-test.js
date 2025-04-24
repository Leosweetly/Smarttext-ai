#!/usr/bin/env node

/**
 * Simple script to test the missed call endpoint
 */

import axios from 'axios';

async function testMissedCall() {
  try {
    console.log('Testing missed call endpoint...');
    
    const response = await axios.post('http://localhost:3000/api/missed-call', {
      To: '+18186518560',
      From: '+12125551234',
      CallSid: 'TEST_CALL_' + Date.now(),
      CallStatus: 'no-answer',
      ConnectDuration: '0'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error testing missed call:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testMissedCall();
