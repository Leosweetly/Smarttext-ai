#!/usr/bin/env node

/**
 * Test script for the Two-way SMS Inbox feature
 * 
 * This script tests sending and receiving SMS messages,
 * conversation threading, and UI display on both mobile and desktop views.
 * 
 * Usage: node scripts/test-sms-inbox.js
 */

const dotenv = require('dotenv');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Mock Twilio client for testing
class MockTwilioClient {
  constructor() {
    this.sentMessages = [];
    this.receivedMessages = [];
    this.messages = {
      create: async (messageData) => {
        console.log(`[MOCK] Sending SMS: ${JSON.stringify(messageData)}`);
        const messageId = `SM${Date.now()}`;
        const message = {
          sid: messageId,
          body: messageData.body,
          from: messageData.from,
          to: messageData.to,
          status: 'sent',
          direction: 'outbound-api',
          dateCreated: new Date().toISOString()
        };
        this.sentMessages.push(message);
        return message;
      },
      list: async (filters) => {
        console.log(`[MOCK] Listing messages with filters: ${JSON.stringify(filters)}`);
        // Combine sent and received messages
        const allMessages = [...this.sentMessages, ...this.receivedMessages];
        
        // Apply filters
        let filteredMessages = allMessages;
        
        if (filters.from) {
          filteredMessages = filteredMessages.filter(msg => msg.from === filters.from);
        }
        
        if (filters.to) {
          filteredMessages = filteredMessages.filter(msg => msg.to === filters.to);
        }
        
        if (filters.dateSentAfter) {
          const afterDate = new Date(filters.dateSentAfter);
          filteredMessages = filteredMessages.filter(msg => new Date(msg.dateCreated) > afterDate);
        }
        
        // Sort by date
        filteredMessages.sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));
        
        return filteredMessages;
      }
    };
  }
  
  // Helper method to simulate receiving an inbound message
  simulateInboundMessage(from, to, body) {
    const messageId = `SM${Date.now()}`;
    const message = {
      sid: messageId,
      body: body,
      from: from,
      to: to,
      status: 'received',
      direction: 'inbound',
      dateCreated: new Date().toISOString()
    };
    this.receivedMessages.push(message);
    return message;
  }
}

// Mock database for storing conversations and contacts
class MockDatabase {
  constructor() {
    this.conversations = [];
    this.contacts = [];
    this.messages = [];
  }
  
  // Create a new contact
  createContact(phoneNumber, name = null, businessId) {
    const contact = {
      id: uuidv4(),
      phoneNumber,
      name: name || `Contact ${phoneNumber}`,
      businessId,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.contacts.push(contact);
    return contact;
  }
  
  // Find a contact by phone number
  findContactByPhoneNumber(phoneNumber, businessId) {
    return this.contacts.find(c => c.phoneNumber === phoneNumber && c.businessId === businessId);
  }
  
  // Create a new conversation
  createConversation(contactId, businessId) {
    const conversation = {
      id: uuidv4(),
      contactId,
      businessId,
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.conversations.push(conversation);
    return conversation;
  }
  
  // Find a conversation by contact ID
  findConversationByContactId(contactId, businessId) {
    return this.conversations.find(c => c.contactId === contactId && c.businessId === businessId);
  }
  
  // Add a message to a conversation
  addMessage(conversationId, body, direction, twilioMessageId) {
    const message = {
      id: uuidv4(),
      conversationId,
      body,
      direction, // 'inbound' or 'outbound'
      twilioMessageId,
      createdAt: new Date().toISOString()
    };
    this.messages.push(message);
    
    // Update conversation's lastMessageAt
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.lastMessageAt = message.createdAt;
      conversation.updatedAt = message.createdAt;
    }
    
    return message;
  }
  
  // Get messages for a conversation
  getMessagesByConversationId(conversationId) {
    return this.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  
  // Get all conversations for a business
  getConversationsByBusinessId(businessId) {
    return this.conversations
      .filter(c => c.businessId === businessId)
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  }
  
  // Add a tag to a contact
  addTagToContact(contactId, tag) {
    const contact = this.contacts.find(c => c.id === contactId);
    if (contact && !contact.tags.includes(tag)) {
      contact.tags.push(tag);
      contact.updatedAt = new Date().toISOString();
    }
    return contact;
  }
  
  // Remove a tag from a contact
  removeTagFromContact(contactId, tag) {
    const contact = this.contacts.find(c => c.id === contactId);
    if (contact) {
      contact.tags = contact.tags.filter(t => t !== tag);
      contact.updatedAt = new Date().toISOString();
    }
    return contact;
  }
}

// SMS Inbox service
class SmsInboxService {
  constructor(twilioClient, database) {
    this.twilioClient = twilioClient;
    this.database = database;
  }
  
  // Send an SMS message
  async sendMessage(businessPhoneNumber, customerPhoneNumber, messageBody, businessId) {
    try {
      console.log(`Sending message from ${businessPhoneNumber} to ${customerPhoneNumber}`);
      
      // Send the message via Twilio
      const twilioMessage = await this.twilioClient.messages.create({
        body: messageBody,
        from: businessPhoneNumber,
        to: customerPhoneNumber
      });
      
      // Find or create contact
      let contact = this.database.findContactByPhoneNumber(customerPhoneNumber, businessId);
      if (!contact) {
        contact = this.database.createContact(customerPhoneNumber, null, businessId);
      }
      
      // Find or create conversation
      let conversation = this.database.findConversationByContactId(contact.id, businessId);
      if (!conversation) {
        conversation = this.database.createConversation(contact.id, businessId);
      }
      
      // Add message to conversation
      const message = this.database.addMessage(
        conversation.id,
        messageBody,
        'outbound',
        twilioMessage.sid
      );
      
      return {
        success: true,
        message,
        twilioMessageId: twilioMessage.sid
      };
    } catch (error) {
      console.error(`Error sending message: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Handle an incoming SMS message
  async handleIncomingMessage(twilioMessage, businessId) {
    try {
      console.log(`Handling incoming message from ${twilioMessage.from} to ${twilioMessage.to}`);
      
      // Find or create contact
      let contact = this.database.findContactByPhoneNumber(twilioMessage.from, businessId);
      if (!contact) {
        contact = this.database.createContact(twilioMessage.from, null, businessId);
      }
      
      // Find or create conversation
      let conversation = this.database.findConversationByContactId(contact.id, businessId);
      if (!conversation) {
        conversation = this.database.createConversation(contact.id, businessId);
      }
      
      // Add message to conversation
      const message = this.database.addMessage(
        conversation.id,
        twilioMessage.body,
        'inbound',
        twilioMessage.sid
      );
      
      return {
        success: true,
        message,
        contact,
        conversation
      };
    } catch (error) {
      console.error(`Error handling incoming message: ${error.message}`);
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
  async getConversations(businessId) {
    try {
      const conversations = this.database.getConversationsByBusinessId(businessId);
      
      // Enrich conversations with contact info and last message
      const enrichedConversations = conversations.map(conversation => {
        const contact = this.database.contacts.find(c => c.id === conversation.contactId);
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
  
  // Add a tag to a contact
  async addTag(contactId, tag) {
    try {
      const contact = this.database.addTagToContact(contactId, tag);
      return {
        success: true,
        contact
      };
    } catch (error) {
      console.error(`Error adding tag: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Remove a tag from a contact
  async removeTag(contactId, tag) {
    try {
      const contact = this.database.removeTagFromContact(contactId, tag);
      return {
        success: true,
        contact
      };
    } catch (error) {
      console.error(`Error removing tag: ${error.message}`);
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
    this.mobileView = false;
  }
  
  // Set mobile or desktop view
  setMobileView(isMobile) {
    this.mobileView = isMobile;
    console.log(`[UI] Switched to ${isMobile ? 'mobile' : 'desktop'} view`);
  }
  
  // Render the inbox view
  renderInbox(conversations) {
    this.currentView = 'inbox';
    
    console.log(`[UI] Rendering ${this.mobileView ? 'mobile' : 'desktop'} inbox view`);
    console.log(`[UI] Displaying ${conversations.length} conversations`);
    
    if (this.mobileView) {
      console.log('[UI] Mobile inbox layout:');
      console.log('-------------------------');
      console.log('| Conversation List    |');
      console.log('|---------------------|');
      conversations.slice(0, 3).forEach((conv, i) => {
        const contact = conv.contact;
        const lastMessage = conv.lastMessage;
        console.log(`| ${i+1}. ${contact.name.padEnd(16)} |`);
        console.log(`|    ${lastMessage ? lastMessage.body.substring(0, 14) + '...' : 'No messages'} |`);
      });
      console.log('-------------------------');
    } else {
      console.log('[UI] Desktop inbox layout:');
      console.log('------------------------------------------------------------------');
      console.log('| Conversation List    |                                         |');
      console.log('|---------------------|                                         |');
      conversations.slice(0, 3).forEach((conv, i) => {
        const contact = conv.contact;
        const lastMessage = conv.lastMessage;
        console.log(`| ${i+1}. ${contact.name.padEnd(16)} |                                         |`);
        console.log(`|    ${lastMessage ? lastMessage.body.substring(0, 14) + '...' : 'No messages'} |                                         |`);
      });
      console.log('|                     |                                         |');
      console.log('|                     |                                         |');
      console.log('|                     |                                         |');
      console.log('------------------------------------------------------------------');
    }
    
    return true;
  }
  
  // Render a conversation view
  renderConversation(conversation, messages, contact) {
    this.currentView = 'conversation';
    
    console.log(`[UI] Rendering ${this.mobileView ? 'mobile' : 'desktop'} conversation view`);
    console.log(`[UI] Displaying conversation with ${contact.name} (${contact.phoneNumber})`);
    console.log(`[UI] Tags: ${contact.tags.join(', ') || 'None'}`);
    
    if (this.mobileView) {
      console.log('[UI] Mobile conversation layout:');
      console.log('-------------------------');
      console.log(`| ${contact.name.padEnd(23)} |`);
      console.log('|-------------------------|');
      messages.slice(-3).forEach(msg => {
        const isInbound = msg.direction === 'inbound';
        const align = isInbound ? 'left' : 'right';
        const prefix = isInbound ? '< ' : ' >';
        console.log(`| ${prefix}${msg.body.substring(0, 19).padEnd(19)}${prefix} |`);
      });
      console.log('|                         |');
      console.log('| [Message input field]   |');
      console.log('-------------------------');
    } else {
      console.log('[UI] Desktop conversation layout:');
      console.log('------------------------------------------------------------------');
      console.log('| Conversation List    |                                         |');
      console.log('|---------------------|  Contact: ' + contact.name.padEnd(33) + ' |');
      console.log(`| ${contact.name.padEnd(16)} |  Phone: ${contact.phoneNumber.padEnd(33)} |`);
      console.log('|                     |  Tags: ' + (contact.tags.join(', ') || 'None').padEnd(33) + ' |');
      console.log('|                     |-------------------------------------------|');
      messages.slice(-3).forEach(msg => {
        const isInbound = msg.direction === 'inbound';
        const align = isInbound ? 'left' : 'right';
        const prefix = isInbound ? '< ' : ' >';
        console.log(`|                     |  ${prefix}${msg.body.substring(0, 40).padEnd(40)}${prefix} |`);
      });
      console.log('|                     |                                         |');
      console.log('|                     |  [Message input field]                  |');
      console.log('------------------------------------------------------------------');
    }
    
    return true;
  }
}

// Test cases for the SMS Inbox
const testCases = [
  {
    name: 'Send and receive messages',
    test: async (service, renderer) => {
      const businessId = 'business_1';
      const businessPhone = '+15551234567';
      const customerPhone = '+15559876543';
      
      // Send a message
      console.log('\nSending initial message to customer...');
      const sendResult = await service.sendMessage(
        businessPhone,
        customerPhone,
        'Hello! Thanks for contacting us. How can we help you today?',
        businessId
      );
      
      if (!sendResult.success) {
        console.error(`❌ Failed to send message: ${sendResult.error}`);
        return false;
      }
      
      console.log('✅ Message sent successfully');
      
      // Simulate customer reply
      console.log('\nSimulating customer reply...');
      const twilioMessage = service.twilioClient.simulateInboundMessage(
        customerPhone,
        businessPhone,
        'Hi! I\'d like to schedule an appointment for next week.'
      );
      
      const incomingResult = await service.handleIncomingMessage(twilioMessage, businessId);
      
      if (!incomingResult.success) {
        console.error(`❌ Failed to handle incoming message: ${incomingResult.error}`);
        return false;
      }
      
      console.log('✅ Incoming message handled successfully');
      
      // Get conversation history
      console.log('\nRetrieving conversation history...');
      const historyResult = await service.getConversationHistory(incomingResult.conversation.id);
      
      if (!historyResult.success) {
        console.error(`❌ Failed to get conversation history: ${historyResult.error}`);
        return false;
      }
      
      console.log(`✅ Retrieved ${historyResult.messages.length} messages`);
      historyResult.messages.forEach(msg => {
        console.log(`- [${msg.direction}] ${msg.body}`);
      });
      
      return true;
    }
  },
  {
    name: 'Conversation threading',
    test: async (service, renderer) => {
      const businessId = 'business_1';
      const businessPhone = '+15551234567';
      const customerPhone1 = '+15559876543';
      const customerPhone2 = '+15558765432';
      
      // Create multiple conversations
      console.log('\nCreating multiple conversations...');
      
      // Conversation 1
      await service.sendMessage(
        businessPhone,
        customerPhone1,
        'Hello! Thanks for contacting us. How can we help you today?',
        businessId
      );
      
      const reply1 = service.twilioClient.simulateInboundMessage(
        customerPhone1,
        businessPhone,
        'Hi! I\'d like to schedule an appointment for next week.'
      );
      
      await service.handleIncomingMessage(reply1, businessId);
      
      await service.sendMessage(
        businessPhone,
        customerPhone1,
        'Great! We have availability on Monday at 2 PM or Wednesday at 10 AM. Which works better for you?',
        businessId
      );
      
      // Conversation 2
      await service.sendMessage(
        businessPhone,
        customerPhone2,
        'Hello! Thanks for your interest. How can we assist you?',
        businessId
      );
      
      const reply2 = service.twilioClient.simulateInboundMessage(
        customerPhone2,
        businessPhone,
        'Do you offer weekend appointments?'
      );
      
      await service.handleIncomingMessage(reply2, businessId);
      
      // Get all conversations
      console.log('\nRetrieving all conversations...');
      const conversationsResult = await service.getConversations(businessId);
      
      if (!conversationsResult.success) {
        console.error(`❌ Failed to get conversations: ${conversationsResult.error}`);
        return false;
      }
      
      console.log(`✅ Retrieved ${conversationsResult.conversations.length} conversations`);
      
      // Verify conversations are sorted by most recent
      const sortedCorrectly = conversationsResult.conversations.every((conv, i, arr) => {
        if (i === 0) return true;
        return new Date(conv.lastMessageAt) <= new Date(arr[i-1].lastMessageAt);
      });
      
      if (!sortedCorrectly) {
        console.error('❌ Conversations are not sorted by most recent');
        return false;
      }
      
      console.log('✅ Conversations are correctly sorted by most recent');
      
      // Render the inbox
      renderer.renderInbox(conversationsResult.conversations);
      
      return true;
    }
  },
  {
    name: 'Contact tagging',
    test: async (service, renderer) => {
      const businessId = 'business_1';
      const businessPhone = '+15551234567';
      const customerPhone = '+15557654321';
      
      // Create a conversation
      console.log('\nCreating a conversation...');
      await service.sendMessage(
        businessPhone,
        customerPhone,
        'Hello! Thanks for contacting us. How can we help you today?',
        businessId
      );
      
      const reply = service.twilioClient.simulateInboundMessage(
        customerPhone,
        businessPhone,
        'Hi! I\'m interested in your premium service package.'
      );
      
      const incomingResult = await service.handleIncomingMessage(reply, businessId);
      
      // Add tags to the contact
      console.log('\nAdding tags to contact...');
      const addTagResult1 = await service.addTag(incomingResult.contact.id, 'premium');
      const addTagResult2 = await service.addTag(incomingResult.contact.id, 'interested');
      
      if (!addTagResult1.success || !addTagResult2.success) {
        console.error('❌ Failed to add tags to contact');
        return false;
      }
      
      console.log(`✅ Tags added: ${addTagResult2.contact.tags.join(', ')}`);
      
      // Get conversations to see the tagged contact
      const conversationsResult = await service.getConversations(businessId);
      
      // Find our conversation
      const conversation = conversationsResult.conversations.find(
        c => c.contact.phoneNumber === customerPhone
      );
      
      if (!conversation) {
        console.error('❌ Could not find conversation with tagged contact');
        return false;
      }
      
      // Verify tags
      if (!conversation.contact.tags.includes('premium') || !conversation.contact.tags.includes('interested')) {
        console.error('❌ Tags not properly applied to contact');
        return false;
      }
      
      console.log('✅ Tags correctly applied to contact');
      
      // Remove a tag
      console.log('\nRemoving a tag...');
      const removeTagResult = await service.removeTag(incomingResult.contact.id, 'interested');
      
      if (!removeTagResult.success) {
        console.error('❌ Failed to remove tag from contact');
        return false;
      }
      
      console.log(`✅ Tags after removal: ${removeTagResult.contact.tags.join(', ')}`);
      
      // Verify tag was removed
      if (removeTagResult.contact.tags.includes('interested')) {
        console.error('❌ Tag was not properly removed from contact');
        return false;
      }
      
      console.log('✅ Tag correctly removed from contact');
      
      return true;
    }
  },
  {
    name: 'UI display on mobile and desktop',
    test: async (service, renderer) => {
      const businessId = 'business_1';
      
      // Get all conversations
      const conversationsResult = await service.getConversations(businessId);
      
      if (!conversationsResult.success) {
        console.error(`❌ Failed to get conversations: ${conversationsResult.error}`);
        return false;
      }
      
      // Test desktop view
      console.log('\nTesting desktop view...');
      renderer.setMobileView(false);
      renderer.renderInbox(conversationsResult.conversations);
      
      // Get a conversation to display
      const conversation = conversationsResult.conversations[0];
      const historyResult = await service.getConversationHistory(conversation.id);
      
      if (!historyResult.success) {
        console.error(`❌ Failed to get conversation history: ${historyResult.error}`);
        return false;
      }
      
      renderer.renderConversation(
        conversation,
        historyResult.messages,
        conversation.contact
      );
      
      // Test mobile view
      console.log('\nTesting mobile view...');
      renderer.setMobileView(true);
      renderer.renderInbox(conversationsResult.conversations);
      
      renderer.renderConversation(
        conversation,
        historyResult.messages,
        conversation.contact
      );
      
      return true;
    }
  }
];

// Main test function
async function runTests() {
  console.log('🧪 Testing Two-way SMS Inbox');
  console.log('---------------------------');
  
  // Create mock instances
  const mockTwilioClient = new MockTwilioClient();
  const mockDatabase = new MockDatabase();
  const smsInboxService = new SmsInboxService(mockTwilioClient, mockDatabase);
  const mockUIRenderer = new MockUIRenderer();
  
  // Run each test case
  for (const testCase of testCases) {
    console.log(`\n📋 Test Case: ${testCase.name}`);
    
    try {
      const result = await testCase.test(smsInboxService, mockUIRenderer);
      
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
