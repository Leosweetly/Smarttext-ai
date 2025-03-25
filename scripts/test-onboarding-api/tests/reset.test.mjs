/**
 * Reset endpoint tests for the onboarding API
 * 
 * This module tests the POST /api/onboarding/reset endpoint.
 */

import { get, post } from '../utils/request.mjs';
import { isSuccessful, validateResponse } from '../utils/validation.mjs';
import config from '../config.mjs';
import businessInfo from '../fixtures/business-info.mjs';
import phoneSetup from '../fixtures/phone-setup.mjs';
import preferences from '../fixtures/preferences.mjs';

/**
 * Test POST /api/onboarding/reset endpoint
 * @returns {Object} Test results
 */
export async function runResetTests() {
  console.log('\n=== Running POST /api/onboarding/reset Tests ===');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
  };
  
  // Test 1: Reset onboarding for a user with existing data
  try {
    console.log('\n--- Test: Reset onboarding for a user with existing data ---');
    const userId = config.testUsers.existing;
    
    // First, make sure the user has some data
    const initialGetResponse = await get('/', { userId });
    
    if (!isSuccessful(initialGetResponse)) {
      console.error('❌ Test setup failed: Could not get current onboarding data');
      console.error(`Error: ${initialGetResponse.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Reset onboarding for a user with existing data',
        passed: false,
        error: `Test setup failed: ${initialGetResponse.data?.error || 'Unknown error'}`
      });
      return results;
    }
    
    // Update some data to ensure we have something to reset
    const updateData = {
      ...initialGetResponse.data,
      steps: {
        ...initialGetResponse.data.steps,
        businessInfo: {
          completed: true,
          data: businessInfo.validBusinessInfo
        }
      },
      currentStep: 'phoneSetup',
      lastUpdated: new Date().toISOString()
    };
    
    const updateResponse = await post('/', updateData, { userId });
    
    if (!isSuccessful(updateResponse)) {
      console.error('❌ Test setup failed: Could not update onboarding data');
      console.error(`Error: ${updateResponse.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Reset onboarding for a user with existing data',
        passed: false,
        error: `Test setup failed: ${updateResponse.data?.error || 'Unknown error'}`
      });
      return results;
    }
    
    // Now reset the onboarding data
    const resetResponse = await post('/reset', { userId }, { userId });
    
    const success = isSuccessful(resetResponse);
    console.log(`Status: ${resetResponse.status}`);
    console.log(`Success: ${success}`);
    
    if (success) {
      // Validate response schema
      const validation = validateResponse(resetResponse, 'resetOnboarding');
      
      if (validation.success) {
        console.log('✅ Test passed: Reset onboarding data');
        console.log('✅ Response schema is valid');
        
        // Verify the data was reset
        const verifyResponse = await get('/', { userId });
        
        if (isSuccessful(verifyResponse)) {
          // Check if it's in the default state
          const isDefault = !verifyResponse.data.steps.businessInfo.completed &&
                           !verifyResponse.data.steps.phoneSetup.completed &&
                           !verifyResponse.data.steps.preferences.completed &&
                           !verifyResponse.data.completed;
          
          if (isDefault) {
            console.log('✅ Onboarding reset verified');
            results.passed++;
            results.tests.push({
              name: 'Reset onboarding for a user with existing data',
              passed: true
            });
          } else {
            console.error('❌ Test failed: Onboarding not reset to default state');
            results.failed++;
            results.tests.push({
              name: 'Reset onboarding for a user with existing data',
              passed: false,
              error: 'Onboarding not reset to default state'
            });
          }
        } else {
          console.error('❌ Test failed: Could not verify reset');
          console.error(`Error: ${verifyResponse.data?.error || 'Unknown error'}`);
          results.failed++;
          results.tests.push({
            name: 'Reset onboarding for a user with existing data',
            passed: false,
            error: `Could not verify reset: ${verifyResponse.data?.error || 'Unknown error'}`
          });
        }
      } else {
        console.error('❌ Test failed: Invalid response schema');
        console.error('Validation errors:', validation.errors);
        results.failed++;
        results.tests.push({
          name: 'Reset onboarding for a user with existing data',
          passed: false,
          error: `Invalid response schema: ${validation.errors.join(', ')}`
        });
      }
    } else {
      console.error('❌ Test failed: Could not reset onboarding data');
      console.error(`Error: ${resetResponse.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Reset onboarding for a user with existing data',
        passed: false,
        error: resetResponse.data?.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Reset onboarding for a user with existing data',
      passed: false,
      error: error.message
    });
  }
  
  // Test 2: Reset onboarding for a new user
  try {
    console.log('\n--- Test: Reset onboarding for a new user ---');
    const userId = config.testUsers.new;
    
    // Reset the onboarding data for a new user
    const resetResponse = await post('/reset', { userId }, { userId });
    
    const success = isSuccessful(resetResponse);
    console.log(`Status: ${resetResponse.status}`);
    console.log(`Success: ${success}`);
    
    if (success) {
      // Validate response schema
      const validation = validateResponse(resetResponse, 'resetOnboarding');
      
      if (validation.success) {
        console.log('✅ Test passed: Reset onboarding data for new user');
        console.log('✅ Response schema is valid');
        
        // Verify the data is in the default state
        const verifyResponse = await get('/', { userId });
        
        if (isSuccessful(verifyResponse)) {
          // Check if it's in the default state
          const isDefault = !verifyResponse.data.steps.businessInfo.completed &&
                           !verifyResponse.data.steps.phoneSetup.completed &&
                           !verifyResponse.data.steps.preferences.completed &&
                           !verifyResponse.data.completed;
          
          if (isDefault) {
            console.log('✅ Default onboarding state verified');
            results.passed++;
            results.tests.push({
              name: 'Reset onboarding for a new user',
              passed: true
            });
          } else {
            console.error('❌ Test failed: Not in default onboarding state');
            results.failed++;
            results.tests.push({
              name: 'Reset onboarding for a new user',
              passed: false,
              error: 'Not in default onboarding state'
            });
          }
        } else {
          console.error('❌ Test failed: Could not verify reset');
          console.error(`Error: ${verifyResponse.data?.error || 'Unknown error'}`);
          results.failed++;
          results.tests.push({
            name: 'Reset onboarding for a new user',
            passed: false,
            error: `Could not verify reset: ${verifyResponse.data?.error || 'Unknown error'}`
          });
        }
      } else {
        console.error('❌ Test failed: Invalid response schema');
        console.error('Validation errors:', validation.errors);
        results.failed++;
        results.tests.push({
          name: 'Reset onboarding for a new user',
          passed: false,
          error: `Invalid response schema: ${validation.errors.join(', ')}`
        });
      }
    } else {
      console.error('❌ Test failed: Could not reset onboarding data');
      console.error(`Error: ${resetResponse.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Reset onboarding for a new user',
        passed: false,
        error: resetResponse.data?.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Reset onboarding for a new user',
      passed: false,
      error: error.message
    });
  }
  
  // Test 3: Reset with invalid user ID
  try {
    console.log('\n--- Test: Reset with invalid user ID ---');
    const userId = 'invalid-user-id-that-does-not-exist';
    
    // Try to reset with an invalid user ID
    const resetResponse = await post('/reset', { userId }, { userId });
    
    // This should fail with an error
    const failure = !isSuccessful(resetResponse) && 
                   (resetResponse.status === 400 || resetResponse.status === 404);
    console.log(`Status: ${resetResponse.status}`);
    console.log(`Failure expected: ${failure}`);
    
    if (failure) {
      console.log('✅ Test passed: Reset with invalid user ID was rejected');
      results.passed++;
      results.tests.push({
        name: 'Reset with invalid user ID',
        passed: true
      });
    } else {
      console.error('❌ Test failed: Reset with invalid user ID was not rejected');
      results.failed++;
      results.tests.push({
        name: 'Reset with invalid user ID',
        passed: false,
        error: 'Reset with invalid user ID was not rejected'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Reset with invalid user ID',
      passed: false,
      error: error.message
    });
  }
  
  // Print summary
  console.log('\n--- POST /api/onboarding/reset Tests Summary ---');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Total: ${results.passed + results.failed + results.skipped}`);
  
  return results;
}

export default { runResetTests };
