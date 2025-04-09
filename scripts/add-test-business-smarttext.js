#!/usr/bin/env node

/**
 * This script adds a test business to the Airtable database
 * specifically for testing the SmartText AI auto-text functionality.
 * 
 * It uses the SmartText AI Twilio number as the business phone number
 * and a specified forwarding number.
 */

const dotenv = require('dotenv');
const path = require('path');
// We need to use dynamic import since lib/airtable.js uses ES modules
async function importAirtable() {
  // Create a temporary file that re-exports the functions we need
  const fs = require('fs');
  const tempFile = path.resolve(__dirname, '../temp-airtable.js');
  
  fs.writeFileSync(tempFile, `
    import { createBusiness } from './lib/data/index.js';
    
    export async function createTestBusiness(data) {
      return await createBusiness(data);
    }
  `);
  
  // Use dynamic import to load the ES module
  const { createTestBusiness } = await import('../temp-airtable.js');
  
  // Clean up the temporary file
  fs.unlinkSync(tempFile);
  
  return { createTestBusiness };
}

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function addTestBusiness() {
  try {
    console.log('Adding SmartText AI test business to Airtable...');
    
    // Import the Airtable functions
    const { createTestBusiness } = await importAirtable();
    
    // Create a test business with the SmartText AI phone number and forwarding number
    const testBusiness = {
      name: 'SmartText AI Test Business',
      businessType: 'salon',
      phoneNumber: '+18186518560', // SmartText AI Twilio number
      forwardingNumber: '+12125551234', // Your phone number for testing
      address: '123 Test St, Test City, CA 12345',
      subscriptionTier: 'pro', // Using pro tier for better auto-text features
      hours: {
        Monday: '9:00 AM - 5:00 PM',
        Tuesday: '9:00 AM - 5:00 PM',
        Wednesday: '9:00 AM - 5:00 PM',
        Thursday: '9:00 AM - 5:00 PM',
        Friday: '9:00 AM - 5:00 PM',
        Saturday: '10:00 AM - 3:00 PM',
        Sunday: 'Closed'
      },
      faqs: [
        {
          question: 'What services do you offer?',
          defaultAnswer: 'We offer a variety of salon services including haircuts, coloring, styling, and more.'
        },
        {
          question: 'How can I book an appointment?',
          defaultAnswer: 'You can book an appointment by calling us or using our online booking system.'
        }
      ],
      customSettings: {
        additionalInfo: 'This is a test business for SmartText AI auto-text functionality.'
      }
    };
    
    const createdBusiness = await createTestBusiness(testBusiness);
    console.log('SmartText AI test business created successfully:', createdBusiness);
    
    return createdBusiness;
  } catch (error) {
    console.error('Error adding SmartText AI test business:', error);
    throw error;
  }
}

// Execute the function
addTestBusiness()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
