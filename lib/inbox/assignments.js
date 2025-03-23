/**
 * Assignments Module
 * 
 * This module provides functionality for managing conversation assignments.
 * It handles assignment creation, retrieval, and history tracking.
 */

import { nanoid } from 'nanoid';

// Assignment status constants
export const ASSIGNMENT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  TRANSFERRED: 'transferred'
};

/**
 * Create a new assignment
 * @param {Object} assignment - The assignment to create
 * @param {string} assignment.conversationId - The ID of the conversation
 * @param {string} assignment.assignedTo - The ID of the user assigned to
 * @param {string} assignment.assignedBy - The ID of the user making the assignment
 * @param {string} assignment.businessId - The ID of the business
 * @param {string} [assignment.status='active'] - The status of the assignment
 * @param {string} [assignment.notes] - Notes about the assignment
 * @returns {Promise<Object>} - The created assignment
 */
export async function createAssignment({
  conversationId,
  assignedTo,
  assignedBy,
  businessId,
  status = ASSIGNMENT_STATUS.ACTIVE,
  notes = ''
}) {
  try {
    // Validate inputs
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    
    if (!assignedTo) {
      throw new Error('Assigned to user ID is required');
    }
    
    if (!assignedBy) {
      throw new Error('Assigned by user ID is required');
    }
    
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Check if there's an active assignment for this conversation
    const activeAssignment = await getActiveAssignment(conversationId);
    
    // If there's an active assignment to the same user, don't create a new one
    if (activeAssignment && activeAssignment.assignedTo === assignedTo) {
      return activeAssignment;
    }
    
    // If there's an active assignment to a different user, mark it as transferred
    if (activeAssignment && activeAssignment.assignedTo !== assignedTo) {
      await updateAssignment(activeAssignment.id, {
        status: ASSIGNMENT_STATUS.TRANSFERRED,
        transferredTo: assignedTo,
        transferredBy: assignedBy,
        transferredAt: new Date().toISOString()
      });
    }
    
    // Create assignment object
    const assignment = {
      id: nanoid(),
      conversationId,
      assignedTo,
      assignedBy,
      businessId,
      status,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      completedBy: null,
      transferredTo: null,
      transferredBy: null,
      transferredAt: null
    };
    
    // Store in database
    const { createRecord } = await import('../data');
    const createdAssignment = await createRecord('assignments', assignment);
    
    // Create a system message in the conversation about the assignment
    const { createMessage, MESSAGE_TYPE, SENDER_TYPE } = await import('./messages');
    await createMessage({
      conversationId,
      content: `Conversation assigned to ${assignedTo} by ${assignedBy}`,
      sender: 'system',
      senderType: SENDER_TYPE.SYSTEM,
      messageType: MESSAGE_TYPE.SYSTEM,
      businessId,
      metadata: {
        assignmentId: createdAssignment.id,
        assignedTo,
        assignedBy
      }
    });
    
    return createdAssignment;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
}

/**
 * Get an assignment by ID
 * @param {string} id - The ID of the assignment to get
 * @returns {Promise<Object>} - The assignment
 */
export async function getAssignmentById(id) {
  try {
    if (!id) {
      throw new Error('Assignment ID is required');
    }
    
    const { getRecordById } = await import('../data');
    const assignment = await getRecordById('assignments', id);
    
    return assignment;
  } catch (error) {
    console.error(`Error getting assignment with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Update an assignment
 * @param {string} id - The ID of the assignment to update
 * @param {Object} updates - The updates to apply
 * @returns {Promise<Object>} - The updated assignment
 */
export async function updateAssignment(id, updates) {
  try {
    if (!id) {
      throw new Error('Assignment ID is required');
    }
    
    // Get the existing assignment
    const existingAssignment = await getAssignmentById(id);
    
    if (!existingAssignment) {
      throw new Error(`Assignment with ID ${id} not found`);
    }
    
    // Apply updates
    const updatedAssignment = {
      ...existingAssignment,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Handle status changes
    if (updates.status) {
      // If status changed to completed, set completedAt and completedBy
      if (updates.status === ASSIGNMENT_STATUS.COMPLETED && existingAssignment.status !== ASSIGNMENT_STATUS.COMPLETED) {
        updatedAssignment.completedAt = new Date().toISOString();
        updatedAssignment.completedBy = updates.completedBy || null;
      }
      
      // If status changed to transferred, set transferredAt, transferredBy, and transferredTo
      if (updates.status === ASSIGNMENT_STATUS.TRANSFERRED && existingAssignment.status !== ASSIGNMENT_STATUS.TRANSFERRED) {
        updatedAssignment.transferredAt = new Date().toISOString();
        updatedAssignment.transferredBy = updates.transferredBy || null;
        updatedAssignment.transferredTo = updates.transferredTo || null;
      }
    }
    
    // Store in database
    const { updateRecord } = await import('../data');
    const result = await updateRecord('assignments', id, updatedAssignment);
    
    return result;
  } catch (error) {
    console.error(`Error updating assignment with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Complete an assignment
 * @param {string} assignmentId - The ID of the assignment to complete
 * @param {string} completedBy - The ID of the user completing the assignment
 * @returns {Promise<Object>} - The updated assignment
 */
export async function completeAssignment(assignmentId, completedBy) {
  try {
    if (!assignmentId) {
      throw new Error('Assignment ID is required');
    }
    
    // Update the assignment
    const updatedAssignment = await updateAssignment(assignmentId, {
      status: ASSIGNMENT_STATUS.COMPLETED,
      completedBy
    });
    
    // Create a system message in the conversation about the completion
    const assignment = await getAssignmentById(assignmentId);
    if (assignment) {
      const { createMessage, MESSAGE_TYPE, SENDER_TYPE } = await import('./messages');
      await createMessage({
        conversationId: assignment.conversationId,
        content: `Assignment completed by ${completedBy}`,
        sender: 'system',
        senderType: SENDER_TYPE.SYSTEM,
        messageType: MESSAGE_TYPE.SYSTEM,
        businessId: assignment.businessId,
        metadata: {
          assignmentId,
          completedBy
        }
      });
    }
    
    return updatedAssignment;
  } catch (error) {
    console.error(`Error completing assignment ${assignmentId}:`, error);
    throw error;
  }
}

/**
 * Get assignments for a conversation
 * @param {string} conversationId - The ID of the conversation
 * @param {Object} [options] - Additional options
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.sortBy='createdAt'] - The field to sort by
 * @param {string} [options.sortDirection='desc'] - The sort direction ('asc' or 'desc')
 * @returns {Promise<Array<Object>>} - The assignments
 */
export async function getAssignmentsByConversationId(conversationId, options = {}) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    
    // Set default options
    const {
      status,
      sortBy = 'createdAt',
      sortDirection = 'desc'
    } = options;
    
    // Build filter formula
    let filterFormula = `{conversationId} = '${conversationId}'`;
    
    if (status) {
      filterFormula = `AND(${filterFormula}, {status} = '${status}')`;
    }
    
    // Get assignments
    const { queryRecords } = await import('../data');
    const assignments = await queryRecords('assignments', {
      filterByFormula: filterFormula,
      sort: [{ field: sortBy, direction: sortDirection }]
    });
    
    return assignments || [];
  } catch (error) {
    console.error(`Error getting assignments for conversation ${conversationId}:`, error);
    throw error;
  }
}

/**
 * Get the active assignment for a conversation
 * @param {string} conversationId - The ID of the conversation
 * @returns {Promise<Object|null>} - The active assignment or null if none
 */
export async function getActiveAssignment(conversationId) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    
    const assignments = await getAssignmentsByConversationId(conversationId, {
      status: ASSIGNMENT_STATUS.ACTIVE,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    });
    
    return assignments && assignments.length > 0 ? assignments[0] : null;
  } catch (error) {
    console.error(`Error getting active assignment for conversation ${conversationId}:`, error);
    throw error;
  }
}

/**
 * Get assignments for a user
 * @param {string} userId - The ID of the user
 * @param {string} businessId - The ID of the business
 * @param {Object} [options] - Additional options
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.sortBy='createdAt'] - The field to sort by
 * @param {string} [options.sortDirection='desc'] - The sort direction ('asc' or 'desc')
 * @returns {Promise<Array<Object>>} - The assignments
 */
export async function getAssignmentsByUserId(userId, businessId, options = {}) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Set default options
    const {
      status,
      sortBy = 'createdAt',
      sortDirection = 'desc'
    } = options;
    
    // Build filter formula
    let filterFormula = `AND({assignedTo} = '${userId}', {businessId} = '${businessId}')`;
    
    if (status) {
      filterFormula = `AND(${filterFormula}, {status} = '${status}')`;
    }
    
    // Get assignments
    const { queryRecords } = await import('../data');
    const assignments = await queryRecords('assignments', {
      filterByFormula: filterFormula,
      sort: [{ field: sortBy, direction: sortDirection }]
    });
    
    return assignments || [];
  } catch (error) {
    console.error(`Error getting assignments for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get active assignments for a user
 * @param {string} userId - The ID of the user
 * @param {string} businessId - The ID of the business
 * @returns {Promise<Array<Object>>} - The active assignments
 */
export async function getActiveAssignmentsByUserId(userId, businessId) {
  try {
    return await getAssignmentsByUserId(userId, businessId, {
      status: ASSIGNMENT_STATUS.ACTIVE
    });
  } catch (error) {
    console.error(`Error getting active assignments for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get assignment statistics for a business
 * @param {string} businessId - The ID of the business
 * @returns {Promise<Object>} - The assignment statistics
 */
export async function getAssignmentStats(businessId) {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Get all assignments for the business
    const { queryRecords } = await import('../data');
    const assignments = await queryRecords('assignments', {
      filterByFormula: `{businessId} = '${businessId}'`
    });
    
    if (!assignments || assignments.length === 0) {
      return {
        total: 0,
        byStatus: {
          [ASSIGNMENT_STATUS.ACTIVE]: 0,
          [ASSIGNMENT_STATUS.COMPLETED]: 0,
          [ASSIGNMENT_STATUS.TRANSFERRED]: 0
        },
        byUser: {}
      };
    }
    
    // Calculate statistics
    const stats = {
      total: assignments.length,
      byStatus: {
        [ASSIGNMENT_STATUS.ACTIVE]: 0,
        [ASSIGNMENT_STATUS.COMPLETED]: 0,
        [ASSIGNMENT_STATUS.TRANSFERRED]: 0
      },
      byUser: {}
    };
    
    // Count assignments by status and user
    assignments.forEach(assignment => {
      // Count by status
      if (stats.byStatus[assignment.status] !== undefined) {
        stats.byStatus[assignment.status]++;
      }
      
      // Count by user
      if (assignment.assignedTo) {
        if (!stats.byUser[assignment.assignedTo]) {
          stats.byUser[assignment.assignedTo] = {
            total: 0,
            active: 0,
            completed: 0,
            transferred: 0
          };
        }
        
        stats.byUser[assignment.assignedTo].total++;
        
        if (assignment.status === ASSIGNMENT_STATUS.ACTIVE) {
          stats.byUser[assignment.assignedTo].active++;
        } else if (assignment.status === ASSIGNMENT_STATUS.COMPLETED) {
          stats.byUser[assignment.assignedTo].completed++;
        } else if (assignment.status === ASSIGNMENT_STATUS.TRANSFERRED) {
          stats.byUser[assignment.assignedTo].transferred++;
        }
      }
    });
    
    return stats;
  } catch (error) {
    console.error(`Error getting assignment stats for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Get assignment history for a conversation
 * @param {string} conversationId - The ID of the conversation
 * @returns {Promise<Array<Object>>} - The assignment history
 */
export async function getAssignmentHistory(conversationId) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    
    // Get all assignments for the conversation
    const assignments = await getAssignmentsByConversationId(conversationId, {
      sortBy: 'createdAt',
      sortDirection: 'asc'
    });
    
    return assignments || [];
  } catch (error) {
    console.error(`Error getting assignment history for conversation ${conversationId}:`, error);
    throw error;
  }
}
