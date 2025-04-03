/**
 * Script to verify Cypress installation
 * This script can be used to check if Cypress is installed correctly
 * and to ensure that the environment variables are set up properly.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.blue}🔍 Verifying Cypress installation...${colors.reset}`);

// Check if Cypress binary exists
try {
  const cypressBinaryPath = execSync('npx cypress info').toString();
  console.log(`${colors.green}✅ Cypress binary found${colors.reset}`);
  console.log(cypressBinaryPath);
} catch (error) {
  console.error(`${colors.red}❌ Cypress binary not found${colors.reset}`);
  console.error(error.message);
  
  // Try to install Cypress
  console.log(`${colors.yellow}🔄 Attempting to install Cypress...${colors.reset}`);
  try {
    execSync('npx cypress install', { stdio: 'inherit' });
    console.log(`${colors.green}✅ Cypress installed successfully${colors.reset}`);
  } catch (installError) {
    console.error(`${colors.red}❌ Failed to install Cypress${colors.reset}`);
    console.error(installError.message);
    process.exit(1);
  }
}

// Check if Cypress config file exists
const configPath = path.join(process.cwd(), 'cypress.config.js');
if (fs.existsSync(configPath)) {
  console.log(`${colors.green}✅ Cypress config file found at ${configPath}${colors.reset}`);
} else {
  console.error(`${colors.red}❌ Cypress config file not found at ${configPath}${colors.reset}`);
  process.exit(1);
}

// Check if Cypress spec files exist
const e2ePath = path.join(process.cwd(), 'cypress', 'e2e');
if (fs.existsSync(e2ePath)) {
  const specFiles = fs.readdirSync(e2ePath).filter(file => file.endsWith('.spec.js') || file.endsWith('.cy.js'));
  if (specFiles.length > 0) {
    console.log(`${colors.green}✅ Found ${specFiles.length} Cypress spec files:${colors.reset}`);
    specFiles.forEach(file => console.log(`   - ${file}`));
  } else {
    console.warn(`${colors.yellow}⚠️ No Cypress spec files found in ${e2ePath}${colors.reset}`);
  }
} else {
  console.error(`${colors.red}❌ Cypress e2e directory not found at ${e2ePath}${colors.reset}`);
  process.exit(1);
}

// Check environment variables
console.log(`${colors.blue}🔍 Checking environment variables...${colors.reset}`);

const requiredEnvVars = [
  { name: 'AIRTABLE_PAT', value: process.env.AIRTABLE_PAT },
  { name: 'AIRTABLE_BASE_ID', value: process.env.AIRTABLE_BASE_ID }
];

let missingEnvVars = false;
requiredEnvVars.forEach(({ name, value }) => {
  if (!value) {
    console.warn(`${colors.yellow}⚠️ Environment variable ${name} is not set${colors.reset}`);
    missingEnvVars = true;
  } else {
    const maskedValue = value.substring(0, 4) + '...' + value.substring(value.length - 4);
    console.log(`${colors.green}✅ Environment variable ${name} is set: ${maskedValue}${colors.reset}`);
  }
});

if (missingEnvVars) {
  console.warn(`${colors.yellow}⚠️ Some environment variables are missing. API tests may fail.${colors.reset}`);
} else {
  console.log(`${colors.green}✅ All required environment variables are set${colors.reset}`);
}

// Try to verify Cypress
try {
  console.log(`${colors.blue}🔍 Verifying Cypress...${colors.reset}`);
  execSync('npx cypress verify', { stdio: 'inherit' });
  console.log(`${colors.green}✅ Cypress verification successful${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}❌ Cypress verification failed${colors.reset}`);
  console.error(error.message);
  process.exit(1);
}

console.log(`${colors.green}✅ Cypress installation verified successfully${colors.reset}`);
console.log(`${colors.blue}ℹ️ To run Cypress tests:${colors.reset}`);
console.log(`   - ${colors.cyan}npm run cypress${colors.reset} (opens Cypress UI)`);
console.log(`   - ${colors.cyan}npm run cypress:headless${colors.reset} (runs tests in headless mode)`);
console.log(`   - ${colors.cyan}npm run e2e${colors.reset} (starts dev server and opens Cypress UI)`);
console.log(`   - ${colors.cyan}npm run e2e:headless${colors.reset} (starts dev server and runs tests in headless mode)`);
