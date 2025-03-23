#!/usr/bin/env node

/**
 * This script adds a test business directly to Airtable
 * for testing the SmartText AI auto-text functionality.
 * 
 * It uses the SmartText AI Twilio number as the business phone number
 * and a specified forwarding number.
 */

const dotenv = require('dotenv');
const path = require('path');
const Airtable = require('airtable');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Airtable
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_PAT;

if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
  console.error('Error: AIRTABLE_BASE_ID and AIRTABLE_API_KEY (or AIRTABLE_PAT) are required');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function addTestBusiness() {
  try {
    console.log('Adding SmartText AI test business to Airtable...');
    
    // Create a test business with the SmartText AI phone number and forwarding number
    const testBusiness = {
      "Name": "SmartText AI Test Business",
      "Business Type": "salon",
      "Phone Number": "+18186518560", // SmartText AI Twilio number
      "Forwarding Phone Number": "+16193721633", // Your phone number for testing
      "Address": "123 Test St, Test City, CA 12345",
      "Subscription Tier": "pro", // Using pro tier for better auto-text features
      "Hours": JSON.stringify({
        Monday: '9:00 AM - 5:00 PM',
        Tuesday: '9:00 AM - 5:00 PM',
        Wednesday: '9:00 AM - 5:00 PM',
        Thursday: '9:00 AM - 5:00 PM',
        Friday: '9:00 AM - 5:00 PM',
        Saturday: '10:00 AM - 3:00 PM',
        Sunday: 'Closed'
      }),
      "FAQs": JSON.stringify([
        {
          question: 'What services do you offer?',
          defaultAnswer: 'We offer a variety of salon services including haircuts, coloring, styling, and more.'
        },
        {
          question: 'How can I book an appointment?',
          defaultAnswer: 'You can book an appointment by calling us or using our online booking system.'
        }
      ]),
      "Custom Settings": JSON.stringify({
        additionalInfo: 'This is a test business for SmartText AI auto-text functionality.'
      })
    };
    
    // Add the business to Airtable
    const createdRecord = await new Promise((resolve, reject) => {
      base('Businesses').create(testBusiness, (err, record) => {
        if (err) {
          console.error('Error creating record:', err);
          return reject(err);
        }
        resolve(record);
      });
    });
    
    console.log('SmartText AI test business created successfully:', createdRecord.getId());
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
