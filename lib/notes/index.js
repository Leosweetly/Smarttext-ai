/**
 * Notes Module
 * 
 * This module provides functionality for managing rich text notes
 * for contacts, conversations, and other entities.
 */

import { nanoid } from 'nanoid';

/**
 * Create a new note
 * @param {Object} note - The note to create
 * @param {string} note.content - The content of the note (can be rich text)
 * @param {string} note.entityId - The ID of the entity the note is attached to
 * @param {string} note.entityType - The type of entity ('contact', 'conversation', etc.)
 * @param {string} note.createdBy - The ID of the user who created the note
 * @param {string} note.businessId - The ID of the business the note belongs to
 * @returns {Promise<Object>} - The created note
 */
export async function createNote({ content, entityId, entityType, createdBy, businessId }) {
  try {
    // Validate inputs
    if (!content || content.trim() === '') {
      throw new Error('Note content is required');
    }
    
    if (!entityId) {
      throw new Error('Entity ID is required');
    }
    
    if (!entityType) {
      throw new Error('Entity type is required');
    }
    
    if (!createdBy) {
      throw new Error('Creator ID is required');
    }
    
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Create note object
    const note = {
      id: nanoid(),
      content: content.trim(),
      entityId,
      entityType,
      createdBy,
      businessId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false
    };
    
    // Store in database
    const { createRecord } = await import('../data');
    const createdNote = await createRecord('notes', note);
    
    return createdNote;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
}

/**
 * Get a note by ID
 * @param {string} id - The ID of the note to get
 * @returns {Promise<Object>} - The note
 */
export async function getNoteById(id) {
  try {
    if (!id) {
      throw new Error('Note ID is required');
    }
    
    const { getRecordById } = await import('../data');
    const note = await getRecordById('notes', id);
    
    return note;
  } catch (error) {
    console.error(`Error getting note with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Update a note
 * @param {string} id - The ID of the note to update
 * @param {Object} updates - The updates to apply
 * @param {string} [updates.content] - The updated content
 * @param {boolean} [updates.isArchived] - Whether the note is archived
 * @returns {Promise<Object>} - The updated note
 */
export async function updateNote(id, updates) {
  try {
    if (!id) {
      throw new Error('Note ID is required');
    }
    
    // Get the existing note
    const existingNote = await getNoteById(id);
    
    // Apply updates
    const updatedNote = {
      ...existingNote,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Store in database
    const { updateRecord } = await import('../data');
    const result = await updateRecord('notes', id, updatedNote);
    
    return result;
  } catch (error) {
    console.error(`Error updating note with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Archive a note
 * @param {string} id - The ID of the note to archive
 * @returns {Promise<Object>} - The archived note
 */
export async function archiveNote(id) {
  try {
    return await updateNote(id, { isArchived: true });
  } catch (error) {
    console.error(`Error archiving note with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Unarchive a note
 * @param {string} id - The ID of the note to unarchive
 * @returns {Promise<Object>} - The unarchived note
 */
export async function unarchiveNote(id) {
  try {
    return await updateNote(id, { isArchived: false });
  } catch (error) {
    console.error(`Error unarchiving note with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a note
 * @param {string} id - The ID of the note to delete
 * @returns {Promise<boolean>} - True if successful
 */
export async function deleteNote(id) {
  try {
    if (!id) {
      throw new Error('Note ID is required');
    }
    
    const { deleteRecord } = await import('../data');
    await deleteRecord('notes', id);
    
    return true;
  } catch (error) {
    console.error(`Error deleting note with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get all notes for an entity
 * @param {string} entityId - The ID of the entity
 * @param {string} entityType - The type of entity
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.includeArchived=false] - Whether to include archived notes
 * @param {string} [options.sortBy='createdAt'] - The field to sort by
 * @param {string} [options.sortDirection='desc'] - The sort direction ('asc' or 'desc')
 * @returns {Promise<Array<Object>>} - The notes
 */
export async function getNotesForEntity(entityId, entityType, options = {}) {
  try {
    // Validate inputs
    if (!entityId) {
      throw new Error('Entity ID is required');
    }
    
    if (!entityType) {
      throw new Error('Entity type is required');
    }
    
    // Set default options
    const {
      includeArchived = false,
      sortBy = 'createdAt',
      sortDirection = 'desc'
    } = options;
    
    // Build filter formula
    let filterFormula = `AND({entityId} = '${entityId}', {entityType} = '${entityType}')`;
    if (!includeArchived) {
      filterFormula = `AND(${filterFormula}, {isArchived} = FALSE())`;
    }
    
    // Get notes
    const { queryRecords } = await import('../data');
    const notes = await queryRecords('notes', {
      filterByFormula: filterFormula,
      sort: [{ field: sortBy, direction: sortDirection }]
    });
    
    return notes || [];
  } catch (error) {
    console.error(`Error getting notes for entity ${entityId}:`, error);
    throw error;
  }
}

/**
 * Get all notes for a business
 * @param {string} businessId - The ID of the business
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.includeArchived=false] - Whether to include archived notes
 * @param {string} [options.sortBy='createdAt'] - The field to sort by
 * @param {string} [options.sortDirection='desc'] - The sort direction ('asc' or 'desc')
 * @param {number} [options.limit] - The maximum number of notes to return
 * @returns {Promise<Array<Object>>} - The notes
 */
export async function getNotesByBusinessId(businessId, options = {}) {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Set default options
    const {
      includeArchived = false,
      sortBy = 'createdAt',
      sortDirection = 'desc',
      limit
    } = options;
    
    // Build filter formula
    let filterFormula = `{businessId} = '${businessId}'`;
    if (!includeArchived) {
      filterFormula = `AND(${filterFormula}, {isArchived} = FALSE())`;
    }
    
    // Get notes
    const { queryRecords } = await import('../data');
    const notes = await queryRecords('notes', {
      filterByFormula: filterFormula,
      sort: [{ field: sortBy, direction: sortDirection }],
      maxRecords: limit
    });
    
    return notes || [];
  } catch (error) {
    console.error(`Error getting notes for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Search notes by content
 * @param {string} businessId - The ID of the business
 * @param {string} query - The search query
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.includeArchived=false] - Whether to include archived notes
 * @param {string} [options.entityType] - Filter by entity type
 * @returns {Promise<Array<Object>>} - The matching notes
 */
export async function searchNotes(businessId, query, options = {}) {
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
      entityType
    } = options;
    
    // Build filter formula
    let filterFormula = `AND({businessId} = '${businessId}', SEARCH('${query.trim().toLowerCase()}', LOWER({content})))`;
    if (!includeArchived) {
      filterFormula = `AND(${filterFormula}, {isArchived} = FALSE())`;
    }
    if (entityType) {
      filterFormula = `AND(${filterFormula}, {entityType} = '${entityType}')`;
    }
    
    // Get notes
    const { queryRecords } = await import('../data');
    const notes = await queryRecords('notes', {
      filterByFormula: filterFormula,
      sort: [{ field: 'createdAt', direction: 'desc' }]
    });
    
    return notes || [];
  } catch (error) {
    console.error(`Error searching notes for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Get recent notes
 * @param {string} businessId - The ID of the business
 * @param {Object} [options] - Additional options
 * @param {number} [options.limit=10] - The maximum number of notes to return
 * @param {string} [options.entityType] - Filter by entity type
 * @param {string} [options.createdBy] - Filter by creator
 * @returns {Promise<Array<Object>>} - The recent notes
 */
export async function getRecentNotes(businessId, options = {}) {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Set default options
    const {
      limit = 10,
      entityType,
      createdBy
    } = options;
    
    // Build filter formula
    let filterFormula = `AND({businessId} = '${businessId}', {isArchived} = FALSE())`;
    if (entityType) {
      filterFormula = `AND(${filterFormula}, {entityType} = '${entityType}')`;
    }
    if (createdBy) {
      filterFormula = `AND(${filterFormula}, {createdBy} = '${createdBy}')`;
    }
    
    // Get notes
    const { queryRecords } = await import('../data');
    const notes = await queryRecords('notes', {
      filterByFormula: filterFormula,
      sort: [{ field: 'createdAt', direction: 'desc' }],
      maxRecords: limit
    });
    
    return notes || [];
  } catch (error) {
    console.error(`Error getting recent notes for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Get note count for an entity
 * @param {string} entityId - The ID of the entity
 * @param {string} entityType - The type of entity
 * @param {boolean} [includeArchived=false] - Whether to include archived notes
 * @returns {Promise<number>} - The note count
 */
export async function getNoteCountForEntity(entityId, entityType, includeArchived = false) {
  try {
    const notes = await getNotesForEntity(entityId, entityType, { includeArchived });
    return notes.length;
  } catch (error) {
    console.error(`Error getting note count for entity ${entityId}:`, error);
    throw error;
  }
}

/**
 * Get entities with notes
 * @param {string} businessId - The ID of the business
 * @param {string} entityType - The type of entity
 * @param {number} [limit] - The maximum number of entities to return
 * @returns {Promise<Array<string>>} - The entity IDs
 */
export async function getEntitiesWithNotes(businessId, entityType, limit) {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    if (!entityType) {
      throw new Error('Entity type is required');
    }
    
    // Build filter formula
    const filterFormula = `AND({businessId} = '${businessId}', {entityType} = '${entityType}', {isArchived} = FALSE())`;
    
    // Get notes
    const { queryRecords } = await import('../data');
    const notes = await queryRecords('notes', {
      filterByFormula: filterFormula,
      fields: ['entityId'],
      sort: [{ field: 'createdAt', direction: 'desc' }],
      maxRecords: limit
    });
    
    // Extract unique entity IDs
    const entityIds = new Set();
    notes.forEach(note => entityIds.add(note.entityId));
    
    return Array.from(entityIds);
  } catch (error) {
    console.error(`Error getting entities with notes for business ${businessId}:`, error);
    throw error;
  }
}
