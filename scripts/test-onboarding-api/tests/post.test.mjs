/**
 * POST endpoint tests for the onboarding API
 * 
 * This module tests the POST /api/onboarding endpoint.
 */

import { get, post } from '../utils/request.mjs';
import { isSuccessful, validateResponse } from '../utils/validation.mjs';
import config from '../config.mjs';
import businessInfo from '../fixtures/business-info.mjs';
import phoneSetup from '../fixtures/phone-setup.mjs';
import preferences from '../fixtures/preferences.mjs';

/**
 * Test POST /api/onboarding endpoint
 * @returns {Object} Test results
 */
export async function runPostTests() {
  console.log('\n=== Running POST /api/onboarding Tests ===');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
  };
  
  // Test 1: Update business info step
  try {
    console.log('\n--- Test: Update business info step ---');
    const userId = config.testUsers.existing;
    
    // First, get the current state
    const getResponse = await get('/', { userId });
    
    if (!isSuccessful(getResponse)) {
      console.error('❌ Test setup failed: Could not get current onboarding data');
      console.error(`Error: ${getResponse.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Update business info step',
        passed: false,
        error: `Test setup failed: ${getResponse.data?.error || 'Unknown error'}`
      });
      return results;
    }
    
    // Update the business info step
    const updatedData = {
      ...getResponse.data,
      steps: {
        ...getResponse.data.steps,
        businessInfo: {
          completed: true,
          data: businessInfo.validBusinessInfo
        }
      },
      currentStep: 'phoneSetup',
      lastUpdated: new Date().toISOString()
    };
    
    const response = await post('/', updatedData, { userId });
    
    const success = isSuccessful(response);
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${success}`);
    
    if (success) {
      // Validate response schema
      const validation = validateResponse(response, 'postOnboarding');
      
      if (validation.success) {
        console.log('✅ Test passed: Updated business info step');
        console.log('✅ Response schema is valid');
        
        // Verify the data was updated
        const verifyResponse = await get('/', { userId });
        
        if (isSuccessful(verifyResponse) && 
            verifyResponse.data.steps.businessInfo.completed &&
            verifyResponse.data.steps.businessInfo.data.name === businessInfo.validBusinessInfo.name) {
          console.log('✅ Business info update verified');
          results.passed++;
          results.tests.push({
            name: 'Update business info step',
            passed: true
          });
        } else {
          console.error('❌ Test failed: Business info update not verified');
          results.failed++;
          results.tests.push({
            name: 'Update business info step',
            passed: false,
            error: 'Business info update not verified'
          });
        }
      } else {
        console.error('❌ Test failed: Invalid response schema');
        console.error('Validation errors:', validation.errors);
        results.failed++;
        results.tests.push({
          name: 'Update business info step',
          passed: false,
          error: `Invalid response schema: ${validation.errors.join(', ')}`
        });
      }
    } else {
      console.error('❌ Test failed: Could not update business info step');
      console.error(`Error: ${response.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Update business info step',
        passed: false,
        error: response.data?.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Update business info step',
      passed: false,
      error: error.message
    });
  }
  
  // Test 2: Update phone setup step
  try {
    console.log('\n--- Test: Update phone setup step ---');
    const userId = config.testUsers.existing;
    
    // First, get the current state
    const getResponse = await get('/', { userId });
    
    if (!isSuccessful(getResponse)) {
      console.error('❌ Test setup failed: Could not get current onboarding data');
      console.error(`Error: ${getResponse.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Update phone setup step',
        passed: false,
        error: `Test setup failed: ${getResponse.data?.error || 'Unknown error'}`
      });
      return results;
    }
    
    // Update the phone setup step
    const updatedData = {
      ...getResponse.data,
      steps: {
        ...getResponse.data.steps,
        phoneSetup: {
          completed: true,
          data: phoneSetup.validPhoneSetup
        }
      },
      currentStep: 'preferences',
      lastUpdated: new Date().toISOString()
    };
    
    const response = await post('/', updatedData, { userId });
    
    const success = isSuccessful(response);
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${success}`);
    
    if (success) {
      // Validate response schema
      const validation = validateResponse(response, 'postOnboarding');
      
      if (validation.success) {
        console.log('✅ Test passed: Updated phone setup step');
        console.log('✅ Response schema is valid');
        
        // Verify the data was updated
        const verifyResponse = await get('/', { userId });
        
        if (isSuccessful(verifyResponse) && 
            verifyResponse.data.steps.phoneSetup.completed &&
            verifyResponse.data.steps.phoneSetup.data.phoneNumber === phoneSetup.validPhoneSetup.phoneNumber) {
          console.log('✅ Phone setup update verified');
          results.passed++;
          results.tests.push({
            name: 'Update phone setup step',
            passed: true
          });
        } else {
          console.error('❌ Test failed: Phone setup update not verified');
          results.failed++;
          results.tests.push({
            name: 'Update phone setup step',
            passed: false,
            error: 'Phone setup update not verified'
          });
        }
      } else {
        console.error('❌ Test failed: Invalid response schema');
        console.error('Validation errors:', validation.errors);
        results.failed++;
        results.tests.push({
          name: 'Update phone setup step',
          passed: false,
          error: `Invalid response schema: ${validation.errors.join(', ')}`
        });
      }
    } else {
      console.error('❌ Test failed: Could not update phone setup step');
      console.error(`Error: ${response.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Update phone setup step',
        passed: false,
        error: response.data?.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Update phone setup step',
      passed: false,
      error: error.message
    });
  }
  
  // Test 3: Update preferences step
  try {
    console.log('\n--- Test: Update preferences step ---');
    const userId = config.testUsers.existing;
    
    // First, get the current state
    const getResponse = await get('/', { userId });
    
    if (!isSuccessful(getResponse)) {
      console.error('❌ Test setup failed: Could not get current onboarding data');
      console.error(`Error: ${getResponse.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Update preferences step',
        passed: false,
        error: `Test setup failed: ${getResponse.data?.error || 'Unknown error'}`
      });
      return results;
    }
    
    // Update the preferences step
    const updatedData = {
      ...getResponse.data,
      steps: {
        ...getResponse.data.steps,
        preferences: {
          completed: true,
          data: preferences.validPreferences
        }
      },
      currentStep: 'preferences',
      completed: true,
      lastUpdated: new Date().toISOString()
    };
    
    const response = await post('/', updatedData, { userId });
    
    const success = isSuccessful(response);
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${success}`);
    
    if (success) {
      // Validate response schema
      const validation = validateResponse(response, 'postOnboarding');
      
      if (validation.success) {
        console.log('✅ Test passed: Updated preferences step');
        console.log('✅ Response schema is valid');
        
        // Verify the data was updated
        const verifyResponse = await get('/', { userId });
        
        if (isSuccessful(verifyResponse) && 
            verifyResponse.data.steps.preferences.completed &&
            verifyResponse.data.completed) {
          console.log('✅ Preferences update verified');
          results.passed++;
          results.tests.push({
            name: 'Update preferences step',
            passed: true
          });
        } else {
          console.error('❌ Test failed: Preferences update not verified');
          results.failed++;
          results.tests.push({
            name: 'Update preferences step',
            passed: false,
            error: 'Preferences update not verified'
          });
        }
      } else {
        console.error('❌ Test failed: Invalid response schema');
        console.error('Validation errors:', validation.errors);
        results.failed++;
        results.tests.push({
          name: 'Update preferences step',
          passed: false,
          error: `Invalid response schema: ${validation.errors.join(', ')}`
        });
      }
    } else {
      console.error('❌ Test failed: Could not update preferences step');
      console.error(`Error: ${response.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Update preferences step',
        passed: false,
        error: response.data?.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Update preferences step',
      passed: false,
      error: error.message
    });
  }
  
  // Test 4: Update with invalid data
  try {
    console.log('\n--- Test: Update with invalid data ---');
    const userId = config.testUsers.existing;
    
    // Create invalid data (missing required fields)
    const invalidData = {
      userId,
      steps: {
        businessInfo: {
          // Missing completed field
          data: {
            // Missing name field
            businessType: 'retail',
            address: '123 Test St, Test City, TS 12345'
          }
        }
      },
      // Missing currentStep field
      lastUpdated: new Date().toISOString()
    };
    
    const response = await post('/', invalidData, { userId });
    
    // This should fail with a validation error
    const failure = !isSuccessful(response) && 
                   (response.status === 400 || response.status === 422);
    console.log(`Status: ${response.status}`);
    console.log(`Failure expected: ${failure}`);
    
    if (failure) {
      console.log('✅ Test passed: Invalid data was rejected');
      results.passed++;
      results.tests.push({
        name: 'Update with invalid data',
        passed: true
      });
    } else {
      console.error('❌ Test failed: Invalid data was not rejected');
      results.failed++;
      results.tests.push({
        name: 'Update with invalid data',
        passed: false,
        error: 'Invalid data was not rejected'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Update with invalid data',
      passed: false,
      error: error.message
    });
  }
  
  // Test 5: Mark all steps as completed
  try {
    console.log('\n--- Test: Mark all steps as completed ---');
    const userId = config.testUsers.existing;
    
    // First, get the current state
    const getResponse = await get('/', { userId });
    
    if (!isSuccessful(getResponse)) {
      console.error('❌ Test setup failed: Could not get current onboarding data');
      console.error(`Error: ${getResponse.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Mark all steps as completed',
        passed: false,
        error: `Test setup failed: ${getResponse.data?.error || 'Unknown error'}`
      });
      return results;
    }
    
    // Mark all steps as completed
    const updatedData = {
      ...getResponse.data,
      steps: {
        businessInfo: {
          completed: true,
          data: businessInfo.validBusinessInfo
        },
        phoneSetup: {
          completed: true,
          data: phoneSetup.validPhoneSetup
        },
        preferences: {
          completed: true,
          data: preferences.validPreferences
        }
      },
      currentStep: 'preferences',
      completed: true,
      lastUpdated: new Date().toISOString()
    };
    
    const response = await post('/', updatedData, { userId });
    
    const success = isSuccessful(response);
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${success}`);
    
    if (success) {
      // Validate response schema
      const validation = validateResponse(response, 'postOnboarding');
      
      if (validation.success) {
        console.log('✅ Test passed: Marked all steps as completed');
        console.log('✅ Response schema is valid');
        
        // Verify the data was updated
        const verifyResponse = await get('/', { userId });
        
        if (isSuccessful(verifyResponse) && 
            verifyResponse.data.steps.businessInfo.completed &&
            verifyResponse.data.steps.phoneSetup.completed &&
            verifyResponse.data.steps.preferences.completed &&
            verifyResponse.data.completed) {
          console.log('✅ All steps completed verified');
          results.passed++;
          results.tests.push({
            name: 'Mark all steps as completed',
            passed: true
          });
        } else {
          console.error('❌ Test failed: All steps completed not verified');
          results.failed++;
          results.tests.push({
            name: 'Mark all steps as completed',
            passed: false,
            error: 'All steps completed not verified'
          });
        }
      } else {
        console.error('❌ Test failed: Invalid response schema');
        console.error('Validation errors:', validation.errors);
        results.failed++;
        results.tests.push({
          name: 'Mark all steps as completed',
          passed: false,
          error: `Invalid response schema: ${validation.errors.join(', ')}`
        });
      }
    } else {
      console.error('❌ Test failed: Could not mark all steps as completed');
      console.error(`Error: ${response.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Mark all steps as completed',
        passed: false,
        error: response.data?.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Mark all steps as completed',
      passed: false,
      error: error.message
    });
  }
  
  // Print summary
  console.log('\n--- POST /api/onboarding Tests Summary ---');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Total: ${results.passed + results.failed + results.skipped}`);
  
  return results;
}

export default { runPostTests };
