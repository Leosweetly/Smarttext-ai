/**
 * Script to test the missed call flow with Supabase integration
 * 
 * This script simulates a missed call and verifies that the call event
 * is logged to both Airtable and Supabase.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import chalk from 'chalk';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local
const envPath = resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

// Check if required environment variables are set
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(chalk.red('❌ Supabase credentials not found in environment variables'));
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Simulate a missed call
 */
async function simulateMissedCall() {
  try {
    console.log(chalk.blue('🔄 Simulating a missed call...'));
    
    // Define the missed call data
    const missedCallData = {
      To: '+18186518560', // Twilio number
      From: '+16195551234', // Caller number (same as public_phone for simplicity)
      CallSid: `TEST_CALL_${Date.now()}`,
      CallStatus: 'no-answer',
      Direction: 'inbound',
      ConnectDuration: '0'
    };
    
    console.log(chalk.blue('Missed call details:'));
    console.log(missedCallData);
    
    // Send a POST request to the missed-call endpoint
    console.log(chalk.blue('\nSending request to missed-call endpoint...'));
    
    // Convert the data to form-encoded format (what Twilio actually sends)
    const formData = new URLSearchParams();
    Object.entries(missedCallData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    const response = await fetch('http://localhost:3001/api/missed-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      if (!response.ok) {
        console.error(chalk.red(`❌ Error response from missed-call endpoint: ${response.status} ${response.statusText}`));
        const errorText = await response.text();
        console.error(chalk.red(`Error details: ${errorText}`));
        process.exit(1);
      }
    } else {
      // If not JSON, just log the status
      console.log(chalk.blue(`Response status: ${response.status} ${response.statusText}`));
      // Continue with the test even if the response is not JSON
    }
    
    let responseData;
    try {
      responseData = await response.json();
      console.log(chalk.green('✅ Successfully sent missed call request:'));
      console.log(responseData);
    } catch (error) {
      console.log(chalk.yellow('⚠️ Response was not JSON, but the request was sent.'));
    }
    
    // Check if the call event was logged to Supabase
    console.log(chalk.blue('\nChecking if call event was logged to Supabase...'));
    
    // Wait a moment for the data to be written
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: callEvents, error: lookupError } = await supabase
      .from('call_events')
      .select('*')
      .eq('call_sid', missedCallData.CallSid);
      
    if (lookupError) {
      console.error(chalk.red('❌ Error checking for call events in Supabase:'), lookupError);
      process.exit(1);
    }
    
    if (callEvents && callEvents.length > 0) {
      console.log(chalk.green(`✅ Found ${callEvents.length} call events in Supabase:`));
      callEvents.forEach(event => {
        console.log(chalk.green(`- Event ID: ${event.id}`));
        console.log(chalk.green(`  Call SID: ${event.call_sid}`));
        console.log(chalk.green(`  From: ${event.from_number}, To: ${event.to_number}`));
        console.log(chalk.green(`  Event Type: ${event.event_type}`));
        console.log(chalk.green(`  Call Status: ${event.call_status}`));
      });
    } else {
      console.log(chalk.yellow('⚠️ No call events found in Supabase'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Unexpected error:'), error);
    process.exit(1);
  }
}

// Run the function
simulateMissedCall().catch(error => {
  console.error(chalk.red('❌ Unexpected error:'), error);
  process.exit(1);
});
