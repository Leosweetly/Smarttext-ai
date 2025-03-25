#!/usr/bin/env node

/**
 * Zapier Webhook Integration Test Script
 * 
 * This script tests the Zapier webhook integration by:
 * 1. Checking if the Zapier webhook URL is configured
 * 2. Sending test data to the webhook
 * 3. Displaying the response from the webhook
 * 
 * Usage:
 * node scripts/test-zapier-webhook.js [webhook_type]
 * 
 * Arguments:
 * webhook_type - Optional. The type of webhook to test. Valid values: 'missed_call', 'new_message'. Default: 'missed_call'.
 */

require('dotenv').config({ path: '.env.local' });

// Configuration
const ZAPIER_MISSED_CALL_WEBHOOK_URL = process.env.ZAPIER_MISSED_CALL_WEBHOOK_URL;
const ZAPIER_NEW_MESSAGE_WEBHOOK_URL = process.env.ZAPIER_NEW_MESSAGE_WEBHOOK_URL;

// Get the webhook type from command line arguments
const webhookType = process.argv[2] || 'missed_call';

// Replace the CommonJS require with dynamic import
import('node-fetch').then(({ default: fetch }) => {
  // Call the function with fetch as a parameter
  testZapierWebhook(fetch);
});

// Generate test data based on webhook type
function generateTestData(type) {
  const timestamp = new Date().toISOString();
  
  switch (type) {
    case 'missed_call':
      return {
        event_type: 'missed_call',
        timestamp,
        call_sid: `TEST_CALL_${Date.now()}`,
        from: '+15551234567',
        to: '+15559876543',
        duration: '0',
        status: 'no-answer',
        business_id: 'TEST_BUSINESS_ID',
        business_name: 'Test Business',
        caller_name: 'Test Caller',
      };
    
    case 'new_message':
      return {
        event_type: 'new_message',
        timestamp,
        message_sid: `TEST_MSG_${Date.now()}`,
        from: '+15551234567',
        to: '+15559876543',
        body: 'This is a test message from the Zapier webhook test script.',
        status: 'received',
        business_id: 'TEST_BUSINESS_ID',
        business_name: 'Test Business',
        sender_name: 'Test Sender',
      };
    
    default:
      throw new Error(`Invalid webhook type: ${type}. Valid types are 'missed_call' and 'new_message'.`);
  }
}

async function testZapierWebhook(fetch) {
  console.log('🔗 Testing Zapier Webhook Integration');
  console.log('----------------------------------');
  console.log(`Webhook Type: ${webhookType}`);
  
  // Determine which webhook URL to use
  let webhookUrl;
  if (webhookType === 'missed_call') {
    webhookUrl = ZAPIER_MISSED_CALL_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('❌ Zapier Missed Call Webhook URL is not configured');
      console.log('\nPlease set the ZAPIER_MISSED_CALL_WEBHOOK_URL environment variable in your .env.local file:');
      console.log('ZAPIER_MISSED_CALL_WEBHOOK_URL=your_zapier_webhook_url');
      return;
    }
  } else if (webhookType === 'new_message') {
    webhookUrl = ZAPIER_NEW_MESSAGE_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('❌ Zapier New Message Webhook URL is not configured');
      console.log('\nPlease set the ZAPIER_NEW_MESSAGE_WEBHOOK_URL environment variable in your .env.local file:');
      console.log('ZAPIER_NEW_MESSAGE_WEBHOOK_URL=your_zapier_webhook_url');
      return;
    }
  } else {
    console.error(`❌ Invalid webhook type: ${webhookType}`);
    console.log('\nValid webhook types are:');
    console.log('- missed_call');
    console.log('- new_message');
    return;
  }
  
  console.log('✅ Zapier webhook URL is configured');
  
  try {
    // Generate test data
    const testData = generateTestData(webhookType);
    
    console.log('\n📤 Sending test data to Zapier webhook...');
    console.log('\n📋 Test Data:');
    console.log(JSON.stringify(testData, null, 2));
    
    // Send test data to webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    // Parse response
    let responseData;
    try {
      responseData = await response.json();
    } catch (error) {
      // If response is not JSON, get text
      responseData = await response.text();
    }
    
    console.log('\n✅ Successfully sent test data to Zapier webhook');
    console.log('\n📋 Response:');
    console.log(typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2));
    
    console.log('\n🎉 Zapier webhook integration is working correctly!');
    console.log('\nNow check your Zapier account to see if the webhook was triggered and the Zap was executed.');
    
  } catch (error) {
    console.error('\n❌ Error testing Zapier webhook integration:', error.message);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('\nThe webhook URL you provided is invalid or unreachable. Please check your Zapier webhook URL.');
    } else if (error.message.includes('401')) {
      console.log('\nThe webhook URL you provided requires authentication. Please check your Zapier webhook URL.');
    } else if (error.message.includes('404')) {
      console.log('\nThe webhook URL you provided was not found. Please check your Zapier webhook URL.');
    } else {
      console.log('\nPlease check your Zapier webhook configuration and try again.');
    }
  }
}
