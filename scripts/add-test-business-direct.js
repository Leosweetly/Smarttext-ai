#!/usr/bin/env node

/**
 * This script adds a test business directly to Airtable
 * for testing the SmartText AI auto-text functionality.
 * 
 * It uses the SmartText AI Twilio number as the business phone number
 * and a specified forwarding number.
 */

import dotenv from 'dotenv';
import path from 'path';
import Airtable from 'airtable';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Airtable
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_PAT = process.env.AIRTABLE_PAT || process.env.AIRTABLE_PAT;

if (!AIRTABLE_BASE_ID || !AIRTABLE_PAT) {
  console.error('Error: AIRTABLE_BASE_ID and AIRTABLE_PAT (or AIRTABLE_PAT) are required');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_PAT }).base(AIRTABLE_BASE_ID);

async function addTestBusiness() {
  try {
    console.log('Adding SmartText AI test business to Airtable...');
    
    // Create a test business with the SmartText AI phone number and forwarding number
    const testBusiness = {
      "Business Name": "SmartText AI Test Business",
      "Business Type": "salon",
      "Phone Number": "+16193721633", // Test business phone number
      "Twilio Number": "+16193721633", // Test business phone number
      "Address": "123 Test St, Test City, CA 12345",
      "Subscription Tier": "pro", // Using pro tier for better auto-text features
      "Hours JSON": JSON.stringify({
        Monday: '9:00 AM - 5:00 PM',
        Tuesday: '9:00 AM - 5:00 PM',
        Wednesday: '9:00 AM - 5:00 PM',
        Thursday: '9:00 AM - 5:00 PM',
        Friday: '9:00 AM - 5:00 PM',
        Saturday: '10:00 AM - 3:00 PM',
        Sunday: 'Closed'
      }),
      "FAQs JSON": JSON.stringify([
        {
          question: 'What services do you offer?',
          answer: 'We offer a variety of salon services including haircuts, coloring, styling, and more.'
        },
        {
          question: 'How can I book an appointment?',
          answer: 'You can book an appointment by calling us or using our online booking system.'
        }
      ]),
      "Custom Settings": JSON.stringify({
        forwardingNumber: "+16193721633", // Using the same number for testing
        additionalInfo: 'This is a test business for SmartText AI auto-text functionality.'
      })
    };
    
    // Add the business to Airtable
    const createdRecord = await base('Businesses').create(testBusiness);
    
    console.log('SmartText AI test business created successfully:', createdRecord.id);
    console.log('Business data:', createdRecord.fields);
    
    return createdRecord;
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
