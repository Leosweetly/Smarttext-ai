import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API endpoint to disconnect from Airtable by removing the OAuth tokens
 * 
 * @returns {NextResponse} JSON response with disconnection status
 */
export async function POST() {
  try {
    const cookieStore = cookies();
    
    // Remove the access token cookie
    cookieStore.delete('airtable_access_token');
    
    // Remove the refresh token cookie
    cookieStore.delete('airtable_refresh_token');
    
    return NextResponse.json({ success: true, message: 'Successfully disconnected from Airtable' });
  } catch (error) {
    console.error('Error disconnecting from Airtable:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect from Airtable' },
      { status: 500 }
    );
  }
}
