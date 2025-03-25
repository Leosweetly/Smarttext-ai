"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useOnboarding } from "@/lib/onboarding/context";
import styles from "../onboarding.module.css";

export default function BusinessInfoPage() {
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
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  
  // Business type options
  const businessTypes = [
    { value: "", label: "Select business type" },
    { value: "restaurant", label: "Restaurant" },
    { value: "retail", label: "Retail" },
    { value: "healthcare", label: "Healthcare" },
    { value: "automotive", label: "Automotive" },
    { value: "salon", label: "Salon/Spa" },
    { value: "legal", label: "Legal Services" },
    { value: "realestate", label: "Real Estate" },
    { value: "fitness", label: "Fitness/Gym" },
    { value: "other", label: "Other" }
  ];
  
  // Load existing data if available
  useEffect(() => {
    if (onboardingData && onboardingData.steps && onboardingData.steps.businessInfo) {
      const businessInfoData = onboardingData.steps.businessInfo.data || {};
      
      setBusinessName(businessInfoData.name || "");
      setBusinessType(businessInfoData.businessType || "");
      
      // Parse address if it exists
      if (businessInfoData.address) {
        const addressParts = businessInfoData.address.split(', ');
        if (addressParts.length >= 1) setAddress(addressParts[0] || "");
        if (addressParts.length >= 2) setCity(addressParts[1] || "");
        
        // Parse state and zip if they exist
        if (addressParts.length >= 3) {
          const stateZip = addressParts[2].split(' ');
          if (stateZip.length >= 1) setState(stateZip[0] || "");
          if (stateZip.length >= 2) setZipCode(stateZip[1] || "");
        }
      }
    }
  }, [onboardingData]);
  
  // Check if user should be on this step
  useEffect(() => {
    if (!isAuthLoading && !isOnboardingLoading && onboardingData) {
      const currentStep = getCurrentStep();
      
      // If this step is already completed, go to the next step
      if (isStepCompleted('businessInfo') && currentStep !== 'businessInfo') {
        router.push(`/onboarding/${currentStep}`);
      }
    }
  }, [isAuthLoading, isOnboardingLoading, onboardingData, getCurrentStep, isStepCompleted, router]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      // Validate form
      if (!businessName) {
        throw new Error("Business name is required");
      }
      
      if (!businessType) {
        throw new Error("Business type is required");
      }
      
      // Format full address
      const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
      
      // Update onboarding data
      await updateStepData('businessInfo', {
        name: businessName,
        businessType,
        address: fullAddress
      }, true);
      
      // Mark step as completed and go to next step
      await completeStep('businessInfo');
      await goToStep('phoneSetup');
      
      // Navigate to next step
      router.push('/onboarding/phone-setup');
    } catch (error) {
      console.error('Error saving business info:', error);
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
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
          <div className={styles.progressStep} style={{ backgroundColor: '#0066cc' }}>1</div>
          <div className={styles.progressLine}></div>
          <div className={styles.progressStep}>2</div>
          <div className={styles.progressLine}></div>
          <div className={styles.progressStep}>3</div>
        </div>
        
        <h1 className={styles.title}>Business Information</h1>
        <p className={styles.subtitle}>Tell us about your business so we can personalize your experience.</p>
        
        {formError && (
          <div className={styles.formError}>
            <p>{formError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="businessName">Business Name</label>
            <input
              type="text"
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter your business name"
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="businessType">Business Type</label>
            <select
              id="businessType"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className={styles.select}
              required
            >
              {businessTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="address">Street Address</label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
              className={styles.input}
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
                className={styles.input}
                maxLength={2}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="zipCode">ZIP Code</label>
              <input
                type="text"
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="ZIP"
                className={styles.input}
                maxLength={5}
              />
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className={styles.secondaryButton}
              disabled={isSubmitting}
            >
              Skip for Now
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
