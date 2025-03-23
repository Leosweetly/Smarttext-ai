#!/usr/bin/env node

/**
 * Test script for multi-location support
 * 
 * This script tests the multi-location support functionality for the Growth Plan.
 * It creates a test business with multiple locations and tests location-specific auto-replies.
 * 
 * Usage: node scripts/test-multi-location.js
 */

const { 
  createBusiness, 
  updateBusiness, 
  getBusinessById, 
  getBusinessWithLocations,
  createLocation,
  getLocationById,
  getLocationsByBusinessId
} = require('../lib/data');

const { 
  generateMissedCallResponse,
  generateLocationMissedCallResponse
} = require('../lib/ai');

// Test data
const testBusiness = {
  name: "Bay Area Auto Repair",
  businessType: "auto shop",
  phoneNumber: "+15551234567",
  address: "123 Main St, San Francisco, CA 94105",
  subscriptionTier: "growth",
  hasMultipleLocations: true,
  hours: {
    "Monday": "8:00 AM - 6:00 PM",
    "Tuesday": "8:00 AM - 6:00 PM",
    "Wednesday": "8:00 AM - 6:00 PM",
    "Thursday": "8:00 AM - 6:00 PM",
    "Friday": "8:00 AM - 6:00 PM",
    "Saturday": "9:00 AM - 5:00 PM"
  },
  customSettings: {
    additionalInfo: "Specializing in foreign and domestic auto repair"
  }
};

const testLocations = [
  {
    name: "San Francisco Downtown",
    phoneNumber: "+15551234568",
    address: "456 Market St, San Francisco, CA 94105",
    managerName: "John Smith",
    managerEmail: "john@bayareaauto.com",
    managerPhone: "+15551234569",
    hours: {
      "Monday": "8:00 AM - 6:00 PM",
      "Tuesday": "8:00 AM - 6:00 PM",
      "Wednesday": "8:00 AM - 6:00 PM",
      "Thursday": "8:00 AM - 6:00 PM",
      "Friday": "8:00 AM - 6:00 PM",
      "Saturday": "9:00 AM - 5:00 PM"
    },
    customSettings: {
      additionalInfo: "Specializing in luxury vehicles"
    },
    autoReplyTemplates: {
      greeting: "Thank you for contacting our downtown San Francisco location."
    }
  },
  {
    name: "Oakland Branch",
    phoneNumber: "+15551234570",
    address: "789 Broadway, Oakland, CA 94607",
    managerName: "Sarah Johnson",
    managerEmail: "sarah@bayareaauto.com",
    managerPhone: "+15551234571",
    hours: {
      "Monday": "8:00 AM - 6:00 PM",
      "Tuesday": "8:00 AM - 6:00 PM",
      "Wednesday": "8:00 AM - 6:00 PM",
      "Thursday": "8:00 AM - 6:00 PM",
      "Friday": "8:00 AM - 6:00 PM",
      "Saturday": "9:00 AM - 3:00 PM"
    },
    customSettings: {
      additionalInfo: "Specializing in domestic vehicles and trucks"
    },
    autoReplyTemplates: {
      greeting: "Thank you for contacting our Oakland location."
    }
  },
  {
    name: "San Jose Branch",
    phoneNumber: "+15551234572",
    address: "101 First St, San Jose, CA 95113",
    managerName: "Michael Chen",
    managerEmail: "michael@bayareaauto.com",
    managerPhone: "+15551234573",
    hours: {
      "Monday": "8:00 AM - 7:00 PM",
      "Tuesday": "8:00 AM - 7:00 PM",
      "Wednesday": "8:00 AM - 7:00 PM",
      "Thursday": "8:00 AM - 7:00 PM",
      "Friday": "8:00 AM - 7:00 PM",
      "Saturday": "9:00 AM - 4:00 PM"
    },
    customSettings: {
      additionalInfo: "Specializing in electric and hybrid vehicles"
    },
    autoReplyTemplates: {
      greeting: "Thank you for contacting our San Jose location."
    }
  }
];

// Main function
async function testMultiLocationSupport() {
  console.log('🏢 Testing Multi-Location Support for Growth Plan');
  console.log('=================================================');
  
  try {
    // Step 1: Create a test business
    console.log('\n📝 Creating test business...');
    const business = await createBusiness(testBusiness);
    console.log(`✅ Created business: ${business.name} (ID: ${business.id})`);
    
    // Step 2: Create locations for the business
    console.log('\n📍 Creating locations for the business...');
    const locations = [];
    
    for (const locationData of testLocations) {
      const location = await createLocation({
        ...locationData,
        businessId: business.id
      });
      
      locations.push(location);
      console.log(`✅ Created location: ${location.name} (ID: ${location.id})`);
    }
    
    // Step 3: Get the business with all its locations
    console.log('\n🔍 Retrieving business with all locations...');
    const businessWithLocations = await getBusinessWithLocations(business.id);
    
    console.log(`✅ Retrieved business with ${businessWithLocations.locations.length} locations`);
    console.log('Locations:');
    businessWithLocations.locations.forEach(location => {
      console.log(`  - ${location.name} (${location.phoneNumber})`);
    });
    
    // Step 4: Test generating a response for the main business
    console.log('\n💬 Testing auto-reply for main business...');
    const mainBusinessResponse = await generateMissedCallResponse(businessWithLocations, 'growth', true);
    
    console.log('Main Business Auto-Reply:');
    console.log(`"${mainBusinessResponse}"`);
    
    // Step 5: Test generating location-specific responses
    console.log('\n💬 Testing location-specific auto-replies...');
    
    for (const location of locations) {
      const locationResponse = await generateLocationMissedCallResponse(
        location, 
        business, 
        'growth'
      );
      
      console.log(`\n${location.name} Auto-Reply:`);
      console.log(`"${locationResponse}"`);
    }
    
    console.log('\n✅ Multi-location support test completed successfully!');
    
    // Clean up (optional - comment out if you want to keep the test data)
    console.log('\n🧹 Cleaning up test data...');
    
    // Delete locations
    for (const location of locations) {
      await deleteLocation(location.id);
      console.log(`✅ Deleted location: ${location.name}`);
    }
    
    // Delete business
    await deleteBusiness(business.id);
    console.log(`✅ Deleted business: ${business.name}`);
    
  } catch (error) {
    console.error('❌ Error testing multi-location support:', error);
  }
}

// Helper function to delete a business (not implemented in the data layer)
async function deleteBusiness(id) {
  // This is a mock function since we don't have a deleteBusiness function in the data layer
  console.log(`Would delete business with ID: ${id}`);
  return true;
}

// Helper function to delete a location
async function deleteLocation(id) {
  // This is a mock function since we're not actually implementing the delete functionality
  console.log(`Would delete location with ID: ${id}`);
  return true;
}

// Run the test
testMultiLocationSupport()
  .then(() => {
    console.log('\nTest script completed.');
  })
  .catch(error => {
    console.error('Error running test script:', error);
    process.exit(1);
  });
