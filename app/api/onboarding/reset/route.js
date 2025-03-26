/**
 * Onboarding Reset API endpoint
 * 
 * This file implements the API endpoint for resetting the onboarding process:
 * - POST /api/onboarding/reset - Reset onboarding data for a user
 */

import { NextResponse } from 'next/server';
import { resetOnboardingData } from '../../../../lib/onboarding/airtable';
import { validateAuth } from '../../../../lib/auth/api-auth';

/**
 * POST /api/onboarding/reset
 * 
 * Reset onboarding data for a user
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

    // Get user ID from auth or body
    const userId = authResult.userId || body.userId;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Reset onboarding data
    const resetData = await resetOnboardingData(userId);

    return NextResponse.json({
      success: true,
      data: resetData
    });
  } catch (error) {
    console.error('Error in POST /api/onboarding/reset:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
