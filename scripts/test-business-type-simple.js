#!/usr/bin/env node

/**
 * This script tests the business type detection functionality directly using OpenAI.
 * It bypasses the module system issues by directly implementing the detection logic.
 * 
 * Usage: node scripts/test-business-type-simple.js
 */

const dotenv = require('dotenv');
const path = require('path');
const { OpenAI } = require('openai');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Predefined list of common business types
const BUSINESS_TYPES = [
  { id: 'restaurant', name: 'Restaurant', description: 'Food service establishment including cafes, diners, and eateries' },
  { id: 'auto_shop', name: 'Auto Shop', description: 'Automotive repair and maintenance services' },
  { id: 'salon', name: 'Salon', description: 'Hair, beauty, and personal care services' },
  { id: 'home_services', name: 'Home Services', description: 'Home repair, maintenance, and improvement services' },
  { id: 'retail', name: 'Retail Store', description: 'Shops selling products directly to consumers' },
  { id: 'healthcare', name: 'Healthcare', description: 'Medical practices, clinics, and healthcare providers' },
  { id: 'fitness', name: 'Fitness', description: 'Gyms, fitness studios, and wellness centers' },
  { id: 'professional_services', name: 'Professional Services', description: 'Legal, accounting, consulting, and other professional services' },
  { id: 'real_estate', name: 'Real Estate', description: 'Property management, sales, and leasing services' },
  { id: 'education', name: 'Education', description: 'Schools, tutoring centers, and educational services' },
  { id: 'hospitality', name: 'Hospitality', description: 'Hotels, motels, and accommodation services' },
  { id: 'entertainment', name: 'Entertainment', description: 'Venues for events, performances, and recreational activities' },
  { id: 'other', name: 'Other', description: 'Other business types not listed above' }
];

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

/**
 * Detect the most likely business type based on business information
 * @param {Object} businessInfo - Information about the business
 * @returns {Promise<{detectedType: string, confidence: number, alternativeTypes: Array<{type: string, confidence: number}>}>}
 */
async function detectBusinessType(businessInfo) {
  try {
    // Create a list of business type IDs for the model to choose from
    const businessTypeIds = BUSINESS_TYPES.map(type => type.id).join(', ');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that analyzes business information to determine the most likely business type.
          You will be provided with information about a business, and your task is to:
          1. Determine the most likely business type from this list: ${businessTypeIds}
          2. Assign a confidence score (0-100) to your determination
          3. Suggest alternative business types that might also apply, with their confidence scores
          
          Respond in JSON format with the detected type, confidence score, and alternative types.`
        },
        {
          role: "user",
          content: `Analyze this business information and determine the most likely business type:
          
          Business Name: ${businessInfo.name}
          ${businessInfo.description ? `Description: ${businessInfo.description}` : ''}
          ${businessInfo.address ? `Address: ${businessInfo.address}` : ''}
          ${businessInfo.keywords ? `Keywords: ${businessInfo.keywords.join(', ')}` : ''}
          
          Respond with the detected business type, confidence score, and alternative types in JSON format.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    console.log('OpenAI Response:', response.choices[0].message.content);
    
    try {
      const result = JSON.parse(response.choices[0].message.content);
      
      // Ensure the result has the expected structure
      const detectedType = result.detectedType || result.detected_type || result.type || 'other';
      const confidence = result.confidence || result.confidence_score || 70;
      
      // Handle different formats of alternative types
      let alternativeTypes = [];
      if (result.alternativeTypes) {
        alternativeTypes = result.alternativeTypes;
      } else if (result.alternative_types) {
        // Check if alternative_types is an array or an object
        if (Array.isArray(result.alternative_types)) {
          alternativeTypes = result.alternative_types;
        } else if (typeof result.alternative_types === 'object') {
          // Convert object format to array format
          alternativeTypes = Object.entries(result.alternative_types).map(([type, confidence]) => ({
            type,
            confidence_score: confidence
          }));
        }
      }
      
      return {
        detectedType,
        confidence,
        alternativeTypes
      };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.log('Raw response content:', response.choices[0].message.content);
      
      // Return a default response if parsing fails
      return {
        detectedType: 'other',
        confidence: 50,
        alternativeTypes: []
      };
    }
  } catch (error) {
    console.error("Error detecting business type:", error);
    // Return a default response if OpenAI fails
    return {
      detectedType: 'other',
      confidence: 50,
      alternativeTypes: []
    };
  }
}

async function testBusinessTypeDetection() {
  try {
    console.log('🔍 Testing Business Type Detection...\n');
    
    // Display available business types
    console.log('Available Business Types:');
    BUSINESS_TYPES.forEach(type => {
      console.log(`- ${type.name} (${type.id}): ${type.description}`);
    });
    console.log('\n');
    
    // Test each business
    for (const business of testBusinesses) {
      console.log(`Testing business: "${business.name}"`);
      console.log(`Description: ${business.description}`);
      
      const result = await detectBusinessType(business);
      
      console.log(`\nDetected Type: ${result.detectedType} (Confidence: ${result.confidence}%)`);
      
      if (result.alternativeTypes && result.alternativeTypes.length > 0) {
        console.log('Alternative Types:');
        result.alternativeTypes.forEach(alt => {
          const confidence = alt.confidence || alt.confidence_score;
          console.log(`- ${alt.type} (Confidence: ${confidence}%)`);
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
