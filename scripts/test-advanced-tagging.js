#!/usr/bin/env node

/**
 * Test script for advanced tagging and notes functionality
 * 
 * This script tests the advanced tagging and notes features for the Pro Plan.
 * It creates tags, assigns them to entities, and adds notes to entities.
 * 
 * Usage: node scripts/test-advanced-tagging.js
 */

// Import required modules
const { 
  createTag, 
  getTagById, 
  getTagsByBusinessId, 
  assignTag, 
  getTagsForEntity,
  searchTags
} = require('../lib/tags');

const {
  createNote,
  getNotesForEntity,
  updateNote,
  archiveNote,
  searchNotes
} = require('../lib/notes');

const { 
  createBusiness,
  createContact
} = require('../lib/data');

// Test data
const testBusiness = {
  name: "Test Business for Advanced Tagging",
  businessType: "service",
  phoneNumber: "+15551234567",
  subscriptionTier: "pro",
  email: "test@example.com"
};

const testContact = {
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "+15559876543",
  email: "john.doe@example.com"
};

const testTags = [
  { name: "Hot Lead", color: "#FF5733" },
  { name: "Follow Up", color: "#33FF57" },
  { name: "Appointment Set", color: "#3357FF" },
  { name: "VIP", color: "#F3FF33" },
  { name: "Needs Quote", color: "#FF33F3" }
];

const testChildTags = [
  { name: "1 Day Follow Up", color: "#33FFC4", parentName: "Follow Up" },
  { name: "3 Day Follow Up", color: "#33C4FF", parentName: "Follow Up" },
  { name: "Weekly Follow Up", color: "#C433FF", parentName: "Follow Up" }
];

const testNotes = [
  "Customer called about a quote for service. They need it by next week.",
  "Followed up with customer. They're still interested but need more time.",
  "Customer requested a discount. Offered 10% off for first-time service.",
  "Scheduled appointment for next Tuesday at 2 PM.",
  "Customer has a dog named Max. Make sure technicians are aware."
];

// Main function
async function testAdvancedTagging() {
  console.log('🏷️  Testing Advanced Tagging and Notes for Pro Plan');
  console.log('=================================================');
  
  try {
    // Step 1: Create a test business
    console.log('\n📝 Creating test business...');
    const business = await createBusiness(testBusiness);
    console.log(`✅ Created business: ${business.name} (ID: ${business.id})`);
    
    // Step 2: Create a test contact
    console.log('\n👤 Creating test contact...');
    const contact = await createContact({
      ...testContact,
      businessId: business.id
    });
    console.log(`✅ Created contact: ${contact.firstName} ${contact.lastName} (ID: ${contact.id})`);
    
    // Step 3: Create tags
    console.log('\n🏷️  Creating tags...');
    const createdTags = [];
    
    for (const tagData of testTags) {
      const tag = await createTag({
        name: tagData.name,
        color: tagData.color,
        businessId: business.id
      });
      
      createdTags.push(tag);
      console.log(`✅ Created tag: ${tag.name} (ID: ${tag.id})`);
    }
    
    // Step 4: Create hierarchical tags
    console.log('\n🏷️  Creating hierarchical tags...');
    const createdChildTags = [];
    
    for (const childTagData of testChildTags) {
      // Find parent tag
      const parentTag = createdTags.find(tag => tag.name === childTagData.parentName);
      
      if (parentTag) {
        const childTag = await createTag({
          name: childTagData.name,
          color: childTagData.color,
          parentId: parentTag.id,
          businessId: business.id
        });
        
        createdChildTags.push(childTag);
        console.log(`✅ Created child tag: ${childTag.name} under ${parentTag.name} (ID: ${childTag.id})`);
      }
    }
    
    // Step 5: Get all tags for the business
    console.log('\n🔍 Getting all tags for the business...');
    const allTags = await getTagsByBusinessId(business.id);
    console.log(`✅ Retrieved ${allTags.length} tags for business ${business.name}`);
    
    // Step 6: Assign tags to the contact
    console.log('\n🔗 Assigning tags to contact...');
    const tagsToAssign = [createdTags[0], createdTags[1], createdChildTags[0]]; // Hot Lead, Follow Up, 1 Day Follow Up
    
    for (const tag of tagsToAssign) {
      await assignTag({
        tagId: tag.id,
        entityId: contact.id,
        entityType: 'contact',
        businessId: business.id
      });
      
      console.log(`✅ Assigned tag ${tag.name} to contact ${contact.firstName} ${contact.lastName}`);
    }
    
    // Step 7: Get tags for the contact
    console.log('\n🔍 Getting tags for the contact...');
    const contactTags = await getTagsForEntity(contact.id, 'contact');
    console.log(`✅ Retrieved ${contactTags.length} tags for contact ${contact.firstName} ${contact.lastName}:`);
    contactTags.forEach(tag => {
      console.log(`  - ${tag.name} (${tag.color})`);
    });
    
    // Step 8: Search for tags
    console.log('\n🔍 Searching for tags containing "Follow"...');
    const searchResults = await searchTags(business.id, 'Follow');
    console.log(`✅ Found ${searchResults.length} tags matching "Follow":`);
    searchResults.forEach(tag => {
      console.log(`  - ${tag.name}`);
    });
    
    // Step 9: Create notes for the contact
    console.log('\n📝 Creating notes for the contact...');
    const createdNotes = [];
    
    for (const noteContent of testNotes) {
      const note = await createNote({
        content: noteContent,
        entityId: contact.id,
        entityType: 'contact',
        createdBy: 'system', // In a real app, this would be the user ID
        businessId: business.id
      });
      
      createdNotes.push(note);
      console.log(`✅ Created note: "${noteContent.substring(0, 30)}..." (ID: ${note.id})`);
    }
    
    // Step 10: Get notes for the contact
    console.log('\n🔍 Getting notes for the contact...');
    const contactNotes = await getNotesForEntity(contact.id, 'contact');
    console.log(`✅ Retrieved ${contactNotes.length} notes for contact ${contact.firstName} ${contact.lastName}:`);
    contactNotes.forEach(note => {
      console.log(`  - "${note.content.substring(0, 30)}..." (Created: ${new Date(note.createdAt).toLocaleString()})`);
    });
    
    // Step 11: Update a note
    console.log('\n✏️  Updating a note...');
    const noteToUpdate = createdNotes[0];
    const updatedContent = `${noteToUpdate.content} UPDATED: They need the quote by Friday.`;
    
    const updatedNote = await updateNote(noteToUpdate.id, {
      content: updatedContent
    });
    
    console.log(`✅ Updated note: "${updatedNote.content.substring(0, 40)}..."`);
    
    // Step 12: Archive a note
    console.log('\n🗄️  Archiving a note...');
    const noteToArchive = createdNotes[1];
    await archiveNote(noteToArchive.id);
    console.log(`✅ Archived note: "${noteToArchive.content.substring(0, 30)}..."`);
    
    // Step 13: Get active notes for the contact
    console.log('\n🔍 Getting active notes for the contact...');
    const activeNotes = await getNotesForEntity(contact.id, 'contact', { includeArchived: false });
    console.log(`✅ Retrieved ${activeNotes.length} active notes for contact ${contact.firstName} ${contact.lastName}`);
    
    // Step 14: Search notes
    console.log('\n🔍 Searching for notes containing "appointment"...');
    const noteSearchResults = await searchNotes(business.id, 'appointment');
    console.log(`✅ Found ${noteSearchResults.length} notes matching "appointment":`);
    noteSearchResults.forEach(note => {
      console.log(`  - "${note.content.substring(0, 40)}..."`);
    });
    
    console.log('\n✅ Advanced tagging and notes test completed successfully!');
    
    // Clean up (optional - comment out if you want to keep the test data)
    console.log('\n🧹 Cleaning up test data...');
    await cleanupTestData(business.id, contact.id, createdTags, createdChildTags, createdNotes);
    
  } catch (error) {
    console.error('❌ Error testing advanced tagging and notes:', error);
  }
}

// Helper function to clean up test data
async function cleanupTestData(businessId, contactId, tags, childTags, notes) {
  try {
    // This is a mock function since we don't have delete functions for all entities
    console.log(`Would delete business with ID: ${businessId}`);
    console.log(`Would delete contact with ID: ${contactId}`);
    console.log(`Would delete ${tags.length} tags and ${childTags.length} child tags`);
    console.log(`Would delete ${notes.length} notes`);
    
    return true;
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    return false;
  }
}

// Run the test
testAdvancedTagging()
  .then(() => {
    console.log('\nTest script completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error running test script:', error);
    process.exit(1);
  });
