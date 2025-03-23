# SmartText AI Client Onboarding Automation

This document provides instructions for using the client onboarding automation tools to efficiently add new businesses to the SmartText AI platform and configure their Twilio phone numbers for missed call handling.

## Overview

The client onboarding automation system consists of several components:

1. **Twilio Phone Manager**: A module for programmatically configuring Twilio phone numbers
2. **Business Import Script**: A tool for importing businesses from CSV files
3. **Twilio Configuration Testing**: A script for testing and verifying Twilio configurations
4. **Enhanced Missed Call Handling**: Improved webhook handling for missed calls

These tools work together to streamline the process of adding new clients to the platform and ensuring their Twilio numbers are properly configured for missed call auto-texting.

## Prerequisites

Before using these tools, ensure you have:

1. **Twilio Account**: Active Twilio account with API credentials
2. **TwiML Bin**: A TwiML Bin set up in your Twilio account for handling incoming calls
3. **Environment Variables**: The following environment variables set in your `.env.local` file:
   - `TWILIO_SID`: Your Twilio account SID
   - `TWILIO_AUTH_TOKEN`: Your Twilio auth token
   - `DEFAULT_TWIML_BIN_URL`: URL to your TwiML Bin (e.g., `https://handler.twilio.com/twiml/EHxxxxx`)
   - `API_BASE_URL`: Base URL of your deployed API (e.g., `https://smarttext-webhook-kyle-davis-projects-30fc1531.vercel.app`)

## Setting Up a TwiML Bin

1. Log into your [Twilio Console](https://www.twilio.com/console)
2. Navigate to Runtime → TwiML Bins
3. Click "Create new TwiML Bin"
4. Give it a friendly name like "SmartText Call Handler"
5. Enter TwiML code for handling calls:

```xml
<Response>
  <Say>Thank you for calling. Please leave a message after the tone.</Say>
  <Pause length="1"/>
  <Record maxLength="30" playBeep="true"/>
</Response>
```

Or for forwarding calls:

```xml
<Response>
  <Dial timeout="20">+1YOURNUMBERHERE</Dial>
  <Say>The person you are calling is not available. Please try again later.</Say>
</Response>
```

6. Save the TwiML Bin and copy its URL for use in your environment variables

## Importing Businesses

### Preparing the CSV File

Create a CSV file with the following columns:

- `name`: Business name
- `businessType`: Type of business (e.g., restaurant, auto shop, salon)
- `phoneNumber`: Twilio phone number in E.164 format (e.g., +18186518560)
- `address`: Business address
- `subscriptionTier`: Subscription tier (basic, pro, enterprise)
- `hours`: Business hours in format "Day1-Day2: Time1 - Time2, Day3: Time3 - Time4"
- `orderingLink`: Online ordering link (for restaurants)
- `quoteLink`: Quote request link (for auto shops)
- `bookingLink`: Booking link (for appointments)
- `hasMultipleLocations`: Whether the business has multiple locations (true/false)

A sample CSV file is provided at `scripts/sample-businesses.csv` for reference.

### Running the Import Script

To import businesses from a CSV file:

```bash
node scripts/import-businesses.js path/to/your/businesses.csv
```

The script will:
1. Parse the CSV file
2. Create each business in Airtable
3. Configure the Twilio phone number for each business
4. Provide a summary of successful and failed imports

## Configuring Twilio Numbers

### Testing Twilio Configuration

To check the status of a Twilio number:

```bash
node scripts/test-twilio-config.js status +18186518560
```

To configure a single Twilio number:

```bash
node scripts/test-twilio-config.js configure +18186518560
```

To bulk configure all Twilio numbers from Airtable:

```bash
node scripts/test-twilio-config.js bulk-configure
```

### Manual Configuration

If you prefer to manually configure Twilio numbers:

1. Log into your [Twilio Console](https://www.twilio.com/console)
2. Navigate to Phone Numbers → Manage → Active Numbers
3. Select the phone number you want to configure
4. Under "Voice & Fax" configuration:
   - For "A CALL COMES IN", select "TwiML Bin" and choose your TwiML Bin
   - For "STATUS CALLBACK URL", enter your API endpoint: `https://your-api-url.com/api/missed-call`
   - For "STATUS CALLBACK EVENTS", select:
     - Call completed
     - No answer
     - Busy
     - Failed
5. Save your changes

## How It Works

### Missed Call Handling

When a call comes in to a Twilio number:

1. The call is handled according to the TwiML Bin configuration (voicemail or forwarding)
2. After the call ends, Twilio sends a status callback to the `/api/missed-call` endpoint
3. The endpoint checks if the call was missed (no-answer, busy, or failed)
4. If the call was missed, it:
   - Looks up the business associated with the phone number
   - Generates an appropriate response based on the business type and subscription tier
   - Sends an auto-text message to the caller

### Twilio Phone Manager

The Twilio Phone Manager module (`lib/twilio/phone-manager.js`) provides functions for:

- Configuring individual Twilio numbers
- Bulk configuring multiple numbers
- Purchasing new Twilio numbers
- Checking the configuration status of numbers

These functions can be used programmatically in your code or via the provided scripts.

## Troubleshooting

### Common Issues

1. **"Phone number not found in Twilio account"**
   - Ensure the phone number is in E.164 format (e.g., +18186518560)
   - Verify the phone number exists in your Twilio account

2. **"Twilio credentials not found in environment variables"**
   - Check that TWILIO_SID and TWILIO_AUTH_TOKEN are set in your .env.local file

3. **"Error configuring Twilio number"**
   - Verify your Twilio account has permissions to modify phone numbers
   - Check that the phone number is not being used by another service

4. **Auto-texts not being sent**
   - Verify the status callback URL is correctly set in Twilio
   - Check that the appropriate status callback events are selected
   - Look for errors in your application logs

### Logs and Debugging

- Check your application logs for errors related to Twilio or missed call handling
- Use the `status` command in the test script to verify Twilio number configurations
- Test the missed call endpoint directly using a tool like Postman

## Best Practices

1. **Test Before Production**: Always test new configurations with a sample phone number before applying to all client numbers.

2. **Backup Before Bulk Operations**: Take a backup of your Airtable data before running bulk import or configuration operations.

3. **Monitor After Changes**: After configuring numbers, monitor the system to ensure auto-texts are being sent correctly.

4. **Regular Verification**: Periodically run the bulk verification to ensure all numbers remain properly configured.

## Advanced Usage

### Programmatic API

You can use the Twilio Phone Manager module programmatically in your code:

```javascript
import { configureTwilioNumber, bulkConfigureTwilioNumbers } from './lib/twilio/phone-manager.js';

// Configure a single number
const result = await configureTwilioNumber('+18186518560', {
  voiceUrl: 'https://handler.twilio.com/twiml/EHxxxxx',
  statusCallback: 'https://your-api-url.com/api/missed-call'
});

// Bulk configure numbers
const businesses = await getBusinesses();
const bulkResults = await bulkConfigureTwilioNumbers(businesses);
```

### Custom TwiML

You can create more advanced call handling by customizing the TwiML in your Twilio Bin:

- **IVR Menus**: Create interactive voice response menus
- **Call Forwarding Logic**: Forward to different numbers based on time of day
- **Custom Voicemail**: Customize voicemail messages by business type

## Next Steps

1. **Dashboard Integration**: Consider integrating these tools into your admin dashboard for a GUI-based workflow.

2. **Automated Verification**: Set up scheduled jobs to verify Twilio configurations remain correct.

3. **Enhanced Reporting**: Build reporting tools to track missed call statistics and auto-text effectiveness.
