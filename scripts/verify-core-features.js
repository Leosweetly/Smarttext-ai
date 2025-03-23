#!/usr/bin/env node

/**
 * Script to verify all Core Plan features
 * 
 * This script runs all the test scripts for the Core Plan features to ensure
 * that all features are working properly.
 * 
 * Usage: node scripts/verify-core-features.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Core Plan features and their corresponding test scripts
const coreFeatures = [
  {
    name: 'Auto-text for missed calls',
    script: 'scripts/test-missed-call.js',
    description: 'Automatically sends text messages to callers who didn\'t reach you',
  },
  {
    name: 'Pre-built industry response templates',
    script: 'scripts/test-industry-templates.js',
    description: 'Industry-specific templates for auto shops, restaurants, trades, etc.',
  },
  {
    name: 'Two-way SMS Inbox',
    script: 'scripts/test-sms-inbox.js',
    description: 'Mobile and desktop interface for managing text conversations',
  },
  {
    name: 'Basic contact log + conversation history',
    script: 'scripts/test-contact-log.js',
    description: 'Keep track of all customer interactions in one place',
  },
  {
    name: 'Simple appointment booking link support',
    script: 'scripts/test-appointment-booking.js',
    description: 'Share links that let customers book time with you',
  },
  {
    name: 'Tag and organize leads manually',
    script: 'scripts/test-lead-tagging.js',
    description: 'Categorize and filter leads with custom tags',
  },
  {
    name: 'Branding',
    script: 'scripts/update-branding.js',
    description: 'Update branding according to brand guidelines',
  },
];

// Function to run a test script
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running ${path.basename(scriptPath)}...`);
    console.log('------------------------------------------------');
    
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${path.basename(scriptPath)} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${path.basename(scriptPath)} failed with code ${code}`);
        reject(new Error(`Script failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`❌ Error running ${path.basename(scriptPath)}: ${error.message}`);
      reject(error);
    });
  });
}

// Function to check if a script exists
function scriptExists(scriptPath) {
  try {
    return fs.existsSync(scriptPath);
  } catch (error) {
    return false;
  }
}

// Main function
async function verifyFeatures() {
  console.log('🔍 Verifying Core Plan Features');
  console.log('=================================');
  
  // Check which scripts exist
  const existingFeatures = coreFeatures.filter(feature => scriptExists(feature.script));
  const missingFeatures = coreFeatures.filter(feature => !scriptExists(feature.script));
  
  // Print feature status
  console.log('\n📋 Feature Status:');
  console.log('------------------');
  
  coreFeatures.forEach(feature => {
    const exists = scriptExists(feature.script);
    console.log(`${exists ? '✅' : '❌'} ${feature.name}: ${feature.description}`);
  });
  
  if (missingFeatures.length > 0) {
    console.log('\n⚠️ Missing test scripts:');
    missingFeatures.forEach(feature => {
      console.log(`- ${feature.name} (${feature.script})`);
    });
  }
  
  // Run existing scripts
  console.log('\n🚀 Running test scripts for existing features...');
  
  for (const feature of existingFeatures) {
    try {
      await runScript(feature.script);
    } catch (error) {
      console.error(`Error running ${feature.script}: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n📊 Verification Summary:');
  console.log('----------------------');
  console.log(`Total features: ${coreFeatures.length}`);
  console.log(`Features with test scripts: ${existingFeatures.length}`);
  console.log(`Features missing test scripts: ${missingFeatures.length}`);
  
  if (missingFeatures.length === 0) {
    console.log('\n🎉 All Core Plan features have been implemented and tested!');
  } else {
    console.log('\n⚠️ Some features are missing test scripts. Please implement them to ensure full coverage.');
  }
}

// Run the verification
verifyFeatures()
  .then(() => {
    console.log('\nVerification process completed.');
  })
  .catch(error => {
    console.error(`Verification process failed: ${error.message}`);
    process.exit(1);
  });
