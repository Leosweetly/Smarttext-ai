/**
 * Test script to verify Airtable credentials
 * 
 * This script tests the connection to Airtable using the credentials in the .env.local file
 */

import dotenv from 'dotenv';
import Airtable from 'airtable';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local
const envPath = resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

// Check if required environment variables are set
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
  console.error('❌ Airtable credentials not found in environment variables');
  process.exit(1);
}

console.log('🔑 Airtable credentials found in environment variables');
console.log(`AIRTABLE_PAT: ${AIRTABLE_PAT.substring(0, 10)}...`);
console.log(`AIRTABLE_BASE_ID: ${AIRTABLE_BASE_ID}`);

// Initialize Airtable base
const base = new Airtable({ apiKey: AIRTABLE_PAT }).base(AIRTABLE_BASE_ID);

async function testAirtableConnection() {
  try {
    console.log('\n🔍 Testing Airtable connection...');
    
    // Try to get the Businesses table
    const businessesTable = base('Businesses');
    
    // Try to get the first record
    const records = await businessesTable.select({ maxRecords: 1 }).firstPage();
    
    if (records.length === 0) {
      console.log('✅ Connected to Airtable successfully, but no records found in the Businesses table');
    } else {
      console.log(`✅ Connected to Airtable successfully! Found ${records.length} record(s) in the Businesses table`);
      console.log('\nSample record:');
      const record = records[0];
      console.log(`ID: ${record.id}`);
      console.log(`Name: ${record.get('Name')}`);
      
      // List all fields in the record
      console.log('\nAvailable fields:');
      Object.keys(record.fields).forEach(field => {
        console.log(`- ${field}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error connecting to Airtable:', error.message);
    if (error.message.includes('invalid api key')) {
      console.error('\n🔑 The Airtable PAT appears to be invalid or has insufficient permissions.');
      console.error('Please check that the PAT is correct and has the necessary scopes:');
      console.error('- data.records:read');
      console.error('- data.records:write');
      console.error('- schema.bases:read');
    }
    return false;
  }
}

// Run the test
testAirtableConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 Airtable credentials verification completed successfully!');
    } else {
      console.error('\n❌ Airtable credentials verification failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
