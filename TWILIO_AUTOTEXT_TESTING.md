# Testing Twilio Auto-Text Feature

This document explains how to test the Twilio auto-text feature, which sends an SMS to callers after they call a business.

## Overview

The auto-text feature is implemented in the `pages/api/twilio/voice.ts` file. When a call is received, the system:

1. Greets the caller with a voice message
2. Attempts to forward the call to the business's forwarding number (if available)
3. Sends an auto-text to the caller with a message from the business

## Testing with Forwarding Number

To test the auto-text feature with a specific forwarding number, you can use the `test-incoming-call.js` script. This script simulates an incoming call to a business and verifies that the TwiML response includes the correct elements.

### Using Test Overrides

The script supports test overrides to bypass the need for a business record in Airtable. You can specify a forwarding number directly in the script:

```javascript
// In scripts/test-incoming-call.js
const payload = {
  To: businessPhone,
  From: callerPhone,
  CallSid: callSid,
  Direction: 'inbound',
  CallStatus: 'ringing',
  testMode: true,
  _testOverrides: JSON.stringify({
    testMode: true,
    forwardingNumber: '+16193721633' // Specify the forwarding number here
  })
};
```

### Running the Test

To run the test:

1. Start the development server:
   ```
   npm run dev
   ```

2. In a separate terminal, run the test script:
   ```
   node scripts/test-incoming-call.js
   ```

3. Verify that the TwiML response includes:
   - A `<Say>` element with the greeting message
   - A `<Dial>` element with the forwarding number
   - The `action` attribute pointing to the missed-call endpoint

Example TwiML response:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hey thanks for calling our business. We're currently unavailable but we'll text you shortly.</Say>
  <Dial action="https://api.getsmarttext.com/api/missed-call" method="POST" callerId="+16193721633" timeout="20">
    <Number>+16193721633</Number>
  </Dial>
</Response>
```

## Testing with Real Twilio Calls

For more comprehensive testing with real Twilio calls and SMS messages, you can use the `test-direct-autotext.js` script. This script:

1. Sets up a local Express server
2. Exposes it via ngrok to get a public URL
3. Updates your Twilio number's webhooks to point to this ngrok URL
4. Sets up endpoints for voice and missed-call webhooks

### Prerequisites

- Twilio account with a phone number
- ngrok installed
- Environment variables set in `.env.local`:
  - `TWILIO_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`

### Running the Comprehensive Test

1. Run the script:
   ```
   node scripts/test-direct-autotext.js
   ```

2. Call your Twilio number from any phone
3. You should hear the greeting message
4. The call should attempt to forward to the specified number
5. After the call ends, you should receive an auto-text message

## Implementation Details

The auto-text feature is implemented in the `voice.ts` file. The key components are:

1. **Forwarding Number Selection**:
   ```typescript
   let forwardingNumber = 
     testOverrides.forwardingNumber ??
     business?.customSettings?.forwardingNumber ??
     process.env.FALLBACK_FORWARDING ??
     '';
   ```

2. **TwiML Generation**:
   ```typescript
   if (forwardingNumber) {
     const dial = twiml.dial({
       action: missedCallUrl,
       method: 'POST',
       callerId: toNumber,
       timeout: 20
     });
     dial.number(forwardingNumber);
   }
   ```

3. **Auto-Text Sending**:
   ```typescript
   await sendSms({
     to: fromNumber,
     from: toNumber,
     body: `Thanks for calling ${businessName}! We missed you, but reply here and we'll get right back to you.`,
     requestId: CallSid
   });
   ```

## Troubleshooting

- If the test fails with "Airtable credentials not found", you can ignore this warning as the test uses test overrides.
- If the TwiML response doesn't include the Dial element, check that the forwarding number is correctly specified in the test overrides.
- If you're testing with real Twilio calls and don't receive an SMS, check the Twilio logs for errors.
