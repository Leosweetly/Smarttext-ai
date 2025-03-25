"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useOnboarding } from "@/lib/onboarding/context";
import styles from "../onboarding.module.css";

export default function PhoneSetupPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { 
    onboardingData, 
    loading: isOnboardingLoading, 
    error: onboardingError,
    updateStepData,
    completeStep,
    goToStep,
    isStepCompleted,
    getCurrentStep
  } = useOnboarding();
  
  // Form state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  
  // Load existing data if available
  useEffect(() => {
    if (onboardingData && onboardingData.steps && onboardingData.steps.phoneSetup) {
      const phoneSetupData = onboardingData.steps.phoneSetup.data || {};
      
      if (phoneSetupData.phoneNumber) {
        // Parse phone number if it exists
        const fullNumber = phoneSetupData.phoneNumber;
        if (fullNumber.startsWith('+')) {
          const countryCodeEnd = fullNumber.indexOf(' ') > -1 ? fullNumber.indexOf(' ') : 2;
          setCountryCode(fullNumber.substring(0, countryCodeEnd));
          setPhoneNumber(fullNumber.substring(countryCodeEnd).trim());
        } else {
          setPhoneNumber(fullNumber);
        }
      }
      
      setIsConfigured(phoneSetupData.configured || false);
    }
  }, [onboardingData]);
  
  // Check if user should be on this step
  useEffect(() => {
    if (!isAuthLoading && !isOnboardingLoading && onboardingData) {
      const currentStep = getCurrentStep();
      
      // If this step is already completed, go to the next step
      if (isStepCompleted('phoneSetup') && currentStep !== 'phoneSetup') {
        router.push(`/onboarding/${currentStep}`);
      }
      
      // If the previous step is not completed, go back to it
      if (!isStepCompleted('businessInfo') && currentStep === 'phoneSetup') {
        router.push('/onboarding/business-info');
      }
    }
  }, [isAuthLoading, isOnboardingLoading, onboardingData, getCurrentStep, isStepCompleted, router]);
  
  // Format phone number as user types
  const handlePhoneNumberChange = (e) => {
    const input = e.target.value.replace(/\D/g, '');
    
    if (input.length <= 10) {
      // Format as (XXX) XXX-XXXX
      let formatted = input;
      if (input.length > 3) {
        formatted = `(${input.substring(0, 3)}) ${input.substring(3)}`;
      }
      if (input.length > 6) {
        formatted = `(${input.substring(0, 3)}) ${input.substring(3, 6)}-${input.substring(6)}`;
      }
      
      setPhoneNumber(formatted);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      // Validate form
      if (!phoneNumber) {
        throw new Error("Phone number is required");
      }
      
      // Format full phone number
      const cleanedNumber = phoneNumber.replace(/\D/g, '');
      const fullPhoneNumber = `${countryCode}${cleanedNumber}`;
      
      // Update onboarding data
      await updateStepData('phoneSetup', {
        phoneNumber: fullPhoneNumber,
        configured: isConfigured
      }, true);
      
      // Mark step as completed and go to next step
      await completeStep('phoneSetup');
      await goToStep('preferences');
      
      // Navigate to next step
      router.push('/onboarding/preferences');
    } catch (error) {
      console.error('Error saving phone setup:', error);
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle going back to previous step
  const handleBack = () => {
    router.push('/onboarding/business-info');
  };
  
  // Show loading state
  if (isAuthLoading || isOnboardingLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  // Show error state
  if (onboardingError) {
    return (
      <div className={styles.errorContainer}>
        <h1>Error</h1>
        <p>{onboardingError}</p>
        <button 
          className={styles.button}
          onClick={() => router.push('/dashboard')}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className={styles.onboardingContainer}>
      <div className={styles.onboardingCard}>
        <div className={styles.progressBar}>
          <div className={styles.progressStep} style={{ backgroundColor: '#4caf50' }}>✓</div>
          <div className={styles.progressLine} style={{ backgroundColor: '#4caf50' }}></div>
          <div className={styles.progressStep} style={{ backgroundColor: '#0066cc' }}>2</div>
          <div className={styles.progressLine}></div>
          <div className={styles.progressStep}>3</div>
        </div>
        
        <h1 className={styles.title}>Phone Setup</h1>
        <p className={styles.subtitle}>Set up your business phone number for SmartText AI.</p>
        
        {formError && (
          <div className={styles.formError}>
            <p>{formError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="phoneNumber">Business Phone Number</label>
            <div className={styles.phoneNumberContainer}>
              <select
                id="countryCode"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className={`${styles.select} ${styles.countryCode}`}
              >
                <option value="+1">+1</option>
                <option value="+44">+44</option>
                <option value="+61">+61</option>
                <option value="+33">+33</option>
                <option value="+49">+49</option>
              </select>
              
              <input
                type="text"
                id="phoneNumber"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                placeholder="(555) 123-4567"
                className={`${styles.input} ${styles.phoneInput}`}
                required
              />
            </div>
            <p className={styles.phoneNumberHelp}>
              This is the number that will be used for your SmartText AI service.
            </p>
          </div>
          
          <div className={styles.formGroup}>
            <div className={styles.checkbox}>
              <input
                type="checkbox"
                id="isConfigured"
                checked={isConfigured}
                onChange={(e) => setIsConfigured(e.target.checked)}
              />
              <label htmlFor="isConfigured">
                I have already configured this number with my phone provider
              </label>
            </div>
            <p className={styles.phoneNumberHelp}>
              If you haven't configured your number yet, we'll provide instructions in the next step.
            </p>
          </div>
          
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleBack}
              className={styles.secondaryButton}
              disabled={isSubmitting}
            >
              Back
            </button>
            
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
