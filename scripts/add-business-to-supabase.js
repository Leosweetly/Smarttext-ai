/**
 * Script to add a business to Supabase
 * 
 * Usage:
 * node add-business-to-supabase.js "Business Name" "+15551234567" "+15557654321"
 * 
 * Arguments:
 * 1. Business name
 * 2. Customer's phone number
 * 3. Twilio phone number (optional)
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
 * Add a business to Supabase
 */
async function addBusiness() {
  try {
    // Get business details from command line args
    const name = process.argv[2];
    const publicPhone = process.argv[3];
    const twilioPhone = process.argv[4];
    
    if (!name || !publicPhone) {
      console.error(chalk.red('❌ Missing required arguments'));
      console.log(chalk.yellow('Usage: node add-business-to-supabase.js "Business Name" "+15551234567" "+15557654321"'));
      process.exit(1);
    }
    
    console.log(chalk.blue('🔄 Adding business to Supabase...'));
    console.log(chalk.blue(`Name: ${name}`));
    console.log(chalk.blue(`Public Phone: ${publicPhone}`));
    console.log(chalk.blue(`Twilio Phone: ${twilioPhone || 'Not provided'}`));
    
    // Create business in Supabase
    const { data, error } = await supabase
      .from('businesses')
      .insert({
        name,
        public_phone: publicPhone,
        twilio_phone: twilioPhone || null,
        business_type: 'other',
        forwarding_number: publicPhone,
        subscription_tier: 'basic',
        custom_settings: {
          twilioNumber: twilioPhone || null,
          forwardingNumber: publicPhone,
          ownerPhone: publicPhone
        }
      })
      .select();
      
    if (error) {
      console.error(chalk.red('❌ Error adding business to Supabase:'), error);
      process.exit(1);
    }
    
    console.log(chalk.green('✅ Business added successfully!'));
    console.log(chalk.blue('Business details:'));
    console.log(data[0]);
    
  } catch (error) {
    console.error(chalk.red('❌ Unexpected error:'), error);
    process.exit(1);
  }
}

// Run the function
addBusiness().catch(error => {
  console.error(chalk.red('❌ Unexpected error:'), error);
  process.exit(1);
});
