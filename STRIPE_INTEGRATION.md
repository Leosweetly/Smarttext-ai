# Stripe Integration Guide

This document provides an overview of the Stripe integration in SmartText, including how to set it up, test it, and troubleshoot common issues.

## Overview

SmartText uses Stripe for subscription billing. The integration includes:

1. **Subscription Plans**: Basic, Pro, and Enterprise tiers
2. **Free Trials**: 7-day trial for Basic/Pro, 14-day trial for Enterprise
3. **Webhook Integration**: Automatic subscription management via webhooks
4. **Subscription Management**: APIs for checking status and canceling subscriptions

## Setup

### Environment Variables

Add the following environment variables to your `.env.local` and `.env.production` files:

```
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs
STRIPE_PRICE_BASIC=price_basic_id
STRIPE_PRICE_PRO=price_pro_id
STRIPE_PRICE_ENTERPRISE=price_enterprise_id
```

### Stripe Dashboard Setup

1. Create products and prices in the Stripe Dashboard:
   - Basic Plan: $99/month
   - Pro Plan: $549/month
   - Enterprise Plan: $999/month

2. Configure the webhook endpoint in the Stripe Dashboard:
   - URL: `https://getsmarttext.com/api/stripe-webhook`
   - Events to send:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `charge.succeeded`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

## API Endpoints

### Create Checkout Session

Creates a Stripe Checkout session for subscription signup.

```
POST /api/create-checkout-session
```

**Request Body:**
```json
{
  "userId": "business_id_from_airtable",
  "planId": "basic|pro|enterprise",
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_..."
}
```

### Get Subscription Status

Retrieves the current subscription status for a business.

```
GET /api/subscription-status?userId=business_id_from_airtable
```

**Response:**
```json
{
  "subscriptionId": "sub_...",
  "subscriptionTier": "basic|pro|enterprise",
  "status": "trialing|active|past_due|canceled|unpaid",
  "cancelAtPeriodEnd": false,
  "currentPeriodEnd": "2023-12-31T23:59:59.000Z",
  "trialEndsAt": "2023-12-15T23:59:59.000Z",
  "hasActiveSubscription": true
}
```

### Cancel Subscription

Cancels a subscription either immediately or at the end of the current billing period.

```
POST /api/cancel-subscription
```

**Request Body:**
```json
{
  "userId": "business_id_from_airtable",
  "cancelImmediately": false
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_...",
    "status": "active",
    "cancelAtPeriodEnd": true,
    "currentPeriodEnd": "2023-12-31T23:59:59.000Z"
  }
}
```

### Log Subscription Event

Logs a subscription-related event to Airtable.

```
POST /api/log-subscription
```

**Request Body:**
```json
{
  "userId": "business_id_from_airtable",
  "event": "subscription_created|subscription_updated|subscription_canceled",
  "data": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

## Webhook Events

The webhook handler (`/api/stripe-webhook`) processes the following events:

1. `checkout.session.completed`: When a customer completes checkout
2. `payment_intent.succeeded`: When a payment is successfully processed
3. `charge.succeeded`: When a charge is successfully created
4. `customer.subscription.created`: When a new subscription is created
5. `customer.subscription.updated`: When a subscription is updated (e.g., plan change)
6. `customer.subscription.deleted`: When a subscription is canceled

## Testing

### Local Testing

1. Install the Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login to your Stripe account:
   ```bash
   stripe login
   ```

3. Forward webhook events to your local server:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe-webhook
   ```

4. Trigger test events:
   ```bash
   stripe trigger checkout.session.completed
   stripe trigger payment_intent.succeeded
   stripe trigger charge.succeeded
   stripe trigger customer.subscription.created
   stripe trigger customer.subscription.updated
   stripe trigger customer.subscription.deleted
   ```

### Using the Test Script

We've created a test script that simulates webhook events:

```bash
# Test all events
./scripts/run-test-stripe-webhook.sh

# Test a specific event
./scripts/run-test-stripe-webhook.sh checkout.session.completed
```

## Frontend Integration

The frontend should use the Stripe.js library to create a checkout session and redirect the user to the Stripe Checkout page:

```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_your_publishable_key');

async function handleSubscribe(planId) {
  const stripe = await stripePromise;
  
  // Call your API to create a checkout session
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: 'business_id_from_airtable',
      planId: planId,
      successUrl: window.location.origin + '/dashboard?subscription=success',
      cancelUrl: window.location.origin + '/pricing?subscription=canceled',
    }),
  });
  
  const { sessionId } = await response.json();
  
  // Redirect to Stripe Checkout
  const result = await stripe.redirectToCheckout({
    sessionId,
  });
  
  if (result.error) {
    console.error(result.error.message);
  }
}
```

## Troubleshooting

### Common Issues

1. **Webhook Signature Verification Failed**
   - Check that the `STRIPE_WEBHOOK_SECRET` environment variable is set correctly
   - Ensure the webhook is properly configured in the Stripe Dashboard

2. **Missing Price IDs**
   - Verify that `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PRO`, and `STRIPE_PRICE_ENTERPRISE` are set correctly
   - Confirm the price IDs exist in your Stripe account

3. **Subscription Not Updating in Airtable**
   - Check the webhook logs for errors
   - Verify that the business ID in the webhook event matches a business in Airtable

### Debugging

1. Check the server logs for webhook events:
   ```
   ✅ Stripe webhook endpoint hit!
   ✅ Parsed Stripe event: {...}
   ```

2. Use the test script to simulate webhook events:
   ```bash
   ./scripts/run-test-stripe-webhook.sh
   ```

3. Check the Stripe Dashboard for webhook delivery status and errors

## Airtable Schema

The Stripe integration uses the following fields in the Businesses table:

- `Stripe Customer ID`: The Stripe customer ID for the business
- `Stripe Subscription ID`: The Stripe subscription ID for the business
- `Subscription Tier`: The subscription tier (basic, pro, enterprise)
- `Subscription Status`: The subscription status (trialing, active, past_due, canceled, unpaid)
- `Trial Ends At`: The date when the trial ends
- `Cancel At Period End`: Whether the subscription is set to cancel at the end of the period
- `Subscription Updated At`: The date when the subscription was last updated

## Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)
