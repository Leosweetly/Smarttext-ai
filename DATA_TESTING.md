# Data Module Testing

This document provides an overview of the Data module testing process and results.

## Overview

The Data module in SmartText AI is built on Airtable and provides functionality for managing business data in the application. It consists of:

1. **Airtable Client** (`lib/data/airtable-client.js`):
   - Initializes connection to Airtable using API key and base ID
   - Provides `getTable` function to access Airtable tables
   - Includes `exploreTableSchema` function to examine table structure

2. **Business Data Functions** (`lib/data/business.js`):
   - CRUD operations for business entities
   - Functions include: `getBusinesses`, `getBusinessById`, `getBusinessesByType`, `getBusinessByPhoneNumber`, `updateBusiness`, `createBusiness`
   - Specialized functions: `getRestaurants`, `getAutoShops`

3. **Server Actions** (`lib/data/server-actions.js`):
   - Next.js server actions for data fetching
   - Functions include: `fetchBusinessesByType`, `fetchRestaurants`, `fetchAutoShops`

4. **Utility Scripts**:
   - `scripts/explore-airtable.js` - Explores Airtable schema
   - `scripts/add-test-business.js` - Adds test business to Airtable

## Testing Approach

We created a test script (`scripts/test-airtable-connection.js`) that tests the Airtable connection and basic functionality. The script tests:

1. **Airtable Connection**:
   - Verifies that Airtable credentials are set in environment variables
   - Tests connection to the Airtable base
   - Explores the Businesses table schema

2. **Business Data Retrieval**:
   - Tests retrieving all businesses
   - Tests retrieving a business by ID
   - Tests retrieving businesses by type
   - Tests retrieving a business by phone number

3. **Business Creation and Updates**:
   - Tests creating a new test business
   - Tests updating the test business
   - Marks the test business for deletion

## Test Results

The tests encountered authorization issues with the Airtable API. The main findings are:

- Airtable credentials are present in the environment variables
- The API key does not have the necessary permissions to access the Airtable base
- The error message "You are not authorized to perform this operation" suggests that the API key needs to be updated or the permissions need to be adjusted

## Setting Up Airtable for Full Integration Testing

To perform full integration testing with Airtable:

1. **Create an Airtable Account**:
   - Sign up at [Airtable](https://airtable.com/)
   - Create a new base for testing

2. **Create the Businesses Table**:
   - Create a table named "Businesses" with the following fields:
     - Name (Single line text)
     - Business Type (Single line text)
     - Phone Number (Single line text)
     - Address (Single line text)
     - Hours JSON (Long text)
     - FAQs JSON (Long text)
     - Subscription Tier (Single line text)
     - Trial Ends At (Date)
     - Online Ordering Link (URL)
     - Quote Link (URL)
     - Booking Link (URL)
     - Services (Multiple select)
     - Custom Settings (Long text)

3. **Generate an API Key**:
   - Go to your [Airtable account page](https://airtable.com/account)
   - Generate a personal access token with the following scopes:
     - `data.records:read` - To read records
     - `data.records:write` - To create and update records
     - `schema.bases:read` - To read base schema

4. **Add Airtable Credentials to .env.local**:
   ```
   # Airtable credentials
   AIRTABLE_API_KEY=your_api_key
   AIRTABLE_BASE_ID=your_base_id
   ```

5. **Run the Tests**:
   ```
   node scripts/test-airtable-connection.js
   ```

## Troubleshooting

If you encounter authorization issues:

1. **Check API Key Permissions**:
   - Ensure the API key has the necessary scopes (data.records:read, data.records:write, schema.bases:read)
   - Verify that the API key is active and not expired

2. **Check Base Access**:
   - Ensure the Airtable account associated with the API key has access to the base
   - Check if the base ID is correct

3. **Check Table Names**:
   - Ensure the table names in the code match the actual table names in Airtable
   - Table names are case-sensitive

## Manual Testing

In addition to automated testing, manual testing can be performed to verify the Data module functionality:

1. **Explore Airtable Schema**:
   - Run `node scripts/explore-airtable.js` to explore the Airtable schema
   - Verify that the tables and fields match the expected structure

2. **Add Test Business**:
   - Run `node scripts/add-test-business.js` to add a test business to Airtable
   - Verify that the business is created in Airtable

3. **Test Server Actions**:
   - Start the Next.js development server with `npm run dev`
   - Navigate to the restaurants page to test `fetchRestaurants`
   - Navigate to the auto shops page to test `fetchAutoShops`

## Conclusion

The Data module is well-structured and follows best practices for data management with Airtable. The tests provide a good foundation for testing, but proper Airtable credentials with the necessary permissions are required for full integration testing.
