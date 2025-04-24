/**
 * Script to add a test business with a custom auto-reply message to Supabase
 * 
 * This script creates a test business in Supabase with the specified phone number
 * and a custom auto-reply message for missed calls.
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
 * Add a test business with a custom auto-reply message to Supabase
 */
async function addTestBusinessWithCustomMessage() {
  try {
    console.log(chalk.blue('🔄 Adding test business with custom auto-reply message to Supabase...'));
    
    // Define the business data
    const businessData = {
      name: 'Test Business',
      business_type: 'test',
      public_phone: '+16193721633', // User's personal cell number
      twilio_phone: '+18186518560', // Twilio number
      forwarding_number: '+16193721633', // Forward to the same number
      address: '123 Test St, San Diego, CA 92101',
      subscription_tier: 'basic',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      custom_settings: {
        ownerPhone: '+16193721633',
        twilioNumber: '+18186518560',
        autoReplyMessage: 'Thanks for calling Test Business! Were you calling about getting a quote or business hours?',
        testCustomerNumber: '+18185191178' // Wife's number for testing
      },
      hours_json: {
        monday: { open: '09:00', close: '17:00' },
        tuesday: { open: '09:00', close: '17:00' },
        wednesday: { open: '09:00', close: '17:00' },
        thursday: { open: '09:00', close: '17:00' },
        friday: { open: '09:00', close: '17:00' },
        saturday: { open: '10:00', close: '15:00' },
        sunday: { open: 'closed', close: 'closed' }
      },
      faqs_json: [
        {
          question: 'What are your business hours?',
          answer: 'We are open Monday through Friday from 9am to 5pm, Saturday from 10am to 3pm, and closed on Sunday.'
        },
        {
          question: 'Do you offer free quotes?',
          answer: 'Yes, we offer free quotes for all our services. Please call us or visit our website to request a quote.'
        }
      ]
    };
    
    // Insert the business into Supabase
    const { data, error } = await supabase
      .from('businesses')
      .insert(businessData)
      .select();
      
    if (error) {
      console.error(chalk.red('❌ Error adding business to Supabase:'), error);
      process.exit(1);
    }
    
    console.log(chalk.green('✅ Successfully added test business to Supabase:'));
    console.log(chalk.green(`- Business ID: ${data[0].id}`));
    console.log(chalk.green(`- Business Name: ${data[0].name}`));
    console.log(chalk.green(`- Public Phone: ${data[0].public_phone}`));
    console.log(chalk.green(`- Twilio Phone: ${data[0].twilio_phone}`));
    console.log(chalk.green(`- Custom Auto-Reply Message: ${businessData.custom_settings.autoReplyMessage}`));
    console.log(chalk.green(`- Test Customer Number: ${businessData.custom_settings.testCustomerNumber}`));
    
    // Update the missed-call.ts file to use the custom auto-reply message
    console.log(chalk.blue('\n🔄 To test this, you can use the following command:'));
    console.log(chalk.blue(`node scripts/test-missed-call-supabase.js`));
    
    console.log(chalk.blue('\n🔄 Or you can simulate a call from the test customer number:'));
    console.log(chalk.blue(`curl -X POST http://localhost:3003/api/missed-call -H "Content-Type: application/json" -d '{"To": "+16193721633", "From": "+18185191178", "CallSid": "TEST_CALL_CUSTOM_MESSAGE", "CallStatus": "no-answer", "Direction": "inbound", "ConnectDuration": "0"}'`));
    
  } catch (error) {
    console.error(chalk.red('❌ Unexpected error:'), error);
    process.exit(1);
  }
}

// Run the function
addTestBusinessWithCustomMessage().catch(error => {
  console.error(chalk.red('❌ Unexpected error:'), error);
  process.exit(1);
});
