# Twilio Webhook Testing

This document provides information on how to test the Twilio webhook endpoint (`/api/new-message.ts`) that handles incoming SMS messages.

## Test Scripts

We have several test scripts available to verify the functionality of the webhook:

### Server-Based Tests (Requires Next.js Server)

1. **Comprehensive Test Script**: Runs all tests in sequence with detailed logging
   ```
   npm run test:new-message
   ```

2. **Individual Test Script**: Runs a single test case
   ```
   npm run test:new-message:single [test-number]
   ```

3. **Shell Script**: Runs all individual tests in sequence with a summary
   ```
   npm run test:new-message:all
   ```

### Direct Tests (No Server Required)

These tests bypass the Next.js server and call the handler function directly, which is more reliable when encountering server issues:

1. **Prepare for Direct Tests**: Transpiles the TypeScript handler to JavaScript
   ```
   npm run transpile:api-handler
   ```

2. **Direct Test Script**: Runs a single test case directly
   ```
   npm run test:new-message:direct [test-number]
   ```

3. **Direct Shell Script**: Runs all direct tests in sequence with a summary
   ```
   npm run test:new-message:all-direct
   ```

4. **Combined Prepare and Test**: Transpiles and runs a test in one command
   ```
   npm run test:new-message:prepare [test-number]
   ```

### Mock Tests (No Dependencies Required)

These tests use a mock implementation of the handler function, which is completely independent of the Next.js server, TypeScript, and external dependencies. This is the most reliable option when encountering system issues:

1. **Mock Test Script**: Runs a single test case with a mock implementation
   ```
   npm run test:new-message:mock [test-number]
   ```

2. **Mock Shell Script**: Runs all mock tests in sequence with a summary
   ```
   npm run test:new-message:all-mock
   ```

For all individual test scripts, `test-number` is:
- 1: FAQ Match
- 2: OpenAI Fallback
- 3: Bad FAQ Data
- 4: No Airtable Match
- 5: Auto-Reply Disabled

## Test Cases

The test scripts cover the following scenarios:

### 1. FAQ Match
- Simulates an incoming SMS that should match an FAQ
- Expects the response to come from FAQs
- Logs the response source (should be "faq")

### 2. OpenAI Fallback
- Simulates an incoming SMS with no FAQ match
- Expects OpenAI to generate the response
- Logs the response source (should be "openai")

### 3. Bad FAQ Data
- Simulates a case where the FAQs field is malformed JSON
- Expects OpenAI fallback to be triggered
- Ensures error handling is clean and logs are clear

### 4. No Airtable Match
- Uses a Twilio number not present in Airtable
- Expects a 404 response
- Ensures the server does not crash

### 5. Auto-Reply Disabled
- Simulates a business record with "Auto-Reply Enabled" set to false
- Expects no reply to be sent
- Logs "Auto-reply disabled"

## Environment Variables

- `DISABLE_OPENAI_FALLBACK=true|false`: Toggle OpenAI fallback during tests
- `AXIOS_TIMEOUT=5000`: Set the timeout for API requests (in milliseconds)

## Running Tests

1. Start the development server:
   ```
   npm run dev
   ```

2. In a separate terminal, run the tests:
   ```
   npm run test:new-message:all
   ```

## Expected Results

- When running tests, you may see Twilio SMS sending errors. This is expected in a test environment where the Twilio credentials are not configured or the phone numbers are not valid Twilio numbers.
- The test scripts are designed to handle these errors and still verify the core functionality of the webhook.
- In the test environment, FAQs might not match exactly as expected. The test scripts will log warnings but still pass the tests if the response source is valid.

## Troubleshooting

### Server-Based Test Issues

- If you encounter connection timeout errors, try increasing the `AXIOS_TIMEOUT` value.
- If the tests are failing, check the server logs for more details.
- Ensure the development server is running on the correct port (the test scripts default to port 3004).

### Next.js Server Issues

If you're experiencing issues with the Next.js server (500 errors, timeouts, etc.), try the following:

1. **Use Direct Tests**: The direct test scripts bypass the Next.js server entirely:
   ```
   npm run test:new-message:all-direct
   ```

2. **Use Mock Tests**: If direct tests also fail due to TypeScript or module loading issues, use the mock tests:
   ```
   npm run test:new-message:all-mock
   ```

3. **Rebuild Next.js**: If server-based tests are important, try rebuilding Next.js:
   ```
   rm -rf .next
   rm -rf node_modules
   npm install
   npm run dev
   ```

4. **Check for System Resource Issues**: Next.js can sometimes encounter issues with file system operations when system resources are constrained. Try:
   - Closing other applications
   - Restarting your computer
   - Checking for disk space issues

### Severe System Issues

If you're experiencing severe system issues and need to verify the webhook functionality without any dependencies:

1. **Use Mock Tests**: The mock tests use a simplified implementation that doesn't depend on any external modules:
   ```
   npm run test:new-message:all-mock
   ```

2. **Examine the Mock Implementation**: The mock implementation in `scripts/test-new-message-mock.js` provides a reference for how the webhook should behave.
