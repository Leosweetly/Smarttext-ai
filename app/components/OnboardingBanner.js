/**
 * Onboarding Banner Component
 * 
 * This component displays a banner for users who need to complete onboarding.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/lib/onboarding/index';
import styles from './OnboardingBanner.module.css';

/**
 * Onboarding Banner component
 * @returns {JSX.Element} Banner component
 */
export default function OnboardingBanner() {
  const router = useRouter();
  const {
    onboardingData,
    loading,
    isOnboardingCompleted,
    getCurrentStep,
    isStepCompleted
  } = useOnboarding();
  
  const [visible, setVisible] = useState(false);
  
  // Determine if the banner should be visible
  useEffect(() => {
    if (loading) {
      return;
    }
    
    // Don't show banner if onboarding is completed
    if (isOnboardingCompleted()) {
      setVisible(false);
      return;
    }
    
    // Don't show banner on onboarding pages
    if (router.pathname?.startsWith('/onboarding')) {
      setVisible(false);
      return;
    }
    
    // Show banner if onboarding is not completed
    setVisible(true);
  }, [loading, isOnboardingCompleted, router.pathname]);
  
  // Don't render if not visible
  if (!visible || !onboardingData) {
    return null;
  }
  
  // Get current step
  const currentStep = getCurrentStep();
  
  // Get step completion status
  const businessInfoCompleted = isStepCompleted('businessInfo');
  const phoneSetupCompleted = isStepCompleted('phoneSetup');
  const preferencesCompleted = isStepCompleted('preferences');
  
  // Get step URLs
  const businessInfoUrl = '/onboarding/business-info';
  const phoneSetupUrl = '/onboarding/phone-setup';
  const preferencesUrl = '/onboarding/preferences';
  
  // Get current step URL
  let currentStepUrl = businessInfoUrl;
  if (currentStep === 'phoneSetup') {
    currentStepUrl = phoneSetupUrl;
  } else if (currentStep === 'preferences') {
    currentStepUrl = preferencesUrl;
  }
  
  // Get progress percentage
  let progress = 0;
  if (businessInfoCompleted) progress += 33;
  if (phoneSetupCompleted) progress += 33;
  if (preferencesCompleted) progress += 34;
  
  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.message}>
          <h3>Complete your setup</h3>
          <p>You need to complete the onboarding process to fully set up your account.</p>
        </div>
        
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>{progress}% complete</span>
        </div>
        
        <div className={styles.steps}>
          <div className={`${styles.step} ${businessInfoCompleted ? styles.completed : ''} ${currentStep === 'businessInfo' ? styles.current : ''}`}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepLabel}>Business Info</div>
          </div>
          
          <div className={`${styles.step} ${phoneSetupCompleted ? styles.completed : ''} ${currentStep === 'phoneSetup' ? styles.current : ''}`}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepLabel}>Phone Setup</div>
          </div>
          
          <div className={`${styles.step} ${preferencesCompleted ? styles.completed : ''} ${currentStep === 'preferences' ? styles.current : ''}`}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepLabel}>Preferences</div>
          </div>
        </div>
        
        <div className={styles.actions}>
          <Link href={currentStepUrl} className={styles.continueButton}>
            Continue Setup
          </Link>
          
          <button 
            className={styles.dismissButton}
            onClick={() => setVisible(false)}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
