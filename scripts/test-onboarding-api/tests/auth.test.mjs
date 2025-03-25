/**
 * Authentication tests for the onboarding API
 * 
 * This module tests authentication scenarios for the onboarding API endpoints.
 */

import { get, post } from '../utils/request.mjs';
import { createAuthHeaders } from '../utils/auth.mjs';
import { isSuccessful, isError } from '../utils/validation.mjs';
import config from '../config.mjs';

/**
 * Test authentication scenarios
 * @returns {Object} Test results
 */
export async function runAuthTests() {
  console.log('\n=== Running Authentication Tests ===');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
  };
  
  // Skip auth tests if auth is disabled
  if (!config.authEnabled) {
    console.log('Authentication is disabled in this environment. Skipping auth tests.');
    results.skipped = 4;
    return results;
  }
  
  // Test 1: Valid authentication token
  try {
    console.log('\n--- Test: Valid authentication token ---');
    const userId = config.testUsers.existing;
    const response = await get('/', { 
      userId,
      skipAuth: false // Explicitly enable auth for this test
    });
    
    const success = isSuccessful(response);
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${success}`);
    
    if (success) {
      console.log('✅ Test passed: Request with valid token succeeded');
      results.passed++;
      results.tests.push({
        name: 'Valid authentication token',
        passed: true
      });
    } else {
      console.error('❌ Test failed: Request with valid token failed');
      console.error(`Error: ${response.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Valid authentication token',
        passed: false,
        error: response.data?.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Valid authentication token',
      passed: false,
      error: error.message
    });
  }
  
  // Test 2: Invalid authentication token
  try {
    console.log('\n--- Test: Invalid authentication token ---');
    const response = await get('/', { 
      headers: createAuthHeaders(null, { invalid: true }),
      skipAuth: false // Explicitly enable auth for this test
    });
    
    const failure = isError(response) && 
                   (response.status === 401 || response.status === 403);
    console.log(`Status: ${response.status}`);
    console.log(`Failure expected: ${failure}`);
    
    if (failure) {
      console.log('✅ Test passed: Request with invalid token was rejected');
      results.passed++;
      results.tests.push({
        name: 'Invalid authentication token',
        passed: true
      });
    } else {
      console.error('❌ Test failed: Request with invalid token was not rejected');
      results.failed++;
      results.tests.push({
        name: 'Invalid authentication token',
        passed: false,
        error: 'Request with invalid token was not rejected'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Invalid authentication token',
      passed: false,
      error: error.message
    });
  }
  
  // Test 3: Missing authentication token
  try {
    console.log('\n--- Test: Missing authentication token ---');
    const response = await get('/', { 
      headers: {}, // No auth headers
      skipAuth: false // Explicitly enable auth for this test
    });
    
    const failure = isError(response) && 
                   (response.status === 401 || response.status === 403);
    console.log(`Status: ${response.status}`);
    console.log(`Failure expected: ${failure}`);
    
    if (failure) {
      console.log('✅ Test passed: Request with missing token was rejected');
      results.passed++;
      results.tests.push({
        name: 'Missing authentication token',
        passed: true
      });
    } else {
      console.error('❌ Test failed: Request with missing token was not rejected');
      results.failed++;
      results.tests.push({
        name: 'Missing authentication token',
        passed: false,
        error: 'Request with missing token was not rejected'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Missing authentication token',
      passed: false,
      error: error.message
    });
  }
  
  // Test 4: Expired authentication token
  try {
    console.log('\n--- Test: Expired authentication token ---');
    const userId = config.testUsers.existing;
    const response = await get('/', { 
      headers: createAuthHeaders(userId, { expired: true }),
      skipAuth: false // Explicitly enable auth for this test
    });
    
    const failure = isError(response) && 
                   (response.status === 401 || response.status === 403);
    console.log(`Status: ${response.status}`);
    console.log(`Failure expected: ${failure}`);
    
    if (failure) {
      console.log('✅ Test passed: Request with expired token was rejected');
      results.passed++;
      results.tests.push({
        name: 'Expired authentication token',
        passed: true
      });
    } else {
      console.error('❌ Test failed: Request with expired token was not rejected');
      results.failed++;
      results.tests.push({
        name: 'Expired authentication token',
        passed: false,
        error: 'Request with expired token was not rejected'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Expired authentication token',
      passed: false,
      error: error.message
    });
  }
  
  // Print summary
  console.log('\n--- Authentication Tests Summary ---');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Total: ${results.passed + results.failed + results.skipped}`);
  
  return results;
}

export default { runAuthTests };
