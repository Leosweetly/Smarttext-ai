#!/usr/bin/env node

/**
 * This script adds a test business associated with a specific Twilio phone number.
 * It helps test the auto-text functionality by ensuring there's a business in the database
 * associated with the phone number.
 * 
 * Usage: node scripts/add-test-business-for-number.js [phone-number]
 */

const dotenv = require('dotenv');
const path = require('path');
const { createBusiness, getBusinessByPhoneNumber } = require('../lib/data');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Get the phone number from command line arguments or use default
const phoneNumber = process.argv[2] || '+18186518560';

async function addTestBusiness(number) {
  console.log(`🔍 Checking if a business already exists for phone number: ${number}`);
  
  try {
    // Check if a business already exists for this phone number
    const existingBusiness = await getBusinessByPhoneNumber(number);
    
    if (existingBusiness) {
      console.log('✅ A business already exists for this phone number:');
      console.log(JSON.stringify(existingBusiness, null, 2));
      console.log('\n⚠️ No need to create a new business.');
      return;
    }
    
    console.log('❌ No business found for this phone number.');
    console.log('\n🏢 Creating a new test business...');
    
    // Create a new test business
    const testBusiness = {
      name: 'SmartText Test Business',
      phoneNumber: number,
      businessType: 'professional_services',
      description: 'A test business for SmartText AI auto-text functionality',
      website: 'https://smarttext-ai.com',
      email: 'test@smarttext-ai.com',
      address: '123 Test Street, San Francisco, CA 94105',
      hours: {
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 5:00 PM',
        saturday: 'Closed',
        sunday: 'Closed'
      },
      subscriptionTier: 'pro', // Use 'pro' tier for better auto-text responses
      isActive: true
    };
    
    // Create the business in the database
    const newBusiness = await createBusiness(testBusiness);
    
    console.log('✅ Successfully created a new test business:');
    console.log(JSON.stringify(newBusiness, null, 2));
    
    console.log('\n🎉 The auto-text feature should now work for this phone number!');
  } catch (error) {
    console.error('❌ Error adding test business:', error);
  }
}

// Main function
async function main() {
  try {
    await addTestBusiness(phoneNumber);
  } catch (error) {
    console.error('Failed:', error);
  }
}

// Execute the main function
main()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
