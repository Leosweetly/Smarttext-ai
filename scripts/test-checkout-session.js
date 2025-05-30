#!/usr/bin/env node

/**
 * Test script for create-checkout-session endpoint
 * Verifies that the endpoint returns proper JSON responses and handles errors correctly
 */

const https = require('https');
const http = require('http');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  endpoint: '/api/create-checkout-session'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody,
            rawBody: body
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: null,
            rawBody: body,
            parseError: e.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testCheckoutSessionEndpoint() {
  log('\n=== Checkout Session Endpoint Test ===', 'cyan');
  log(`Testing endpoint: ${TEST_CONFIG.baseUrl}${TEST_CONFIG.endpoint}`, 'blue');
  
  const url = new URL(TEST_CONFIG.baseUrl + TEST_CONFIG.endpoint);
  
  const baseOptions = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    protocol: url.protocol,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Checkout-Session-Test/1.0'
    }
  };
  
  // Test 1: Valid POST request
  log('\n1. Testing valid POST request...', 'yellow');
  try {
    const testData = {
      customerEmail: 'test@example.com'
    };
    
    const response = await makeRequest({
      ...baseOptions,
      method: 'POST'
    }, testData);
    
    log(`Response Status: ${response.statusCode}`, 'blue');
    log('Response Headers:', 'blue');
    console.log(JSON.stringify(response.headers, null, 2));
    
    if (response.body) {
      log('Response Body:', 'blue');
      console.log(JSON.stringify(response.body, null, 2));
    } else {
      log('Raw Response Body:', 'blue');
      console.log(response.rawBody);
      if (response.parseError) {
        log(`JSON Parse Error: ${response.parseError}`, 'red');
      }
    }
    
    // Validate response
    if (response.statusCode === 200) {
      if (response.body && response.body.url) {
        log('✅ SUCCESS: Checkout session created with URL', 'green');
        log(`Checkout URL: ${response.body.url}`, 'blue');
        if (response.body.sessionId) {
          log(`Session ID: ${response.body.sessionId}`, 'blue');
        }
      } else {
        log('❌ Response missing checkout URL', 'red');
      }
    } else if (response.statusCode === 500) {
      log('❌ SERVER ERROR: Check environment variables and Stripe configuration', 'red');
      if (response.body && response.body.message) {
        log(`Error: ${response.body.message}`, 'red');
      }
    } else {
      log(`❌ UNEXPECTED STATUS: ${response.statusCode}`, 'red');
    }
    
  } catch (error) {
    log(`❌ REQUEST FAILED: ${error.message}`, 'red');
    console.error(error);
  }
  
  // Test 2: POST without email (should still work)
  log('\n2. Testing POST without email...', 'yellow');
  try {
    const response = await makeRequest({
      ...baseOptions,
      method: 'POST'
    }, {});
    
    log(`Response Status: ${response.statusCode}`, 'blue');
    
    if (response.statusCode === 200) {
      log('✅ SUCCESS: Checkout session created without email', 'green');
    } else {
      log(`❌ Failed to create session without email: ${response.statusCode}`, 'red');
    }
    
  } catch (error) {
    log(`❌ REQUEST FAILED: ${error.message}`, 'red');
  }
  
  // Test 3: GET request (should return 405)
  log('\n3. Testing GET request (should return 405)...', 'yellow');
  try {
    const response = await makeRequest({
      ...baseOptions,
      method: 'GET'
    });
    
    log(`Response Status: ${response.statusCode}`, 'blue');
    
    if (response.statusCode === 405) {
      log('✅ Correctly rejected GET request with 405', 'green');
      if (response.body && response.body.error) {
        log(`Error message: ${response.body.error}`, 'blue');
      }
    } else {
      log(`❌ Should have returned 405, got ${response.statusCode}`, 'red');
    }
    
  } catch (error) {
    log(`❌ REQUEST FAILED: ${error.message}`, 'red');
  }
  
  // Test 4: Invalid JSON
  log('\n4. Testing invalid JSON...', 'yellow');
  try {
    const req = http.request({
      ...baseOptions,
      method: 'POST'
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        log(`Response Status: ${res.statusCode}`, 'blue');
        
        try {
          const jsonBody = JSON.parse(body);
          if (res.statusCode === 400 && jsonBody.error) {
            log('✅ Correctly rejected invalid JSON', 'green');
            log(`Error: ${jsonBody.error}`, 'blue');
          } else {
            log('❌ Should have rejected invalid JSON', 'red');
          }
        } catch (e) {
          log('❌ Response was not valid JSON', 'red');
        }
      });
    });
    
    req.write('invalid json{');
    req.end();
    
  } catch (error) {
    log(`❌ REQUEST FAILED: ${error.message}`, 'red');
  }
  
  // Test 5: Invalid email format
  log('\n5. Testing invalid email format...', 'yellow');
  try {
    const testData = {
      customerEmail: 'invalid-email'
    };
    
    const response = await makeRequest({
      ...baseOptions,
      method: 'POST'
    }, testData);
    
    log(`Response Status: ${response.statusCode}`, 'blue');
    
    if (response.statusCode === 400) {
      log('✅ Correctly rejected invalid email format', 'green');
    } else if (response.statusCode === 200) {
      log('⚠️  Endpoint accepted invalid email (may continue without email)', 'yellow');
    } else {
      log(`❌ Unexpected response: ${response.statusCode}`, 'red');
    }
    
  } catch (error) {
    log(`❌ REQUEST FAILED: ${error.message}`, 'red');
  }
}

async function runCheckoutTests() {
  log('🚀 Starting Checkout Session Tests...', 'cyan');
  
  try {
    await testCheckoutSessionEndpoint();
    
    log('\n=== Checkout Session Test Summary ===', 'cyan');
    log('✅ Checkout session endpoint tests completed', 'green');
    log('📋 Manual verification steps:', 'yellow');
    log('1. Check that the endpoint returns valid JSON responses', 'blue');
    log('2. Verify Stripe environment variables are configured', 'blue');
    log('3. Test the actual checkout flow in a browser', 'blue');
    log('4. Confirm the endpoint is accessible in production', 'blue');
    
  } catch (error) {
    log(`❌ Test suite failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runCheckoutTests();
}

module.exports = {
  testCheckoutSessionEndpoint,
  runCheckoutTests
};
