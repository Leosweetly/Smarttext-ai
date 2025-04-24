/**
 * Script to migrate businesses from Airtable to Supabase
 * 
 * This script fetches all businesses from Airtable and migrates them to Supabase.
 * It handles the data transformation between the two systems.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';
import { getAllBusinesses } from '../lib/airtable.js';

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
 * Transform Airtable business data to Supabase format
 */
function transformBusinessData(airtableBusiness) {
  // Extract custom settings from various Airtable fields
  const customSettings = {
    ownerPhone: airtableBusiness.ownerPhone || airtableBusiness['Owner Phone'],
    twilioNumber: airtableBusiness.twilioPhone || airtableBusiness['Twilio Number'],
    // Add any other custom settings from Airtable
  };
  
  // Transform business hours if available
  const hours = airtableBusiness.hours || airtableBusiness['Hours'] || {};
  
  // Transform FAQs if available
  const faqs = airtableBusiness.faqs || airtableBusiness['FAQs'] || [];
  
  // Return the transformed data
  return {
    // Use the Airtable ID as an external ID in custom settings
    id: airtableBusiness.id, // Keep the same ID for easier reference
    name: airtableBusiness.name || airtableBusiness['Business Name'],
    business_type: airtableBusiness.businessType || airtableBusiness['Business Type'] || 'other',
    public_phone: airtableBusiness.publicPhone || airtableBusiness['Public Phone'] || airtableBusiness.phoneNumber || airtableBusiness['Phone Number'],
    twilio_phone: airtableBusiness.twilioPhone || airtableBusiness['Twilio Number'],
    forwarding_number: airtableBusiness.forwardingNumber || airtableBusiness['Forwarding Number'],
    address: airtableBusiness.address || airtableBusiness['Address'],
    subscription_tier: airtableBusiness.subscriptionTier || airtableBusiness['Subscription Tier'] || 'basic',
    trial_ends_at: airtableBusiness.trialEndsAt || airtableBusiness['Trial Ends At'],
    custom_settings: customSettings,
    hours_json: hours,
    faqs_json: faqs
  };
}

/**
 * Migrate businesses from Airtable to Supabase
 */
async function migrateBusinesses() {
  try {
    console.log(chalk.blue('🔄 Fetching businesses from Airtable...'));
    
    // Fetch all businesses from Airtable
    const airtableBusinesses = await getAllBusinesses();
    
    console.log(chalk.green(`✅ Fetched ${airtableBusinesses.length} businesses from Airtable`));
    
    // Process businesses in batches to avoid rate limits
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < airtableBusinesses.length; i += batchSize) {
      batches.push(airtableBusinesses.slice(i, i + batchSize));
    }
    
    console.log(chalk.blue(`🔄 Processing ${batches.length} batches of businesses...`));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(chalk.blue(`🔄 Processing batch ${i + 1} of ${batches.length} (${batch.length} businesses)...`));
      
      // Transform Airtable data to Supabase format
      const supabaseBusinesses = batch.map(transformBusinessData);
      
      // Check for existing businesses in Supabase to avoid duplicates
      for (const business of supabaseBusinesses) {
        try {
          // Check if business already exists in Supabase
          const { data: existingBusiness, error: lookupError } = await supabase
            .from('businesses')
            .select('id')
            .eq('id', business.id)
            .maybeSingle();
            
          if (lookupError) {
            console.error(chalk.red(`❌ Error checking for existing business ${business.id}:`), lookupError);
            errorCount++;
            continue;
          }
          
          if (existingBusiness) {
            // Update existing business
            console.log(chalk.blue(`🔄 Updating existing business: ${business.name} (${business.id})`));
            
            const { error: updateError } = await supabase
              .from('businesses')
              .update(business)
              .eq('id', business.id);
              
            if (updateError) {
              console.error(chalk.red(`❌ Error updating business ${business.id}:`), updateError);
              errorCount++;
            } else {
              console.log(chalk.green(`✅ Updated business: ${business.name} (${business.id})`));
              successCount++;
            }
          } else {
            // Insert new business
            console.log(chalk.blue(`🔄 Inserting new business: ${business.name} (${business.id})`));
            
            const { error: insertError } = await supabase
              .from('businesses')
              .insert(business);
              
            if (insertError) {
              console.error(chalk.red(`❌ Error inserting business ${business.id}:`), insertError);
              errorCount++;
            } else {
              console.log(chalk.green(`✅ Inserted business: ${business.name} (${business.id})`));
              successCount++;
            }
          }
        } catch (error) {
          console.error(chalk.red(`❌ Unexpected error processing business ${business.id}:`), error);
          errorCount++;
        }
      }
      
      // Add a small delay between batches to avoid rate limits
      if (i < batches.length - 1) {
        console.log(chalk.blue('⏱️ Waiting 1 second before processing next batch...'));
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(chalk.blue('\n📋 Migration Summary:'));
    console.log(chalk.blue(`Total businesses: ${airtableBusinesses.length}`));
    console.log(chalk.green(`✅ Successfully migrated: ${successCount}`));
    console.log(chalk.red(`❌ Failed to migrate: ${errorCount}`));
    
    if (successCount === airtableBusinesses.length) {
      console.log(chalk.green('\n✅ All businesses successfully migrated to Supabase!'));
    } else {
      console.log(chalk.yellow('\n⚠️ Some businesses failed to migrate. Check the logs for details.'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Unexpected error:'), error);
    process.exit(1);
  }
}

// Run the migration
migrateBusinesses().catch(error => {
  console.error(chalk.red('❌ Unexpected error:'), error);
  process.exit(1);
});
