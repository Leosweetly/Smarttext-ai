/**
 * Script to explore the Airtable schema
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import Airtable from 'airtable';
import chalk from 'chalk';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local
const envPath = resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

// Check if required environment variables are set
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
  console.error(chalk.red('❌ Airtable credentials not found in environment variables'));
  process.exit(1);
}

// Initialize Airtable base
const base = new Airtable({ apiKey: AIRTABLE_PAT }).base(AIRTABLE_BASE_ID);

async function exploreTableSchema(tableName) {
  try {
    console.log(chalk.blue(`\n🔍 Exploring schema for table: ${tableName}`));
    
    const table = base(tableName);
    const records = await table.select({ maxRecords: 1 }).firstPage();
    
    if (records.length === 0) {
      console.log(chalk.yellow(`⚠️ No records found in the ${tableName} table`));
      return;
    }
    
    const record = records[0];
    console.log(chalk.green(`✅ Found record with ID: ${record.id}`));
    
    console.log(chalk.blue('\nFields in the record:'));
    const fields = Object.keys(record.fields);
    
    if (fields.length === 0) {
      console.log(chalk.yellow('⚠️ No fields found in the record'));
    } else {
      fields.forEach(field => {
        const value = record.get(field);
        const type = Array.isArray(value) ? 'Array' : typeof value;
        console.log(chalk.green(`- ${field}: ${type}`));
        
        // Show sample value
        if (value !== undefined) {
          const displayValue = typeof value === 'object' 
            ? JSON.stringify(value).substring(0, 100) 
            : String(value).substring(0, 100);
          console.log(chalk.gray(`  Sample: ${displayValue}`));
        } else {
          console.log(chalk.gray('  Sample: undefined'));
        }
      });
    }
    
    // Get all records to count
    const allRecords = await table.select().all();
    console.log(chalk.blue(`\nTotal records in ${tableName}: ${allRecords.length}`));
    
  } catch (error) {
    console.error(chalk.red(`❌ Error exploring table ${tableName}:`), error.message);
    console.error(chalk.red('Stack:'), error.stack);
  }
}

// List all tables in the base
async function listTables() {
  try {
    console.log(chalk.blue('📋 Listing all tables in the base...'));
    
    // This is a workaround since Airtable API doesn't provide a direct way to list tables
    // We'll try to access some common table names
    const commonTableNames = [
      'Businesses', 'Business', 'Companies', 'Company', 'Customers', 'Customer',
      'Users', 'User', 'Contacts', 'Contact', 'Leads', 'Lead',
      'Products', 'Product', 'Orders', 'Order', 'Invoices', 'Invoice'
    ];
    
    let foundTables = [];
    
    for (const tableName of commonTableNames) {
      try {
        const table = base(tableName);
        const records = await table.select({ maxRecords: 1 }).firstPage();
        foundTables.push({
          name: tableName,
          recordCount: records.length
        });
        console.log(chalk.green(`✅ Found table: ${tableName} (${records.length} records)`));
      } catch (error) {
        // Table doesn't exist, skip
      }
    }
    
    if (foundTables.length === 0) {
      console.log(chalk.yellow('⚠️ No tables found in the base'));
    } else {
      console.log(chalk.blue(`\nFound ${foundTables.length} tables in the base`));
    }
    
    return foundTables;
  } catch (error) {
    console.error(chalk.red('❌ Error listing tables:'), error.message);
    return [];
  }
}

async function main() {
  console.log(chalk.blue('🔍 Exploring Airtable schema...'));
  
  // List all tables
  const tables = await listTables();
  
  // Explore schema for each table
  for (const table of tables) {
    await exploreTableSchema(table.name);
  }
  
  console.log(chalk.blue('\n✅ Schema exploration completed!'));
}

main().catch(error => {
  console.error(chalk.red('❌ Unexpected error:'), error);
  process.exit(1);
});
