#!/usr/bin/env node

/**
 * Test script for Twilio phone number configuration
 * 
 * This script tests the Twilio phone number management functionality,
 * allowing users to check, configure, and verify Twilio number settings.
 * 
 * Usage: 
 *   - Check status: node scripts/test-twilio-config.js status +18186518560
 *   - Configure number: node scripts/test-twilio-config.js configure +18186518560
 *   - Bulk configure from Airtable: node scripts/test-twilio-config.js bulk-configure
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// We need to use dynamic import since the Twilio module uses ES modules
async function importModules() {
  // Create a temporary file that re-exports the functions we need
  const tempFile = path.resolve(__dirname, '../temp-twilio-config.js');
  
  fs.writeFileSync(tempFile, `
    import { configureTwilioNumber, bulkConfigureTwilioNumbers, getTwilioNumberStatus } from './lib/twilio/phone-manager.js';
    import { getBusinesses } from './lib/data/business.js';
    
    export async function checkNumberStatus(phoneNumber) {
      return await getTwilioNumberStatus(phoneNumber);
    }
    
    export async function configureNumber(phoneNumber, options) {
      return await configureTwilioNumber(phoneNumber, options);
    }
    
    export async function bulkConfigure(options) {
      const businesses = await getBusinesses();
      return await bulkConfigureTwilioNumbers(businesses, options);
    }
  `);
  
  // Use dynamic import to load the ES module
  const { checkNumberStatus, configureNumber, bulkConfigure } = await import('../temp-twilio-config.js');
  
  // Clean up the temporary file
  fs.unlinkSync(tempFile);
  
  return { checkNumberStatus, configureNumber, bulkConfigure };
}

async function main() {
  try {
    // Check if required environment variables are set
    if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error('❌ Error: TWILIO_SID and TWILIO_AUTH_TOKEN environment variables must be set');
      console.error('Please add these to your .env.local file');
      process.exit(1);
    }
    
    // Parse command line arguments
    const command = process.argv[2];
    const phoneNumber = process.argv[3];
    
    if (!command) {
      printUsage();
      process.exit(1);
    }
    
    // Import the modules
    const { checkNumberStatus, configureNumber, bulkConfigure } = await importModules();
    
    // Execute the requested command
    switch (command) {
      case 'status':
        if (!phoneNumber) {
          console.error('❌ Error: Phone number is required for status command');
          printUsage();
          process.exit(1);
        }
        
        console.log(`Checking status for Twilio number: ${phoneNumber}`);
        const status = await checkNumberStatus(phoneNumber);
        console.log(JSON.stringify(status, null, 2));
        break;
        
      case 'configure':
        if (!phoneNumber) {
          console.error('❌ Error: Phone number is required for configure command');
          printUsage();
          process.exit(1);
        }
        
        console.log(`Configuring Twilio number: ${phoneNumber}`);
        
        // Default options
        const options = {
          voiceUrl: process.env.DEFAULT_TWIML_BIN_URL || 
            'https://handler.twilio.com/twiml/EH123456789abcdef123456789abcdef12', // Replace with your TwiML Bin URL
          statusCallback: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/missed-call`
        };
        
        const result = await configureNumber(phoneNumber, options);
        console.log('Configuration successful:');
        console.log(JSON.stringify(result, null, 2));
        break;
        
      case 'bulk-configure':
        console.log('Bulk configuring all Twilio numbers from Airtable...');
        
        // Default options
        const bulkOptions = {
          voiceUrl: process.env.DEFAULT_TWIML_BIN_URL || 
            'https://handler.twilio.com/twiml/EH123456789abcdef123456789abcdef12', // Replace with your TwiML Bin URL
          statusCallback: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/missed-call`
        };
        
        const bulkResults = await bulkConfigure(bulkOptions);
        
        console.log('Bulk configuration results:');
        console.log(`✅ Successfully configured: ${bulkResults.success.length} numbers`);
        console.log(`❌ Failed to configure: ${bulkResults.failed.length} numbers`);
        
        if (bulkResults.success.length > 0) {
          console.log('\nSuccessfully configured numbers:');
          bulkResults.success.forEach(item => {
            console.log(`- ${item.businessName}: ${item.phoneNumber}`);
          });
        }
        
        if (bulkResults.failed.length > 0) {
          console.log('\nFailed to configure numbers:');
          bulkResults.failed.forEach(item => {
            console.log(`- ${item.businessName}: ${item.phoneNumber} (Error: ${item.error})`);
          });
        }
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
    
    console.log('\nDone!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

function printUsage() {
  console.log(`
Usage:
  node scripts/test-twilio-config.js status +18186518560
  node scripts/test-twilio-config.js configure +18186518560
  node scripts/test-twilio-config.js bulk-configure
  
Commands:
  status <phone_number>   - Check the configuration status of a Twilio number
  configure <phone_number> - Configure a Twilio number with the correct webhooks
  bulk-configure          - Configure all Twilio numbers from Airtable
  
Examples:
  node scripts/test-twilio-config.js status +18186518560
  node scripts/test-twilio-config.js configure +18186518560
  node scripts/test-twilio-config.js bulk-configure
  `);
}

// Execute the main function
main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
