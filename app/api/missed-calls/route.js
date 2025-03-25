'use server';

import { getTable } from '@/lib/data/airtable-client';
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';

/**
 * GET handler for fetching missed calls
 * @param {Request} req - The request object
 * @returns {Promise<NextResponse>} The response object
 */
export async function GET(req) {
  try {
    console.log('[API] Fetching missed calls');
    
    // Get the user's session
    const session = await getSession(req, new Response());
    
    // If no session is found, return 401 Unauthorized
    if (!session?.user) {
      console.error('[API] Unauthorized access to missed calls');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '7', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Calculate the date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Format dates for Airtable formula
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`[API] Fetching missed calls from ${startDateStr} to ${endDateStr}`);
    
    // Get the missed calls table
    const missedCallsTable = getTable('Missed Calls');
    
    // Query the missed calls table
    const records = await missedCallsTable.select({
      maxRecords: limit,
      sort: [{ field: 'Timestamp', direction: 'desc' }],
      filterByFormula: `AND(
        IS_AFTER({Timestamp}, '${startDateStr}'),
        IS_BEFORE({Timestamp}, '${endDateStr}T23:59:59.999Z')
      )`
    }).firstPage();
    
    // Transform the records
    const missedCalls = records.map(record => ({
      id: record.id,
      phoneNumber: record.get('Phone Number'),
      timestamp: record.get('Timestamp'),
      autoTextSent: record.get('Auto-Text Sent') || false,
      autoTextTimestamp: record.get('Auto-Text Timestamp'),
      businessId: record.get('Business ID'),
      businessName: record.get('Business Name'),
      callDuration: record.get('Call Duration'),
      callStatus: record.get('Call Status'),
    }));
    
    console.log(`[API] Found ${missedCalls.length} missed calls`);
    
    // Return the missed calls
    return NextResponse.json({ missedCalls });
  } catch (error) {
    console.error('[API] Error fetching missed calls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch missed calls' },
      { status: 500 }
    );
  }
}
