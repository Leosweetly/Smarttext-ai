"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import styles from "./signup.module.css";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const { login, isAuthenticated, isLoading } = useAuth();
  
  const [selectedPlan, setSelectedPlan] = useState(planParam || "basic");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState(null);
  
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
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Set the plan from URL parameter when component mounts
  useEffect(() => {
    if (planParam && plans[planParam]) {
      setSelectedPlan(planParam);
    }
  }, [planParam]);
  
  // Validate phone number in E.164 format
  const validatePhoneNumber = (number) => {
    if (!number) return true; // Phone number is optional
    // Basic E.164 validation
    const regex = /^\+[1-9]\d{1,14}$/;
    return regex.test(number);
  };

  // Handle signup button click
  const handleSignup = () => {
    if (!agreeToTerms) {
      setError("You must agree to the terms and conditions");
      return;
    }
    
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      setPhoneNumberError("Please enter a valid phone number in E.164 format (e.g., +18186518560)");
      setError("Please correct the errors before continuing");
      return;
    }
    
    // Store the selected plan and phone number in localStorage
    localStorage.setItem('selectedPlan', selectedPlan);
    if (phoneNumber) {
      localStorage.setItem('businessPhoneNumber', phoneNumber);
    }
    
    // Redirect to Auth0 signup
    login('/dashboard/subscription');
  };
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className={styles.signupPage}>
        <div className={styles.signupContainer}>
          <div className={styles.loadingSpinner}>Loading...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.signupPage}>
      <div className={styles.signupContainer}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            SmartText AI
          </Link>
          <h1 className={styles.title}>Start Your 7-Day Free Trial</h1>
          <p className={styles.subtitle}>
            No credit card required to start. We'll remind you before the trial ends.
          </p>
        </div>
        
        {error && (
          <div className={styles.errorAlert}>
            {error}
          </div>
        )}
        
        <div className={styles.planSelection}>
          <h2>Select Your Plan</h2>
          <p className={styles.planInfo}>
            All plans include a 7-day free trial. You won't be charged until the trial ends.
          </p>
          
          <div className={styles.planOptions}>
            {Object.entries(plans).map(([planId, plan]) => (
              <div 
                key={planId}
                className={`${styles.planOption} ${selectedPlan === planId ? styles.selectedPlan : ''}`}
                onClick={() => setSelectedPlan(planId)}
              >
                <div className={styles.planHeader}>
                  <h3>{plan.name}</h3>
                  <span className={styles.planPrice}>{plan.price}</span>
                </div>
                
                <ul className={styles.planFeatures}>
                  {plan.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
                
                <div className={styles.planSelect}>
                  <input
                    type="radio"
                    id={`plan-${planId}`}
                    name="plan"
                    value={planId}
                    checked={selectedPlan === planId}
                    onChange={() => setSelectedPlan(planId)}
                  />
                  <label htmlFor={`plan-${planId}`}>
                    {selectedPlan === planId ? "Selected" : "Select"}
                  </label>
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.businessInfo}>
            <h2>Business Information</h2>
            <p className={styles.businessInfoText}>
              Enter your Twilio phone number to enable auto-text for missed calls.
            </p>
            
            <div className={styles.formGroup}>
              <label htmlFor="phoneNumber">Twilio Phone Number (Optional)</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (e.target.value && !validatePhoneNumber(e.target.value)) {
                    setPhoneNumberError("Please enter a valid phone number in E.164 format (e.g., +18186518560)");
                  } else {
                    setPhoneNumberError("");
                  }
                }}
                className={styles.input}
                placeholder="+18186518560"
              />
              {phoneNumberError && <p className={styles.inputError}>{phoneNumberError}</p>}
              <p className={styles.inputHelp}>
                Enter your Twilio phone number in E.164 format. This will be configured for missed call auto-texting.
              </p>
            </div>
          </div>
          
          <div className={styles.termsGroup}>
            <div className={styles.checkbox}>
              <input
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked);
                  if (e.target.checked) setError(null);
                }}
              />
              <label htmlFor="agreeToTerms">
                I agree to the <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>
              </label>
            </div>
          </div>
          
          <div className={styles.signupActions}>
            <button 
              className={styles.signupButton}
              onClick={handleSignup}
            >
              Continue to Create Account
            </button>
            
            <div className={styles.divider}>
              <span>OR</span>
            </div>
            
            <button 
              className={styles.googleButton}
              onClick={handleSignup}
            >
              Continue with Google
            </button>
          </div>
        </div>
        
        <div className={styles.loginLink}>
          Already have an account? <Link href="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
