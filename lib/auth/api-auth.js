/**
 * API Authentication Validation
 * 
 * This file provides functions for validating authentication in API routes.
 */

import { getSession } from '@/lib/auth';

/**
 * Validate authentication for API routes
 * @param {Request} request - The request object
 * @returns {Promise<Object>} Authentication result
 */
export async function validateAuth(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    
    // Check if authentication is required
    const isAuthRequired = process.env.NEXT_PUBLIC_AUTH_REQUIRED !== 'false';
    
    // If authentication is not required, return success
    if (!isAuthRequired) {
      // Get user ID from query params or default
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId') || 'test-user-id';
      
      return {
        success: true,
        userId,
        status: 200
      };
    }
    
    // If authentication is required but no auth header, return error
    if (!authHeader) {
      return {
        success: false,
        error: 'Authentication required',
        status: 401
      };
    }
    
    // Parse auth header
    const [scheme, token] = authHeader.split(' ');
    
    // Check auth scheme
    if (scheme !== 'Bearer') {
      return {
        success: false,
        error: 'Invalid authentication scheme',
        status: 401
      };
    }
    
    // Check token
    if (!token) {
      return {
        success: false,
        error: 'Authentication token required',
        status: 401
      };
    }
    
    // Validate token with Auth0
    try {
      const session = await getSession(request);
      
      if (!session || !session.user) {
        return {
          success: false,
          error: 'Invalid authentication token',
          status: 401
        };
      }
      
      // Return success with user ID
      return {
        success: true,
        userId: session.user.sub,
        status: 200
      };
    } catch (error) {
      console.error('Error validating authentication token:', error);
      
      return {
        success: false,
        error: 'Error validating authentication token',
        status: 500
      };
    }
  } catch (error) {
    console.error('Error validating authentication:', error);
    
    return {
      success: false,
      error: 'Internal server error',
      status: 500
    };
  }
}

export default { validateAuth };
