#!/usr/bin/env node

/**
 * Security Infrastructure Testing Script
 * 
 * Tests the security middleware, rate limiting, audit logging,
 * and input validation systems.
 */

const { performance } = require('perf_hooks');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  testEndpoint: '/api/create-business-trial',
  verbose: process.argv.includes('--verbose'),
  skipRateLimit: process.argv.includes('--skip-rate-limit'),
  testAttacks: process.argv.includes('--test-attacks')
};

// Test utilities
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warn' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function logVerbose(message) {
  if (TEST_CONFIG.verbose) {
    log(message, 'info');
  }
}

async function makeRequest(url, options = {}) {
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SecurityTest/1.0',
        ...options.headers
      },
      ...options
    });
    
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = { error: 'Failed to parse response' };
    }
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      duration
    };
  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    return {
      status: 0,
      headers: {},
      data: { error: error.message },
      duration,
      networkError: true
    };
  }
}

// Test cases
const TEST_CASES = {
  // Valid request test
  validRequest: {
    name: 'Valid Business Creation',
    description: 'Test successful business creation with valid data',
    payload: {
      name: 'Test Security Business',
      phoneNumber: '+1234567890',
      industry: 'Technology',
      email: 'test@example.com',
      address: '123 Test St, Test City, TC 12345'
    },
    expectedStatus: 201,
    test: (response) => {
      return response.data.success === true && response.data.businessId;
    }
  },

  // Input validation tests
  missingRequiredFields: {
    name: 'Missing Required Fields',
    description: 'Test validation of required fields',
    payload: {
      name: 'Test Business'
      // Missing phoneNumber and industry
    },
    expectedStatus: 400,
    test: (response) => {
      return response.data.error === 'Missing required fields' && 
             response.data.missingFields &&
             response.data.missingFields.includes('phoneNumber') &&
             response.data.missingFields.includes('industry');
    }
  },

  invalidEmail: {
    name: 'Invalid Email Format',
    description: 'Test email validation',
    payload: {
      name: 'Test Business',
      phoneNumber: '+1234567890',
      industry: 'Technology',
      email: 'invalid-email-format'
    },
    expectedStatus: 400,
    test: (response) => {
      return response.data.error === 'Invalid email format';
    }
  },

  // Security headers test
  securityHeaders: {
    name: 'Security Headers',
    description: 'Test presence of security headers',
    payload: {
      name: 'Test Business',
      phoneNumber: '+1234567890',
      industry: 'Technology'
    },
    expectedStatus: 201,
    test: (response) => {
      const headers = response.headers;
      const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'referrer-policy'
      ];
      
      return requiredHeaders.every(header => headers[header]);
    }
  },

  // Method validation test
  invalidMethod: {
    name: 'Invalid HTTP Method',
    description: 'Test rejection of non-POST methods',
    method: 'GET',
    expectedStatus: 405,
    test: (response) => {
      return response.data.error === 'Method not allowed' &&
             response.headers.allow === 'POST';
    }
  }
};

// Attack pattern tests (only run with --test-attacks flag)
const ATTACK_TESTS = {
  sqlInjection: {
    name: 'SQL Injection Attempt',
    description: 'Test detection of SQL injection patterns',
    payload: {
      name: "'; DROP TABLE businesses; --",
      phoneNumber: '+1234567890',
      industry: 'Technology'
    },
    expectedStatus: [400, 201], // May be blocked or sanitized
    test: (response) => {
      // Should either block the request or sanitize the input
      return response.status === 400 || 
             (response.status === 201 && !response.data.data.name.includes('DROP TABLE'));
    }
  },

  xssAttempt: {
    name: 'XSS Injection Attempt',
    description: 'Test detection of XSS patterns',
    payload: {
      name: '<script>alert("xss")</script>',
      phoneNumber: '+1234567890',
      industry: 'Technology'
    },
    expectedStatus: [400, 201], // May be blocked or sanitized
    test: (response) => {
      // Should either block the request or sanitize the input
      return response.status === 400 || 
             (response.status === 201 && !response.data.data.name.includes('<script>'));
    }
  },

  oversizedPayload: {
    name: 'Oversized Input',
    description: 'Test handling of oversized input',
    payload: {
      name: 'A'.repeat(1000), // Very long name
      phoneNumber: '+1234567890',
      industry: 'Technology'
    },
    expectedStatus: [400, 201], // May be blocked or truncated
    test: (response) => {
      // Should either block or truncate the input
      return response.status === 400 || 
             (response.status === 201 && response.data.data.name.length <= 500);
    }
  }
};

// Rate limiting test
async function testRateLimit() {
  if (TEST_CONFIG.skipRateLimit) {
    log('Skipping rate limit tests (--skip-rate-limit flag)', 'warn');
    return { passed: 0, total: 0 };
  }

  log('Testing rate limiting...', 'info');
  
  const testPayload = {
    name: 'Rate Limit Test',
    phoneNumber: '+1234567890',
    industry: 'Technology'
  };

  let requests = [];
  const maxRequests = 5; // Should exceed trial form rate limit (3 per hour)
  
  // Send multiple requests quickly
  for (let i = 0; i < maxRequests; i++) {
    logVerbose(`Sending rate limit test request ${i + 1}/${maxRequests}`);
    const promise = makeRequest(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.testEndpoint}`, {
      body: JSON.stringify(testPayload)
    });
    requests.push(promise);
  }

  const responses = await Promise.all(requests);
  
  // Check if any requests were rate limited
  const rateLimitedResponses = responses.filter(r => r.status === 429);
  const successfulResponses = responses.filter(r => r.status === 201);
  
  logVerbose(`Rate limit test results: ${successfulResponses.length} successful, ${rateLimitedResponses.length} rate limited`);
  
  // Should have some rate limited responses if rate limiting is working
  if (rateLimitedResponses.length > 0) {
    log('Rate limiting is working correctly', 'success');
    
    // Check rate limit headers
    const rateLimitResponse = rateLimitedResponses[0];
    const hasRateLimitHeaders = rateLimitResponse.headers['x-ratelimit-limit'] &&
                               rateLimitResponse.headers['x-ratelimit-remaining'] &&
                               rateLimitResponse.headers['retry-after'];
    
    if (hasRateLimitHeaders) {
      log('Rate limit headers are present', 'success');
      return { passed: 2, total: 2 };
    } else {
      log('Rate limit headers are missing', 'error');
      return { passed: 1, total: 2 };
    }
  } else {
    log('Rate limiting may not be working (no 429 responses)', 'warn');
    return { passed: 0, total: 2 };
  }
}

// Run individual test case
async function runTestCase(testName, testCase) {
  logVerbose(`Running test: ${testCase.name}`);
  
  const method = testCase.method || 'POST';
  const url = `${TEST_CONFIG.baseUrl}${TEST_CONFIG.testEndpoint}`;
  
  const options = {
    method,
    ...(testCase.payload && { body: JSON.stringify(testCase.payload) })
  };

  const response = await makeRequest(url, options);
  
  // Check expected status
  const expectedStatuses = Array.isArray(testCase.expectedStatus) 
    ? testCase.expectedStatus 
    : [testCase.expectedStatus];
  
  const statusMatch = expectedStatuses.includes(response.status);
  
  // Run custom test function
  const customTestPassed = testCase.test ? testCase.test(response) : true;
  
  const passed = statusMatch && customTestPassed;
  
  if (passed) {
    log(`✅ ${testCase.name}: PASSED`, 'success');
  } else {
    log(`❌ ${testCase.name}: FAILED`, 'error');
    if (!statusMatch) {
      log(`   Expected status: ${expectedStatuses.join(' or ')}, got: ${response.status}`, 'error');
    }
    if (!customTestPassed) {
      log(`   Custom test failed`, 'error');
    }
    if (TEST_CONFIG.verbose) {
      log(`   Response: ${JSON.stringify(response.data, null, 2)}`, 'error');
    }
  }
  
  return passed;
}

// Main test runner
async function runSecurityTests() {
  log('🔒 Starting Security Infrastructure Tests', 'info');
  log(`Testing endpoint: ${TEST_CONFIG.baseUrl}${TEST_CONFIG.testEndpoint}`, 'info');
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Run basic test cases
  log('\n📋 Running Basic Security Tests...', 'info');
  for (const [testName, testCase] of Object.entries(TEST_CASES)) {
    totalTests++;
    const passed = await runTestCase(testName, testCase);
    if (passed) passedTests++;
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Run attack tests if enabled
  if (TEST_CONFIG.testAttacks) {
    log('\n🚨 Running Attack Pattern Tests...', 'info');
    for (const [testName, testCase] of Object.entries(ATTACK_TESTS)) {
      totalTests++;
      const passed = await runTestCase(testName, testCase);
      if (passed) passedTests++;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Run rate limiting tests
  log('\n🚦 Running Rate Limiting Tests...', 'info');
  const rateLimitResults = await testRateLimit();
  totalTests += rateLimitResults.total;
  passedTests += rateLimitResults.passed;
  
  // Summary
  log('\n📊 Test Summary', 'info');
  log(`Total tests: ${totalTests}`, 'info');
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'success' : 'warn');
  log(`Failed: ${totalTests - passedTests}`, totalTests - passedTests === 0 ? 'success' : 'error');
  log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`, 'info');
  
  if (passedTests === totalTests) {
    log('\n🎉 All security tests passed!', 'success');
    process.exit(0);
  } else {
    log('\n⚠️ Some security tests failed. Please review the results above.', 'warn');
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  // Check if server is running
  log('Checking if server is running...', 'info');
  
  makeRequest(`${TEST_CONFIG.baseUrl}/api/health`)
    .then(response => {
      if (response.status === 200 || response.status === 404) {
        log('Server is responding, starting tests...', 'success');
        return runSecurityTests();
      } else {
        throw new Error(`Server returned status ${response.status}`);
      }
    })
    .catch(error => {
      log(`Failed to connect to server at ${TEST_CONFIG.baseUrl}`, 'error');
      log('Please ensure the development server is running with: npm run dev', 'error');
      log(`Error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = {
  runSecurityTests,
  TEST_CASES,
  ATTACK_TESTS
};
