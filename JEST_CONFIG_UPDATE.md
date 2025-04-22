# Jest Configuration Update

This document explains the changes made to the Jest configuration to prevent it from trying to run Cypress tests.

## Problem

Jest was attempting to run Cypress tests, which was causing issues in the GitHub workflow. Cypress tests are meant to be run using the Cypress test runner, not Jest.

## Solution

We updated the Jest configuration in `jest.config.cjs` to ignore the Cypress directory:

```javascript
// Before
testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],

// After
testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/cypress/'],
```

This change ensures that Jest will not attempt to run any tests located in the Cypress directory.

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
