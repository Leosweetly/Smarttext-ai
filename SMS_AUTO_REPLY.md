# SMS Auto-Reply Feature

This feature enables automatic replies to incoming SMS messages using business FAQs stored in Airtable.

## How It Works

1. When an SMS is received by a Twilio number, Twilio sends a webhook to `/api/new-message`
2. The endpoint extracts the recipient phone number (the Twilio number that received the message)
3. It looks up the business associated with that phone number in Airtable
4. It parses the FAQs from the business record (stored as a JSON array)
5. It attempts to match the incoming message to one of the FAQ questions
6. If a match is found, it sends the corresponding answer back via SMS
7. If no match is found, it sends a fallback message

## Implementation Details

### API Endpoint

The `/api/new-message` endpoint handles incoming SMS messages from Twilio. It:

- Extracts the `To`, `From`, and `Body` parameters from the Twilio webhook
- Queries Airtable to find the business with the matching phone number
- Parses the FAQs JSON array from the business record
- Uses string matching to find a relevant FAQ
- Sends a response via Twilio SMS

### Business Record Requirements

For this feature to work, each business record in Airtable must have:

1. A `Phone Number` field that matches the Twilio number
2. A `FAQs` field containing a JSON array of objects with `question` and `answer` properties:

```json
[
  {
    "question": "What are your hours?",
    "answer": "We're open Monday-Friday from 9am to 5pm."
  },
  {
    "question": "Do you offer delivery?",
    "answer": "Yes, we offer free delivery for orders over $50."
  }
]
```

3. (Optional) An `Auto-Reply Enabled` boolean field to control whether auto-replies are enabled

## Testing

### Local Testing

You can test the auto-reply functionality locally using the provided test script:

```bash
# Start the Next.js development server
npm run dev

# In another terminal, run the test script
node scripts/test-new-message.js +16193721633 "What are your hours?"
```

Replace `+16193721633` with the Twilio phone number associated with a business in your Airtable, and "What are your hours?" with a test message that should match one of the FAQs.

### Live Testing

To test with real SMS messages:

1. Configure your Twilio webhook using the provided script:
   ```bash
   # For local testing with ngrok
   node scripts/configure-twilio-sms-webhook.js +16193721633 https://your-ngrok-url.ngrok.io
   
   # For production
   node scripts/configure-twilio-sms-webhook.js +16193721633 https://your-domain.com
   ```

2. Send an SMS to one of your Twilio numbers that's associated with a business in Airtable

3. You should receive an automatic reply based on the FAQs for that business

### Automated Testing

Jest tests are available to verify the functionality without making actual API calls:

```bash
# Run the tests
npm test __tests__/api/new-message.test.js
```

These tests use mocks to simulate Twilio and Airtable interactions, allowing you to verify the endpoint's behavior in isolation.

## Troubleshooting

If auto-replies aren't working:

1. Check that the Twilio number is correctly associated with a business in Airtable
2. Verify that the business has FAQs in the correct format
3. Check that the `Auto-Reply Enabled` field (if present) is set to `true`
4. Check the server logs for any errors in the matching or response process
