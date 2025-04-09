import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getBusinessById, updateBusinessSubscription } from '../../lib/airtable';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { userId, cancelImmediately = false } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    // Get the business from Airtable
    const business = await getBusinessById(userId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Check if the business has a subscription
    if (!business.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel the subscription
    const subscription = await stripe.subscriptions.update(
      business.stripeSubscriptionId,
      {
        cancel_at_period_end: !cancelImmediately,
      }
    );

    // If cancelling immediately, cancel the subscription now
    if (cancelImmediately) {
      await stripe.subscriptions.cancel(business.stripeSubscriptionId);
      
      // Update the business subscription in Airtable
      await updateBusinessSubscription(userId, {
        subscriptionStatus: 'canceled',
        cancelAtPeriodEnd: false,
        subscriptionUpdatedAt: new Date().toISOString()
      });
      
      return res.status(200).json({
        success: true,
        message: 'Subscription cancelled immediately',
        subscription: {
          status: 'canceled',
          cancelAtPeriodEnd: false
        }
      });
    }

    // Update the business subscription in Airtable
    await updateBusinessSubscription(userId, {
      cancelAtPeriodEnd: true,
      subscriptionUpdatedAt: new Date().toISOString()
    });

    // Log the cancellation
    console.log(`Subscription ${business.stripeSubscriptionId} for user ${userId} will be cancelled at period end`);

    // Return the updated subscription
    res.status(200).json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString() 
          : null
      }
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Log a subscription event to Airtable
 * @param {string} userId - The business ID
 * @param {Object} eventData - The event data to log
 */
async function logSubscriptionEvent(userId: string, eventData: any) {
  try {
    // This would typically log to an Airtable table or other database
    console.log(`Subscription event for user ${userId}:`, eventData);
    
    // In a real implementation, you would log this to Airtable
    // For now, we'll just log to the console
  } catch (error) {
    console.error('Error logging subscription event:', error);
  }
}
