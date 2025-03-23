#!/usr/bin/env node

/**
 * Test script for the Basic Contact Log + Conversation History feature
 * 
 * This script tests creating contact logs, appending to conversation history,
 * retrieving and displaying conversation history, and filtering and searching functionality.
 * 
 * Usage: node scripts/test-contact-log.js
 */

const dotenv = require('dotenv');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Mock database for storing contacts and conversation history
class MockDatabase {
  constructor() {
    this.contacts = [];
    this.conversations = [];
    this.messages = [];
    this.notes = [];
    this.activities = [];
  }
  
  // Create a new contact
  createContact(data) {
    const contact = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.contacts.push(contact);
    
    // Log activity
    this.logActivity({
      type: 'contact_created',
      contactId: contact.id,
      businessId: contact.businessId,
      details: { contact }
    });
    
    return contact;
  }
  
  // Update a contact
  updateContact(id, data) {
    const contactIndex = this.contacts.findIndex(c => c.id === id);
    if (contactIndex === -1) {
      throw new Error(`Contact not found: ${id}`);
    }
    
    const updatedContact = {
      ...this.contacts[contactIndex],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    this.contacts[contactIndex] = updatedContact;
    
    // Log activity
    this.logActivity({
      type: 'contact_updated',
      contactId: updatedContact.id,
      businessId: updatedContact.businessId,
      details: { 
        before: this.contacts[contactIndex],
        after: updatedContact
      }
    });
    
    return updatedContact;
  }
  
  // Get a contact by ID
  getContact(id) {
    return this.contacts.find(c => c.id === id);
  }
  
  // Find contacts by business ID
  findContactsByBusinessId(businessId, filters = {}) {
    let filteredContacts = this.contacts.filter(c => c.businessId === businessId);
    
    // Apply filters
    if (filters.name) {
      const nameRegex = new RegExp(filters.name, 'i');
      filteredContacts = filteredContacts.filter(c => 
        c.firstName?.match(nameRegex) || 
        c.lastName?.match(nameRegex) || 
        c.name?.match(nameRegex)
      );
    }
    
    if (filters.phoneNumber) {
      filteredContacts = filteredContacts.filter(c => 
        c.phoneNumber?.includes(filters.phoneNumber)
      );
    }
    
    if (filters.email) {
      const emailRegex = new RegExp(filters.email, 'i');
      filteredContacts = filteredContacts.filter(c => 
        c.email?.match(emailRegex)
      );
    }
    
    if (filters.tag) {
      filteredContacts = filteredContacts.filter(c => 
        c.tags?.includes(filters.tag)
      );
    }
    
    // Sort by most recently updated
    filteredContacts.sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    
    return filteredContacts;
  }
  
  // Add a message to a conversation
  addMessage(data) {
    const message = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString()
    };
    this.messages.push(message);
    
    // Update conversation's lastMessageAt
    const conversation = this.getConversation(message.conversationId);
    if (conversation) {
      conversation.lastMessageAt = message.createdAt;
      conversation.updatedAt = message.createdAt;
    }
    
    // Log activity
    this.logActivity({
      type: 'message_sent',
      contactId: conversation?.contactId,
      businessId: conversation?.businessId,
      conversationId: message.conversationId,
      details: { message }
    });
    
    return message;
  }
  
  // Create a new conversation
  createConversation(data) {
    const conversation = {
      id: uuidv4(),
      ...data,
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.conversations.push(conversation);
    
    // Log activity
    this.logActivity({
      type: 'conversation_created',
      contactId: conversation.contactId,
      businessId: conversation.businessId,
      conversationId: conversation.id,
      details: { conversation }
    });
    
    return conversation;
  }
  
  // Get a conversation by ID
  getConversation(id) {
    return this.conversations.find(c => c.id === id);
  }
  
  // Find a conversation by contact ID
  findConversationByContactId(contactId) {
    return this.conversations.find(c => c.contactId === contactId);
  }
  
  // Get messages for a conversation
  getMessagesByConversationId(conversationId) {
    return this.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  
  // Get all conversations for a business
  getConversationsByBusinessId(businessId, filters = {}) {
    let filteredConversations = this.conversations.filter(c => c.businessId === businessId);
    
    // Apply filters
    if (filters.contactId) {
      filteredConversations = filteredConversations.filter(c => c.contactId === filters.contactId);
    }
    
    if (filters.hasMessages) {
      filteredConversations = filteredConversations.filter(c => {
        const messages = this.getMessagesByConversationId(c.id);
        return messages.length > 0;
      });
    }
    
    // Sort by most recent message
    filteredConversations.sort((a, b) => 
      new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
    );
    
    return filteredConversations;
  }
  
  // Add a note to a contact
  addNote(data) {
    const note = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.notes.push(note);
    
    // Log activity
    this.logActivity({
      type: 'note_added',
      contactId: note.contactId,
      businessId: note.businessId,
      details: { note }
    });
    
    return note;
  }
  
  // Get notes for a contact
  getNotesByContactId(contactId) {
    return this.notes
      .filter(n => n.contactId === contactId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  // Log an activity
  logActivity(data) {
    const activity = {
      id: uuidv4(),
      ...data,
      timestamp: new Date().toISOString()
    };
    this.activities.push(activity);
    return activity;
  }
  
  // Get activities for a contact
  getActivitiesByContactId(contactId) {
    return this.activities
      .filter(a => a.contactId === contactId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
  
  // Get activities for a business
  getActivitiesByBusinessId(businessId, filters = {}) {
    let filteredActivities = this.activities.filter(a => a.businessId === businessId);
    
    // Apply filters
    if (filters.contactId) {
      filteredActivities = filteredActivities.filter(a => a.contactId === filters.contactId);
    }
    
    if (filters.type) {
      filteredActivities = filteredActivities.filter(a => a.type === filters.type);
    }
    
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredActivities = filteredActivities.filter(a => 
        new Date(a.timestamp) >= startDate
      );
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filteredActivities = filteredActivities.filter(a => 
        new Date(a.timestamp) <= endDate
      );
    }
    
    // Sort by most recent
    filteredActivities.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    return filteredActivities;
  }
  
  // Search across all data
  search(businessId, query) {
    const results = {
      contacts: [],
      messages: [],
      notes: []
    };
    
    if (!query || query.trim() === '') {
      return results;
    }
    
    const queryRegex = new RegExp(query, 'i');
    
    // Search contacts
    results.contacts = this.contacts.filter(c => 
      c.businessId === businessId && (
        c.firstName?.match(queryRegex) ||
        c.lastName?.match(queryRegex) ||
        c.name?.match(queryRegex) ||
        c.email?.match(queryRegex) ||
        c.phoneNumber?.includes(query) ||
        c.notes?.match(queryRegex)
      )
    );
    
    // Search messages
    const businessConversations = this.conversations.filter(c => c.businessId === businessId);
    const businessConversationIds = businessConversations.map(c => c.id);
    
    results.messages = this.messages.filter(m => 
      businessConversationIds.includes(m.conversationId) &&
      m.body?.match(queryRegex)
    );
    
    // Search notes
    results.notes = this.notes.filter(n => 
      n.businessId === businessId &&
      n.content?.match(queryRegex)
    );
    
    return results;
  }
}

// Contact Log service
class ContactLogService {
  constructor(database) {
    this.database = database;
  }
  
  // Create a new contact
  async createContact(data) {
    try {
      const contact = this.database.createContact(data);
      return {
        success: true,
        contact
      };
    } catch (error) {
      console.error(`Error creating contact: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Update a contact
  async updateContact(id, data) {
    try {
      const contact = this.database.updateContact(id, data);
      return {
        success: true,
        contact
      };
    } catch (error) {
      console.error(`Error updating contact: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get a contact by ID
  async getContact(id) {
    try {
      const contact = this.database.getContact(id);
      if (!contact) {
        throw new Error(`Contact not found: ${id}`);
      }
      return {
        success: true,
        contact
      };
    } catch (error) {
      console.error(`Error getting contact: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Find contacts by business ID
  async findContactsByBusinessId(businessId, filters = {}) {
    try {
      const contacts = this.database.findContactsByBusinessId(businessId, filters);
      return {
        success: true,
        contacts
      };
    } catch (error) {
      console.error(`Error finding contacts: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Create a new conversation
  async createConversation(data) {
    try {
      const conversation = this.database.createConversation(data);
      return {
        success: true,
        conversation
      };
    } catch (error) {
      console.error(`Error creating conversation: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Add a message to a conversation
  async addMessage(data) {
    try {
      const message = this.database.addMessage(data);
      return {
        success: true,
        message
      };
    } catch (error) {
      console.error(`Error adding message: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get conversation history
  async getConversationHistory(conversationId) {
    try {
      const messages = this.database.getMessagesByConversationId(conversationId);
      return {
        success: true,
        messages
      };
    } catch (error) {
      console.error(`Error getting conversation history: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get all conversations for a business
  async getConversations(businessId, filters = {}) {
    try {
      const conversations = this.database.getConversationsByBusinessId(businessId, filters);
      
      // Enrich conversations with contact info and last message
      const enrichedConversations = conversations.map(conversation => {
        const contact = this.database.getContact(conversation.contactId);
        const messages = this.database.getMessagesByConversationId(conversation.id);
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        
        return {
          ...conversation,
          contact,
          lastMessage,
          messageCount: messages.length
        };
      });
      
      return {
        success: true,
        conversations: enrichedConversations
      };
    } catch (error) {
      console.error(`Error getting conversations: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Add a note to a contact
  async addNote(data) {
    try {
      const note = this.database.addNote(data);
      return {
        success: true,
        note
      };
    } catch (error) {
      console.error(`Error adding note: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get notes for a contact
  async getNotes(contactId) {
    try {
      const notes = this.database.getNotesByContactId(contactId);
      return {
        success: true,
        notes
      };
    } catch (error) {
      console.error(`Error getting notes: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get activities for a contact
  async getContactActivities(contactId) {
    try {
      const activities = this.database.getActivitiesByContactId(contactId);
      return {
        success: true,
        activities
      };
    } catch (error) {
      console.error(`Error getting contact activities: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get activities for a business
  async getBusinessActivities(businessId, filters = {}) {
    try {
      const activities = this.database.getActivitiesByBusinessId(businessId, filters);
      return {
        success: true,
        activities
      };
    } catch (error) {
      console.error(`Error getting business activities: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Search across all data
  async search(businessId, query) {
    try {
      const results = this.database.search(businessId, query);
      return {
        success: true,
        results
      };
    } catch (error) {
      console.error(`Error searching: ${error.message}`);
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
  
  // Render the contacts list
  renderContactsList(contacts) {
    this.currentView = 'contacts';
    
    console.log('[UI] Rendering contacts list');
    console.log(`[UI] Displaying ${contacts.length} contacts`);
    
    console.log('--------------------------------------------------');
    console.log('| Name                | Phone          | Tags    |');
    console.log('|---------------------|----------------|---------|');
    
    contacts.slice(0, 5).forEach(contact => {
      const name = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`;
      const tags = contact.tags?.join(', ') || '';
      console.log(`| ${name.padEnd(19)} | ${contact.phoneNumber.padEnd(14)} | ${tags.padEnd(7)} |`);
    });
    
    console.log('--------------------------------------------------');
    
    return true;
  }
  
  // Render a contact detail view
  renderContactDetail(contact, notes, activities) {
    this.currentView = 'contact_detail';
    
    console.log('[UI] Rendering contact detail');
    console.log(`[UI] Displaying contact: ${contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`}`);
    
    console.log('--------------------------------------------------');
    console.log('| Contact Details                                |');
    console.log('|------------------------------------------------|');
    console.log(`| Name: ${(contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`).padEnd(42)} |`);
    console.log(`| Phone: ${contact.phoneNumber.padEnd(41)} |`);
    console.log(`| Email: ${(contact.email || 'N/A').padEnd(41)} |`);
    console.log(`| Tags: ${(contact.tags?.join(', ') || 'None').padEnd(42)} |`);
    console.log(`| Created: ${new Date(contact.createdAt).toLocaleString().padEnd(39)} |`);
    console.log('|------------------------------------------------|');
    console.log('| Notes                                          |');
    console.log('|------------------------------------------------|');
    
    if (notes.length === 0) {
      console.log('| No notes                                        |');
    } else {
      notes.slice(0, 2).forEach(note => {
        console.log(`| ${new Date(note.createdAt).toLocaleString().padEnd(46)} |`);
        console.log(`| ${note.content.substring(0, 46).padEnd(46)} |`);
      });
    }
    
    console.log('|------------------------------------------------|');
    console.log('| Recent Activity                                |');
    console.log('|------------------------------------------------|');
    
    if (activities.length === 0) {
      console.log('| No recent activity                              |');
    } else {
      activities.slice(0, 3).forEach(activity => {
        console.log(`| ${new Date(activity.timestamp).toLocaleString().padEnd(46)} |`);
        console.log(`| ${activity.type.replace('_', ' ').padEnd(46)} |`);
      });
    }
    
    console.log('--------------------------------------------------');
    
    return true;
  }
  
  // Render conversation history
  renderConversationHistory(conversation, messages, contact) {
    this.currentView = 'conversation_history';
    
    console.log('[UI] Rendering conversation history');
    console.log(`[UI] Displaying conversation with ${contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`}`);
    
    console.log('--------------------------------------------------');
    console.log('| Conversation History                           |');
    console.log('|------------------------------------------------|');
    console.log(`| Contact: ${(contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`).padEnd(40)} |`);
    console.log(`| Phone: ${contact.phoneNumber.padEnd(41)} |`);
    console.log('|------------------------------------------------|');
    
    if (messages.length === 0) {
      console.log('| No messages                                     |');
    } else {
      messages.forEach(message => {
        const direction = message.direction === 'inbound' ? 'Received' : 'Sent';
        console.log(`| ${direction} - ${new Date(message.createdAt).toLocaleString().padEnd(36)} |`);
        console.log(`| ${message.body.substring(0, 46).padEnd(46)} |`);
        console.log('|------------------------------------------------|');
      });
    }
    
    console.log('--------------------------------------------------');
    
    return true;
  }
  
  // Render search results
  renderSearchResults(results) {
    this.currentView = 'search_results';
    
    console.log('[UI] Rendering search results');
    console.log(`[UI] Found ${results.contacts.length} contacts, ${results.messages.length} messages, ${results.notes.length} notes`);
    
    console.log('--------------------------------------------------');
    console.log('| Search Results                                 |');
    console.log('|------------------------------------------------|');
    
    if (results.contacts.length > 0) {
      console.log('| Contacts                                        |');
      console.log('|------------------------------------------------|');
      results.contacts.slice(0, 2).forEach(contact => {
        const name = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`;
        console.log(`| ${name.padEnd(46)} |`);
        console.log(`| ${contact.phoneNumber.padEnd(46)} |`);
      });
    }
    
    if (results.messages.length > 0) {
      console.log('|------------------------------------------------|');
      console.log('| Messages                                        |');
      console.log('|------------------------------------------------|');
      results.messages.slice(0, 2).forEach(message => {
        console.log(`| ${new Date(message.createdAt).toLocaleString().padEnd(46)} |`);
        console.log(`| ${message.body.substring(0, 46).padEnd(46)} |`);
      });
    }
    
    if (results.notes.length > 0) {
      console.log('|------------------------------------------------|');
      console.log('| Notes                                          |');
      console.log('|------------------------------------------------|');
      results.notes.slice(0, 2).forEach(note => {
        console.log(`| ${new Date(note.createdAt).toLocaleString().padEnd(46)} |`);
        console.log(`| ${note.content.substring(0, 46).padEnd(46)} |`);
      });
    }
    
    console.log('--------------------------------------------------');
    
    return true;
  }
}

// Test cases for the Contact Log
const testCases = [
  {
    name: 'Create and retrieve contacts',
    test: async (service, renderer) => {
      const businessId = 'business_1';
      
      // Create contacts
      console.log('\nCreating contacts...');
      
      const contact1Result = await service.createContact({
        businessId,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+15551234567',
        email: 'john.doe@example.com',
        tags: ['lead', 'website']
      });
      
      const contact2Result = await service.createContact({
        businessId,
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '+15559876543',
        email: 'jane.smith@example.com',
        tags: ['customer', 'referral']
      });
      
      if (!contact1Result.success || !contact2Result.success) {
        console.error('❌ Failed to create contacts');
        return false;
      }
      
      console.log('✅ Contacts created successfully');
      
      // Retrieve contacts
      console.log('\nRetrieving contacts...');
      const contactsResult = await service.findContactsByBusinessId(businessId);
      
      if (!contactsResult.success) {
        console.error(`❌ Failed to retrieve contacts: ${contactsResult.error}`);
        return false;
      }
      
      console.log(`✅ Retrieved ${contactsResult.contacts.length} contacts`);
      
      // Render contacts list
      renderer.renderContactsList(contactsResult.contacts);
      
      // Test filtering
      console.log('\nTesting contact filtering...');
      
      const filteredResult = await service.findContactsByBusinessId(businessId, {
        tag: 'lead'
      });
      
      if (!filteredResult.success) {
        console.error(`❌ Failed to filter contacts: ${filteredResult.error}`);
        return false;
      }
      
      console.log(`✅ Filtered contacts by tag 'lead': ${filteredResult.contacts.length} results`);
      
      if (filteredResult.contacts.length !== 1 || filteredResult.contacts[0].id !== contact1Result.contact.id) {
        console.error('❌ Filtering did not return the expected results');
        return false;
      }
      
      console.log('✅ Filtering returned the expected results');
      
      return true;
    }
  },
  {
    name: 'Conversation history',
    test: async (service, renderer) => {
      const businessId = 'business_1';
      
      // Create a contact
      const contactResult = await service.createContact({
        businessId,
        name: 'Alice Johnson',
        phoneNumber: '+15551112222',
        email: 'alice@example.com'
      });
      
      if (!contactResult.success) {
        console.error(`❌ Failed to create contact: ${contactResult.error}`);
        return false;
      }
      
      const contact = contactResult.contact;
      
      // Create a conversation
      console.log('\nCreating conversation...');
      const conversationResult = await service.createConversation({
        businessId,
        contactId: contact.id,
        channel: 'sms'
      });
      
      if (!conversationResult.success) {
        console.error(`❌ Failed to create conversation: ${conversationResult.error}`);
        return false;
      }
      
      const conversation = conversationResult.conversation;
      
      // Add messages to the conversation
      console.log('\nAdding messages to conversation...');
      
      const message1Result = await service.addMessage({
        conversationId: conversation.id,
        body: 'Hello! Thanks for contacting us. How can we help you today?',
        direction: 'outbound'
      });
      
      const message2Result = await service.addMessage({
        conversationId: conversation.id,
        body: 'Hi! I\'m interested in your services. Do you offer consultations?',
        direction: 'inbound'
      });
      
      const message3Result = await service.addMessage({
        conversationId: conversation.id,
        body: 'Yes, we do! We have 30-minute free consultations available. Would you like to schedule one?',
        direction: 'outbound'
      });
      
      if (!message1Result.success || !message2Result.success || !message3Result.success) {
        console.error('❌ Failed to add messages to conversation');
        return false;
      }
      
      console.log('✅ Messages added successfully');
      
      // Get conversation history
      console.log('\nRetrieving conversation history...');
      const historyResult = await service.getConversationHistory(conversation.id);
      
      if (!historyResult.success) {
        console.error(`❌ Failed to get conversation history: ${historyResult.error}`);
        return false;
      }
      
      console.log(`✅ Retrieved ${historyResult.messages.length} messages`);
      
      // Verify messages are in correct order
      const messagesInOrder = historyResult.messages.every((msg, i, arr) => {
        if (i === 0) return true;
        return new Date(msg.createdAt) >= new Date(arr[i-1].createdAt);
      });
      
      if (!messagesInOrder) {
        console.error('❌ Messages are not in chronological order');
        return false;
      }
      
      console.log('✅ Messages are in correct chronological order');
      
      // Render conversation history
      renderer.renderConversationHistory(conversation, historyResult.messages, contact);
      
      return true;
    }
  },
  {
    name: 'Contact notes and activity log',
    test: async (service, renderer) => {
      const businessId = 'business_1';
      
      // Create a contact
      const contactResult = await service.createContact({
        businessId,
        firstName: 'Robert',
        lastName: 'Brown',
        phoneNumber: '+15553334444',
        email: 'robert@example.com'
      });
      
      if (!contactResult.success) {
        console.error(`❌ Failed to create contact: ${contactResult.error}`);
        return false;
      }
      
      const contact = contactResult.contact;
      
      // Add notes to the contact
      console.log('\nAdding notes to contact...');
      
      const note1Result = await service.addNote({
        businessId,
        contactId: contact.id,
        content: 'Initial consultation scheduled for next Tuesday at 2 PM.',
        createdBy: 'user_1'
      });
      
      const note2Result = await service.addNote({
        businessId,
        contactId: contact.id,
        content: 'Customer is interested in our premium package.',
        createdBy: 'user_1'
      });
      
      if (!note1Result.success || !note2Result.success) {
        console.error('❌ Failed to add notes to contact');
        return false;
      }
      
      console.log('✅ Notes added successfully');
      
      // Update the contact
      console.log('\nUpdating contact...');
      const updateResult = await service.updateContact(contact.id, {
        tags: ['prospect', 'high-value']
      });
      
      if (!updateResult.success) {
        console.error(`❌ Failed to update contact: ${updateResult.error}`);
        return false;
      }
      
      console.log('✅ Contact updated successfully');
      
      // Get notes for the contact
      console.log('\nRetrieving contact notes...');
      const notesResult = await service.getNotes(contact.id);
      
      if (!notesResult.success) {
        console.error(`❌ Failed to get notes: ${notesResult.error}`);
        return false;
      }
      
      console.log(`✅ Retrieved ${notesResult.notes.length} notes`);
      
      // Get activities for the contact
      console.log('\nRetrieving contact activities...');
      const activitiesResult = await service.getContactActivities(contact.id);
      
      if (!activitiesResult.success) {
        console.error(`❌ Failed to get activities: ${activitiesResult.error}`);
        return false;
      }
      
      console.log(`✅ Retrieved ${activitiesResult.activities.length} activities`);
      
      // Render contact detail
      renderer.renderContactDetail(
        updateResult.contact,
        notesResult.notes,
        activitiesResult.activities
      );
      
      return true;
    }
  },
  {
    name: 'Search functionality',
    test: async (service, renderer) => {
      const businessId = 'business_1';
      
      // Create a contact
      const contactResult = await service.createContact({
        businessId,
        name: 'Michael Wilson',
        phoneNumber: '+15555555555',
        email: 'michael@example.com',
        tags: ['lead', 'website']
      });
      
      if (!contactResult.success) {
        console.error(`❌ Failed to create contact: ${contactResult.error}`);
        return false;
      }
      
      const contact = contactResult.contact;
      
      // Create a conversation
      const conversationResult = await service.createConversation({
        businessId,
        contactId: contact.id,
        channel: 'sms'
      });
      
      if (!conversationResult.success) {
        console.error(`❌ Failed to create conversation: ${conversationResult.error}`);
        return false;
      }
      
      const conversation = conversationResult.conversation;
      
      // Add a message with a specific keyword
      await service.addMessage({
        conversationId: conversation.id,
        body: 'I\'m interested in scheduling a consultation about your premium services.',
        direction: 'inbound'
      });
      
      // Add a note with a specific keyword
      await service.addNote({
        businessId,
        contactId: contact.id,
        content: 'Customer is interested in our premium consultation package.',
        createdBy: 'user_1'
      });
      
      // Search for 'premium'
      console.log('\nSearching for "premium"...');
      const searchResult = await service.search(businessId, 'premium');
      
      if (!searchResult.success) {
        console.error(`❌ Failed to search: ${searchResult.error}`);
        return false;
      }
      
      console.log(`✅ Search returned ${searchResult.results.contacts.length} contacts, ${searchResult.results.messages.length} messages, ${searchResult.results.notes.length} notes`);
      
      // Verify search results
      if (searchResult.results.messages.length === 0 || searchResult.results.notes.length === 0) {
        console.error('❌ Search did not return expected results');
        return false;
      }
      
      console.log('✅ Search returned expected results');
      
      // Render search results
      renderer.renderSearchResults(searchResult.results);
      
      return true;
    }
  }
];

// Main test function
async function runTests() {
  console.log('🧪 Testing Basic Contact Log + Conversation History');
  console.log('------------------------------------------------');
  
  // Create mock instances
  const mockDatabase = new MockDatabase();
  const contactLogService = new ContactLogService(mockDatabase);
  const mockUIRenderer = new MockUIRenderer();
  
  // Run each test case
  for (const testCase of testCases) {
    console.log(`\n📋 Test Case: ${testCase.name}`);
    
    try {
      const result = await testCase.test(contactLogService, mockUIRenderer);
      
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
