# Business Type Detection for SmartText AI

This document explains the business type detection feature in SmartText AI and how it enhances the auto-text responses for missed calls.

## Overview

SmartText AI now includes an intelligent business type detection system that automatically categorizes businesses based on their name, description, and other information. This feature enables more personalized and industry-specific auto-text responses when a business misses a call.

## How It Works

1. When a business is added to the system, the AI analyzes the business information (name, description, keywords, etc.) to determine the most likely business type.
2. The AI assigns a confidence score to the detected business type and suggests alternative types that might also apply.
3. The detected business type is used to generate industry-specific auto-text responses for missed calls.
4. If a business type is explicitly specified, the system uses that type. Otherwise, it uses the detected type if the confidence score is high enough (>70%).

## Supported Business Types

SmartText AI supports the following business types:

| Type ID | Name | Description |
|---------|------|-------------|
| restaurant | Restaurant | Food service establishment including cafes, diners, and eateries |
| auto_shop | Auto Shop | Automotive repair and maintenance services |
| salon | Salon | Hair, beauty, and personal care services |
| home_services | Home Services | Home repair, maintenance, and improvement services |
| retail | Retail Store | Shops selling products directly to consumers |
| healthcare | Healthcare | Medical practices, clinics, and healthcare providers |
| fitness | Fitness | Gyms, fitness studios, and wellness centers |
| professional_services | Professional Services | Legal, accounting, consulting, and other professional services |
| real_estate | Real Estate | Property management, sales, and leasing services |
| education | Education | Schools, tutoring centers, and educational services |
| hospitality | Hospitality | Hotels, motels, and accommodation services |
| entertainment | Entertainment | Venues for events, performances, and recreational activities |
| other | Other | Other business types not listed above |

## Industry-Specific Auto-Text Responses

The business type detection feature enhances auto-text responses by including industry-specific information:

### Basic Tier

For basic tier customers, the system uses a template-based approach with industry-specific elements:

- **Restaurants**: Includes online ordering link if available
- **Auto Shops**: Includes service quote link if available
- **Healthcare**: Includes emergency information
- **Salons**: Includes booking link if available

Example for a restaurant:
```
Hey thanks for calling Joe's Pizza. We're currently unavailable. Our hours are Monday-Friday: 9am-9pm, Saturday: 10am-10pm, Sunday: 11am-8pm. You can also order online at joespizza.com/order. Please call back during our business hours or leave a message and we'll get back to you as soon as possible.
```

### Pro & Enterprise Tiers

For pro and enterprise tier customers, the system uses more advanced AI generation with industry-specific guidance:

- **Restaurants**: Mentions food ordering options, popular dishes, or delivery services
- **Auto Shops**: Mentions service appointments, quotes, or common repair services
- **Salons**: Mentions booking appointments, popular services, or styling options
- **Healthcare**: Mentions appointment scheduling, patient portal, or emergency information
- **Home Services**: Mentions service areas, common services, or emergency availability
- **Retail**: Mentions product categories, online shopping options, or current promotions
- **Professional Services**: Mentions consultation options, service areas, or client portal information

Example for an auto shop (Pro tier):
```
Thanks for calling Quick Fix Auto Repair. We're currently unavailable but open Mon-Fri 8am-6pm, Sat 9am-3pm. For service quotes, visit quickfixauto.com/quote. We specialize in brake service, oil changes, and engine repairs. Please call back or leave a message.
```

## Testing the Feature

You can test the business type detection feature using the following scripts:

1. **Test Business Type Detection**: `node scripts/test-business-type-simple.js`
   - This script tests the business type detection functionality for different businesses.

2. **Test Missed Call Responses**: `node scripts/test-missed-call-simple.js`
   - This script tests the industry-specific missed call responses for different business types.

3. **Test Twilio Number**: `node scripts/test-twilio-number.js`
   - This script tests calling a Twilio number to see if it sends an auto-text response.

4. **Manual Testing**: Open `test-twilio-call.html` in a browser
   - This HTML page provides a simple interface for manually testing the auto-text feature by calling a Twilio number.

## Implementation Details

The business type detection feature is implemented in the following files:

- `lib/ai/openai.js`: Contains the core functionality for business type detection and generating industry-specific auto-text responses.
- `lib/ai/index.js`: Exports the functions from `openai.js` for use in other parts of the application.

The feature uses OpenAI's GPT-4o model to analyze business information and determine the most likely business type. The model is trained to recognize patterns in business names, descriptions, and other information that indicate specific industry types.

## Future Enhancements

Planned enhancements for the business type detection feature include:

1. **More Business Types**: Adding support for more specialized business types
2. **Improved Detection**: Enhancing the detection algorithm to improve accuracy
3. **Custom Templates**: Allowing businesses to create custom templates for their industry
4. **Multi-language Support**: Adding support for auto-text responses in multiple languages
5. **Seasonal Variations**: Automatically adjusting responses based on seasons or holidays

## Troubleshooting

If the business type detection is not working as expected, check the following:

1. **Business Description**: Ensure the business has a clear and descriptive name and description
2. **Confidence Score**: Check the confidence score of the detected business type (should be >70%)
3. **Manual Override**: If the detection is incorrect, manually specify the business type
4. **API Key**: Ensure the OpenAI API key is valid and has sufficient credits
5. **Logs**: Check the logs for any errors or warnings related to the business type detection

For any issues or questions, please contact support at support@smarttext-ai.com.
