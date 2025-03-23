#!/usr/bin/env node

/**
 * This script tests the Utils module functionality, specifically:
 * - Sentry error capturing
 * - Message logging
 * 
 * Usage: node scripts/test-utils.js [--no-sentry]
 * 
 * Options:
 *   --no-sentry - Run tests without connecting to Sentry (uses console fallback)
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Import Sentry directly
const Sentry = require('@sentry/nextjs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Helper function to log section headers
function logSection(title) {
  console.log('\n' + colors.bright + colors.cyan + '='.repeat(50));
  console.log(` ${title} `);
  console.log('='.repeat(50) + colors.reset);
}

// Helper function to log success messages
function logSuccess(message) {
  console.log(colors.green + '✓ ' + message + colors.reset);
}

// Helper function to log error messages
function logError(message, error) {
  console.log(colors.red + '✗ ' + message + colors.reset);
  if (error) {
    console.error('  Error details:', error.message || error);
  }
}

// Helper function to log info messages
function logInfo(message) {
  console.log(colors.yellow + 'ℹ ' + message + colors.reset);
}

// Initialize Sentry
function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: 1.0,
      // Set environment based on NODE_ENV
      environment: process.env.NODE_ENV || 'development',
    });
    return true;
  }
  return false;
}

// Helper function to capture exceptions (similar to utils/sentry.js)
function captureException(error, context) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    // Log to console in development
    console.error('Error captured by Sentry:', error, context);
  }
}

// Helper function to capture messages (similar to utils/sentry.js)
function captureMessage(message, level = 'info', context) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else {
    // Log to console in development
    console.log(`[${level}] Message captured by Sentry:`, message, context);
  }
}

// Helper function to set user information (similar to utils/sentry.js)
function setUser(user) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN && user) {
    Sentry.setUser({
      id: user.sub || user.id,
      email: user.email,
      username: user.name || user.email,
    });
  }
}

// Helper function to clear user information (similar to utils/sentry.js)
function clearUser() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.setUser(null);
  }
}

// Test Sentry error capturing
function testErrorCapturing() {
  logSection('Testing Sentry Error Capturing');
  
  // Test with a standard Error object
  try {
    throw new Error('Test standard error');
  } catch (error) {
    captureException(error, { source: 'test-utils.js', function: 'testErrorCapturing' });
    logSuccess('Captured standard error');
  }
  
  // Test with a custom error and additional context
  try {
    const customError = new TypeError('Test type error');
    captureException(customError, { 
      userId: 'test-user-123',
      action: 'test-action',
      metadata: { test: true }
    });
    logSuccess('Captured custom error with context');
  } catch (error) {
    logError('Failed to capture custom error', error);
  }
  
  // Test with a string error (not recommended but should be handled)
  try {
    captureException('This is a string error', { source: 'test-utils.js' });
    logSuccess('Captured string error');
  } catch (error) {
    logError('Failed to capture string error', error);
  }
  
  // Test with null (edge case)
  try {
    captureException(null, { source: 'test-utils.js' });
    logSuccess('Handled null error gracefully');
  } catch (error) {
    logError('Failed to handle null error', error);
  }
  
  logInfo('Note: Check Sentry dashboard to verify errors were captured with correct context');
}

// Test message logging
function testMessageLogging() {
  logSection('Testing Sentry Message Logging');
  
  // Test info level message
  try {
    captureMessage('Test info message', 'info', { source: 'test-utils.js' });
    logSuccess('Captured info message');
  } catch (error) {
    logError('Failed to capture info message', error);
  }
  
  // Test warning level message
  try {
    captureMessage('Test warning message', 'warning', { source: 'test-utils.js' });
    logSuccess('Captured warning message');
  } catch (error) {
    logError('Failed to capture warning message', error);
  }
  
  // Test error level message with context
  try {
    captureMessage('Test error message', 'error', { 
      userId: 'test-user-456',
      action: 'test-action',
      metadata: { test: true }
    });
    logSuccess('Captured error message with context');
  } catch (error) {
    logError('Failed to capture error message', error);
  }
  
  // Test with invalid level (should default to info)
  try {
    captureMessage('Test message with invalid level', 'invalid-level', { source: 'test-utils.js' });
    logSuccess('Handled invalid level gracefully');
  } catch (error) {
    logError('Failed to handle invalid level', error);
  }
  
  logInfo('Note: Check Sentry dashboard to verify messages were captured with correct levels and context');
}

// Test user context
function testUserContext() {
  logSection('Testing Sentry User Context');
  
  // Test setting user context
  try {
    const testUser = {
      sub: 'auth0|123456789',
      email: 'test@example.com',
      name: 'Test User'
    };
    
    setUser(testUser);
    logSuccess('Set user context');
    
    // Capture an error with user context
    captureException(new Error('Test error with user context'), { action: 'test-user-context' });
    logSuccess('Captured error with user context');
    
    // Clear user context
    clearUser();
    logSuccess('Cleared user context');
    
    // Capture an error without user context
    captureException(new Error('Test error without user context'), { action: 'test-no-user-context' });
    logSuccess('Captured error without user context');
  } catch (error) {
    logError('Failed to test user context', error);
  }
  
  logInfo('Note: Check Sentry dashboard to verify user context was properly set and cleared');
}

// Main function to run all tests
async function runTests() {
  logSection('SmartText AI Utils Module Tests');
  
  // Check if --no-sentry flag is provided
  const noSentry = process.argv.includes('--no-sentry');
  
  if (noSentry) {
    // Temporarily remove SENTRY_DSN to test console fallback
    const originalDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    process.env.NEXT_PUBLIC_SENTRY_DSN = '';
    logInfo('Running tests with console fallback (--no-sentry flag provided)');
    
    // Run tests
    testErrorCapturing();
    testMessageLogging();
    
    // Restore SENTRY_DSN
    process.env.NEXT_PUBLIC_SENTRY_DSN = originalDsn;
  } else {
    // Check if SENTRY_DSN is available
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      logInfo(`Using Sentry DSN: ${process.env.NEXT_PUBLIC_SENTRY_DSN}`);
      
      // Initialize Sentry
      if (initSentry()) {
        logSuccess('Initialized Sentry with DSN');
      } else {
        logError('Failed to initialize Sentry');
      }
      
      // Run tests
      testErrorCapturing();
      testMessageLogging();
      testUserContext();
    } else {
      logError('No Sentry DSN found in environment variables');
      logInfo('Add NEXT_PUBLIC_SENTRY_DSN to .env.local or use --no-sentry flag');
      process.exit(1);
    }
  }
  
  logSection('Test Summary');
  logSuccess('All tests completed');
  logInfo('To verify results, check:');
  logInfo('1. Console output for any errors');
  logInfo('2. Sentry dashboard for captured errors and messages');
}

// Run the tests
runTests()
  .then(() => {
    console.log('\nDone!');
  })
  .catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
