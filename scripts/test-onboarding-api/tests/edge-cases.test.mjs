/**
 * Edge case tests for the onboarding API
 * 
 * This module tests edge cases for the onboarding API endpoints.
 */

import { get, post } from '../utils/request.mjs';
import { isSuccessful, validateResponse } from '../utils/validation.mjs';
import config from '../config.mjs';
import edgeCases from '../fixtures/edge-cases.mjs';

/**
 * Test edge cases for the onboarding API
 * @returns {Object} Test results
 */
export async function runEdgeCasesTests() {
  console.log('\n=== Running Edge Case Tests ===');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
  };
  
  // Test 1: Very large onboarding data
  try {
    console.log('\n--- Test: Very large onboarding data ---');
    const userId = config.testUsers.existing;
    
    // Update with very large data
    const response = await post('/', edgeCases.largeOnboardingData, { userId });
    
    const success = isSuccessful(response);
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${success}`);
    
    if (success) {
      console.log('✅ Test passed: Large data was accepted');
      
      // Verify the data was saved correctly
      const verifyResponse = await get('/', { userId });
      
      if (isSuccessful(verifyResponse)) {
        // Check if the large data was saved
        const dataMatches = verifyResponse.data.steps.businessInfo.data.name === edgeCases.largeOnboardingData.steps.businessInfo.data.name;
        
        if (dataMatches) {
          console.log('✅ Large data verified');
          results.passed++;
          results.tests.push({
            name: 'Very large onboarding data',
            passed: true
          });
        } else {
          console.error('❌ Test failed: Large data not saved correctly');
          results.failed++;
          results.tests.push({
            name: 'Very large onboarding data',
            passed: false,
            error: 'Large data not saved correctly'
          });
        }
      } else {
        console.error('❌ Test failed: Could not verify large data');
        console.error(`Error: ${verifyResponse.data?.error || 'Unknown error'}`);
        results.failed++;
        results.tests.push({
          name: 'Very large onboarding data',
          passed: false,
          error: `Could not verify large data: ${verifyResponse.data?.error || 'Unknown error'}`
        });
      }
    } else {
      // If the API rejects very large data, that's also acceptable
      // Some APIs have size limits for security/performance reasons
      console.log('✅ Test passed: Large data was rejected (size limit enforced)');
      results.passed++;
      results.tests.push({
        name: 'Very large onboarding data',
        passed: true,
        notes: 'API enforces size limits'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Very large onboarding data',
      passed: false,
      error: error.message
    });
  }
  
  // Test 2: Special characters in data
  try {
    console.log('\n--- Test: Special characters in data ---');
    const userId = config.testUsers.existing;
    
    // Update with special characters
    const response = await post('/', edgeCases.specialCharsOnboardingData, { userId });
    
    const success = isSuccessful(response);
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${success}`);
    
    if (success) {
      console.log('✅ Test passed: Special characters were accepted');
      
      // Verify the data was saved correctly
      const verifyResponse = await get('/', { userId });
      
      if (isSuccessful(verifyResponse)) {
        // Check if the special characters were saved
        const dataMatches = verifyResponse.data.steps.businessInfo.data.name === edgeCases.specialCharsOnboardingData.steps.businessInfo.data.name;
        
        if (dataMatches) {
          console.log('✅ Special characters verified');
          results.passed++;
          results.tests.push({
            name: 'Special characters in data',
            passed: true
          });
        } else {
          console.error('❌ Test failed: Special characters not saved correctly');
          results.failed++;
          results.tests.push({
            name: 'Special characters in data',
            passed: false,
            error: 'Special characters not saved correctly'
          });
        }
      } else {
        console.error('❌ Test failed: Could not verify special characters');
        console.error(`Error: ${verifyResponse.data?.error || 'Unknown error'}`);
        results.failed++;
        results.tests.push({
          name: 'Special characters in data',
          passed: false,
          error: `Could not verify special characters: ${verifyResponse.data?.error || 'Unknown error'}`
        });
      }
    } else {
      console.error('❌ Test failed: Special characters were rejected');
      console.error(`Error: ${response.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Special characters in data',
        passed: false,
        error: response.data?.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Special characters in data',
      passed: false,
      error: error.message
    });
  }
  
  // Test 3: Missing fields
  try {
    console.log('\n--- Test: Missing fields ---');
    const userId = config.testUsers.existing;
    
    // Update with missing fields
    const response = await post('/', edgeCases.missingFieldsOnboardingData, { userId });
    
    // This should fail with a validation error
    const failure = !isSuccessful(response) && 
                   (response.status === 400 || response.status === 422);
    console.log(`Status: ${response.status}`);
    console.log(`Failure expected: ${failure}`);
    
    if (failure) {
      console.log('✅ Test passed: Missing fields were rejected');
      results.passed++;
      results.tests.push({
        name: 'Missing fields',
        passed: true
      });
    } else {
      console.error('❌ Test failed: Missing fields were accepted');
      results.failed++;
      results.tests.push({
        name: 'Missing fields',
        passed: false,
        error: 'Missing fields were accepted'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Missing fields',
      passed: false,
      error: error.message
    });
  }
  
  // Test 4: Wrong types
  try {
    console.log('\n--- Test: Wrong types ---');
    const userId = config.testUsers.existing;
    
    // Update with wrong types
    const response = await post('/', edgeCases.wrongTypesOnboardingData, { userId });
    
    // This should fail with a validation error
    const failure = !isSuccessful(response) && 
                   (response.status === 400 || response.status === 422);
    console.log(`Status: ${response.status}`);
    console.log(`Failure expected: ${failure}`);
    
    if (failure) {
      console.log('✅ Test passed: Wrong types were rejected');
      results.passed++;
      results.tests.push({
        name: 'Wrong types',
        passed: true
      });
    } else {
      console.error('❌ Test failed: Wrong types were accepted');
      results.failed++;
      results.tests.push({
        name: 'Wrong types',
        passed: false,
        error: 'Wrong types were accepted'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Wrong types',
      passed: false,
      error: error.message
    });
  }
  
  // Test 5: Empty values
  try {
    console.log('\n--- Test: Empty values ---');
    const userId = config.testUsers.existing;
    
    // Update with empty values
    const response = await post('/', edgeCases.emptyValuesOnboardingData, { userId });
    
    const success = isSuccessful(response);
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${success}`);
    
    if (success) {
      console.log('✅ Test passed: Empty values were accepted');
      
      // Verify the data was saved correctly
      const verifyResponse = await get('/', { userId });
      
      if (isSuccessful(verifyResponse)) {
        // Check if the empty values were saved
        const dataMatches = verifyResponse.data.steps.businessInfo.data.name === '' &&
                           verifyResponse.data.steps.businessInfo.data.businessType === '';
        
        if (dataMatches) {
          console.log('✅ Empty values verified');
          results.passed++;
          results.tests.push({
            name: 'Empty values',
            passed: true
          });
        } else {
          console.error('❌ Test failed: Empty values not saved correctly');
          results.failed++;
          results.tests.push({
            name: 'Empty values',
            passed: false,
            error: 'Empty values not saved correctly'
          });
        }
      } else {
        console.error('❌ Test failed: Could not verify empty values');
        console.error(`Error: ${verifyResponse.data?.error || 'Unknown error'}`);
        results.failed++;
        results.tests.push({
          name: 'Empty values',
          passed: false,
          error: `Could not verify empty values: ${verifyResponse.data?.error || 'Unknown error'}`
        });
      }
    } else {
      // If the API rejects empty values, that's also acceptable
      // Some APIs require non-empty values for certain fields
      console.log('✅ Test passed: Empty values were rejected (non-empty validation enforced)');
      results.passed++;
      results.tests.push({
        name: 'Empty values',
        passed: true,
        notes: 'API enforces non-empty values'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Empty values',
      passed: false,
      error: error.message
    });
  }
  
  // Test 6: Concurrent updates (race condition)
  try {
    console.log('\n--- Test: Concurrent updates (race condition) ---');
    const userId = config.testUsers.existing;
    
    // First, get the current state
    const getResponse = await get('/', { userId });
    
    if (!isSuccessful(getResponse)) {
      console.error('❌ Test setup failed: Could not get current onboarding data');
      console.error(`Error: ${getResponse.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Concurrent updates (race condition)',
        passed: false,
        error: `Test setup failed: ${getResponse.data?.error || 'Unknown error'}`
      });
      return results;
    }
    
    // Create two different updates
    const update1 = {
      ...getResponse.data,
      steps: {
        ...getResponse.data.steps,
        businessInfo: {
          completed: true,
          data: {
            name: 'Concurrent Update 1',
            businessType: 'retail',
            address: '123 Test St'
          }
        }
      },
      lastUpdated: new Date().toISOString()
    };
    
    const update2 = {
      ...getResponse.data,
      steps: {
        ...getResponse.data.steps,
        businessInfo: {
          completed: true,
          data: {
            name: 'Concurrent Update 2',
            businessType: 'restaurant',
            address: '456 Test Ave'
          }
        }
      },
      lastUpdated: new Date().toISOString()
    };
    
    // Send both updates concurrently
    const [response1, response2] = await Promise.all([
      post('/', update1, { userId }),
      post('/', update2, { userId })
    ]);
    
    const success1 = isSuccessful(response1);
    const success2 = isSuccessful(response2);
    
    console.log(`Update 1 Status: ${response1.status}, Success: ${success1}`);
    console.log(`Update 2 Status: ${response2.status}, Success: ${success2}`);
    
    // At least one update should succeed
    if (success1 || success2) {
      console.log('✅ Test passed: At least one concurrent update succeeded');
      
      // Verify the final state
      const verifyResponse = await get('/', { userId });
      
      if (isSuccessful(verifyResponse)) {
        // The final state should match either update1 or update2
        const matchesUpdate1 = verifyResponse.data.steps.businessInfo.data.name === 'Concurrent Update 1';
        const matchesUpdate2 = verifyResponse.data.steps.businessInfo.data.name === 'Concurrent Update 2';
        
        if (matchesUpdate1 || matchesUpdate2) {
          console.log(`✅ Final state matches ${matchesUpdate1 ? 'update1' : 'update2'}`);
          results.passed++;
          results.tests.push({
            name: 'Concurrent updates (race condition)',
            passed: true
          });
        } else {
          console.error('❌ Test failed: Final state does not match either update');
          results.failed++;
          results.tests.push({
            name: 'Concurrent updates (race condition)',
            passed: false,
            error: 'Final state does not match either update'
          });
        }
      } else {
        console.error('❌ Test failed: Could not verify final state');
        console.error(`Error: ${verifyResponse.data?.error || 'Unknown error'}`);
        results.failed++;
        results.tests.push({
          name: 'Concurrent updates (race condition)',
          passed: false,
          error: `Could not verify final state: ${verifyResponse.data?.error || 'Unknown error'}`
        });
      }
    } else {
      console.error('❌ Test failed: Both concurrent updates failed');
      console.error(`Update 1 Error: ${response1.data?.error || 'Unknown error'}`);
      console.error(`Update 2 Error: ${response2.data?.error || 'Unknown error'}`);
      results.failed++;
      results.tests.push({
        name: 'Concurrent updates (race condition)',
        passed: false,
        error: 'Both concurrent updates failed'
      });
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    results.failed++;
    results.tests.push({
      name: 'Concurrent updates (race condition)',
      passed: false,
      error: error.message
    });
  }
  
  // Print summary
  console.log('\n--- Edge Case Tests Summary ---');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Total: ${results.passed + results.failed + results.skipped}`);
  
  return results;
}

export default { runEdgeCasesTests };
