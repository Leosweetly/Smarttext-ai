/**
 * Test script for online ordering URL functionality
 * 
 * This script tests the online ordering URL feature by:
 * 1. Creating a test business with an online ordering URL
 * 2. Simulating a missed call
 * 3. Verifying the online ordering URL is included in the auto-reply
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local
const envPath = resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

// Check if required environment variables are set
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(chalk.red('❌ Supabase credentials not found in environment variables'));
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Create a test business with online ordering URL
 */
async function createTestBusinessWithOrderingUrl() {
  try {
    console.log(chalk.blue('🔄 Creating test business with online ordering URL...'));
    
    // Define the test business
    const testBusiness = {
      name: 'Test Restaurant with Online Ordering',
      business_type: 'restaurant',
      public_phone: '+16195551234', // Test phone number
      twilio_phone: '+18186518560', // Test Twilio number
      forwarding_number: '+16195551234', // Same as public_phone
      subscription_tier: 'basic',
      online_ordering_url: 'https://order.testrestaurant.com',
      custom_settings: {
        ownerPhone: '+16193721633', // Test owner's phone number
        twilioNumber: '+18186518560'
      }
    };
    
    console.log(chalk.blue('Test business details:'));
    console.log(testBusiness);
    
    // Check if a business with these phone numbers already exists
    console.log(chalk.blue('\nChecking if business already exists...'));
    
    const { data: existingBusinesses, error: lookupError } = await supabase
      .from('businesses')
      .select('*')
      .or(`public_phone.eq.${testBusiness.public_phone},twilio_phone.eq.${testBusiness.twilio_phone}`);
      
    if (lookupError) {
      console.error(chalk.red('❌ Error checking for existing businesses:'), lookupError);
      process.exit(1);
    }
    
    let businessId;
    
    if (existingBusinesses && existingBusinesses.length > 0) {
      console.log(chalk.yellow(`⚠️ Found ${existingBusinesses.length} existing businesses with the same phone numbers:`));
      existingBusinesses.forEach(business => {
        console.log(chalk.yellow(`- ${business.name} (ID: ${business.id})`));
        console.log(chalk.yellow(`  Public Phone: ${business.public_phone}, Twilio Phone: ${business.twilio_phone}`));
      });
      
      // Update existing business
      console.log(chalk.blue('\nUpdating existing business...'));
      
      const business = existingBusinesses[0];
      businessId = business.id;
      
      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          name: testBusiness.name,
          business_type: testBusiness.business_type,
          online_ordering_url: testBusiness.online_ordering_url,
          custom_settings: testBusiness.custom_settings
        })
        .eq('id', business.id);
        
      if (updateError) {
        console.error(chalk.red(`❌ Error updating business ${business.id}:`), updateError);
        process.exit(1);
      } else {
        console.log(chalk.green(`✅ Updated business ${business.id}`));
      }
    } else {
      console.log(chalk.green('✅ No existing businesses found with the same phone numbers'));
      
      // Create the test business
      console.log(chalk.blue('\nCreating test business...'));
      
      const { data: createdBusiness, error: createError } = await supabase
        .from('businesses')
        .insert(testBusiness)
        .select();
        
      if (createError) {
        console.error(chalk.red('❌ Error creating test business:'), createError);
        process.exit(1);
      }
      
      console.log(chalk.green('✅ Successfully created test business:'));
      console.log(createdBusiness[0]);
      businessId = createdBusiness[0].id;
    }
    
    return businessId;
  } catch (error) {
    console.error(chalk.red('❌ Unexpected error:'), error);
    process.exit(1);
  }
}

/**
 * Simulate a missed call to test the auto-reply with online ordering URL
 */
async function simulateMissedCall(businessId) {
  try {
    console.log(chalk.blue('\n🔄 Simulating missed call...'));
    
    // Get the business details
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();
      
    if (businessError) {
      console.error(chalk.red('❌ Error fetching business:'), businessError);
      process.exit(1);
    }
    
    console.log(chalk.blue(`Simulating missed call to ${business.name} (${business.twilio_phone})`));
    
    // Prepare the missed call payload
    const missedCallPayload = {
      To: business.twilio_phone,
      From: '+16195559876', // Simulated caller
      CallSid: `TEST${Date.now()}`,
      CallStatus: 'no-answer',
      Direction: 'inbound'
    };
    
    console.log(chalk.blue('Missed call payload:'));
    console.log(missedCallPayload);
    
    // Call the missed-call endpoint
    console.log(chalk.blue(`\nCalling missed-call endpoint at ${BASE_URL}/api/missed-call`));
    
    const response = await fetch(`${BASE_URL}/api/missed-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Test-Mode': 'true' // Add a header to indicate this is a test
      },
      body: new URLSearchParams(missedCallPayload)
    });
    
    const responseData = await response.json();
    
    console.log(chalk.blue('\nResponse from missed-call endpoint:'));
    console.log(responseData);
    
    if (response.ok) {
      console.log(chalk.green('✅ Successfully simulated missed call'));
      
      // Check if the call event was logged
      console.log(chalk.blue('\nChecking if call event was logged...'));
      
      const { data: callEvents, error: callEventsError } = await supabase
        .from('call_events')
        .select('*')
        .eq('call_sid', missedCallPayload.CallSid)
        .order('ts', { ascending: false });
        
      if (callEventsError) {
        console.error(chalk.red('❌ Error fetching call events:'), callEventsError);
      } else if (callEvents && callEvents.length > 0) {
        console.log(chalk.green(`✅ Found ${callEvents.length} call events for this call`));
        console.log(callEvents[0]);
      } else {
        console.log(chalk.yellow('⚠️ No call events found for this call'));
      }
      
      console.log(chalk.green('\n✅ Test completed successfully'));
      console.log(chalk.blue('Note: Check the logs to verify that the online ordering URL was included in the auto-reply message'));
      console.log(chalk.blue('Look for a log line like: "[missed-call] Appending online ordering link for business Test Restaurant with Online Ordering"'));
    } else {
      console.error(chalk.red('❌ Failed to simulate missed call'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error simulating missed call:'), error);
  }
}

// Run the test
async function runTest() {
  console.log(chalk.blue('🧪 Starting online ordering URL test'));
  
  try {
    // Create or update test business
    const businessId = await createTestBusinessWithOrderingUrl();
    
    // Simulate missed call
    await simulateMissedCall(businessId);
  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error);
  }
}

runTest();
