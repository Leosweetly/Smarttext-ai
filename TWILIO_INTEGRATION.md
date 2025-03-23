# Twilio Integration Guide

This guide explains how to set up and use the Twilio integration for missed call auto-texting in SmartText AI.

## Overview

SmartText AI uses Twilio to automatically send text messages to customers who call your business but don't get through. This feature helps you capture leads that might otherwise be lost and provides a better customer experience.

## Prerequisites

1. A Twilio account (sign up at [twilio.com](https://www.twilio.com))
2. A Twilio phone number with SMS and voice capabilities
3. Your Twilio Account SID and Auth Token

## Setup Instructions

### 1. Add Your Twilio Credentials

Add your Twilio credentials to the `.env.local` file in the root of your project:

```
TWILIO_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
TWILIO_SMARTTEXT_NUMBER=your_smarttext_number
```

Replace `your_account_sid`, `your_auth_token`, `your_twilio_phone_number`, and `your_smarttext_number` with your actual Twilio credentials.

The `TWILIO_SMARTTEXT_NUMBER` is the phone number that will be used to send auto-text messages. If this is not set, the system will use the business's Twilio number (`TWILIO_PHONE_NUMBER`) instead.

### 2. Set Up Your Forwarding Phone Number

The system needs to know which phone number to forward calls to. This is the actual business phone that should ring when someone calls your Twilio number.

You can set this up in two ways:

1. **Use the same number as your business phone**: By default, the system will forward calls to the same phone number that's registered as your business phone in Airtable.

2. **Use a different forwarding number**: If you want calls to be forwarded to a different number, you can set the "Forwarding Phone Number" field in Airtable for your business.

Make sure the forwarding phone number is in E.164 format (e.g., +18186518560).

### 3. Configure Your Twilio Number

You can configure your Twilio number in two ways:

#### Option 1: During Signup

When you sign up for SmartText AI, you can enter your Twilio phone number in the signup form. The system will automatically configure it for missed call auto-texting.

#### Option 2: In the Settings Page

If you didn't configure your Twilio number during signup, or if you want to change it:

1. Go to the Settings page in your dashboard
2. Scroll down to the "Twilio Configuration" section
3. Enter your Twilio phone number in E.164 format (e.g., +18186518560)
4. Click "Configure Now"

### 4. Test Your Configuration

To test that your Twilio number is properly configured:

1. Run the test script:
   ```
   node scripts/test-twilio-integration.js +18186518560
   ```
   (Replace +18186518560 with your actual Twilio phone number)

2. Or make a test call:
   - Call your Twilio number from another phone
   - Hang up before the call is answered
   - You should receive an automated text message shortly after

## How It Works

1. When a customer calls your Twilio number, the call is forwarded to your actual business phone number.
2. If the call is answered, the conversation proceeds normally.
3. If the call is not answered (missed call), Twilio sends a webhook to your application.
4. The webhook contains information about the call, including the caller's phone number.
5. Your application processes this information and uses the SmartText AI engine to generate a personalized response.
6. The application sends an SMS back to the caller via Twilio.
7. The conversation is logged in your dashboard for follow-up.

## Webhook Configuration

The Twilio integration automatically configures the following webhooks:

- **Voice URL**: `https://your-domain.com/api/twilio/voice`
  - This endpoint handles incoming voice calls and forwards them to your business phone
  
- **Status Callback URL**: `https://your-domain.com/api/missed-call`
  - This endpoint receives call status updates (e.g., "completed", "no-answer") and triggers auto-text messages for missed calls

## Troubleshooting

### Common Issues

1. **No auto-text sent after missed call**
   - Check that your Twilio credentials are correct in `.env.local`
   - Verify that your Twilio number is properly configured in the Settings page
   - Make sure your Twilio account has sufficient funds

2. **Error configuring Twilio number**
   - Ensure the phone number is in E.164 format (e.g., +18186518560)
   - Verify that the phone number exists in your Twilio account
   - Check that your Twilio account has the necessary permissions

3. **Webhook errors**
   - Ensure your application is publicly accessible (not localhost)
   - Check that your Twilio account has webhook permissions

### Testing Tools

- **Status Check**: Use the Settings page to check the status of your Twilio configuration
- **Test Scripts**:
  - `node scripts/test-twilio-integration.js your_phone_number` - Test the overall Twilio integration
  - `node scripts/test-call-forwarding.js your_twilio_number` - Test the call forwarding functionality
  - `node scripts/test-smarttext-number.js` - Test the SmartText AI number for sending messages
- **Twilio Console**: Check the Twilio console for logs and debugging information

## Advanced Configuration

### Customizing Auto-Text Messages

You can customize the auto-text messages in the Settings page:

1. Go to the Settings page in your dashboard
2. Scroll to the "Auto-Text Templates" section
3. Edit the templates for different scenarios

### Multiple Phone Numbers

If you have the Enterprise plan, you can configure multiple phone numbers for different locations:

1. Go to the Settings page
2. Click on "Manage Locations"
3. Add a phone number for each location

## Support

If you encounter any issues with the Twilio integration, please contact our support team at support@smarttext-ai.com or open an issue on our GitHub repository.
