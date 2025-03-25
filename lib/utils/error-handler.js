/**
 * Error handling utilities for SmartText AI
 * 
 * This module provides standardized error handling functions for use throughout the application.
 * It includes functions for logging errors, formatting error messages, and handling specific types of errors.
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Log an error to the console and Sentry (if available)
 * @param {Error} error - The error object
 * @param {Object} metadata - Additional metadata to include with the error
 * @param {string} context - The context in which the error occurred
 */
export function logError(error, metadata = {}, context = 'general') {
  // Always log to console
  console.error(`[${context}] Error:`, error);
  
  if (metadata && Object.keys(metadata).length > 0) {
    console.error(`[${context}] Error metadata:`, metadata);
  }
  
  // Log to Sentry if available
  try {
    if (typeof Sentry !== 'undefined' && Sentry.captureException) {
      Sentry.captureException(error, {
        tags: { context },
        extra: metadata
      });
    }
  } catch (sentryError) {
    console.error('Error logging to Sentry:', sentryError);
  }
}

/**
 * Format an error message for display to the user
 * @param {Error|string} error - The error object or message
 * @param {string} fallbackMessage - Fallback message if error is undefined
 * @returns {string} Formatted error message
 */
export function formatErrorMessage(error, fallbackMessage = 'An unexpected error occurred') {
  if (!error) {
    return fallbackMessage;
  }
  
  // If it's an error object with a message
  if (error.message) {
    return error.message;
  }
  
  // If it's a string
  if (typeof error === 'string') {
    return error;
  }
  
  // If it's an API response with an error message
  if (error.error) {
    return error.error;
  }
  
  // If it's an API response with a data.error
  if (error.data && error.data.error) {
    return error.data.error;
  }
  
  // Fallback
  return fallbackMessage;
}

/**
 * Handle API errors in a standardized way
 * @param {Error} error - The error object
 * @param {Function} toast - Toast notification function (optional)
 * @param {string} context - The context in which the error occurred
 * @param {Object} metadata - Additional metadata to include with the error
 * @returns {Object} Standardized error object
 */
export function handleApiError(error, toast = null, context = 'api', metadata = {}) {
  // Log the error
  logError(error, metadata, context);
  
  // Format the error message
  const errorMessage = formatErrorMessage(error, 'API request failed');
  
  // Show toast notification if toast function is provided
  if (toast && typeof toast.error === 'function') {
    toast.error(errorMessage);
  }
  
  // Return standardized error object
  return {
    success: false,
    error: errorMessage,
    status: error.status || 500,
    metadata
  };
}

/**
 * Handle Twilio-specific errors
 * @param {Error} error - The error object
 * @param {Function} toast - Toast notification function (optional)
 * @param {Object} metadata - Additional metadata to include with the error
 * @returns {Object} Standardized error object
 */
export function handleTwilioError(error, toast = null, metadata = {}) {
  // Add Twilio-specific error handling
  let errorMessage = formatErrorMessage(error, 'Twilio request failed');
  
  // Handle specific Twilio error codes
  if (error.code) {
    switch (error.code) {
      case 20003:
        errorMessage = 'Authentication failed. Please check your Twilio credentials.';
        break;
      case 20404:
        errorMessage = 'The requested Twilio resource was not found.';
        break;
      case 20429:
        errorMessage = 'Too many requests to Twilio. Please try again later.';
        break;
      default:
        errorMessage = `Twilio error (${error.code}): ${errorMessage}`;
    }
  }
  
  // Log the error
  logError(error, { ...metadata, twilioErrorCode: error.code }, 'twilio');
  
  // Show toast notification if toast function is provided
  if (toast && typeof toast.error === 'function') {
    toast.error(errorMessage);
  }
  
  // Return standardized error object
  return {
    success: false,
    error: errorMessage,
    twilioErrorCode: error.code,
    status: error.status || 500,
    metadata
  };
}

/**
 * Handle Airtable-specific errors
 * @param {Error} error - The error object
 * @param {Function} toast - Toast notification function (optional)
 * @param {Object} metadata - Additional metadata to include with the error
 * @returns {Object} Standardized error object
 */
export function handleAirtableError(error, toast = null, metadata = {}) {
  // Add Airtable-specific error handling
  let errorMessage = formatErrorMessage(error, 'Airtable request failed');
  
  // Handle specific Airtable error types
  if (error.error && error.error.type) {
    switch (error.error.type) {
      case 'AUTHENTICATION_REQUIRED':
        errorMessage = 'Authentication failed. Please check your Airtable API key.';
        break;
      case 'INVALID_REQUEST_UNKNOWN_COLUMN':
        errorMessage = 'Invalid Airtable column referenced.';
        break;
      case 'TABLE_NOT_FOUND':
        errorMessage = 'The requested Airtable table was not found.';
        break;
      case 'RATE_LIMIT_EXCEEDED':
        errorMessage = 'Airtable rate limit exceeded. Please try again later.';
        break;
      default:
        errorMessage = `Airtable error (${error.error.type}): ${errorMessage}`;
    }
  }
  
  // Log the error
  logError(error, { ...metadata, airtableErrorType: error.error?.type }, 'airtable');
  
  // Show toast notification if toast function is provided
  if (toast && typeof toast.error === 'function') {
    toast.error(errorMessage);
  }
  
  // Return standardized error object
  return {
    success: false,
    error: errorMessage,
    airtableErrorType: error.error?.type,
    status: error.status || 500,
    metadata
  };
}

/**
 * Handle Auth0-specific errors
 * @param {Error} error - The error object
 * @param {Function} toast - Toast notification function (optional)
 * @param {Object} metadata - Additional metadata to include with the error
 * @returns {Object} Standardized error object
 */
export function handleAuth0Error(error, toast = null, metadata = {}) {
  // Add Auth0-specific error handling
  let errorMessage = formatErrorMessage(error, 'Authentication failed');
  
  // Handle specific Auth0 error codes
  if (error.error) {
    switch (error.error) {
      case 'invalid_grant':
        errorMessage = 'Invalid credentials. Please check your username and password.';
        break;
      case 'access_denied':
        errorMessage = 'Access denied. You do not have permission to perform this action.';
        break;
      case 'login_required':
        errorMessage = 'Login required. Please sign in to continue.';
        break;
      default:
        errorMessage = `Auth0 error (${error.error}): ${errorMessage}`;
    }
  }
  
  // Log the error
  logError(error, { ...metadata, auth0ErrorCode: error.error }, 'auth0');
  
  // Show toast notification if toast function is provided
  if (toast && typeof toast.error === 'function') {
    toast.error(errorMessage);
  }
  
  // Return standardized error object
  return {
    success: false,
    error: errorMessage,
    auth0ErrorCode: error.error,
    status: error.status || 401,
    metadata
  };
}
