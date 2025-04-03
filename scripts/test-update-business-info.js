/**
 * Test script for the update-business-info API endpoint
 * 
 * This script sends a POST request to the API endpoint to verify it's working correctly.
 * It tests both local and production endpoints and provides detailed error information.
 */

import fetch from 'node-fetch';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local
const envPath = resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

// Define API endpoints to test
const endpoints = [
  {
    name: 'Local API (v1)',
    url: 'http://localhost:3000/api/update-business-info',
    enabled: true
  },
  {
    name: 'Local API (v2)',
    url: 'http://localhost:3000/api/update-business-info-v2',
    enabled: true
  },
  {
    name: 'Production API',
    url: process.env.NEXT_PUBLIC_API_BASE_URL + '/api/update-business-info',
    enabled: true
  }
];

// Test data
const testData = {
  name: 'Test Business ' + new Date().toISOString().slice(0, 16).replace('T', ' '),
  industry: 'Technology',
  size: 'Small',
  website: 'https://example.com'
};

/**
 * Test a single endpoint
 */
async function testEndpoint(endpoint) {
  console.log(chalk.blue(`\n🧪 Testing ${endpoint.name}...`));
  console.log(chalk.gray(`URL: ${endpoint.url}`));
  console.log(chalk.gray('Request body:'), JSON.stringify(testData, null, 2));
  
  try {
    const startTime = Date.now();
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:8080' // Test CORS with localhost origin
      },
      body: JSON.stringify(testData),
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log(chalk.gray('Response body:'), JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(chalk.red('Error parsing JSON response:'), error.message);
      console.log(chalk.gray('Raw response:'), responseText);
      return false;
    }
    
    console.log(chalk.gray(`Response status: ${response.status} ${response.statusText}`));
    console.log(chalk.gray(`Response time: ${responseTime}ms`));
    
    if (response.ok) {
      console.log(chalk.green(`✅ ${endpoint.name} test passed!`));
      
      // If we got a record ID, store it for future tests
      if (data.id) {
        console.log(chalk.blue(`📝 Record created with ID: ${data.id}`));
        
        // Test updating the record
        if (endpoint.enabled) {
          await testUpdateRecord(endpoint, data.id);
        }
      }
      
      return true;
    } else {
      console.log(chalk.red(`❌ ${endpoint.name} test failed! API endpoint returned an error.`));
      if (data.error) {
        console.log(chalk.red(`Error: ${data.error}`));
      }
      if (data.code) {
        console.log(chalk.red(`Error code: ${data.code}`));
      }
      if (data.details) {
        console.log(chalk.red(`Details: ${data.details}`));
      }
      return false;
    }
  } catch (error) {
    console.error(chalk.red(`❌ ${endpoint.name} test failed! Error:`), error.message);
    return false;
  }
}

/**
 * Test updating a record
 */
async function testUpdateRecord(endpoint, recordId) {
  console.log(chalk.blue(`\n🔄 Testing update for record ${recordId}...`));
  
  const updateData = {
    ...testData,
    name: testData.name + ' (Updated)',
    recordId
  };
  
  console.log(chalk.gray('Update request body:'), JSON.stringify(updateData, null, 2));
  
  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log(chalk.gray('Update response body:'), JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(chalk.red('Error parsing JSON response:'), error.message);
      console.log(chalk.gray('Raw response:'), responseText);
      return false;
    }
    
    if (response.ok) {
      console.log(chalk.green(`✅ Record update test passed!`));
      return true;
    } else {
      console.log(chalk.red(`❌ Record update test failed!`));
      return false;
    }
  } catch (error) {
    console.error(chalk.red(`❌ Record update test failed! Error:`), error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(chalk.blue('🧪 Testing update-business-info API endpoints...'));
  console.log(chalk.gray('Test data:'), JSON.stringify(testData, null, 2));
  
  let passedTests = 0;
  let totalTests = 0;
  
  for (const endpoint of endpoints) {
    if (endpoint.enabled) {
      totalTests++;
      const passed = await testEndpoint(endpoint);
      if (passed) passedTests++;
    }
  }
  
  console.log(chalk.blue(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`));
  
  if (passedTests === totalTests) {
    console.log(chalk.green('✅ All tests passed!'));
  } else {
    console.log(chalk.yellow(`⚠️ ${totalTests - passedTests} tests failed.`));
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(chalk.red('Unexpected error:'), error);
  process.exit(1);
});
