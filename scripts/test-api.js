/**
 * Test script for the health API endpoint
 * 
 * This script sends a GET request to the API endpoint to verify it's working correctly.
 */

import fetch from 'node-fetch';

// The URL of the API endpoint (production server)
const API_URL = 'https://smarttext-webhook-h4qx2v7kr-kyle-davis-projects-30fc1531.vercel.app/api/health';

async function testApi() {
  console.log('Testing health API endpoint...');
  console.log(`Sending GET request to ${API_URL}`);
  
  try {
    const response = await fetch(API_URL);
    
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Error parsing JSON response:', error.message);
      return;
    }
    
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Test passed! API endpoint is working correctly.');
    } else {
      console.log('❌ Test failed! API endpoint returned an error.');
    }
  } catch (error) {
    console.error('❌ Test failed! Error:', error.message);
  }
}

// Run the test
testApi();
