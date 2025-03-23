#!/usr/bin/env node

/**
 * This script tests the generateMissedCallResponse function
 * from the AI module with different business types and subscription tiers.
 * 
 * Usage: node --experimental-modules scripts/test-missed-call.js
 */

// Use ES modules
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateMissedCallResponse } from '../lib/ai/openai.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Test business objects
const testBusinesses = [
  {
    type: 'restaurant',
    name: 'Delicious Eats',
    hours: {
      Monday: '11 AM - 9 PM',
      Tuesday: '11 AM - 9 PM',
      Wednesday: '11 AM - 9 PM',
      Thursday: '11 AM - 9 PM',
      Friday: '11 AM - 10 PM',
      Saturday: '11 AM - 10 PM',
      Sunday: '12 PM - 8 PM'
    },
    orderingLink: 'https://deliciouseats.com/order',
    customSettings: {
      additionalInfo: 'We offer catering for events!'
    }
  },
  {
    type: 'auto shop',
    name: 'Quick Fix Auto',
    hours: {
      Monday: '8 AM - 6 PM',
      Tuesday: '8 AM - 6 PM',
      Wednesday: '8 AM - 6 PM',
      Thursday: '8 AM - 6 PM',
      Friday: '8 AM - 6 PM',
      Saturday: '9 AM - 3 PM'
    },
    quoteLink: 'https://quickfixauto.com/quote',
    customSettings: {
      additionalInfo: 'We offer free towing within 5 miles!'
    }
  },
  {
    type: 'salon',
    name: 'Glamour Styles',
    hours: {
      Tuesday: '9 AM - 7 PM',
      Wednesday: '9 AM - 7 PM',
      Thursday: '9 AM - 7 PM',
      Friday: '9 AM - 7 PM',
      Saturday: '9 AM - 5 PM'
    },
    customSettings: {
      additionalInfo: 'New clients receive 15% off their first visit!'
    }
  }
];

// Subscription tiers to test
const subscriptionTiers = ['basic', 'pro', 'enterprise'];

// Main test function
async function testMissedCallResponses() {
  console.log('Testing generateMissedCallResponse function with different business types and subscription tiers...\n');
  
  for (const business of testBusinesses) {
    console.log(`\n=== Testing ${business.name} (${business.type}) ===\n`);
    
    for (const tier of subscriptionTiers) {
      console.log(`\n--- ${tier.toUpperCase()} Tier ---`);
      
      try {
        const response = await generateMissedCallResponse(business, tier);
        console.log(`Response: "${response}"`);
        console.log(`Character count: ${response.length}`);
      } catch (error) {
        console.error(`Error generating response for ${business.type} with ${tier} tier:`, error);
      }
    }
  }
  
  // Test error handling with missing hours
  console.log('\n\n=== Testing Error Handling ===\n');
  
  const incompleteBusinesses = [
    {
      type: 'restaurant',
      name: 'Missing Hours Restaurant'
      // No hours property
    },
    {
      type: 'auto shop',
      name: 'Empty Hours Auto Shop',
      hours: {} // Empty hours object
    }
  ];
  
  for (const business of incompleteBusinesses) {
    console.log(`\n--- Testing ${business.name} ---`);
    
    try {
      const response = await generateMissedCallResponse(business, 'basic');
      console.log(`Response: "${response}"`);
    } catch (error) {
      console.error(`Error generating response:`, error);
    }
  }
}

// Run the tests
testMissedCallResponses()
  .then(() => {
    console.log('\nAll tests completed!');
  })
  .catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
