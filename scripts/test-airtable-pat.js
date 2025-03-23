#!/usr/bin/env node

/**
 * This script tests the Airtable connection using a personal access token
 * 
 * Usage: node scripts/test-airtable-pat.js
 */

require('dotenv').config({ path: '.env.local' });

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
  logSection('Airtable Personal Access Token Test');
  
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
    
    // Test accessing base metadata
    logInfo('Testing access to base metadata...');
    
    const metadataResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}`, {
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      throw new Error(`Failed to access base metadata: ${errorText}`);
    }
    
    const metadata = await metadataResponse.json();
    logSuccess(`Successfully accessed base metadata for "${metadata.name}"`);
    
    // Test accessing tables
    logInfo('Testing access to tables...');
    
    const tablesResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!tablesResponse.ok) {
      const errorText = await tablesResponse.text();
      throw new Error(`Failed to access tables: ${errorText}`);
    }
    
    const tablesData = await tablesResponse.json();
    logSuccess(`Successfully accessed ${tablesData.tables.length} tables`);
    
    // List the tables
    tablesData.tables.forEach(table => {
      logInfo(`- ${table.name}`);
    });
    
    // Test accessing records from a table
    if (tablesData.tables.length > 0) {
      const firstTable = tablesData.tables[0];
      logInfo(`Testing access to records in "${firstTable.name}" table...`);
      
      const recordsResponse = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(firstTable.name)}?maxRecords=10`, {
        headers: {
          'Authorization': `Bearer ${pat}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!recordsResponse.ok) {
        const errorText = await recordsResponse.text();
        throw new Error(`Failed to access records: ${errorText}`);
      }
      
      const recordsData = await recordsResponse.json();
      logSuccess(`Successfully accessed ${recordsData.records.length} records from "${firstTable.name}" table`);
    }
    
    logSection('Test Summary');
    logSuccess('Airtable Personal Access Token test completed successfully');
    
  } catch (error) {
    logError('Airtable Personal Access Token test failed', error);
  }
}

// Run the main function
main().catch(console.error);
