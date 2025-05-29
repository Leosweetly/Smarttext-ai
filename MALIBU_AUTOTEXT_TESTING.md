# Malibu Country Kitchen Auto-Text Testing

This document provides instructions for testing the enhanced auto-text functionality for Malibu Country Kitchen.

## Feature Overview

The auto-text functionality has been enhanced with the following features:

1. **Standardized Format**: Auto-text messages now follow a specific format:
   ```
   Hey! Thanks for calling [business name], sorry we missed your call. Were you calling about [business-type-specific topics]?
   ```

2. **Business-Type Specific Topics**: The system now suggests relevant topics based on the business type (e.g., for restaurants: "placing an order or making a reservation").

3. **FAQ Response System**: When customers reply to the auto-text with questions, the system can now:
   - Match questions to the business's FAQs stored in Supabase
   - Generate responses based on those FAQs
   - Fall back to OpenAI for questions not covered by FAQs

## Testing Instructions

### Prerequisites

1. Make sure your development server is running:
   ```
   npm run dev
   ```

2. Ensure your phone number is correctly set in the test script. The default is `+16193721633`.

### Testing the Missed Call Auto-Text

1. Run the Malibu Country Kitchen auto-text test script:
   ```
   node scripts/test-malibu-autotext.js
   ```

2. The script will simulate a missed call from your phone number to the Malibu Country Kitchen Twilio number.

3. Check your phone for the auto-text message. It should arrive shortly after running the script.

4. Verify that the message follows the format:
   ```
   Hey! Thanks for calling Malibu Country Kitchen, sorry we missed your call. Were you calling about placing an order or making a reservation?
   ```

### Testing the FAQ Response System

1. Run the FAQ test mode:
   ```
   node scripts/test-malibu-autotext.js faq
   ```

2. When prompted, enter a question that might match one of the restaurant's FAQs, such as:
   - "What are your hours?"
   - "Do you take reservations?"
   - "Do you offer takeout?"

3. The system will attempt to match your question to the FAQs and generate a response.

4. Try different questions to see how the system handles various types of inquiries.

### Troubleshooting

If you don't receive the auto-text message:

1. Check the console output for any errors.

2. Verify that the Twilio credentials are correctly set in your `.env.local` file:
   ```
   TWILIO_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   ```

3. Make sure the phone number in the test script is your actual phone number.

4. Check if there are any rate-limiting issues. The system has a 10-minute cooldown period between SMS messages to the same number.

5. Look at the server logs for any errors in the missed-call endpoint or the Twilio SMS sending function.

## Additional Testing Methods

### Direct Missed Call Test

You can also use the general missed call test script:

```
node scripts/test-missed-call-direct.js
```

### Testing via Voice Handler

To test the complete flow including the voice handler:

```
node scripts/test-incoming-call.js
```

This will simulate an incoming call that gets forwarded to the missed-call endpoint.

## Implementation Details

The enhanced auto-text functionality is implemented in the following files:

1. `lib/business-topics.js` - New utility for generating business-type specific topics
2. `lib/openai.js` - Updated to use the new format and handle FAQ responses
3. `lib/api-compat.js` - Enhanced mock implementation with more business data
4. `scripts/test-malibu-autotext.js` - Updated test script with FAQ testing mode

### Business Types and Topics

The system supports the following business types with relevant topics:

- **Restaurant**: placing an order, making a reservation, checking menu options
- **Auto Shop**: scheduling a repair, getting a quote, checking on vehicle status
- **Salon**: booking an appointment, checking service availability, inquiring about pricing
- **Healthcare**: scheduling an appointment, inquiring about services, checking insurance coverage
- **Retail**: checking product availability, inquiring about store hours, asking about current promotions
- And many more...

Each business type has a set of relevant topics that might be of interest to customers. The system selects up to 2 topics to include in the auto-text message.

### FAQ Handling

When a customer replies to the auto-text with a question, the system:

1. Attempts to match the question to the business's FAQs stored in Supabase
2. If a match is found, returns the corresponding answer
3. If no match is found, uses OpenAI to generate a response based on the business information and FAQs
4. Falls back to a generic response if all else fails

This ensures that customers get accurate and helpful responses to their questions, even outside of business hours.
