# Twilio Number Selection for SmartText AI

This document explains how to set up and use the Twilio number selection feature in SmartText AI.

## Overview

SmartText AI allows you to select a Twilio phone number to use for missed call auto-texting. This feature enables you to:

1. View all available phone numbers in your Twilio account
2. Select a number to use for SmartText AI
3. Configure the number for missed call handling
4. View the status of your Twilio configuration

## Prerequisites

Before using this feature, you need to:

1. Have a Twilio account with at least one phone number
2. Set up your Twilio credentials in the SmartText AI environment variables:
   - `TWILIO_SID`: Your Twilio account SID
   - `TWILIO_AUTH_TOKEN`: Your Twilio auth token
   - `API_BASE_URL`: The base URL of your SmartText AI deployment (optional, defaults to the Vercel deployment URL)

## Using the Twilio Number Selector

1. Navigate to the **Settings** page in your SmartText AI dashboard
2. In the **Twilio Configuration** section, you'll see the Twilio Number Selector
3. Click the dropdown to view all available phone numbers in your Twilio account
4. Select a phone number from the list
5. Click the **Save** button to configure the number for SmartText AI

## What Happens When You Select a Number

When you select and save a Twilio phone number, SmartText AI:

1. Updates the phone number in your business profile
2. Configures the number in Twilio with the appropriate webhooks:
   - Sets the Voice URL to handle incoming calls
   - Sets the Status Callback URL to handle missed calls
   - Configures the appropriate status callback events

## Troubleshooting

If you encounter issues with the Twilio number selection:

1. **No numbers appear in the dropdown**: Make sure your Twilio account has at least one phone number and your Twilio credentials are correctly set in the environment variables.

2. **Configuration fails**: Check that your Twilio credentials have the necessary permissions to update phone number configurations.

3. **Number shows as "Not configured"**: This means the number is not properly configured for SmartText AI. Try selecting the number again and saving it.

4. **Changes not reflected immediately**: It may take a few moments for changes to propagate through Twilio's system. Wait a minute and refresh the page.

## Testing the Configuration

You can test your Twilio number configuration by:

1. Running the test script: `node scripts/test-twilio-number-selection.js`
2. Making a call to your Twilio number and letting it go to voicemail
3. Checking if a missed call notification is received and an auto-text is sent

## Technical Details

The Twilio number selection feature uses the following components:

- **API Endpoint**: `/api/twilio/numbers` - Lists all available Twilio numbers
- **API Endpoint**: `/api/twilio/configure` - Configures a selected number
- **API Endpoint**: `/api/twilio/status` - Checks the status of a number
- **Component**: `TwilioNumberSelector` - UI component for selecting a number
- **Component**: `TwilioConnectionStatus` - UI component for displaying status

## Security Considerations

- Twilio credentials are stored securely in environment variables
- API endpoints are protected with authentication
- Phone number configurations are only modifiable by authenticated users

## Related Documentation

- [Twilio Integration](TWILIO_INTEGRATION.md)
- [Twilio Autotext Troubleshooting](TWILIO_AUTOTEXT_TROUBLESHOOTING.md)
- [Twilio API Documentation](https://www.twilio.com/docs/api)
