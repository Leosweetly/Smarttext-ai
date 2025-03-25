/**
 * Test script for Auth0 integration
 * 
 * This script tests the Auth0 integration by:
 * 1. Checking if the user is authenticated
 * 2. Testing the auth test API endpoint
 * 3. Testing the conversations API endpoint
 * 4. Testing the missed calls API endpoint
 * 
 * Usage:
 * node scripts/test-auth0-integration.js
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const AUTH_COOKIE = process.env.AUTH_COOKIE; // This should be set to a valid Auth0 session cookie

// Test endpoints
const endpoints = [
  { name: 'Auth Test', url: '/api/auth/test' },
  { name: 'Conversations', url: '/api/conversations' },
  { name: 'Missed Calls', url: '/api/missed-calls' },
  { name: 'User Profile', url: '/api/auth/me' },
];

/**
 * Test an API endpoint
 * @param {string} name - The name of the endpoint
 * @param {string} url - The URL of the endpoint
 * @param {string} cookie - The Auth0 session cookie
 * @returns {Promise<void>}
 */
async function testEndpoint(name, url, cookie) {
  console.log(`\nTesting ${name} endpoint...`);
  
  try {
    // Test without authentication
    console.log(`  Testing without authentication...`);
    const unauthResponse = await fetch(`${BASE_URL}${url}`);
    const unauthData = await unauthResponse.json();
    
    console.log(`  Status: ${unauthResponse.status}`);
    console.log(`  Response: ${JSON.stringify(unauthData, null, 2)}`);
    
    if (unauthResponse.status === 401) {
      console.log(`  ✅ Endpoint correctly requires authentication`);
    } else {
      console.log(`  ❌ Endpoint does not require authentication`);
    }
    
    // Test with authentication
    if (cookie) {
      console.log(`\n  Testing with authentication...`);
      const authResponse = await fetch(`${BASE_URL}${url}`, {
        headers: {
          Cookie: cookie,
        },
      });
      
      const authData = await authResponse.json();
      
      console.log(`  Status: ${authResponse.status}`);
      console.log(`  Response: ${JSON.stringify(authData, null, 2)}`);
      
      if (authResponse.status === 200) {
        console.log(`  ✅ Endpoint correctly accepts authentication`);
      } else {
        console.log(`  ❌ Endpoint does not accept authentication`);
      }
    } else {
      console.log(`\n  Skipping authenticated test (no AUTH_COOKIE provided)`);
    }
  } catch (error) {
    console.error(`  ❌ Error testing ${name} endpoint:`, error);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔒 Testing Auth0 Integration');
  console.log('============================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Auth Cookie: ${AUTH_COOKIE ? 'Provided' : 'Not provided'}`);
  
  // Test each endpoint
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint.name, endpoint.url, AUTH_COOKIE);
  }
  
  console.log('\n============================');
  console.log('🏁 Auth0 Integration Test Complete');
  
  if (!AUTH_COOKIE) {
    console.log('\n⚠️  Warning: No AUTH_COOKIE provided. Only unauthenticated tests were run.');
    console.log('To run authenticated tests, set the AUTH_COOKIE environment variable to a valid Auth0 session cookie.');
    console.log('You can get this by logging in to the application and copying the appSession cookie from your browser.');
  }
}

// Run the main function
main().catch(console.error);
