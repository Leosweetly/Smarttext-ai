# Airtable OAuth Integration - Quick Start Guide

This guide provides step-by-step instructions for setting up and testing the Airtable OAuth integration locally.

## 1. Set Up Your Airtable OAuth Application

1. Go to [airtable.com/create/oauth](https://airtable.com/create/oauth)
2. Click "Create an OAuth application"
3. Fill in the required information:
   - **Name**: "SmartText AI Local" (or any name you prefer)
   - **OAuth redirect URL**: `http://localhost:3000/api/auth/airtable/callback`
   - **Scopes**: Select the following scopes:
     - `data.records:read`
     - `data.records:write`
     - `schema.bases:read`
4. Complete the registration and note your **Client ID** and **Client Secret**

## 2. Configure Environment Variables

1. Open your `.env.local` file
2. Update the Airtable OAuth credentials:

```
AIRTABLE_CLIENT_ID=your_client_id
AIRTABLE_CLIENT_SECRET=your_client_secret
AIRTABLE_REDIRECT_URI=http://localhost:3000/api/auth/airtable/callback
AIRTABLE_BASE_ID=your_base_id
```

## 3. Test the OAuth Flow

Run the local testing script:

```bash
node scripts/test-airtable-oauth-local.js
```

Follow the instructions in the terminal:
1. Open the authorization URL in your browser
2. Log in to Airtable if prompted
3. Authorize the application
4. You'll be redirected to a URL with an authorization code
5. Copy the authorization code and paste it in the terminal
6. The script will exchange the code for tokens and test API access

## 4. Start Your Development Server

```bash
npm run dev
```

## 5. Test in the Application

1. Open your browser to `http://localhost:3000/dashboard/settings`
2. Find the "Data Connections" section
3. Click the "Connect to Airtable" button
4. Complete the authorization flow
5. You should see a "Connected to Airtable" status

## Troubleshooting

If you encounter issues:

1. **Redirect URI Mismatch**: Make sure the redirect URI in your Airtable OAuth application matches `http://localhost:3000/api/auth/airtable/callback` exactly.

2. **Invalid Client ID or Secret**: Double-check that you've copied the correct values from your Airtable OAuth application.

3. **Server Not Running**: Make sure your local development server is running on port 3000 when testing the OAuth flow.

4. **Cookies Not Working**: If you're having issues with cookies, try clearing your browser cookies and cache.

5. **Console Errors**: Check your browser console and server logs for error messages.

For more detailed information, see the full [AIRTABLE_OAUTH.md](./AIRTABLE_OAUTH.md) documentation.
