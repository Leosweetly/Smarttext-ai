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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const {
      userId,
      planId,
      successUrl,
      cancelUrl
    } = req.body;

    if (!userId || !planId || !successUrl || !cancelUrl) {
      return res.status(400).json({
        error: 'Missing required parameters: userId, planId, successUrl, cancelUrl'
      });
    }

    // Get the business from Airtable
    const business = await getBusinessById(userId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Map plan IDs to Stripe price IDs
    const planPriceMap: Record<string, string | undefined> = {
      basic: process.env.STRIPE_PRICE_BASIC,
      pro: process.env.STRIPE_PRICE_PRO,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE
    };
    
    const priceId = planPriceMap[planId];
    
    if (!priceId) {
      return res.status(400).json({ error: `Invalid plan ID: ${planId}` });
    }
    
    // Create the checkout session parameters
    const params: Stripe.Checkout.SessionCreateParams = {
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
        trial_period_days: planId === 'enterprise' ? 14 : 7 // 14-day trial for enterprise, 7 for others
      },
      metadata: {
        userId: userId // Store the user ID in metadata for webhook processing
      }
    };
    
    // If the business has a Stripe customer ID, use it
    if (business.stripeCustomerId) {
      params.customer = business.stripeCustomerId;
    } else {
      // Otherwise, use the business email to create a new customer
      params.customer_email = business.email || business.contactEmail;
    }
    
    // Create the checkout session
    const session = await stripe.checkout.sessions.create(params);
    
    // Return the session ID to the client
    res.status(200).json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
}
