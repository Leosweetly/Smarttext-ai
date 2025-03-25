#!/usr/bin/env node
/**
 * Onboarding API Test Suite
 * 
 * This script runs tests for the onboarding API endpoints.
 * It can be configured to run against either the mock or production API.
 * 
 * Usage:
 *   node scripts/test-onboarding-api/index.mjs [options]
 * 
 * Options:
 *   --env, -e     Environment to test (mock or production) [default: mock]
 *   --tests, -t   Tests to run (comma-separated: auth,get,post,reset,edge-cases) [default: all]
 *   --verbose, -v Enable verbose logging [default: false]
 * 
 * Examples:
 *   node scripts/test-onboarding-api/index.mjs
 *   node scripts/test-onboarding-api/index.mjs --env=production
 *   node scripts/test-onboarding-api/index.mjs --tests=auth,get
 *   node scripts/test-onboarding-api/index.mjs --env=production --tests=post,reset --verbose
 */

import config from './config.mjs';
import { setupBeforeTests, cleanupAfterTests } from './utils/cleanup.mjs';
import { runAuthTests } from './tests/auth.test.mjs';
import { runGetTests } from './tests/get.test.mjs';
import { runPostTests } from './tests/post.test.mjs';
import { runResetTests } from './tests/reset.test.mjs';
import { runEdgeCasesTests } from './tests/edge-cases.test.mjs';

// Remove "mock" or "test" references from output if needed
const PRODUCTION_MODE = process.env.PRODUCTION_MODE === 'true';

/**
 * Print the test suite header
 */
function printHeader() {
  console.log('='.repeat(80));
  console.log(`=== ${PRODUCTION_MODE ? 'Onboarding API Test Suite' : 'Onboarding API Test Suite'} ===`);
  console.log('='.repeat(80));
  console.log(`Environment: ${config.name}`);
  console.log(`API Base URL: ${config.baseUrl}`);
  console.log(`API Path: ${config.apiPath}`);
  console.log(`Authentication: ${config.authEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(`Tests: ${config.tests.join(', ')}`);
  console.log(`Verbose: ${config.verbose ? 'Enabled' : 'Disabled'}`);
  console.log('='.repeat(80));
}

/**
 * Print the test suite summary
 * @param {Object} results - The test results
 */
function printSummary(results) {
  console.log('\n' + '='.repeat(80));
  console.log(`=== ${PRODUCTION_MODE ? 'Onboarding API Test Results' : 'Onboarding API Test Results'} ===`);
  console.log('='.repeat(80));
  
  // Print results for each test group
  Object.entries(results).forEach(([group, result]) => {
    const total = result.passed + result.failed + result.skipped;
    const status = result.failed > 0 ? 'FAIL' : 'PASS';
    console.log(`${group}: ${result.passed}/${total} passed (${status})`);
  });
  
  // Print overall results
  const totalPassed = Object.values(results).reduce((sum, result) => sum + result.passed, 0);
  const totalFailed = Object.values(results).reduce((sum, result) => sum + result.failed, 0);
  const totalSkipped = Object.values(results).reduce((sum, result) => sum + result.skipped, 0);
  const totalTests = totalPassed + totalFailed + totalSkipped;
  const overallStatus = totalFailed > 0 ? 'FAIL' : 'PASS';
  
  console.log('-'.repeat(80));
  console.log(`Overall: ${totalPassed}/${totalTests} passed (${overallStatus})`);
  console.log('='.repeat(80));
  
  // Exit with appropriate code
  process.exit(totalFailed > 0 ? 1 : 0);
}

/**
 * Run the test suite
 */
async function runTests() {
  printHeader();
  
  try {
    // Set up test environment
    await setupBeforeTests();
    
    // Run tests
    const results = {};
    
    if (config.tests.includes('auth')) {
      results.auth = await runAuthTests();
    }
    
    if (config.tests.includes('get')) {
      results.get = await runGetTests();
    }
    
    if (config.tests.includes('post')) {
      results.post = await runPostTests();
    }
    
    if (config.tests.includes('reset')) {
      results.reset = await runResetTests();
    }
    
    if (config.tests.includes('edge-cases')) {
      results['edge-cases'] = await runEdgeCasesTests();
    }
    
    // Clean up test environment
    await cleanupAfterTests();
    
    // Print summary
    printSummary(results);
  } catch (error) {
    console.error('\n=== Test Suite Error ===');
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
runTests();
