import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Temporary fallback endpoint for create-checkout-session
 * This provides a simple redirect to /dashboard until the App Router version is properly deployed
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  try {
    console.log('🔄 Fallback checkout session endpoint called');
    console.log('📦 Request body:', req.body);

    // Return a simple redirect URL for now
    // This allows the onboarding flow to continue
    const response = {
      url: '/dashboard',
      sessionId: 'fallback-session-' + Date.now(),
      message: 'Temporary fallback - redirecting to dashboard'
    };

    console.log('✅ Returning fallback response:', response);

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('❌ Error in fallback checkout session:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later'
    });
  }
}
