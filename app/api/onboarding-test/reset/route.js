/**
 * Onboarding Test Reset API endpoint
 * 
 * This file implements the test API endpoint for resetting the onboarding process:
 * - POST /api/onboarding-test/reset - Reset onboarding data for a user
 */

import { NextResponse } from 'next/server';

// Mock data store (shared with the main onboarding-test endpoint)
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
 * POST /api/onboarding-test/reset
 * 
 * Reset onboarding data for a user
 */
export async function POST(request) {
  try {
    // Get request body
    const body = await request.json();
    
    // Get user ID from body
    const userId = body.userId || 'test-user-id';
    
    // Reset data to default
    const resetData = {
      ...defaultOnboardingData,
      userId,
      lastUpdated: new Date().toISOString()
    };
    
    // Save the data
    mockData.set(userId, resetData);

    return NextResponse.json({
      success: true,
      data: resetData
    });
  } catch (error) {
    console.error('Error in POST /api/onboarding-test/reset:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
