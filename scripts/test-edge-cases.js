#!/usr/bin/env node

/**
 * This script tests edge cases in the SmartText AI application.
 * It checks for handling of unusual inputs, error conditions, and boundary cases.
 * 
 * Usage: node scripts/test-edge-cases.js
 */

const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');
const { formatPhoneNumberE164 } = require('../lib/utils');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const AUTH0_TEST_EMAIL = process.env.AUTH0_TEST_EMAIL;
const AUTH0_TEST_PASSWORD = process.env.AUTH0_TEST_PASSWORD;

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0
};

/**
 * Log a message with color
 * @param {string} message - The message to log
 * @param {string} type - The type of message (info, success, warning, error)
 */
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m%s\x1b[0m',    // Cyan
    success: '\x1b[32m%s\x1b[0m',  // Green
    warning: '\x1b[33m%s\x1b[0m',  // Yellow
    error: '\x1b[31m%s\x1b[0m'     // Red
  };
  
  console.log(colors[type], message);
}

/**
 * Run a test and track the result
 * @param {string} name - Test name
 * @param {Function} testFn - Test function
 */
async function runTest(name, testFn) {
  testResults.total++;
  
  log(`\n🧪 Running test: ${name}`);
  try {
    await testFn();
    log(`✅ Test passed: ${name}`, 'success');
    testResults.passed++;
  } catch (error) {
    log(`❌ Test failed: ${name}`, 'error');
    log(`   Error: ${error.message}`, 'error');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'error');
      log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
    }
    testResults.failed++;
  }
}

/**
 * Skip a test and track the result
 * @param {string} name - Test name
 * @param {string} reason - Reason for skipping
 */
function skipTest(name, reason) {
  testResults.total++;
  testResults.skipped++;
  log(`\n⏭️ Skipping test: ${name}`);
  log(`   Reason: ${reason}`);
}

/**
 * Get an Auth0 token for testing
 * @returns {Promise<string>} Auth0 token
 */
async function getAuth0Token() {
  if (!AUTH0_TEST_EMAIL || !AUTH0_TEST_PASSWORD) {
    throw new Error('AUTH0_TEST_EMAIL and AUTH0_TEST_PASSWORD must be set in .env.local');
  }
  
  log('🔑 Getting Auth0 token...', 'info');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/test`, {
      email: AUTH0_TEST_EMAIL,
      password: AUTH0_TEST_PASSWORD
    });
    
    if (!response.data.token) {
      throw new Error('No token returned from Auth0');
    }
    
    log('✅ Successfully obtained Auth0 token', 'success');
    return response.data.token;
  } catch (error) {
    log('❌ Failed to get Auth0 token: ' + error.message, 'error');
    throw error;
  }
}

/**
 * Test handling of invalid phone numbers
 * @param {string} token - Auth0 token
 */
async function testInvalidPhoneNumbers(token) {
  const invalidPhoneNumbers = [
    '',                  // Empty string
    'not-a-number',      // Non-numeric string
    '123',               // Too short
    '12345678901234567', // Too long
    '+',                 // Just a plus sign
    '+abc',              // Plus sign with non-numeric characters
    null,                // null
    undefined,           // undefined
  ];
  
  for (const phoneNumber of invalidPhoneNumbers) {
    log(`Testing invalid phone number: ${phoneNumber}`, 'info');
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/twilio/status`,
        { phoneNumber },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // If we get here, the request succeeded, which is not what we expect for invalid phone numbers
      log(`❌ Expected error for invalid phone number: ${phoneNumber}, but got success`, 'error');
      log(`   Response: ${JSON.stringify(response.data, null, 2)}`, 'error');
      throw new Error(`Expected error for invalid phone number: ${phoneNumber}`);
    } catch (error) {
      // We expect an error for invalid phone numbers
      if (error.response && error.response.status === 400) {
        log(`✅ Correctly rejected invalid phone number: ${phoneNumber}`, 'success');
      } else {
        // If the error is not a 400 Bad Request, something else went wrong
        log(`❌ Unexpected error for invalid phone number: ${phoneNumber}`, 'error');
        log(`   Error: ${error.message}`, 'error');
        if (error.response) {
          log(`   Status: ${error.response.status}`, 'error');
          log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
        }
        throw error;
      }
    }
  }
}

/**
 * Test rate limiting
 * @param {string} token - Auth0 token
 */
async function testRateLimiting(token) {
  const endpoint = `${API_BASE_URL}/api/twilio/numbers`;
  const requests = 15; // Number of requests to send
  
  log(`Testing rate limiting by sending ${requests} requests to ${endpoint}`, 'info');
  
  const responses = [];
  
  for (let i = 0; i < requests; i++) {
    try {
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      responses.push({
        status: response.status,
        headers: {
          'x-ratelimit-limit': response.headers['x-ratelimit-limit'],
          'x-ratelimit-remaining': response.headers['x-ratelimit-remaining'],
          'x-ratelimit-reset': response.headers['x-ratelimit-reset']
        }
      });
      
      log(`Request ${i + 1}: Status ${response.status}, Remaining: ${response.headers['x-ratelimit-remaining']}`, 'info');
    } catch (error) {
      if (error.response && error.response.status === 429) {
        log(`✅ Rate limit reached after ${i + 1} requests`, 'success');
        log(`   Retry-After: ${error.response.headers['retry-after']}`, 'info');
        return; // Test passed
      } else {
        log(`❌ Unexpected error during rate limit test`, 'error');
        log(`   Error: ${error.message}`, 'error');
        if (error.response) {
          log(`   Status: ${error.response.status}`, 'error');
          log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
        }
        throw error;
      }
    }
  }
  
  // If we get here, we didn't hit the rate limit
  log(`⚠️ Sent ${requests} requests without hitting rate limit`, 'warning');
  log(`   This may be expected if the rate limit is higher than ${requests} requests`, 'warning');
}

/**
 * Test handling of malformed JSON
 * @param {string} token - Auth0 token
 */
async function testMalformedJson(token) {
  const endpoint = `${API_BASE_URL}/api/twilio/configure`;
  
  log(`Testing handling of malformed JSON at ${endpoint}`, 'info');
  
  try {
    // Send a request with malformed JSON in the body
    await axios.post(
      endpoint,
      // This is intentionally malformed JSON
      'this is not valid JSON',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // If we get here, the request succeeded, which is not what we expect
    log(`❌ Expected error for malformed JSON, but got success`, 'error');
    throw new Error('Expected error for malformed JSON');
  } catch (error) {
    // We expect an error for malformed JSON
    if (error.response && (error.response.status === 400 || error.response.status === 422)) {
      log(`✅ Correctly rejected malformed JSON`, 'success');
    } else {
      // If the error is not a 400 Bad Request or 422 Unprocessable Entity, something else went wrong
      log(`❌ Unexpected error for malformed JSON`, 'error');
      log(`   Error: ${error.message}`, 'error');
      if (error.response) {
        log(`   Status: ${error.response.status}`, 'error');
        log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
      }
      throw error;
    }
  }
}

/**
 * Test handling of missing required fields
 * @param {string} token - Auth0 token
 */
async function testMissingRequiredFields(token) {
  const endpoint = `${API_BASE_URL}/api/twilio/configure`;
  
  log(`Testing handling of missing required fields at ${endpoint}`, 'info');
  
  try {
    // Send a request with missing required fields
    await axios.post(
      endpoint,
      // This is missing the required phoneNumber field
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // If we get here, the request succeeded, which is not what we expect
    log(`❌ Expected error for missing required fields, but got success`, 'error');
    throw new Error('Expected error for missing required fields');
  } catch (error) {
    // We expect an error for missing required fields
    if (error.response && error.response.status === 400) {
      log(`✅ Correctly rejected request with missing required fields`, 'success');
    } else {
      // If the error is not a 400 Bad Request, something else went wrong
      log(`❌ Unexpected error for missing required fields`, 'error');
      log(`   Error: ${error.message}`, 'error');
      if (error.response) {
        log(`   Status: ${error.response.status}`, 'error');
        log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
      }
      throw error;
    }
  }
}

/**
 * Test handling of invalid authentication
 */
async function testInvalidAuthentication() {
  const endpoint = `${API_BASE_URL}/api/twilio/numbers`;
  
  log(`Testing handling of invalid authentication at ${endpoint}`, 'info');
  
  // Test with no token
  try {
    await axios.get(endpoint);
    
    // If we get here, the request succeeded, which is not what we expect
    log(`❌ Expected error for no token, but got success`, 'error');
    throw new Error('Expected error for no token');
  } catch (error) {
    // We expect an error for no token
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      log(`✅ Correctly rejected request with no token`, 'success');
    } else {
      // If the error is not a 401 Unauthorized or 403 Forbidden, something else went wrong
      log(`❌ Unexpected error for no token`, 'error');
      log(`   Error: ${error.message}`, 'error');
      if (error.response) {
        log(`   Status: ${error.response.status}`, 'error');
        log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
      }
      throw error;
    }
  }
  
  // Test with invalid token
  try {
    await axios.get(endpoint, {
      headers: {
        Authorization: 'Bearer invalid-token'
      }
    });
    
    // If we get here, the request succeeded, which is not what we expect
    log(`❌ Expected error for invalid token, but got success`, 'error');
    throw new Error('Expected error for invalid token');
  } catch (error) {
    // We expect an error for invalid token
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      log(`✅ Correctly rejected request with invalid token`, 'success');
    } else {
      // If the error is not a 401 Unauthorized or 403 Forbidden, something else went wrong
      log(`❌ Unexpected error for invalid token`, 'error');
      log(`   Error: ${error.message}`, 'error');
      if (error.response) {
        log(`   Status: ${error.response.status}`, 'error');
        log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
      }
      throw error;
    }
  }
}

/**
 * Test handling of non-existent resources
 * @param {string} token - Auth0 token
 */
async function testNonExistentResources(token) {
  const endpoints = [
    `${API_BASE_URL}/api/non-existent-endpoint`,
    `${API_BASE_URL}/api/conversations/non-existent-id`,
    `${API_BASE_URL}/api/missed-calls/non-existent-id`
  ];
  
  for (const endpoint of endpoints) {
    log(`Testing handling of non-existent resource at ${endpoint}`, 'info');
    
    try {
      await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // If we get here, the request succeeded, which is not what we expect
      log(`❌ Expected error for non-existent resource at ${endpoint}, but got success`, 'error');
      throw new Error(`Expected error for non-existent resource at ${endpoint}`);
    } catch (error) {
      // We expect an error for non-existent resources
      if (error.response && (error.response.status === 404 || error.response.status === 400)) {
        log(`✅ Correctly rejected request for non-existent resource at ${endpoint}`, 'success');
      } else {
        // If the error is not a 404 Not Found or 400 Bad Request, something else went wrong
        log(`❌ Unexpected error for non-existent resource at ${endpoint}`, 'error');
        log(`   Error: ${error.message}`, 'error');
        if (error.response) {
          log(`   Status: ${error.response.status}`, 'error');
          log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
        }
        throw error;
      }
    }
  }
}

/**
 * Test handling of concurrent requests
 * @param {string} token - Auth0 token
 */
async function testConcurrentRequests(token) {
  const endpoint = `${API_BASE_URL}/api/twilio/numbers`;
  const concurrentRequests = 5;
  
  log(`Testing handling of ${concurrentRequests} concurrent requests to ${endpoint}`, 'info');
  
  const requests = [];
  for (let i = 0; i < concurrentRequests; i++) {
    requests.push(
      axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    );
  }
  
  try {
    const responses = await Promise.all(requests);
    
    // Check that all requests succeeded
    const allSucceeded = responses.every(response => response.status === 200);
    
    if (allSucceeded) {
      log(`✅ All ${concurrentRequests} concurrent requests succeeded`, 'success');
    } else {
      log(`❌ Some concurrent requests failed`, 'error');
      responses.forEach((response, i) => {
        log(`   Request ${i + 1}: Status ${response.status}`, response.status === 200 ? 'success' : 'error');
      });
      throw new Error('Some concurrent requests failed');
    }
  } catch (error) {
    log(`❌ Error during concurrent requests test`, 'error');
    log(`   Error: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Test handling of large payloads
 * @param {string} token - Auth0 token
 */
async function testLargePayloads(token) {
  const endpoint = `${API_BASE_URL}/api/webhooks/zapier`;
  
  log(`Testing handling of large payloads at ${endpoint}`, 'info');
  
  // Generate a large payload
  const largePayload = {
    event: 'test_large_payload',
    data: {
      items: Array(1000).fill().map((_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `This is a description for item ${i}. It's intentionally long to create a large payload.`.repeat(10),
        metadata: {
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          tags: Array(20).fill().map((_, j) => `tag-${j}`),
          properties: Array(20).fill().map((_, j) => ({
            key: `property-${j}`,
            value: `value-${j}`.repeat(10)
          }))
        }
      }))
    }
  };
  
  try {
    const response = await axios.post(
      endpoint,
      largePayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': process.env.ZAPIER_WEBHOOK_SECRET || 'test-secret'
        }
      }
    );
    
    // Check if the request succeeded
    if (response.status === 200) {
      log(`✅ Successfully processed large payload`, 'success');
    } else {
      log(`❌ Unexpected status code for large payload: ${response.status}`, 'error');
      log(`   Response: ${JSON.stringify(response.data, null, 2)}`, 'error');
      throw new Error(`Unexpected status code for large payload: ${response.status}`);
    }
  } catch (error) {
    // If the error is a 413 Payload Too Large, that's expected
    if (error.response && error.response.status === 413) {
      log(`✅ Correctly rejected large payload with 413 Payload Too Large`, 'success');
    } else {
      log(`❌ Unexpected error for large payload`, 'error');
      log(`   Error: ${error.message}`, 'error');
      if (error.response) {
        log(`   Status: ${error.response.status}`, 'error');
        log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
      }
      throw error;
    }
  }
}

/**
 * Main function
 */
async function main() {
  log('\n🧪 SmartText AI Edge Case Tests');
  log('==============================');
  
  try {
    // Test invalid authentication
    await runTest('Invalid Authentication', testInvalidAuthentication);
    
    // Get Auth0 token for authenticated tests
    const token = await getAuth0Token();
    
    // Run edge case tests
    await runTest('Invalid Phone Numbers', async () => {
      await testInvalidPhoneNumbers(token);
    });
    
    await runTest('Rate Limiting', async () => {
      await testRateLimiting(token);
    });
    
    await runTest('Malformed JSON', async () => {
      await testMalformedJson(token);
    });
    
    await runTest('Missing Required Fields', async () => {
      await testMissingRequiredFields(token);
    });
    
    await runTest('Non-Existent Resources', async () => {
      await testNonExistentResources(token);
    });
    
    await runTest('Concurrent Requests', async () => {
      await testConcurrentRequests(token);
    });
    
    await runTest('Large Payloads', async () => {
      await testLargePayloads(token);
    });
    
    // Print test results
    log('\n📊 Test Results:', 'info');
    log(`   Total tests: ${testResults.total}`, 'info');
    log(`   Passed: ${testResults.passed}`, 'success');
    log(`   Failed: ${testResults.failed}`, 'error');
    log(`   Skipped: ${testResults.skipped}`, 'warning');
    
    if (testResults.failed > 0) {
      log('\n❌ Some tests failed. Please check the logs for details.', 'error');
      process.exit(1);
    } else {
      log('\n✅ All tests passed successfully!', 'success');
    }
  } catch (error) {
    log(`\n❌ Unhandled error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  log(`❌ Unhandled error: ${error.message}`, 'error');
  process.exit(1);
});
