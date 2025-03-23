# Twilio Auto-Text Troubleshooting Guide

This guide helps diagnose and fix issues with the Twilio auto-text feature, which sends an automatic text message when a call to a Twilio number is missed.

## Common Issues

The auto-text feature may not work for several reasons:

1. **HTTP 405 Method Not Allowed errors**: The Twilio webhooks are not properly configured or the API routes are not handling the requests correctly.
2. **No business associated with the phone number**: The Twilio number is not associated with any business in the database.
3. **Twilio account issues**: The Twilio account may have run out of credits or there might be restrictions on the account.
4. **Webhook configuration**: The Twilio number's webhooks are not properly configured.

## Diagnostic Tools

We've created several scripts to help diagnose and fix issues with the auto-text feature:

### 1. Check if a phone number is associated with a business

```bash
node scripts/check-twilio-number.js [phone-number]
```

This script checks if a Twilio phone number is associated with a business in the database. If no business is found, the auto-text feature won't work.

### 2. Add a test business for a phone number

```bash
node scripts/add-test-business-for-number.js [phone-number]
```

This script adds a test business associated with a specific Twilio phone number. It helps test the auto-text functionality by ensuring there's a business in the database associated with the phone number.

### 3. Test the auto-text feature directly

```bash
node scripts/test-direct-autotext.js
```

This script provides a direct test of the Twilio auto-text functionality. It bypasses the complex business logic and directly sends an SMS when triggered. It sets up a local server with ngrok to handle Twilio webhooks.

### 4. Manual testing with a web page

Open `test-twilio-call.html` in a browser on your mobile device to manually test calling the Twilio number.

## Fixing HTTP 405 Method Not Allowed Errors

We've updated the API routes to handle all HTTP methods to fix the HTTP 405 Method Not Allowed errors:

1. `/app/api/missed-call/route.js`: Updated to handle all HTTP methods and forward them to the POST handler.
2. `/app/api/twilio/voice/route.js`: Updated to handle all HTTP methods and forward them to the POST handler.

These changes should fix the HTTP 405 errors that were occurring when Twilio tried to send POST requests to these endpoints.

## Checking Twilio Webhook Configuration

To check and update the Twilio webhook configuration:

1. Log in to the [Twilio Console](https://www.twilio.com/console).
2. Go to Phone Numbers > Manage > Active Numbers.
3. Click on the phone number you want to check.
4. Under "Voice & Fax", check the "A CALL COMES IN" webhook URL. It should be set to:
   ```
   https://your-app-url.com/api/twilio/voice
   ```
5. Under "Voice & Fax", check the "STATUS CALLBACK URL" webhook URL. It should be set to:
   ```
   https://your-app-url.com/api/missed-call
   ```
6. Make sure the HTTP method is set to POST for both webhooks.

## Testing with the Direct Auto-Text Script

The `test-direct-autotext.js` script is the most reliable way to test the auto-text feature. It:

1. Sets up a local server with ngrok to handle Twilio webhooks.
2. Updates the Twilio number's webhooks to point to the ngrok URL.
3. Provides endpoints to handle voice calls and missed calls.
4. Sends an auto-text message when a call is missed.

To use it:

1. Run the script: `node scripts/test-direct-autotext.js`
2. Call the Twilio number displayed in the console.
3. Hang up before the call is answered.
4. Wait for the auto-text message.

## Verifying Business Association

If the auto-text feature still doesn't work, make sure the Twilio number is associated with a business in the database:

1. Run the check script: `node scripts/check-twilio-number.js +18186518560`
2. If no business is found, add a test business: `node scripts/add-test-business-for-number.js +18186518560`

## Debugging Twilio Logs

Twilio logs can provide valuable information about what's happening with your calls and webhooks:

1. Log in to the [Twilio Console](https://www.twilio.com/console).
2. Go to Monitor > Logs > Calls.
3. Find the call you want to debug and click on it.
4. Check the "Call Details" and "Request Inspector" sections for errors.

Common errors:

- **HTTP 405 Method Not Allowed**: The API route is not handling the HTTP method correctly.
- **HTTP 404 Not Found**: The webhook URL is incorrect or the route doesn't exist.
- **HTTP 500 Internal Server Error**: There's an error in the API route code.

## Conclusion

By following this troubleshooting guide, you should be able to diagnose and fix issues with the Twilio auto-text feature. If you're still having issues, check the server logs for more detailed error messages.
