/**
 * Script to add a test business to Supabase
 * 
 * This script adds a test business to Supabase with specific phone numbers
 * for testing the Supabase integration.
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
 * Add a test business to Supabase
 */
async function addTestBusiness() {
  try {
    console.log(chalk.blue('🔄 Adding test business to Supabase...'));
    
    // Define the test business
    const testBusiness = {
      name: 'Test Business',
      business_type: 'test',
      public_phone: '+16195551234', // 619 area code
      twilio_phone: '+18186518560', // 818 area code (Twilio number)
      forwarding_number: '+16195551234', // Same as public_phone
      subscription_tier: 'basic',
      custom_settings: {
        ownerPhone: '+16193721633', // Owner's phone number
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
    
    if (existingBusinesses && existingBusinesses.length > 0) {
      console.log(chalk.yellow(`⚠️ Found ${existingBusinesses.length} existing businesses with the same phone numbers:`));
      existingBusinesses.forEach(business => {
        console.log(chalk.yellow(`- ${business.name} (ID: ${business.id})`));
        console.log(chalk.yellow(`  Public Phone: ${business.public_phone}, Twilio Phone: ${business.twilio_phone}`));
      });
      
      // Update existing businesses
      console.log(chalk.blue('\nUpdating existing businesses...'));
      
      for (const business of existingBusinesses) {
        const { error: updateError } = await supabase
          .from('businesses')
          .update({
            custom_settings: testBusiness.custom_settings
          })
          .eq('id', business.id);
          
        if (updateError) {
          console.error(chalk.red(`❌ Error updating business ${business.id}:`), updateError);
        } else {
          console.log(chalk.green(`✅ Updated business ${business.id}`));
        }
      }
    } else {
      console.log(chalk.green('✅ No existing businesses found with the same phone numbers'));
    }
    
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
    
  } catch (error) {
    console.error(chalk.red('❌ Unexpected error:'), error);
    process.exit(1);
  }
}

// Run the function
addTestBusiness().catch(error => {
  console.error(chalk.red('❌ Unexpected error:'), error);
  process.exit(1);
});
