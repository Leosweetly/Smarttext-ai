"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useOnboarding } from "@/lib/onboarding/context";
import styles from "../onboarding.module.css";

export default function PreferencesPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { 
    onboardingData, 
    loading: isOnboardingLoading, 
    error: onboardingError,
    updateStepData,
    completeStep,
    completeOnboarding,
    isStepCompleted,
    getCurrentStep
  } = useOnboarding();
  
  // Form state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [notificationFrequency, setNotificationFrequency] = useState("immediate");
  const [autoRespond, setAutoRespond] = useState(true);
  const [theme, setTheme] = useState("light");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  
  // Load existing data if available
  useEffect(() => {
    if (onboardingData && onboardingData.steps && onboardingData.steps.preferences) {
      const preferencesData = onboardingData.steps.preferences.data || {};
      
      if (preferencesData.notifications) {
        setEmailNotifications(preferencesData.notifications.email ?? true);
        setSmsNotifications(preferencesData.notifications.sms ?? true);
        setPushNotifications(preferencesData.notifications.push ?? false);
        setNotificationFrequency(preferencesData.notifications.frequency || "immediate");
      }
      
      setAutoRespond(preferencesData.autoRespond ?? true);
      setTheme(preferencesData.theme || "light");
    }
  }, [onboardingData]);
  
  // Check if user should be on this step
  useEffect(() => {
    if (!isAuthLoading && !isOnboardingLoading && onboardingData) {
      const currentStep = getCurrentStep();
      
      // If the previous steps are not completed, go back to them
      if (!isStepCompleted('businessInfo') && currentStep === 'preferences') {
        router.push('/onboarding/business-info');
      } else if (!isStepCompleted('phoneSetup') && currentStep === 'preferences') {
        router.push('/onboarding/phone-setup');
      }
    }
  }, [isAuthLoading, isOnboardingLoading, onboardingData, getCurrentStep, isStepCompleted, router]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      // Update onboarding data
      await updateStepData('preferences', {
        notifications: {
          email: emailNotifications,
          sms: smsNotifications,
          push: pushNotifications,
          frequency: notificationFrequency
        },
        autoRespond,
        theme
      }, true);
      
      // Mark step as completed and complete onboarding
      await completeStep('preferences');
      await completeOnboarding(true);
      
      // Navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving preferences:', error);
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle going back to previous step
  const handleBack = () => {
    router.push('/onboarding/phone-setup');
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
          <div className={styles.progressStep} style={{ backgroundColor: '#4caf50' }}>✓</div>
          <div className={styles.progressLine} style={{ backgroundColor: '#4caf50' }}></div>
          <div className={styles.progressStep} style={{ backgroundColor: '#0066cc' }}>3</div>
        </div>
        
        <h1 className={styles.title}>Preferences</h1>
        <p className={styles.subtitle}>Set your preferences for SmartText AI.</p>
        
        {formError && (
          <div className={styles.formError}>
            <p>{formError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <h3>Notification Preferences</h3>
            <div className={styles.notificationOptions}>
              <div className={styles.notificationOption}>
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                />
                <label htmlFor="emailNotifications">
                  Email Notifications
                </label>
              </div>
              
              <div className={styles.notificationOption}>
                <input
                  type="checkbox"
                  id="smsNotifications"
                  checked={smsNotifications}
                  onChange={(e) => setSmsNotifications(e.target.checked)}
                />
                <label htmlFor="smsNotifications">
                  SMS Notifications
                </label>
              </div>
              
              <div className={styles.notificationOption}>
                <input
                  type="checkbox"
                  id="pushNotifications"
                  checked={pushNotifications}
                  onChange={(e) => setPushNotifications(e.target.checked)}
                />
                <label htmlFor="pushNotifications">
                  Push Notifications
                </label>
              </div>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="notificationFrequency">Notification Frequency</label>
            <select
              id="notificationFrequency"
              value={notificationFrequency}
              onChange={(e) => setNotificationFrequency(e.target.value)}
              className={styles.select}
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly Digest</option>
              <option value="daily">Daily Digest</option>
              <option value="weekly">Weekly Digest</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <div className={styles.checkbox}>
              <input
                type="checkbox"
                id="autoRespond"
                checked={autoRespond}
                onChange={(e) => setAutoRespond(e.target.checked)}
              />
              <label htmlFor="autoRespond">
                Automatically respond to missed calls with SmartText AI
              </label>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label>Theme Preference</label>
            <div className={styles.themeOptions}>
              <div 
                className={`${styles.themeOption} ${theme === 'light' ? styles.themeOptionSelected : ''}`}
                onClick={() => setTheme('light')}
              >
                <div className={styles.themeIcon}>☀️</div>
                <div>Light</div>
              </div>
              
              <div 
                className={`${styles.themeOption} ${theme === 'dark' ? styles.themeOptionSelected : ''}`}
                onClick={() => setTheme('dark')}
              >
                <div className={styles.themeIcon}>🌙</div>
                <div>Dark</div>
              </div>
              
              <div 
                className={`${styles.themeOption} ${theme === 'system' ? styles.themeOptionSelected : ''}`}
                onClick={() => setTheme('system')}
              >
                <div className={styles.themeIcon}>💻</div>
                <div>System</div>
              </div>
            </div>
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
              {isSubmitting ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
