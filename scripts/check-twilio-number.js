#!/usr/bin/env node

/**
 * This script checks if a Twilio phone number is associated with a business in the database.
 * It helps diagnose issues with the auto-text feature.
 * 
 * Usage: node scripts/check-twilio-number.js [phone-number]
 */

const dotenv = require('dotenv');
const path = require('path');
const { getBusinessByPhoneNumber, getLocationByPhoneNumber } = require('../lib/data');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Get the phone number from command line arguments or use default
const phoneNumber = process.argv[2] || '+18186518560';

async function checkPhoneNumber(number) {
  console.log(`🔍 Checking phone number: ${number}`);
  
  try {
    // Check if it's a location-specific phone number
    console.log('\n📍 Checking if this is a location-specific phone number...');
    const location = await getLocationByPhoneNumber(number);
    
    if (location) {
      console.log('✅ Found a location associated with this phone number:');
      console.log(JSON.stringify(location, null, 2));
      
      // If it's a location, get the parent business
      console.log('\n🏢 Getting the parent business...');
      const business = await getBusinessByPhoneNumber(location.businessId);
      
      if (business) {
        console.log('✅ Found the parent business:');
        console.log(JSON.stringify(business, null, 2));
      } else {
        console.log('❌ Could not find the parent business.');
      }
    } else {
      console.log('❌ No location found for this phone number.');
      
      // If not a location, try to find the business directly
      console.log('\n🏢 Checking if this is a business phone number...');
      const business = await getBusinessByPhoneNumber(number);
      
      if (business) {
        console.log('✅ Found a business associated with this phone number:');
        console.log(JSON.stringify(business, null, 2));
      } else {
        console.log('❌ No business found for this phone number.');
        console.log('\n⚠️ This phone number is not associated with any business or location in the database.');
        console.log('This could be why the auto-text feature is not working.');
      }
    }
  } catch (error) {
    console.error('❌ Error checking phone number:', error);
  }
}

// Main function
async function main() {
  try {
    await checkPhoneNumber(phoneNumber);
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
