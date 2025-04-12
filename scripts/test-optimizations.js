#!/usr/bin/env node

/**
 * Test Optimizations Script
 * 
 * This script demonstrates the performance optimizations implemented in the system:
 * 1. Business lookup caching
 * 2. SMS rate-limiting
 * 
 * Usage:
 *   node scripts/test-optimizations.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Set up environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Import the modules we want to test
import { getBusinessByPhoneNumber } from '../lib/airtable.js';
import { sendSms, clearSmsRateLimit, getSmsRateLimitTimeRemaining } from '../lib/twilio.ts';

// Test phone numbers
const TEST_BUSINESS_PHONE = '+16193721633';
const TEST_CALLER_PHONE = '+15551234567';

/**
 * Test business lookup caching
 */
async function testBusinessCache() {
  console.log(chalk.blue('🔍 Testing Business Lookup Caching'));
  console.log(chalk.gray('-----------------------------------'));
  
  try {
    // First lookup (should hit Airtable)
    console.log(chalk.yellow('📡 First lookup (should hit Airtable):'));
    console.time('First lookup');
    const business1 = await getBusinessByPhoneNumber(TEST_BUSINESS_PHONE);
    console.timeEnd('First lookup');
    console.log(chalk.green(`✅ Found business: ${business1?.name || 'Not found'}`));
    
    // Second lookup (should hit cache)
    console.log(chalk.yellow('📡 Second lookup (should hit cache):'));
    console.time('Second lookup');
    const business2 = await getBusinessByPhoneNumber(TEST_BUSINESS_PHONE);
    console.timeEnd('Second lookup');
    console.log(chalk.green(`✅ Found business: ${business2?.name || 'Not found'}`));
    
    // Third lookup (should hit cache)
    console.log(chalk.yellow('📡 Third lookup (should hit cache):'));
    console.time('Third lookup');
    const business3 = await getBusinessByPhoneNumber(TEST_BUSINESS_PHONE);
    console.timeEnd('Third lookup');
    console.log(chalk.green(`✅ Found business: ${business3?.name || 'Not found'}`));
    
    console.log(chalk.green('✅ Business cache test completed'));
  } catch (error) {
    console.error(chalk.red('❌ Business cache test failed:'), error.message);
  }
}

/**
 * Test SMS rate-limiting
 */
async function testSmsRateLimiting() {
  console.log(chalk.blue('🔍 Testing SMS Rate-Limiting'));
  console.log(chalk.gray('-----------------------------------'));
  
  try {
    // Clear any existing rate-limit for the test number
    clearSmsRateLimit(TEST_CALLER_PHONE);
    console.log(chalk.yellow(`📡 Cleared rate-limit for ${TEST_CALLER_PHONE}`));
    
    // First SMS (should send)
    console.log(chalk.yellow('📡 First SMS (should send):'));
    const sms1 = await sendSms({
      body: 'Test message 1',
      from: TEST_BUSINESS_PHONE,
      to: TEST_CALLER_PHONE,
      requestId: 'test-1',
      // Use bypassRateLimit: true to avoid actually sending the SMS in this test
      bypassRateLimit: true
    });
    console.log(chalk.green(`✅ SMS 1 status: ${sms1.rateLimited ? 'Rate limited' : 'Sent'}`));
    
    // Second SMS (should be rate-limited)
    console.log(chalk.yellow('📡 Second SMS (should be rate-limited):'));
    const sms2 = await sendSms({
      body: 'Test message 2',
      from: TEST_BUSINESS_PHONE,
      to: TEST_CALLER_PHONE,
      requestId: 'test-2'
    });
    console.log(chalk.green(`✅ SMS 2 status: ${sms2.rateLimited ? 'Rate limited' : 'Sent'}`));
    
    // Check time remaining
    const timeRemaining = getSmsRateLimitTimeRemaining(TEST_CALLER_PHONE);
    const minutesRemaining = Math.round(timeRemaining / (60 * 1000));
    console.log(chalk.yellow(`📡 Time remaining until rate-limit expires: ~${minutesRemaining} minutes`));
    
    // Third SMS with bypass (should send despite rate-limit)
    console.log(chalk.yellow('📡 Third SMS with bypass (should send despite rate-limit):'));
    const sms3 = await sendSms({
      body: 'Test message 3 (bypass)',
      from: TEST_BUSINESS_PHONE,
      to: TEST_CALLER_PHONE,
      requestId: 'test-3',
      bypassRateLimit: true
    });
    console.log(chalk.green(`✅ SMS 3 status: ${sms3.rateLimited ? 'Rate limited' : 'Sent'}`));
    
    console.log(chalk.green('✅ SMS rate-limiting test completed'));
  } catch (error) {
    console.error(chalk.red('❌ SMS rate-limiting test failed:'), error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(chalk.blue('🚀 Starting Optimization Tests'));
  console.log(chalk.gray('==================================='));
  
  // Test business cache
  await testBusinessCache();
  console.log('');
  
  // Test SMS rate-limiting
  await testSmsRateLimiting();
  console.log('');
  
  console.log(chalk.blue('🏁 All tests completed'));
}

// Run the tests
runTests()
  .then(() => {
    console.log(chalk.green('✨ Test script completed successfully!'));
  })
  .catch((error) => {
    console.error(chalk.red('❌ Test script failed:'), error);
    process.exit(1);
  });
