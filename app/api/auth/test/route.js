'use server';

import { getSession } from '../auth-utils';
import { NextResponse } from 'next/server';

/**
 * GET handler for testing Auth0 authentication
 * @param {Request} req - The request object
 * @returns {Promise<NextResponse>} The response object
 */
export async function GET(req) {
  try {
    console.log('[API] Testing Auth0 authentication');
    
    // Get the user's session
    const session = await getSession(req, new Response());
    
    // If no session is found, return 401 Unauthorized
    if (!session?.user) {
      console.error('[API] Unauthorized access to auth test');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Return the user's information
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.sub,
        email: session.user.email,
        name: session.user.name,
        picture: session.user.picture,
      },
      message: 'Authentication successful'
    });
  } catch (error) {
    console.error('[API] Error testing authentication:', error);
    return NextResponse.json(
      { error: 'Failed to test authentication' },
      { status: 500 }
    );
  }
}
