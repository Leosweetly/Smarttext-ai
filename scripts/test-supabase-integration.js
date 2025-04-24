/**
 * Script to test the Supabase integration
 * 
 * This script tests various Supabase operations to ensure the integration is working correctly.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import chalk from 'chalk';
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
 * Test Supabase connection
 */
async function testConnection() {
  try {
    console.log(chalk.blue('🔄 Testing Supabase connection...'));
    
    // Simple query to test connection - just get the first few records
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .limit(5);
      
    if (error) {
      console.error(chalk.red('❌ Error connecting to Supabase:'), error);
      return false;
    }
    
    console.log(chalk.green(`✅ Successfully connected to Supabase! Found ${data.length} businesses.`));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Error testing connection:'), error);
    return false;
  }
}

/**
 * Test business operations
 */
async function testBusinessOperations() {
  try {
    console.log(chalk.blue('\n🔄 Testing business operations...'));
    
    // Create a test business
    const testBusiness = {
      name: `Test Business ${new Date().toISOString()}`,
      public_phone: '+15551234567',
      twilio_phone: '+15557654321',
      business_type: 'test',
      subscription_tier: 'basic',
      custom_settings: {
        testField: 'test value',
        ownerPhone: '+15559876543'
      }
    };
    
    console.log(chalk.blue('Creating test business...'));
    const { data: createdBusiness, error: createError } = await supabase
      .from('businesses')
      .insert(testBusiness)
      .select();
      
    if (createError) {
      console.error(chalk.red('❌ Error creating test business:'), createError);
      return false;
    }
    
    const businessId = createdBusiness[0].id;
    console.log(chalk.green(`✅ Successfully created test business with ID: ${businessId}`));
    
    // Fetch the business by ID
    console.log(chalk.blue('Fetching business by ID...'));
    const { data: fetchedBusiness, error: fetchError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();
      
    if (fetchError) {
      console.error(chalk.red('❌ Error fetching business by ID:'), fetchError);
      return false;
    }
    
    console.log(chalk.green('✅ Successfully fetched business by ID'));
    console.log(chalk.blue('Business details:'));
    console.log(fetchedBusiness);
    
    // Fetch the business by phone number
    console.log(chalk.blue('Fetching business by phone number...'));
    const { data: fetchedByPhone, error: phoneError } = await supabase
      .from('businesses')
      .select('*')
      .or(`public_phone.eq.${testBusiness.public_phone},twilio_phone.eq.${testBusiness.twilio_phone}`)
      .maybeSingle();
      
    if (phoneError) {
      console.error(chalk.red('❌ Error fetching business by phone number:'), phoneError);
      return false;
    }
    
    console.log(chalk.green('✅ Successfully fetched business by phone number'));
    
    // Update the business
    console.log(chalk.blue('Updating business...'));
    const { data: updatedBusiness, error: updateError } = await supabase
      .from('businesses')
      .update({ name: `${testBusiness.name} (Updated)` })
      .eq('id', businessId)
      .select();
      
    if (updateError) {
      console.error(chalk.red('❌ Error updating business:'), updateError);
      return false;
    }
    
    console.log(chalk.green('✅ Successfully updated business'));
    console.log(chalk.blue('Updated business details:'));
    console.log(updatedBusiness[0]);
    
    // Delete the test business
    console.log(chalk.blue('Deleting test business...'));
    const { error: deleteError } = await supabase
      .from('businesses')
      .delete()
      .eq('id', businessId);
      
    if (deleteError) {
      console.error(chalk.red('❌ Error deleting test business:'), deleteError);
      return false;
    }
    
    console.log(chalk.green('✅ Successfully deleted test business'));
    
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Error testing business operations:'), error);
    return false;
  }
}

/**
 * Test call event operations
 */
async function testCallEventOperations() {
  try {
    console.log(chalk.blue('\n🔄 Testing call event operations...'));
    
    // Create a test business first
    const testBusiness = {
      name: `Test Business for Call Events ${new Date().toISOString()}`,
      public_phone: '+15551234567',
      twilio_phone: '+15557654321',
      business_type: 'test'
    };
    
    console.log(chalk.blue('Creating test business for call events...'));
    const { data: createdBusiness, error: createBusinessError } = await supabase
      .from('businesses')
      .insert(testBusiness)
      .select();
      
    if (createBusinessError) {
      console.error(chalk.red('❌ Error creating test business for call events:'), createBusinessError);
      return false;
    }
    
    const businessId = createdBusiness[0].id;
    console.log(chalk.green(`✅ Successfully created test business with ID: ${businessId}`));
    
    // Create a test call event
    const testCallEvent = {
      call_sid: `TEST_CALL_${Date.now()}`,
      from_number: '+15551234567',
      to_number: '+15557654321',
      business_id: businessId,
      event_type: 'voice.missed',
      call_status: 'no-answer',
      owner_notified: true,
      payload: {
        CallSid: `TEST_CALL_${Date.now()}`,
        From: '+15551234567',
        To: '+15557654321',
        CallStatus: 'no-answer',
        Direction: 'inbound'
      }
    };
    
    console.log(chalk.blue('Creating test call event...'));
    const { data: createdEvent, error: createEventError } = await supabase
      .from('call_events')
      .insert(testCallEvent)
      .select();
      
    if (createEventError) {
      console.error(chalk.red('❌ Error creating test call event:'), createEventError);
      return false;
    }
    
    const eventId = createdEvent[0].id;
    console.log(chalk.green(`✅ Successfully created test call event with ID: ${eventId}`));
    
    // Fetch the call event
    console.log(chalk.blue('Fetching call event...'));
    const { data: fetchedEvent, error: fetchEventError } = await supabase
      .from('call_events')
      .select('*')
      .eq('id', eventId)
      .maybeSingle();
      
    if (fetchEventError) {
      console.error(chalk.red('❌ Error fetching call event:'), fetchEventError);
      return false;
    }
    
    console.log(chalk.green('✅ Successfully fetched call event'));
    console.log(chalk.blue('Call event details:'));
    console.log(fetchedEvent);
    
    // Clean up - delete the test call event and business
    console.log(chalk.blue('Cleaning up test data...'));
    
    const { error: deleteEventError } = await supabase
      .from('call_events')
      .delete()
      .eq('id', eventId);
      
    if (deleteEventError) {
      console.error(chalk.red('❌ Error deleting test call event:'), deleteEventError);
    }
    
    const { error: deleteBusinessError } = await supabase
      .from('businesses')
      .delete()
      .eq('id', businessId);
      
    if (deleteBusinessError) {
      console.error(chalk.red('❌ Error deleting test business:'), deleteBusinessError);
    }
    
    console.log(chalk.green('✅ Successfully cleaned up test data'));
    
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Error testing call event operations:'), error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(chalk.blue('🧪 Starting Supabase integration tests...'));
  
  // Test connection
  const connectionSuccess = await testConnection();
  if (!connectionSuccess) {
    console.error(chalk.red('❌ Connection test failed. Aborting further tests.'));
    process.exit(1);
  }
  
  // Test business operations
  const businessSuccess = await testBusinessOperations();
  if (!businessSuccess) {
    console.error(chalk.red('❌ Business operations test failed.'));
  }
  
  // Test call event operations
  const callEventSuccess = await testCallEventOperations();
  if (!callEventSuccess) {
    console.error(chalk.red('❌ Call event operations test failed.'));
  }
  
  // Summary
  console.log(chalk.blue('\n📋 Test Summary:'));
  console.log(chalk.blue(`Connection Test: ${connectionSuccess ? chalk.green('✅ Passed') : chalk.red('❌ Failed')}`));
  console.log(chalk.blue(`Business Operations Test: ${businessSuccess ? chalk.green('✅ Passed') : chalk.red('❌ Failed')}`));
  console.log(chalk.blue(`Call Event Operations Test: ${callEventSuccess ? chalk.green('✅ Passed') : chalk.red('❌ Failed')}`));
  
  if (connectionSuccess && businessSuccess && callEventSuccess) {
    console.log(chalk.green('\n✅ All tests passed! Supabase integration is working correctly.'));
    console.log(chalk.blue('You can now set USE_SUPABASE_BUSINESS_LOOKUP=true in .env.local to start using Supabase for lookups.'));
  } else {
    console.log(chalk.red('\n❌ Some tests failed. Please check the errors above and fix the issues before proceeding.'));
  }
}

// Run the tests
runTests().catch(error => {
  console.error(chalk.red('❌ Unexpected error:'), error);
  process.exit(1);
});
