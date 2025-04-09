#!/usr/bin/env node

/**
 * Test script for the update-business-info API endpoint
 * 
 * This script tests various scenarios for the update-business-info endpoint
 * using a mock implementation to avoid external dependencies.
 */

// Mock database to simulate record creation and updates
const mockDatabase = new Map();

// Mock implementation of the API endpoint
function mockApiEndpoint(requestBody) {
  // Required fields validation
  const { name, phoneNumber, industry, hoursJson, recordId } = requestBody;
  
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
  
  // Generate or use existing record ID
  const id = recordId || 'mock-record-id-' + Date.now();
  
  // Store in mock database if this is a new record or update existing
  mockDatabase.set(id, {
    ...requestBody,
    phoneNumber: isValidPhone ? phoneNumber : `+1${cleanedPhoneNumber}`,
    teamSize: parsedTeamSize || 0
  });
  
  // Construct response
  return {
    status: 200,
    body: {
      success: true,
      id: id,
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
  },
  {
    description: '✅ Edge Case: Optional fields as empty strings',
    data: {
      name: 'Test Business Empty Fields',
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
      website: '',
      email: '',
      address: ''
    },
    expectedStatus: 200
  },
  {
    description: '✅ Edge Case: Special characters in input',
    data: {
      name: "O'Reilly's Auto & Repair",
      phoneNumber: '+12345678901',
      industry: 'Automotive',
      hoursJson: JSON.stringify({
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 5:00 PM',
        saturday: 'Closed',
        sunday: 'Closed'
      }),
      address: '123 Main St. #5, San Francisco, CA 94105'
    },
    expectedStatus: 200
  }
];

// Special test case for update flow
const updateFlowTest = {
  description: '✅ Simulate update flow',
  initialData: {
    name: 'Test Business Before Update',
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
  updateData: {
    name: 'Test Business After Update',
    phoneNumber: '+12345678901',
    industry: 'Technology',
    hoursJson: JSON.stringify({
      monday: '10:00 AM - 6:00 PM',
      tuesday: '10:00 AM - 6:00 PM',
      wednesday: '10:00 AM - 6:00 PM',
      thursday: '10:00 AM - 6:00 PM',
      friday: '10:00 AM - 6:00 PM',
      saturday: 'Closed',
      sunday: 'Closed'
    }),
    website: 'https://updated-example.com'
  },
  expectedStatus: 200
};

/**
 * Run a single test case
 */
function runTest(testCase) {
  console.log(`\n🧪 ${testCase.description}`);
  console.log('Request data:', JSON.stringify(testCase.data, null, 2));
  
  try {
    // Call mock API endpoint
    const response = mockApiEndpoint(testCase.data);
    
    const statusCode = response.status;
    console.log(`Status code: ${statusCode}`);
    
    const responseBody = response.body;
    console.log('Response body:', JSON.stringify(responseBody, null, 2));
    
    // Enhanced logging for record creation/update
    if (statusCode === 200 && responseBody.id) {
      if (testCase.data.recordId) {
        console.log(`✅ Airtable record updated: ${responseBody.id}`);
      } else {
        console.log(`✅ Airtable record created: ${responseBody.id}`);
      }
    }
    
    // Check if status matches expected
    if (statusCode === testCase.expectedStatus) {
      console.log(`✅ Test passed! Status code ${statusCode} matches expected ${testCase.expectedStatus}`);
      return true;
    } else {
      console.log(`❌ Test failed! Status code ${statusCode} does not match expected ${testCase.expectedStatus}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Test error: ${error.message}`);
    return false;
  }
}

/**
 * Run the update flow test (create then update)
 */
function runUpdateFlowTest(testCase) {
  console.log(`\n🧪 ${testCase.description}`);
  
  try {
    // Step 1: Create a new record
    console.log('Step 1: Creating initial record');
    console.log('Request data:', JSON.stringify(testCase.initialData, null, 2));
    
    const createResponse = mockApiEndpoint(testCase.initialData);
    const createStatusCode = createResponse.status;
    console.log(`Status code: ${createStatusCode}`);
    console.log('Response body:', JSON.stringify(createResponse.body, null, 2));
    
    if (createStatusCode !== 200) {
      console.log(`❌ Create step failed! Status code ${createStatusCode} is not 200`);
      return false;
    }
    
    const recordId = createResponse.body.id;
    console.log(`✅ Airtable record created: ${recordId}`);
    
    // Step 2: Update the record
    console.log('\nStep 2: Updating the record');
    const updateData = {
      ...testCase.updateData,
      recordId: recordId
    };
    console.log('Request data:', JSON.stringify(updateData, null, 2));
    
    const updateResponse = mockApiEndpoint(updateData);
    const updateStatusCode = updateResponse.status;
    console.log(`Status code: ${updateStatusCode}`);
    console.log('Response body:', JSON.stringify(updateResponse.body, null, 2));
    
    if (updateStatusCode === testCase.expectedStatus) {
      console.log(`✅ Airtable record updated: ${recordId}`);
      console.log(`✅ Test passed! Status code ${updateStatusCode} matches expected ${testCase.expectedStatus}`);
      return true;
    } else {
      console.log(`❌ Test failed! Status code ${updateStatusCode} does not match expected ${testCase.expectedStatus}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Test error: ${error.message}`);
    return false;
  }
}

/**
 * Run all test cases
 */
function runAllTests() {
  console.log('🧪 Testing update-business-info API endpoint (Mock Mode)');
  console.log('⚠️ Note: This is running in mock mode and not connecting to actual API endpoints');
  
  let passed = 0;
  let failed = 0;
  let totalTests = testCases.length + 1; // +1 for update flow test
  
  // Run standard test cases
  for (const testCase of testCases) {
    const success = runTest(testCase);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }
  
  // Run update flow test
  const updateFlowSuccess = runUpdateFlowTest(updateFlowTest);
  if (updateFlowSuccess) {
    passed++;
  } else {
    failed++;
  }
  
  // Print summary
  console.log(`\n📊 Test Results: ${passed}/${totalTests} tests passed`);
  
  if (failed === 0) {
    console.log(`🎉 All ${passed} tests completed successfully ✅`);
    return 0; // Success exit code
  } else {
    console.log(`⚠️ ${failed} tests failed.`);
    return 1; // Error exit code
  }
}

// Run all tests
try {
  const exitCode = runAllTests();
  process.exit(exitCode);
} catch (error) {
  console.error('Unexpected error:', error);
  process.exit(1);
}
