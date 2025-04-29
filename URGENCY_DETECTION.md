# Urgency Detection Feature

This document describes the urgency detection feature implemented in the SmartText AI system, which allows the system to identify urgent customer messages and prioritize them accordingly.

## Overview

The urgency detection feature analyzes incoming SMS messages for keywords and phrases that indicate urgency. When an urgent message is detected, the system:

1. Sets an `urgentFlag` in the API response
2. Logs the matched keyword for debugging
3. Sends an alert to the business owner (if owner_phone is configured)
4. Modifies the AI response to acknowledge the urgency

## Implementation Details

### Standard Urgency Keywords

The system has a predefined list of standard urgency keywords that apply to all businesses:

```typescript
const STANDARD_URGENCY_KEYWORDS = [
  "urgent",
  "emergency", 
  "need help",
  "need a quote",
  "request service",
  "broken",
  "leaking",
  "no power",
  "no AC"
];
```

### Detection Logic

The urgency detection happens in step 7 of the `/api/new-message.ts` handler and follows this sequence:

1. First, check for standard urgency keywords using the `detectStandardUrgency` function
2. If no standard keywords match, check for business-specific custom alert keywords
3. If neither of the above match and OpenAI is enabled, use AI-based classification via `classifyMessageIntent`

### Response Handling

When an urgent message is detected:

1. The system logs the detection: `[urgency detection] Keyword matched: "keyword"`
2. The `isUrgent` flag is set to true
3. The detection source is recorded (standard_keywords, custom_keywords, or gpt_classification)
4. If the business has an owner_phone configured, an alert is sent
5. The system prompt for OpenAI is modified to acknowledge the urgency
6. The urgency flag is included in the final JSON response

## API Response

When an urgent message is detected, the API response includes these additional fields:

```json
{
  "urgentFlag": true,
  "urgencySource": "standard_keywords",
  "urgentKeyword": "urgent"
}
```

## Testing

A test script is provided to verify the urgency detection functionality:

```bash
node scripts/test-urgency-detection.js
```

This script sends test messages with various urgency keywords to the API endpoint and verifies that the urgency detection works as expected.

## Extending the Feature

### Adding New Standard Keywords

To add new standard urgency keywords, modify the `STANDARD_URGENCY_KEYWORDS` array in `/api/new-message.ts`.

### Business-Specific Keywords

Each business can have its own set of custom alert keywords defined in the `custom_alert_keywords` field in the business record. These are checked in addition to the standard keywords.

### AI-Based Classification

The `classifyMessageIntent` function in `lib/openai.ts` provides a more sophisticated urgency detection mechanism that considers business type and context. This function can be enhanced to improve detection accuracy.

## Future Improvements

Potential enhancements to the urgency detection feature:

1. Add severity levels (high, medium, low) to prioritize different types of urgent messages
2. Implement time-based urgency (e.g., detect if a customer needs help "today" or "now")
3. Add business-type specific urgency detection rules
4. Integrate with a notification system to alert staff via multiple channels
5. Add analytics to track urgency patterns and response times
