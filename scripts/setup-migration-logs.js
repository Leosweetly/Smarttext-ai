/**
 * Setup Migration Logs Table
 * 
 * This script creates the migration logs table in Supabase to track the
 * migration from Airtable to Supabase.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../lib/supabase.js';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'create-migration-logs-table.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

// Split the SQL into individual statements
const statements = sql
  .split(';')
  .map(statement => statement.trim())
  .filter(statement => statement.length > 0);

async function setupMigrationLogsTable() {
  console.log('Setting up migration logs table in Supabase...');
  
  try {
    // Execute each SQL statement
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`Error executing SQL statement: ${statement}`);
        console.error(error);
        return;
      }
    }
    
    console.log('Migration logs table setup complete!');
    
    // Verify the table was created
    const { data, error } = await supabase
      .from('supabase_migration_logs')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error verifying table creation:', error);
      return;
    }
    
    console.log('Table verification successful!');
    
    // Insert a test record
    const { data: insertData, error: insertError } = await supabase
      .from('supabase_migration_logs')
      .insert({
        operation: 'setup',
        entity_type: 'migration_logs',
        entity_id: 'setup-script',
        airtable_success: true,
        supabase_success: true,
        error_message: null
      })
      .select();
    
    if (insertError) {
      console.error('Error inserting test record:', insertError);
      return;
    }
    
    console.log('Test record inserted successfully:', insertData[0].id);
    console.log('Migration logs table is ready for use!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the setup function
setupMigrationLogsTable();
