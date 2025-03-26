'use server';

import { getTable } from '../../../../lib/data/airtable-client';
import { NextResponse } from 'next/server';
import { getSession } from '../auth-utils';

/**
 * GET handler for fetching messages for a conversation
 * @param {Request} req - The request object
 * @returns {Promise<NextResponse>} The response object
 */
export async function GET(req) {
  try {
    // Get the user's session
    const session = await getSession(req, new Response());
    
    // If no session is found, return 401 Unauthorized
    if (!session?.user) {
      console.error('[API] Unauthorized access to messages');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`[API] Fetching messages for conversation ${conversationId}`);
    
    // Get the messages table
    const messagesTable = getTable('Messages');
    
    // Query the messages table
    const records = await messagesTable.select({
      filterByFormula: `{Conversation ID} = '${conversationId}'`,
      sort: [{ field: 'Timestamp', direction: 'asc' }]
    }).firstPage();
    
    // Transform the records
    const messages = records.map(record => ({
      id: record.id,
      text: record.get('Message Text'),
      direction: record.get('Direction'),
      timestamp: record.get('Timestamp'),
      status: record.get('Status') || 'delivered',
      sentBy: record.get('Sent By'),
    }));
    
    console.log(`[API] Found ${messages.length} messages for conversation ${conversationId}`);
    
    // Mark conversation as read
    try {
      const conversationsTable = getTable('Conversations');
      await conversationsTable.update(conversationId, {
        'Unread Count': 0
      });
      console.log(`[API] Marked conversation ${conversationId} as read`);
    } catch (error) {
      console.error(`[API] Error marking conversation ${conversationId} as read:`, error);
      // Continue even if marking as read fails
    }
    
    // Return the messages
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[API] Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
