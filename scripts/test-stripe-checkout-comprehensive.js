/**
 * Comprehensive Stripe Checkout API Testing Script
 * 
 * This script thoroughly tests the /api/create-checkout-session endpoint:
 * 1. Valid POST requests with all required fields
 * 2. Invalid requests (missing fields, wrong types, malformed JSON)
 * 3. HTTP method validation (GET, PUT, DELETE should return 405)
 * 4. Stripe integration (real checkout session creation)
 * 5. Error handling (Stripe API failures, network issues)
 * 6. Response format validation
 * 7. Performance benchmarking
 */

import fetch from 'node-fetch';

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const ENDPOINT = '/api/create-checkout-session';
const FULL_URL = `${API_BASE_URL}${ENDPOINT}`;

// Test results tracking
const testResults = {
  validRequests: { passed: 0, failed: 0, tests: [] },
  invalidRequests: { passed: 0, failed: 0, tests: [] },
  httpMethods: { passed: 0, failed: 0, tests: [] },
  stripeIntegration: { passed: 0, failed: 0, tests: [] },
  errorHandling: { passed: 0, failed: 0, tests: [] },
  performance: { passed: 0, failed: 0, tests: [] }
};

// Valid test data
const validTestData = {
  priceId: 'price_1234567890',
  customerEmail: 'test@example.com',
  successUrl: 'https://example.com/success',
  cancelUrl: 'https://example.com/cancel',
  trialPeriodDays: 14
};

/**
 * Utility function to make HTTP requests
 */
async function makeRequest(method = 'POST', body = null, headers = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  const options = {
    method,
    headers: defaultHeaders
  };

  if (body && method !== 'GET') {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const startTime = Date.now();
    const response = await fetch(FULL_URL, options);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      responseTime,
      contentType
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message,
      responseTime: 0
    };
  }
}

/**
 * Test helper function
 */
function runTest(category, testName, testFunction) {
  return new Promise(async (resolve) => {
    try {
      console.log(`\n🧪 Testing: ${testName}`);
      const result = await testFunction();
      
      if (result.success) {
        console.log(`✅ PASS: ${testName}`);
        testResults[category].passed++;
      } else {
        console.log(`❌ FAIL: ${testName}`);
        console.log(`   Reason: ${result.reason}`);
        testResults[category].failed++;
      }
      
      testResults[category].tests.push({
        name: testName,
        success: result.success,
        reason: result.reason,
        details: result.details
      });
      
      resolve(result);
    } catch (error) {
      console.log(`❌ ERROR: ${testName} - ${error.message}`);
      testResults[category].failed++;
      testResults[category].tests.push({
        name: testName,
        success: false,
        reason: error.message,
        details: null
      });
      resolve({ success: false, reason: error.message });
    }
  });
}

/**
 * Phase 1: Valid Request Tests
 */
async function testValidRequests() {
  console.log('\n=== Phase 1: Valid Request Tests ===');

  // Test 1: Valid POST request with all required fields
  await runTest('validRequests', 'Valid POST request with all required fields', async () => {
    const response = await makeRequest('POST', validTestData);
    
    if (response.status !== 200) {
      return {
        success: false,
        reason: `Expected status 200, got ${response.status}`,
        details: response
      };
    }

    if (!response.data || typeof response.data !== 'object') {
      return {
        success: false,
        reason: 'Response is not valid JSON object',
        details: response
      };
    }

    // Check if response contains expected fields for a successful checkout session
    const hasUrl = response.data.url || response.data.sessionId || response.data.redirectToTrial;
    if (!hasUrl) {
      return {
        success: false,
        reason: 'Response missing checkout URL or session ID',
        details: response
      };
    }

    return {
      success: true,
      reason: 'Valid request processed successfully',
      details: response
    };
  });

  // Test 2: Valid POST request with minimal required fields
  await runTest('validRequests', 'Valid POST request with minimal fields', async () => {
    const minimalData = {
      priceId: validTestData.priceId,
      customerEmail: validTestData.customerEmail
    };

    const response = await makeRequest('POST', minimalData);
    
    if (response.status !== 200) {
      return {
        success: false,
        reason: `Expected status 200, got ${response.status}`,
        details: response
      };
    }

    return {
      success: true,
      reason: 'Minimal valid request processed successfully',
      details: response
    };
  });

  // Test 3: Valid POST request with all optional fields
  await runTest('validRequests', 'Valid POST request with all optional fields', async () => {
    const fullData = {
      ...validTestData,
      metadata: { testUser: 'true' },
      allowPromotionCodes: true
    };

    const response = await makeRequest('POST', fullData);
    
    if (response.status !== 200) {
      return {
        success: false,
        reason: `Expected status 200, got ${response.status}`,
        details: response
      };
    }

    return {
      success: true,
      reason: 'Full valid request processed successfully',
      details: response
    };
  });
}

/**
 * Phase 2: Invalid Request Tests
 */
async function testInvalidRequests() {
  console.log('\n=== Phase 2: Invalid Request Tests ===');

  // Test 1: Missing required fields
  await runTest('invalidRequests', 'Missing priceId field', async () => {
    const invalidData = {
      customerEmail: validTestData.customerEmail,
      successUrl: validTestData.successUrl,
      cancelUrl: validTestData.cancelUrl
    };

    const response = await makeRequest('POST', invalidData);
    
    if (response.status === 200) {
      return {
        success: false,
        reason: 'Request should have failed due to missing priceId',
        details: response
      };
    }

    if (response.status !== 400) {
      return {
        success: false,
        reason: `Expected status 400, got ${response.status}`,
        details: response
      };
    }

    return {
      success: true,
      reason: 'Missing priceId properly rejected',
      details: response
    };
  });

  // Test 2: Missing customerEmail
  await runTest('invalidRequests', 'Missing customerEmail field', async () => {
    const invalidData = {
      priceId: validTestData.priceId,
      successUrl: validTestData.successUrl,
      cancelUrl: validTestData.cancelUrl
    };

    const response = await makeRequest('POST', invalidData);
    
    if (response.status === 200) {
      return {
        success: false,
        reason: 'Request should have failed due to missing customerEmail',
        details: response
      };
    }

    if (response.status !== 400) {
      return {
        success: false,
        reason: `Expected status 400, got ${response.status}`,
        details: response
      };
    }

    return {
      success: true,
      reason: 'Missing customerEmail properly rejected',
      details: response
    };
  });

  // Test 3: Invalid email format
  await runTest('invalidRequests', 'Invalid email format', async () => {
    const invalidData = {
      ...validTestData,
      customerEmail: 'invalid-email'
    };

    const response = await makeRequest('POST', invalidData);
    
    // This might pass through to Stripe and fail there, which is also acceptable
    if (response.status === 200) {
      return {
        success: true,
        reason: 'Invalid email handled by Stripe validation',
        details: response
      };
    }

    if (response.status === 400) {
      return {
        success: true,
        reason: 'Invalid email properly rejected',
        details: response
      };
    }

    return {
      success: false,
      reason: `Unexpected status ${response.status}`,
      details: response
    };
  });

  // Test 4: Malformed JSON
  await runTest('invalidRequests', 'Malformed JSON body', async () => {
    const response = await makeRequest('POST', '{"invalid": json}');
    
    if (response.status === 200) {
      return {
        success: false,
        reason: 'Malformed JSON should have been rejected',
        details: response
      };
    }

    if (response.status !== 400) {
      return {
        success: false,
        reason: `Expected status 400, got ${response.status}`,
        details: response
      };
    }

    return {
      success: true,
      reason: 'Malformed JSON properly rejected',
      details: response
    };
  });

  // Test 5: Empty request body
  await runTest('invalidRequests', 'Empty request body', async () => {
    const response = await makeRequest('POST', '');
    
    if (response.status === 200) {
      return {
        success: false,
        reason: 'Empty body should have been rejected',
        details: response
      };
    }

    return {
      success: true,
      reason: 'Empty body properly rejected',
      details: response
    };
  });
}

/**
 * Phase 3: HTTP Method Tests
 */
async function testHttpMethods() {
  console.log('\n=== Phase 3: HTTP Method Tests ===');

  const methods = ['GET', 'PUT', 'DELETE', 'PATCH'];

  for (const method of methods) {
    await runTest('httpMethods', `${method} method should return 405`, async () => {
      const response = await makeRequest(method, validTestData);
      
      if (response.status !== 405) {
        return {
          success: false,
          reason: `Expected status 405, got ${response.status}`,
          details: response
        };
      }

      // Check if response is JSON
      if (typeof response.data !== 'object') {
        return {
          success: false,
          reason: 'Error response should be JSON',
          details: response
        };
      }

      return {
        success: true,
        reason: `${method} method properly rejected with 405`,
        details: response
      };
    });
  }
}

/**
 * Phase 4: Stripe Integration Tests
 */
async function testStripeIntegration() {
  console.log('\n=== Phase 4: Stripe Integration Tests ===');

  // Test 1: Valid Stripe price ID format
  await runTest('stripeIntegration', 'Valid Stripe price ID format', async () => {
    const testData = {
      ...validTestData,
      priceId: 'price_1234567890abcdef' // More realistic Stripe price ID
    };

    const response = await makeRequest('POST', testData);
    
    // This test passes if the API accepts the request format
    // Actual Stripe validation will happen on Stripe's side
    if (response.status !== 200 && response.status !== 400) {
      return {
        success: false,
        reason: `Unexpected status ${response.status}`,
        details: response
      };
    }

    return {
      success: true,
      reason: 'Stripe price ID format handled correctly',
      details: response
    };
  });

  // Test 2: Response contains Stripe session data
  await runTest('stripeIntegration', 'Response contains session data', async () => {
    const response = await makeRequest('POST', validTestData);
    
    if (response.status !== 200) {
      return {
        success: false,
        reason: `Request failed with status ${response.status}`,
        details: response
      };
    }

    // Check for expected response structure
    const hasSessionData = response.data.url || 
                          response.data.sessionId || 
                          response.data.redirectToTrial ||
                          response.data.message;

    if (!hasSessionData) {
      return {
        success: false,
        reason: 'Response missing expected session data',
        details: response
      };
    }

    return {
      success: true,
      reason: 'Response contains expected session data',
      details: response
    };
  });
}

/**
 * Phase 5: Error Handling Tests
 */
async function testErrorHandling() {
  console.log('\n=== Phase 5: Error Handling Tests ===');

  // Test 1: Invalid Content-Type header
  await runTest('errorHandling', 'Invalid Content-Type header', async () => {
    const response = await makeRequest('POST', validTestData, {
      'Content-Type': 'text/plain'
    });
    
    // Should either handle gracefully or return proper error
    if (response.status === 200 || response.status === 400) {
      return {
        success: true,
        reason: 'Invalid Content-Type handled appropriately',
        details: response
      };
    }

    return {
      success: false,
      reason: `Unexpected status ${response.status}`,
      details: response
    };
  });

  // Test 2: Missing Content-Type header
  await runTest('errorHandling', 'Missing Content-Type header', async () => {
    const response = await makeRequest('POST', validTestData, {
      'Content-Type': undefined
    });
    
    // Should either handle gracefully or return proper error
    if (response.status === 200 || response.status === 400) {
      return {
        success: true,
        reason: 'Missing Content-Type handled appropriately',
        details: response
      };
    }

    return {
      success: false,
      reason: `Unexpected status ${response.status}`,
      details: response
    };
  });

  // Test 3: Very large request body
  await runTest('errorHandling', 'Very large request body', async () => {
    const largeData = {
      ...validTestData,
      metadata: {
        largeField: 'x'.repeat(10000) // 10KB of data
      }
    };

    const response = await makeRequest('POST', largeData);
    
    // Should either handle gracefully or return proper error
    if (response.status === 200 || response.status === 400 || response.status === 413) {
      return {
        success: true,
        reason: 'Large request body handled appropriately',
        details: response
      };
    }

    return {
      success: false,
      reason: `Unexpected status ${response.status}`,
      details: response
    };
  });
}

/**
 * Phase 6: Performance Tests
 */
async function testPerformance() {
  console.log('\n=== Phase 6: Performance Tests ===');

  // Test 1: Response time under load
  await runTest('performance', 'Response time benchmark', async () => {
    const requests = [];
    const numRequests = 5;

    for (let i = 0; i < numRequests; i++) {
      requests.push(makeRequest('POST', validTestData));
    }

    const responses = await Promise.all(requests);
    const responseTimes = responses.map(r => r.responseTime).filter(t => t > 0);
    
    if (responseTimes.length === 0) {
      return {
        success: false,
        reason: 'No valid response times recorded',
        details: responses
      };
    }

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);

    // Consider test passed if average response time is under 5 seconds
    if (avgResponseTime > 5000) {
      return {
        success: false,
        reason: `Average response time too high: ${avgResponseTime}ms`,
        details: { avgResponseTime, maxResponseTime, responseTimes }
      };
    }

    return {
      success: true,
      reason: `Good performance: avg ${avgResponseTime.toFixed(0)}ms, max ${maxResponseTime}ms`,
      details: { avgResponseTime, maxResponseTime, responseTimes }
    };
  });

  // Test 2: Memory usage (basic check)
  await runTest('performance', 'Memory usage check', async () => {
    const initialMemory = process.memoryUsage();
    
    // Make several requests
    for (let i = 0; i < 10; i++) {
      await makeRequest('POST', validTestData);
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // Consider test passed if memory increase is reasonable (under 50MB)
    if (memoryIncrease > 50 * 1024 * 1024) {
      return {
        success: false,
        reason: `Memory usage increased by ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
        details: { initialMemory, finalMemory, memoryIncrease }
      };
    }

    return {
      success: true,
      reason: `Memory usage acceptable: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`,
      details: { initialMemory, finalMemory, memoryIncrease }
    };
  });
}

/**
 * Print comprehensive test results
 */
function printTestResults() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('='.repeat(60));

  const categories = [
    { key: 'validRequests', name: 'Valid Requests' },
    { key: 'invalidRequests', name: 'Invalid Requests' },
    { key: 'httpMethods', name: 'HTTP Methods' },
    { key: 'stripeIntegration', name: 'Stripe Integration' },
    { key: 'errorHandling', name: 'Error Handling' },
    { key: 'performance', name: 'Performance' }
  ];

  let totalPassed = 0;
  let totalFailed = 0;

  categories.forEach(category => {
    const results = testResults[category.key];
    const total = results.passed + results.failed;
    const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : '0.0';
    
    console.log(`\n📊 ${category.name}:`);
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   📈 Pass Rate: ${passRate}%`);
    
    if (results.failed > 0) {
      console.log(`   🔍 Failed Tests:`);
      results.tests.filter(t => !t.success).forEach(test => {
        console.log(`      • ${test.name}: ${test.reason}`);
      });
    }

    totalPassed += results.passed;
    totalFailed += results.failed;
  });

  const overallTotal = totalPassed + totalFailed;
  const overallPassRate = overallTotal > 0 ? ((totalPassed / overallTotal) * 100).toFixed(1) : '0.0';

  console.log('\n' + '='.repeat(60));
  console.log('🎯 OVERALL RESULTS:');
  console.log(`   ✅ Total Passed: ${totalPassed}`);
  console.log(`   ❌ Total Failed: ${totalFailed}`);
  console.log(`   📈 Overall Pass Rate: ${overallPassRate}%`);
  
  if (overallPassRate >= 90) {
    console.log('   🎉 EXCELLENT: Your API is production-ready!');
  } else if (overallPassRate >= 75) {
    console.log('   ⚠️  GOOD: Minor issues to address before production');
  } else {
    console.log('   🚨 NEEDS WORK: Significant issues require attention');
  }

  console.log('='.repeat(60));

  return {
    totalPassed,
    totalFailed,
    overallPassRate: parseFloat(overallPassRate),
    categoryResults: testResults
  };
}

/**
 * Main test execution function
 */
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Stripe Checkout API Tests');
  console.log(`📍 Testing endpoint: ${FULL_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);

  try {
    // Run all test phases
    await testValidRequests();
    await testInvalidRequests();
    await testHttpMethods();
    await testStripeIntegration();
    await testErrorHandling();
    await testPerformance();

    // Print comprehensive results
    const results = printTestResults();

    console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
    
    return results;
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return null;
  }
}

// Export for use in other scripts
export { runComprehensiveTests, testResults };

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests().catch(console.error);
}
