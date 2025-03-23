#!/usr/bin/env node

/**
 * This script tests the business type detection functionality.
 * It uses the detectBusinessType function to analyze business information
 * and determine the most likely business type.
 * 
 * Usage: node scripts/test-business-type-detection.js
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Import the AI functions using dynamic import (since they use ES modules)
async function importAI() {
  // Create a temporary file that re-exports the functions we need
  const fs = require('fs');
  const tempFile = path.resolve(__dirname, '../temp-ai-import.js');
  
  fs.writeFileSync(tempFile, `
    import { detectBusinessType, BUSINESS_TYPES } from './lib/ai/index.js';
    
    export async function testDetectBusinessType(businessInfo) {
      return await detectBusinessType(businessInfo);
    }
    
    export function getBusinessTypes() {
      return BUSINESS_TYPES;
    }
  `);
  
  // Use dynamic import to load the ES module
  const { testDetectBusinessType, getBusinessTypes } = await import('../temp-ai-import.js');
  
  // Clean up the temporary file
  fs.unlinkSync(tempFile);
  
  return { testDetectBusinessType, getBusinessTypes };
}

// Test businesses to analyze
const testBusinesses = [
  {
    name: "Joe's Pizza",
    description: "Authentic New York style pizza restaurant serving pizza, pasta, and Italian specialties.",
    address: "123 Main St, New York, NY 10001",
    keywords: ["pizza", "Italian", "restaurant", "delivery"]
  },
  {
    name: "Quick Fix Auto Repair",
    description: "Full-service auto repair shop specializing in domestic and foreign vehicles.",
    address: "456 Mechanic Ave, Los Angeles, CA 90001",
    keywords: ["auto repair", "mechanic", "oil change", "brake service"]
  },
  {
    name: "Glamour Cuts",
    description: "Hair salon offering cuts, color, styling, and beauty treatments.",
    address: "789 Beauty Blvd, Miami, FL 33101",
    keywords: ["hair salon", "haircut", "color", "styling"]
  },
  {
    name: "Handy Home Services",
    description: "Professional home repair and maintenance services including plumbing, electrical, and general contracting.",
    address: "101 Builder St, Chicago, IL 60601",
    keywords: ["home repair", "plumbing", "electrical", "contractor"]
  },
  {
    name: "Lakeside Medical Center",
    description: "Family medical practice providing comprehensive healthcare services for patients of all ages.",
    address: "202 Health Dr, Seattle, WA 98101",
    keywords: ["medical", "doctor", "healthcare", "family practice"]
  }
];

async function testBusinessTypeDetection() {
  try {
    console.log('🔍 Testing Business Type Detection...\n');
    
    // Import the AI functions
    const { testDetectBusinessType, getBusinessTypes } = await importAI();
    
    // Get the list of business types
    const businessTypes = getBusinessTypes();
    console.log('Available Business Types:');
    businessTypes.forEach(type => {
      console.log(`- ${type.name} (${type.id}): ${type.description}`);
    });
    console.log('\n');
    
    // Test each business
    for (const business of testBusinesses) {
      console.log(`Testing business: "${business.name}"`);
      console.log(`Description: ${business.description}`);
      
      const result = await testDetectBusinessType(business);
      
      console.log(`\nDetected Type: ${result.detectedType} (Confidence: ${result.confidence}%)`);
      
      if (result.alternativeTypes && result.alternativeTypes.length > 0) {
        console.log('Alternative Types:');
        result.alternativeTypes.forEach(alt => {
          console.log(`- ${alt.type} (Confidence: ${alt.confidence}%)`);
        });
      }
      
      console.log('\n' + '-'.repeat(80) + '\n');
    }
    
    console.log('✅ Business Type Detection Test Completed!');
    
  } catch (error) {
    console.error('❌ Error testing business type detection:', error);
  }
}

// Execute the test function
testBusinessTypeDetection()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
