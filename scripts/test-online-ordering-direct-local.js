#!/usr/bin/env node

/**
 * Direct local test script for the online ordering URL detection logic
 * 
 * This script directly tests the online ordering URL detection logic in a local environment,
 * bypassing the API endpoint. This helps confirm that our logic is correct and that any issues
 * are with the API deployment.
 * 
 * Usage: node scripts/test-online-ordering-direct-local.js
 */

import chalk from 'chalk';

console.log(chalk.bold.green('\n================================================='));
console.log(chalk.bold.green('  ONLINE ORDERING URL DETECTION DIRECT LOCAL TEST'));
console.log(chalk.bold.green('================================================='));

// Test cases
const testCases = [
  {
    name: 'Basic ordering keyword',
    message: 'I want to place an order',
    onlineOrderingUrl: 'https://order.testrestaurant.com',
    expectedResult: true
  },
  {
    name: 'Online ordering keyword',
    message: "What's your online ordering?",
    onlineOrderingUrl: 'https://order.testrestaurant.com',
    expectedResult: true
  },
  {
    name: 'No ordering keywords',
    message: 'What are your hours?',
    onlineOrderingUrl: 'https://order.testrestaurant.com',
    expectedResult: false
  },
  {
    name: 'Ordering keyword but no URL',
    message: 'I want to place an order',
    onlineOrderingUrl: null,
    expectedResult: false
  }
];

// Function to test the online ordering URL detection logic
function testOnlineOrderingDetection(message, onlineOrderingUrl) {
  console.log(chalk.cyan('\n----- TEST CASE -----'));
  console.log('Message:', message);
  console.log('Online ordering URL:', onlineOrderingUrl);
  
  // Check if message contains ordering keywords
  const matchResult = message.toLowerCase().match(/order|ordering|place an order/);
  const containsOrderingKeywords = matchResult !== null;
  
  // Determine if this is an online ordering request
  // Convert to boolean to ensure we get true/false (not null/undefined)
  const isOnlineOrderingRequest = Boolean(onlineOrderingUrl && containsOrderingKeywords);
  
  console.log('Match result:', matchResult);
  console.log('Contains ordering keywords:', containsOrderingKeywords);
  console.log('Is online ordering request:', isOnlineOrderingRequest);
  
  return {
    matchResult,
    containsOrderingKeywords,
    isOnlineOrderingRequest
  };
}

// Run all test cases
let passedCount = 0;
let failedCount = 0;

testCases.forEach((testCase, index) => {
  console.log(chalk.bold.yellow(`\n\n======== TEST CASE ${index + 1}: ${testCase.name} ========`));
  
  const result = testOnlineOrderingDetection(testCase.message, testCase.onlineOrderingUrl);
  
  const passed = result.isOnlineOrderingRequest === testCase.expectedResult;
  
  console.log(chalk.cyan('\n----- RESULT -----'));
  console.log('Expected result:', testCase.expectedResult);
  console.log('Actual result:', result.isOnlineOrderingRequest);
  console.log(passed ? chalk.green('✅ TEST PASSED') : chalk.red('❌ TEST FAILED'));
  
  if (passed) {
    passedCount++;
  } else {
    failedCount++;
  }
});

// Print summary
console.log(chalk.bold.green('\n================================================='));
console.log(chalk.bold.green('                 TEST SUMMARY'));
console.log(chalk.bold.green('================================================='));
console.log(`Tests passed: ${passedCount}/${testCases.length}`);
console.log(`Tests failed: ${failedCount}/${testCases.length}`);
console.log(chalk.bold.green('================================================='));

if (failedCount > 0) {
  process.exit(1);
}
