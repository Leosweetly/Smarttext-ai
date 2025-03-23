#!/usr/bin/env node

/**
 * This script tests the Airtable connection and basic functionality.
 * It uses direct Airtable API calls rather than importing the Data module.
 * 
 * Usage: node scripts/test-airtable-connection.js
 */

require('dotenv').config({ path: '.env.local' });
const Airtable = require('airtable');

// Simple color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to log section headers
function logSection(title) {
  console.log('\n' + colors.bright + colors.cyan + '='.repeat(50) + colors.reset);
  console.log(` ${title} `);
  console.log(colors.bright + colors.cyan + '='.repeat(50) + colors.reset + '\n');
}

// Helper function to log success messages
function logSuccess(message) {
  console.log(colors.green + '✓ ' + colors.reset + message);
}

// Helper function to log error messages
function logError(message, error) {
  console.log(colors.red + '✗ ' + colors.reset + message);
  if (error) {
    console.error('  Error details:', error.message || error);
  }
}

// Helper function to log info messages
function logInfo(message) {
  console.log(colors.yellow + 'ℹ ' + colors.reset + message);
}

// Test Airtable connection
async function testAirtableConnection() {
  logSection('Testing Airtable Connection');
  
  try {
    // Check if Airtable credentials are set
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
      logError('Airtable credentials not found in environment variables');
      return false;
    }
    
    logInfo('Airtable credentials found in environment variables');
    
    // Initialize Airtable base
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    
    // Try to get the Businesses table
    const businessesTable = base('Businesses');
    logSuccess('Successfully connected to Airtable and got the Businesses table');
    
    // Try to get records from the Businesses table
    const records = await businessesTable.select({ maxRecords: 10 }).firstPage();
    logSuccess(`Successfully retrieved ${records.length} records from the Businesses table`);
    
    if (records.length > 0) {
      const firstRecord = records[0];
      logInfo(`First record: ${firstRecord.get('Name')} (${firstRecord.id})`);
      
      // Get field names from the first record
      const fields = Object.keys(firstRecord.fields);
      logInfo(`Fields: ${fields.join(', ')}`);
    }
    
    return true;
  } catch (error) {
    logError('Error connecting to Airtable', error);
    return false;
  }
}

// Test business data retrieval
async function testBusinessDataRetrieval() {
  logSection('Testing Business Data Retrieval');
  
  try {
    // Initialize Airtable base
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const businessesTable = base('Businesses');
    
    // Get all businesses
    logInfo('Getting all businesses...');
    const records = await businessesTable.select({ maxRecords: 100 }).firstPage();
    logSuccess(`Successfully retrieved ${records.length} businesses`);
    
    if (records.length > 0) {
      const firstRecord = records[0];
      const businessId = firstRecord.id;
      const businessName = firstRecord.get('Name');
      logInfo(`First business: ${businessName} (${businessId})`);
      
      // Get business by ID
      logInfo('Getting business by ID...');
      const business = await businessesTable.find(businessId);
      if (business) {
        logSuccess(`Successfully retrieved business by ID: ${business.get('Name')}`);
      } else {
        logError('Failed to retrieve business by ID');
      }
      
      // Get businesses by type
      logInfo('Getting businesses by type...');
      const businessType = firstRecord.get('Business Type') || 'restaurant';
      const businessesByType = await businessesTable.select({
        filterByFormula: `{Business Type} = '${businessType}'`
      }).firstPage();
      
      if (businessesByType && businessesByType.length > 0) {
        logSuccess(`Successfully retrieved ${businessesByType.length} businesses of type ${businessType}`);
      } else {
        logError(`Failed to retrieve businesses of type ${businessType}`);
      }
      
      return true;
    } else {
      logError('No businesses found');
      return false;
    }
  } catch (error) {
    logError('Error testing business data retrieval', error);
    return false;
  }
}

// Test business creation and updates
async function testBusinessCreationAndUpdates() {
  logSection('Testing Business Creation and Updates');
  
  try {
    // Initialize Airtable base
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const businessesTable = base('Businesses');
    
    // Create a test business
    logInfo('Creating a test business...');
    const testBusiness = {
      Name: `Test Business ${Date.now()}`,
      'Business Type': 'test',
      'Phone Number': `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      Address: '123 Test St, Test City, CA 12345',
      'Subscription Tier': 'basic',
      'Hours JSON': JSON.stringify({
        Monday: '9:00 AM - 5:00 PM',
        Tuesday: '9:00 AM - 5:00 PM',
        Wednesday: '9:00 AM - 5:00 PM',
        Thursday: '9:00 AM - 5:00 PM',
        Friday: '9:00 AM - 5:00 PM',
        Saturday: 'Closed',
        Sunday: 'Closed'
      }),
      'FAQs JSON': JSON.stringify([
        {
          question: 'What is this?',
          defaultAnswer: 'This is a test business.'
        }
      ])
    };
    
    const createdRecord = await businessesTable.create(testBusiness);
    if (createdRecord) {
      const createdBusinessId = createdRecord.id;
      const createdBusinessName = createdRecord.get('Name');
      logSuccess(`Successfully created test business: ${createdBusinessName} (${createdBusinessId})`);
      
      // Update the test business
      logInfo('Updating the test business...');
      const updatedData = {
        Name: `${createdBusinessName} (Updated)`,
        Address: '456 Updated St, Test City, CA 12345'
      };
      
      const updatedRecord = await businessesTable.update(createdBusinessId, updatedData);
      if (updatedRecord && updatedRecord.get('Name') === updatedData.Name) {
        logSuccess(`Successfully updated test business: ${updatedRecord.get('Name')}`);
      } else {
        logError('Failed to update test business');
      }
      
      // Clean up - mark the test business for deletion
      logInfo('Marking test business for deletion...');
      await businessesTable.update(createdBusinessId, {
        Name: `[TEST - DELETE] ${createdBusinessName}`,
      });
      logSuccess('Successfully marked test business for deletion');
      
      return true;
    } else {
      logError('Failed to create test business');
      return false;
    }
  } catch (error) {
    logError('Error testing business creation and updates', error);
    return false;
  }
}

// Main test function
async function runTests() {
  logSection('SmartText AI Airtable Connection Tests');
  
  // Check for Airtable credentials
  logInfo('Checking for Airtable credentials...');
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    logError('Airtable credentials not found in environment variables');
    logInfo('Please add AIRTABLE_API_KEY and AIRTABLE_BASE_ID to .env.local');
    return;
  }
  
  logSuccess('Airtable credentials found in environment variables');
  
  // Run tests
  const results = {
    airtableConnection: await testAirtableConnection(),
    businessDataRetrieval: await testBusinessDataRetrieval(),
    businessCreationAndUpdates: await testBusinessCreationAndUpdates()
  };
  
  // Print test summary
  logSection('Test Summary');
  
  const allTestsPassed = Object.values(results).every(result => result === true);
  
  if (allTestsPassed) {
    logSuccess('All tests completed successfully');
  } else {
    logError('Some tests failed - check the logs above for details');
  }
  
  console.log('\nTest Results:');
  Object.entries(results).forEach(([test, passed]) => {
    if (passed) {
      console.log(`  ${test}: ${colors.green}Passed${colors.reset}`);
    } else {
      console.log(`  ${test}: ${colors.red}Failed${colors.reset}`);
    }
  });
  
  console.log('\nNote: These tests were run against the actual Airtable database.');
  console.log('Any test businesses created have been marked for deletion.');
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
