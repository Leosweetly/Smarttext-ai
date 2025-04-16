#!/usr/bin/env node

/**
 * This script directly tests the missed call functionality by sending a request
 * to the missed-call endpoint with the specified parameters.
 * 
 * Usage: node scripts/test-missed-call-direct.js
 */

import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Default phone numbers
const CALLER_NUMBER = '+12125551234'; // Your phone number
const TWILIO_NUMBER = '+18186518560'; // SmartText AI Twilio number

async function testMissedCall() {
  try {
    console.log(`\n🔍 Testing missed call from ${CALLER_NUMBER} to ${TWILIO_NUMBER}...`);
    
    // Create URL-encoded form data for the request (Twilio sends URL-encoded data)
    const formData = new URLSearchParams();
    formData.append('From', CALLER_NUMBER);
    formData.append('To', TWILIO_NUMBER);
    formData.append('CallStatus', 'no-answer'); // Simulate a no-answer call status
    formData.append('CallSid', 'CA' + Math.random().toString(36).substring(2, 15)); // Generate a random CallSid
    
    // Get the API base URL from environment or use default
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001'; // Updated to use port 3001
    const missedCallUrl = `${apiBaseUrl}/api/missed-call`;
    
    console.log(`Sending request to: ${missedCallUrl}`);
    console.log('Request data:');
    console.log(`  From: ${CALLER_NUMBER}`);
    console.log(`  To: ${TWILIO_NUMBER}`);
    console.log(`  CallStatus: no-answer`);
    
    // Make the request to the missed-call endpoint
    const response = await axios.post(missedCallUrl, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    // Check the response
    if (response.status === 200 && response.data.success) {
      console.log('\n✅ Missed call test successful!');
      console.log(`Message that will be sent to ${CALLER_NUMBER}:`);
      console.log(`"${response.data.message}"`);
      console.log('\nCheck your phone for the text message. It should arrive shortly.');
      console.log('\n✅ The call should also be logged to Supabase "call_events" table for analytics.');
      console.log('Check your Supabase database to verify the new record was created.');
    } else {
      console.error('\n❌ Missed call test failed:');
      console.error(response.data);
    }
    
  } catch (error) {
    console.error('\n❌ Error testing missed call:');
    
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

// Execute the function
testMissedCall()
  .then(() => {
    console.log('\nTest completed!');
  })
  .catch(error => {
    console.error('\n❌ Unhandled error:', error);
  });
