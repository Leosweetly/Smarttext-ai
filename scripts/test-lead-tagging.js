#!/usr/bin/env node

/**
 * Test script for the Tag and Organize Leads Manually feature
 * 
 * This script tests creating and applying tags to leads, filtering leads by tags,
 * tag management (editing, deleting), and the UI for tag visualization.
 * 
 * Usage: node scripts/test-lead-tagging.js
 */

const dotenv = require('dotenv');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Mock database for storing leads and tags
class MockDatabase {
  constructor() {
    this.leads = [];
    this.tags = [];
    this.leadTags = []; // Many-to-many relationship between leads and tags
    this.businesses = [];
  }
  
  // Create a new business
  createBusiness(data) {
    const business = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.businesses.push(business);
    return business;
  }
  
  // Get a business by ID
  getBusiness(id) {
    return this.businesses.find(b => b.id === id);
  }
  
  // Create a new lead
  createLead(data) {
    const lead = {
      id: uuidv4(),
      ...data,
      status: data.status || 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.leads.push(lead);
    return lead;
  }
  
  // Update a lead
  updateLead(id, data) {
    const leadIndex = this.leads.findIndex(l => l.id === id);
    if (leadIndex === -1) {
      throw new Error(`Lead not found: ${id}`);
    }
    
    const updatedLead = {
      ...this.leads[leadIndex],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    this.leads[leadIndex] = updatedLead;
    return updatedLead;
  }
  
  // Get a lead by ID
  getLead(id) {
    return this.leads.find(l => l.id === id);
  }
  
  // Get leads for a business
  getLeadsByBusinessId(businessId, filters = {}) {
    let filteredLeads = this.leads.filter(l => l.businessId === businessId);
    
    // Apply filters
    if (filters.status) {
      filteredLeads = filteredLeads.filter(l => l.status === filters.status);
    }
    
    if (filters.source) {
      filteredLeads = filteredLeads.filter(l => l.source === filters.source);
    }
    
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredLeads = filteredLeads.filter(l => 
        new Date(l.createdAt) >= startDate
      );
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filteredLeads = filteredLeads.filter(l => 
        new Date(l.createdAt) <= endDate
      );
    }
    
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      filteredLeads = filteredLeads.filter(l => 
        l.name?.match(searchRegex) ||
        l.email?.match(searchRegex) ||
        l.phoneNumber?.includes(filters.search) ||
        l.notes?.match(searchRegex)
      );
    }
    
    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      // Get all lead IDs that have all the specified tags
      const leadIds = this.getLeadIdsWithTags(filters.tags);
      filteredLeads = filteredLeads.filter(l => leadIds.includes(l.id));
    }
    
    // Sort by most recently created
    filteredLeads.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    return filteredLeads;
  }
  
  // Create a new tag
  createTag(data) {
    // Check if tag with same name already exists for this business
    const existingTag = this.tags.find(t => 
      t.businessId === data.businessId && 
      t.name.toLowerCase() === data.name.toLowerCase()
    );
    
    if (existingTag) {
      throw new Error(`Tag with name "${data.name}" already exists for this business`);
    }
    
    const tag = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tags.push(tag);
    return tag;
  }
  
  // Update a tag
  updateTag(id, data) {
    const tagIndex = this.tags.findIndex(t => t.id === id);
    if (tagIndex === -1) {
      throw new Error(`Tag not found: ${id}`);
    }
    
    // Check if new name conflicts with existing tag
    if (data.name) {
      const existingTag = this.tags.find(t => 
        t.id !== id &&
        t.businessId === this.tags[tagIndex].businessId && 
        t.name.toLowerCase() === data.name.toLowerCase()
      );
      
      if (existingTag) {
        throw new Error(`Tag with name "${data.name}" already exists for this business`);
      }
    }
    
    const updatedTag = {
      ...this.tags[tagIndex],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    this.tags[tagIndex] = updatedTag;
    return updatedTag;
  }
  
  // Delete a tag
  deleteTag(id) {
    const tagIndex = this.tags.findIndex(t => t.id === id);
    if (tagIndex === -1) {
      throw new Error(`Tag not found: ${id}`);
    }
    
    // Remove all associations with leads
    this.leadTags = this.leadTags.filter(lt => lt.tagId !== id);
    
    // Remove the tag
    const deletedTag = this.tags.splice(tagIndex, 1)[0];
    return deletedTag;
  }
  
  // Get a tag by ID
  getTag(id) {
    return this.tags.find(t => t.id === id);
  }
  
  // Get tags for a business
  getTagsByBusinessId(businessId) {
    return this.tags
      .filter(t => t.businessId === businessId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  // Add a tag to a lead
  addTagToLead(leadId, tagId) {
    // Check if lead exists
    const lead = this.getLead(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }
    
    // Check if tag exists
    const tag = this.getTag(tagId);
    if (!tag) {
      throw new Error(`Tag not found: ${tagId}`);
    }
    
    // Check if lead and tag belong to the same business
    if (lead.businessId !== tag.businessId) {
      throw new Error('Lead and tag must belong to the same business');
    }
    
    // Check if association already exists
    const existingAssociation = this.leadTags.find(lt => 
      lt.leadId === leadId && lt.tagId === tagId
    );
    
    if (existingAssociation) {
      return existingAssociation;
    }
    
    // Create the association
    const association = {
      id: uuidv4(),
      leadId,
      tagId,
      createdAt: new Date().toISOString()
    };
    this.leadTags.push(association);
    
    // Update the lead's updatedAt timestamp
    this.updateLead(leadId, {});
    
    return association;
  }
  
  // Remove a tag from a lead
  removeTagFromLead(leadId, tagId) {
    // Check if association exists
    const associationIndex = this.leadTags.findIndex(lt => 
      lt.leadId === leadId && lt.tagId === tagId
    );
    
    if (associationIndex === -1) {
      throw new Error(`Tag is not associated with lead`);
    }
    
    // Remove the association
    const removedAssociation = this.leadTags.splice(associationIndex, 1)[0];
    
    // Update the lead's updatedAt timestamp
    this.updateLead(leadId, {});
    
    return removedAssociation;
  }
  
  // Get tags for a lead
  getTagsForLead(leadId) {
    // Get tag IDs associated with the lead
    const tagIds = this.leadTags
      .filter(lt => lt.leadId === leadId)
      .map(lt => lt.tagId);
    
    // Get the tags
    return this.tags
      .filter(t => tagIds.includes(t.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  // Get leads for a tag
  getLeadsForTag(tagId) {
    // Get lead IDs associated with the tag
    const leadIds = this.leadTags
      .filter(lt => lt.tagId === tagId)
      .map(lt => lt.leadId);
    
    // Get the leads
    return this.leads
      .filter(l => leadIds.includes(l.id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  // Get lead IDs that have all the specified tags
  getLeadIdsWithTags(tagIds) {
    if (!tagIds || tagIds.length === 0) {
      return [];
    }
    
    // Group lead-tag associations by lead ID
    const leadTagsMap = {};
    this.leadTags.forEach(lt => {
      if (!leadTagsMap[lt.leadId]) {
        leadTagsMap[lt.leadId] = [];
      }
      leadTagsMap[lt.leadId].push(lt.tagId);
    });
    
    // Find lead IDs that have all the specified tags
    return Object.entries(leadTagsMap)
      .filter(([leadId, leadTagIds]) => 
        tagIds.every(tagId => leadTagIds.includes(tagId))
      )
      .map(([leadId]) => leadId);
  }
}

// Lead Tagging service
class LeadTaggingService {
  constructor(database) {
    this.database = database;
  }
  
  // Create a new lead
  async createLead(data) {
    try {
      const lead = this.database.createLead(data);
      return {
        success: true,
        lead
      };
    } catch (error) {
      console.error(`Error creating lead: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Update a lead
  async updateLead(id, data) {
    try {
      const lead = this.database.updateLead(id, data);
      return {
        success: true,
        lead
      };
    } catch (error) {
      console.error(`Error updating lead: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get a lead by ID
  async getLead(id) {
    try {
      const lead = this.database.getLead(id);
      if (!lead) {
        throw new Error(`Lead not found: ${id}`);
      }
      
      // Get tags for the lead
      const tags = this.database.getTagsForLead(id);
      
      return {
        success: true,
        lead: {
          ...lead,
          tags
        }
      };
    } catch (error) {
      console.error(`Error getting lead: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get leads for a business
  async getLeads(businessId, filters = {}) {
    try {
      const leads = this.database.getLeadsByBusinessId(businessId, filters);
      
      // Enrich leads with tags
      const enrichedLeads = leads.map(lead => {
        const tags = this.database.getTagsForLead(lead.id);
        return {
          ...lead,
          tags
        };
      });
      
      return {
        success: true,
        leads: enrichedLeads
      };
    } catch (error) {
      console.error(`Error getting leads: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Create a new tag
  async createTag(data) {
    try {
      const tag = this.database.createTag(data);
      return {
        success: true,
        tag
      };
    } catch (error) {
      console.error(`Error creating tag: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Update a tag
  async updateTag(id, data) {
    try {
      const tag = this.database.updateTag(id, data);
      return {
        success: true,
        tag
      };
    } catch (error) {
      console.error(`Error updating tag: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Delete a tag
  async deleteTag(id) {
    try {
      const tag = this.database.deleteTag(id);
      return {
        success: true,
        tag
      };
    } catch (error) {
      console.error(`Error deleting tag: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get tags for a business
  async getTags(businessId) {
    try {
      const tags = this.database.getTagsByBusinessId(businessId);
      
      // Enrich tags with lead count
      const enrichedTags = tags.map(tag => {
        const leads = this.database.getLeadsForTag(tag.id);
        return {
          ...tag,
          leadCount: leads.length
        };
      });
      
      return {
        success: true,
        tags: enrichedTags
      };
    } catch (error) {
      console.error(`Error getting tags: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Add a tag to a lead
  async addTagToLead(leadId, tagId) {
    try {
      const association = this.database.addTagToLead(leadId, tagId);
      return {
        success: true,
        association
      };
    } catch (error) {
      console.error(`Error adding tag to lead: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Remove a tag from a lead
  async removeTagFromLead(leadId, tagId) {
    try {
      const association = this.database.removeTagFromLead(leadId, tagId);
      return {
        success: true,
        association
      };
    } catch (error) {
      console.error(`Error removing tag from lead: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get tags for a lead
  async getTagsForLead(leadId) {
    try {
      const tags = this.database.getTagsForLead(leadId);
      return {
        success: true,
        tags
      };
    } catch (error) {
      console.error(`Error getting tags for lead: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get leads for a tag
  async getLeadsForTag(tagId) {
    try {
      const leads = this.database.getLeadsForTag(tagId);
      
      // Enrich leads with tags
      const enrichedLeads = leads.map(lead => {
        const tags = this.database.getTagsForLead(lead.id);
        return {
          ...lead,
          tags
        };
      });
      
      return {
        success: true,
        leads: enrichedLeads
      };
    } catch (error) {
      console.error(`Error getting leads for tag: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Mock UI renderer for testing
class MockUIRenderer {
  constructor() {
    this.currentView = null;
  }
  
  // Render the leads list
  renderLeadsList(leads, tags) {
    this.currentView = 'leads_list';
    
    console.log('[UI] Rendering leads list');
    console.log(`[UI] Displaying ${leads.length} leads`);
    
    console.log('--------------------------------------------------');
    console.log('| Leads                                          |');
    console.log('|------------------------------------------------|');
    console.log('| Name                | Phone          | Tags    |');
    console.log('|---------------------|----------------|---------|');
    
    if (leads.length === 0) {
      console.log('| No leads found                                 |');
    } else {
      leads.slice(0, 5).forEach(lead => {
        const tagNames = lead.tags.map(t => t.name).join(', ');
        console.log(`| ${lead.name.padEnd(19)} | ${lead.phoneNumber.padEnd(14)} | ${tagNames.substring(0, 7).padEnd(7)} |`);
      });
    }
    
    console.log('|------------------------------------------------|');
    console.log('| Filter by Tags:                               |');
    console.log('|------------------------------------------------|');
    
    if (tags.length === 0) {
      console.log('| No tags available                              |');
    } else {
      const tagRows = [];
      let currentRow = '';
      
      tags.forEach(tag => {
        const tagDisplay = `[${tag.name}]`;
        
        if (currentRow.length + tagDisplay.length + 1 > 48) {
          tagRows.push(currentRow);
          currentRow = tagDisplay;
        } else {
          currentRow = currentRow ? `${currentRow} ${tagDisplay}` : tagDisplay;
        }
      });
      
      if (currentRow) {
        tagRows.push(currentRow);
      }
      
      tagRows.forEach(row => {
        console.log(`| ${row.padEnd(46)} |`);
      });
    }
    
    console.log('--------------------------------------------------');
    
    return true;
  }
  
  // Render the lead detail view
  renderLeadDetail(lead) {
    this.currentView = 'lead_detail';
    
    console.log('[UI] Rendering lead detail');
    console.log(`[UI] Lead: ${lead.name}`);
    
    console.log('--------------------------------------------------');
    console.log('| Lead Details                                   |');
    console.log('|------------------------------------------------|');
    console.log(`| Name: ${lead.name.padEnd(42)} |`);
    console.log(`| Phone: ${lead.phoneNumber.padEnd(41)} |`);
    console.log(`| Email: ${(lead.email || 'N/A').padEnd(41)} |`);
    console.log(`| Source: ${(lead.source || 'N/A').padEnd(40)} |`);
    console.log(`| Status: ${lead.status.padEnd(40)} |`);
    console.log(`| Created: ${new Date(lead.createdAt).toLocaleString().padEnd(39)} |`);
    console.log('|------------------------------------------------|');
    console.log('| Tags:                                          |');
    console.log('|------------------------------------------------|');
    
    if (lead.tags.length === 0) {
      console.log('| No tags                                        |');
    } else {
      const tagRows = [];
      let currentRow = '';
      
      lead.tags.forEach(tag => {
        const tagDisplay = `[${tag.name}]`;
        
        if (currentRow.length + tagDisplay.length + 1 > 48) {
          tagRows.push(currentRow);
          currentRow = tagDisplay;
        } else {
          currentRow = currentRow ? `${currentRow} ${tagDisplay}` : tagDisplay;
        }
      });
      
      if (currentRow) {
        tagRows.push(currentRow);
      }
      
      tagRows.forEach(row => {
        console.log(`| ${row.padEnd(46)} |`);
      });
    }
    
    console.log('|------------------------------------------------|');
    console.log('| Notes:                                         |');
    console.log('|------------------------------------------------|');
    
    if (!lead.notes) {
      console.log('| No notes                                        |');
    } else {
      const noteLines = lead.notes.split('\n');
      noteLines.slice(0, 3).forEach(line => {
        console.log(`| ${line.substring(0, 46).padEnd(46)} |`);
      });
      
      if (noteLines.length > 3) {
        console.log('| ...                                            |');
      }
    }
    
    console.log('--------------------------------------------------');
    
    return true;
  }
  
  // Render the tags management view
  renderTagsManagement(tags) {
    this.currentView = 'tags_management';
    
    console.log('[UI] Rendering tags management');
    console.log(`[UI] Displaying ${tags.length} tags`);
    
    console.log('--------------------------------------------------');
    console.log('| Tags Management                                |');
    console.log('|------------------------------------------------|');
    console.log('| Tag Name            | Color      | Lead Count |');
    console.log('|---------------------|------------|------------|');
    
    if (tags.length === 0) {
      console.log('| No tags available                              |');
    } else {
      tags.forEach(tag => {
        console.log(`| ${tag.name.padEnd(19)} | ${(tag.color || 'default').padEnd(10)} | ${tag.leadCount.toString().padStart(10)} |`);
      });
    }
    
    console.log('|------------------------------------------------|');
    console.log('| [Create New Tag]                               |');
    console.log('--------------------------------------------------');
    
    return true;
  }
  
  // Render the tag edit view
  renderTagEdit(tag) {
    this.currentView = 'tag_edit';
    
    console.log('[UI] Rendering tag edit');
    console.log(`[UI] Tag: ${tag ? tag.name : 'New Tag'}`);
    
    console.log('--------------------------------------------------');
    console.log(`| ${tag ? 'Edit' : 'Create'} Tag                                      |`);
    console.log('|------------------------------------------------|');
    console.log(`| Name: ${tag ? tag.name.padEnd(42) : '[Enter tag name]'.padEnd(42)} |`);
    console.log(`| Color: ${tag ? (tag.color || 'default').padEnd(40) : '[Select color]'.padEnd(40)} |`);
    console.log('|------------------------------------------------|');
    console.log(`| [${tag ? 'Save Changes' : 'Create Tag'}]                               |`);
    if (tag) {
      console.log('| [Delete Tag]                                   |');
    }
    console.log('--------------------------------------------------');
    
    return true;
  }
  
  // Render the filtered leads view
  renderFilteredLeads(leads, filterTags) {
    this.currentView = 'filtered_leads';
    
    console.log('[UI] Rendering filtered leads');
    console.log(`[UI] Displaying ${leads.length} leads filtered by tags: ${filterTags.map(t => t.name).join(', ')}`);
    
    console.log('--------------------------------------------------');
    console.log('| Filtered Leads                                 |');
    console.log('|------------------------------------------------|');
    console.log(`| Filters: ${filterTags.map(t => `[${t.name}]`).join(' ').padEnd(39)} |`);
    console.log('|------------------------------------------------|');
    console.log('| Name                | Phone          | Status  |');
    console.log('|---------------------|----------------|---------|');
    
    if (leads.length === 0) {
      console.log('| No leads match the selected filters            |');
    } else {
      leads.slice(0, 5).forEach(lead => {
        console.log(`| ${lead.name.padEnd(19)} | ${lead.phoneNumber.padEnd(14)} | ${lead.status.padEnd(7)} |`);
      });
    }
    
    console.log('--------------------------------------------------');
    
    return true;
  }
}

// Test cases for the Lead Tagging
const testCases = [
  {
    name: 'Create and manage tags',
    test: async (service, renderer) => {
      // Create a test business
      const business = service.database.createBusiness({
        name: 'Test Business',
        type: 'service',
        phoneNumber: '+15551234567',
        email: 'info@testbusiness.com'
      });
      
      // Create tags
      console.log('\nCreating tags...');
      
      const tag1Result = await service.createTag({
        businessId: business.id,
        name: 'Hot Lead',
        color: '#ff0000' // Red
      });
      
      const tag2Result = await service.createTag({
        businessId: business.id,
        name: 'Interested',
        color: '#ffaa00' // Orange
      });
      
      const tag3Result = await service.createTag({
        businessId: business.id,
        name: 'Follow Up',
        color: '#0000ff' // Blue
      });
      
      if (!tag1Result.success || !tag2Result.success || !tag3Result.success) {
        console.error('❌ Failed to create tags');
        return false;
      }
      
      console.log('✅ Tags created successfully');
      
      // Get all tags
      console.log('\nGetting all tags...');
      const tagsResult = await service.getTags(business.id);
      
      if (!tagsResult.success) {
        console.error(`❌ Failed to get tags: ${tagsResult.error}`);
        return false;
      }
      
      console.log(`✅ Retrieved ${tagsResult.tags.length} tags`);
      
      // Render tags management view
      renderer.renderTagsManagement(tagsResult.tags);
      
      // Update a tag
      console.log('\nUpdating a tag...');
      const updateTagResult = await service.updateTag(tag2Result.tag.id, {
        name: 'Very Interested',
        color: '#00aa00' // Green
      });
      
      if (!updateTagResult.success) {
        console.error(`❌ Failed to update tag: ${updateTagResult.error}`);
        return false;
      }
      
      console.log('✅ Tag updated successfully');
      
      // Render tag edit view
      renderer.renderTagEdit(updateTagResult.tag);
      
      // Delete a tag
      console.log('\nDeleting a tag...');
      const deleteTagResult = await service.deleteTag(tag3Result.tag.id);
      
      if (!deleteTagResult.success) {
        console.error(`❌ Failed to delete tag: ${deleteTagResult.error}`);
        return false;
      }
      
      console.log('✅ Tag deleted successfully');
      
      // Get updated tags
      const updatedTagsResult = await service.getTags(business.id);
      
      if (updatedTagsResult.tags.length !== 2) {
        console.error(`❌ Expected 2 tags after deletion, got ${updatedTagsResult.tags.length}`);
        return false;
      }
      
      console.log('✅ Tag count correctly updated after deletion');
      
      return true;
    }
  },
  {
    name: 'Create leads and apply tags',
    test: async (service, renderer) => {
      // Create a test business
      const business = service.database.createBusiness({
        name: 'Test Company',
        type: 'retail',
        phoneNumber: '+15559876543',
        email: 'info@testcompany.com'
      });
      
      // Create tags
      const tag1Result = await service.createTag({
        businessId: business.id,
        name: 'New Customer',
        color: '#00aa00' // Green
      });
      
      const tag2Result = await service.createTag({
        businessId: business.id,
        name: 'Needs Follow-up',
        color: '#ffaa00' // Orange
      });
      
      const tag3Result = await service.createTag({
        businessId: business.id,
        name: 'High Value',
        color: '#ff0000' // Red
      });
      
      // Create leads
      console.log('\nCreating leads...');
      
      const lead1Result = await service.createLead({
        businessId: business.id,
        name: 'John Smith',
        phoneNumber: '+15551112222',
        email: 'john.smith@example.com',
        source: 'website',
        status: 'new',
        notes: 'Interested in our premium package'
      });
      
      const lead2Result = await service.createLead({
        businessId: business.id,
        name: 'Jane Doe',
        phoneNumber: '+15553334444',
        email: 'jane.doe@example.com',
        source: 'referral',
        status: 'contacted',
        notes: 'Referred by existing customer'
      });
      
      const lead3Result = await service.createLead({
        businessId: business.id,
        name: 'Bob Johnson',
        phoneNumber: '+15555556666',
        email: 'bob.johnson@example.com',
        source: 'google',
        status: 'new',
        notes: 'Called about pricing'
      });
      
      if (!lead1Result.success || !lead2Result.success || !lead3Result.success) {
        console.error('❌ Failed to create leads');
        return false;
      }
      
      console.log('✅ Leads created successfully');
      
      // Apply tags to leads
      console.log('\nApplying tags to leads...');
      
      // John Smith: New Customer, High Value
      await service.addTagToLead(lead1Result.lead.id, tag1Result.tag.id);
      await service.addTagToLead(lead1Result.lead.id, tag3Result.tag.id);
      
      // Jane Doe: New Customer, Needs Follow-up
      await service.addTagToLead(lead2Result.lead.id, tag1Result.tag.id);
      await service.addTagToLead(lead2Result.lead.id, tag2Result.tag.id);
      
      // Bob Johnson: Needs Follow-up
      await service.addTagToLead(lead3Result.lead.id, tag2Result.tag.id);
      
      console.log('✅ Tags applied to leads successfully');
      
      // Get leads with tags
      console.log('\nGetting leads with tags...');
      const leadsResult = await service.getLeads(business.id);
      
      if (!leadsResult.success) {
        console.error(`❌ Failed to get leads: ${leadsResult.error}`);
        return false;
      }
      
      console.log(`✅ Retrieved ${leadsResult.leads.length} leads with tags`);
      
      // Verify tags were applied correctly
      const johnSmith = leadsResult.leads.find(l => l.id === lead1Result.lead.id);
      const janeDoe = leadsResult.leads.find(l => l.id === lead2Result.lead.id);
      const bobJohnson = leadsResult.leads.find(l => l.id === lead3Result.lead.id);
      
      if (johnSmith.tags.length !== 2 || janeDoe.tags.length !== 2 || bobJohnson.tags.length !== 1) {
        console.error('❌ Tags were not applied correctly');
        return false;
      }
      
      console.log('✅ Tags were applied correctly');
      
      // Render leads list
      renderer.renderLeadsList(leadsResult.leads, tagsResult.tags);
      
      // Render lead detail
      renderer.renderLeadDetail(johnSmith);
      
      return true;
    }
  },
  {
    name: 'Filter leads by tags',
    test: async (service, renderer) => {
      // Create a test business
      const business = service.database.createBusiness({
        name: 'Test Agency',
        type: 'marketing',
        phoneNumber: '+15557778888',
        email: 'info@testagency.com'
      });
      
      // Create tags
      const tag1Result = await service.createTag({
        businessId: business.id,
        name: 'Qualified',
        color: '#00aa00' // Green
      });
      
      const tag2Result = await service.createTag({
        businessId: business.id,
        name: 'Not Qualified',
        color: '#ff0000' // Red
      });
      
      const tag3Result = await service.createTag({
        businessId: business.id,
        name: 'Needs Info',
        color: '#ffaa00' // Orange
      });
      
      const tag4Result = await service.createTag({
        businessId: business.id,
        name: 'High Budget',
        color: '#0000ff' // Blue
      });
      
      // Create leads
      const leads = [];
      
      for (let i = 1; i <= 10; i++) {
        const leadResult = await service.createLead({
          businessId: business.id,
          name: `Lead ${i}`,
          phoneNumber: `+1555${i.toString().padStart(7, '0')}`,
          email: `lead${i}@example.com`,
          source: i % 2 === 0 ? 'website' : 'referral',
          status: i % 3 === 0 ? 'contacted' : 'new',
          notes: `Test lead ${i}`
        });
        
        if (leadResult.success) {
          leads.push(leadResult.lead);
        }
      }
      
      // Apply tags to leads
      // Leads 1-5: Qualified
      for (let i = 0; i < 5; i++) {
        await service.addTagToLead(leads[i].id, tag1Result.tag.id);
      }
      
      // Leads 6-10: Not Qualified
      for (let i = 5; i < 10; i++) {
        await service.addTagToLead(leads[i].id, tag2Result.tag.id);
      }
      
      // Leads 1, 3, 5, 7, 9: Needs Info
      for (let i = 0; i < 10; i += 2) {
        await service.addTagToLead(leads[i].id, tag3Result.tag.id);
      }
      
      // Leads 2, 4, 6, 8: High Budget
      for (let i = 1; i < 10; i += 2) {
        if (i !== 9) { // Skip lead 9
          await service.addTagToLead(leads[i].id, tag4Result.tag.id);
        }
      }
      
      // Get all leads
      console.log('\nGetting all leads...');
      const allLeadsResult = await service.getLeads(business.id);
      
      if (!allLeadsResult.success) {
        console.error(`❌ Failed to get leads: ${allLeadsResult.error}`);
        return false;
      }
      
      console.log(`✅ Retrieved ${allLeadsResult.leads.length} leads`);
      
      // Get all tags
      const tagsResult = await service.getTags(business.id);
      
      // Filter leads by Qualified tag
      console.log('\nFiltering leads by "Qualified" tag...');
      const qualifiedLeadsResult = await service.getLeads(business.id, {
        tags: [tag1Result.tag.id]
      });
      
      if (!qualifiedLeadsResult.success) {
        console.error(`❌ Failed to filter leads: ${qualifiedLeadsResult.error}`);
        return false;
      }
      
      console.log(`✅ Found ${qualifiedLeadsResult.leads.length} qualified leads`);
      
      if (qualifiedLeadsResult.leads.length !== 5) {
        console.error(`❌ Expected 5 qualified leads, got ${qualifiedLeadsResult.leads.length}`);
        return false;
      }
      
      // Filter leads by Qualified AND High Budget tags
      console.log('\nFiltering leads by "Qualified" AND "High Budget" tags...');
      const qualifiedHighBudgetLeadsResult = await service.getLeads(business.id, {
        tags: [tag1Result.tag.id, tag4Result.tag.id]
      });
      
      if (!qualifiedHighBudgetLeadsResult.success) {
        console.error(`❌ Failed to filter leads: ${qualifiedHighBudgetLeadsResult.error}`);
        return false;
      }
      
      console.log(`✅ Found ${qualifiedHighBudgetLeadsResult.leads.length} qualified high budget leads`);
      
      if (qualifiedHighBudgetLeadsResult.leads.length !== 2) {
        console.error(`❌ Expected 2 qualified high budget leads, got ${qualifiedHighBudgetLeadsResult.leads.length}`);
        return false;
      }
      
      // Render filtered leads
      renderer.renderFilteredLeads(
        qualifiedHighBudgetLeadsResult.leads,
        [tag1Result.tag, tag4Result.tag]
      );
      
      return true;
    }
  }
];

// Main test function
async function runTests() {
  console.log('🧪 Testing Tag and Organize Leads Manually');
  console.log('----------------------------------------');
  
  // Create mock instances
  const mockDatabase = new MockDatabase();
  const leadTaggingService = new LeadTaggingService(mockDatabase);
  const mockUIRenderer = new MockUIRenderer();
  
  // Run each test case
  for (const testCase of testCases) {
    console.log(`\n📋 Test Case: ${testCase.name}`);
    
    try {
      const result = await testCase.test(leadTaggingService, mockUIRenderer);
      
      if (result) {
        console.log(`\n✅ Test case "${testCase.name}" passed!`);
      } else {
        console.log(`\n❌ Test case "${testCase.name}" failed!`);
      }
    } catch (error) {
      console.error(`\n❌ Test error: ${error.message}`);
    }
  }
  
  console.log('\n✅ All tests completed!');
}

// Run the tests
runTests()
  .then(() => {
    console.log('Test script finished successfully');
  })
  .catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
