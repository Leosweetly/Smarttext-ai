#!/usr/bin/env node

/**
 * Simple test script that sends a form-urlencoded request to the test-endpoints API
 */

import fetch from 'node-fetch';
import FormData from 'form-data';

const API_BASE_URL = 'http://localhost:3002';

async function testMissedCall() {
  console.log('Testing missed call endpoint with form-urlencoded data...');
  
  // Create form data
  const formData = new URLSearchParams();
  formData.append('To', '+18186518560');
  formData.append('From', '+16195551234');
  formData.append('CallSid', `TEST_CALL_${Date.now()}`);
  formData.append('CallStatus', 'no-answer');
  formData.append('Direction', 'inbound');
  formData.append('ConnectDuration', '0');
  
  const url = `${API_BASE_URL}/api/test-endpoints?action=missed-call`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
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

// Run the test
testMissedCall().catch(console.error);
