/**
 * Script to check if a business exists in Supabase by phone number
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
 * Check if a business exists in Supabase by phone number
 */
async function checkBusinessInSupabase() {
  try {
    const phoneNumber = '+18186518560'; // Twilio number
    
    console.log(chalk.blue(`🔍 Looking up business in Supabase by phone number: ${phoneNumber}`));
    
    // Check if the business exists
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
      
      data.forEach(business => {
        console.log(chalk.green(`- ${business.name} (ID: ${business.id})`));
        console.log(chalk.green(`  Public Phone: ${business.public_phone}, Twilio Phone: ${business.twilio_phone}`));
        console.log(chalk.green(`  Custom Settings: ${JSON.stringify(business.custom_settings)}`));
      });
    } else {
      console.log(chalk.yellow(`⚠️ No business found in Supabase with phone number ${phoneNumber}`));
    }
    
    // List all businesses
    console.log(chalk.blue('\n📋 Listing all businesses in Supabase:'));
    
    const { data: allBusinesses, error: allError } = await supabase
      .from('businesses')
      .select('*');
      
    if (allError) {
      console.error(chalk.red('❌ Error fetching all businesses from Supabase:'), allError);
      process.exit(1);
    }
    
    if (allBusinesses && allBusinesses.length > 0) {
      console.log(chalk.green(`✅ Found ${allBusinesses.length} businesses in Supabase:`));
      
      allBusinesses.forEach(business => {
        console.log(chalk.green(`- ${business.name} (ID: ${business.id})`));
        console.log(chalk.green(`  Public Phone: ${business.public_phone}, Twilio Phone: ${business.twilio_phone}`));
      });
    } else {
      console.log(chalk.yellow(`⚠️ No businesses found in Supabase`));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Unexpected error:'), error);
    process.exit(1);
  }
}

// Run the function
checkBusinessInSupabase().catch(error => {
  console.error(chalk.red('❌ Unexpected error:'), error);
  process.exit(1);
});
