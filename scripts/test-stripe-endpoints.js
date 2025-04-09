/**
 * Simple script to test Stripe API endpoints
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 'rec2WN1vnfFJ1qcRx'; // Real business ID from Airtable

// Test data
const testData = {
  userId: TEST_USER_ID,
  planId: 'pro',
  successUrl: 'https://example.com/success',
  cancelUrl: 'https://example.com/cancel'
};

/**
 * Make an API request
 */
async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`Making ${method} request to ${endpoint}`);
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    return {
      status: response.status,
      data
    };
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error);
    return {
      status: 500,
      data: { success: false, error: error.message }
    };
  }
}

/**
 * Test the create-checkout-session endpoint
 */
async function testCreateCheckoutSession() {
  console.log('\n--- Testing create-checkout-session endpoint ---');
  
  const { status, data } = await makeRequest('/api/create-checkout-session', 'POST', testData);
  
  if (status === 200 && data.sessionId) {
    console.log('✓ Successfully created checkout session');
    return true;
  } else {
    console.log('✗ Failed to create checkout session');
    return false;
  }
}

/**
 * Test the subscription-status endpoint
 */
async function testSubscriptionStatus() {
  console.log('\n--- Testing subscription-status endpoint ---');
  
  const { status, data } = await makeRequest(`/api/subscription-status?userId=${TEST_USER_ID}`);
  
  if (status === 200) {
    console.log('✓ Successfully retrieved subscription status');
    return true;
  } else {
    console.log('✗ Failed to retrieve subscription status');
    return false;
  }
}

/**
 * Test the log-subscription endpoint
 */
async function testLogSubscription() {
  console.log('\n--- Testing log-subscription endpoint ---');
  
  const { status, data } = await makeRequest('/api/log-subscription', 'POST', {
    userId: TEST_USER_ID,
    event: 'test',
    data: {
      test: true,
      timestamp: new Date().toISOString()
    }
  });
  
  if (status === 200 && data.success) {
    console.log('✓ Successfully logged subscription event');
    return true;
  } else {
    console.log('✗ Failed to log subscription event');
    return false;
  }
}

// Run the tests
async function main() {
  console.log('=== Testing Stripe Backend Integration ===');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Test User ID:', TEST_USER_ID);
  
  await testCreateCheckoutSession();
  await testSubscriptionStatus();
  await testLogSubscription();
  
  console.log('\n=== Tests completed ===');
}

main().catch(console.error);
