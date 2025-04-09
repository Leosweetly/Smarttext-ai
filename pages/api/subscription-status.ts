import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getBusinessById } from '../../lib/airtable';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const userId = Array.isArray(req.query.userId) 
      ? req.query.userId[0] 
      : req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    // Get the business from Airtable
    const business = await getBusinessById(userId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // If the business doesn't have a Stripe customer ID, they don't have a subscription
    if (!business.stripeCustomerId) {
      return res.status(200).json({
        subscriptionTier: business.subscriptionTier || 'basic',
        status: 'inactive',
        trialEndsAt: business.trialEndsAt || null,
        hasActiveSubscription: false
      });
    }

    // Get the customer's subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: business.stripeCustomerId,
      status: 'all',
      expand: ['data.default_payment_method']
    });

    // If the customer doesn't have any subscriptions
    if (subscriptions.data.length === 0) {
      return res.status(200).json({
        subscriptionTier: business.subscriptionTier || 'basic',
        status: 'inactive',
        trialEndsAt: business.trialEndsAt || null,
        hasActiveSubscription: false
      });
    }

    // Get the most recent subscription
    const subscription = subscriptions.data[0];

    // Determine the plan based on the price ID
    const priceId = subscription.items.data[0].price.id;
    let plan = 'basic';
    
    if (priceId === process.env.STRIPE_PRICE_PRO) {
      plan = 'pro';
    } else if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) {
      plan = 'enterprise';
    }

    // Check if the subscription is active
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';

    // Return the subscription details
    res.status(200).json({
      subscriptionId: subscription.id,
      subscriptionTier: plan,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString() 
        : null,
      trialEndsAt: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000).toISOString() 
        : null,
      hasActiveSubscription: isActive
    });
  } catch (error: any) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: error.message });
  }
}
