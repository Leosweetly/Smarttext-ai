# SmartText AI Testing Guide

This document provides an overview of the testing infrastructure for SmartText AI and instructions on how to run tests.

## Testing Infrastructure

SmartText AI uses a comprehensive testing approach with multiple testing frameworks:

1. **Cypress** - For end-to-end testing of the application
2. **Jest** - For unit testing of individual components and functions

## Test Coverage

The test suite covers the following areas:

### Main Application Pages
- Home page
- Pricing page
- Login page
- Signup page

### Dashboard Functionality
- Dashboard overview
- User information display
- Navigation and routing
- Business metrics

### Subscription Management
- Current subscription details
- Plan upgrade options
- Cancellation flow
- Billing history

### Settings Page
- User profile management
- Airtable integration
- Notification preferences
- Security settings
- Account management

### Industry-Specific Pages
- Restaurant industry page
- Auto shop industry page

## Running Tests

### Using the Test Runner Script

We've created a convenient test runner script that provides a menu-based interface for running different test suites:

```bash
# Run the test script
./scripts/run-tests.js
```

This will display a menu with options to run specific test suites or all tests.

### Running Cypress Tests Directly

To run Cypress tests directly:

```bash
# Run all Cypress tests in headless mode
npm run cypress:headless

# Open Cypress Test Runner UI
npm run cypress

# Run tests with development server
npm run e2e

# Run tests with development server in headless mode
npm run e2e:headless
```

For more detailed information on running Cypress tests locally and in CI, see the [Cypress Testing Guide](CYPRESS_TESTING.md).

### Running Jest Tests

To run Jest unit tests:

```bash
# Run all Jest tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## Test Configuration

### Cypress Configuration

Cypress is configured in `cypress.config.js`. Key settings include:

- Base URL: `http://localhost:3000`
- Viewport size: 1280x720
- Screenshots on failure: Enabled
- Video recording: Disabled

### Jest Configuration

Jest is configured in `jest.config.js`. Key settings include:

- Test environment: jsdom
- Coverage collection
- Module name mapping for CSS and image files

## Adding New Tests

### Adding Cypress Tests

1. Create a new test file in the `cypress/e2e/` directory with a `.spec.js` extension
2. Follow the existing test patterns for consistency
3. Use the custom commands defined in `cypress/support/commands.js` where appropriate

### Adding Jest Tests

1. Create a new test file alongside the component or function you're testing with a `.test.js` extension
2. Follow the existing test patterns for consistency
3. Use Jest's mocking capabilities for external dependencies

## Continuous Integration

Tests are automatically run in the CI pipeline on:
- Pull requests to the main branch
- Pushes to the main branch

### Skipping Cypress Tests in CI

If Cypress tests are blocking deployment, you can skip them by setting the `SKIP_CYPRESS` environment variable to `true` in the GitHub repository secrets. This is useful when you need to deploy changes quickly and the Cypress tests are failing due to issues that are not critical for the deployment.

For more information on how to skip Cypress tests in CI, see the [Cypress Testing Guide](CYPRESS_TESTING.md).

## Accessibility Testing

Accessibility testing is included in the Cypress tests using the `cypress-axe` plugin. This checks for common accessibility issues according to WCAG guidelines.

## Best Practices

1. Write tests that are independent and can run in any order
2. Avoid testing implementation details; focus on behavior
3. Use meaningful assertions that clearly indicate what's being tested
4. Keep tests fast and focused
5. Use mocks and stubs appropriately to isolate the code being tested
6. Test edge cases and error conditions, not just the happy path

## Troubleshooting

### Common Issues

1. **Tests failing due to timing issues**
   - Use Cypress's built-in retry and wait mechanisms
   - Avoid arbitrary timeouts

2. **Tests failing in CI but passing locally**
   - Ensure tests don't depend on specific environment variables
   - Check for race conditions or timing issues

3. **Flaky tests**
   - Identify and fix tests that sometimes pass and sometimes fail
   - Look for dependencies between tests

For more help, contact the development team.
