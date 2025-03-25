# Zapier Webhook Integration Guide

This guide explains how the Zapier webhook integration works in the SmartText AI application and how to configure it for your environment.

## Overview

SmartText AI uses Zapier webhooks to trigger automations when certain events occur in the application. This allows you to connect SmartText AI with thousands of other apps and services through Zapier.

## Supported Webhook Types

SmartText AI supports the following webhook types:

1. **Missed Call Webhook**: Triggered when a call is missed and SmartText AI sends an automated response.
2. **New Message Webhook**: Triggered when a new message is received from a customer.

## How It Works

1. **Webhook Flow**:
   - When a specific event occurs in SmartText AI (e.g., a missed call), the application sends a POST request to the configured Zapier webhook URL.
   - The request contains data about the event in JSON format.
   - Zapier receives the webhook and triggers the corresponding Zap.
   - The Zap can then perform actions in other apps based on the data received.

2. **Data Format**:
   - **Missed Call Webhook**:
     ```json
     {
       "event_type": "missed_call",
       "timestamp": "2025-03-23T20:30:00Z",
       "call_sid": "CA1234567890abcdef",
       "from": "+15551234567",
       "to": "+15559876543",
       "duration": "0",
       "status": "no-answer",
       "business_id": "BUS123456",
       "business_name": "Acme Corporation",
       "caller_name": "John Doe"
     }
     ```
   
   - **New Message Webhook**:
     ```json
     {
       "event_type": "new_message",
       "timestamp": "2025-03-23T20:35:00Z",
       "message_sid": "SM1234567890abcdef",
       "from": "+15551234567",
       "to": "+15559876543",
       "body": "Hello, I'd like to schedule an appointment.",
       "status": "received",
       "business_id": "BUS123456",
       "business_name": "Acme Corporation",
       "sender_name": "John Doe"
     }
     ```

## Configuration

### Environment Variables

To configure Zapier webhooks in your environment, you need to set the following environment variables in your `.env.local` file:

```
ZAPIER_MISSED_CALL_WEBHOOK_URL=your-zapier-missed-call-webhook-url
ZAPIER_NEW_MESSAGE_WEBHOOK_URL=your-zapier-new-message-webhook-url
```

### Zapier Configuration

1. **Create a Zap in Zapier**:
   - Log in to your Zapier account.
   - Click "Create Zap".
   - Choose "Webhooks by Zapier" as the trigger app.
   - Select "Catch Hook" as the trigger event.
   - Click "Continue".

2. **Set Up the Webhook**:
   - Zapier will generate a custom webhook URL for you.
   - Copy this URL.
   - Set the corresponding environment variable in your `.env.local` file.
   - Click "Continue".

3. **Test the Webhook**:
   - Use the provided test script to send a test webhook:
     ```bash
     # For missed call webhook
     node scripts/test-zapier-webhook.js missed_call
     
     # For new message webhook
     node scripts/test-zapier-webhook.js new_message
     ```
   - Zapier should receive the test data and display it.
   - Click "Continue".

4. **Set Up the Action**:
   - Choose the app you want to connect (e.g., Gmail, Slack, Trello).
   - Select the action you want to perform (e.g., send an email, post a message).
   - Configure the action using the data from the webhook.
   - Test the action.
   - Click "Continue".

5. **Turn On Your Zap**:
   - Review your Zap.
   - Give it a name.
   - Turn it on.

## Example Zaps

Here are some example Zaps you can create with SmartText AI webhooks:

1. **Missed Call Notification**:
   - Trigger: Missed Call Webhook
   - Action: Send a Slack message to your team with the caller's information.

2. **New Lead Alert**:
   - Trigger: New Message Webhook
   - Action: Create a new lead in your CRM system.

3. **Appointment Request**:
   - Trigger: New Message Webhook (filtered for messages containing "appointment")
   - Action: Create a new event in Google Calendar.

4. **Customer Support Ticket**:
   - Trigger: New Message Webhook
   - Action: Create a new ticket in your support system.

## Testing

You can test the Zapier webhook integration using the provided test script:

```bash
# For missed call webhook
node scripts/test-zapier-webhook.js missed_call

# For new message webhook
node scripts/test-zapier-webhook.js new_message
```

This script sends test data to the configured webhook URL and displays the response.

## Troubleshooting

### Common Issues

1. **Webhook Not Triggering**:
   - Check if the webhook URL is correctly configured in your environment variables.
   - Verify that your Zap is turned on in Zapier.
   - Check if there are any errors in the Zapier task history.

2. **Invalid Webhook URL**:
   - Make sure you're using the correct webhook URL from Zapier.
   - Webhook URLs are unique to each Zap and cannot be reused.

3. **Data Not Being Processed Correctly**:
   - Check the format of the data being sent to the webhook.
   - Verify that your Zap is correctly configured to process the data.

### Debugging

To debug webhook issues, you can:

1. Use the test script to send test data to the webhook.
2. Check the Zapier task history for errors.
3. Use the Zapier debugger to see the data being received.

## Resources

- [Zapier Documentation](https://zapier.com/help)
- [Webhooks by Zapier Documentation](https://zapier.com/apps/webhook/help)
