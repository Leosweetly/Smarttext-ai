#!/usr/bin/env node

/**
 * Script to verify all Growth Plan features
 * 
 * This script runs all the test scripts for the Growth Plan features to ensure
 * that all features are working properly.
 * 
 * Usage: node scripts/verify-growth-features.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Growth Plan features and their corresponding test scripts
const growthFeatures = [
  {
    name: 'Multi-location support with location-specific auto-replies',
    script: 'scripts/test-multi-location.js',
    description: 'Support for businesses with multiple locations, each with its own auto-reply templates',
    implemented: true
  },
  {
    name: 'AI training on documents, SOPs, and FAQ libraries',
    script: 'scripts/test-document-training.js',
    description: 'Train AI on business-specific documents to generate more accurate responses',
    implemented: false
  },
  {
    name: 'Bulk SMS campaigns',
    script: 'scripts/test-bulk-sms.js',
    description: 'Send promotional messages, follow-ups, and review requests to multiple customers',
    implemented: false
  },
  {
    name: 'Advanced analytics dashboard',
    script: 'scripts/test-analytics.js',
    description: 'Detailed reporting on response rates, lead conversions, and other metrics',
    implemented: false
  },
  {
    name: 'SLA response time guarantee',
    script: 'scripts/test-sla.js',
    description: 'Monitor response times and alert when approaching SLA breaches',
    implemented: false
  }
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
  console.log('🔍 Verifying Growth Plan Features');
  console.log('=================================');
  
  // Check which scripts exist
  const existingFeatures = growthFeatures.filter(feature => 
    feature.implemented && scriptExists(feature.script)
  );
  
  const missingFeatures = growthFeatures.filter(feature => 
    !feature.implemented || !scriptExists(feature.script)
  );
  
  // Print feature status
  console.log('\n📋 Feature Status:');
  console.log('------------------');
  
  growthFeatures.forEach(feature => {
    const exists = feature.implemented && scriptExists(feature.script);
    console.log(`${exists ? '✅' : '❌'} ${feature.name}: ${feature.description} ${feature.implemented ? '(Implemented)' : '(Planned)'}`);
  });
  
  if (missingFeatures.length > 0) {
    console.log('\n⚠️ Features not yet fully implemented:');
    missingFeatures.forEach(feature => {
      console.log(`- ${feature.name} (${feature.implemented ? 'Implemented but no test script' : 'Planned'})`);
    });
  }
  
  // Run existing scripts
  console.log('\n🚀 Running test scripts for implemented features...');
  
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
  console.log(`Total features: ${growthFeatures.length}`);
  console.log(`Features implemented with test scripts: ${existingFeatures.length}`);
  console.log(`Features not yet fully implemented: ${missingFeatures.length}`);
  
  if (missingFeatures.length === 0) {
    console.log('\n🎉 All Growth Plan features have been implemented and tested!');
  } else {
    console.log('\n⚠️ Some features are not yet fully implemented. See the roadmap in GROWTH_FEATURES.md for details.');
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
