#!/usr/bin/env node

/**
 * Test script for the /api/webhooks/airtable endpoint
 * 
 * Usage:
 * node scripts/test-airtable-webhook.js [base-url]
 * 
 * If base-url is not provided, it defaults to the production URL
 */

import fetch from 'node-fetch';

// Get the base URL from command line args or use production URL
const baseUrl = process.argv[2] || 'https://smarttext-ai.vercel.app';
const endpoint = '/api/webhooks/airtable';
const url = `${baseUrl}${endpoint}`;

// Sample test data
const testData = {
  businessId: 'test-business-id',
  businessName: 'Test Business',
  timestamp: new Date().toISOString(),
  testMode: true
};

async function testEndpoint() {
  console.log(`🔍 Testing ${endpoint} endpoint at ${baseUrl}...`);
  
  try {
    // Make POST request to the endpoint
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    // Get response data
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { error: 'Failed to parse JSON response' };
    }
    
    // Log results
    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Headers:`);
    response.headers.forEach((value, name) => {
      console.log(`   ${name}: ${value}`);
    });
    
    console.log(`\n📄 Response Body:`);
    console.log(JSON.stringify(data, null, 2));
    
    // Check if the response was successful
    if (response.ok) {
      console.log(`\n✅ Test PASSED! The ${endpoint} endpoint is working correctly.`);
    } else {
      console.log(`\n❌ Test FAILED! The ${endpoint} endpoint returned an error.`);
    }
    
  } catch (error) {
    console.error(`\n❌ Error testing endpoint: ${error.message}`);
    console.error(`   This could mean the endpoint doesn't exist or there's a network issue.`);
    process.exit(1);
  }
}

// Run the test
testEndpoint();
