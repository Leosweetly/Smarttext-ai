#!/usr/bin/env node

/**
 * Local test script for the online ordering URL direct detection
 * 
 * This script directly tests the online ordering URL detection logic
 * without making an API call
 * 
 * Usage: node scripts/test-online-ordering-local.js
 */

import chalk from 'chalk';

console.log(chalk.bold.green('\n================================================='));
console.log(chalk.bold.green('  LOCAL ONLINE ORDERING URL DETECTION TEST'));
console.log(chalk.bold.green('================================================='));

// Mock business with online ordering URL
const business = {
  id: 'test-business-id',
  name: 'Test Restaurant',
  business_type: 'restaurant',
  public_phone: '+18186518560',
  twilio_phone: '+18186518560',
  online_ordering_url: 'https://order.testrestaurant.com'
};

// Test messages
const testMessages = [
  {
    name: 'Direct Online Ordering Detection - "order" keyword',
    body: 'I want to place an order'
  },
  {
    name: 'Direct Online Ordering Detection - "ordering" keyword',
    body: 'What\'s your online ordering?'
  },
  {
    name: 'Non-ordering message',
    body: 'What are your hours?'
  }
];

// Run tests
testMessages.forEach(test => {
  console.log(chalk.cyan(`\n\n======== TEST: ${test.name} ========`));
  console.log(chalk.cyan(`Message: "${test.body}"`));
  
  // Check if message contains ordering keywords
  const matchResult = test.body.toLowerCase().match(/order|ordering|place an order/);
  const containsOrderingKeywords = matchResult !== null;
  
  // Determine if this is an online ordering request
  const isOnlineOrderingRequest = business.online_ordering_url && containsOrderingKeywords;
  
  // Generate response
  let responseMessage = '';
  let responseSource = '';
  
  if (isOnlineOrderingRequest) {
    responseMessage = `You can place your order here: ${business.online_ordering_url}`;
    responseSource = 'online_ordering_direct';
  } else {
    responseMessage = 'This would be handled by FAQ matching or OpenAI';
    responseSource = 'other';
  }
  
  // Display results
  console.log(chalk.yellow('\nDetection results:'));
  console.log(`Contains ordering keywords: ${containsOrderingKeywords ? chalk.green('Yes') : chalk.red('No')}`);
  console.log(`Has online ordering URL: ${business.online_ordering_url ? chalk.green('Yes') : chalk.red('No')}`);
  console.log(`Is online ordering request: ${isOnlineOrderingRequest ? chalk.green('Yes') : chalk.red('No')}`);
  
  console.log(chalk.yellow('\nResponse:'));
  console.log(`Source: ${responseSource}`);
  console.log(`Message: "${responseMessage}"`);
  
  // Determine test result
  let passed = false;
  let expectedResult = false;
  
  if (test.name.includes('Online Ordering Detection')) {
    // For ordering tests, we expect isOnlineOrderingRequest to be true
    expectedResult = true;
    passed = isOnlineOrderingRequest === true;
  } else {
    // For non-ordering tests, we expect isOnlineOrderingRequest to be false
    expectedResult = false;
    passed = isOnlineOrderingRequest === false;
  }
  
  console.log(chalk.yellow('\nTest evaluation:'));
  console.log(`Expected result: ${expectedResult ? chalk.green('Should detect as ordering request') : chalk.red('Should NOT detect as ordering request')}`);
  console.log(`Actual result: ${isOnlineOrderingRequest ? chalk.green('Detected as ordering request') : chalk.red('Not detected as ordering request')}`);
  // Debug the test result calculation
  console.log(chalk.yellow('\nDebug info:'));
  console.log(`Test name: "${test.name}"`);
  console.log(`Test name includes 'Online Ordering Detection': ${test.name.includes('Online Ordering Detection')}`);
  console.log(`Expected result: ${expectedResult}`);
  console.log(`Actual result (isOnlineOrderingRequest): ${isOnlineOrderingRequest}`);
  console.log(`Are they equal? ${expectedResult === isOnlineOrderingRequest}`);
  
  // Force the passed value to be correct
  passed = expectedResult === isOnlineOrderingRequest;
  
  console.log(`Test result: ${passed ? chalk.green('PASS') : chalk.red('FAIL')}`);
  
  console.log(passed ? chalk.green('\n✅ TEST PASSED') : chalk.red('\n❌ TEST FAILED'));
});

console.log(chalk.bold.green('\n================================================='));
console.log(chalk.bold.green('  TEST SUMMARY'));
console.log(chalk.bold.green('================================================='));
console.log(chalk.green('All tests completed. Check results above.'));
