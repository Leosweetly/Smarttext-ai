# SmartText AI - Growth Plan Features

This document provides an overview of the Growth Plan features implemented in the SmartText AI platform. The Growth Plan is designed for chains, franchises, and teams who want to scale communication and automate at a higher level.

## Growth Plan Features

### 1. Multi-location support with location-specific auto-replies

The multi-location support feature allows businesses with multiple locations to manage all their locations from a single account. Each location can have its own phone number, address, hours, and auto-reply templates.

#### Key Components:

- **Business-Location Relationship**: A business can have multiple locations, each with its own settings and configuration.
- **Location-Specific Phone Numbers**: Each location can have its own dedicated phone number for receiving calls and texts.
- **Location-Specific Auto-Replies**: When a call is missed at a specific location, the auto-reply is customized for that location.
- **Centralized Management**: All locations can be managed from a single dashboard.

#### Implementation Details:

- **Data Model**: The system uses a parent-child relationship between businesses and locations.
- **Routing Logic**: Incoming calls are routed to the appropriate location based on the called phone number.
- **AI Templates**: Location-specific templates are used to generate personalized responses.

#### Example Usage:

```javascript
// Get a business with all its locations
const businessWithLocations = await getBusinessWithLocations(businessId);

// Access locations
const locations = businessWithLocations.locations;

// Generate a location-specific auto-reply
const locationResponse = await generateLocationMissedCallResponse(
  location,
  business,
  'growth'
);
```

### 2. AI Training on Documents, SOPs, and FAQ Libraries

*Note: This feature is planned but not yet fully implemented.*

This feature will allow businesses to upload their own documents, standard operating procedures (SOPs), and FAQ libraries to train the AI to generate more accurate and business-specific responses.

### 3. Bulk SMS Campaigns

*Note: This feature is planned but not yet fully implemented.*

This feature will allow businesses to send bulk SMS campaigns for promotions, follow-ups, and review requests to their customers.

### 4. Advanced Analytics Dashboard

*Note: This feature is planned but not yet fully implemented.*

This feature will provide detailed analytics on response rates, lead conversions, and other key metrics to help businesses optimize their communication strategies.

### 5. SLA Response Time Guarantee

*Note: This feature is planned but not yet fully implemented.*

This feature will monitor response times and alert businesses when they are approaching SLA breaches, ensuring that all customer inquiries are addressed in a timely manner.

## Testing Multi-Location Support

To test the multi-location support feature, you can use the provided test script:

```bash
node scripts/test-multi-location.js
```

This script will:
1. Create a test business with multiple locations
2. Generate auto-replies for the main business and each location
3. Display the generated responses
4. Clean up the test data

## Implementation Notes

The multi-location support feature has been implemented with a focus on:

1. **Scalability**: The system can handle businesses with any number of locations.
2. **Flexibility**: Each location can have its own settings and configuration.
3. **Personalization**: Auto-replies are customized for each location.
4. **Efficiency**: The system uses a single API endpoint for handling missed calls, with intelligent routing based on the called phone number.

## Next Steps

After implementing the multi-location support feature, the next steps are:

1. Implement the AI training on documents feature
2. Implement the bulk SMS campaigns feature
3. Implement the advanced analytics dashboard
4. Implement the SLA response time guarantee

These features will complete the Growth Plan offering and provide businesses with a comprehensive solution for scaling their communication and automation.
