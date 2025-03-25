# Onboarding API Test Suite

A comprehensive test suite for the onboarding API endpoints. This test suite is designed to work with both the mock and production API environments.

## Features

- Configurable environment (mock or production)
- Comprehensive test coverage for all API endpoints
- Authentication testing
- Edge case testing
- Detailed reporting
- Performance monitoring

## Test Coverage

The test suite covers the following API endpoints:

- **GET /api/onboarding** - Retrieve onboarding data
- **POST /api/onboarding** - Update onboarding data
- **POST /api/onboarding/reset** - Reset onboarding data

## Test Categories

- **Authentication Tests** - Test authentication scenarios
- **GET Endpoint Tests** - Test retrieving onboarding data
- **POST Endpoint Tests** - Test updating onboarding data
- **Reset Endpoint Tests** - Test resetting onboarding data
- **Edge Case Tests** - Test edge cases like large data, special characters, etc.

## Installation

The test suite is included in the main project. To install dependencies:

```bash
cd scripts/test-onboarding-api
npm install
```

## Usage

### Running the Test Suite

You can run the test suite using the wrapper script:

```bash
node scripts/test-onboarding-api.mjs
```

Or directly:

```bash
cd scripts/test-onboarding-api
node index.mjs
```

### Command Line Options

- `--env=<environment>` - Specify the environment to test (mock or production)
- `--tests=<test1,test2,...>` - Specify which tests to run (auth, get, post, reset, edge-cases)
- `--verbose` - Enable verbose logging

### Examples

```bash
# Run all tests against the mock API
node scripts/test-onboarding-api.mjs

# Run all tests against the production API
node scripts/test-onboarding-api.mjs --env=production

# Run only authentication tests
node scripts/test-onboarding-api.mjs --tests=auth

# Run GET and POST tests with verbose logging
node scripts/test-onboarding-api.mjs --tests=get,post --verbose
```

### Using npm Scripts

You can also use the npm scripts defined in the package.json:

```bash
cd scripts/test-onboarding-api

# Run all tests
npm test

# Run tests against the mock API
npm run test:mock

# Run tests against the production API
npm run test:prod

# Run specific test categories
npm run test:auth
npm run test:get
npm run test:post
npm run test:reset
npm run test:edge

# Run with verbose logging
npm run test:verbose
```

## Test Results

The test suite will output detailed results for each test, including:

- Test status (PASS/FAIL)
- Response status codes
- Response data
- Validation errors
- Performance metrics

At the end, a summary will be displayed showing the overall test results.

## Environment Variables

- `AUTH0_TEST_TOKEN` - Authentication token for testing (set in .env.local)
- `NEXT_PUBLIC_API_URL` - API base URL (defaults to http://localhost:3000)
- `JWT_TEST_SECRET` - Secret key for signing JWT tokens (only for testing)

## Adding New Tests

To add new tests:

1. Create a new test file in the `tests` directory
2. Import the necessary utilities from the `utils` directory
3. Define your test functions
4. Export a main function that runs the tests
5. Update the `index.mjs` file to include your new tests

## Troubleshooting

If you encounter issues:

1. Check that the API server is running
2. Verify that the API base URL is correct
3. Ensure that authentication tokens are valid
4. Check for any error messages in the test output
5. Try running with the `--verbose` flag for more detailed logs

## License

This test suite is part of the main project and is subject to the same license.
