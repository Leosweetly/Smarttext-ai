#!/usr/bin/env node

/**
 * Test script to verify business lookup and message generation
 */

import { getBusinessByPhoneNumberSupabase } from '../lib/supabase.js';
import { generateMissedCallResponse } from '../lib/openai.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });

async function testBusinessLookup() {
  try {
    console.log('🔍 Testing business lookup for Twilio number +18186518560...');
    
    // Look up the business by Twilio number
    const business = await getBusinessByPhoneNumberSupabase('+18186518560');
    
    if (!business) {
      console.error('❌ No business found for Twilio number +18186518560');
      return;
    }
    
    console.log('✅ Found business:');
    console.log(`   Name: ${business.name}`);
    console.log(`   ID: ${business.id}`);
    console.log(`   Business Type: ${business.business_type || 'Not set'}`);
    console.log(`   Public Phone: ${business.public_phone}`);
    console.log(`   Twilio Phone: ${business.twilio_phone}`);
    
    // Check if business has hours
    if (business.hours_json && Object.keys(business.hours_json).length > 0) {
      console.log('✅ Business has hours information:');
      for (const [day, hours] of Object.entries(business.hours_json)) {
        console.log(`   ${day}: ${hours}`);
      }
    } else {
      console.warn('⚠️ Business does not have hours information');
    }
    
    // Check if business has custom settings
    if (business.custom_settings || business.customSettings) {
      const settings = business.custom_settings || business.customSettings;
      console.log('✅ Business has custom settings:');
      console.log(settings);
      
      if (settings.autoReplyMessage) {
        console.log(`✅ Custom auto-reply message: "${settings.autoReplyMessage}"`);
      } else {
        console.warn('⚠️ No custom auto-reply message set');
      }
    } else {
      console.warn('⚠️ Business does not have custom settings');
    }
    
    // Generate a missed call response
    console.log('\n🤖 Generating missed call response...');
    const response = await generateMissedCallResponse(business, business.subscription_tier || 'basic');
    console.log(`✅ Generated response: "${response}"`);
    
    return business;
  } catch (error) {
    console.error('❌ Error testing business lookup:', error);
  }
}

// Run the test
testBusinessLookup().catch(console.error);
