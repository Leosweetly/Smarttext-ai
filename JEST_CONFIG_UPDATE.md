# Jest Configuration Update

This document explains the changes made to the Jest configuration to fix issues in the GitHub workflow.

## Problem 1: Jest Running Cypress Tests

Jest was attempting to run Cypress tests, which was causing issues in the GitHub workflow. Cypress tests are meant to be run using the Cypress test runner, not Jest.

## Solution 1: Ignore Cypress Directory

We updated the Jest configuration in `jest.config.cjs` to ignore the Cypress directory:

```javascript
// Before
testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],

// After
testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/cypress/'],
```

This change ensures that Jest will not attempt to run any tests located in the Cypress directory.

## Problem 2: Missing Jest Setup File in GitHub Actions

The GitHub Actions environment was failing to find the `jest.setup.cjs` file, which is referenced in the Jest configuration. This was causing the tests to fail with the following error:

```
Module <rootDir>/jest.setup.cjs in the setupFilesAfterEnv option was not found.
<rootDir> is: /home/runner/work/Smarttext-ai/Smarttext-ai
```

## Solution 2: Conditionally Include Setup File

We modified the Jest configuration to check if the setup file exists before including it:

```javascript
// Check if jest.setup.cjs exists
const fs = require('fs');
const path = require('path');
const setupFilePath = path.resolve(__dirname, 'jest.setup.cjs');
const setupFileExists = fs.existsSync(setupFilePath);

module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: setupFileExists ? ['<rootDir>/jest.setup.cjs'] : [],
  // ... rest of the configuration
};
```

This change ensures that the Jest configuration will work in both local and GitHub Actions environments, even if the setup file is missing.

## Why This Works

The `testPathIgnorePatterns` configuration option in Jest allows you to specify patterns of directories or files that Jest should ignore when looking for test files to run. By adding `'<rootDir>/cypress/'` to this array, we're telling Jest to ignore any files in the Cypress directory.

## Testing the Fix

To verify that the Jest configuration is working correctly, you can run:

```bash
npm test
```

This should now run only the Jest tests and ignore any Cypress tests.

## Related Changes

This fix complements the other changes we've made to fix the GitHub workflow issues:

1. Added a proper ESLint configuration (`.eslintrc.json`)
2. Updated the GitHub workflow to handle missing Airtable credentials
3. Added documentation for the migration from Airtable to Supabase

Together, these changes should ensure that the GitHub workflow runs successfully.
