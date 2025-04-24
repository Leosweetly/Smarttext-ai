/**
 * Monitor Migration Progress
 * 
 * This script monitors the progress of the Airtable to Supabase migration
 * by querying the migration logs table and providing statistics.
 */

import { supabase } from '../lib/supabase.js';
import { getMigrationStats, getRecentMigrationErrors } from '../lib/migration-logger.js';

// Entity types to monitor
const ENTITY_TYPES = [
  'business',
  'call_event',
  'sms_event',
  'missed_call'
];

// Operation types to monitor
const OPERATIONS = [
  'read',
  'write',
  'update',
  'delete'
];

async function monitorMigrationProgress() {
  console.log('📊 Monitoring Airtable to Supabase Migration Progress\n');
  
  try {
    // Check if migration logs table exists
    const { error } = await supabase
      .from('supabase_migration_logs')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') {
        console.error('❌ Migration logs table does not exist yet.');
        console.error('Run scripts/setup-migration-logs.js to create it.');
        return;
      } else {
        console.error('❌ Error checking migration logs table:', error);
        return;
      }
    }
    
    // Get overall statistics
    const { data: totalData, error: totalError } = await supabase
      .from('supabase_migration_logs')
      .select('count', { count: 'exact' });
    
    if (totalError) {
      console.error('❌ Error getting total migration logs:', totalError);
      return;
    }
    
    console.log(`📈 Total migration operations logged: ${totalData.count}`);
    
    // Get statistics by entity type
    console.log('\n📋 Statistics by Entity Type:');
    console.log('─────────────────────────────────────────────────────────');
    console.log('Entity Type    | Total | Airtable | Supabase | Both | Success Rate');
    console.log('─────────────────────────────────────────────────────────');
    
    for (const entityType of ENTITY_TYPES) {
      const stats = await getMigrationStats(entityType);
      
      if (stats.error) {
        console.error(`❌ Error getting stats for ${entityType}:`, stats.error);
        continue;
      }
      
      const successRate = stats.total > 0 
        ? Math.round((stats.bothSuccess / stats.total) * 100) 
        : 0;
      
      console.log(
        `${entityType.padEnd(14)} | ${String(stats.total).padEnd(5)} | ${String(stats.airtableSuccess).padEnd(8)} | ${String(stats.supabaseSuccess).padEnd(8)} | ${String(stats.bothSuccess).padEnd(4)} | ${successRate}%`
      );
    }
    
    // Get statistics by operation type
    console.log('\n📋 Statistics by Operation Type:');
    console.log('─────────────────────────────────────────────────────────');
    console.log('Operation     | Total | Airtable | Supabase | Both | Success Rate');
    console.log('─────────────────────────────────────────────────────────');
    
    for (const operation of OPERATIONS) {
      const { data, error } = await supabase
        .from('supabase_migration_logs')
        .select('*')
        .eq('operation', operation);
      
      if (error) {
        console.error(`❌ Error getting stats for ${operation}:`, error);
        continue;
      }
      
      const total = data.length;
      const airtableSuccess = data.filter(log => log.airtable_success).length;
      const supabaseSuccess = data.filter(log => log.supabase_success).length;
      const bothSuccess = data.filter(log => log.airtable_success && log.supabase_success).length;
      const successRate = total > 0 ? Math.round((bothSuccess / total) * 100) : 0;
      
      console.log(
        `${operation.padEnd(13)} | ${String(total).padEnd(5)} | ${String(airtableSuccess).padEnd(8)} | ${String(supabaseSuccess).padEnd(8)} | ${String(bothSuccess).padEnd(4)} | ${successRate}%`
      );
    }
    
    // Get recent errors
    const recentErrors = await getRecentMigrationErrors(5);
    
    if (recentErrors.length > 0) {
      console.log('\n⚠️ Recent Errors:');
      console.log('─────────────────────────────────────────────────────────');
      
      for (const error of recentErrors) {
        const timestamp = new Date(error.created_at).toLocaleString();
        console.log(`[${timestamp}] ${error.operation} ${error.entity_type} (${error.entity_id})`);
        console.log(`  Airtable: ${error.airtable_success ? '✅' : '❌'}, Supabase: ${error.supabase_success ? '✅' : '❌'}`);
        console.log(`  Error: ${error.error_message}`);
        console.log('─────────────────────────────────────────────────────────');
      }
    } else {
      console.log('\n✅ No recent errors found!');
    }
    
    // Get migration progress over time
    const { data: timeData, error: timeError } = await supabase
      .from('supabase_migration_logs')
      .select('created_at')
      .order('created_at', { ascending: true });
    
    if (timeError) {
      console.error('❌ Error getting time data:', timeError);
    } else if (timeData.length > 0) {
      const firstLog = new Date(timeData[0].created_at);
      const lastLog = new Date(timeData[timeData.length - 1].created_at);
      const durationMs = lastLog - firstLog;
      const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24) * 10) / 10;
      
      console.log('\n📅 Migration Timeline:');
      console.log(`  Started: ${firstLog.toLocaleString()}`);
      console.log(`  Latest: ${lastLog.toLocaleString()}`);
      console.log(`  Duration: ${durationDays} days`);
      console.log(`  Average operations per day: ${Math.round(timeData.length / durationDays)}`);
    }
    
    console.log('\n🎉 Migration monitoring complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the monitoring function
monitorMigrationProgress();
