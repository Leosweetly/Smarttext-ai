/**
 * Monitoring Data Cleanup Script
 * 
 * This script cleans up old monitoring data to prevent the tables from growing too large.
 * It can be run as a scheduled job (e.g., via cron) to maintain database performance.
 * 
 * Usage:
 *   node scripts/cleanup-monitoring-data.js [--days DAYS] [--dry-run]
 * 
 * Options:
 *   --days DAYS    Number of days of data to keep (default: 90)
 *   --dry-run      Show what would be deleted without actually deleting
 */

import dotenv from 'dotenv';
import { supabase } from '../lib/supabase.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Parse command line arguments
const args = process.argv.slice(2);
let daysToKeep = 90;
let dryRun = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--days' && i + 1 < args.length) {
    daysToKeep = parseInt(args[i + 1], 10);
    i++; // Skip the next argument
  } else if (args[i] === '--dry-run') {
    dryRun = true;
  }
}

// Validate days to keep
if (isNaN(daysToKeep) || daysToKeep < 1) {
  console.error(`Invalid days value: ${daysToKeep}`);
  console.error('Please use a positive integer');
  process.exit(1);
}

// Calculate cutoff date
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
const cutoffDateString = cutoffDate.toISOString();

console.log(`🧹 Cleaning up monitoring data older than ${daysToKeep} days (before ${cutoffDate.toISOString().split('T')[0]})`);
if (dryRun) {
  console.log('🔍 DRY RUN: No data will be deleted');
}

async function countRecordsToDelete(table, dateColumn) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .lt(dateColumn, cutoffDateString);
    
  if (error) {
    console.error(`❌ Error counting records in ${table}:`, error);
    return 0;
  }
  
  return count;
}

async function deleteOldRecords(table, dateColumn) {
  // First count how many records will be deleted
  const count = await countRecordsToDelete(table, dateColumn);
  
  console.log(`📊 ${table}: ${count} records to delete`);
  
  if (count === 0 || dryRun) {
    return { success: true, count: 0 };
  }
  
  // Delete the records
  const { error } = await supabase
    .from(table)
    .delete()
    .lt(dateColumn, cutoffDateString);
    
  if (error) {
    console.error(`❌ Error deleting records from ${table}:`, error);
    return { success: false, count: 0 };
  }
  
  return { success: true, count };
}

async function main() {
  try {
    // Define tables to clean up with their date columns
    const tables = [
      { name: 'sms_events', dateColumn: 'created_at' },
      { name: 'api_usage', dateColumn: 'created_at' },
      { name: 'owner_alerts', dateColumn: 'created_at' },
      { name: 'daily_stats', dateColumn: 'date' }
    ];
    
    // Process each table
    let totalDeleted = 0;
    let failures = 0;
    
    for (const table of tables) {
      console.log(`🔍 Processing ${table.name}...`);
      
      const result = await deleteOldRecords(table.name, table.dateColumn);
      
      if (result.success) {
        console.log(`✅ Successfully processed ${table.name}`);
        totalDeleted += result.count;
      } else {
        console.error(`❌ Failed to process ${table.name}`);
        failures++;
      }
    }
    
    // Print summary
    console.log('\n📋 Cleanup Summary:');
    console.log(`📅 Cutoff date: ${cutoffDate.toISOString().split('T')[0]}`);
    console.log(`🗑️ Total records deleted: ${dryRun ? '0 (dry run)' : totalDeleted}`);
    console.log(`❌ Failed tables: ${failures}`);
    
    if (failures > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  }
}

main();
