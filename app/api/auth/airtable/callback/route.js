import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Handles the OAuth callback from Airtable
 * Exchanges the authorization code for access and refresh tokens
 * 
 * @param {Request} request - The incoming request
 * @returns {NextResponse} Redirect to dashboard or error response
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  // Handle error from Airtable
  if (error) {
    console.error('Airtable OAuth error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=airtable_auth_failed', request.url));
  }
  
  // Check for authorization code
  if (!code) {
    console.error('Authorization code missing');
    return NextResponse.redirect(new URL('/dashboard?error=missing_code', request.url));
  }
  
  try {
    // Exchange the authorization code for an access token
    const tokenResponse = await fetch('https://airtable.com/oauth2/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.AIRTABLE_CLIENT_ID}:${process.env.AIRTABLE_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.AIRTABLE_REDIRECT_URI
      })
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect(new URL('/dashboard?error=token_exchange_failed', request.url));
    }
    
    const tokenData = await tokenResponse.json();
    
    // Store the tokens securely in HTTP-only cookies
    const cookieStore = cookies();
    
    // Set access token cookie
    cookieStore.set({
      name: 'airtable_access_token',
      value: tokenData.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokenData.expires_in,
      path: '/'
    });
    
    // Set refresh token cookie
    cookieStore.set({
      name: 'airtable_refresh_token',
      value: tokenData.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });
    
    // Redirect to dashboard with success message
    return NextResponse.redirect(new URL('/dashboard?success=airtable_connected', request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=internal_server_error', request.url));
  }
}
