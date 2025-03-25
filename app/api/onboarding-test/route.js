/**
 * Onboarding Test API endpoint
 * 
 * This file implements the test API endpoints for the onboarding process:
 * - GET /api/onboarding-test - Get onboarding data for a user
 * - POST /api/onboarding-test - Update onboarding data for a user
 */

import { NextResponse } from 'next/server';

// Mock data store
const mockData = new Map();

// Default onboarding data
const defaultOnboardingData = {
  steps: {
    businessInfo: {
      completed: false,
      data: {
        name: '',
        businessType: '',
        address: ''
      }
    },
    phoneSetup: {
      completed: false,
      data: {
        phoneNumber: '',
        configured: false
      }
    },
    preferences: {
      completed: false,
      data: {
        notifications: {
          email: false,
          sms: false,
          push: false,
          frequency: 'daily'
        },
        autoRespond: false,
        theme: 'system'
      }
    }
  },
  currentStep: 'businessInfo',
  completed: false,
  lastUpdated: new Date().toISOString()
};

/**
 * GET /api/onboarding-test
 * 
 * Get onboarding data for a user
 */
export async function GET(request) {
  try {
    // Get user ID from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'test-user-id';
    
    // Get onboarding data
    let onboardingData = mockData.get(userId);
    
    // If no data found, return default data
    if (!onboardingData) {
      onboardingData = {
        ...defaultOnboardingData,
        userId
      };
      mockData.set(userId, onboardingData);
    }

    return NextResponse.json({
      success: true,
      data: onboardingData
    });
  } catch (error) {
    console.error('Error in GET /api/onboarding-test:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/onboarding-test
 * 
 * Update onboarding data for a user
 */
export async function POST(request) {
  try {
    // Get request body
    const body = await request.json();
    
    // Get user ID from body
    const userId = body.userId || 'test-user-id';
    
    // Get existing data
    let existingData = mockData.get(userId);
    
    // If no data found, use default data
    if (!existingData) {
      existingData = {
        ...defaultOnboardingData,
        userId
      };
    }
    
    // Merge the data
    const mergedData = deepMerge(existingData, body);
    
    // Update lastUpdated timestamp
    mergedData.lastUpdated = new Date().toISOString();
    
    // Save the data
    mockData.set(userId, mergedData);

    return NextResponse.json({
      success: true,
      data: mergedData
    });
  } catch (error) {
    console.error('Error in POST /api/onboarding-test:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] === undefined) {
      continue;
    }

    if (
      isObject(source[key]) &&
      key in target &&
      isObject(target[key])
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

/**
 * Check if a value is an object
 * @param {*} item - Value to check
 * @returns {boolean} Whether the value is an object
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}
