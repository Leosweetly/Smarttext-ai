# Stripe Subscription Flow QA

This document outlines the QA process for the Stripe subscription flow, ensuring that all aspects of the subscription system work correctly.

## What's Being Tested

The QA process tests the following aspects of the Stripe subscription flow:

1. **Checkout Flow**
   - Verifies that the Pro plan ($549/mo) is selected for trial signups
   - Confirms the checkout session is created successfully

2. **Airtable Logs After Checkout**
   - Confirms that `subscriptionTier` is set to "pro"
   - Verifies that `trialEndsAt` is populated with the correct date
   - Ensures that `stripeCustomerId` and `stripeSubscriptionId` are stored

3. **Stripe Webhook Events**
   - Simulates and verifies the following webhook events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - For each webhook, confirms that:
     - Airtable record is updated correctly
     - Stripe customer and subscription IDs match
     - Plan name, status, and trial dates are accurate

4. **Subscription Updated At Field**
   - Adds a timestamp field to track when subscriptions are updated
   - Makes future auditing easier

## How to Run the Tests

### Prerequisites

- Node.js and npm installed
- Airtable API credentials configured in `.env.local`
- Stripe API credentials configured in `.env.local`

### Running the Tests

1. Make sure your environment variables are set up correctly in `.env.local`:
   ```
   AIRTABLE_PAT=your_airtable_personal_access_token
   AIRTABLE_BASE_ID=your_airtable_base_id
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   STRIPE_PRICE_BASIC=price_basic_id
   STRIPE_PRICE_PRO=price_pro_id
   STRIPE_PRICE_ENTERPRISE=price_enterprise_id
   ```

2. Run the QA script:
   ```bash
   ./scripts/run-qa-stripe-subscription-flow.sh
   ```

   This script will:
   - Start a local development server if one isn't already running
   - Run the QA tests
   - Display the results

3. Review the test results in the console output.

## Understanding the Test Results

The test results will show:

- ✅ PASS or ❌ FAIL for each test section
- Detailed information about what was tested and the results
- Any errors that occurred during testing

## Troubleshooting

If tests fail, check the following:

1. **Airtable Connection Issues**
   - Verify your Airtable credentials are correct
   - Ensure the Businesses table exists with the required fields

2. **Stripe API Issues**
   - Check that your Stripe API keys are valid
   - Verify the price IDs are correct

3. **Webhook Simulation Issues**
   - The webhook simulation uses a mock signature
   - For real webhook testing, use the Stripe CLI:
     ```
     stripe listen --forward-to localhost:3001/api/stripe-webhook
     ```

## Implementation Details

### Files Modified

1. **pages/api/stripe-webhook.ts**
   - Enhanced to handle all webhook events
   - Added support for updating Airtable records

2. **lib/airtable.js**
   - Added support for the Subscription Updated At field
   - Improved subscription update handling

### New Files Created

1. **scripts/qa-stripe-subscription-flow.js**
   - Main QA script that tests the subscription flow

2. **scripts/run-qa-stripe-subscription-flow.sh**
   - Shell script to run the QA tests

## Future Improvements

1. **Automated Testing**
   - Integrate with CI/CD pipeline for automated testing

2. **More Comprehensive Tests**
   - Test plan upgrades and downgrades
   - Test subscription cancellation and reactivation

3. **Better Error Handling**
   - Add more robust error handling for webhook events
   - Improve logging for easier debugging
