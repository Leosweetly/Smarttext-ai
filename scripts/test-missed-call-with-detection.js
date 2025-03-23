#!/usr/bin/env node

/**
 * This script tests the missed call response functionality with business type detection.
 * It generates responses for different types of businesses to demonstrate the industry-specific
 * customization of the auto-text messages.
 * 
 * Usage: node scripts/test-missed-call-with-detection.js
 */

const dotenv = require('dotenv');
const path = require('path');
const { OpenAI } = require('openai');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Import the AI functions using dynamic import (since they use ES modules)
async function importAI() {
  // Create a temporary file that re-exports the functions we need
  const fs = require('fs');
  const tempFile = path.resolve(__dirname, '../temp-ai-import.js');
  
  fs.writeFileSync(tempFile, `
    import { 
      BUSINESS_TYPES, 
      detectBusinessType, 
      generateMissedCallResponse, 
      generateLocationMissedCallResponse 
    } from './lib/ai/index.js';
    
    export async function testDetectBusinessType(businessInfo) {
      return await detectBusinessType(businessInfo);
    }
    
    export function getBusinessTypes() {
      return BUSINESS_TYPES;
    }
    
    export async function testGenerateMissedCallResponse(business, subscriptionTier, hasMultipleLocations) {
      return await generateMissedCallResponse(business, subscriptionTier, hasMultipleLocations);
    }
    
    export async function testGenerateLocationMissedCallResponse(location, business, subscriptionTier) {
      return await generateLocationMissedCallResponse(location, business, subscriptionTier);
    }
  `);
  
  try {
    // Use dynamic import to load the ES module
    const { 
      getBusinessTypes, 
      testDetectBusinessType, 
      testGenerateMissedCallResponse, 
      testGenerateLocationMissedCallResponse 
    } = await import('../temp-ai-import.js');
    
    return { 
      getBusinessTypes, 
      testDetectBusinessType, 
      testGenerateMissedCallResponse, 
      testGenerateLocationMissedCallResponse 
    };
  } catch (error) {
    console.error('Error importing AI functions:', error);
    throw error;
  } finally {
    // Clean up the temporary file
    fs.unlinkSync(tempFile);
  }
}

// Test businesses with different types
const testBusinesses = [
  {
    name: "Joe's Pizza",
    description: "Authentic New York style pizza restaurant serving pizza, pasta, and Italian specialties.",
    hours: {
      Monday: "11am-10pm",
      Tuesday: "11am-10pm",
      Wednesday: "11am-10pm",
      Thursday: "11am-10pm",
      Friday: "11am-11pm",
      Saturday: "11am-11pm",
      Sunday: "12pm-9pm"
    },
    orderingLink: "https://joespizza.com/order",
    websiteUrl: "https://joespizza.com",
    // No type specified - should be detected as 'restaurant'
  },
  {
    name: "Quick Fix Auto Repair",
    type: "auto_shop", // Type explicitly specified
    description: "Full-service auto repair shop specializing in domestic and foreign vehicles.",
    hours: {
      Monday: "8am-6pm",
      Tuesday: "8am-6pm",
      Wednesday: "8am-6pm",
      Thursday: "8am-6pm",
      Friday: "8am-6pm",
      Saturday: "9am-3pm"
    },
    quoteLink: "https://quickfixauto.com/quote",
    websiteUrl: "https://quickfixauto.com"
  },
  {
    name: "Glamour Cuts",
    description: "Hair salon offering cuts, color, styling, and beauty treatments.",
    hours: {
      Monday: "9am-7pm",
      Tuesday: "9am-7pm",
      Wednesday: "9am-7pm",
      Thursday: "9am-8pm",
      Friday: "9am-8pm",
      Saturday: "9am-6pm"
    },
    bookingLink: "https://glamourcuts.com/book",
    websiteUrl: "https://glamourcuts.com",
    // No type specified - should be detected as 'salon'
  },
  {
    name: "Lakeside Medical Center",
    type: "healthcare", // Type explicitly specified
    description: "Family medical practice providing comprehensive healthcare services for patients of all ages.",
    hours: {
      Monday: "8am-5pm",
      Tuesday: "8am-5pm",
      Wednesday: "8am-5pm",
      Thursday: "8am-5pm",
      Friday: "8am-5pm"
    },
    websiteUrl: "https://lakesidemedical.com"
  },
  {
    name: "City Dental Group",
    description: "Comprehensive dental care including general dentistry, cosmetic procedures, and emergency services.",
    hours: {
      Monday: "9am-5pm",
      Tuesday: "9am-5pm",
      Wednesday: "9am-5pm",
      Thursday: "9am-7pm",
      Friday: "9am-4pm"
    },
    bookingLink: "https://citydental.com/appointments",
    websiteUrl: "https://citydental.com",
    // No type specified - should be detected as 'healthcare'
  }
];

// Test locations
const testLocations = [
  {
    name: "Joe's Pizza - Downtown",
    address: "123 Main St, New York, NY 10001",
    hours: {
      Monday: "11am-10pm",
      Tuesday: "11am-10pm",
      Wednesday: "11am-10pm",
      Thursday: "11am-10pm",
      Friday: "11am-11pm",
      Saturday: "11am-11pm",
      Sunday: "12pm-9pm"
    },
    managerName: "Mike Johnson",
    orderingLink: "https://joespizza.com/downtown/order",
    // Parent business would be Joe's Pizza
  },
  {
    name: "Quick Fix Auto - West Side",
    address: "456 Mechanic Ave, Los Angeles, CA 90001",
    hours: {
      Monday: "8am-6pm",
      Tuesday: "8am-6pm",
      Wednesday: "8am-6pm",
      Thursday: "8am-6pm",
      Friday: "8am-6pm",
      Saturday: "9am-3pm"
    },
    managerName: "Sarah Thompson",
    quoteLink: "https://quickfixauto.com/westside/quote",
    // Parent business would be Quick Fix Auto Repair
  }
];

async function testMissedCallResponses() {
  try {
    console.log('🔍 Testing Missed Call Responses with Business Type Detection...\n');
    
    // Import the AI functions
    const { 
      getBusinessTypes, 
      testDetectBusinessType, 
      testGenerateMissedCallResponse, 
      testGenerateLocationMissedCallResponse 
    } = await importAI();
    
    // Get the list of business types
    const businessTypes = getBusinessTypes();
    console.log('Available Business Types:');
    businessTypes.forEach(type => {
      console.log(`- ${type.name} (${type.id}): ${type.description}`);
    });
    console.log('\n');
    
    // Test each business with different subscription tiers
    console.log('=== TESTING BUSINESS RESPONSES ===\n');
    
    for (const business of testBusinesses) {
      console.log(`Testing business: "${business.name}"`);
      console.log(`Description: ${business.description}`);
      
      // Detect business type if not specified
      if (!business.type) {
        const detectionResult = await testDetectBusinessType({
          name: business.name,
          description: business.description
        });
        
        console.log(`\nDetected Type: ${detectionResult.detectedType} (Confidence: ${detectionResult.confidence}%)`);
        business.type = detectionResult.detectedType;
      } else {
        console.log(`\nSpecified Type: ${business.type}`);
      }
      
      // Generate responses for different subscription tiers
      console.log('\n--- Basic Tier Response ---');
      const basicResponse = await testGenerateMissedCallResponse(business, 'basic', false);
      console.log(basicResponse);
      
      console.log('\n--- Pro Tier Response ---');
      const proResponse = await testGenerateMissedCallResponse(business, 'pro', false);
      console.log(proResponse);
      
      console.log('\n--- Enterprise Tier Response ---');
      const enterpriseResponse = await testGenerateMissedCallResponse(business, 'enterprise', false);
      console.log(enterpriseResponse);
      
      console.log('\n' + '-'.repeat(80) + '\n');
    }
    
    // Test locations with parent businesses
    console.log('=== TESTING LOCATION RESPONSES ===\n');
    
    // Joe's Pizza Downtown location
    const pizzaLocation = testLocations[0];
    const pizzaBusiness = testBusinesses[0];
    
    console.log(`Testing location: "${pizzaLocation.name}"`);
    console.log(`Parent business: "${pizzaBusiness.name}"`);
    
    console.log('\n--- Basic Tier Response ---');
    const basicLocationResponse = await testGenerateLocationMissedCallResponse(pizzaLocation, pizzaBusiness, 'basic');
    console.log(basicLocationResponse);
    
    console.log('\n--- Pro Tier Response ---');
    const proLocationResponse = await testGenerateLocationMissedCallResponse(pizzaLocation, pizzaBusiness, 'pro');
    console.log(proLocationResponse);
    
    console.log('\n' + '-'.repeat(80) + '\n');
    
    // Quick Fix Auto West Side location
    const autoLocation = testLocations[1];
    const autoBusiness = testBusinesses[1];
    
    console.log(`Testing location: "${autoLocation.name}"`);
    console.log(`Parent business: "${autoBusiness.name}"`);
    
    console.log('\n--- Basic Tier Response ---');
    const basicAutoLocationResponse = await testGenerateLocationMissedCallResponse(autoLocation, autoBusiness, 'basic');
    console.log(basicAutoLocationResponse);
    
    console.log('\n--- Pro Tier Response ---');
    const proAutoLocationResponse = await testGenerateLocationMissedCallResponse(autoLocation, autoBusiness, 'pro');
    console.log(proAutoLocationResponse);
    
    console.log('\n' + '-'.repeat(80) + '\n');
    
    console.log('✅ Missed Call Response Testing Completed!');
    
  } catch (error) {
    console.error('❌ Error testing missed call responses:', error);
  }
}

// Execute the test function
testMissedCallResponses()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
