/**
 * Inbox Module
 * 
 * This module provides functionality for managing conversations in the shared team inbox.
 * It handles conversation creation, retrieval, updating, and deletion.
 */

import { nanoid } from 'nanoid';

// Conversation status constants
export const CONVERSATION_STATUS = {
  NEW: 'new',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  ARCHIVED: 'archived'
};

// Conversation priority constants
export const CONVERSATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Create a new conversation
 * @param {Object} conversation - The conversation to create
 * @param {string} conversation.businessId - The ID of the business
 * @param {string} conversation.customerId - The ID of the customer (optional)
 * @param {string} conversation.customerPhone - The phone number of the customer
 * @param {string} conversation.customerName - The name of the customer (optional)
 * @param {string} conversation.status - The status of the conversation (default: 'new')
 * @param {string} conversation.priority - The priority of the conversation (default: 'medium')
 * @param {string} conversation.source - The source of the conversation (e.g., 'sms', 'missed_call')
 * @param {string} conversation.initialMessage - The initial message of the conversation (optional)
 * @returns {Promise<Object>} - The created conversation
 */
export async function createConversation({
  businessId,
  customerId,
  customerPhone,
  customerName,
  status = CONVERSATION_STATUS.NEW,
  priority = CONVERSATION_PRIORITY.MEDIUM,
  source,
  initialMessage
}) {
  try {
    // Validate inputs
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    if (!customerPhone) {
      throw new Error('Customer phone number is required');
    }
    
    if (!source) {
      throw new Error('Conversation source is required');
    }
    
    // Create conversation object
    const conversation = {
      id: nanoid(),
      businessId,
      customerId,
      customerPhone,
      customerName: customerName || 'Unknown',
      status,
      priority,
      source,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessageAt: initialMessage ? new Date().toISOString() : null,
      assignedTo: null,
      assignedBy: null,
      assignedAt: null,
      resolvedAt: null,
      resolvedBy: null,
      archivedAt: null,
      archivedBy: null
    };
    
    // Store in database
    const { createRecord } = await import('../data');
    const createdConversation = await createRecord('conversations', conversation);
    
    // If there's an initial message, create it
    if (initialMessage) {
      const { createMessage } = await import('./messages');
      await createMessage({
        conversationId: createdConversation.id,
        content: initialMessage,
        sender: 'customer',
        senderType: 'customer',
        businessId
      });
    }
    
    return createdConversation;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

/**
 * Get a conversation by ID
 * @param {string} id - The ID of the conversation to get
 * @returns {Promise<Object>} - The conversation
 */
export async function getConversationById(id) {
  try {
    if (!id) {
      throw new Error('Conversation ID is required');
    }
    
    const { getRecordById } = await import('../data');
    const conversation = await getRecordById('conversations', id);
    
    return conversation;
  } catch (error) {
    console.error(`Error getting conversation with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get a conversation with messages
 * @param {string} id - The ID of the conversation to get
 * @returns {Promise<Object>} - The conversation with messages
 */
export async function getConversationWithMessages(id) {
  try {
    // Get the conversation
    const conversation = await getConversationById(id);
    
    if (!conversation) {
      return null;
    }
    
    // Get the messages
    const { getMessagesByConversationId } = await import('./messages');
    const messages = await getMessagesByConversationId(id);
    
    // Return the conversation with messages
    return {
      ...conversation,
      messages
    };
  } catch (error) {
    console.error(`Error getting conversation with messages for ID ${id}:`, error);
    throw error;
  }
}

/**
 * Update a conversation
 * @param {string} id - The ID of the conversation to update
 * @param {Object} updates - The updates to apply
 * @returns {Promise<Object>} - The updated conversation
 */
export async function updateConversation(id, updates) {
  try {
    if (!id) {
      throw new Error('Conversation ID is required');
    }
    
    // Get the existing conversation
    const existingConversation = await getConversationById(id);
    
    if (!existingConversation) {
      throw new Error(`Conversation with ID ${id} not found`);
    }
    
    // Apply updates
    const updatedConversation = {
      ...existingConversation,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Handle status changes
    if (updates.status) {
      // If status changed to resolved, set resolvedAt and resolvedBy
      if (updates.status === CONVERSATION_STATUS.RESOLVED && existingConversation.status !== CONVERSATION_STATUS.RESOLVED) {
        updatedConversation.resolvedAt = new Date().toISOString();
        updatedConversation.resolvedBy = updates.resolvedBy || null;
      }
      
      // If status changed to archived, set archivedAt and archivedBy
      if (updates.status === CONVERSATION_STATUS.ARCHIVED && existingConversation.status !== CONVERSATION_STATUS.ARCHIVED) {
        updatedConversation.archivedAt = new Date().toISOString();
        updatedConversation.archivedBy = updates.archivedBy || null;
      }
    }
    
    // Store in database
    const { updateRecord } = await import('../data');
    const result = await updateRecord('conversations', id, updatedConversation);
    
    return result;
  } catch (error) {
    console.error(`Error updating conversation with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Assign a conversation to a user
 * @param {string} conversationId - The ID of the conversation to assign
 * @param {string} userId - The ID of the user to assign to
 * @param {string} assignedBy - The ID of the user making the assignment
 * @returns {Promise<Object>} - The updated conversation
 */
export async function assignConversation(conversationId, userId, assignedBy) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Update the conversation
    const updatedConversation = await updateConversation(conversationId, {
      assignedTo: userId,
      assignedBy,
      assignedAt: new Date().toISOString(),
      status: CONVERSATION_STATUS.ASSIGNED
    });
    
    // Create an assignment record
    const { createAssignment } = await import('./assignments');
    await createAssignment({
      conversationId,
      assignedTo: userId,
      assignedBy,
      businessId: updatedConversation.businessId
    });
    
    return updatedConversation;
  } catch (error) {
    console.error(`Error assigning conversation ${conversationId} to user ${userId}:`, error);
    throw error;
  }
}

/**
 * Resolve a conversation
 * @param {string} conversationId - The ID of the conversation to resolve
 * @param {string} resolvedBy - The ID of the user resolving the conversation
 * @returns {Promise<Object>} - The updated conversation
 */
export async function resolveConversation(conversationId, resolvedBy) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    
    // Update the conversation
    const updatedConversation = await updateConversation(conversationId, {
      status: CONVERSATION_STATUS.RESOLVED,
      resolvedBy
    });
    
    return updatedConversation;
  } catch (error) {
    console.error(`Error resolving conversation ${conversationId}:`, error);
    throw error;
  }
}

/**
 * Archive a conversation
 * @param {string} conversationId - The ID of the conversation to archive
 * @param {string} archivedBy - The ID of the user archiving the conversation
 * @returns {Promise<Object>} - The updated conversation
 */
export async function archiveConversation(conversationId, archivedBy) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    
    // Update the conversation
    const updatedConversation = await updateConversation(conversationId, {
      status: CONVERSATION_STATUS.ARCHIVED,
      archivedBy
    });
    
    return updatedConversation;
  } catch (error) {
    console.error(`Error archiving conversation ${conversationId}:`, error);
    throw error;
  }
}

/**
 * Reopen a conversation
 * @param {string} conversationId - The ID of the conversation to reopen
 * @returns {Promise<Object>} - The updated conversation
 */
export async function reopenConversation(conversationId) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    
    // Get the existing conversation
    const conversation = await getConversationById(conversationId);
    
    if (!conversation) {
      throw new Error(`Conversation with ID ${conversationId} not found`);
    }
    
    // Determine the new status based on assignment
    const newStatus = conversation.assignedTo 
      ? CONVERSATION_STATUS.ASSIGNED 
      : CONVERSATION_STATUS.NEW;
    
    // Update the conversation
    const updatedConversation = await updateConversation(conversationId, {
      status: newStatus,
      resolvedAt: null,
      resolvedBy: null,
      archivedAt: null,
      archivedBy: null
    });
    
    return updatedConversation;
  } catch (error) {
    console.error(`Error reopening conversation ${conversationId}:`, error);
    throw error;
  }
}

/**
 * Get conversations for a business
 * @param {string} businessId - The ID of the business
 * @param {Object} [options] - Additional options
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.assignedTo] - Filter by assigned user
 * @param {string} [options.priority] - Filter by priority
 * @param {boolean} [options.includeArchived=false] - Whether to include archived conversations
 * @param {string} [options.sortBy='updatedAt'] - The field to sort by
 * @param {string} [options.sortDirection='desc'] - The sort direction ('asc' or 'desc')
 * @param {number} [options.limit] - The maximum number of conversations to return
 * @param {number} [options.offset] - The offset for pagination
 * @returns {Promise<Array<Object>>} - The conversations
 */
export async function getConversationsByBusinessId(businessId, options = {}) {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Set default options
    const {
      status,
      assignedTo,
      priority,
      includeArchived = false,
      sortBy = 'updatedAt',
      sortDirection = 'desc',
      limit,
      offset
    } = options;
    
    // Build filter formula
    let filterFormula = `{businessId} = '${businessId}'`;
    
    if (status) {
      filterFormula = `AND(${filterFormula}, {status} = '${status}')`;
    } else if (!includeArchived) {
      filterFormula = `AND(${filterFormula}, {status} != '${CONVERSATION_STATUS.ARCHIVED}')`;
    }
    
    if (assignedTo) {
      filterFormula = `AND(${filterFormula}, {assignedTo} = '${assignedTo}')`;
    }
    
    if (priority) {
      filterFormula = `AND(${filterFormula}, {priority} = '${priority}')`;
    }
    
    // Get conversations
    const { queryRecords } = await import('../data');
    const conversations = await queryRecords('conversations', {
      filterByFormula: filterFormula,
      sort: [{ field: sortBy, direction: sortDirection }],
      maxRecords: limit,
      offset
    });
    
    return conversations || [];
  } catch (error) {
    console.error(`Error getting conversations for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Get conversations for a customer
 * @param {string} customerPhone - The phone number of the customer
 * @param {string} businessId - The ID of the business
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.includeArchived=false] - Whether to include archived conversations
 * @param {string} [options.sortBy='updatedAt'] - The field to sort by
 * @param {string} [options.sortDirection='desc'] - The sort direction ('asc' or 'desc')
 * @returns {Promise<Array<Object>>} - The conversations
 */
export async function getConversationsByCustomerPhone(customerPhone, businessId, options = {}) {
  try {
    if (!customerPhone) {
      throw new Error('Customer phone number is required');
    }
    
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Set default options
    const {
      includeArchived = false,
      sortBy = 'updatedAt',
      sortDirection = 'desc'
    } = options;
    
    // Build filter formula
    let filterFormula = `AND({customerPhone} = '${customerPhone}', {businessId} = '${businessId}')`;
    
    if (!includeArchived) {
      filterFormula = `AND(${filterFormula}, {status} != '${CONVERSATION_STATUS.ARCHIVED}')`;
    }
    
    // Get conversations
    const { queryRecords } = await import('../data');
    const conversations = await queryRecords('conversations', {
      filterByFormula: filterFormula,
      sort: [{ field: sortBy, direction: sortDirection }]
    });
    
    return conversations || [];
  } catch (error) {
    console.error(`Error getting conversations for customer ${customerPhone}:`, error);
    throw error;
  }
}

/**
 * Search conversations
 * @param {string} businessId - The ID of the business
 * @param {string} query - The search query
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.includeArchived=false] - Whether to include archived conversations
 * @param {string} [options.sortBy='updatedAt'] - The field to sort by
 * @param {string} [options.sortDirection='desc'] - The sort direction ('asc' or 'desc')
 * @returns {Promise<Array<Object>>} - The matching conversations
 */
export async function searchConversations(businessId, query, options = {}) {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    if (!query || query.trim() === '') {
      return [];
    }
    
    // Set default options
    const {
      includeArchived = false,
      sortBy = 'updatedAt',
      sortDirection = 'desc'
    } = options;
    
    // First, search conversations by customer name or phone
    let filterFormula = `AND({businessId} = '${businessId}', OR(
      SEARCH('${query.trim().toLowerCase()}', LOWER({customerName})),
      SEARCH('${query.trim().toLowerCase()}', LOWER({customerPhone}))
    ))`;
    
    if (!includeArchived) {
      filterFormula = `AND(${filterFormula}, {status} != '${CONVERSATION_STATUS.ARCHIVED}')`;
    }
    
    // Get conversations
    const { queryRecords } = await import('../data');
    const conversations = await queryRecords('conversations', {
      filterByFormula: filterFormula,
      sort: [{ field: sortBy, direction: sortDirection }]
    });
    
    // Then, search messages for the query
    const { searchMessages } = await import('./messages');
    const messageResults = await searchMessages(businessId, query);
    
    // Get conversation IDs from message results
    const conversationIds = messageResults.map(message => message.conversationId);
    
    // Get those conversations if they're not already in the results
    const existingIds = conversations.map(conv => conv.id);
    const missingIds = conversationIds.filter(id => !existingIds.includes(id));
    
    let additionalConversations = [];
    if (missingIds.length > 0) {
      // Get each conversation by ID
      additionalConversations = await Promise.all(
        missingIds.map(id => getConversationById(id))
      );
      
      // Filter out archived conversations if needed
      if (!includeArchived) {
        additionalConversations = additionalConversations.filter(
          conv => conv && conv.status !== CONVERSATION_STATUS.ARCHIVED
        );
      }
    }
    
    // Combine results
    const allConversations = [...conversations, ...additionalConversations];
    
    // Sort results
    allConversations.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return allConversations;
  } catch (error) {
    console.error(`Error searching conversations for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Get conversation statistics for a business
 * @param {string} businessId - The ID of the business
 * @returns {Promise<Object>} - The conversation statistics
 */
export async function getConversationStats(businessId) {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Get all non-archived conversations
    const conversations = await getConversationsByBusinessId(businessId, {
      includeArchived: false
    });
    
    // Calculate statistics
    const stats = {
      total: conversations.length,
      byStatus: {
        [CONVERSATION_STATUS.NEW]: 0,
        [CONVERSATION_STATUS.ASSIGNED]: 0,
        [CONVERSATION_STATUS.IN_PROGRESS]: 0,
        [CONVERSATION_STATUS.RESOLVED]: 0
      },
      byPriority: {
        [CONVERSATION_PRIORITY.LOW]: 0,
        [CONVERSATION_PRIORITY.MEDIUM]: 0,
        [CONVERSATION_PRIORITY.HIGH]: 0,
        [CONVERSATION_PRIORITY.URGENT]: 0
      },
      byAssignee: {}
    };
    
    // Count conversations by status, priority, and assignee
    conversations.forEach(conversation => {
      // Count by status
      if (stats.byStatus[conversation.status] !== undefined) {
        stats.byStatus[conversation.status]++;
      }
      
      // Count by priority
      if (stats.byPriority[conversation.priority] !== undefined) {
        stats.byPriority[conversation.priority]++;
      }
      
      // Count by assignee
      if (conversation.assignedTo) {
        if (!stats.byAssignee[conversation.assignedTo]) {
          stats.byAssignee[conversation.assignedTo] = 0;
        }
        stats.byAssignee[conversation.assignedTo]++;
      }
    });
    
    return stats;
  } catch (error) {
    console.error(`Error getting conversation stats for business ${businessId}:`, error);
    throw error;
  }
}
