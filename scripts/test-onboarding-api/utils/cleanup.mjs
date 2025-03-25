/**
 * Cleanup utilities for the onboarding API test suite
 */

import { post } from './request.mjs';
import config from '../config.mjs';

/**
 * Set up the test environment before running tests
 */
export async function setupBeforeTests() {
  if (config.verbose) {
    console.log('Setting up test environment...');
  }
  
  // Reset test users if needed
  if (config.env === 'mock') {
    await resetTestUsers();
  }
  
  if (config.verbose) {
    console.log('Test environment setup complete');
  }
}

/**
 * Clean up the test environment after running tests
 */
export async function cleanupAfterTests() {
  if (config.verbose) {
    console.log('Cleaning up test environment...');
  }
  
  // Reset test users if needed
  if (config.env === 'mock') {
    await resetTestUsers();
  }
  
  if (config.verbose) {
    console.log('Test environment cleanup complete');
  }
}

/**
 * Reset test users to their default state
 */
async function resetTestUsers() {
  if (config.verbose) {
    console.log('Resetting test users...');
  }
  
  // Reset each test user
  const userIds = Object.values(config.testUsers);
  
  for (const userId of userIds) {
    if (config.verbose) {
      console.log(`Resetting user ${userId}...`);
    }
    
    try {
      await post('/reset', { userId }, { userId });
    } catch (error) {
      if (config.verbose) {
        console.error(`Error resetting user ${userId}:`, error);
      }
    }
  }
  
  if (config.verbose) {
    console.log('Test users reset complete');
  }
}

export default { setupBeforeTests, cleanupAfterTests };
