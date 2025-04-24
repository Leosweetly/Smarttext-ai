/**
 * Script to debug the business lookup in Supabase
 * 
 * This script looks up a business by phone number and prints the full business object
 * to help debug issues with custom settings.
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
 * Debug the business lookup in Supabase
 */
async function debugBusinessLookup() {
  try {
    const phoneNumber = '+16193721633'; // User's personal cell number
    
    console.log(chalk.blue(`🔍 Looking up business in Supabase by phone number: ${phoneNumber}`));
    
    // Look up the business by phone number
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .or(`public_phone.eq.${phoneNumber},twilio_phone.eq.${phoneNumber}`);
      
    if (error) {
      console.error(chalk.red('❌ Error fetching business from Supabase:'), error);
      process.exit(1);
    }
    
    if (data && data.length > 0) {
      console.log(chalk.green(`✅ Found ${data.length} businesses in Supabase with phone number ${phoneNumber}:`));
      
      // Print each business
      data.forEach((business, index) => {
        console.log(chalk.green(`\nBusiness ${index + 1}:`));
        console.log(chalk.green(`- ID: ${business.id}`));
        console.log(chalk.green(`- Name: ${business.name}`));
        console.log(chalk.green(`- Public Phone: ${business.public_phone}`));
        console.log(chalk.green(`- Twilio Phone: ${business.twilio_phone}`));
        
        // Print the custom_settings field
        console.log(chalk.green(`- Custom Settings:`));
        console.log(JSON.stringify(business.custom_settings, null, 2));
        
        // Print the customSettings field
        console.log(chalk.green(`- customSettings:`));
        console.log(JSON.stringify(business.customSettings, null, 2));
        
        // Print all fields
        console.log(chalk.green(`\n- All Fields:`));
        console.log(JSON.stringify(business, null, 2));
      });
      
      // Use the first business for testing
      const testBusiness = data[0];
      
      // Check if the business has a custom auto-reply message
      let messageBody = `Hi! Thanks for calling. We missed your call but we'll get back to you as soon as possible.`;
      
      if (testBusiness.custom_settings && testBusiness.custom_settings.autoReplyMessage) {
        messageBody = testBusiness.custom_settings.autoReplyMessage;
        console.log(chalk.green(`\n✅ Found custom auto-reply message in custom_settings: "${messageBody}"`));
      } else if (testBusiness.customSettings && testBusiness.customSettings.autoReplyMessage) {
        messageBody = testBusiness.customSettings.autoReplyMessage;
        console.log(chalk.green(`\n✅ Found custom auto-reply message in customSettings: "${messageBody}"`));
      } else {
        console.log(chalk.yellow(`\n⚠️ No custom auto-reply message found, using default: "${messageBody}"`));
      }
    } else {
      console.log(chalk.yellow(`⚠️ No business found in Supabase with phone number ${phoneNumber}`));
    }
  } catch (error) {
    console.error(chalk.red('❌ Unexpected error:'), error);
    process.exit(1);
  }
}

// Run the function
debugBusinessLookup().catch(error => {
  console.error(chalk.red('❌ Unexpected error:'), error);
  process.exit(1);
});
