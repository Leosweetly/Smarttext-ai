# Cypress Testing Guide

This document provides information on how to run Cypress tests locally and in CI, as well as how to handle issues with Cypress tests.

## Running Cypress Tests Locally

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

Cypress is already included as a dev dependency in the project. To install it, run:

```bash
npm install
```

This will install all dependencies, including Cypress.

### Running Tests

There are several ways to run Cypress tests:

1. **Open Cypress UI**:

```bash
npm run cypress
```

This will open the Cypress UI, where you can select which tests to run.

2. **Run Cypress tests in headless mode**:

```bash
npm run cypress:headless
```

This will run all Cypress tests in headless mode.

3. **Start the development server and open Cypress UI**:

```bash
npm run e2e
```

This will start the development server and then open the Cypress UI.

4. **Start the development server and run Cypress tests in headless mode**:

```bash
npm run e2e:headless
```

This will start the development server and then run all Cypress tests in headless mode.

### Verifying Cypress Installation

To verify that Cypress is installed correctly, run:

```bash
npm run verify:cypress
```

This will check if Cypress is installed correctly and if the environment variables are set up properly.

## Cypress Tests in CI

Cypress tests are run in CI as part of the GitHub Actions workflow. The workflow is defined in `.github/workflows/main.yml`.

### Skipping Cypress Tests in CI

If Cypress tests are blocking deployment, you can skip them by setting the `SKIP_CYPRESS` environment variable to `true` in the GitHub repository secrets.

To do this:

1. Go to the GitHub repository settings
2. Click on "Secrets and variables" > "Actions"
3. Click on "New repository secret"
4. Set the name to `SKIP_CYPRESS` and the value to `true`
5. Click on "Add secret"

This will skip Cypress tests in CI, allowing the workflow to proceed with deployment even if Cypress tests would otherwise fail.

### Airtable Credentials for API Tests

The API tests require Airtable credentials to run. These credentials are stored as GitHub repository secrets and are passed to the Cypress tests in CI.

To set up the Airtable credentials:

1. Go to the GitHub repository settings
2. Click on "Secrets and variables" > "Actions"
3. Click on "New repository secret"
4. Set the name to `AIRTABLE_PAT` and the value to your Airtable Personal Access Token
5. Click on "Add secret"
6. Repeat steps 3-5 for `AIRTABLE_BASE_ID`, setting the value to your Airtable Base ID

## Troubleshooting

### Cypress Installation Issues

If you encounter issues with Cypress installation, try the following:

1. Clear the Cypress cache:

```bash
npx cypress cache clear
```

2. Reinstall Cypress:

```bash
npm uninstall cypress
npm install cypress
```

3. Verify that Cypress is installed correctly:

```bash
npx cypress verify
```

### Cypress Test Failures

If Cypress tests are failing, check the following:

1. Make sure the development server is running:

```bash
npm run dev
```

2. Check if the tests are failing due to timing issues. If so, you can increase the timeout in the Cypress configuration:

```javascript
// cypress.config.js
module.exports = defineConfig({
  e2e: {
    // ...
    defaultCommandTimeout: 10000, // Increase timeout to 10 seconds
  },
});
```

3. Check if the tests are failing due to network issues. If so, you can retry the tests:

```javascript
// cypress.config.js
module.exports = defineConfig({
  e2e: {
    // ...
    retries: {
      runMode: 2, // Retry failed tests up to 2 times in run mode
      openMode: 0, // Do not retry in open mode
    },
  },
});
```

### API Test Failures

If API tests are failing, check the following:

1. Make sure the Airtable credentials are set correctly in the environment variables:

```bash
export AIRTABLE_PAT=your_personal_access_token
export AIRTABLE_BASE_ID=your_base_id
```

2. Check if the API endpoints are working correctly:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"name":"Test Business","industry":"Technology","size":"Small","website":"https://example.com"}' http://localhost:3000/api/update-business-info
```

3. Check if the Airtable API is working correctly:

```bash
curl -X GET -H "Authorization: Bearer $AIRTABLE_PAT" https://api.airtable.com/v0/$AIRTABLE_BASE_ID/Businesses
```

## Adding New Tests

To add a new test, create a new file in the `cypress/e2e` directory with a `.spec.js` extension. For example:

```javascript
// cypress/e2e/new-feature.spec.js
describe('New Feature', () => {
  it('should work correctly', () => {
    cy.visit('/new-feature');
    cy.get('h1').should('contain', 'New Feature');
  });
});
```

## Best Practices

- Keep tests independent of each other
- Use meaningful test names
- Use data attributes for selectors
- Use custom commands for common actions
- Use fixtures for test data
- Use environment variables for configuration
- Use the Cypress API for assertions
- Use the Cypress API for network requests
- Use the Cypress API for waiting
- Use the Cypress API for debugging
