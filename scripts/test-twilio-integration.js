#!/usr/bin/env node

/**
 * Test script for Twilio integration
 * 
 * This script tests the end-to-end Twilio integration, including:
 * 1. Checking the status of a Twilio number
 * 2. Configuring the number if needed
 * 3. Simulating a missed call to test auto-texting
 * 
 * Usage: node scripts/test-twilio-integration.js +18186518560
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// We need to use dynamic import since the Twilio module uses ES modules
async function importModules() {
  // Create a temporary file that re-exports the functions we need
  const tempFile = path.resolve(__dirname, '../temp-twilio-integration.js');
  
  fs.writeFileSync(tempFile, `
    import { getTwilioNumberStatus, configureTwilioNumber } from './lib/twilio/phone-manager.js';
    
    export async function checkStatus(phoneNumber) {
      return await getTwilioNumberStatus(phoneNumber);
    }
    
    export async function configure(phoneNumber) {
      return await configureTwilioNumber(phoneNumber);
    }
  `);
  
  // Use dynamic import to load the ES module
  const { checkStatus, configure } = await import('../temp-twilio-integration.js');
  
  // Clean up the temporary file
  fs.unlinkSync(tempFile);
  
  return { checkStatus, configure };
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
    // Check if required environment variables are set
    if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error('❌ Error: TWILIO_SID and TWILIO_AUTH_TOKEN environment variables must be set');
      console.error('Please add these to your .env.local file');
      process.exit(1);
    }
    
    // Parse command line arguments
    const phoneNumber = process.argv[2];
    
    if (!phoneNumber) {
      console.error('❌ Error: Phone number is required');
      console.log('Usage: node scripts/test-twilio-integration.js +18186518560');
      process.exit(1);
    }
    
    // Import the modules
    const { checkStatus, configure } = await importModules();
    
    // Step 1: Check the status of the Twilio number
    console.log(`\n🔍 Checking status for Twilio number: ${phoneNumber}`);
    const status = await checkStatus(phoneNumber);
    
    if (!status.exists) {
      console.error(`❌ Error: Phone number ${phoneNumber} not found in your Twilio account`);
      console.log('Please make sure you have purchased this number in your Twilio account');
      process.exit(1);
    }
    
    console.log(`✅ Phone number ${phoneNumber} exists in your Twilio account`);
    
    // Step 2: Configure the number if needed
    if (!status.isConfigured) {
      console.log(`\n⚙️ Phone number is not properly configured. Configuring now...`);
      
      try {
        const result = await configure(phoneNumber);
        console.log('✅ Configuration successful!');
        console.log(`Voice URL: ${result.voiceUrl}`);
        console.log(`Status Callback: ${result.statusCallback}`);
      } catch (error) {
        console.error('❌ Error configuring Twilio number:', error);
        process.exit(1);
      }
    } else {
      console.log('✅ Phone number is already properly configured');
      console.log(`Voice URL: ${status.voiceUrl}`);
      console.log(`Status Callback: ${status.statusCallback}`);
    }
    
    // Step 3: Simulate a missed call
    console.log('\n📞 Testing missed call auto-texting...');
    
    // Generate a random phone number for testing
    const testFromNumber = `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
    
    const success = await simulateMissedCall(testFromNumber, phoneNumber);
    
    if (success) {
      console.log('\n🎉 End-to-end Twilio integration test successful!');
      console.log('Your Twilio number is properly configured for missed call auto-texting.');
    } else {
      console.error('\n❌ End-to-end Twilio integration test failed');
      console.log('Please check your configuration and try again.');
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
