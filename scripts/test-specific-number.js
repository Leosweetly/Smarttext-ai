#!/usr/bin/env node

/**
 * Test script for a specific Twilio number
 * 
 * This script tests if the Twilio number +18186518560 is properly configured
 * for missed call auto-texting.
 * 
 * Usage: node scripts/test-specific-number.js
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// The specific phone number to test
const PHONE_NUMBER = '+18186518560';

// We need to use dynamic import since the Twilio module uses ES modules
async function importModules() {
  // Create a temporary file that re-exports the functions we need
  const tempFile = path.resolve(__dirname, '../temp-twilio-test.js');
  
  fs.writeFileSync(tempFile, `
    import { getTwilioNumberStatus } from './lib/twilio/phone-manager.js';
    
    export async function checkStatus(phoneNumber) {
      return await getTwilioNumberStatus(phoneNumber);
    }
  `);
  
  // Use dynamic import to load the ES module
  const { checkStatus } = await import('../temp-twilio-test.js');
  
  // Clean up the temporary file
  fs.unlinkSync(tempFile);
  
  return { checkStatus };
}

// Simulate a missed call using the API endpoint
async function simulateMissedCall(fromNumber, toNumber) {
  console.log(`\n🔄 Simulating a missed call from ${fromNumber} to ${toNumber}...`);
  
  // Create form data for the request
  const formData = new FormData();
  formData.append('From', fromNumber);
  formData.append('To', toNumber);
  formData.append('CallStatus', 'no-answer');
  
  // Note: The response will be sent from TWILIO_SMARTTEXT_NUMBER if configured
  console.log(`Note: Response will be sent from ${process.env.TWILIO_SMARTTEXT_NUMBER || toNumber}`);
  
  try {
    // Make a POST request to the missed call endpoint
    const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/missed-call`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Missed call simulation successful!');
      console.log(`📱 Auto-text message sent: "${data.message.substring(0, 100)}${data.message.length > 100 ? '...' : ''}"`);
      return true;
    } else {
      console.error('❌ Missed call simulation failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error simulating missed call:', error);
    return false;
  }
}

async function main() {
  try {
    console.log(`\n🔍 Testing Twilio number: ${PHONE_NUMBER}`);
    
    // Check if required environment variables are set
    if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error('❌ Error: TWILIO_SID and TWILIO_AUTH_TOKEN environment variables must be set');
      console.error('Please add these to your .env.local file');
      process.exit(1);
    }
    
    // Import the modules
    const { checkStatus } = await importModules();
    
    // Step 1: Check the status of the Twilio number
    console.log(`\n🔍 Checking status for Twilio number: ${PHONE_NUMBER}`);
    const status = await checkStatus(PHONE_NUMBER);
    
    if (!status.exists) {
      console.error(`❌ Error: Phone number ${PHONE_NUMBER} not found in your Twilio account`);
      console.log('This number may be owned by another Twilio account.');
      process.exit(1);
    }
    
    console.log(`✅ Phone number ${PHONE_NUMBER} exists in your Twilio account`);
    
    // Step 2: Check if the number is configured
    if (status.isConfigured) {
      console.log('✅ Phone number is properly configured for missed call auto-texting');
      console.log(`Voice URL: ${status.voiceUrl}`);
      console.log(`Status Callback: ${status.statusCallback}`);
      
      // Step 3: Simulate a missed call
      console.log('\n📞 Testing missed call auto-texting...');
      
      // Generate a random phone number for testing
      const testFromNumber = `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
      
      const success = await simulateMissedCall(testFromNumber, PHONE_NUMBER);
      
      if (success) {
        console.log('\n🎉 Test successful! The number is properly configured for missed call auto-texting.');
        console.log('You can call this number and hang up to receive an auto-text message.');
      } else {
        console.error('\n❌ Test failed. The number may not be properly configured for auto-texting.');
        console.log('Please check your Twilio configuration and try again.');
      }
    } else {
      console.error('❌ Phone number is not properly configured for missed call auto-texting');
      console.log('Please configure the number in the Settings page or using the test-twilio-integration.js script.');
    }
    
  } catch (error) {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  }
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
