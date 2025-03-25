/**
 * Request utilities for the onboarding API test suite
 */

import fetch from 'node-fetch';
import config from '../config.mjs';
import { createAuthHeaders } from './auth.mjs';

/**
 * Make a GET request to the API
 * @param {string} endpoint - The endpoint to request (relative to the API path)
 * @param {Object} options - Request options
 * @param {string} options.userId - The user ID to authenticate as
 * @param {Object} options.headers - Additional headers to include
 * @param {boolean} options.skipAuth - Whether to skip authentication
 * @returns {Promise<Object>} Response object with status and data
 */
export async function get(endpoint, options = {}) {
  return makeRequest(endpoint, 'GET', null, options);
}

/**
 * Make a POST request to the API
 * @param {string} endpoint - The endpoint to request (relative to the API path)
 * @param {Object} body - The request body
 * @param {Object} options - Request options
 * @param {string} options.userId - The user ID to authenticate as
 * @param {Object} options.headers - Additional headers to include
 * @param {boolean} options.skipAuth - Whether to skip authentication
 * @returns {Promise<Object>} Response object with status and data
 */
export async function post(endpoint, body, options = {}) {
  return makeRequest(endpoint, 'POST', body, options);
}

/**
 * Make a PUT request to the API
 * @param {string} endpoint - The endpoint to request (relative to the API path)
 * @param {Object} body - The request body
 * @param {Object} options - Request options
 * @param {string} options.userId - The user ID to authenticate as
 * @param {Object} options.headers - Additional headers to include
 * @param {boolean} options.skipAuth - Whether to skip authentication
 * @returns {Promise<Object>} Response object with status and data
 */
export async function put(endpoint, body, options = {}) {
  return makeRequest(endpoint, 'PUT', body, options);
}

/**
 * Make a DELETE request to the API
 * @param {string} endpoint - The endpoint to request (relative to the API path)
 * @param {Object} options - Request options
 * @param {string} options.userId - The user ID to authenticate as
 * @param {Object} options.headers - Additional headers to include
 * @param {boolean} options.skipAuth - Whether to skip authentication
 * @returns {Promise<Object>} Response object with status and data
 */
export async function del(endpoint, options = {}) {
  return makeRequest(endpoint, 'DELETE', null, options);
}

/**
 * Make a request to the API
 * @param {string} endpoint - The endpoint to request (relative to the API path)
 * @param {string} method - The HTTP method to use
 * @param {Object} body - The request body
 * @param {Object} options - Request options
 * @param {string} options.userId - The user ID to authenticate as
 * @param {Object} options.headers - Additional headers to include
 * @param {boolean} options.skipAuth - Whether to skip authentication
 * @returns {Promise<Object>} Response object with status and data
 */
export async function makeRequest(endpoint, method = 'GET', body = null, options = {}) {
  const fullEndpoint = endpoint.startsWith('/api') 
    ? endpoint 
    : config.apiPath + (endpoint === '/' ? '' : endpoint);
  
  // Prepare headers
  let headers = options.headers || {};
  
  // Add authentication headers if needed
  if (!options.skipAuth) {
    headers = {
      ...headers,
      ...createAuthHeaders(options.userId)
    };
  }
  
  // Prepare request options
  const requestOptions = {
    method,
    headers,
  };
  
  // Add body if provided
  if (body) {
    requestOptions.body = JSON.stringify(body);
  }
  
  // Log request details if verbose
  if (config.verbose) {
    console.log(`Making ${method} request to ${fullEndpoint}`);
    console.log('Headers:', headers);
    if (body) {
      console.log('Body:', JSON.stringify(body, null, 2));
    }
  }
  
  // Start timer for performance measurement
  const startTime = Date.now();
  
  try {
    // Make the request
    const response = await fetch(`${config.baseUrl}${fullEndpoint}`, requestOptions);
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Log response time if verbose
    if (config.verbose) {
      console.log(`Response time: ${responseTime}ms`);
    }
    
    // Get the response text
    const responseText = await response.text();
    
    // Log raw response if verbose
    if (config.verbose) {
      console.log('Raw response:', responseText);
    }
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      if (config.verbose) {
        console.error('Error parsing response as JSON:', error);
      }
      data = { 
        success: false, 
        error: 'Invalid JSON response', 
        rawResponse: responseText 
      };
    }
    
    return { 
      status: response.status, 
      data,
      responseTime
    };
  } catch (error) {
    if (config.verbose) {
      console.error(`Error making request to ${endpoint}:`, error);
    }
    
    return { 
      status: 500, 
      data: { 
        success: false, 
        error: error.message 
      },
      responseTime: Date.now() - startTime
    };
  }
}

export default { get, post, put, del, makeRequest };
