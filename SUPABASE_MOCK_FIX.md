# Supabase Mock Fix

This document explains the changes made to fix the issue with the Jest tests failing to find the `lib/supabase` module in the GitHub Actions environment.

## Problem

The Jest tests were failing with the following error:

```
Cannot find module '../../lib/supabase' from '__tests__/api/new-message.test.js'
```

This was happening because the test file was trying to mock the Supabase module, but it couldn't find it in the GitHub Actions environment.

## Solution

We implemented a two-part solution:

1. **Created a manual mock for the Supabase module**:
   - Created a directory structure: `__mocks__/lib/`
   - Added a mock implementation in `__mocks__/lib/supabase.js`:
   ```javascript
   module.exports = {
     getBusinessByPhoneNumberSupabase: jest.fn().mockResolvedValue(null),
     // Add other Supabase functions as needed
   };
   ```

2. **Updated the Jest configuration**:
   - Modified `jest.config.cjs` to include the `__mocks__` directory in the module directories:
   ```javascript
   moduleDirectories: ['node_modules', '__mocks__'],
   ```

## Why This Works

Jest has a feature called "manual mocks" that allows you to define mock implementations for modules. When a test tries to import a module, Jest will first check if there's a manual mock available in the `__mocks__` directory. If it finds one, it will use that instead of the actual module.

By adding the `__mocks__` directory to the `moduleDirectories` array in the Jest configuration, we're telling Jest to look for modules in that directory as well. This ensures that even if the actual Supabase module doesn't exist in the GitHub Actions environment, Jest will still be able to find the mock implementation.

## Testing the Fix

To verify that the fix works, you can run:

```bash
npm test
```

This should now run the Jest tests without any errors related to the missing Supabase module.

## Related Changes

This fix complements the other changes we've made to fix the GitHub workflow issues:

1. Added a proper ESLint configuration (`.eslintrc.json`)
2. Updated the Jest configuration to ignore the Cypress directory
3. Added conditional loading of the setup file to handle missing `jest.setup.cjs` in GitHub Actions
4. Added documentation for the migration from Airtable to Supabase

Together, these changes should ensure that the GitHub workflow runs successfully.
