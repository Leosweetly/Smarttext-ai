# Twilio Testing Guide

This document provides instructions for testing Twilio webhook functionality in the SmartText AI platform.

## Automated Test Scripts

We've implemented automated test scripts to simulate Twilio webhooks for both voice calls and SMS messages. These scripts can be run against both local development and production environments.

### Prerequisites

- Node.js installed
- Project dependencies installed (`npm install`)
- `.env.local` file with proper Twilio credentials

### Testing Incoming Calls

To simulate an incoming call webhook:

```bash
# Test against local development server
npm run test:twilio:call
# or directly:
node scripts/test-incoming-call.js

# Test against production
TARGET=prod npm run test:twilio:call
# or directly:
TARGET=prod node scripts/test-incoming-call.js

# Test with a specific business phone number
node scripts/test-incoming-call.js +18186518560

# Test with a specific caller number
CALLER=+15551234567 node scripts/test-incoming-call.js
```

### Testing Incoming SMS

To simulate an incoming SMS webhook:

```bash
# Test against local development server
npm run test:twilio:sms
# or directly:
node scripts/test-incoming-sms.js

# Test against production
TARGET=prod npm run test:twilio:sms
# or directly:
TARGET=prod node scripts/test-incoming-sms.js

# Test with a specific business phone number
node scripts/test-incoming-sms.js +18186518560

# Test with a specific sender number
SENDER=+15551234567 node scripts/test-incoming-sms.js

# Test with a specific message
MESSAGE="Hello world" node scripts/test-incoming-sms.js
```

### Verifying Test Results

To verify that webhook tests were successful by checking Airtable and Twilio logs:

```bash
# Verify SMS test results
npm run test:twilio:verify sms +15551234567
# or directly:
node scripts/verify-webhook-test.js sms +15551234567

# Verify call test results
npm run test:twilio:verify call +15551234567
# or directly:
node scripts/verify-webhook-test.js call +15551234567
```

Replace `+15551234567` with the phone number used in your test.

## Post-Deploy Testing

After each deployment to Vercel, a post-deploy hook automatically runs tests against the production environment to ensure that the Twilio webhook endpoints are functioning correctly.

To manually run the post-deploy tests:

```bash
npm run post-deploy
```

## Implementation Details

### SMS Sending

The SmartText AI platform uses a centralized `sendSms()` function in `lib/twilio.ts` for all SMS sending operations. This function:

- Validates required environment variables
- Provides comprehensive error handling
- Includes detailed logging
- Handles common Twilio error codes

Example usage:

```typescript
import { sendSms } from '../lib/twilio';

// Send an SMS
try {
  const message = await sendSms({
    body: "Your message here",
    from: "+18186518560",
    to: "+15551234567",
    requestId: "optional-request-id-for-tracking"
  });
  
  console.log(`Message sent with SID: ${message.sid}`);
} catch (error) {
  console.error("Failed to send SMS:", error);
}
```

### Test Scripts

The test scripts simulate Twilio webhook payloads and send them to the appropriate endpoints:

- Voice calls: `/api/twilio/voice`
- SMS messages: `/api/new-message`

The scripts use the `axios` library to send HTTP requests and display the results in a user-friendly format.

## Troubleshooting

If tests fail, check the following:

1. Ensure your Twilio credentials are correct in `.env.local`
2. For local testing, make sure your development server is running
3. Check that the business phone number exists in your Airtable database
4. Verify that your Twilio account has the necessary permissions

Common Twilio error codes:

- 21608: The "From" phone number provided is not a valid, SMS-capable Twilio phone number
- 21211: The "To" phone number is not a valid phone number
- 20003: Authentication Error - Your Twilio credentials are invalid
