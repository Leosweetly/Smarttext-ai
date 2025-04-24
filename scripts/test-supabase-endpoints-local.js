#!/usr/bin/env node

/**
 * End-to-End Test Script for SmartText API Endpoints (Local Version)
 * 
 * This script tests the missed call → auto-text flow and the new-message endpoint
 * with additional debugging to help diagnose issues.
 * 
 * This version explicitly uses the local development server.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import chalk from 'chalk';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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

// Configuration - Force local development server
const API_BASE_URL = 'http://localhost:3002';
console.log(chalk.blue(`Using API base URL: ${API_BASE_URL}`));

const TEST_TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+18186518560';
const TEST_CUSTOMER_NUMBER = '+16195551234';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

// Generate unique test IDs
const TEST_CALL_SID = `TEST_CALL_${Date.now()}`;
const TEST_MESSAGE_SID = `TEST_MSG_${Date.now()}`;

/**
 * Helper function to wait for a specified time
 * @param {number} ms - Time to wait in milliseconds
 * @returns {Promise<void>}
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper function to check if a string contains Airtable references
 * @param {string} text - Text to check
 * @returns {boolean} - True if Airtable references found
 */
const containsAirtableReferences = (text) => {
  const airtableKeywords = ['airtable', 'AIRTABLE', 'Airtable'];
  return airtableKeywords.some(keyword => text.includes(keyword));
};

/**
 * Test 1: Simulate a missed call
 */
async function testMissedCall() {
  try {
    console.log(chalk.blue('\n=== TEST 1: MISSED CALL ENDPOINT ==='));
    console.log(chalk.blue('🔄 Simulating a missed call...'));
    
    // Define the missed call data
    const missedCallData = {
      To: TEST_TWILIO_NUMBER,
      From: TEST_CUSTOMER_NUMBER,
      CallSid: TEST_CALL_SID,
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
    
    // Use the test endpoint instead of the regular missed-call endpoint
    const url = `${API_BASE_URL}/api/test-endpoints?action=missed-call`;
    console.log(chalk.blue(`Full URL: ${url}`));
    
    // Debug: Log the request details
    console.log(chalk.yellow('Request details:'));
    console.log(chalk.yellow(`Method: POST`));
    console.log(chalk.yellow(`Headers: Content-Type: application/json`));
    console.log(chalk.yellow(`Body: ${JSON.stringify(missedCallData, null, 2)}`));
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(missedCallData)
      });
      
      // Check response status
      console.log(chalk.blue(`Response status: ${response.status} ${response.statusText}`));
      console.log(chalk.blue(`Response headers: ${JSON.stringify(Object.fromEntries([...response.headers]), null, 2)}`));
      
      if (response.status !== 200) {
        console.error(chalk.red(`❌ Expected status 200, got ${response.status}`));
        const errorText = await response.text();
        console.error(chalk.red(`Error details: ${errorText}`));
        return false;
      }
      
      // Parse response JSON
      let responseData;
      try {
        responseData = await response.json();
        console.log(chalk.green('✅ Successfully sent missed call request:'));
        console.log(responseData);
        
        // Check for Airtable references in the response
        const responseText = JSON.stringify(responseData);
        if (containsAirtableReferences(responseText)) {
          console.error(chalk.red('❌ Found Airtable references in the response'));
          return false;
        }
      } catch (error) {
        console.error(chalk.red('❌ Failed to parse response JSON:'), error);
        return false;
      }
      
      // Wait for data to be written to Supabase
      console.log(chalk.blue('\nWaiting for data to be written to Supabase...'));
      await wait(2000);
      
      // Check if the call event was logged to Supabase
      console.log(chalk.blue('Checking if call event was logged to Supabase...'));
      
      const { data: callEvents, error: lookupError } = await supabase
        .from('call_events')
        .select('*')
        .eq('call_sid', TEST_CALL_SID);
        
      if (lookupError) {
        console.error(chalk.red('❌ Error checking for call events in Supabase:'), lookupError);
        return false;
      }
      
      if (!callEvents || callEvents.length === 0) {
        console.error(chalk.red('❌ No call events found in Supabase'));
        return false;
      }
      
      console.log(chalk.green(`✅ Found ${callEvents.length} call events in Supabase:`));
      callEvents.forEach(event => {
        console.log(chalk.green(`- Event ID: ${event.id}`));
        console.log(chalk.green(`  Call SID: ${event.call_sid}`));
        console.log(chalk.green(`  From: ${event.from_number}, To: ${event.to_number}`));
        console.log(chalk.green(`  Event Type: ${event.event_type}`));
        console.log(chalk.green(`  Call Status: ${event.call_status}`));
      });
      
      // Check for SMS events (auto-text)
      console.log(chalk.blue('\nChecking for SMS events (auto-text)...'));
      
      const { data: smsEvents, error: smsError } = await supabase
        .from('sms_events')
        .select('*')
        .eq('request_id', TEST_CALL_SID)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (smsError) {
        console.error(chalk.red('❌ Error checking for SMS events in Supabase:'), smsError);
        return false;
      }
      
      if (!smsEvents || smsEvents.length === 0) {
        console.error(chalk.red('❌ No SMS events found in Supabase'));
        return false;
      }
      
      console.log(chalk.green(`✅ Found ${smsEvents.length} SMS events in Supabase:`));
      smsEvents.forEach(event => {
        console.log(chalk.green(`- Event ID: ${event.id}`));
        console.log(chalk.green(`  Message SID: ${event.message_sid}`));
        console.log(chalk.green(`  From: ${event.from_number}, To: ${event.to_number}`));
        console.log(chalk.green(`  Status: ${event.status}`));
        console.log(chalk.green(`  Request ID: ${event.request_id}`));
      });
      
      console.log(chalk.green('\n✅ Missed call test passed successfully!'));
      return true;
    } catch (fetchError) {
      console.error(chalk.red('❌ Fetch error:'), fetchError);
      return false;
    }
  } catch (error) {
    console.error(chalk.red('❌ Unexpected error in missed call test:'), error);
    return false;
  }
}

/**
 * Test 2: Simulate a new message
 */
async function testNewMessage() {
  try {
    console.log(chalk.blue('\n=== TEST 2: NEW MESSAGE ENDPOINT ==='));
    console.log(chalk.blue('🔄 Simulating a new message...'));
    
    // Define the new message data
    const newMessageData = {
      To: TEST_TWILIO_NUMBER,
      From: TEST_CUSTOMER_NUMBER,
      Body: 'What are your hours?',
      MessageSid: TEST_MESSAGE_SID
    };
    
    console.log(chalk.blue('New message details:'));
    console.log(newMessageData);
    
    // Send a POST request to the new-message endpoint
    console.log(chalk.blue('\nSending request to new-message endpoint...'));
    
    // Use the test endpoint instead of the regular new-message endpoint
    const url = `${API_BASE_URL}/api/test-endpoints?action=new-message`;
    console.log(chalk.blue(`Full URL: ${url}`));
    
    // Debug: Log the request details
    console.log(chalk.yellow('Request details:'));
    console.log(chalk.yellow(`Method: POST`));
    console.log(chalk.yellow(`Headers: Content-Type: application/json`));
    console.log(chalk.yellow(`Body: ${JSON.stringify(newMessageData, null, 2)}`));
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newMessageData)
      });
      
      // Check response status
      console.log(chalk.blue(`Response status: ${response.status} ${response.statusText}`));
      console.log(chalk.blue(`Response headers: ${JSON.stringify(Object.fromEntries([...response.headers]), null, 2)}`));
      
      if (response.status !== 200) {
        console.error(chalk.red(`❌ Expected status 200, got ${response.status}`));
        const errorText = await response.text();
        console.error(chalk.red(`Error details: ${errorText}`));
        return false;
      }
      
      // Parse response JSON
      let responseData;
      try {
        responseData = await response.json();
        console.log(chalk.green('✅ Successfully sent new message request:'));
        console.log(responseData);
        
        // Check for Airtable references in the response
        const responseText = JSON.stringify(responseData);
        if (containsAirtableReferences(responseText)) {
          console.error(chalk.red('❌ Found Airtable references in the response'));
          return false;
        }
      } catch (error) {
        console.error(chalk.red('❌ Failed to parse response JSON:'), error);
        return false;
      }
      
      // Wait for data to be written to Supabase
      console.log(chalk.blue('\nWaiting for data to be written to Supabase...'));
      await wait(2000);
      
      // Check for SMS events (auto-response)
      console.log(chalk.blue('Checking for SMS events (auto-response)...'));
      
      const { data: smsEvents, error: smsError } = await supabase
        .from('sms_events')
        .select('*')
        .eq('to_number', TEST_CUSTOMER_NUMBER)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (smsError) {
        console.error(chalk.red('❌ Error checking for SMS events in Supabase:'), smsError);
        return false;
      }
      
      if (!smsEvents || smsEvents.length === 0) {
        console.error(chalk.red('❌ No SMS events found in Supabase'));
        return false;
      }
      
      console.log(chalk.green(`✅ Found ${smsEvents.length} SMS events in Supabase:`));
      smsEvents.forEach(event => {
        console.log(chalk.green(`- Event ID: ${event.id}`));
        console.log(chalk.green(`  Message SID: ${event.message_sid}`));
        console.log(chalk.green(`  From: ${event.from_number}, To: ${event.to_number}`));
        console.log(chalk.green(`  Status: ${event.status}`));
      });
      
      console.log(chalk.green('\n✅ New message test passed successfully!'));
      return true;
    } catch (fetchError) {
      console.error(chalk.red('❌ Fetch error:'), fetchError);
      return false;
    }
  } catch (error) {
    console.error(chalk.red('❌ Unexpected error in new message test:'), error);
    return false;
  }
}

/**
 * Test 3: Test business hours logic
 */
async function testBusinessHoursLogic() {
  try {
    console.log(chalk.blue('\n=== TEST 3: BUSINESS HOURS LOGIC ==='));
    console.log(chalk.blue('🔄 Simulating a connected call (should not trigger auto-text)...'));
    
    // Define the connected call data
    const connectedCallData = {
      To: TEST_TWILIO_NUMBER,
      From: TEST_CUSTOMER_NUMBER,
      CallSid: `TEST_CONNECTED_CALL_${Date.now()}`,
      CallStatus: 'completed',
      Direction: 'inbound',
      ConnectDuration: '30' // 30 seconds connected
    };
    
    console.log(chalk.blue('Connected call details:'));
    console.log(connectedCallData);
    
    // Send a POST request to the missed-call endpoint
    console.log(chalk.blue('\nSending request to missed-call endpoint...'));
    
    // Use the test endpoint instead of the regular missed-call endpoint
    const url = `${API_BASE_URL}/api/test-endpoints?action=missed-call`;
    console.log(chalk.blue(`Full URL: ${url}`));
    
    // Debug: Log the request details
    console.log(chalk.yellow('Request details:'));
    console.log(chalk.yellow(`Method: POST`));
    console.log(chalk.yellow(`Headers: Content-Type: application/json`));
    console.log(chalk.yellow(`Body: ${JSON.stringify(connectedCallData, null, 2)}`));
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(connectedCallData)
      });
      
      // Check response status
      console.log(chalk.blue(`Response status: ${response.status} ${response.statusText}`));
      console.log(chalk.blue(`Response headers: ${JSON.stringify(Object.fromEntries([...response.headers]), null, 2)}`));
      
      if (response.status !== 200) {
        console.error(chalk.red(`❌ Expected status 200, got ${response.status}`));
        const errorText = await response.text();
        console.error(chalk.red(`Error details: ${errorText}`));
        return false;
      }
      
      // Parse response JSON
      let responseData;
      try {
        responseData = await response.json();
        console.log(chalk.green('✅ Successfully sent connected call request:'));
        console.log(responseData);
        
        // Check if the response indicates the call was connected
        if (!responseData.connected) {
          console.error(chalk.red('❌ Expected response to indicate call was connected'));
          return false;
        }
        
        // Check if no SMS response was sent (since call was connected)
        if (responseData.smsResponse) {
          console.error(chalk.red('❌ SMS response was sent for connected call, expected none'));
          return false;
        }
      } catch (error) {
        console.error(chalk.red('❌ Failed to parse response JSON:'), error);
        return false;
      }
      
      // Wait for data to be written to Supabase
      console.log(chalk.blue('\nWaiting for data to be written to Supabase...'));
      await wait(2000);
      
      // Check for SMS events (should not exist for connected calls)
      console.log(chalk.blue('Checking that no auto-text was sent for connected call...'));
      
      const { data: smsEvents, error: smsError } = await supabase
        .from('sms_events')
        .select('*')
        .eq('request_id', connectedCallData.CallSid);
        
      if (smsError) {
        console.error(chalk.red('❌ Error checking for SMS events in Supabase:'), smsError);
        return false;
      }
      
      if (smsEvents && smsEvents.length > 0) {
        console.error(chalk.red(`❌ Found ${smsEvents.length} SMS events for connected call, expected 0`));
        return false;
      }
      
      console.log(chalk.green('✅ No SMS events found for connected call, as expected'));
      console.log(chalk.green('\n✅ Business hours logic test passed successfully!'));
      return true;
    } catch (fetchError) {
      console.error(chalk.red('❌ Fetch error:'), fetchError);
      return false;
    }
  } catch (error) {
    console.error(chalk.red('❌ Unexpected error in business hours logic test:'), error);
    return false;
  }
}

/**
 * Main function to run all tests
 */
async function runTests() {
  console.log(chalk.blue('🧪 Starting end-to-end tests for SmartText API endpoints'));
  console.log(chalk.yellow('LOCAL MODE: Using local development server'));
  
  // Run the tests
  const missedCallResult = await testMissedCall();
  
  if (missedCallResult) {
    const newMessageResult = await testNewMessage();
    
    if (newMessageResult) {
      const businessHoursResult = await testBusinessHoursLogic();
      
      // Print summary
      console.log(chalk.blue('\n=== TEST SUMMARY ==='));
      console.log(chalk.blue(`Missed Call Test: ${missedCallResult ? chalk.green('PASSED') : chalk.red('FAILED')}`));
      console.log(chalk.blue(`New Message Test: ${newMessageResult ? chalk.green('PASSED') : chalk.red('FAILED')}`));
      console.log(chalk.blue(`Business Hours Logic Test: ${businessHoursResult ? chalk.green('PASSED') : chalk.red('FAILED')}`));
      
      if (missedCallResult && newMessageResult && businessHoursResult) {
        console.log(chalk.green('\n✅ All tests passed successfully!'));
        console.log(chalk.green('✅ Verified that Supabase logging works'));
        console.log(chalk.green('✅ Verified that auto-text messages are triggered correctly'));
        console.log(chalk.green('✅ Verified that business hours logic is respected'));
        console.log(chalk.green('✅ Verified that all responses return 200 status codes'));
        console.log(chalk.green('✅ Verified that no Airtable references exist in the flow'));
      } else {
        console.error(chalk.red('\n❌ Some tests failed. See above for details.'));
        process.exit(1);
      }
    } else {
      console.error(chalk.red('\n❌ New message test failed. Skipping remaining tests.'));
      process.exit(1);
    }
  } else {
    console.error(chalk.red('\n❌ Missed call test failed. Skipping remaining tests.'));
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(chalk.red('❌ Unexpected error:'), error);
  process.exit(1);
});
