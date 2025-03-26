'use server';

import { getTable } from '../../../lib/data/airtable-client';
import { NextResponse } from 'next/server';
import { getSession } from './auth-utils';

/**
 * GET handler for fetching conversations
 * @param {Request} req - The request object
 * @returns {Promise<NextResponse>} The response object
 */
export async function GET(req) {
  try {
    console.log('[API] Fetching conversations');
    
    // Get the user's session
    const session = await getSession(req, new Response());
    
    // If no session is found, return 401 Unauthorized
    if (!session?.user) {
      console.error('[API] Unauthorized access to conversations');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Get the conversations table
    const conversationsTable = getTable('Conversations');
    
    // Query the conversations table
    const records = await conversationsTable.select({
      maxRecords: limit,
      sort: [{ field: 'Last Message Date', direction: 'desc' }]
    }).firstPage();
    
    // Transform the records
    const conversations = records.map(record => ({
      id: record.id,
      contactName: record.get('Contact Name') || 'Unknown',
      contactPhone: record.get('Contact Phone'),
      lastMessageDate: record.get('Last Message Date'),
      lastMessageText: record.get('Last Message Text'),
      lastMessageDirection: record.get('Last Message Direction') || 'inbound',
      unreadCount: record.get('Unread Count') || 0,
      businessId: record.get('Business ID'),
      businessName: record.get('Business Name'),
    }));
    
    console.log(`[API] Found ${conversations.length} conversations`);
    
    // Return the conversations
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('[API] Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for sending a message in a conversation
 * @param {Request} req - The request object
 * @returns {Promise<NextResponse>} The response object
 */
export async function POST(req) {
  try {
    console.log('[API] Sending message');
    
    // Get the user's session
    const session = await getSession(req, new Response());
    
    // If no session is found, return 401 Unauthorized
    if (!session?.user) {
      console.error('[API] Unauthorized attempt to send message');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get the request body
    const body = await req.json();
    const { conversationId, message, toPhone } = body;
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    if (!conversationId && !toPhone) {
      return NextResponse.json(
        { error: 'Either conversationId or toPhone is required' },
        { status: 400 }
      );
    }
    
    // Get the messages table
    const messagesTable = getTable('Messages');
    
    // Create a new message
    const newMessage = {
      'Message Text': message,
      'Direction': 'outbound',
      'Timestamp': new Date().toISOString(),
      'Status': 'sent',
      'Sent By': session.user.email,
    };
    
    if (conversationId) {
      newMessage['Conversation ID'] = conversationId;
    } else {
      // Create a new conversation if needed
      const conversationsTable = getTable('Conversations');
      const newConversation = await conversationsTable.create({
        'Contact Phone': toPhone,
        'Last Message Date': new Date().toISOString(),
        'Last Message Text': message,
        'Last Message Direction': 'outbound',
        'Unread Count': 0,
      });
      
      newMessage['Conversation ID'] = newConversation.id;
    }
    
    // Save the message
    const createdMessage = await messagesTable.create(newMessage);
    
    // Update the conversation with the latest message
    if (conversationId) {
      const conversationsTable = getTable('Conversations');
      await conversationsTable.update(conversationId, {
        'Last Message Date': new Date().toISOString(),
        'Last Message Text': message,
        'Last Message Direction': 'outbound',
      });
    }
    
    // Return the created message
    return NextResponse.json({
      success: true,
      message: {
        id: createdMessage.id,
        text: message,
        direction: 'outbound',
        timestamp: new Date().toISOString(),
        status: 'sent',
        sentBy: session.user.email,
      }
    });
  } catch (error) {
    console.error('[API] Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
