import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe Checkout Session for subscription
 * @param {Object} options - Options for creating the checkout session
 * @param {string} options.customerId - Stripe customer ID (if exists)
 * @param {string} options.userEmail - User's email address
 * @param {string} options.planId - The plan ID to subscribe to (basic, pro, enterprise)
 * @param {string} options.successUrl - URL to redirect on successful payment
 * @param {string} options.cancelUrl - URL to redirect on cancelled payment
 * @returns {Promise<Object>} - The created Checkout Session
 */
export async function createCheckoutSession({
  customerId,
  userEmail,
  planId,
  successUrl,
  cancelUrl
}) {
  // Map plan IDs to Stripe price IDs
  const planPriceMap = {
    basic: process.env.STRIPE_PRICE_BASIC,
    pro: process.env.STRIPE_PRICE_PRO,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE
  };
  
  const priceId = planPriceMap[planId];
  
  if (!priceId) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  
  const params = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: 7 // 7-day free trial
    }
  };
  
  // If we have a customer ID, use it
  if (customerId) {
    params.customer = customerId;
  } else if (userEmail) {
    // Otherwise, use the email to create a new customer
    params.customer_email = userEmail;
  }
  
  return stripe.checkout.sessions.create(params);
}

/**
 * Create a Stripe Portal Session for managing subscriptions
 * @param {string} customerId - Stripe customer ID
 * @param {string} returnUrl - URL to return to after the portal session
 * @returns {Promise<Object>} - The created Portal Session
 */
export async function createPortalSession(customerId, returnUrl) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  });
}

/**
 * Get a customer's subscription details
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Object>} - The customer's subscription details
 */
export async function getCustomerSubscription(customerId) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    expand: ['data.default_payment_method']
  });
  
  return subscriptions.data[0] || null;
}

/**
 * Cancel a subscription
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Object>} - The cancelled subscription
 */
export async function cancelSubscription(subscriptionId) {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true
  });
}

/**
 * Reactivate a cancelled subscription
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Object>} - The reactivated subscription
 */
export async function reactivateSubscription(subscriptionId) {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false
  });
}

/**
 * Update a subscription to a new plan
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {string} planId - The new plan ID (basic, pro, enterprise)
 * @returns {Promise<Object>} - The updated subscription
 */
export async function updateSubscription(subscriptionId, planId) {
  // Map plan IDs to Stripe price IDs
  const planPriceMap = {
    basic: process.env.STRIPE_PRICE_BASIC,
    pro: process.env.STRIPE_PRICE_PRO,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE
  };
  
  const priceId = planPriceMap[planId];
  
  if (!priceId) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  
  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0].id,
        price: priceId
      }
    ]
  });
}

export default stripe;
