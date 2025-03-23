/**
 * Notifications Module
 * 
 * This module provides functionality for managing inbox notifications.
 * It handles notification creation, retrieval, and delivery.
 */

import { nanoid } from 'nanoid';

// Notification type constants
export const NOTIFICATION_TYPE = {
  NEW_CONVERSATION: 'new_conversation',
  NEW_MESSAGE: 'new_message',
  ASSIGNMENT: 'assignment',
  MENTION: 'mention',
  RESOLVED: 'resolved',
  REOPENED: 'reopened',
  PRIORITY_CHANGE: 'priority_change',
  REMINDER: 'reminder'
};

// Notification priority constants
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Create a new notification
 * @param {Object} notification - The notification to create
 * @param {string} notification.userId - The ID of the user to notify
 * @param {string} notification.businessId - The ID of the business
 * @param {string} notification.type - The type of notification
 * @param {string} notification.title - The title of the notification
 * @param {string} notification.message - The message of the notification
 * @param {string} [notification.priority='medium'] - The priority of the notification
 * @param {string} [notification.entityId] - The ID of the related entity (conversation, message, etc.)
 * @param {string} [notification.entityType] - The type of the related entity
 * @param {Object} [notification.metadata] - Additional metadata for the notification
 * @returns {Promise<Object>} - The created notification
 */
export async function createNotification({
  userId,
  businessId,
  type,
  title,
  message,
  priority = NOTIFICATION_PRIORITY.MEDIUM,
  entityId = null,
  entityType = null,
  metadata = {}
}) {
  try {
    // Validate inputs
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    if (!type) {
      throw new Error('Notification type is required');
    }
    
    if (!title) {
      throw new Error('Notification title is required');
    }
    
    if (!message) {
      throw new Error('Notification message is required');
    }
    
    // Create notification object
    const notification = {
      id: nanoid(),
      userId,
      businessId,
      type,
      title,
      message,
      priority,
      entityId,
      entityType,
      metadata,
      createdAt: new Date().toISOString(),
      isRead: false,
      readAt: null
    };
    
    // Store in database
    const { createRecord } = await import('../data');
    const createdNotification = await createRecord('notifications', notification);
    
    // TODO: Implement real-time notification delivery (e.g., WebSockets, push notifications)
    // This would be implemented in a separate service
    
    return createdNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Get a notification by ID
 * @param {string} id - The ID of the notification to get
 * @returns {Promise<Object>} - The notification
 */
export async function getNotificationById(id) {
  try {
    if (!id) {
      throw new Error('Notification ID is required');
    }
    
    const { getRecordById } = await import('../data');
    const notification = await getRecordById('notifications', id);
    
    return notification;
  } catch (error) {
    console.error(`Error getting notification with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Mark a notification as read
 * @param {string} id - The ID of the notification to mark as read
 * @returns {Promise<Object>} - The updated notification
 */
export async function markNotificationAsRead(id) {
  try {
    if (!id) {
      throw new Error('Notification ID is required');
    }
    
    // Get the existing notification
    const notification = await getNotificationById(id);
    
    if (!notification) {
      throw new Error(`Notification with ID ${id} not found`);
    }
    
    // If already read, return as is
    if (notification.isRead) {
      return notification;
    }
    
    // Update the notification
    const updatedNotification = {
      ...notification,
      isRead: true,
      readAt: new Date().toISOString()
    };
    
    // Store in database
    const { updateRecord } = await import('../data');
    const result = await updateRecord('notifications', id, updatedNotification);
    
    return result;
  } catch (error) {
    console.error(`Error marking notification ${id} as read:`, error);
    throw error;
  }
}

/**
 * Mark all notifications for a user as read
 * @param {string} userId - The ID of the user
 * @param {string} businessId - The ID of the business
 * @returns {Promise<number>} - The number of notifications marked as read
 */
export async function markAllNotificationsAsRead(userId, businessId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Get unread notifications
    const { queryRecords, updateRecord } = await import('../data');
    const unreadNotifications = await queryRecords('notifications', {
      filterByFormula: `AND({userId} = '${userId}', {businessId} = '${businessId}', {isRead} = FALSE())`
    });
    
    if (!unreadNotifications || unreadNotifications.length === 0) {
      return 0;
    }
    
    // Mark notifications as read
    const now = new Date().toISOString();
    const updatePromises = unreadNotifications.map(notification => 
      updateRecord('notifications', notification.id, {
        ...notification,
        isRead: true,
        readAt: now
      })
    );
    
    await Promise.all(updatePromises);
    
    return unreadNotifications.length;
  } catch (error) {
    console.error(`Error marking all notifications as read for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get notifications for a user
 * @param {string} userId - The ID of the user
 * @param {string} businessId - The ID of the business
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.unreadOnly=false] - Whether to get only unread notifications
 * @param {string} [options.type] - Filter by notification type
 * @param {string} [options.sortBy='createdAt'] - The field to sort by
 * @param {string} [options.sortDirection='desc'] - The sort direction ('asc' or 'desc')
 * @param {number} [options.limit] - The maximum number of notifications to return
 * @param {number} [options.offset] - The offset for pagination
 * @returns {Promise<Array<Object>>} - The notifications
 */
export async function getNotificationsByUserId(userId, businessId, options = {}) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Set default options
    const {
      unreadOnly = false,
      type,
      sortBy = 'createdAt',
      sortDirection = 'desc',
      limit,
      offset
    } = options;
    
    // Build filter formula
    let filterFormula = `AND({userId} = '${userId}', {businessId} = '${businessId}')`;
    
    if (unreadOnly) {
      filterFormula = `AND(${filterFormula}, {isRead} = FALSE())`;
    }
    
    if (type) {
      filterFormula = `AND(${filterFormula}, {type} = '${type}')`;
    }
    
    // Get notifications
    const { queryRecords } = await import('../data');
    const notifications = await queryRecords('notifications', {
      filterByFormula: filterFormula,
      sort: [{ field: sortBy, direction: sortDirection }],
      maxRecords: limit,
      offset
    });
    
    return notifications || [];
  } catch (error) {
    console.error(`Error getting notifications for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get unread notification count for a user
 * @param {string} userId - The ID of the user
 * @param {string} businessId - The ID of the business
 * @returns {Promise<Object>} - The unread notification counts
 */
export async function getUnreadNotificationCount(userId, businessId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Get unread notifications
    const notifications = await getNotificationsByUserId(userId, businessId, {
      unreadOnly: true
    });
    
    if (!notifications || notifications.length === 0) {
      return { total: 0, byType: {} };
    }
    
    // Count by type
    const byType = {};
    notifications.forEach(notification => {
      if (!byType[notification.type]) {
        byType[notification.type] = 0;
      }
      byType[notification.type]++;
    });
    
    return {
      total: notifications.length,
      byType
    };
  } catch (error) {
    console.error(`Error getting unread notification count for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Delete old notifications
 * @param {string} businessId - The ID of the business
 * @param {number} [days=30] - The number of days to keep notifications
 * @returns {Promise<number>} - The number of notifications deleted
 */
export async function deleteOldNotifications(businessId, days = 30) {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateString = cutoffDate.toISOString();
    
    // Get old notifications
    const { queryRecords, deleteRecord } = await import('../data');
    const oldNotifications = await queryRecords('notifications', {
      filterByFormula: `AND({businessId} = '${businessId}', {createdAt} < '${cutoffDateString}')`
    });
    
    if (!oldNotifications || oldNotifications.length === 0) {
      return 0;
    }
    
    // Delete notifications
    const deletePromises = oldNotifications.map(notification => 
      deleteRecord('notifications', notification.id)
    );
    
    await Promise.all(deletePromises);
    
    return oldNotifications.length;
  } catch (error) {
    console.error(`Error deleting old notifications for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Create a new conversation notification
 * @param {Object} params - The notification parameters
 * @param {string} params.userId - The ID of the user to notify
 * @param {string} params.businessId - The ID of the business
 * @param {string} params.conversationId - The ID of the conversation
 * @param {string} params.customerName - The name of the customer
 * @returns {Promise<Object>} - The created notification
 */
export async function createNewConversationNotification({
  userId,
  businessId,
  conversationId,
  customerName
}) {
  try {
    return await createNotification({
      userId,
      businessId,
      type: NOTIFICATION_TYPE.NEW_CONVERSATION,
      title: 'New Conversation',
      message: `New conversation with ${customerName}`,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      entityId: conversationId,
      entityType: 'conversation',
      metadata: {
        customerName
      }
    });
  } catch (error) {
    console.error('Error creating new conversation notification:', error);
    throw error;
  }
}

/**
 * Create a new message notification
 * @param {Object} params - The notification parameters
 * @param {string} params.userId - The ID of the user to notify
 * @param {string} params.businessId - The ID of the business
 * @param {string} params.conversationId - The ID of the conversation
 * @param {string} params.messageId - The ID of the message
 * @param {string} params.senderName - The name of the sender
 * @param {string} params.messagePreview - A preview of the message content
 * @returns {Promise<Object>} - The created notification
 */
export async function createNewMessageNotification({
  userId,
  businessId,
  conversationId,
  messageId,
  senderName,
  messagePreview
}) {
  try {
    return await createNotification({
      userId,
      businessId,
      type: NOTIFICATION_TYPE.NEW_MESSAGE,
      title: 'New Message',
      message: `${senderName}: ${messagePreview}`,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      entityId: messageId,
      entityType: 'message',
      metadata: {
        conversationId,
        senderName,
        messagePreview
      }
    });
  } catch (error) {
    console.error('Error creating new message notification:', error);
    throw error;
  }
}

/**
 * Create an assignment notification
 * @param {Object} params - The notification parameters
 * @param {string} params.userId - The ID of the user to notify
 * @param {string} params.businessId - The ID of the business
 * @param {string} params.conversationId - The ID of the conversation
 * @param {string} params.assignmentId - The ID of the assignment
 * @param {string} params.assignedBy - The name of the user who made the assignment
 * @param {string} params.customerName - The name of the customer
 * @returns {Promise<Object>} - The created notification
 */
export async function createAssignmentNotification({
  userId,
  businessId,
  conversationId,
  assignmentId,
  assignedBy,
  customerName
}) {
  try {
    return await createNotification({
      userId,
      businessId,
      type: NOTIFICATION_TYPE.ASSIGNMENT,
      title: 'New Assignment',
      message: `${assignedBy} assigned you a conversation with ${customerName}`,
      priority: NOTIFICATION_PRIORITY.HIGH,
      entityId: conversationId,
      entityType: 'conversation',
      metadata: {
        assignmentId,
        assignedBy,
        customerName
      }
    });
  } catch (error) {
    console.error('Error creating assignment notification:', error);
    throw error;
  }
}

/**
 * Create a mention notification
 * @param {Object} params - The notification parameters
 * @param {string} params.userId - The ID of the user to notify
 * @param {string} params.businessId - The ID of the business
 * @param {string} params.conversationId - The ID of the conversation
 * @param {string} params.messageId - The ID of the message
 * @param {string} params.mentionedBy - The name of the user who mentioned
 * @param {string} params.messagePreview - A preview of the message content
 * @returns {Promise<Object>} - The created notification
 */
export async function createMentionNotification({
  userId,
  businessId,
  conversationId,
  messageId,
  mentionedBy,
  messagePreview
}) {
  try {
    return await createNotification({
      userId,
      businessId,
      type: NOTIFICATION_TYPE.MENTION,
      title: 'You were mentioned',
      message: `${mentionedBy} mentioned you: ${messagePreview}`,
      priority: NOTIFICATION_PRIORITY.HIGH,
      entityId: messageId,
      entityType: 'message',
      metadata: {
        conversationId,
        mentionedBy,
        messagePreview
      }
    });
  } catch (error) {
    console.error('Error creating mention notification:', error);
    throw error;
  }
}

/**
 * Create a reminder notification
 * @param {Object} params - The notification parameters
 * @param {string} params.userId - The ID of the user to notify
 * @param {string} params.businessId - The ID of the business
 * @param {string} params.conversationId - The ID of the conversation
 * @param {string} params.customerName - The name of the customer
 * @param {string} params.reminderMessage - The reminder message
 * @returns {Promise<Object>} - The created notification
 */
export async function createReminderNotification({
  userId,
  businessId,
  conversationId,
  customerName,
  reminderMessage
}) {
  try {
    return await createNotification({
      userId,
      businessId,
      type: NOTIFICATION_TYPE.REMINDER,
      title: 'Conversation Reminder',
      message: `Reminder: ${reminderMessage} (${customerName})`,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      entityId: conversationId,
      entityType: 'conversation',
      metadata: {
        customerName,
        reminderMessage
      }
    });
  } catch (error) {
    console.error('Error creating reminder notification:', error);
    throw error;
  }
}
