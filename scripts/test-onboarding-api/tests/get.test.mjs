/**
 * GET endpoint tests for the onboarding API
 * 
 * This module tests the GET /api/onboarding endpoint.
 */

import { get } from '../utils/request.mjs';
import { isSuccessful, validateResponse } from '../utils/validation.mjs';
import config from '../config.mjs';

/**
 * Test GET /api/onboarding endpoint
 * @returns {Object} Test results
 */
export async function runGetTests() {
  console.log('\n=== Running GET /api/onboarding Tests ===');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
  };
  
  // Test 1: Get onboarding data for a new user
  try {
    console.log('\n--- Test: Get onboarding data for a new user ---');
    const userId = config.testUsers.new;
    const response = await get('/', { userId });
    
    const success = isSuccessful(response);
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${success}`);
    
    if (success) {
      // Validate response schema
      const validation = validateResponse(response, 'getOnboarding');
      
      if (validation.success) {
        console.log('✅ Test passed: Got default onboarding data for new user');
        console.log('✅ Response schema is valid');
        
        // Verify it's the default state
        const isDefault = !response.data.steps.businessInfo.completed &&
                         !response.data.steps.phoneSetup.completed &&
                         !response.data.steps.preferences.completed &&
                         !response.data.completed;
        
        if (isDefault) {
          console.log('✅ Default onboarding state verified');
          results.passed++;
          results.tests.push({
            name: 'Get onboarding data for a new user',
            passed: true
          });
        } else {
          console.error('❌ Test failed: Not in default onboarding state');
          results.failed++;
          results.tests.push({
            name: 'Get onboarding data for a new user',
            passed: false,
            error: 'Not in default onboarding state'
          });
        }
      } else {
        console.error('❌ Test failed: Invalid response schema');
        console.error('Validation errors:', validation.errors);
        results.failed++;
        results.tests.push({
          name: 'Get onboarding data for a new user',
          passed: false,
          error: `Invalid response schema: ${validation.errors.join(', ')}`
        });
      }
    } else {
      console.error('❌ Test failed: Could not get onboarding data');
      console.error(`Error: ${response.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Get onboarding data for a new user',
        passed: false,
        error: response.data?.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Get onboarding data for a new user',
      passed: false,
      error: error.message
    });
  }
  
  // Test 2: Get onboarding data for an existing user
  try {
    console.log('\n--- Test: Get onboarding data for an existing user ---');
    const userId = config.testUsers.existing;
    const response = await get('/', { userId });
    
    const success = isSuccessful(response);
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${success}`);
    
    if (success) {
      // Validate response schema
      const validation = validateResponse(response, 'getOnboarding');
      
      if (validation.success) {
        console.log('✅ Test passed: Got onboarding data for existing user');
        console.log('✅ Response schema is valid');
        results.passed++;
        results.tests.push({
          name: 'Get onboarding data for an existing user',
          passed: true
        });
      } else {
        console.error('❌ Test failed: Invalid response schema');
        console.error('Validation errors:', validation.errors);
        results.failed++;
        results.tests.push({
          name: 'Get onboarding data for an existing user',
          passed: false,
          error: `Invalid response schema: ${validation.errors.join(', ')}`
        });
      }
    } else {
      console.error('❌ Test failed: Could not get onboarding data');
      console.error(`Error: ${response.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Get onboarding data for an existing user',
        passed: false,
        error: response.data?.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Get onboarding data for an existing user',
      passed: false,
      error: error.message
    });
  }
  
  // Test 3: Get onboarding data for a user with partially completed onboarding
  try {
    console.log('\n--- Test: Get onboarding data for a user with partially completed onboarding ---');
    const userId = config.testUsers.partial;
    const response = await get('/', { userId });
    
    const success = isSuccessful(response);
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${success}`);
    
    if (success) {
      // Validate response schema
      const validation = validateResponse(response, 'getOnboarding');
      
      if (validation.success) {
        console.log('✅ Test passed: Got onboarding data for user with partially completed onboarding');
        console.log('✅ Response schema is valid');
        
        // Verify at least one step is completed but not all
        const someCompleted = response.data.steps.businessInfo.completed ||
                             response.data.steps.phoneSetup.completed ||
                             response.data.steps.preferences.completed;
        
        const notAllCompleted = !response.data.steps.businessInfo.completed ||
                               !response.data.steps.phoneSetup.completed ||
                               !response.data.steps.preferences.completed;
        
        if (someCompleted && notAllCompleted) {
          console.log('✅ Partially completed onboarding state verified');
          results.passed++;
          results.tests.push({
            name: 'Get onboarding data for a user with partially completed onboarding',
            passed: true
          });
        } else {
          console.error('❌ Test failed: Not in partially completed onboarding state');
          results.failed++;
          results.tests.push({
            name: 'Get onboarding data for a user with partially completed onboarding',
            passed: false,
            error: 'Not in partially completed onboarding state'
          });
        }
      } else {
        console.error('❌ Test failed: Invalid response schema');
        console.error('Validation errors:', validation.errors);
        results.failed++;
        results.tests.push({
          name: 'Get onboarding data for a user with partially completed onboarding',
          passed: false,
          error: `Invalid response schema: ${validation.errors.join(', ')}`
        });
      }
    } else {
      console.error('❌ Test failed: Could not get onboarding data');
      console.error(`Error: ${response.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Get onboarding data for a user with partially completed onboarding',
        passed: false,
        error: response.data?.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Get onboarding data for a user with partially completed onboarding',
      passed: false,
      error: error.message
    });
  }
  
  // Test 4: Get onboarding data for a user with fully completed onboarding
  try {
    console.log('\n--- Test: Get onboarding data for a user with fully completed onboarding ---');
    const userId = config.testUsers.complete;
    const response = await get('/', { userId });
    
    const success = isSuccessful(response);
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${success}`);
    
    if (success) {
      // Validate response schema
      const validation = validateResponse(response, 'getOnboarding');
      
      if (validation.success) {
        console.log('✅ Test passed: Got onboarding data for user with fully completed onboarding');
        console.log('✅ Response schema is valid');
        
        // Verify all steps are completed
        const allCompleted = response.data.steps.businessInfo.completed &&
                            response.data.steps.phoneSetup.completed &&
                            response.data.steps.preferences.completed &&
                            response.data.completed;
        
        if (allCompleted) {
          console.log('✅ Fully completed onboarding state verified');
          results.passed++;
          results.tests.push({
            name: 'Get onboarding data for a user with fully completed onboarding',
            passed: true
          });
        } else {
          console.error('❌ Test failed: Not in fully completed onboarding state');
          results.failed++;
          results.tests.push({
            name: 'Get onboarding data for a user with fully completed onboarding',
            passed: false,
            error: 'Not in fully completed onboarding state'
          });
        }
      } else {
        console.error('❌ Test failed: Invalid response schema');
        console.error('Validation errors:', validation.errors);
        results.failed++;
        results.tests.push({
          name: 'Get onboarding data for a user with fully completed onboarding',
          passed: false,
          error: `Invalid response schema: ${validation.errors.join(', ')}`
        });
      }
    } else {
      console.error('❌ Test failed: Could not get onboarding data');
      console.error(`Error: ${response.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Get onboarding data for a user with fully completed onboarding',
        passed: false,
        error: response.data?.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Get onboarding data for a user with fully completed onboarding',
      passed: false,
      error: error.message
    });
  }
  
  // Print summary
  console.log('\n--- GET /api/onboarding Tests Summary ---');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Total: ${results.passed + results.failed + results.skipped}`);
  
  return results;
}

export default { runGetTests };
