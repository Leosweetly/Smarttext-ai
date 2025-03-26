import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/payment";

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 }
      );
    }
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json(
      { error: "Failed to handle webhook" },
      { status: 500 }
    );
  }
}

// Handle checkout.session.completed event
async function handleCheckoutSessionCompleted(session) {
  // In a real app, you would:
  // 1. Get the customer ID from the session
  const customerId = session.customer;
  // 2. Get the subscription ID from the session
  const subscriptionId = session.subscription;
  // 3. Update your database to link the customer ID and subscription ID to the user
  console.log(`Checkout completed for customer ${customerId} with subscription ${subscriptionId}`);
}

// Handle customer.subscription.created event
async function handleSubscriptionCreated(subscription) {
  // In a real app, you would:
  // 1. Get the customer ID from the subscription
  const customerId = subscription.customer;
  // 2. Update your database to store the subscription details
  console.log(`Subscription created for customer ${customerId}: ${subscription.id}`);
}

// Handle customer.subscription.updated event
async function handleSubscriptionUpdated(subscription) {
  // In a real app, you would:
  // 1. Get the customer ID from the subscription
  const customerId = subscription.customer;
  // 2. Update your database with the new subscription details
  console.log(`Subscription updated for customer ${customerId}: ${subscription.id}`);
}

// Handle customer.subscription.deleted event
async function handleSubscriptionDeleted(subscription) {
  // In a real app, you would:
  // 1. Get the customer ID from the subscription
  const customerId = subscription.customer;
  // 2. Update your database to mark the subscription as deleted
  console.log(`Subscription deleted for customer ${customerId}: ${subscription.id}`);
}

// Handle invoice.payment_succeeded event
async function handleInvoicePaymentSucceeded(invoice) {
  // In a real app, you would:
  // 1. Get the customer ID from the invoice
  const customerId = invoice.customer;
  // 2. Update your database to record the successful payment
  console.log(`Payment succeeded for customer ${customerId}: ${invoice.id}`);
}

// Handle invoice.payment_failed event
async function handleInvoicePaymentFailed(invoice) {
  // In a real app, you would:
  // 1. Get the customer ID from the invoice
  const customerId = invoice.customer;
  // 2. Update your database to record the failed payment
  // 3. Notify the customer about the failed payment
  console.log(`Payment failed for customer ${customerId}: ${invoice.id}`);
}
