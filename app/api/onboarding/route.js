/**
 * Onboarding API endpoint
 * 
 * This file implements the API endpoints for the onboarding process:
 * - GET /api/onboarding - Get onboarding data for a user
 * - POST /api/onboarding - Update onboarding data for a user
 */

import { NextResponse } from 'next/server';
import { getOnboardingData, updateOnboardingData } from '../../../lib/onboarding/airtable';
import { validateAuth } from '../../../lib/auth/api-auth';

/**
 * GET /api/onboarding
 * 
 * Get onboarding data for a user
 */
export async function GET(request) {
  try {
    // Validate authentication
    const authResult = await validateAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get onboarding data
    const userId = authResult.userId;
    const onboardingData = await getOnboardingData(userId);

    return NextResponse.json(onboardingData);
  } catch (error) {
    console.error('Error in GET /api/onboarding:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/onboarding
 * 
 * Update onboarding data for a user
 */
export async function POST(request) {
  try {
    // Validate authentication
    const authResult = await validateAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get request body
    const body = await request.json();

    // Validate request body
    if (!validateOnboardingData(body)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Update onboarding data
    const userId = authResult.userId;
    const updatedData = await updateOnboardingData(userId, body);

    return NextResponse.json({
      success: true,
      data: updatedData
    });
  } catch (error) {
    console.error('Error in POST /api/onboarding:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Validate onboarding data
 * @param {Object} data - Onboarding data to validate
 * @returns {boolean} Whether the data is valid
 */
function validateOnboardingData(data) {
  // Check required fields
  if (!data || typeof data !== 'object') {
    return false;
  }

  if (!data.steps || typeof data.steps !== 'object') {
    return false;
  }

  if (!data.currentStep || typeof data.currentStep !== 'string') {
    return false;
  }

  if (typeof data.completed !== 'boolean') {
    return false;
  }

  // Check steps
  const { steps } = data;
  
  // Business info step
  if (!steps.businessInfo || typeof steps.businessInfo !== 'object') {
    return false;
  }
  
  if (typeof steps.businessInfo.completed !== 'boolean') {
    return false;
  }
  
  // Phone setup step
  if (!steps.phoneSetup || typeof steps.phoneSetup !== 'object') {
    return false;
  }
  
  if (typeof steps.phoneSetup.completed !== 'boolean') {
    return false;
  }
  
  // Preferences step
  if (!steps.preferences || typeof steps.preferences !== 'object') {
    return false;
  }
  
  if (typeof steps.preferences.completed !== 'boolean') {
    return false;
  }

  return true;
}
