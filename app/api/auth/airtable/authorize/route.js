import { NextResponse } from 'next/server';

/**
 * Initiates the OAuth flow by redirecting to Airtable's authorization page
 * 
 * @returns {NextResponse} Redirect to Airtable's authorization page
 */
export async function GET() {
  const authUrl = new URL('https://airtable.com/oauth2/v1/authorize');
  
  authUrl.searchParams.append('client_id', process.env.AIRTABLE_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', process.env.AIRTABLE_REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'data.records:read data.records:write schema.bases:read');
  
  return NextResponse.redirect(authUrl.toString());
}
