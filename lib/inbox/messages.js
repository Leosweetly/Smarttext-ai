/**
 * Messages Module
 * 
 * This module provides functionality for managing messages in conversations.
 * It handles message creation, retrieval, and searching.
 */

import { nanoid } from 'nanoid';

// Message type constants
export const MESSAGE_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  DOCUMENT: 'document',
  SYSTEM: 'system'
};

// Sender type constants
export const SENDER_TYPE = {
  CUSTOMER: 'customer',
  TEAM: 'team',
  SYSTEM: 'system'
};

/**
 * Create a new message
 * @param {Object} message - The message to create
 * @param {string} message.conversationId - The ID of the conversation
 * @param {string} message.content - The content of the message
 * @param {string} message.sender - The ID of the sender (user ID or 'customer')
 * @param {string} message.senderType - The type of sender ('customer', 'team', 'system')
 * @param {string} message.messageType - The type of message ('text', 'image', 'document', 'system')
 * @param {string} message.businessId - The ID of the business
 * @param {Object} [message.metadata] - Additional metadata for the message
 * @returns {Promise<Object>} - The created message
 */
export async function createMessage({
  conversationId,
  content,
  sender,
  senderType = SENDER_TYPE.TEAM,
  messageType = MESSAGE_TYPE.TEXT,
  businessId,
  metadata = {}
}) {
  try {
    // Validate inputs
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    
    if (!content) {
      throw new Error('Message content is required');
    }
    
    if (!sender) {
      throw new Error('Sender is required');
    }
    
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Create message object
    const message = {
      id: nanoid(),
      conversationId,
      content,
      sender,
      senderType,
      messageType,
      businessId,
      metadata,
      createdAt: new Date().toISOString(),
      isRead: senderType !== SENDER_TYPE.CUSTOMER // Team messages are automatically marked as read
    };
    
    // Store in database
    const { createRecord } = await import('../data');
    const createdMessage = await createRecord('messages', message);
    
    // Update the conversation's lastMessageAt
    const { updateConversation } = await import('./index');
    await updateConversation(conversationId, {
      lastMessageAt: new Date().toISOString()
    });
    
    // If the message is from a team member and the conversation is in 'new' status,
    // update it to 'in_progress'
    if (senderType === SENDER_TYPE.TEAM) {
      const { getConversationById, CONVERSATION_STATUS } = await import('./index');
      const conversation = await getConversationById(conversationId);
      
      if (conversation && conversation.status === CONVERSATION_STATUS.NEW) {
        await updateConversation(conversationId, {
          status: CONVERSATION_STATUS.IN_PROGRESS
        });
      }
    }
    
    return createdMessage;
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
}

/**
 * Get a message by ID
 * @param {string} id - The ID of the message to get
 * @returns {Promise<Object>} - The message
 */
export async function getMessageById(id) {
  try {
    if (!id) {
      throw new Error('Message ID is required');
    }
    
    const { getRecordById } = await import('../data');
    const message = await getRecordById('messages', id);
    
    return message;
  } catch (error) {
    console.error(`Error getting message with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get messages for a conversation
 * @param {string} conversationId - The ID of the conversation
 * @param {Object} [options] - Additional options
 * @param {string} [options.sortBy='createdAt'] - The field to sort by
 * @param {string} [options.sortDirection='asc'] - The sort direction ('asc' or 'desc')
 * @param {number} [options.limit] - The maximum number of messages to return
 * @param {number} [options.offset] - The offset for pagination
 * @returns {Promise<Array<Object>>} - The messages
 */
export async function getMessagesByConversationId(conversationId, options = {}) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    
    // Set default options
    const {
      sortBy = 'createdAt',
      sortDirection = 'asc',
      limit,
      offset
    } = options;
    
    // Build filter formula
    const filterFormula = `{conversationId} = '${conversationId}'`;
    
    // Get messages
    const { queryRecords } = await import('../data');
    const messages = await queryRecords('messages', {
      filterByFormula: filterFormula,
      sort: [{ field: sortBy, direction: sortDirection }],
      maxRecords: limit,
      offset
    });
    
    return messages || [];
  } catch (error) {
    console.error(`Error getting messages for conversation ${conversationId}:`, error);
    throw error;
  }
}

/**
 * Mark messages as read
 * @param {string} conversationId - The ID of the conversation
 * @param {string} [userId] - The ID of the user marking the messages as read
 * @returns {Promise<number>} - The number of messages marked as read
 */
export async function markMessagesAsRead(conversationId, userId) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    
    // Get unread messages
    const { queryRecords, updateRecord } = await import('../data');
    const unreadMessages = await queryRecords('messages', {
      filterByFormula: `AND({conversationId} = '${conversationId}', {isRead} = FALSE())`
    });
    
    if (!unreadMessages || unreadMessages.length === 0) {
      return 0;
    }
    
    // Mark messages as read
    const updatePromises = unreadMessages.map(message => 
      updateRecord('messages', message.id, {
        ...message,
        isRead: true,
        readAt: new Date().toISOString(),
        readBy: userId
      })
    );
    
    await Promise.all(updatePromises);
    
    return unreadMessages.length;
  } catch (error) {
    console.error(`Error marking messages as read for conversation ${conversationId}:`, error);
    throw error;
  }
}

/**
 * Get unread message count for a business
 * @param {string} businessId - The ID of the business
 * @param {string} [userId] - The ID of the user (to get unread messages assigned to them)
 * @returns {Promise<Object>} - The unread message counts
 */
export async function getUnreadMessageCount(businessId, userId) {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Build filter formula
    let filterFormula = `AND({businessId} = '${businessId}', {isRead} = FALSE(), {senderType} = '${SENDER_TYPE.CUSTOMER}')`;
    
    // Get unread messages
    const { queryRecords } = await import('../data');
    const unreadMessages = await queryRecords('messages', {
      filterByFormula: filterFormula
    });
    
    if (!unreadMessages || unreadMessages.length === 0) {
      return { total: 0, byConversation: {} };
    }
    
    // Group by conversation
    const byConversation = {};
    unreadMessages.forEach(message => {
      if (!byConversation[message.conversationId]) {
        byConversation[message.conversationId] = 0;
      }
      byConversation[message.conversationId]++;
    });
    
    // If userId is provided, filter to only include conversations assigned to the user
    if (userId) {
      const { getConversationsByBusinessId } = await import('./index');
      const assignedConversations = await getConversationsByBusinessId(businessId, {
        assignedTo: userId
      });
      
      const assignedIds = assignedConversations.map(conv => conv.id);
      
      // Filter byConversation to only include assigned conversations
      Object.keys(byConversation).forEach(convId => {
        if (!assignedIds.includes(convId)) {
          delete byConversation[convId];
        }
      });
    }
    
    // Calculate total
    const total = Object.values(byConversation).reduce((sum, count) => sum + count, 0);
    
    return { total, byConversation };
  } catch (error) {
    console.error(`Error getting unread message count for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Search messages
 * @param {string} businessId - The ID of the business
 * @param {string} query - The search query
 * @param {Object} [options] - Additional options
 * @param {string} [options.conversationId] - Filter by conversation ID
 * @param {string} [options.senderType] - Filter by sender type
 * @param {string} [options.sortBy='createdAt'] - The field to sort by
 * @param {string} [options.sortDirection='desc'] - The sort direction ('asc' or 'desc')
 * @returns {Promise<Array<Object>>} - The matching messages
 */
export async function searchMessages(businessId, query, options = {}) {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    if (!query || query.trim() === '') {
      return [];
    }
    
    // Set default options
    const {
      conversationId,
      senderType,
      sortBy = 'createdAt',
      sortDirection = 'desc'
    } = options;
    
    // Build filter formula
    let filterFormula = `AND({businessId} = '${businessId}', SEARCH('${query.trim().toLowerCase()}', LOWER({content})))`;
    
    if (conversationId) {
      filterFormula = `AND(${filterFormula}, {conversationId} = '${conversationId}')`;
    }
    
    if (senderType) {
      filterFormula = `AND(${filterFormula}, {senderType} = '${senderType}')`;
    }
    
    // Get messages
    const { queryRecords } = await import('../data');
    const messages = await queryRecords('messages', {
      filterByFormula: filterFormula,
      sort: [{ field: sortBy, direction: sortDirection }]
    });
    
    return messages || [];
  } catch (error) {
    console.error(`Error searching messages for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Get recent messages for a business
 * @param {string} businessId - The ID of the business
 * @param {Object} [options] - Additional options
 * @param {number} [options.limit=20] - The maximum number of messages to return
 * @param {string} [options.senderType] - Filter by sender type
 * @returns {Promise<Array<Object>>} - The recent messages
 */
export async function getRecentMessages(businessId, options = {}) {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Set default options
    const {
      limit = 20,
      senderType
    } = options;
    
    // Build filter formula
    let filterFormula = `{businessId} = '${businessId}'`;
    
    if (senderType) {
      filterFormula = `AND(${filterFormula}, {senderType} = '${senderType}')`;
    }
    
    // Get messages
    const { queryRecords } = await import('../data');
    const messages = await queryRecords('messages', {
      filterByFormula: filterFormula,
      sort: [{ field: 'createdAt', direction: 'desc' }],
      maxRecords: limit
    });
    
    return messages || [];
  } catch (error) {
    console.error(`Error getting recent messages for business ${businessId}:`, error);
    throw error;
  }
}
