/**
 * Test Supabase Connection
 * 
 * This script tests the connection to Supabase and verifies that the
 * environment variables are set correctly.
 */

import { supabase } from '../lib/supabase.js';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Check if Supabase URL and key are set
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Supabase environment variables are not set.');
      console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.');
      return;
    }
    
    console.log('✅ Supabase environment variables are set.');
    
    // Test connection by querying the database
    const { data, error, status } = await supabase
      .from('businesses')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error connecting to Supabase:', error);
      return;
    }
    
    console.log(`✅ Successfully connected to Supabase! Status: ${status}`);
    console.log(`ℹ️ Found ${data} businesses in the database.`);
    
    // Test migration logs table
    const { data: migrationData, error: migrationError } = await supabase
      .from('supabase_migration_logs')
      .select('count', { count: 'exact', head: true });
    
    if (migrationError) {
      if (migrationError.code === '42P01') {
        console.log('⚠️ Migration logs table does not exist yet.');
        console.log('Run scripts/setup-migration-logs.js to create it.');
      } else {
        console.error('❌ Error checking migration logs table:', migrationError);
      }
    } else {
      console.log(`✅ Migration logs table exists with ${migrationData} records.`);
    }
    
    // Test RPC function for SQL execution
    const { error: rpcError } = await supabase.rpc('exec_sql', { 
      sql: 'SELECT 1 as test' 
    });
    
    if (rpcError) {
      if (rpcError.code === '42883') {
        console.log('⚠️ The exec_sql RPC function does not exist.');
        console.log('You may need to create it for running SQL scripts.');
      } else {
        console.error('❌ Error testing RPC function:', rpcError);
      }
    } else {
      console.log('✅ RPC function for SQL execution is available.');
    }
    
    console.log('\n🎉 Supabase connection test completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test function
testSupabaseConnection();
