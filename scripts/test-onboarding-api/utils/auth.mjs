/**
 * Authentication utilities for the onboarding API test suite
 */

import jwt from 'jsonwebtoken';
import config from '../config.mjs';

/**
 * Create authentication headers for API requests
 * @param {string} userId - The user ID to authenticate as
 * @param {Object} options - Options for token generation
 * @param {boolean} options.expired - Whether to generate an expired token
 * @param {boolean} options.invalid - Whether to generate an invalid token
 * @returns {Object} Headers object with Authorization header
 */
export function createAuthHeaders(userId, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Skip authentication if not enabled
  if (!config.authEnabled) {
    if (config.verbose) {
      console.log('Authentication is disabled, skipping token generation');
    }
    return headers;
  }

  // Get the authentication token from environment or generate one
  const authToken = process.env.AUTH0_TEST_TOKEN || generateAuthToken(userId, options);

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  } else if (config.verbose) {
    console.warn('No authentication token available');
  }

  return headers;
}

/**
 * Generate a JWT token for testing
 * @param {string} userId - The user ID to include in the token
 * @param {Object} options - Options for token generation
 * @param {boolean} options.expired - Whether to generate an expired token
 * @param {boolean} options.invalid - Whether to generate an invalid token
 * @returns {string} JWT token
 */
export function generateAuthToken(userId, options = {}) {
  if (!userId && !options.invalid) {
    if (config.verbose) {
      console.warn('No user ID provided for token generation');
    }
    return null;
  }

  try {
    const payload = {
      sub: options.invalid ? 'invalid-user-id' : userId,
      iss: 'https://test.auth0.com/',
      aud: 'test-api',
      iat: Math.floor(Date.now() / 1000),
      exp: options.expired
        ? Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
        : Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
    };

    const token = jwt.sign(payload, config.jwtConfig.secret);
    
    if (config.verbose) {
      console.log(`Generated ${options.expired ? 'expired ' : ''}${options.invalid ? 'invalid ' : ''}token for user ${userId || 'unknown'}`);
    }
    
    return token;
  } catch (error) {
    console.error('Error generating auth token:', error);
    return null;
  }
}

export default { createAuthHeaders, generateAuthToken };
