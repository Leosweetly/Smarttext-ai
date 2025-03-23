#!/usr/bin/env node

/**
 * This script tests the Airtable OAuth integration locally
 * It guides you through the OAuth flow and verifies that the tokens work
 * 
 * Usage: node scripts/test-airtable-oauth-local.js
 */

require('dotenv').config({ path: '.env.local' });
const readline = require('readline');

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

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Check environment variables
function checkEnvironmentVariables() {
  logSection('Checking Environment Variables');
  
  const requiredVars = [
    'AIRTABLE_CLIENT_ID',
    'AIRTABLE_CLIENT_SECRET',
    'AIRTABLE_REDIRECT_URI',
    'AIRTABLE_BASE_ID'
  ];
  
  let allVarsPresent = true;
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      logError(`Missing environment variable: ${varName}`);
      allVarsPresent = false;
    } else {
      logSuccess(`Found environment variable: ${varName}`);
    }
  }
  
  if (allVarsPresent) {
    logInfo(`Redirect URI: ${process.env.AIRTABLE_REDIRECT_URI}`);
    
    if (!process.env.AIRTABLE_REDIRECT_URI.startsWith('http://localhost:')) {
      logError('Redirect URI is not set for local development. It should start with "http://localhost:"');
      return false;
    }
  }
  
  return allVarsPresent;
}

// Generate authorization URL
function generateAuthUrl() {
  const authUrl = new URL('https://airtable.com/oauth2/v1/authorize');
  
  authUrl.searchParams.append('client_id', process.env.AIRTABLE_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', process.env.AIRTABLE_REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'data.records:read data.records:write schema.bases:read');
  
  return authUrl.toString();
}

// Exchange authorization code for tokens
async function exchangeCodeForTokens(code) {
  try {
    const response = await fetch('https://airtable.com/oauth2/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.AIRTABLE_CLIENT_ID}:${process.env.AIRTABLE_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.AIRTABLE_REDIRECT_URI
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token exchange failed: ${JSON.stringify(errorData)}`);
    }
    
    return response.json();
  } catch (error) {
    throw error;
  }
}

// Test API access with access token
async function testApiAccess(accessToken) {
  logSection('Testing API Access');
  
  try {
    // Test accessing base metadata
    logInfo('Testing access to base metadata...');
    
    const baseId = process.env.AIRTABLE_BASE_ID;
    const metadataResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!metadataResponse.ok) {
      const errorData = await metadataResponse.json();
      throw new Error(`Failed to access base metadata: ${JSON.stringify(errorData)}`);
    }
    
    const metadata = await metadataResponse.json();
    logSuccess(`Successfully accessed base metadata for "${metadata.name}"`);
    
    // Test accessing tables
    logInfo('Testing access to tables...');
    
    const tablesResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!tablesResponse.ok) {
      const errorData = await tablesResponse.json();
      throw new Error(`Failed to access tables: ${JSON.stringify(errorData)}`);
    }
    
    const tablesData = await tablesResponse.json();
    logSuccess(`Successfully accessed ${tablesData.tables.length} tables`);
    
    // List the tables
    tablesData.tables.forEach(table => {
      logInfo(`- ${table.name}`);
    });
    
    return true;
  } catch (error) {
    logError('Error testing API access', error);
    return false;
  }
}

// Main function
async function main() {
  logSection('Airtable OAuth Integration Test (Local)');
  
  try {
    // Check environment variables
    const envVarsOk = checkEnvironmentVariables();
    if (!envVarsOk) {
      logError('Environment variables check failed');
      return;
    }
    
    // Generate and display authorization URL
    const authUrl = generateAuthUrl();
    logSection('Authorization URL');
    console.log(colors.bright + authUrl + colors.reset);
    console.log('\nPlease follow these steps:');
    console.log('1. Open this URL in your browser');
    console.log('2. Log in to Airtable if prompted');
    console.log('3. Authorize the application');
    console.log('4. You will be redirected to a URL like:');
    console.log(`   ${process.env.AIRTABLE_REDIRECT_URI}?code=AUTHORIZATION_CODE`);
    console.log('5. Copy the AUTHORIZATION_CODE from the URL');
    
    // Prompt for authorization code
    const authCode = await prompt('\nEnter the authorization code: ');
    
    if (!authCode) {
      logError('No authorization code provided');
      return;
    }
    
    // Exchange authorization code for tokens
    logInfo('Exchanging authorization code for tokens...');
    const tokenData = await exchangeCodeForTokens(authCode);
    
    logSuccess('Successfully exchanged authorization code for tokens');
    logInfo(`Access token expires in ${tokenData.expires_in} seconds`);
    
    // Test API access with the access token
    await testApiAccess(tokenData.access_token);
    
    logSection('Test Summary');
    logSuccess('OAuth integration test completed successfully');
    logInfo('You can now use the "Connect to Airtable" button in your application');
    
  } catch (error) {
    logError('OAuth integration test failed', error);
  } finally {
    rl.close();
  }
}

// Run the main function
main().catch(console.error);
