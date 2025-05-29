#!/usr/bin/env node

/**
 * This script directly tests the missed call functionality by simulating
 * a missed call from a specific phone number to a Twilio number.
 * It bypasses the actual phone call process and directly triggers the auto-text.
 * 
 * Usage: node scripts/test-direct-missed-call.js +12125551234 +18186518560
 * 
 * Where:
 * - First argument is the caller's phone number (From)
 * - Second argument is the Twilio number (To)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Default phone numbers if not provided as arguments
const DEFAULT_FROM = '+12125551234'; // Default caller number
const DEFAULT_TO = '+18186518560';   // Default Twilio number

async function simulateMissedCall(fromNumber, toNumber) {
  try {
    console.log(`\n🔍 Simulating missed call from ${fromNumber} to ${toNumber}...`);
    
    // Create form data for the request
    const formData = new URLSearchParams();
    formData.append('From', fromNumber);
    formData.append('To', toNumber);
    formData.append('CallStatus', 'no-answer'); // Simulate a no-answer call status
    
    // Use the Vercel deployment URL directly
    const apiBaseUrl = 'https://smarttext-webhook-opefypaz3-kyle-davis-projects-30fc1531.vercel.app';
    const missedCallUrl = `${apiBaseUrl}/api/missed-call`;
    
    console.log(`Sending request to: ${missedCallUrl}`);
    
    // Make the request to the missed-call endpoint
    const response = await axios.post(missedCallUrl, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    // Check the response
    if (response.status === 200 && response.data.success) {
      console.log('\n✅ Missed call simulation successful!');
      console.log(`Message that will be sent to ${fromNumber}:`);
      console.log(`"${response.data.message}"`);
      console.log('\nCheck your phone for the text message. It should arrive shortly.');
    } else {
      console.error('\n❌ Missed call simulation failed:');
      console.error(response.data);
    }
    
  } catch (error) {
    console.error('\n❌ Error simulating missed call:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server. Is the server running?');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
  }
}

// Main function
async function main() {
  // Get phone numbers from command line arguments or use defaults
  const fromNumber = process.argv[2] || DEFAULT_FROM;
  const toNumber = process.argv[3] || DEFAULT_TO;
  
  // Validate phone numbers
  const phoneRegex = /^\+\d{10,15}$/;
  if (!phoneRegex.test(fromNumber) || !phoneRegex.test(toNumber)) {
    console.error('❌ Error: Phone numbers must be in E.164 format (e.g., +18186518560)');
    console.error(`From: ${fromNumber}`);
    console.error(`To: ${toNumber}`);
    process.exit(1);
  }
  
  // Simulate the missed call
  await simulateMissedCall(fromNumber, toNumber);
}

// Run the main function
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
