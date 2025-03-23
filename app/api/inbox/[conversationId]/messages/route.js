/**
 * API routes for messages in a conversation
 * 
 * These routes handle operations on messages in the shared team inbox.
 */

import { NextResponse } from 'next/server';
import { 
  getConversationById
} from '../../../../../lib/inbox';
import {
  createMessage,
  getMessagesByConversationId,
  markMessagesAsRead,
  MESSAGE_TYPE,
  SENDER_TYPE
} from '../../../../../lib/inbox/messages';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

/**
 * GET /api/inbox/[conversationId]/messages
 * Get messages for a conversation
 * 
 * Query parameters:
 * - limit: Maximum number of messages to return
 * - offset: Offset for pagination
 * - sortDirection: Sort direction ('asc' or 'desc')
 */
export async function GET(request, { params }) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the business ID from the session
    const businessId = session.user.businessId;
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID not found in session' }, { status: 400 });
    }
    
    // Get the conversation ID from the URL
    const conversationId = params.conversationId;
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }
    
    // Get the conversation
    const conversation = await getConversationById(conversationId);
    
    // Check if the conversation exists
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    // Check if the conversation belongs to the user's business
    if (conversation.businessId !== businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')) : undefined;
    const sortDirection = searchParams.get('sortDirection') || 'asc';
    
    // Get messages
    const messages = await getMessagesByConversationId(conversationId, {
      sortBy: 'createdAt',
      sortDirection,
      limit,
      offset
    });
    
    // Mark messages as read
    await markMessagesAsRead(conversationId, session.user.id);
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error(`Error in GET /api/inbox/${params.conversationId}/messages:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/inbox/[conversationId]/messages
 * Create a new message in a conversation
 * 
 * Request body:
 * - content: The content of the message
 * - messageType: The type of message ('text', 'image', 'document', 'system')
 * - metadata: Additional metadata for the message
 */
export async function POST(request, { params }) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the business ID from the session
    const businessId = session.user.businessId;
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID not found in session' }, { status: 400 });
    }
    
    // Get the conversation ID from the URL
    const conversationId = params.conversationId;
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }
    
    // Get the conversation
    const conversation = await getConversationById(conversationId);
    
    // Check if the conversation exists
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    // Check if the conversation belongs to the user's business
    if (conversation.businessId !== businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }
    
    // Create the message
    const message = await createMessage({
      conversationId,
      content: body.content,
      sender: session.user.id,
      senderType: SENDER_TYPE.TEAM,
      messageType: body.messageType || MESSAGE_TYPE.TEXT,
      businessId,
      metadata: body.metadata || {}
    });
    
    // Check for mentions in the message
    if (body.content.includes('@') && body.metadata && body.metadata.mentions) {
      const { createMentionNotification } = await import('../../../../../lib/inbox/notifications');
      
      // Create notifications for mentioned users
      for (const mentionedUserId of body.metadata.mentions) {
        // Don't notify the sender
        if (mentionedUserId !== session.user.id) {
          await createMentionNotification({
            userId: mentionedUserId,
            businessId,
            conversationId,
            messageId: message.id,
            mentionedBy: session.user.name || session.user.id,
            messagePreview: body.content.substring(0, 50) + (body.content.length > 50 ? '...' : '')
          });
        }
      }
    }
    
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error(`Error in POST /api/inbox/${params.conversationId}/messages:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/inbox/[conversationId]/messages/read
 * Mark all messages in a conversation as read
 */
export async function POST_READ(request, { params }) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the business ID from the session
    const businessId = session.user.businessId;
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID not found in session' }, { status: 400 });
    }
    
    // Get the conversation ID from the URL
    const conversationId = params.conversationId;
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }
    
    // Get the conversation
    const conversation = await getConversationById(conversationId);
    
    // Check if the conversation exists
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    // Check if the conversation belongs to the user's business
    if (conversation.businessId !== businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Mark messages as read
    const markedCount = await markMessagesAsRead(conversationId, session.user.id);
    
    return NextResponse.json({ markedCount });
  } catch (error) {
    console.error(`Error in POST /api/inbox/${params.conversationId}/messages/read:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/inbox/[conversationId]/messages/customer
 * Create a new message from a customer in a conversation (for testing)
 * 
 * Request body:
 * - content: The content of the message
 * - customerName: The name of the customer (optional)
 */
export async function POST_CUSTOMER(request, { params }) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the business ID from the session
    const businessId = session.user.businessId;
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID not found in session' }, { status: 400 });
    }
    
    // Get the conversation ID from the URL
    const conversationId = params.conversationId;
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }
    
    // Get the conversation
    const conversation = await getConversationById(conversationId);
    
    // Check if the conversation exists
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    // Check if the conversation belongs to the user's business
    if (conversation.businessId !== businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }
    
    // Create the message
    const message = await createMessage({
      conversationId,
      content: body.content,
      sender: 'customer',
      senderType: SENDER_TYPE.CUSTOMER,
      messageType: MESSAGE_TYPE.TEXT,
      businessId,
      metadata: {
        customerName: body.customerName || conversation.customerName
      }
    });
    
    // Create notifications for assigned user and team members
    if (conversation.assignedTo) {
      const { createNewMessageNotification } = await import('../../../../../lib/inbox/notifications');
      
      await createNewMessageNotification({
        userId: conversation.assignedTo,
        businessId,
        conversationId,
        messageId: message.id,
        senderName: body.customerName || conversation.customerName || 'Customer',
        messagePreview: body.content.substring(0, 50) + (body.content.length > 50 ? '...' : '')
      });
    }
    
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error(`Error in POST /api/inbox/${params.conversationId}/messages/customer:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
