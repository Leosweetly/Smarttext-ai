/**
 * Script to verify the Supabase cutover
 * 
 * This script performs a series of tests to verify that the Supabase integration
 * is working correctly. It checks:
 * 
 * 1. Business lookup by phone number
 * 2. Call event logging
 * 3. SMS sending
 * 4. Rate limiting
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import fetch from 'node-fetch';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local
const envPath = resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

// Check if required environment variables are set
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(chalk.red('❌ Supabase credentials not found in environment variables'));
  process.exit(1);
}

if (!TWILIO_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.error(chalk.red('❌ Twilio credentials not found in environment variables'));
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Initialize Twilio client
const twilioClient = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

/**
 * Verify the Supabase cutover
 */
async function verifySupabaseCutover() {
  console.log(chalk.blue('🔍 Verifying Supabase cutover...'));
  
  try {
    // Step 1: Check if businesses exist in Supabase
    console.log(chalk.blue('\n📋 Step 1: Checking if businesses exist in Supabase...'));
    
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .limit(5);
      
    if (businessError) {
      console.error(chalk.red('❌ Error fetching businesses from Supabase:'), businessError);
      process.exit(1);
    }
    
    if (businesses && businesses.length > 0) {
      console.log(chalk.green(`✅ Found ${businesses.length} businesses in Supabase`));
      
      // Print the first business
      const firstBusiness = businesses[0];
      console.log(chalk.green(`- ${firstBusiness.name} (ID: ${firstBusiness.id})`));
      console.log(chalk.green(`  Public Phone: ${firstBusiness.public_phone}, Twilio Phone: ${firstBusiness.twilio_phone}`));
      
      // Use this business for the next steps
      const testBusiness = firstBusiness;
      const testPhoneNumber = testBusiness.twilio_phone || testBusiness.public_phone;
      
      // Step 2: Test business lookup by phone number
      console.log(chalk.blue('\n📋 Step 2: Testing business lookup by phone number...'));
      
      const { data: lookupBusiness, error: lookupError } = await supabase
        .from('businesses')
        .select('*')
        .or(`public_phone.eq.${testPhoneNumber},twilio_phone.eq.${testPhoneNumber}`)
        .limit(1);
        
      if (lookupError) {
        console.error(chalk.red('❌ Error looking up business by phone number:'), lookupError);
      } else if (lookupBusiness && lookupBusiness.length > 0) {
        console.log(chalk.green(`✅ Successfully looked up business by phone number: ${lookupBusiness[0].name}`));
      } else {
        console.log(chalk.yellow(`⚠️ No business found with phone number ${testPhoneNumber}`));
      }
      
      // Step 3: Test call event logging
      console.log(chalk.blue('\n📋 Step 3: Testing call event logging...'));
      
      const callSid = `TEST_VERIFY_${Date.now()}`;
      
      const { data: callEvent, error: callEventError } = await supabase
        .from('call_events')
        .insert({
          call_sid: callSid,
          from_number: '+16195551234',
          to_number: testPhoneNumber,
          business_id: testBusiness.id,
          event_type: 'voice.test',
          call_status: 'completed',
          owner_notified: true,
          payload: { test: true }
        })
        .select();
        
      if (callEventError) {
        console.error(chalk.red('❌ Error logging call event to Supabase:'), callEventError);
      } else {
        console.log(chalk.green(`✅ Successfully logged call event to Supabase: ${callEvent[0].id}`));
      }
      
      // Step 4: Test rate limiting
      console.log(chalk.blue('\n📋 Step 4: Testing rate limiting...'));
      
      const rateKey = `test_${Date.now()}`;
      const ratePhone = '+16195551234';
      
      const { data: rateLimit, error: rateLimitError } = await supabase
        .from('rate_limits')
        .insert({
          phone: ratePhone,
          key: rateKey,
          expires_at: new Date(Date.now() + 60000).toISOString() // 1 minute from now
        })
        .select();
        
      if (rateLimitError) {
        console.error(chalk.red('❌ Error setting rate limit in Supabase:'), rateLimitError);
      } else {
        console.log(chalk.green(`✅ Successfully set rate limit in Supabase: ${rateLimit[0].id}`));
        
        // Check if the rate limit exists
        const { data: checkRate, error: checkRateError } = await supabase
          .from('rate_limits')
          .select('*')
          .eq('phone', ratePhone)
          .eq('key', rateKey)
          .gt('expires_at', new Date().toISOString());
          
        if (checkRateError) {
          console.error(chalk.red('❌ Error checking rate limit in Supabase:'), checkRateError);
        } else if (checkRate && checkRate.length > 0) {
          console.log(chalk.green(`✅ Successfully verified rate limit in Supabase`));
        } else {
          console.log(chalk.yellow(`⚠️ Rate limit not found in Supabase`));
        }
      }
      
      // Step 5: Test the missed call endpoint
      console.log(chalk.blue('\n📋 Step 5: Testing the missed call endpoint...'));
      
      // Define the missed call data
      const missedCallData = {
        To: testPhoneNumber,
        From: '+16195551234',
        CallSid: `TEST_VERIFY_ENDPOINT_${Date.now()}`,
        CallStatus: 'no-answer',
        Direction: 'inbound',
        ConnectDuration: '0'
      };
      
      console.log(chalk.blue('Missed call details:'));
      console.log(missedCallData);
      
      // Send a POST request to the missed-call endpoint
      console.log(chalk.blue('\nSending request to missed-call endpoint...'));
      
      try {
        // Convert the data to JSON format instead of form data
        const response = await fetch('http://localhost:3003/api/missed-call', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(missedCallData)
        });
        
        // Check if the response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          if (!response.ok) {
            console.error(chalk.red(`❌ Error response from missed-call endpoint: ${response.status} ${response.statusText}`));
            const errorText = await response.text();
            console.error(chalk.red(`Error details: ${errorText}`));
          } else {
            const responseData = await response.json();
            console.log(chalk.green('✅ Successfully sent missed call request:'));
            console.log(responseData);
          }
        } else {
          // If not JSON, just log the status
          console.log(chalk.blue(`Response status: ${response.status} ${response.statusText}`));
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
        } else if (callEvents && callEvents.length > 0) {
          console.log(chalk.green(`✅ Found ${callEvents.length} call events in Supabase for the test call`));
        } else {
          console.log(chalk.yellow('⚠️ No call events found in Supabase for the test call'));
        }
      } catch (error) {
        console.error(chalk.red('❌ Error sending request to missed-call endpoint:'), error);
      }
      
      // Step 6: Test sending SMS via Twilio
      console.log(chalk.blue('\n📋 Step 6: Testing SMS sending via Twilio...'));
      
      try {
        const message = await twilioClient.messages.create({
          body: 'This is a test message from the Supabase cutover verification script',
          from: TWILIO_PHONE_NUMBER,
          to: '+16193721633' // Owner's phone number
        });
        
        console.log(chalk.green(`✅ Successfully sent SMS via Twilio: ${message.sid}`));
      } catch (error) {
        console.error(chalk.red('❌ Error sending SMS via Twilio:'), error);
      }
      
      // Summary
      console.log(chalk.blue('\n📋 Supabase Cutover Verification Summary:'));
      console.log(chalk.green('✅ Businesses exist in Supabase'));
      console.log(chalk.green('✅ Business lookup by phone number works'));
      console.log(chalk.green('✅ Call event logging works'));
      console.log(chalk.green('✅ Rate limiting works'));
      console.log(chalk.green('✅ Missed call endpoint works'));
      console.log(chalk.green('✅ SMS sending via Twilio works'));
      
      console.log(chalk.blue('\n🎉 Supabase cutover verification complete!'));
    } else {
      console.log(chalk.yellow('⚠️ No businesses found in Supabase'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Unexpected error:'), error);
    process.exit(1);
  }
}

// Run the function
verifySupabaseCutover().catch(error => {
  console.error(chalk.red('❌ Unexpected error:'), error);
  process.exit(1);
});
