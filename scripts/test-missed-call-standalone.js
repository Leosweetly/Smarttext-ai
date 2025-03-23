#!/usr/bin/env node

/**
 * This script tests the missed call response generation functionality
 * directly using the OpenAI API, without importing from the AI module.
 * 
 * Usage: node scripts/test-missed-call-standalone.js
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

/**
 * Generate a custom response for a missed call based on business type and information
 * @param {Object} business - The business information
 * @param {string} business.type - The type of business
 * @param {string} business.name - The name of the business
 * @param {Object} business.hours - The business hours
 * @param {Object} [business.customSettings] - Any custom settings for AI responses
 * @param {string} [subscriptionTier='basic'] - The subscription tier (basic, pro, enterprise)
 * @returns {Promise<string>} - The generated response message
 */
async function generateMissedCallResponse(business, subscriptionTier = 'basic') {
  try {
    // For basic tier, use a simple template-based approach
    if (subscriptionTier === 'basic') {
      return `Hey thanks for calling ${business.name}. We're currently unavailable. Our hours are ${formatHours(business.hours)}. Please call back during our business hours or leave a message and we'll get back to you as soon as possible.`;
    }
    
    // For pro and enterprise tiers, use more advanced AI generation
    const systemPrompt = `You are an AI assistant for ${business.name}, a ${business.type} business. 
    You are responding to a missed call from a potential customer.
    Be friendly, professional, and helpful. Provide relevant information about the business.
    ${subscriptionTier === 'enterprise' ? 'Personalize the message as much as possible and suggest specific services or offerings.' : ''}`;
    
    const userPrompt = `Generate a text message response for a missed call to ${business.name}, a ${business.type}.
    Include the following information:
    - Business hours: ${formatHours(business.hours)}
    ${business.orderingLink ? `- Online ordering link: ${business.orderingLink}` : ''}
    ${business.quoteLink ? `- Quote request link: ${business.quoteLink}` : ''}
    ${business.customSettings?.additionalInfo ? `- Additional info: ${business.customSettings.additionalInfo}` : ''}
    
    Keep the message concise (under 160 characters if possible) and make it sound natural.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: subscriptionTier === 'enterprise' ? 0.7 : 0.5,
      max_tokens: 200,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating missed call response:", error);
    // Fallback to a simple template if OpenAI fails
    return `Thanks for calling ${business.name}. We're currently unavailable. Please call back during our business hours: ${formatHours(business.hours)}.`;
  }
}

/**
 * Format business hours into a readable string
 * @param {Object} hours - The business hours object
 * @returns {string} - Formatted hours string
 */
function formatHours(hours) {
  if (!hours || Object.keys(hours).length === 0) {
    return "Please contact us for our business hours";
  }
  
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const formattedHours = [];
  
  // Group consecutive days with the same hours
  let currentGroup = { days: [], hours: "" };
  
  daysOfWeek.forEach(day => {
    const dayHours = hours[day];
    
    if (!dayHours) return;
    
    if (currentGroup.hours === "" || currentGroup.hours === dayHours) {
      currentGroup.days.push(day);
      currentGroup.hours = dayHours;
    } else {
      // Save the current group and start a new one
      if (currentGroup.days.length > 0) {
        formattedHours.push(formatDayGroup(currentGroup));
      }
      currentGroup = { days: [day], hours: dayHours };
    }
  });
  
  // Add the last group
  if (currentGroup.days.length > 0) {
    formattedHours.push(formatDayGroup(currentGroup));
  }
  
  return formattedHours.join(", ");
}

/**
 * Format a group of days with the same hours
 * @param {Object} group - The group object with days and hours
 * @returns {string} - Formatted string for the group
 */
function formatDayGroup(group) {
  if (group.days.length === 1) {
    return `${group.days[0]}: ${group.hours}`;
  } else if (group.days.length === 2) {
    return `${group.days[0]} and ${group.days[1]}: ${group.hours}`;
  } else {
    return `${group.days[0]}-${group.days[group.days.length - 1]}: ${group.hours}`;
  }
}

// Main test function
async function testMissedCallResponses() {
  console.log('Testing missed call response generation with different business types and subscription tiers...\n');
  
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
