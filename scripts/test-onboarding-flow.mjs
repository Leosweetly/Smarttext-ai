/**
 * Test script for the onboarding flow
 * 
 * This script tests the complete onboarding flow by:
 * 1. Resetting the onboarding state
 * 2. Completing each step of the onboarding process
 * 3. Verifying the final state
 */

import fetch from 'node-fetch';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PATH = '/api/onboarding-test';

// Sample onboarding data for each step
const businessInfoData = {
  name: 'Test Business',
  businessType: 'retail',
  address: '123 Test St, Test City, TS 12345'
};

const phoneSetupData = {
  phoneNumber: '+15551234567',
  configured: true
};

const preferencesData = {
  notifications: true,
  autoRespond: true,
  theme: 'dark'
};

/**
 * Make an API request
 */
async function makeRequest(endpoint, method = 'GET', body = null) {
  const fullEndpoint = endpoint.startsWith('/api') ? endpoint : API_PATH + (endpoint === '/' ? '' : endpoint);
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${fullEndpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error);
    return { status: 500, data: { success: false, error: error.message } };
  }
}

/**
 * Reset the onboarding state
 */
async function resetOnboarding() {
  console.log('\n--- Resetting onboarding state ---');
  const { status, data } = await makeRequest('/reset', 'POST', { userId: 'test-user-id' });
  console.log('Status:', status);
  console.log('Response:', data);
  return status === 200 && data.success;
}

/**
 * Get the current onboarding state
 */
async function getOnboardingState() {
  console.log('\n--- Getting onboarding state ---');
  const { status, data } = await makeRequest('/');
  console.log('Status:', status);
  console.log('Response:', data);
  return data;
}

/**
 * Update onboarding data
 */
async function updateOnboardingData(onboardingData) {
  console.log('\n--- Updating onboarding data ---');
  const { status, data } = await makeRequest('/', 'POST', onboardingData);
  console.log('Status:', status);
  console.log('Response:', data);
  return status === 200 && data.success;
}

/**
 * Complete the business info step
 */
async function completeBusinessInfoStep() {
  console.log('\n--- Completing Business Info Step ---');
  
  // Get current state
  const currentState = await getOnboardingState();
  
  // Update with business info data
  const updatedState = {
    userId: 'test-user-id',
    steps: {
      ...currentState.steps,
      businessInfo: {
        completed: true,
        data: businessInfoData
      }
    },
    currentStep: 'phoneSetup',
    completed: false,
    lastUpdated: new Date().toISOString()
  };
  
  return await updateOnboardingData(updatedState);
}

/**
 * Complete the phone setup step
 */
async function completePhoneSetupStep() {
  console.log('\n--- Completing Phone Setup Step ---');
  
  // Get current state
  const currentState = await getOnboardingState();
  
  // Update with phone setup data
  const updatedState = {
    userId: 'test-user-id',
    steps: {
      ...currentState.steps,
      phoneSetup: {
        completed: true,
        data: phoneSetupData
      }
    },
    currentStep: 'preferences',
    completed: false,
    lastUpdated: new Date().toISOString()
  };
  
  return await updateOnboardingData(updatedState);
}

/**
 * Complete the preferences step
 */
async function completePreferencesStep() {
  console.log('\n--- Completing Preferences Step ---');
  
  // Get current state
  const currentState = await getOnboardingState();
  
  // Update with preferences data
  const updatedState = {
    userId: 'test-user-id',
    steps: {
      ...currentState.steps,
      preferences: {
        completed: true,
        data: preferencesData
      }
    },
    currentStep: 'preferences',
    completed: true,
    lastUpdated: new Date().toISOString()
  };
  
  return await updateOnboardingData(updatedState);
}

/**
 * Verify the final onboarding state
 */
async function verifyFinalState() {
  console.log('\n--- Verifying Final Onboarding State ---');
  
  const finalState = await getOnboardingState();
  
  // Check if all steps are completed
  const businessInfoCompleted = finalState.steps.businessInfo.completed;
  const phoneSetupCompleted = finalState.steps.phoneSetup.completed;
  const preferencesCompleted = finalState.steps.preferences.completed;
  
  // Check if the overall onboarding is completed
  const onboardingCompleted = finalState.completed;
  
  console.log('Business Info Step Completed:', businessInfoCompleted);
  console.log('Phone Setup Step Completed:', phoneSetupCompleted);
  console.log('Preferences Step Completed:', preferencesCompleted);
  console.log('Overall Onboarding Completed:', onboardingCompleted);
  
  return businessInfoCompleted && phoneSetupCompleted && preferencesCompleted && onboardingCompleted;
}

/**
 * Run the complete onboarding flow test
 */
async function runOnboardingFlowTest() {
  console.log('=== Testing Onboarding Flow ===');
  console.log(`API Base URL: ${API_BASE_URL}`);
  
  // Reset onboarding state
  const resetResult = await resetOnboarding();
  if (!resetResult) {
    console.error('Failed to reset onboarding state');
    return false;
  }
  
  // Complete each step
  const businessInfoResult = await completeBusinessInfoStep();
  if (!businessInfoResult) {
    console.error('Failed to complete business info step');
    return false;
  }
  
  const phoneSetupResult = await completePhoneSetupStep();
  if (!phoneSetupResult) {
    console.error('Failed to complete phone setup step');
    return false;
  }
  
  const preferencesResult = await completePreferencesStep();
  if (!preferencesResult) {
    console.error('Failed to complete preferences step');
    return false;
  }
  
  // Verify final state
  const verificationResult = await verifyFinalState();
  if (!verificationResult) {
    console.error('Final state verification failed');
    return false;
  }
  
  return true;
}

// Run the test
runOnboardingFlowTest()
  .then(success => {
    console.log('\n=== Onboarding Flow Test Results ===');
    console.log(`Overall Test: ${success ? 'PASS' : 'FAIL'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Error running onboarding flow test:', error);
    process.exit(1);
  });
