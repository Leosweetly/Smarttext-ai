"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import styles from "./subscription.module.css";

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Check for success or canceled query parameters
  const success = searchParams.get('success') === 'true';
  const canceled = searchParams.get('canceled') === 'true';
  
  // State for post-signup processing
  const [isProcessingSignup, setIsProcessingSignup] = useState(false);
  const [signupProcessed, setSignupProcessed] = useState(false);
  const [signupError, setSignupError] = useState(null);
  
  // Sample subscription data - in a real app, this would come from the database
  const [subscription, setSubscription] = useState({
    plan: "pro",
    status: "trialing",
    trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    paymentMethod: {
      brand: "visa",
      last4: "4242",
      expMonth: 12,
      expYear: 2025
    }
  });

  const plans = {
    basic: {
      name: "Basic",
      price: "$249/mo",
      features: [
        "Auto-text for missed calls",
        "Pre-built industry templates",
        "Basic appointment booking"
      ]
    },
    pro: {
      name: "Pro",
      price: "$399/mo",
      features: [
        "Everything in Basic",
        "CRM integration (HubSpot, Zoho, etc.)",
        "Custom AI responses per business",
        "Lead qualification"
      ]
    },
    enterprise: {
      name: "Enterprise",
      price: "$599+/mo",
      features: [
        "Everything in Pro",
        "Multi-location support (for chains)",
        "Priority support & AI training",
        "SMS campaign capabilities"
      ]
    }
  };

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [message, setMessage] = useState(null);

  // Process post-signup configuration
  useEffect(() => {
    // Check if this is a new signup by looking for data in localStorage
    const storedPlan = localStorage.getItem('selectedPlan');
    const storedPhoneNumber = localStorage.getItem('businessPhoneNumber');
    
    const processSignup = async () => {
      if (!user || signupProcessed || isProcessingSignup) return;
      
      // If we have stored data and the user is authenticated, process the signup
      if (storedPlan) {
        try {
          setIsProcessingSignup(true);
          
          // Call the post-signup API to create the business and configure Twilio
          const response = await fetch('/api/auth/post-signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user,
              phoneNumber: storedPhoneNumber || null,
              plan: storedPlan
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to process signup');
          }
          
          const data = await response.json();
          
          // Update subscription with the new plan
          setSubscription(prev => ({
            ...prev,
            plan: storedPlan
          }));
          
          // Show success message
          setMessage({
            type: 'success',
            text: storedPhoneNumber 
              ? 'Your account has been set up and your Twilio number has been configured!' 
              : 'Your account has been set up successfully!'
          });
          
          // Clear localStorage
          localStorage.removeItem('selectedPlan');
          localStorage.removeItem('businessPhoneNumber');
          
        } catch (error) {
          console.error('Error processing signup:', error);
          setSignupError(error.message);
          
          // Show error message
          setMessage({
            type: 'error',
            text: 'There was an error setting up your account. Please contact support.'
          });
        } finally {
          setIsProcessingSignup(false);
          setSignupProcessed(true);
        }
      }
    };
    
    processSignup();
  }, [user, signupProcessed, isProcessingSignup]);

  // Show success or error message based on query parameters
  useEffect(() => {
    if (success) {
      setMessage({
        type: 'success',
        text: 'Your subscription has been updated successfully!'
      });
    } else if (canceled) {
      setMessage({
        type: 'error',
        text: 'Subscription update was canceled.'
      });
    }
    
    // Clear message after 5 seconds
    const timer = setTimeout(() => {
      setMessage(null);
      
      // Remove query parameters from URL
      if (success || canceled) {
        router.replace('/dashboard/subscription');
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [success, canceled, router]);

  // Format date to readable string
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle plan upgrade/downgrade
  const handleChangePlan = async (newPlan) => {
    setProcessingAction(true);
    
    try {
      // Call the Stripe Checkout API
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: newPlan }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setMessage({
        type: 'error',
        text: 'Failed to create checkout session. Please try again.'
      });
      setProcessingAction(false);
    }
  };

  // Handle subscription cancellation
  const handleCancel = async () => {
    setProcessingAction(true);
    
    try {
      // In a real app, you would call an API to cancel the subscription
      // For now, we'll simulate it
      setTimeout(() => {
        setSubscription(prev => ({
          ...prev,
          status: "canceled"
        }));
        setShowCancelModal(false);
        setProcessingAction(false);
        setMessage({
          type: 'success',
          text: 'Your subscription has been canceled. You will have access until the end of your billing period.'
        });
      }, 1500);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setMessage({
        type: 'error',
        text: 'Failed to cancel subscription. Please try again.'
      });
      setProcessingAction(false);
      setShowCancelModal(false);
    }
  };

  // Handle subscription reactivation
  const handleReactivate = async () => {
    setProcessingAction(true);
    
    try {
      // In a real app, you would call an API to reactivate the subscription
      // For now, we'll simulate it
      setTimeout(() => {
        setSubscription(prev => ({
          ...prev,
          status: "active"
        }));
        setProcessingAction(false);
        setMessage({
          type: 'success',
          text: 'Your subscription has been reactivated.'
        });
      }, 1500);
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      setMessage({
        type: 'error',
        text: 'Failed to reactivate subscription. Please try again.'
      });
      setProcessingAction(false);
    }
  };

  // Handle updating payment method
  const handleUpdatePayment = async () => {
    setProcessingAction(true);
    
    try {
      // In a real app, you would call the Stripe Portal API
      // For now, we'll simulate it
      setTimeout(() => {
        setProcessingAction(false);
        setMessage({
          type: 'info',
          text: 'This would redirect to Stripe Portal in a real app.'
        });
      }, 1500);
    } catch (error) {
      console.error('Error opening Stripe Portal:', error);
      setMessage({
        type: 'error',
        text: 'Failed to open Stripe Portal. Please try again.'
      });
      setProcessingAction(false);
    }
  };

  return (
    <div className={styles.subscriptionPage}>
      <h1 className={styles.pageTitle}>Subscription Management</h1>
      
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}
      
      <div className={styles.subscriptionOverview}>
        <div className={styles.currentPlan}>
          <h2>Current Plan</h2>
          <div className={styles.planCard}>
            <div className={styles.planHeader}>
              <h3>{plans[subscription.plan].name}</h3>
              <span className={styles.planPrice}>{plans[subscription.plan].price}</span>
            </div>
            
            <div className={styles.planStatus}>
              {subscription.status === "trialing" ? (
                <span className={styles.trialBadge}>
                  Trial ends on {formatDate(subscription.trialEndsAt)}
                </span>
              ) : subscription.status === "active" ? (
                <span className={styles.activeBadge}>
                  Active • Renews on {formatDate(subscription.currentPeriodEnd)}
                </span>
              ) : (
                <span className={styles.canceledBadge}>
                  Canceled • Expires on {formatDate(subscription.currentPeriodEnd)}
                </span>
              )}
            </div>
            
            <div className={styles.planFeatures}>
              <h4>Features</h4>
              <ul>
                {plans[subscription.plan].features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            
            <div className={styles.planActions}>
              {subscription.status !== "canceled" && (
                <button 
                  className={styles.cancelButton}
                  onClick={() => setShowCancelModal(true)}
                  disabled={processingAction}
                >
                  Cancel Subscription
                </button>
              )}
              
              {subscription.status === "canceled" && (
                <button 
                  className={styles.reactivateButton}
                  onClick={handleReactivate}
                  disabled={processingAction}
                >
                  {processingAction ? "Processing..." : "Reactivate Subscription"}
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className={styles.paymentInfo}>
          <h2>Payment Information</h2>
          <div className={styles.paymentCard}>
            <div className={styles.cardInfo}>
              <div className={styles.cardIcon}>
                {subscription.paymentMethod.brand === "visa" ? "Visa" : 
                 subscription.paymentMethod.brand === "mastercard" ? "Mastercard" : 
                 subscription.paymentMethod.brand === "amex" ? "Amex" : 
                 "Card"}
              </div>
              <div className={styles.cardDetails}>
                <span className={styles.cardNumber}>
                  •••• •••• •••• {subscription.paymentMethod.last4}
                </span>
                <span className={styles.cardExpiry}>
                  Expires {subscription.paymentMethod.expMonth}/{subscription.paymentMethod.expYear}
                </span>
              </div>
            </div>
            <button 
              className={styles.updateButton}
              onClick={handleUpdatePayment}
              disabled={processingAction}
            >
              {processingAction ? "Processing..." : "Update Payment Method"}
            </button>
          </div>
          
          <div className={styles.billingHistory}>
            <h3>Billing History</h3>
            <div className={styles.billingItem}>
              <div className={styles.billingDetails}>
                <span className={styles.billingDate}>March 1, 2025</span>
                <span className={styles.billingPlan}>{plans[subscription.plan].name} Plan</span>
              </div>
              <span className={styles.billingAmount}>{plans[subscription.plan].price.replace('/mo', '')}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.otherPlans}>
        <h2>Available Plans</h2>
        <div className={styles.plansGrid}>
          {Object.entries(plans).map(([planId, plan]) => {
            if (planId === subscription.plan) return null;
            
            return (
              <div key={planId} className={styles.planOption}>
                <div className={styles.planOptionHeader}>
                  <h3>{plan.name}</h3>
                  <span className={styles.planOptionPrice}>{plan.price}</span>
                </div>
                
                <ul className={styles.planOptionFeatures}>
                  {plan.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
                
                <button 
                  className={styles.upgradeButton}
                  onClick={() => handleChangePlan(planId)}
                  disabled={processingAction}
                >
                  {processingAction ? "Processing..." : 
                   subscription.plan === "enterprise" || 
                   (subscription.plan === "pro" && planId === "basic") ? 
                   "Downgrade" : "Upgrade"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Cancel Subscription</h2>
            <p>
              Are you sure you want to cancel your subscription? You'll lose access to your current features at the end of your billing period.
            </p>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelConfirmButton}
                onClick={handleCancel}
                disabled={processingAction}
              >
                {processingAction ? "Processing..." : "Yes, Cancel Subscription"}
              </button>
              <button 
                className={styles.cancelDismissButton}
                onClick={() => setShowCancelModal(false)}
                disabled={processingAction}
              >
                No, Keep My Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
