/**
 * Daily Stats Update Script
 * 
 * This script updates the daily stats for all businesses in Supabase.
 * It can be run as a scheduled job (e.g., via cron) to ensure stats are up-to-date.
 * 
 * Usage:
 *   node scripts/update-daily-stats.js [--date YYYY-MM-DD]
 * 
 * Options:
 *   --date YYYY-MM-DD  Update stats for a specific date (defaults to yesterday)
 *   --reset-openai     Reset OpenAI usage counters for today
 */

import dotenv from 'dotenv';
import { getBusinessesSupabase } from '../lib/supabase.js';
import { updateDailyStats, resetDailyOpenAIUsage } from '../lib/monitoring.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Parse command line arguments
const args = process.argv.slice(2);
let targetDate = null;
let resetOpenAI = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--date' && i + 1 < args.length) {
    targetDate = args[i + 1];
    i++; // Skip the next argument
  } else if (args[i] === '--reset-openai') {
    resetOpenAI = true;
  }
}

// Default to yesterday if no date provided
if (!targetDate) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  targetDate = yesterday.toISOString().split('T')[0];
}

// Validate date format
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (!dateRegex.test(targetDate)) {
  console.error(`Invalid date format: ${targetDate}`);
  console.error('Please use YYYY-MM-DD format');
  process.exit(1);
}

async function main() {
  try {
    console.log(`🔄 Updating daily stats for date: ${targetDate}`);
    
    // Reset OpenAI usage counters if requested
    if (resetOpenAI) {
      console.log('🔄 Resetting OpenAI usage counters for today');
      const resetResult = await resetDailyOpenAIUsage();
      if (resetResult) {
        console.log('✅ Successfully reset OpenAI usage counters');
      } else {
        console.error('❌ Failed to reset OpenAI usage counters');
      }
    }
    
    // Get all businesses
    console.log('🔍 Fetching all businesses from Supabase');
    const businesses = await getBusinessesSupabase();
    console.log(`📊 Found ${businesses.length} businesses`);
    
    // Update stats for each business
    let successCount = 0;
    let failureCount = 0;
    
    for (const business of businesses) {
      try {
        console.log(`🔄 Updating stats for business: ${business.name} (${business.id})`);
        const result = await updateDailyStats(business.id, targetDate);
        
        if (result) {
          console.log(`✅ Successfully updated stats for business: ${business.name}`);
          successCount++;
        } else {
          console.error(`❌ Failed to update stats for business: ${business.name}`);
          failureCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating stats for business ${business.name}:`, error);
        failureCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`📅 Date: ${targetDate}`);
    console.log(`✅ Successful updates: ${successCount}`);
    console.log(`❌ Failed updates: ${failureCount}`);
    console.log(`📊 Total businesses: ${businesses.length}`);
    
    if (failureCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  }
}

main();
