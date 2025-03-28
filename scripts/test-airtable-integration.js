#!/usr/bin/env node

/**
 * Airtable Integration Test Script
 * 
 * This script tests the Airtable integration by:
 * 1. Checking if the Airtable API key is configured
 * 2. Connecting to Airtable and fetching data from the specified base and table
 * 3. Displaying the fetched data
 * 
 * Usage:
 * node scripts/test-airtable-integration.js
 */

require('dotenv').config({ path: '.env.local' });
const Airtable = require('airtable');

// Configuration
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = 'Businesses'; // Change this to match your table name

async function testAirtableIntegration() {
  console.log('🔄 Testing Airtable Integration');
  console.log('------------------------------');
  
  // Check if Airtable API key is configured
  if (!AIRTABLE_PAT) {
    console.error('❌ Airtable API key is not configured');
    console.log('\nPlease set the AIRTABLE_PAT environment variable in your .env.local file:');
    console.log('AIRTABLE_PAT=your_airtable_api_key');
    return;
  }
  
  // Check if Airtable base ID is configured
  if (!AIRTABLE_BASE_ID) {
    console.error('❌ Airtable base ID is not configured');
    console.log('\nPlease set the AIRTABLE_BASE_ID environment variable in your .env.local file:');
    console.log('AIRTABLE_BASE_ID=your_airtable_base_id');
    return;
  }
  
  console.log('✅ Airtable API key and base ID are configured');
  
  try {
    // Initialize Airtable
    Airtable.configure({
      apiKey: AIRTABLE_PAT,
    });
    
    const base = Airtable.base(AIRTABLE_BASE_ID);
    
    console.log(`\n📊 Fetching records from "${AIRTABLE_TABLE_NAME}" table...`);
    
    // Fetch records from the table
    const records = await base(AIRTABLE_TABLE_NAME).select({
      maxRecords: 10,
      view: 'Grid view',
    }).firstPage();
    
    if (records.length === 0) {
      console.log(`\n⚠️ No records found in the "${AIRTABLE_TABLE_NAME}" table.`);
      return;
    }
    
    console.log(`\n✅ Successfully fetched ${records.length} records from Airtable`);
    
    // Display the fetched records
    console.log('\n📋 Records:');
    records.forEach((record, index) => {
      console.log(`\nRecord ${index + 1}:`);
      const fields = record.fields;
      Object.keys(fields).forEach(key => {
        console.log(`  ${key}: ${JSON.stringify(fields[key])}`);
      });
    });
    
    console.log('\n🎉 Airtable integration is working correctly!');
    
  } catch (error) {
    console.error('\n❌ Error testing Airtable integration:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\nThe API key you provided is invalid. Please check your Airtable API key.');
    } else if (error.message.includes('404')) {
      console.log('\nThe base ID or table name you provided is invalid. Please check your Airtable base ID and table name.');
    } else {
      console.log('\nPlease check your Airtable configuration and try again.');
    }
  }
}

testAirtableIntegration();
