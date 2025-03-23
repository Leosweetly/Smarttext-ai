/**
 * Tags Module
 * 
 * This module provides functionality for managing hierarchical tags
 * and assigning them to contacts, conversations, and other entities.
 */

import { nanoid } from 'nanoid';

/**
 * Create a new tag
 * @param {Object} tag - The tag to create
 * @param {string} tag.name - The name of the tag
 * @param {string} tag.color - The color of the tag (hex code)
 * @param {string} [tag.parentId] - The ID of the parent tag (for hierarchical tags)
 * @param {string} [tag.businessId] - The ID of the business the tag belongs to
 * @returns {Promise<Object>} - The created tag
 */
export async function createTag({ name, color, parentId = null, businessId }) {
  try {
    // Validate inputs
    if (!name || name.trim() === '') {
      throw new Error('Tag name is required');
    }
    
    if (!color) {
      throw new Error('Tag color is required');
    }
    
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Create tag object
    const tag = {
      id: nanoid(),
      name: name.trim(),
      color,
      parentId,
      businessId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store in database (using Airtable)
    const { createRecord } = await import('../data');
    const createdTag = await createRecord('tags', tag);
    
    return createdTag;
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
}

/**
 * Get a tag by ID
 * @param {string} id - The ID of the tag to get
 * @returns {Promise<Object>} - The tag
 */
export async function getTagById(id) {
  try {
    if (!id) {
      throw new Error('Tag ID is required');
    }
    
    const { getRecordById } = await import('../data');
    const tag = await getRecordById('tags', id);
    
    return tag;
  } catch (error) {
    console.error(`Error getting tag with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Update a tag
 * @param {string} id - The ID of the tag to update
 * @param {Object} updates - The updates to apply
 * @returns {Promise<Object>} - The updated tag
 */
export async function updateTag(id, updates) {
  try {
    if (!id) {
      throw new Error('Tag ID is required');
    }
    
    // Get the existing tag
    const existingTag = await getTagById(id);
    
    // Apply updates
    const updatedTag = {
      ...existingTag,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Store in database
    const { updateRecord } = await import('../data');
    const result = await updateRecord('tags', id, updatedTag);
    
    return result;
  } catch (error) {
    console.error(`Error updating tag with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a tag
 * @param {string} id - The ID of the tag to delete
 * @returns {Promise<boolean>} - True if successful
 */
export async function deleteTag(id) {
  try {
    if (!id) {
      throw new Error('Tag ID is required');
    }
    
    // Check if tag has children
    const children = await getTagsByParentId(id);
    if (children && children.length > 0) {
      throw new Error('Cannot delete a tag with children. Delete the children first or reassign them.');
    }
    
    // Delete tag assignments
    await deleteTagAssignments(id);
    
    // Delete the tag
    const { deleteRecord } = await import('../data');
    await deleteRecord('tags', id);
    
    return true;
  } catch (error) {
    console.error(`Error deleting tag with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get all tags for a business
 * @param {string} businessId - The ID of the business
 * @returns {Promise<Array<Object>>} - The tags
 */
export async function getTagsByBusinessId(businessId) {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    const { queryRecords } = await import('../data');
    const tags = await queryRecords('tags', {
      filterByFormula: `{businessId} = '${businessId}'`
    });
    
    return tags;
  } catch (error) {
    console.error(`Error getting tags for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Get child tags for a parent tag
 * @param {string} parentId - The ID of the parent tag
 * @returns {Promise<Array<Object>>} - The child tags
 */
export async function getTagsByParentId(parentId) {
  try {
    if (!parentId) {
      throw new Error('Parent ID is required');
    }
    
    const { queryRecords } = await import('../data');
    const tags = await queryRecords('tags', {
      filterByFormula: `{parentId} = '${parentId}'`
    });
    
    return tags;
  } catch (error) {
    console.error(`Error getting child tags for parent ${parentId}:`, error);
    throw error;
  }
}

/**
 * Get root tags for a business (tags with no parent)
 * @param {string} businessId - The ID of the business
 * @returns {Promise<Array<Object>>} - The root tags
 */
export async function getRootTags(businessId) {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    const { queryRecords } = await import('../data');
    const tags = await queryRecords('tags', {
      filterByFormula: `AND({businessId} = '${businessId}', {parentId} = '')`
    });
    
    return tags;
  } catch (error) {
    console.error(`Error getting root tags for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Assign a tag to an entity
 * @param {Object} assignment - The assignment details
 * @param {string} assignment.tagId - The ID of the tag
 * @param {string} assignment.entityId - The ID of the entity (contact, conversation, etc.)
 * @param {string} assignment.entityType - The type of entity ('contact', 'conversation', etc.)
 * @param {string} [assignment.businessId] - The ID of the business
 * @returns {Promise<Object>} - The created assignment
 */
export async function assignTag({ tagId, entityId, entityType, businessId }) {
  try {
    // Validate inputs
    if (!tagId) {
      throw new Error('Tag ID is required');
    }
    
    if (!entityId) {
      throw new Error('Entity ID is required');
    }
    
    if (!entityType) {
      throw new Error('Entity type is required');
    }
    
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Check if assignment already exists
    const existingAssignment = await getTagAssignment(tagId, entityId, entityType);
    if (existingAssignment) {
      return existingAssignment; // Assignment already exists
    }
    
    // Create assignment object
    const assignment = {
      id: nanoid(),
      tagId,
      entityId,
      entityType,
      businessId,
      createdAt: new Date().toISOString()
    };
    
    // Store in database
    const { createRecord } = await import('../data');
    const createdAssignment = await createRecord('tagAssignments', assignment);
    
    return createdAssignment;
  } catch (error) {
    console.error('Error assigning tag:', error);
    throw error;
  }
}

/**
 * Remove a tag assignment
 * @param {string} tagId - The ID of the tag
 * @param {string} entityId - The ID of the entity
 * @param {string} entityType - The type of entity
 * @returns {Promise<boolean>} - True if successful
 */
export async function removeTagAssignment(tagId, entityId, entityType) {
  try {
    // Validate inputs
    if (!tagId) {
      throw new Error('Tag ID is required');
    }
    
    if (!entityId) {
      throw new Error('Entity ID is required');
    }
    
    if (!entityType) {
      throw new Error('Entity type is required');
    }
    
    // Get the assignment
    const assignment = await getTagAssignment(tagId, entityId, entityType);
    if (!assignment) {
      return true; // Assignment doesn't exist, so it's already removed
    }
    
    // Delete the assignment
    const { deleteRecord } = await import('../data');
    await deleteRecord('tagAssignments', assignment.id);
    
    return true;
  } catch (error) {
    console.error('Error removing tag assignment:', error);
    throw error;
  }
}

/**
 * Get a tag assignment
 * @param {string} tagId - The ID of the tag
 * @param {string} entityId - The ID of the entity
 * @param {string} entityType - The type of entity
 * @returns {Promise<Object|null>} - The assignment or null if not found
 */
export async function getTagAssignment(tagId, entityId, entityType) {
  try {
    // Validate inputs
    if (!tagId) {
      throw new Error('Tag ID is required');
    }
    
    if (!entityId) {
      throw new Error('Entity ID is required');
    }
    
    if (!entityType) {
      throw new Error('Entity type is required');
    }
    
    const { queryRecords } = await import('../data');
    const assignments = await queryRecords('tagAssignments', {
      filterByFormula: `AND({tagId} = '${tagId}', {entityId} = '${entityId}', {entityType} = '${entityType}')`
    });
    
    return assignments && assignments.length > 0 ? assignments[0] : null;
  } catch (error) {
    console.error('Error getting tag assignment:', error);
    throw error;
  }
}

/**
 * Get all tags assigned to an entity
 * @param {string} entityId - The ID of the entity
 * @param {string} entityType - The type of entity
 * @returns {Promise<Array<Object>>} - The tags
 */
export async function getTagsForEntity(entityId, entityType) {
  try {
    // Validate inputs
    if (!entityId) {
      throw new Error('Entity ID is required');
    }
    
    if (!entityType) {
      throw new Error('Entity type is required');
    }
    
    // Get assignments
    const { queryRecords } = await import('../data');
    const assignments = await queryRecords('tagAssignments', {
      filterByFormula: `AND({entityId} = '${entityId}', {entityType} = '${entityType}')`
    });
    
    if (!assignments || assignments.length === 0) {
      return [];
    }
    
    // Get tags
    const tagIds = assignments.map(assignment => assignment.tagId);
    const tags = await Promise.all(tagIds.map(id => getTagById(id)));
    
    return tags.filter(Boolean); // Filter out any null values
  } catch (error) {
    console.error(`Error getting tags for entity ${entityId}:`, error);
    throw error;
  }
}

/**
 * Delete all assignments for a tag
 * @param {string} tagId - The ID of the tag
 * @returns {Promise<boolean>} - True if successful
 * @private
 */
async function deleteTagAssignments(tagId) {
  try {
    if (!tagId) {
      throw new Error('Tag ID is required');
    }
    
    const { queryRecords, deleteRecord } = await import('../data');
    const assignments = await queryRecords('tagAssignments', {
      filterByFormula: `{tagId} = '${tagId}'`
    });
    
    if (assignments && assignments.length > 0) {
      await Promise.all(assignments.map(assignment => deleteRecord('tagAssignments', assignment.id)));
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting assignments for tag ${tagId}:`, error);
    throw error;
  }
}

/**
 * Get entities by tag
 * @param {string} tagId - The ID of the tag
 * @param {string} entityType - The type of entity
 * @returns {Promise<Array<string>>} - The entity IDs
 */
export async function getEntitiesByTag(tagId, entityType) {
  try {
    // Validate inputs
    if (!tagId) {
      throw new Error('Tag ID is required');
    }
    
    if (!entityType) {
      throw new Error('Entity type is required');
    }
    
    const { queryRecords } = await import('../data');
    const assignments = await queryRecords('tagAssignments', {
      filterByFormula: `AND({tagId} = '${tagId}', {entityType} = '${entityType}')`
    });
    
    return assignments ? assignments.map(assignment => assignment.entityId) : [];
  } catch (error) {
    console.error(`Error getting entities for tag ${tagId}:`, error);
    throw error;
  }
}

/**
 * Search tags by name
 * @param {string} businessId - The ID of the business
 * @param {string} query - The search query
 * @returns {Promise<Array<Object>>} - The matching tags
 */
export async function searchTags(businessId, query) {
  try {
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    if (!query || query.trim() === '') {
      return [];
    }
    
    const { queryRecords } = await import('../data');
    const tags = await queryRecords('tags', {
      filterByFormula: `AND({businessId} = '${businessId}', SEARCH('${query.trim().toLowerCase()}', LOWER({name})))`
    });
    
    return tags || [];
  } catch (error) {
    console.error(`Error searching tags for business ${businessId}:`, error);
    throw error;
  }
}
