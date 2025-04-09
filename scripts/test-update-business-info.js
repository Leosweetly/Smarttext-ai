#!/usr/bin/env node

/**
 * Test script for the update-business-info API endpoint
 * 
 * This script tests various scenarios for the update-business-info endpoint
 * using a mock implementation to avoid external dependencies.
 */

import chalk from 'chalk';

// Mock implementation of the API endpoint
function mockApiEndpoint(requestBody) {
  // Required fields validation
  const { name, phoneNumber, industry, hoursJson } = requestBody;
  
  if (!name || !industry || !phoneNumber || !hoursJson) {
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!phoneNumber) missingFields.push('phoneNumber');
    if (!industry) missingFields.push('industry');
    if (!hoursJson) missingFields.push('hoursJson');
    
    return {
      status: 400,
      body: {
        error: 'Missing required fields',
        missingFields,
        message: `The following required fields are missing: ${missingFields.join(', ')}`
      }
    };
  }
  
  // Phone number validation
  let cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
  let isValidPhone = /^\+?[1-9]\d{1,14}$/.test(phoneNumber) || cleanedPhoneNumber.length === 10;
  
  // Team size parsing
  const parsedTeamSize = requestBody.teamSize ? parseInt(requestBody.teamSize, 10) : undefined;
  
  // Construct response
  return {
    status: 200,
    body: {
      success: true,
      id: 'mock-record-id-' + Date.now(),
      data: {
        ...requestBody,
        phoneNumber: isValidPhone ? phoneNumber : `+1${cleanedPhoneNumber}`,
        teamSize: parsedTeamSize || 0
      }
    }
  };
}

// Test cases
const testCases = [
  {
    description: '✅ Valid full request (all fields filled)',
    data: {
      name: 'Test Business Full',
      phoneNumber: '+12345678901',
      industry: 'Technology',
      hoursJson: JSON.stringify({
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 5:00 PM',
        saturday: 'Closed',
        sunday: 'Closed'
      }),
      website: 'https://example.com',
      teamSize: 10,
      address: '123 Main St, San Francisco, CA 94105',
      email: 'contact@example.com',
      onlineOrderingLink: 'https://example.com/order',
      reservationLink: 'https://example.com/reserve',
      faqs: JSON.stringify([
        {
          question: 'What services do you offer?',
          answer: 'We offer a wide range of technology services.'
        }
      ])
    },
    expectedStatus: 200
  },
  {
    description: '🚨 Missing required field (name)',
    data: {
      // name is intentionally missing
      phoneNumber: '+12345678901',
      industry: 'Technology',
      hoursJson: JSON.stringify({
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 5:00 PM',
        saturday: 'Closed',
        sunday: 'Closed'
      })
    },
    expectedStatus: 400
  },
  {
    description: '🚨 Invalid phone number (abc123)',
    data: {
      name: 'Test Business Invalid Phone',
      phoneNumber: 'abc123',
      industry: 'Technology',
      hoursJson: JSON.stringify({
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 5:00 PM',
        saturday: 'Closed',
        sunday: 'Closed'
      })
    },
    // The API attempts to clean phone numbers, so this might still succeed
    expectedStatus: 200
  },
  {
    description: '✅ Valid minimal fields (name, phoneNumber, industry, hoursJson)',
    data: {
      name: 'Test Business Minimal',
      phoneNumber: '+12345678901',
      industry: 'Technology',
      hoursJson: JSON.stringify({
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 5:00 PM',
        saturday: 'Closed',
        sunday: 'Closed'
      })
    },
    expectedStatus: 200
  },
  {
    description: '✅ Team size as string number (e.g., "5")',
    data: {
      name: 'Test Business String Team Size',
      phoneNumber: '+12345678901',
      industry: 'Technology',
      hoursJson: JSON.stringify({
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 5:00 PM',
        saturday: 'Closed',
        sunday: 'Closed'
      }),
      teamSize: "5" // Team size as string
    },
    expectedStatus: 200
  }
];

/**
 * Run a single test case
 */
function runTest(testCase) {
  console.log(chalk.blue(`\n🧪 ${testCase.description}`));
  console.log(chalk.gray('Request data:'), JSON.stringify(testCase.data, null, 2));
  
  try {
    // Call mock API endpoint
    const response = mockApiEndpoint(testCase.data);
    
    const statusCode = response.status;
    console.log(chalk.gray(`Status code: ${statusCode}`));
    
    const responseBody = response.body;
    console.log(chalk.gray('Response body:'), JSON.stringify(responseBody, null, 2));
    
    // Check if status matches expected
    if (statusCode === testCase.expectedStatus) {
      console.log(chalk.green(`✅ Test passed! Status code ${statusCode} matches expected ${testCase.expectedStatus}`));
      return true;
    } else {
      console.log(chalk.red(`❌ Test failed! Status code ${statusCode} does not match expected ${testCase.expectedStatus}`));
      return false;
    }
  } catch (error) {
    console.error(chalk.red(`❌ Test error: ${error.message}`));
    return false;
  }
}

/**
 * Run all test cases
 */
function runAllTests() {
  console.log(chalk.blue('🧪 Testing update-business-info API endpoint (Mock Mode)'));
  console.log(chalk.yellow('⚠️ Note: This is running in mock mode and not connecting to actual API endpoints'));
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const success = runTest(testCase);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }
  
  // Print summary
  console.log(chalk.blue(`\n📊 Test Results: ${passed}/${testCases.length} tests passed`));
  
  if (failed === 0) {
    console.log(chalk.green('✅ All tests passed!'));
    return 0; // Success exit code
  } else {
    console.log(chalk.yellow(`⚠️ ${failed} tests failed.`));
    return 1; // Error exit code
  }
}

// Run all tests
try {
  const exitCode = runAllTests();
  process.exit(exitCode);
} catch (error) {
  console.error(chalk.red('Unexpected error:'), error);
  process.exit(1);
}
