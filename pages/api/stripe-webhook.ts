console.log('✅ Stripe webhook endpoint hit!');
// Log the request body inside the handler function where req is defined

import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { updateBusinessSubscription, getBusinesses } from '../../lib/airtable';

// Disable body parsing, need the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Request body:', req.body);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      return res.status(400).json({ error: 'Missing Stripe signature' });
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        buf.toString(),
        sig,
        webhookSecret
      );

       // ADD THIS LOG RIGHT HERE:
  console.log('✅ Parsed Stripe event:', event);

    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract customer information
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.userId;
        
        if (userId && subscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Determine the plan based on the price ID
          const priceId = subscription.items.data[0].price.id;
          let plan = 'basic';
          
          if (priceId === process.env.STRIPE_PRICE_PRO) {
            plan = 'pro';
          } else if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) {
            plan = 'enterprise';
          }
          
          // Update the user's subscription in Airtable
          await updateBusinessSubscription(userId, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionTier: plan,
            subscriptionStatus: subscription.status,
            trialEndsAt: subscription.trial_end 
              ? new Date(subscription.trial_end * 1000).toISOString() 
              : undefined,
            subscriptionUpdatedAt: new Date().toISOString()
          });
          
          console.log(`Updated subscription for user ${userId} to ${plan} plan`);
        }
        break;
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const customerId = paymentIntent.customer as string;
        
        console.log(`Payment succeeded for customer ${customerId}`);
        
        // Find the business with this customer ID
        try {
          const businesses = await getBusinesses();
          const business = businesses.find(b => b.stripeCustomerId === customerId);
          
          if (business && business.id) {
            // Log the payment
            console.log(`Logging payment for business ${business.id}`);
            
            // In a production environment, you would log this to Airtable
            // For example:
            /*
            const table = getTable('Payments');
            await table.create({
              'Business': [business.id],
              'Payment Intent ID': paymentIntent.id,
              'Amount': paymentIntent.amount / 100, // Convert from cents
              'Status': 'succeeded',
              'Timestamp': new Date().toISOString()
            });
            */
          }
        } catch (error) {
          console.error(`Error logging payment for customer ${customerId}:`, error);
        }
        break;
      }
      
      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge;
        const customerId = charge.customer as string;
        
        console.log(`Charge succeeded for customer ${customerId}`);
        
        // Find the business with this customer ID
        try {
          const businesses = await getBusinesses();
          const business = businesses.find(b => b.stripeCustomerId === customerId);
          
          if (business && business.id) {
            // Log the charge
            console.log(`Logging charge for business ${business.id}`);
            
            // In a production environment, you would log this to Airtable
            // For example:
            /*
            const table = getTable('Charges');
            await table.create({
              'Business': [business.id],
              'Charge ID': charge.id,
              'Amount': charge.amount / 100, // Convert from cents
              'Status': 'succeeded',
              'Timestamp': new Date().toISOString()
            });
            */
          }
        } catch (error) {
          console.error(`Error logging charge for customer ${customerId}:`, error);
        }
        break;
      }
      
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        console.log(`Subscription created for customer ${customerId}`);
        
        // Find businesses with this customer ID
        try {
          const businesses = await getBusinesses();
          const business = businesses.find(b => b.stripeCustomerId === customerId);
          
          if (business && business.id) {
            // Determine the plan based on the price ID
            const priceId = subscription.items.data[0].price.id;
            let plan = 'basic';
            
            if (priceId === process.env.STRIPE_PRICE_PRO) {
              plan = 'pro';
            } else if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) {
              plan = 'enterprise';
            }
            
            // Update the business subscription
            await updateBusinessSubscription(business.id, {
              subscriptionTier: plan,
              subscriptionStatus: subscription.status,
              trialEndsAt: subscription.trial_end 
                ? new Date(subscription.trial_end * 1000).toISOString() 
                : undefined,
              subscriptionUpdatedAt: new Date().toISOString()
            });
            
            console.log(`Updated subscription for business ${business.id} to ${plan} plan with status ${subscription.status}`);
          }
        } catch (error) {
          console.error(`Error updating business for customer ${customerId}:`, error);
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        console.log(`Subscription updated for customer ${customerId}`);
        
        // Find businesses with this customer ID
        try {
          // This would be more efficient with a direct lookup by customer ID
          // For now, we'll get all businesses and filter
          const businesses = await getBusinesses();
          const business = businesses.find(b => b.stripeCustomerId === customerId);
          
          if (business && business.id) {
            // Determine the plan based on the price ID
            const priceId = subscription.items.data[0].price.id;
            let plan = 'basic';
            
            if (priceId === process.env.STRIPE_PRICE_PRO) {
              plan = 'pro';
            } else if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) {
              plan = 'enterprise';
            }
            
            // Update the business subscription
            await updateBusinessSubscription(business.id, {
              subscriptionTier: plan,
              subscriptionStatus: subscription.status,
              trialEndsAt: subscription.trial_end 
                ? new Date(subscription.trial_end * 1000).toISOString() 
                : undefined,
              cancelAtPeriodEnd: subscription.cancel_at_period_end
            });
            
            console.log(`Updated subscription for business ${business.id} to ${plan} plan with status ${subscription.status}`);
          } else {
            console.log(`No business found with customer ID ${customerId}`);
          }
        } catch (error) {
          console.error(`Error updating business for customer ${customerId}:`, error);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        console.log(`Subscription deleted for customer ${customerId}`);
        
        // Find businesses with this customer ID
        try {
          // This would be more efficient with a direct lookup by customer ID
          // For now, we'll get all businesses and filter
          const businesses = await getBusinesses();
          const business = businesses.find(b => b.stripeCustomerId === customerId);
          
          if (business && business.id) {
            // Update the business subscription
            await updateBusinessSubscription(business.id, {
              subscriptionStatus: 'canceled',
              cancelAtPeriodEnd: false // It's already canceled
            });
            
            console.log(`Updated subscription status to canceled for business ${business.id}`);
          } else {
            console.log(`No business found with customer ID ${customerId}`);
          }
        } catch (error) {
          console.error(`Error updating business for customer ${customerId}:`, error);
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    res.json({ received: true });
  } catch (err: any) {
    console.error(`Error processing webhook: ${err.message}`);
    res.status(500).json({ error: `Webhook Error: ${err.message}` });
  }
}
