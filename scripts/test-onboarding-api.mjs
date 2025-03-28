#!/usr/bin/env node

/**
 * Test script for the onboarding API
 * 
 * This script tests the onboarding API endpoints:
 * - GET /api/onboarding - Get onboarding data for a user
 * - POST /api/onboarding - Update onboarding data for a user
 * - POST /api/onboarding/reset - Reset onboarding data for a user
 * 
 * For testing purposes, you can use the test endpoints:
 * - GET /api/onboarding-test - Get mock onboarding data for a user
 * - POST /api/onboarding-test - Update mock onboarding data for a user
 * - POST /api/onboarding-test/reset - Reset mock onboarding data for a user
 */

import fetch from 'node-fetch';

// Configuration
const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  useTestEndpoints: true, // Set to false to test the real API
  authentication: false, // Set to true to use authentication
  authToken: 'test-auth-token', // Replace with a real token if authentication is enabled
  userId: 'test-user-id' // User ID for testing
};

// API endpoints
const endpoints = {
  base: config.useTestEndpoints ? '/api/onboarding-test' : '/api/onboarding',
  reset: config.useTestEndpoints ? '/api/onboarding-test/reset' : '/api/onboarding/reset'
};

// Test data
const testData = {
  businessInfo: {
    steps: {
      businessInfo: {
        completed: true,
        data: {
          name: 'Test Business',
          businessType: 'retail',
          address: '123 Test St, Test City, TS 12345'
        }
      }
    },
    currentStep: 'phoneSetup'
  },
  phoneSetup: {
    steps: {
      phoneSetup: {
        completed: true,
        data: {
          phoneNumber: '+15551234567',
          configured: true
        }
      }
    },
    currentStep: 'preferences'
  },
  preferences: {
    steps: {
      preferences: {
        completed: true,
        data: {
          notifications: {
            email: true,
            sms: true,
            push: false,
            frequency: 'immediate'
          },
          autoRespond: true,
          theme: 'dark'
        }
      }
    },
    completed: true
  }
};

/**
 * Make a request to the API
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Object} body - Request body
 * @returns {Promise<Object>} Response data
 */
async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${config.apiBaseUrl}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (config.authentication) {
    headers['Authorization'] = `Bearer ${config.authToken}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    console.log(`Making request to ${endpoint}:`);
    
    const response = await fetch(url, options);
    const rawResponse = await response.text();
    
    console.log(`Raw response: ${rawResponse}`);
    
    const data = JSON.parse(rawResponse);
    
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
      data: {
        success: false,
        error: error.message
      }
    };
  }
}

/**
 * Test the GET endpoint
 * @returns {Promise<boolean>} Whether the test passed
 */
async function testGet() {
  console.log('\n--- Testing GET', endpoints.base, '---');
  
  const response = await makeRequest(`${endpoints.base}?userId=${config.userId}`);
  
  return response.status === 200;
}

/**
 * Test the POST endpoint
 * @returns {Promise<boolean>} Whether the test passed
 */
async function testPost() {
  console.log('\n--- Testing POST', endpoints.base, '---');
  
  // Test business info update
  const businessInfoResponse = await makeRequest(endpoints.base, 'POST', {
    userId: config.userId,
    ...testData.businessInfo
  });
  
  if (businessInfoResponse.status !== 200 || !businessInfoResponse.data.success) {
    return false;
  }
  
  // Test phone setup update
  const phoneSetupResponse = await makeRequest(endpoints.base, 'POST', {
    userId: config.userId,
    ...testData.phoneSetup
  });
  
  if (phoneSetupResponse.status !== 200 || !phoneSetupResponse.data.success) {
    return false;
  }
  
  // Test preferences update
  const preferencesResponse = await makeRequest(endpoints.base, 'POST', {
    userId: config.userId,
    ...testData.preferences
  });
  
  return preferencesResponse.status === 200 && preferencesResponse.data.success;
}

/**
 * Test the reset endpoint
 * @returns {Promise<boolean>} Whether the test passed
 */
async function testReset() {
  console.log('\n--- Testing POST', endpoints.reset, '---');
  
  const response = await makeRequest(endpoints.reset, 'POST', {
    userId: config.userId
  });
  
  return response.status === 200 && response.data.success;
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('=== Testing Onboarding API Endpoints ===');
  console.log('API Base URL:', config.apiBaseUrl);
  console.log('Authentication:', config.authentication ? 'Enabled' : 'Disabled');
  console.log('Using Test Endpoints:', config.useTestEndpoints ? 'Yes' : 'No');
  
  const getResult = await testGet();
  const postResult = await testPost();
  const resetResult = await testReset();
  
  console.log('\n=== Test Results ===');
  console.log(`GET ${endpoints.base}: ${getResult ? 'PASS' : 'FAIL'}`);
  console.log(`POST ${endpoints.base}: ${postResult ? 'PASS' : 'FAIL'}`);
  console.log(`POST ${endpoints.reset}: ${resetResult ? 'PASS' : 'FAIL'}`);
  console.log(`Overall: ${getResult && postResult && resetResult ? 'PASS' : 'FAIL'}`);
}

// Run the tests
runTests().catch(console.error);
