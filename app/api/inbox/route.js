/**
 * API routes for the shared team inbox
 * 
 * These routes handle CRUD operations for conversations in the shared team inbox.
 */

import { NextResponse } from 'next/server';
import { 
  createConversation,
  getConversationById,
  getConversationWithMessages,
  updateConversation,
  getConversationsByBusinessId,
  getConversationsByCustomerPhone,
  searchConversations,
  getConversationStats,
  assignConversation,
  resolveConversation,
  reopenConversation,
  archiveConversation,
  CONVERSATION_STATUS,
  CONVERSATION_PRIORITY
} from '../../../lib/inbox';
import { getSession } from './auth-utils';

/**
 * GET /api/inbox
 * Get conversations for the current business
 * 
 * Query parameters:
 * - status: Filter by status
 * - assignedTo: Filter by assigned user
 * - priority: Filter by priority
 * - search: Search conversations
 * - customerPhone: Filter by customer phone number
 * - includeArchived: Whether to include archived conversations (default: false)
 * - limit: Maximum number of conversations to return
 * - offset: Offset for pagination
 */
export async function GET(request) {
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const customerPhone = searchParams.get('customerPhone');
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')) : undefined;
    
    let conversations;
    
    // Handle different query types
    if (search) {
      // Search conversations
      conversations = await searchConversations(businessId, search, {
        includeArchived,
        sortBy: 'updatedAt',
        sortDirection: 'desc'
      });
    } else if (customerPhone) {
      // Get conversations for a customer
      conversations = await getConversationsByCustomerPhone(customerPhone, businessId, {
        includeArchived
      });
    } else {
      // Get all conversations for the business with filters
      conversations = await getConversationsByBusinessId(businessId, {
        status,
        assignedTo,
        priority,
        includeArchived,
        sortBy: 'updatedAt',
        sortDirection: 'desc',
        limit,
        offset
      });
    }
    
    // Get conversation statistics
    const stats = await getConversationStats(businessId);
    
    return NextResponse.json({ conversations, stats });
  } catch (error) {
    console.error('Error in GET /api/inbox:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/inbox
 * Create a new conversation
 * 
 * Request body:
 * - customerName: The name of the customer
 * - customerPhone: The phone number of the customer
 * - customerId: The ID of the customer (optional)
 * - source: The source of the conversation (e.g., 'sms', 'missed_call')
 * - initialMessage: The initial message of the conversation (optional)
 * - status: The status of the conversation (default: 'new')
 * - priority: The priority of the conversation (default: 'medium')
 */
export async function POST(request) {
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
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.customerPhone) {
      return NextResponse.json({ error: 'Customer phone number is required' }, { status: 400 });
    }
    
    if (!body.source) {
      return NextResponse.json({ error: 'Conversation source is required' }, { status: 400 });
    }
    
    // Create the conversation
    const conversation = await createConversation({
      businessId,
      customerName: body.customerName || 'Unknown',
      customerPhone: body.customerPhone,
      customerId: body.customerId,
      source: body.source,
      initialMessage: body.initialMessage,
      status: body.status || CONVERSATION_STATUS.NEW,
      priority: body.priority || CONVERSATION_PRIORITY.MEDIUM
    });
    
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/inbox:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Note: The GET_STATS function has been removed as it's not a valid Next.js route export
// Stats are now included in the main GET response
