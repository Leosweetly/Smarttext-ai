# GitHub Workflow Fix: Phase 1

This document provides instructions for implementing Phase 1 of the Airtable to Supabase migration plan, which focuses on unblocking the GitHub workflow.

## Step 1: Add Dummy Environment Variables in GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Add the following repository secrets:

   | Name | Value |
   |------|-------|
   | `AIRTABLE_PAT` | `dummy_pat_value` |
   | `AIRTABLE_BASE_ID` | `dummy_base_id` |
   | `SKIP_CYPRESS` | `true` |

## Step 2: Fix ESLint Configuration

The GitHub workflow is failing during the ESLint step. We've fixed this by adding a proper ESLint configuration file:

1. Created a `.eslintrc.json` file in the root directory with the following content:
   ```json
   {
     "extends": ["next/core-web-vitals"]
   }
   ```

2. This configuration uses the Next.js ESLint plugin that's already installed as a dev dependency in your project.

## Step 3: Update Jest Configuration

We've made three important changes to the Jest configuration to fix issues in the GitHub workflow:

1. **Ignore Cypress Directory**:
   Updated `jest.config.cjs` to ignore the Cypress directory:
   ```javascript
   // Before
   testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],

   // After
   testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/cypress/'],
   ```
   This ensures that Jest will not attempt to run any tests located in the Cypress directory.

2. **Handle Missing Setup File**:
   Modified the Jest configuration to check if the setup file exists before including it:
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
   This ensures that the Jest configuration will work in both local and GitHub Actions environments, even if the setup file is missing.

3. **Create Manual Mock for Supabase**:
   - Created a directory structure: `__mocks__/lib/`
   - Added a mock implementation in `__mocks__/lib/supabase.js`:
   ```javascript
   module.exports = {
     getBusinessByPhoneNumberSupabase: jest.fn().mockResolvedValue(null),
     // Add other Supabase functions as needed
   };
   ```
   - Updated the Jest configuration to include the `__mocks__` directory:
   ```javascript
   moduleDirectories: ['node_modules', '__mocks__'],
   ```
   This ensures that even if the actual Supabase module doesn't exist in the GitHub Actions environment, Jest will still be able to find the mock implementation.

## Step 4: Verify GitHub Workflow Configuration

Your `.github/workflows/main.yml` is already set up to use these environment variables:

```yaml
env:
  # Set SKIP_CYPRESS to 'true' in GitHub secrets to bypass Cypress tests
  SKIP_CYPRESS: ${{ secrets.SKIP_CYPRESS || 'false' }}
  # Airtable credentials for API tests
  AIRTABLE_PAT: ${{ secrets.AIRTABLE_PAT }}
  AIRTABLE_BASE_ID: ${{ secrets.AIRTABLE_BASE_ID }}
```

And it has the conditional logic to skip Cypress tests:

```yaml
- name: Run Cypress tests
  if: env.SKIP_CYPRESS == 'false'
  run: |
    # Ensure Cypress is properly installed
    npx cypress install
    # Run the tests
    npm run e2e:headless || {
      echo "::warning::Cypress tests failed, but we'll continue with deployment"
      # Set SKIP_CYPRESS to true for future steps
      echo "SKIP_CYPRESS=true" >> $GITHUB_ENV
    }
```

## Step 5: Trigger the Workflow

After adding the secrets, trigger a new workflow run with an empty commit:

```bash
git commit --allow-empty -m "Trigger CI with dummy Airtable credentials"
git push
```

## Step 6: Monitor the Workflow Run

1. Go to the "Actions" tab in your GitHub repository
2. Watch the latest workflow run
3. Verify that:
   - The workflow completes successfully
   - The Cypress tests are skipped (you should see a message like "Cypress tests were skipped because SKIP_CYPRESS is set to 'true'")
   - The Jest tests run without Airtable-related errors

## What This Accomplishes

This quick fix will:
1. Allow your CI pipeline to run without failing due to missing Airtable credentials
2. Skip the Cypress tests that might be failing due to Airtable dependencies
3. Provide a temporary solution while we implement the more comprehensive changes

## Next Steps

Once this is working, we'll move on to Phase 2: updating the tests to handle the absence of Airtable credentials gracefully. This will involve:

1. Updating Jest tests to conditionally skip Airtable-dependent tests
2. Modifying Cypress tests to check for Airtable credentials before running
3. Adding proper reference headers to any Cypress test files missing them
