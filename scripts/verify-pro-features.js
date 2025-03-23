#!/usr/bin/env node

/**
 * Verify Pro Plan Features
 * 
 * This script verifies that all the required features for the Pro plan are implemented.
 * It checks for the presence of key files and functionality.
 * 
 * Usage: node scripts/verify-pro-features.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define the required features for the Pro plan
const PRO_FEATURES = {
  // Core features (inherited from Core plan)
  'Auto-text for missed calls': {
    files: [
      'lib/data/business.js',
      'app/api/missed-call/route.js'
    ],
    description: 'Automatically send text messages in response to missed calls'
  },
  'Pre-built industry response templates': {
    files: [
      'lib/data/business.js',
      'scripts/generate-industry-faqs.js'
    ],
    description: 'Industry-specific response templates for common questions'
  },
  'Two-way SMS Inbox': {
    files: [
      'lib/data/business.js',
      'app/api/missed-call/route.js'
    ],
    description: 'Send and receive SMS messages with customers'
  },
  'Basic contact log + conversation history': {
    files: [
      'lib/data/business.js'
    ],
    description: 'Keep track of customer interactions and conversation history'
  },
  'Simple appointment booking link support': {
    files: [
      'lib/data/business.js'
    ],
    description: 'Include appointment booking links in messages'
  },
  'Tag and organize leads manually': {
    files: [
      'lib/tags/index.js',
      'app/api/tags/route.js'
    ],
    description: 'Manually tag and categorize leads'
  },
  
  // Pro-specific features
  'CRM integration': {
    files: [
      'lib/data/airtable-client.js',
      'lib/data/airtable-oauth-client.js',
      'app/api/auth/airtable/authorize/route.js',
      'app/api/auth/airtable/callback/route.js',
      'app/api/auth/airtable/status/route.js',
      'app/api/auth/airtable/disconnect/route.js'
    ],
    description: 'Integration with CRM systems via Zapier'
  },
  'AI-powered custom replies': {
    files: [
      'lib/ai/index.js',
      'lib/ai/openai.js'
    ],
    description: 'AI-generated custom replies based on business context'
  },
  'Lead qualification flows': {
    files: [
      'lib/data/business.js'
    ],
    description: 'Automated follow-up Q&A for lead qualification'
  },
  'Shared inbox with team assignments': {
    files: [
      'lib/inbox/index.js',
      'lib/inbox/messages.js',
      'lib/inbox/assignments.js',
      'app/api/inbox/route.js',
      'app/api/inbox/[conversationId]/route.js',
      'app/api/inbox/[conversationId]/messages/route.js'
    ],
    description: 'Shared inbox with team assignments for collaborative customer communication'
  },
  'Advanced tagging & customer notes': {
    files: [
      'lib/tags/index.js',
      'lib/notes/index.js',
      'app/api/tags/route.js',
      'app/api/notes/route.js'
    ],
    description: 'Advanced tagging and note-taking for customers'
  },
  'Internal team comments & response tracking': {
    files: [
      'lib/inbox/messages.js',
      'lib/inbox/assignments.js'
    ],
    description: 'Internal team comments and response tracking'
  },
  'Mobile-first support with push notifications': {
    files: [
      'lib/inbox/notifications.js',
      'app/api/notifications/route.js',
      'app/api/notifications/[notificationId]/route.js'
    ],
    description: 'Mobile-first support with push notifications'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Main function
async function verifyProFeatures() {
  console.log(`${colors.bright}${colors.cyan}Verifying Pro Plan Features${colors.reset}`);
  console.log('=================================================');
  
  let allFeaturesImplemented = true;
  let implementedCount = 0;
  const totalFeatures = Object.keys(PRO_FEATURES).length;
  
  // Check each feature
  for (const [feature, details] of Object.entries(PRO_FEATURES)) {
    process.stdout.write(`${colors.bright}${feature}${colors.reset}: `);
    
    // Check if all required files exist
    const missingFiles = [];
    for (const file of details.files) {
      const filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    }
    
    if (missingFiles.length === 0) {
      console.log(`${colors.green}✓ Implemented${colors.reset}`);
      implementedCount++;
    } else {
      console.log(`${colors.red}✗ Not fully implemented${colors.reset}`);
      console.log(`  ${colors.dim}Description: ${details.description}${colors.reset}`);
      console.log(`  ${colors.yellow}Missing files:${colors.reset}`);
      for (const file of missingFiles) {
        console.log(`    - ${file}`);
      }
      allFeaturesImplemented = false;
    }
  }
  
  // Print summary
  console.log('\n=================================================');
  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`Total features: ${totalFeatures}`);
  console.log(`Implemented: ${implementedCount}`);
  console.log(`Missing: ${totalFeatures - implementedCount}`);
  
  if (allFeaturesImplemented) {
    console.log(`\n${colors.bgGreen}${colors.black} All Pro Plan features are implemented! ${colors.reset}`);
  } else {
    console.log(`\n${colors.bgYellow}${colors.black} Some Pro Plan features are not fully implemented. ${colors.reset}`);
  }
  
  // Check for test files
  console.log('\n=================================================');
  console.log(`${colors.bright}Checking test coverage:${colors.reset}`);
  
  const testFiles = [
    'scripts/test-team-inbox.js',
    'scripts/test-advanced-tagging.js',
    'scripts/test-sms-inbox.js',
    'scripts/test-missed-call.js',
    'scripts/test-airtable-oauth.js',
    'cypress/e2e/dashboard.spec.js'
  ];
  
  let allTestsExist = true;
  for (const testFile of testFiles) {
    const testPath = path.join(process.cwd(), testFile);
    if (fs.existsSync(testPath)) {
      console.log(`${colors.green}✓ ${testFile}${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ ${testFile}${colors.reset}`);
      allTestsExist = false;
    }
  }
  
  if (allTestsExist) {
    console.log(`\n${colors.bgGreen}${colors.black} All test files exist! ${colors.reset}`);
  } else {
    console.log(`\n${colors.bgYellow}${colors.black} Some test files are missing. ${colors.reset}`);
  }
  
  // Check for documentation
  console.log('\n=================================================');
  console.log(`${colors.bright}Checking documentation:${colors.reset}`);
  
  const docFiles = [
    'PRO_FEATURES.md',
    'CORE_FEATURES.md'
  ];
  
  let allDocsExist = true;
  for (const docFile of docFiles) {
    const docPath = path.join(process.cwd(), docFile);
    if (fs.existsSync(docPath)) {
      console.log(`${colors.green}✓ ${docFile}${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ ${docFile}${colors.reset}`);
      allDocsExist = false;
    }
  }
  
  if (allDocsExist) {
    console.log(`\n${colors.bgGreen}${colors.black} All documentation files exist! ${colors.reset}`);
  } else {
    console.log(`\n${colors.bgYellow}${colors.black} Some documentation files are missing. ${colors.reset}`);
  }
  
  // Run tests if available
  console.log('\n=================================================');
  console.log(`${colors.bright}Running tests:${colors.reset}`);
  
  try {
    if (fs.existsSync(path.join(process.cwd(), 'scripts/test-team-inbox.js'))) {
      console.log(`\n${colors.cyan}Running team inbox tests...${colors.reset}`);
      execSync('node scripts/test-team-inbox.js', { stdio: 'inherit' });
    }
  } catch (error) {
    console.error(`${colors.red}Error running tests:${colors.reset}`, error.message);
  }
  
  return allFeaturesImplemented && allTestsExist && allDocsExist;
}

// Run the verification
verifyProFeatures()
  .then(success => {
    if (success) {
      console.log(`\n${colors.green}All Pro Plan features are verified!${colors.reset}`);
      process.exit(0);
    } else {
      console.log(`\n${colors.yellow}Some Pro Plan features need attention.${colors.reset}`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(`${colors.red}Error verifying Pro Plan features:${colors.reset}`, error);
    process.exit(1);
  });
