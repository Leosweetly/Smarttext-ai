/**
 * Test script for the update-business-info API endpoint
 * 
 * This script sends a POST request to the API endpoint to verify it's working correctly.
 * It tests both local and production endpoints and provides detailed error information.
 */

console.log('Script starting...');

import fetch from 'node-fetch';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

console.log('Imports completed');

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));
console.log('__dirname:', __dirname);

// Load environment variables from .env.local
const envPath = resolve(__dirname, '../.env.local');
console.log('envPath:', envPath);
dotenv.config({ path: envPath });
console.log('Environment variables loaded');

// Define API endpoints to test
const endpoints = [
  {
    name: 'Local API (v1)',
    url: 'http://localhost:3002/api/update-business-info',
    enabled: true
  }
];

console.log('Endpoints defined:', endpoints);

// Test data
const testData = {
  name: 'Test Business ' + new Date().toISOString().slice(0, 16).replace('T', ' '),
  phoneNumber: '+1234567890',
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
  size: 'Small',
  website: 'https://example.com',
  faqs: [
    {
      question: 'What services do you offer?',
      answer: 'We offer a wide range of technology services including web development, app development, and cloud solutions.'
    },
    {
      question: 'What are your hours?',
      answer: 'We are open Monday through Friday, 9:00 AM to 5:00 PM.'
    }
  ]
};

console.log('Test data defined');

/**
 * Test a single endpoint
 */
async function testEndpoint(endpoint) {
  console.log(chalk.blue(`\n🧪 Testing ${endpoint.name}...`));
  console.log(chalk.gray(`URL: ${endpoint.url}`));
  console.log(chalk.gray('Request body:'), JSON.stringify(testData, null, 2));
  
  try {
    console.log('Sending request...');
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
    console.log('Response received in', responseTime, 'ms');
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
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
    console.error('Stack trace:', error.stack);
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

console.log('Starting tests...');

// Run the tests
runTests().catch(error => {
  console.error(chalk.red('Unexpected error:'), error);
  process.exit(1);
});
