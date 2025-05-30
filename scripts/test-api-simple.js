#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/create-checkout-session';

async function testAPI() {
  console.log('🧪 Testing Stripe API endpoint...');
  
  try {
    // Test GET request (should return 405)
    console.log('\n1. Testing GET request (should return 405)...');
    const getResponse = await fetch(API_URL, {
      method: 'GET',
      timeout: 5000
    });
    
    console.log(`   Status: ${getResponse.status}`);
    const getResult = await getResponse.json();
    console.log(`   Response:`, getResult);
    
    // Test POST request
    console.log('\n2. Testing POST request...');
    const postResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerEmail: 'test@example.com'
      }),
      timeout: 10000
    });
    
    console.log(`   Status: ${postResponse.status}`);
    const postResult = await postResponse.json();
    console.log(`   Response:`, postResult);
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testAPI();
