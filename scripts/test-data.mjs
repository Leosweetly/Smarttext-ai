#!/usr/bin/env node

/**
 * This script tests the Data module functionality by performing
 * operations on the Airtable database.
 * 
 * Usage: node --experimental-modules scripts/test-data.mjs
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import chalk from 'chalk';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Import the Data module functions
import pkg from '../lib/data/index.js';
const {
  getTable,
  exploreTableSchema,
  getBusinesses,
  getBusinessById,
  getBusinessesByType,
  getBusinessByPhoneNumber,
  updateBusiness,
  createBusiness,
  getRestaurants,
  getAutoShops,
  fetchBusinessesByType,
  fetchRestaurants,
  fetchAutoShops
} = pkg;

// Helper function to log section headers
function logSection(title) {
  console.log('\n' + chalk.bold.cyan('='.repeat(50)));
  console.log(` ${title} `);
  console.log(chalk.bold.cyan('='.repeat(50)) + '\n');
}

// Helper function to log success messages
function logSuccess(message) {
  console.log(chalk.green('✓ ') + message);
}

// Helper function to log error messages
function logError(message, error) {
  console.log(chalk.red('✗ ') + message);
  if (error) {
    console.error('  Error details:', error.message || error);
  }
}

// Helper function to log info messages
function logInfo(message) {
  console.log(chalk.yellow('ℹ ') + message);
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
    
    // Try to get the Businesses table
    const table = getTable('Businesses');
    logSuccess('Successfully connected to Airtable and got the Businesses table');
    
    // Try to explore the table schema
    const schema = await exploreTableSchema('Businesses');
    logSuccess('Successfully explored the Businesses table schema');
    logInfo(`Found ${schema.recordCount} records in the Businesses table`);
    logInfo(`Fields: ${schema.fields.map(f => f.name).join(', ')}`);
    
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
    // Test getBusinesses
    logInfo('Testing getBusinesses...');
    const businesses = await getBusinesses();
    if (businesses && businesses.length > 0) {
      logSuccess(`Successfully retrieved ${businesses.length} businesses`);
      logInfo(`First business: ${businesses[0].name} (${businesses[0].id})`);
      
      // Save the first business ID for later tests
      const firstBusinessId = businesses[0].id;
      
      // Test getBusinessById
      logInfo('Testing getBusinessById...');
      const business = await getBusinessById(firstBusinessId);
      if (business) {
        logSuccess(`Successfully retrieved business by ID: ${business.name}`);
      } else {
        logError('Failed to retrieve business by ID');
      }
      
      // Test getBusinessesByType
      logInfo('Testing getBusinessesByType...');
      const businessType = businesses[0].businessType || 'restaurant';
      const businessesByType = await getBusinessesByType(businessType);
      if (businessesByType && businessesByType.length > 0) {
        logSuccess(`Successfully retrieved ${businessesByType.length} businesses of type ${businessType}`);
      } else {
        logError(`Failed to retrieve businesses of type ${businessType}`);
      }
      
      // Test getBusinessByPhoneNumber
      logInfo('Testing getBusinessByPhoneNumber...');
      const phoneNumber = businesses[0].phoneNumber;
      if (phoneNumber) {
        const businessByPhone = await getBusinessByPhoneNumber(phoneNumber);
        if (businessByPhone) {
          logSuccess(`Successfully retrieved business by phone number: ${businessByPhone.name}`);
        } else {
          logError('Failed to retrieve business by phone number');
        }
      } else {
        logInfo('Skipping getBusinessByPhoneNumber test (no phone number available)');
      }
      
      return true;
    } else {
      logError('No businesses found or failed to retrieve businesses');
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
    // Create a test business
    logInfo('Creating a test business...');
    const testBusiness = {
      name: `Test Business ${Date.now()}`,
      businessType: 'test',
      phoneNumber: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      address: '123 Test St, Test City, CA 12345',
      subscriptionTier: 'basic',
      hours: {
        Monday: '9:00 AM - 5:00 PM',
        Tuesday: '9:00 AM - 5:00 PM',
        Wednesday: '9:00 AM - 5:00 PM',
        Thursday: '9:00 AM - 5:00 PM',
        Friday: '9:00 AM - 5:00 PM',
        Saturday: 'Closed',
        Sunday: 'Closed'
      },
      faqs: [
        {
          question: 'What is this?',
          defaultAnswer: 'This is a test business.'
        }
      ]
    };
    
    const createdBusiness = await createBusiness(testBusiness);
    if (createdBusiness) {
      logSuccess(`Successfully created test business: ${createdBusiness.name} (${createdBusiness.id})`);
      
      // Update the test business
      logInfo('Updating the test business...');
      const updatedData = {
        name: `${createdBusiness.name} (Updated)`,
        address: '456 Updated St, Test City, CA 12345'
      };
      
      const updatedBusiness = await updateBusiness(createdBusiness.id, updatedData);
      if (updatedBusiness && updatedBusiness.name === updatedData.name) {
        logSuccess(`Successfully updated test business: ${updatedBusiness.name}`);
      } else {
        logError('Failed to update test business');
      }
      
      // Clean up - delete the test business
      // Note: Airtable doesn't have a direct delete function in the JS client,
      // so we'll just rename it to indicate it's a test that can be deleted
      logInfo('Marking test business for deletion...');
      await updateBusiness(createdBusiness.id, {
        name: `[TEST - DELETE] ${createdBusiness.name}`,
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

// Test server actions
async function testServerActions() {
  logSection('Testing Server Actions');
  
  try {
    // Test fetchBusinessesByType
    logInfo('Testing fetchBusinessesByType...');
    const businessType = 'restaurant';
    const businesses = await fetchBusinessesByType(businessType);
    if (businesses && businesses.length > 0) {
      logSuccess(`Successfully fetched ${businesses.length} businesses of type ${businessType}`);
    } else {
      logError(`Failed to fetch businesses of type ${businessType}`);
    }
    
    // Test fetchRestaurants
    logInfo('Testing fetchRestaurants...');
    const restaurants = await fetchRestaurants();
    if (restaurants && restaurants.length > 0) {
      logSuccess(`Successfully fetched ${restaurants.length} restaurants`);
    } else {
      logError('Failed to fetch restaurants');
    }
    
    // Test fetchAutoShops
    logInfo('Testing fetchAutoShops...');
    const autoShops = await fetchAutoShops();
    if (autoShops) {
      logSuccess(`Successfully fetched ${autoShops.length || 0} auto shops`);
    } else {
      logError('Failed to fetch auto shops');
    }
    
    return true;
  } catch (error) {
    logError('Error testing server actions', error);
    return false;
  }
}

// Main test function
async function runTests() {
  logSection('SmartText AI Data Module Tests');
  
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
    businessCreationAndUpdates: await testBusinessCreationAndUpdates(),
    serverActions: await testServerActions()
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
      console.log(`  ${test}: ${chalk.green('Passed')}`);
    } else {
      console.log(`  ${test}: ${chalk.red('Failed')}`);
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
