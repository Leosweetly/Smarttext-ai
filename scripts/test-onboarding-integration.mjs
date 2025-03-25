/**
 * Test script for the onboarding integration
 * 
 * This script tests the integration between the onboarding API and hooks
 * by simulating the frontend flow in a Node.js environment.
 */

import fetch from 'node-fetch';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PATH = '/api/onboarding-test';

// Mock user ID for testing
const TEST_USER_ID = 'test-user-id';

// Sample onboarding data
const businessInfoData = {
  name: 'Integration Test Business',
  businessType: 'technology',
  address: '456 Integration St, Test City, TS 12345'
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
  const { status, data } = await makeRequest('/reset', 'POST', { userId: TEST_USER_ID });
  console.log('Status:', status);
  console.log('Response:', data);
  return status === 200 && data.success;
}

/**
 * Simulate the useOnboarding hook
 */
class OnboardingHookSimulator {
  constructor(userId) {
    this.userId = userId;
    this.onboardingState = null;
    this.loading = false;
    this.error = null;
  }
  
  /**
   * Initialize the onboarding state
   */
  async initialize() {
    console.log('\n--- Initializing onboarding state ---');
    this.loading = true;
    
    try {
      const { status, data } = await makeRequest('/');
      
      if (status === 200) {
        this.onboardingState = {
          userId: this.userId,
          steps: data.steps || {},
          currentStep: data.currentStep || 'businessInfo',
          completed: data.completed || false,
          lastUpdated: data.lastUpdated || new Date().toISOString()
        };
        
        console.log('Onboarding state initialized:', this.onboardingState);
        return true;
      } else {
        this.error = 'Failed to initialize onboarding state';
        console.error(this.error);
        return false;
      }
    } catch (error) {
      this.error = error.message;
      console.error('Error initializing onboarding state:', error);
      return false;
    } finally {
      this.loading = false;
    }
  }
  
  /**
   * Update step data
   */
  async updateStepData(stepName, data) {
    console.log(`\n--- Updating ${stepName} data ---`);
    this.loading = true;
    
    try {
      // Update local state first
      const updatedState = {
        ...this.onboardingState,
        steps: {
          ...this.onboardingState.steps,
          [stepName]: {
            ...this.onboardingState.steps[stepName],
            data: {
              ...this.onboardingState.steps[stepName].data,
              ...data
            }
          }
        },
        lastUpdated: new Date().toISOString()
      };
      
      // Save to API
      const { status, data: responseData } = await makeRequest('/', 'POST', updatedState);
      
      if (status === 200 && responseData.success) {
        this.onboardingState = updatedState;
        console.log('Step data updated:', stepName, data);
        return true;
      } else {
        this.error = 'Failed to update step data';
        console.error(this.error);
        return false;
      }
    } catch (error) {
      this.error = error.message;
      console.error('Error updating step data:', error);
      return false;
    } finally {
      this.loading = false;
    }
  }
  
  /**
   * Complete a step
   */
  async completeStep(stepName) {
    console.log(`\n--- Completing ${stepName} step ---`);
    this.loading = true;
    
    try {
      // Determine the next step
      const stepOrder = ['businessInfo', 'phoneSetup', 'preferences'];
      const currentIndex = stepOrder.indexOf(stepName);
      const nextStep = currentIndex < stepOrder.length - 1 
        ? stepOrder[currentIndex + 1] 
        : stepName;
      
      // Check if this was the last step
      const isLastStep = currentIndex === stepOrder.length - 1;
      
      // Update local state
      const updatedState = {
        ...this.onboardingState,
        steps: {
          ...this.onboardingState.steps,
          [stepName]: {
            ...this.onboardingState.steps[stepName],
            completed: true
          }
        },
        currentStep: isLastStep ? stepName : nextStep,
        completed: isLastStep && 
                  this.onboardingState.steps.businessInfo.completed && 
                  this.onboardingState.steps.phoneSetup.completed,
        lastUpdated: new Date().toISOString()
      };
      
      // Save to API
      const { status, data } = await makeRequest('/', 'POST', updatedState);
      
      if (status === 200 && data.success) {
        this.onboardingState = updatedState;
        console.log('Step completed:', stepName);
        console.log('Next step:', nextStep);
        console.log('Onboarding completed:', updatedState.completed);
        return true;
      } else {
        this.error = 'Failed to complete step';
        console.error(this.error);
        return false;
      }
    } catch (error) {
      this.error = error.message;
      console.error('Error completing step:', error);
      return false;
    } finally {
      this.loading = false;
    }
  }
  
  /**
   * Get the current onboarding state
   */
  getState() {
    return {
      onboardingState: this.onboardingState,
      loading: this.loading,
      error: this.error
    };
  }
}

/**
 * Run the integration test
 */
async function runIntegrationTest() {
  console.log('=== Running Onboarding Integration Test ===');
  
  // Reset onboarding state
  if (!await resetOnboarding()) {
    console.error('Failed to reset onboarding state');
    return false;
  }
  
  // Create hook simulator
  const hookSimulator = new OnboardingHookSimulator(TEST_USER_ID);
  
  // Initialize onboarding state
  if (!await hookSimulator.initialize()) {
    console.error('Failed to initialize onboarding state');
    return false;
  }
  
  // Update business info
  if (!await hookSimulator.updateStepData('businessInfo', businessInfoData)) {
    console.error('Failed to update business info');
    return false;
  }
  
  // Complete business info step
  if (!await hookSimulator.completeStep('businessInfo')) {
    console.error('Failed to complete business info step');
    return false;
  }
  
  // Verify current step is phoneSetup
  const { onboardingState } = hookSimulator.getState();
  if (onboardingState.currentStep !== 'phoneSetup') {
    console.error('Current step should be phoneSetup, but got:', onboardingState.currentStep);
    return false;
  }
  
  // Verify business info is completed
  if (!onboardingState.steps.businessInfo.completed) {
    console.error('Business info step should be completed');
    return false;
  }
  
  // Verify business info data
  const savedBusinessInfo = onboardingState.steps.businessInfo.data;
  if (savedBusinessInfo.name !== businessInfoData.name ||
      savedBusinessInfo.businessType !== businessInfoData.businessType ||
      savedBusinessInfo.address !== businessInfoData.address) {
    console.error('Business info data does not match');
    console.error('Expected:', businessInfoData);
    console.error('Got:', savedBusinessInfo);
    return false;
  }
  
  console.log('\n--- Integration test successful ---');
  console.log('Final onboarding state:', onboardingState);
  
  return true;
}

// Run the test
runIntegrationTest()
  .then(success => {
    console.log('\n=== Onboarding Integration Test Results ===');
    console.log(`Overall Test: ${success ? 'PASS' : 'FAIL'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Error running integration test:', error);
    process.exit(1);
  });
