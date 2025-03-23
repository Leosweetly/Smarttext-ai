import { NextResponse } from 'next/server';
import { isConnectedToAirtable } from '../../../../../lib/data/airtable-oauth-client';

/**
 * API endpoint to check if the user is connected to Airtable
 * 
 * @returns {NextResponse} JSON response with connection status
 */
export async function GET() {
  try {
    const connected = await isConnectedToAirtable();
    
    return NextResponse.json({ connected });
  } catch (error) {
    console.error('Error checking Airtable connection status:', error);
    return NextResponse.json(
      { error: 'Failed to check Airtable connection status' },
      { status: 500 }
    );
  }
}
