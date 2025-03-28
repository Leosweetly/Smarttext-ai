// Script to explore Airtable schema
require('dotenv').config({ path: '.env.local' });
const Airtable = require('airtable');

// Initialize Airtable with API key
const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(process.env.AIRTABLE_BASE_ID);

// Function to get all tables in the base
async function getTables() {
  try {
    // Airtable doesn't have a direct API to list tables, so we'll make a request to the base metadata
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${process.env.AIRTABLE_BASE_ID}/tables`, {
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_PAT}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tables: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.tables;
  } catch (error) {
    console.error('Error fetching tables:', error);
    return [];
  }
}

// Function to explore a specific table
async function exploreTable(tableName) {
  try {
    console.log(`\n=== Exploring table: ${tableName} ===`);
    
    // Get table schema
    const table = base(tableName);
    
    // Get records to understand the structure
    const records = await table.select({ maxRecords: 1 }).firstPage();
    
    if (records.length === 0) {
      console.log(`No records found in ${tableName}`);
      return;
    }
    
    // Get field names from the first record
    const record = records[0];
    const fields = Object.keys(record.fields);
    
    console.log('Fields:');
    fields.forEach(field => {
      const value = record.fields[field];
      const type = Array.isArray(value) ? 'Array' : typeof value;
      console.log(`- ${field} (${type}): ${JSON.stringify(value).substring(0, 50)}${JSON.stringify(value).length > 50 ? '...' : ''}`);
    });
    
    // Get total record count
    const allRecords = await table.select().all();
    console.log(`Total records: ${allRecords.length}`);
    
  } catch (error) {
    console.error(`Error exploring table ${tableName}:`, error);
  }
}

// Main function
async function main() {
  try {
    console.log('Exploring Airtable schema...');
    
    // Get all tables
    const tables = await getTables();
    
    if (tables.length === 0) {
      console.log('No tables found or unable to fetch tables.');
      
      // Try to access known tables from the code
      console.log('\nTrying to access known tables from the code...');
      await exploreTable('Restaurants');
      await exploreTable('AutoShops');
      
      return;
    }
    
    console.log(`Found ${tables.length} tables:`);
    for (const table of tables) {
      console.log(`- ${table.name}`);
      await exploreTable(table.name);
    }
    
  } catch (error) {
    console.error('Error exploring Airtable schema:', error);
  }
}

// Run the script
main();
