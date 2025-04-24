/**
 * Script to test the Supabase business lookup functionality
 * 
 * This script tests the getBusinessByPhoneNumberSupabase function to verify
 * that it can correctly look up a business in Supabase by phone number.
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

// Initialize Supabase client directly in the script
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Get a business by phone number from Supabase
 */
async function getBusinessByPhoneNumber(phoneNumber) {
  try {
    console.log(`🔍 Looking up business in Supabase by phone number: ${phoneNumber}`);
    
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .or(`public_phone.eq.${phoneNumber},twilio_phone.eq.${phoneNumber}`);
      
    if (error) {
      console.error('Error fetching business from Supabase:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      // If multiple businesses are found, return the most recently created one
      let business;
      if (data.length > 1) {
        // Sort by created_at in descending order (newest first)
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        business = data[0];
        console.log(`ℹ️ Note: Found ${data.length} businesses with this phone number, using the most recent one`);
      } else {
        business = data[0];
      }
      
      console.log(`✅ Found business in Supabase: ${business.name} (${business.id})`);
      return business;
    } else {
      console.log(`ℹ️ No business found in Supabase with phone number ${phoneNumber}`);
      return null;
    }
  } catch (error) {
    console.error('Error in getBusinessByPhoneNumber:', error);
    return null;
  }
}

/**
 * Test looking up a business by phone number
 */
async function testBusinessLookup() {
  try {
    console.log(chalk.blue('🔄 Testing business lookup by phone number...'));
    
    // Test with the Twilio phone number (818 area code)
    const twilioNumber = '+18186518560';
    console.log(chalk.blue(`Looking up business with Twilio number: ${twilioNumber}`));
    
    console.log('Making Supabase query for Twilio number...');
    const businessByTwilioNumber = await getBusinessByPhoneNumber(twilioNumber);
    console.log('Supabase query for Twilio number completed.');
    
    if (businessByTwilioNumber) {
      console.log(chalk.green('✅ Successfully found business by Twilio number:'));
      console.log(businessByTwilioNumber);
    } else {
      console.log(chalk.yellow(`⚠️ No business found with Twilio number: ${twilioNumber}`));
    }
    
    // Test with the public phone number (619 area code)
    const publicNumber = '+16195551234'; // This should match what you entered in Supabase
    console.log(chalk.blue(`\nLooking up business with public number: ${publicNumber}`));
    
    console.log('Making Supabase query for public number...');
    const businessByPublicNumber = await getBusinessByPhoneNumber(publicNumber);
    console.log('Supabase query for public number completed.');
    
    if (businessByPublicNumber) {
      console.log(chalk.green('✅ Successfully found business by public number:'));
      console.log(businessByPublicNumber);
    } else {
      console.log(chalk.yellow(`⚠️ No business found with public number: ${publicNumber}`));
    }
    
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Error testing business lookup:'), error);
    return false;
  }
}

// Run the test
testBusinessLookup().catch(error => {
  console.error(chalk.red('❌ Unexpected error:'), error);
  process.exit(1);
});
