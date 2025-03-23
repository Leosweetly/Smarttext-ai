#!/usr/bin/env node

/**
 * Test runner script for SmartText AI
 * This script provides a convenient way to run different types of tests
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for better readability
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

// Test categories
const testCategories = [
  {
    id: 1,
    name: 'All Cypress Tests',
    command: 'npx cypress run',
    description: 'Run all Cypress end-to-end tests in headless mode'
  },
  {
    id: 2,
    name: 'Cypress UI Tests',
    command: 'npx cypress open',
    description: 'Open Cypress Test Runner UI'
  },
  {
    id: 3,
    name: 'Main Pages Tests',
    command: 'npx cypress run --spec "cypress/e2e/home.spec.js,cypress/e2e/pricing.spec.js,cypress/e2e/login.spec.js,cypress/e2e/signup.spec.js"',
    description: 'Run tests for main application pages'
  },
  {
    id: 4,
    name: 'Dashboard Tests',
    command: 'npx cypress run --spec "cypress/e2e/dashboard.spec.js"',
    description: 'Run tests for dashboard functionality'
  },
  {
    id: 5,
    name: 'Subscription Tests',
    command: 'npx cypress run --spec "cypress/e2e/subscription.spec.js"',
    description: 'Run tests for subscription management'
  },
  {
    id: 6,
    name: 'Settings Tests',
    command: 'npx cypress run --spec "cypress/e2e/settings.spec.js"',
    description: 'Run tests for settings page'
  },
  {
    id: 7,
    name: 'Industry Pages Tests',
    command: 'npx cypress run --spec "cypress/e2e/industry-pages.spec.js"',
    description: 'Run tests for industry-specific pages'
  },
  {
    id: 8,
    name: 'Jest Unit Tests',
    command: 'npm test',
    description: 'Run Jest unit tests'
  },
  {
    id: 9,
    name: 'Start Dev Server',
    command: 'npm run dev',
    description: 'Start the development server (required for Cypress tests)'
  }
];

// Display the menu
function displayMenu() {
  console.log(`\n${colors.bright}${colors.cyan}=== SmartText AI Test Runner ===${colors.reset}\n`);
  console.log(`${colors.yellow}Choose a test category to run:${colors.reset}\n`);
  
  testCategories.forEach(category => {
    console.log(`${colors.green}${category.id}${colors.reset}. ${colors.bright}${category.name}${colors.reset}`);
    console.log(`   ${colors.dim}${category.description}${colors.reset}\n`);
  });
  
  console.log(`${colors.red}0${colors.reset}. Exit\n`);
}

// Run the selected test
function runTest(categoryId) {
  const category = testCategories.find(cat => cat.id === categoryId);
  
  if (!category) {
    console.log(`${colors.red}Invalid selection. Please try again.${colors.reset}`);
    return promptUser();
  }
  
  console.log(`\n${colors.yellow}Running: ${colors.bright}${category.name}${colors.reset}\n`);
  console.log(`${colors.dim}Command: ${category.command}${colors.reset}\n`);
  
  try {
    execSync(category.command, { stdio: 'inherit' });
    console.log(`\n${colors.green}✓ Tests completed successfully!${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}✗ Tests failed with error:${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}`);
  }
  
  promptUser();
}

// Prompt the user for input
function promptUser() {
  rl.question(`${colors.yellow}Enter your choice (0-${testCategories.length}): ${colors.reset}`, (answer) => {
    const choice = parseInt(answer.trim(), 10);
    
    if (choice === 0) {
      console.log(`\n${colors.green}Exiting test runner. Goodbye!${colors.reset}\n`);
      rl.close();
      return;
    }
    
    if (isNaN(choice) || choice < 0 || choice > testCategories.length) {
      console.log(`${colors.red}Invalid input. Please enter a number between 0 and ${testCategories.length}.${colors.reset}`);
      return promptUser();
    }
    
    runTest(choice);
  });
}

// Start the application
function start() {
  console.log(`${colors.bright}${colors.blue}
  ┌─────────────────────────────────────┐
  │                                     │
  │       SmartText AI Test Suite       │
  │                                     │
  └─────────────────────────────────────┘
  ${colors.reset}`);
  
  console.log(`${colors.yellow}This script helps you run different test suites for SmartText AI.${colors.reset}`);
  console.log(`${colors.yellow}Make sure you have the development server running before running Cypress tests.${colors.reset}`);
  
  displayMenu();
  promptUser();
}

// Handle script termination
process.on('SIGINT', () => {
  console.log(`\n${colors.red}Test runner interrupted.${colors.reset}`);
  rl.close();
  process.exit(0);
});

// Start the application
start();
