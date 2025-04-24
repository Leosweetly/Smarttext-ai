# SmartText Monitoring System

This document outlines the monitoring system implemented for SmartText to track and analyze various aspects of the application's performance and usage in production.

## Overview

The monitoring system consists of several components:

1. **Error Monitoring**: Using Sentry to capture and alert on backend errors
2. **SMS Failure Tracking**: Tracking the success/failure rate of SMS messages
3. **OpenAI Usage Guardrail**: Monitoring and limiting daily OpenAI API usage
4. **Call and Message Volume Tracking**: Tracking call and message volumes
5. **Owner Alert Logging**: Logging all owner notifications for debugging

## Database Schema

The monitoring system uses several tables in Supabase:

- `sms_events`: Tracks all SMS attempts and outcomes
- `api_usage`: Tracks OpenAI API usage and costs
- `owner_alerts`: Logs all owner notifications
- `daily_stats`: Aggregates daily metrics for each business
- `call_events`: Existing table for tracking call events

## Monitoring Components

### 1. Error Monitoring with Sentry

Sentry integration is set up in `lib/sentry.js` and used throughout the application to capture errors and exceptions.

Usage:

```javascript
import * as Sentry from './sentry';

try {
  // Your code here
} catch (error) {
  Sentry.captureException(error, { 
    extra: { context: 'function_name', additionalData: data } 
  });
}
```

### 2. SMS Failure Tracking

All SMS attempts are tracked in the `sms_events` table, including success/failure status, error codes, and message details.

The `trackSmsEvent` function in `lib/monitoring.js` handles this tracking:

```javascript
import { trackSmsEvent } from './monitoring';

// After sending an SMS
trackSmsEvent({
  messageSid: message.sid,
  from: twilioNumber,
  to: recipientNumber,
  businessId: business.id,
  status: 'sent',
  requestId: requestId,
  bodyLength: messageBody.length,
  payload: { additionalData: data }
});
```

### 3. OpenAI Usage Guardrail

OpenAI API usage is tracked in the `api_usage` table, with daily limits to prevent runaway costs.

The system includes:

- `trackOpenAIUsage`: Records token usage and cost estimates
- `checkOpenAIUsageLimit`: Checks if a business has exceeded its daily limit
- `resetDailyOpenAIUsage`: Resets usage counters daily

### 4. Call and Message Volume Tracking

Call events are tracked in the existing `call_events` table, while message events are tracked in the new `sms_events` table.

Daily aggregated statistics are stored in the `daily_stats` table, which is updated by the `update-daily-stats.js` script.

### 5. Owner Alert Logging

All owner alerts are logged in the `owner_alerts` table, including delivery status and error messages.

The `trackOwnerAlert` function in `lib/monitoring.js` handles this tracking:

```javascript
import { trackOwnerAlert } from './monitoring';

// After sending an owner alert
trackOwnerAlert({
  businessId: business.id,
  ownerPhone: ownerPhoneNumber,
  customerPhone: customerPhone,
  alertType: 'urgent_message',
  messageContent: messageContent,
  detectionSource: 'gpt_classification',
  messageSid: message.sid,
  delivered: true,
  errorMessage: null
});
```

## Scheduled Tasks

### Daily Stats Update

The `scripts/update-daily-stats.js` script should be run daily to update the aggregated statistics:

```bash
# Update stats for yesterday (default)
node scripts/update-daily-stats.js

# Update stats for a specific date
node scripts/update-daily-stats.js --date 2025-04-11

# Reset OpenAI usage counters for today
node scripts/update-daily-stats.js --reset-openai
```

This script:
1. Updates the `daily_stats` table with aggregated metrics
2. Optionally resets the OpenAI usage counters for the new day

### Recommended Schedule

Set up a cron job to run the following tasks:

```
# Update daily stats for yesterday at 12:05 AM
5 0 * * * cd /path/to/smarttext && node scripts/update-daily-stats.js

# Reset OpenAI usage counters at 12:01 AM
1 0 * * * cd /path/to/smarttext && node scripts/update-daily-stats.js --reset-openai
```

## Visualization

### Supabase Studio

The monitoring system includes several views in Supabase for easy visualization:

- `sms_failure_rates`: Shows SMS failure rates by business and date
- `openai_daily_usage`: Shows OpenAI usage by business and date

To view these in Supabase Studio:
1. Go to the Supabase dashboard
2. Select your project
3. Go to the "Table Editor" section
4. Select the view from the list

### Custom Dashboard

For a more comprehensive dashboard, you can use the Supabase API to fetch data from these tables and views, and display it using a visualization library like Chart.js or D3.js.

## Alerting

### Sentry Alerts

Configure Sentry to send alerts for critical errors:

1. Go to the Sentry dashboard
2. Navigate to Alerts > Rules
3. Create rules for different error conditions
4. Set up notification channels (email, Slack, etc.)

### Custom Alerts

For custom alerts based on monitoring data (e.g., high SMS failure rates), you can:

1. Create a script that queries the monitoring tables
2. Set thresholds for different metrics
3. Send notifications when thresholds are exceeded
4. Run the script on a schedule using cron

## Maintenance

### Database Maintenance

To prevent the monitoring tables from growing too large:

1. Set up a retention policy for older data
2. Create a script to archive or delete data older than a certain age
3. Run the script on a schedule using cron

### Monitoring the Monitors

To ensure the monitoring system itself is working:

1. Set up health checks for the monitoring components
2. Create alerts for monitoring system failures
3. Regularly review the monitoring data for anomalies

## Troubleshooting

### Common Issues

1. **Missing Data**: Check if the tracking functions are being called correctly
2. **Database Errors**: Check Supabase logs for any database errors
3. **High Failure Rates**: Investigate Twilio logs for SMS delivery issues
4. **OpenAI Usage Spikes**: Check for potential abuse or inefficient prompts

### Debugging

For debugging monitoring issues:

1. Check the application logs for errors
2. Verify that the tracking functions are being called
3. Query the monitoring tables directly to check for data consistency
4. Test the monitoring functions in isolation

## Future Enhancements

Potential enhancements to the monitoring system:

1. **Real-time Monitoring**: Implement WebSockets for real-time updates
2. **Anomaly Detection**: Add machine learning for automatic anomaly detection
3. **User-level Tracking**: Track metrics at the user level for more granular insights
4. **Integration with External Tools**: Connect with tools like DataDog or Prometheus
