/**
 * API routes for specific conversation operations
 * 
 * These routes handle operations on individual conversations in the shared team inbox.
 */

import { NextResponse } from 'next/server';
import { 
  getConversationById,
  getConversationWithMessages,
  updateConversation,
  assignConversation,
  resolveConversation,
  reopenConversation,
  archiveConversation
} from '../../../../lib/inbox';
import { getSession } from '../auth-utils';

/**
 * GET /api/inbox/[conversationId]
 * Get a specific conversation
 * 
 * Query parameters:
 * - includeMessages: Whether to include messages (default: false)
 */
export async function GET(request, { params }) {
  try {
    // Get the session
    const session = await getSession(request, new Response());
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeMessages = searchParams.get('includeMessages') === 'true';
    
    // Get the conversation
    let conversation;
    if (includeMessages) {
      conversation = await getConversationWithMessages(conversationId);
    } else {
      conversation = await getConversationById(conversationId);
    }
    
    // Check if the conversation exists
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    // Check if the conversation belongs to the user's business
    if (conversation.businessId !== businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get assignment information
    if (conversation) {
      const { getActiveAssignment } = await import('../../../../lib/inbox/assignments');
      const activeAssignment = await getActiveAssignment(conversationId);
      
      if (activeAssignment) {
        conversation.activeAssignment = activeAssignment;
      }
    }
    
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error(`Error in GET /api/inbox/${params.conversationId}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/inbox/[conversationId]
 * Update a conversation
 * 
 * Request body:
 * - status: The status of the conversation
 * - priority: The priority of the conversation
 * - customerName: The name of the customer
 * - customerId: The ID of the customer
 */
export async function PUT(request, { params }) {
  try {
    // Get the session
    const session = await getSession(request, new Response());
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
    
    // Update the conversation
    const updatedConversation = await updateConversation(conversationId, {
      ...body,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ conversation: updatedConversation });
  } catch (error) {
    console.error(`Error in PUT /api/inbox/${params.conversationId}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Note: Custom route handlers like POST_ASSIGN, POST_RESOLVE, POST_REOPEN, and POST_ARCHIVE are not supported in Next.js
// These have been removed to fix build issues
