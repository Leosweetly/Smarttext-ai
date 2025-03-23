#!/usr/bin/env node

/**
 * This script adds a test business to the Airtable database
 * for testing the missed call functionality.
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
    console.log('Adding test business to Airtable...');
    
    // Import the Airtable functions
    const { createTestBusiness } = await importAirtable();
    
    // Create a test business with the phone number we'll use for testing
    const testBusiness = {
      name: 'Test Salon',
      businessType: 'salon',
      phoneNumber: '+15559876543', // This should match the "To" number in your test
      address: '123 Test St, Test City, CA 12345',
      subscriptionTier: 'basic',
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
      ]
    };
    
    const createdBusiness = await createTestBusiness(testBusiness);
    console.log('Test business created successfully:', createdBusiness);
    
    return createdBusiness;
  } catch (error) {
    console.error('Error adding test business:', error);
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
