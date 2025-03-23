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
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

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

/**
 * POST /api/inbox/[conversationId]/assign
 * Assign a conversation to a user
 * 
 * Request body:
 * - userId: The ID of the user to assign to
 * - notes: Optional notes about the assignment
 */
export async function POST_ASSIGN(request, { params }) {
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
    if (!body.userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Assign the conversation
    const assignedConversation = await assignConversation(
      conversationId,
      body.userId,
      session.user.id
    );
    
    // If notes were provided, add them to the assignment
    if (body.notes) {
      const { getActiveAssignment, updateAssignment } = await import('../../../../lib/inbox/assignments');
      const activeAssignment = await getActiveAssignment(conversationId);
      
      if (activeAssignment) {
        await updateAssignment(activeAssignment.id, {
          notes: body.notes
        });
      }
    }
    
    // Create a notification for the assigned user
    const { createAssignmentNotification } = await import('../../../../lib/inbox/notifications');
    await createAssignmentNotification({
      userId: body.userId,
      businessId,
      conversationId,
      assignmentId: assignedConversation.assignedAt, // Using assignedAt as a proxy for assignment ID
      assignedBy: session.user.name || session.user.id,
      customerName: conversation.customerName
    });
    
    return NextResponse.json({ conversation: assignedConversation });
  } catch (error) {
    console.error(`Error in POST /api/inbox/${params.conversationId}/assign:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/inbox/[conversationId]/resolve
 * Resolve a conversation
 */
export async function POST_RESOLVE(request, { params }) {
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
    
    // Resolve the conversation
    const resolvedConversation = await resolveConversation(conversationId, session.user.id);
    
    // Complete the active assignment if there is one
    const { getActiveAssignment, completeAssignment } = await import('../../../../lib/inbox/assignments');
    const activeAssignment = await getActiveAssignment(conversationId);
    
    if (activeAssignment) {
      await completeAssignment(activeAssignment.id, session.user.id);
    }
    
    return NextResponse.json({ conversation: resolvedConversation });
  } catch (error) {
    console.error(`Error in POST /api/inbox/${params.conversationId}/resolve:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/inbox/[conversationId]/reopen
 * Reopen a conversation
 */
export async function POST_REOPEN(request, { params }) {
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
    
    // Reopen the conversation
    const reopenedConversation = await reopenConversation(conversationId);
    
    return NextResponse.json({ conversation: reopenedConversation });
  } catch (error) {
    console.error(`Error in POST /api/inbox/${params.conversationId}/reopen:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/inbox/[conversationId]/archive
 * Archive a conversation
 */
export async function POST_ARCHIVE(request, { params }) {
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
    
    // Archive the conversation
    const archivedConversation = await archiveConversation(conversationId, session.user.id);
    
    return NextResponse.json({ conversation: archivedConversation });
  } catch (error) {
    console.error(`Error in POST /api/inbox/${params.conversationId}/archive:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
