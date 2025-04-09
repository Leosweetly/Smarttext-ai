/**
 * Script to simulate a Stripe webhook event
 * 
 * This script creates a simulated checkout.session.completed event
 * and sends it to the webhook endpoint.
 * 
 * Note: This is for testing purposes only and doesn't include signature verification.
 */

import fetch from 'node-fetch';

// Configuration
const API_BASE_URL = 'http://localhost:3001';
const WEBHOOK_ENDPOINT = '/api/stripe-webhook';
const TEST_USER_ID = 'rec2WN1vnfFJ1qcRx'; // Real business ID from Airtable

// Simulated checkout.session.completed event
const simulatedEvent = {
  id: 'evt_' + Math.random().toString(36).substring(2, 15),
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_' + Math.random().toString(36).substring(2, 15),
      object: 'checkout.session',
      customer: 'cus_' + Math.random().toString(36).substring(2, 15),
      subscription: 'sub_' + Math.random().toString(36).substring(2, 15),
      metadata: {
        userId: TEST_USER_ID
      }
    }
  },
  type: 'checkout.session.completed'
};

/**
 * Send the simulated event to the webhook endpoint
 */
async function sendWebhookEvent() {
  try {
    console.log('Sending simulated checkout.session.completed event to webhook endpoint...');
    console.log('Event:', JSON.stringify(simulatedEvent, null, 2));
    
    const response = await fetch(`${API_BASE_URL}${WEBHOOK_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real scenario, this would include a valid Stripe signature
        'Stripe-Signature': 'simulated_signature'
      },
      body: JSON.stringify(simulatedEvent)
    });
    
    const responseText = await response.text();
    
    console.log(`Response status: ${response.status}`);
    console.log('Response body:', responseText);
    
    if (response.status === 400 && responseText.includes('Missing Stripe signature')) {
      console.log('\nNote: The webhook endpoint requires a valid Stripe signature.');
      console.log('This script is for testing the endpoint accessibility only.');
      console.log('For proper webhook testing, use the Stripe CLI:');
      console.log('  stripe listen --forward-to localhost:3001/api/stripe-webhook');
    }
  } catch (error) {
    console.error('Error sending webhook event:', error);
  }
}

// Run the script
sendWebhookEvent();
