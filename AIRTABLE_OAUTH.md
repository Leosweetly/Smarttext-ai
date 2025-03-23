# Airtable OAuth Integration

This document explains how to set up and use the Airtable OAuth integration in the SmartText AI application.

## Overview

SmartText AI uses Airtable to store and manage business data, including business information, hours, and FAQs. The application connects to Airtable using OAuth 2.0 authentication, which provides a secure way to access Airtable data without storing API keys in the application.

## Prerequisites

To use the Airtable OAuth integration, you need:

1. An Airtable account
2. An Airtable base with the required tables (Businesses, etc.)
3. An Airtable OAuth application (created at https://airtable.com/create/oauth)

## Setting Up the OAuth Application

1. Go to [airtable.com/create/oauth](https://airtable.com/create/oauth)
2. Click "Create an OAuth application"
3. Fill in the required information:
   - **Name**: "SmartText AI" (or your preferred application name)
   - **OAuth redirect URL**: The URL where Airtable will redirect users after authorization
     - For local development: `http://localhost:3000/api/auth/airtable/callback`
     - For production: `https://getsmarttext.com/api/auth/airtable/callback`
   - **Scopes**: Select the following scopes:
     - `data.records:read` (to read records from tables)
     - `data.records:write` (to create/update records)
     - `schema.bases:read` (to read base metadata)
4. Complete the registration and note your **Client ID** and **Client Secret**

## Environment Variables

Add the following environment variables to your `.env.local` file:

```
# Airtable OAuth credentials
AIRTABLE_CLIENT_ID=your_client_id
AIRTABLE_CLIENT_SECRET=your_client_secret
AIRTABLE_REDIRECT_URI=your_redirect_uri
AIRTABLE_BASE_ID=your_base_id
```

## Connecting to Airtable

Users can connect to Airtable from the Settings page in the dashboard. The connection process involves:

1. Clicking the "Connect to Airtable" button
2. Being redirected to Airtable's authorization page
3. Granting permission to the application
4. Being redirected back to the application

Once connected, the application will store the OAuth tokens securely in HTTP-only cookies.

## Implementation Details

### OAuth Flow

The OAuth flow is implemented using the following components:

1. **Authorization Endpoint** (`/api/auth/airtable/authorize`): Redirects the user to Airtable's authorization page
2. **Callback Endpoint** (`/api/auth/airtable/callback`): Handles the callback from Airtable, exchanges the authorization code for tokens, and stores them in cookies
3. **Status Endpoint** (`/api/auth/airtable/status`): Checks if the user is connected to Airtable
4. **Disconnect Endpoint** (`/api/auth/airtable/disconnect`): Disconnects the user from Airtable by removing the tokens

### OAuth Client

The OAuth client (`lib/data/airtable-oauth-client.js`) provides functions for:

1. Getting and refreshing access tokens
2. Making authenticated requests to the Airtable API
3. Working with Airtable data (getting records, creating records, etc.)

### Business Data Access

The business data access functions (`lib/data/business-oauth.js`) provide a layer of abstraction over the Airtable API, making it easier to work with business data.

## Testing the Integration

### Local Testing

For local development, use the `scripts/test-airtable-oauth-local.js` script:

```bash
node scripts/test-airtable-oauth-local.js
```

This script will:

1. Check if the OAuth credentials are set correctly for local development
2. Generate an authorization URL
3. Guide you through the authorization process
4. Exchange the authorization code for tokens
5. Test API access with the access token

### Production Testing

For production testing, use the `scripts/test-airtable-oauth.js` script:

```bash
node scripts/test-airtable-oauth.js
```

This script works similarly to the local testing script but is configured for production use.

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**: Make sure the redirect URI in your Airtable OAuth application matches the one in your environment variables.
   - For local development: `http://localhost:3000/api/auth/airtable/callback`
   - For production: `https://getsmarttext.com/api/auth/airtable/callback`
   
2. **Missing Scopes**: Make sure your Airtable OAuth application has the required scopes:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
   
3. **Invalid Client ID or Secret**: Make sure your client ID and secret are correct.

4. **Token Expiration**: Access tokens expire after a certain time. The application will automatically refresh them if a refresh token is available.

5. **Local Development Issues**: For local development, make sure:
   - Your `.env.local` file has `AIRTABLE_REDIRECT_URI` set to `http://localhost:3000/api/auth/airtable/callback`
   - You've added this local redirect URI to your Airtable OAuth application settings
   - Your local development server is running on port 3000

### Debugging

If you encounter issues with the OAuth integration, you can:

1. Check the browser console for errors
2. Check the server logs for errors
3. Use the `scripts/test-airtable-oauth.js` script to test the integration
4. Check the network tab in your browser's developer tools to see the requests and responses

## Security Considerations

The Airtable OAuth integration uses the following security measures:

1. **HTTPS**: All communication with Airtable is done over HTTPS.
2. **HTTP-Only Cookies**: OAuth tokens are stored in HTTP-only cookies, which cannot be accessed by JavaScript.
3. **Secure Cookies**: In production, cookies are marked as secure, which means they are only sent over HTTPS.
4. **Token Refresh**: Access tokens are refreshed automatically when they expire.
5. **Scoped Access**: The application only requests the scopes it needs.

## References

- [Airtable OAuth Documentation](https://airtable.com/developers/web/api/oauth-reference)
- [OAuth 2.0 Specification](https://oauth.net/2/)
