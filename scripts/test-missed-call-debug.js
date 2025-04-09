#!/usr/bin/env node

/**
 * This script tests the missed call functionality without actually sending SMS.
 * It helps debug issues with the business data lookup and message generation.
 * 
 * Usage: node scripts/test-missed-call-debug.js +12125551234 +18186518560
 * 
 * Where:
 * - First argument is the caller's phone number (From)
 * - Second argument is the Twilio number (To)
 */

const dotenv = require('dotenv');
const path = require('path');
// Note: We're not importing the actual functions to avoid module compatibility issues
// This is a simplified debug script

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Default phone numbers if not provided as arguments
const DEFAULT_FROM = '+12125551234'; // Default caller number
const DEFAULT_TO = '+18186518560';   // Default Twilio number

async function debugMissedCall(fromNumber, toNumber) {
  try {
    console.log(`\n🔍 Debugging missed call from ${fromNumber} to ${toNumber}...`);
    
    // First check if this is a location-specific phone number
    let location;
    let business;
    let messageBody;

    console.log('\n📱 Looking up location by phone number...');
    location = await getLocationByPhoneNumber(toNumber);
    
    if (location) {
      console.log(`✅ Found location: ${location.name}`);
      
      // If it's a location, get the parent business
      console.log('\n🏢 Looking up parent business...');
      business = await getBusinessByPhoneNumber(location.businessId);
      
      if (business) {
        console.log(`✅ Found parent business: ${business.name}`);
        console.log(`   Subscription Tier: ${business.subscriptionTier || 'basic'}`);
        
        try {
          // Generate a location-specific response
          console.log('\n✍️ Generating location-specific response...');
          messageBody = await generateLocationMissedCallResponse(location, business, business?.subscriptionTier || 'basic');
          console.log(`✅ Generated response: "${messageBody}"`);
        } catch (aiError) {
          console.error("❌ Error generating location-specific AI response:", aiError);
          
          // Fallback to basic template if AI generation fails
          messageBody = `Thanks for calling ${location.name}${business ? ` at ${business.name}` : ''}. We'll get back to you as soon as possible.`;
          console.log(`✅ Using fallback response: "${messageBody}"`);
        }
      } else {
        console.error('❌ Parent business not found');
        messageBody = `Thanks for calling ${location.name}. We'll get back to you as soon as possible.`;
        console.log(`✅ Using fallback response: "${messageBody}"`);
      }
    } else {
      // If not a location, try to find the business directly
      console.log('\n🏢 Looking up business by phone number...');
      business = await getBusinessByPhoneNumber(toNumber);
      
      if (business) {
        console.log(`✅ Found business: ${business.name}`);
        console.log(`   Business Type: ${business.businessType || 'unknown'}`);
        console.log(`   Subscription Tier: ${business.subscriptionTier || 'basic'}`);
        console.log(`   Has Multiple Locations: ${business.hasMultipleLocations ? 'Yes' : 'No'}`);
        
        try {
          // Check if this is a multi-location business
          if (business.hasMultipleLocations) {
            console.log('\n🏙️ Business has multiple locations');
            
            // Get the business with all its locations
            console.log('   Getting all locations...');
            const businessWithLocations = await getBusinessWithLocations(business.id);
            
            // Generate a response that mentions multiple locations
            console.log('\n✍️ Generating multi-location response...');
            messageBody = await generateMissedCallResponse(businessWithLocations, business.subscriptionTier, true);
            console.log(`✅ Generated response: "${messageBody}"`);
          } else {
            // Generate a standard response
            console.log('\n✍️ Generating standard response...');
            messageBody = await generateMissedCallResponse(business, business.subscriptionTier);
            console.log(`✅ Generated response: "${messageBody}"`);
          }
        } catch (aiError) {
          console.error("❌ Error generating AI response:", aiError);
          
          // Fallback to basic template if AI generation fails
          if (business.businessType === 'restaurant' && business.orderingLink) {
            messageBody = `Thanks for calling ${business.name}. Would you like to place an online order? Visit: ${business.orderingLink}`;
          } else if (business.businessType === 'auto shop' && business.quoteLink) {
            messageBody = `Thanks for calling ${business.name}. Need a quote? Visit: ${business.quoteLink}`;
          } else {
            messageBody = `Thanks for calling ${business.name}. We'll get back to you as soon as possible.`;
          }
          console.log(`✅ Using fallback response: "${messageBody}"`);
        }
      } else {
        console.error('❌ Business not found for phone number:', toNumber);
        // Generic message if neither location nor business found
        messageBody = `Thanks for calling. We'll get back to you as soon as possible.`;
        console.log(`✅ Using generic response: "${messageBody}"`);
      }
    }
    
    console.log('\n📲 In a production environment, this message would be sent to', fromNumber);
    console.log(`   Message: "${messageBody}"`);
    
  } catch (error) {
    console.error('\n❌ Error during debug process:', error);
  }
}

// Main function
async function main() {
  // Get phone numbers from command line arguments or use defaults
  const fromNumber = process.argv[2] || DEFAULT_FROM;
  const toNumber = process.argv[3] || DEFAULT_TO;
  
  // Validate phone numbers
  const phoneRegex = /^\+\d{10,15}$/;
  if (!phoneRegex.test(fromNumber) || !phoneRegex.test(toNumber)) {
    console.error('❌ Error: Phone numbers must be in E.164 format (e.g., +18186518560)');
    console.error(`From: ${fromNumber}`);
    console.error(`To: ${toNumber}`);
    process.exit(1);
  }
  
  // Debug the missed call
  await debugMissedCall(fromNumber, toNumber);
}

// Run the main function
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
