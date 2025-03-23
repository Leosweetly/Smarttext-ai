#!/usr/bin/env node

/**
 * This script tests the Airtable connection using the Airtable npm package
 * 
 * Usage: node scripts/test-airtable-npm.js
 */

require('dotenv').config({ path: '.env.local' });
const Airtable = require('airtable');

// Simple color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to log section headers
function logSection(title) {
  console.log('\n' + colors.bright + colors.cyan + '='.repeat(50) + colors.reset);
  console.log(` ${title} `);
  console.log(colors.bright + colors.cyan + '='.repeat(50) + colors.reset + '\n');
}

// Helper function to log success messages
function logSuccess(message) {
  console.log(colors.green + '✓ ' + colors.reset + message);
}

// Helper function to log error messages
function logError(message, error) {
  console.log(colors.red + '✗ ' + colors.reset + message);
  if (error) {
    console.error('  Error details:', error.message || error);
  }
}

// Helper function to log info messages
function logInfo(message) {
  console.log(colors.yellow + 'ℹ ' + colors.reset + message);
}

// Main function
async function main() {
  logSection('Airtable NPM Package Test');
  
  try {
    // Check if PAT is set
    const pat = 'pat6hauTSa1JXlhIp'; // The PAT from the task
    const baseId = process.env.AIRTABLE_BASE_ID || 'appl19GgA8hdPkUR0'; // The BaseID from the task
    
    if (!pat) {
      logError('Personal Access Token not found');
      return;
    }
    
    if (!baseId) {
      logError('Base ID not found');
      return;
    }
    
    logSuccess('Using Personal Access Token');
    logInfo(`Base ID: ${baseId}`);
    
    // Configure Airtable
    Airtable.configure({
      apiKey: pat
    });
    
    // Get the base
    const base = Airtable.base(baseId);
    
    // List tables
    logInfo('Listing tables...');
    
    // Since Airtable doesn't have a direct API to list tables,
    // we'll try to access a known table or create a test record
    
    // Try to access a table called 'Businesses' (common in the app)
    try {
      const records = await base('Businesses').select({
        maxRecords: 10,
        view: 'Grid view'
      }).firstPage();
      
      logSuccess(`Successfully accessed 'Businesses' table with ${records.length} records`);
      
      // List the records
      records.forEach(record => {
        logInfo(`- Record ID: ${record.id}`);
        const fields = record.fields;
        Object.keys(fields).forEach(key => {
          console.log(`  ${key}: ${fields[key]}`);
        });
      });
    } catch (error) {
      logError('Failed to access Businesses table', error);
      
      // Try to access a table called 'Table 1' (default in new bases)
      try {
        const records = await base('Table 1').select({
          maxRecords: 10,
          view: 'Grid view'
        }).firstPage();
        
        logSuccess(`Successfully accessed 'Table 1' with ${records.length} records`);
        
        // List the records
        records.forEach(record => {
          logInfo(`- Record ID: ${record.id}`);
          const fields = record.fields;
          Object.keys(fields).forEach(key => {
            console.log(`  ${key}: ${fields[key]}`);
          });
        });
      } catch (tableError) {
        logError('Failed to access Table 1', tableError);
      }
    }
    
    logSection('Test Summary');
    logSuccess('Airtable NPM Package test completed');
    
  } catch (error) {
    logError('Airtable NPM Package test failed', error);
  }
}

// Run the main function
main().catch(console.error);
