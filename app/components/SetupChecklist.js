/**
 * Setup Checklist Component
 * 
 * This component displays a checklist of setup steps for the user to complete.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useOnboarding } from '@/lib/onboarding/index';
import styles from './SetupChecklist.module.css';

/**
 * Setup Checklist component
 * @returns {JSX.Element} Checklist component
 */
export default function SetupChecklist() {
  const {
    loading,
    isStepCompleted,
    isOnboardingCompleted,
    getCurrentStep
  } = useOnboarding();
  
  const [expanded, setExpanded] = useState(true);
  
  // Don't render if loading or onboarding is completed
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Setup Checklist</h2>
          <button 
            className={styles.toggleButton}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '−' : '+'}
          </button>
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }
  
  if (isOnboardingCompleted()) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Setup Complete</h2>
          <button 
            className={styles.toggleButton}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '−' : '+'}
          </button>
        </div>
        
        {expanded && (
          <div className={styles.content}>
            <div className={styles.completedMessage}>
              <p>🎉 You have completed all setup steps!</p>
              <p>Your account is fully configured and ready to use.</p>
            </div>
          </div>
        )}
      </div>
    );
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
  
  // Calculate progress
  let completedSteps = 0;
  if (businessInfoCompleted) completedSteps++;
  if (phoneSetupCompleted) completedSteps++;
  if (preferencesCompleted) completedSteps++;
  
  const totalSteps = 3;
  const progress = Math.round((completedSteps / totalSteps) * 100);
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Setup Checklist</h2>
        <button 
          className={styles.toggleButton}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '−' : '+'}
        </button>
      </div>
      
      {expanded && (
        <div className={styles.content}>
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>{completedSteps} of {totalSteps} steps completed</span>
          </div>
          
          <ul className={styles.checklist}>
            <li className={`${styles.checklistItem} ${businessInfoCompleted ? styles.completed : ''} ${currentStep === 'businessInfo' ? styles.current : ''}`}>
              <div className={styles.checklistItemContent}>
                <div className={styles.checklistItemStatus}>
                  {businessInfoCompleted ? (
                    <span className={styles.checkmark}>✓</span>
                  ) : (
                    <span className={styles.stepNumber}>1</span>
                  )}
                </div>
                <div className={styles.checklistItemDetails}>
                  <h3>Business Information</h3>
                  <p>Enter your business details</p>
                </div>
              </div>
              <Link 
                href={businessInfoUrl} 
                className={`${styles.actionButton} ${businessInfoCompleted ? styles.editButton : styles.setupButton}`}
              >
                {businessInfoCompleted ? 'Edit' : 'Setup'}
              </Link>
            </li>
            
            <li className={`${styles.checklistItem} ${phoneSetupCompleted ? styles.completed : ''} ${currentStep === 'phoneSetup' ? styles.current : ''}`}>
              <div className={styles.checklistItemContent}>
                <div className={styles.checklistItemStatus}>
                  {phoneSetupCompleted ? (
                    <span className={styles.checkmark}>✓</span>
                  ) : (
                    <span className={styles.stepNumber}>2</span>
                  )}
                </div>
                <div className={styles.checklistItemDetails}>
                  <h3>Phone Setup</h3>
                  <p>Configure your phone settings</p>
                </div>
              </div>
              <Link 
                href={phoneSetupUrl} 
                className={`${styles.actionButton} ${phoneSetupCompleted ? styles.editButton : styles.setupButton}`}
              >
                {phoneSetupCompleted ? 'Edit' : 'Setup'}
              </Link>
            </li>
            
            <li className={`${styles.checklistItem} ${preferencesCompleted ? styles.completed : ''} ${currentStep === 'preferences' ? styles.current : ''}`}>
              <div className={styles.checklistItemContent}>
                <div className={styles.checklistItemStatus}>
                  {preferencesCompleted ? (
                    <span className={styles.checkmark}>✓</span>
                  ) : (
                    <span className={styles.stepNumber}>3</span>
                  )}
                </div>
                <div className={styles.checklistItemDetails}>
                  <h3>Preferences</h3>
                  <p>Set your notification and display preferences</p>
                </div>
              </div>
              <Link 
                href={preferencesUrl} 
                className={`${styles.actionButton} ${preferencesCompleted ? styles.editButton : styles.setupButton}`}
              >
                {preferencesCompleted ? 'Edit' : 'Setup'}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
