#!/usr/bin/env node

/**
 * Test script for Stripe webhook events
 * 
 * This script simulates Stripe webhook events to test the webhook handler
 * 
 * Usage:
 * node scripts/test-stripe-webhook.js [event-type]
 * 
 * Event types:
 * - checkout.session.completed
 * - payment_intent.succeeded
 * - charge.succeeded
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * 
 * If no event type is provided, it will test all events
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const WEBHOOK_ENDPOINT = '/api/stripe-webhook';
const TEST_USER_ID = process.env.TEST_USER_ID || 'rec2WN1vnfFJ1qcRx'; // Replace with a real business ID from Airtable
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';

// Get the event type from command line args
const eventType = process.argv[2];

// Generate a random Stripe ID
function generateStripeId(prefix) {
  return `${prefix}_${Math.random().toString(36).substring(2, 15)}`;
}

// Generate a webhook signature
function generateWebhookSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

// Simulate a checkout.session.completed event
async function simulateCheckoutSessionCompleted() {
  console.log('\n=== Simulating checkout.session.completed event ===');
  
  const customerId = generateStripeId('cus');
  const subscriptionId = generateStripeId('sub');
  
  const simulatedEvent = {
    id: generateStripeId('evt'),
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: generateStripeId('cs'),
        object: 'checkout.session',
        customer: customerId,
        subscription: subscriptionId,
        metadata: {
          userId: TEST_USER_ID
        }
      }
    },
    type: 'checkout.session.completed'
  };
  
  const payload = JSON.stringify(simulatedEvent);
  const signature = generateWebhookSignature(payload, WEBHOOK_SECRET);
  
  try {
    console.log('Sending simulated checkout.session.completed event to webhook endpoint...');
    
    const response = await fetch(`${API_BASE_URL}${WEBHOOK_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature
      },
      body: payload
    });
    
    const responseText = await response.text();
    
    console.log(`Response status: ${response.status}`);
    console.log('Response body:', responseText);
    
    return response.status === 200;
  } catch (error) {
    console.error('Error simulating checkout.session.completed webhook:', error);
    return false;
  }
}

// Simulate a payment_intent.succeeded event
async function simulatePaymentIntentSucceeded() {
  console.log('\n=== Simulating payment_intent.succeeded event ===');
  
  const customerId = generateStripeId('cus');
  const paymentIntentId = generateStripeId('pi');
  
  const simulatedEvent = {
    id: generateStripeId('evt'),
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: paymentIntentId,
        object: 'payment_intent',
        amount: 54900, // $549.00
        currency: 'usd',
        customer: customerId,
        status: 'succeeded'
      }
    },
    type: 'payment_intent.succeeded'
  };
  
  const payload = JSON.stringify(simulatedEvent);
  const signature = generateWebhookSignature(payload, WEBHOOK_SECRET);
  
  try {
    console.log('Sending simulated payment_intent.succeeded event to webhook endpoint...');
    
    const response = await fetch(`${API_BASE_URL}${WEBHOOK_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature
      },
      body: payload
    });
    
    const responseText = await response.text();
    
    console.log(`Response status: ${response.status}`);
    console.log('Response body:', responseText);
    
    return response.status === 200;
  } catch (error) {
    console.error('Error simulating payment_intent.succeeded webhook:', error);
    return false;
  }
}

// Simulate a charge.succeeded event
async function simulateChargeSucceeded() {
  console.log('\n=== Simulating charge.succeeded event ===');
  
  const customerId = generateStripeId('cus');
  const chargeId = generateStripeId('ch');
  
  const simulatedEvent = {
    id: generateStripeId('evt'),
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: chargeId,
        object: 'charge',
        amount: 54900, // $549.00
        currency: 'usd',
        customer: customerId,
        status: 'succeeded'
      }
    },
    type: 'charge.succeeded'
  };
  
  const payload = JSON.stringify(simulatedEvent);
  const signature = generateWebhookSignature(payload, WEBHOOK_SECRET);
  
  try {
    console.log('Sending simulated charge.succeeded event to webhook endpoint...');
    
    const response = await fetch(`${API_BASE_URL}${WEBHOOK_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature
      },
      body: payload
    });
    
    const responseText = await response.text();
    
    console.log(`Response status: ${response.status}`);
    console.log('Response body:', responseText);
    
    return response.status === 200;
  } catch (error) {
    console.error('Error simulating charge.succeeded webhook:', error);
    return false;
  }
}

// Simulate a customer.subscription.created event
async function simulateCustomerSubscriptionCreated() {
  console.log('\n=== Simulating customer.subscription.created event ===');
  
  const customerId = generateStripeId('cus');
  const subscriptionId = generateStripeId('sub');
  const trialEnd = Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60); // 14 days from now
  
  const simulatedEvent = {
    id: generateStripeId('evt'),
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: subscriptionId,
        object: 'subscription',
        customer: customerId,
        status: 'trialing',
        trial_end: trialEnd,
        items: {
          data: [
            {
              price: {
                id: 'price_enterprise'
              }
            }
          ]
        }
      }
    },
    type: 'customer.subscription.created'
  };
  
  const payload = JSON.stringify(simulatedEvent);
  const signature = generateWebhookSignature(payload, WEBHOOK_SECRET);
  
  try {
    console.log('Sending simulated customer.subscription.created event to webhook endpoint...');
    
    const response = await fetch(`${API_BASE_URL}${WEBHOOK_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature
      },
      body: payload
    });
    
    const responseText = await response.text();
    
    console.log(`Response status: ${response.status}`);
    console.log('Response body:', responseText);
    
    return response.status === 200;
  } catch (error) {
    console.error('Error simulating customer.subscription.created webhook:', error);
    return false;
  }
}

// Simulate a customer.subscription.updated event
async function simulateCustomerSubscriptionUpdated() {
  console.log('\n=== Simulating customer.subscription.updated event ===');
  
  const customerId = generateStripeId('cus');
  const subscriptionId = generateStripeId('sub');
  
  const simulatedEvent = {
    id: generateStripeId('evt'),
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: subscriptionId,
        object: 'subscription',
        customer: customerId,
        status: 'active', // Changed from trialing to active
        items: {
          data: [
            {
              price: {
                id: 'price_pro'
              }
            }
          ]
        }
      }
    },
    type: 'customer.subscription.updated'
  };
  
  const payload = JSON.stringify(simulatedEvent);
  const signature = generateWebhookSignature(payload, WEBHOOK_SECRET);
  
  try {
    console.log('Sending simulated customer.subscription.updated event to webhook endpoint...');
    
    const response = await fetch(`${API_BASE_URL}${WEBHOOK_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature
      },
      body: payload
    });
    
    const responseText = await response.text();
    
    console.log(`Response status: ${response.status}`);
    console.log('Response body:', responseText);
    
    return response.status === 200;
  } catch (error) {
    console.error('Error simulating customer.subscription.updated webhook:', error);
    return false;
  }
}

// Simulate a customer.subscription.deleted event
async function simulateCustomerSubscriptionDeleted() {
  console.log('\n=== Simulating customer.subscription.deleted event ===');
  
  const customerId = generateStripeId('cus');
  const subscriptionId = generateStripeId('sub');
  
  const simulatedEvent = {
    id: generateStripeId('evt'),
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: subscriptionId,
        object: 'subscription',
        customer: customerId,
        status: 'canceled',
        items: {
          data: [
            {
              price: {
                id: 'price_pro'
              }
            }
          ]
        }
      }
    },
    type: 'customer.subscription.deleted'
  };
  
  const payload = JSON.stringify(simulatedEvent);
  const signature = generateWebhookSignature(payload, WEBHOOK_SECRET);
  
  try {
    console.log('Sending simulated customer.subscription.deleted event to webhook endpoint...');
    
    const response = await fetch(`${API_BASE_URL}${WEBHOOK_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature
      },
      body: payload
    });
    
    const responseText = await response.text();
    
    console.log(`Response status: ${response.status}`);
    console.log('Response body:', responseText);
    
    return response.status === 200;
  } catch (error) {
    console.error('Error simulating customer.subscription.deleted webhook:', error);
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('=== Testing Stripe Webhook Handler ===');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Webhook Endpoint:', WEBHOOK_ENDPOINT);
  console.log('Test User ID:', TEST_USER_ID);
  
  let results = {};
  
  if (!eventType || eventType === 'checkout.session.completed') {
    results['checkout.session.completed'] = await simulateCheckoutSessionCompleted();
  }
  
  if (!eventType || eventType === 'payment_intent.succeeded') {
    results['payment_intent.succeeded'] = await simulatePaymentIntentSucceeded();
  }
  
  if (!eventType || eventType === 'charge.succeeded') {
    results['charge.succeeded'] = await simulateChargeSucceeded();
  }
  
  if (!eventType || eventType === 'customer.subscription.created') {
    results['customer.subscription.created'] = await simulateCustomerSubscriptionCreated();
  }
  
  if (!eventType || eventType === 'customer.subscription.updated') {
    results['customer.subscription.updated'] = await simulateCustomerSubscriptionUpdated();
  }
  
  if (!eventType || eventType === 'customer.subscription.deleted') {
    results['customer.subscription.deleted'] = await simulateCustomerSubscriptionDeleted();
  }
  
  // Print results
  console.log('\n=== Test Results ===');
  
  for (const [event, success] of Object.entries(results)) {
    console.log(`${event}: ${success ? '✅ PASS' : '❌ FAIL'}`);
  }
  
  // Overall result
  const allPassed = Object.values(results).every(result => result);
  
  console.log('\n=== Overall Result ===');
  console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  return allPassed;
}

// Run the tests
runTests().catch(console.error);
