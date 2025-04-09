# SMS Auto-Reply Testing Guide

This document provides detailed instructions for testing the SMS auto-reply functionality that uses business FAQs stored in Airtable.

## Prerequisites

Before testing, ensure you have:

1. **Environment Variables**: Verify these are set in your `.env.local` file:
   - `TWILIO_SID`: Your Twilio account SID
   - `TWILIO_AUTH_TOKEN`: Your Twilio auth token
   - `TWILIO_SMARTTEXT_NUMBER`: A Twilio phone number for testing
   - `AIRTABLE_PAT`: Your Airtable Personal Access Token
   - `AIRTABLE_BASE_ID`: Your Airtable base ID

2. **Airtable Setup**:
   - At least one business record with a valid phone number
   - FAQs field populated with a JSON array of question/answer pairs
   - (Optional) Auto-Reply Enabled field set to true

3. **Development Environment**:
   - Node.js and npm installed
   - All project dependencies installed (`npm install`)

## Test Scenarios

### 1. Local Testing with Test Script

This approach simulates a Twilio webhook request without sending actual SMS messages.

#### Setup

1. Start the Next.js development server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, install the script dependencies:
   ```bash
   cd scripts
   npm install
   ```

#### Test Cases

**Test Case 1.1: Matching FAQ**

1. Run the test script with a message that should match an FAQ:
   ```bash
   node scripts/test-new-message.js +16193721633 "What are your hours?"
   ```
   (Replace `+16193721633` with a Twilio number associated with a business in your Airtable)

2. **Expected Result**:
   - Console output shows a successful match
   - Response contains the answer from the matching FAQ
   - No actual SMS is sent (this is just a simulation)

**Test Case 1.2: Non-matching FAQ (Fallback Message)**

1. Run the test script with a message that won't match any FAQ:
   ```bash
   node scripts/test-new-message.js +16193721633 "Something completely random"
   ```

2. **Expected Result**:
   - Console output shows no match was found
   - Response contains the fallback message: "Thanks! A team member will follow up shortly."

**Test Case 1.3: Business Not Found**

1. Run the test script with a phone number not associated with any business:
   ```bash
   node scripts/test-new-message.js +19999999999 "Hello"
   ```

2. **Expected Result**:
   - Error response indicating no business was found for that phone number

**Test Case 1.4: Auto-Reply Disabled**

1. In Airtable, find a business record and set `Auto-Reply Enabled` to `false`
2. Run the test script with that business's phone number:
   ```bash
   node scripts/test-new-message.js +16193721633 "Hello"
   ```
   (Replace with the phone number of the business you modified)

3. **Expected Result**:
   - Response indicating auto-reply is disabled for this business
   - No SMS response is generated

### 2. Live Testing with Actual SMS

This approach tests the full end-to-end functionality with real SMS messages.

#### Setup

1. Configure your Twilio phone number's webhook:
   - Log in to your Twilio console
   - Navigate to Phone Numbers > Manage > Active Numbers
   - Select your test number
   - Under Messaging, set the webhook URL for "A MESSAGE COMES IN" to:
     - For local testing with ngrok: `https://your-ngrok-url.ngrok.io/api/new-message`
     - For production: `https://your-domain.com/api/new-message`
   - Set the HTTP method to POST

2. For local testing, start your Next.js server and expose it with ngrok:
   ```bash
   # Terminal 1: Start Next.js
   npm run dev
   
   # Terminal 2: Start ngrok (if you have it installed)
   ngrok http 3000
   ```

#### Test Cases

**Test Case 2.1: Send SMS to Matching FAQ**

1. From your personal phone, send an SMS to your Twilio number with text that should match an FAQ
2. **Expected Result**:
   - You receive an automated response with the answer from the matching FAQ
   - Server logs show the matching process

**Test Case 2.2: Send SMS with Non-matching Text**

1. From your personal phone, send an SMS with text that won't match any FAQ
2. **Expected Result**:
   - You receive the fallback message: "Thanks! A team member will follow up shortly."
   - Server logs show no match was found

## Debugging and Troubleshooting

### Checking Server Logs

When testing, monitor your server logs for detailed information:

1. Look for log entries with the `[new-message]` prefix
2. These logs show:
   - Incoming message details
   - Business lookup results
   - FAQ parsing and matching
   - Response generation and sending

### Common Issues and Solutions

**Issue: No Response to SMS**
- Check Twilio webhook configuration
- Verify the webhook URL is accessible
- Check server logs for errors
- Ensure Twilio credentials are correct

**Issue: Business Not Found**
- Verify the phone number format (should be E.164 format, e.g., +16193721633)
- Check Airtable to ensure the business record has the correct phone number
- Check for typos or formatting differences

**Issue: FAQs Not Matching**
- Check the format of the FAQs JSON array in Airtable
- Verify the string matching logic in the code
- Try simplifying the test message to increase match likelihood

**Issue: Error in API Response**
- Check for syntax errors in the FAQs JSON
- Verify Airtable credentials and permissions
- Check for rate limiting issues

## Advanced Testing

### Testing with Multiple Businesses

1. Set up multiple business records in Airtable with different phone numbers and FAQs
2. Test each business to ensure they respond with their specific FAQs

### Testing FAQ Matching Accuracy

1. Create a variety of FAQs with similar questions
2. Test with messages that are:
   - Exact matches
   - Partial matches
   - Containing typos
   - Using different wording for the same question

### Load Testing

For production environments, consider testing with multiple simultaneous messages:

1. Use a tool like Apache JMeter or a custom script to send multiple webhook requests
2. Monitor response times and error rates
3. Check for any rate limiting issues with Twilio or Airtable

## Continuous Integration

Consider adding automated tests to your CI pipeline:

1. Create Jest tests that mock the Twilio webhook requests
2. Test the endpoint with various scenarios
3. Verify the response format and content

Example test file structure:
```
__tests__/
  api/
    new-message.test.js
```
