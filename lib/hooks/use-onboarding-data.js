/**
 * React hook for accessing onboarding data
 */

import { useCallback } from 'react';
import { useOnboarding } from '@/lib/onboarding/context';

/**
 * Hook for accessing and manipulating onboarding data
 * @returns {Object} Onboarding data and methods
 */
export function useOnboardingData() {
  const {
    onboardingData,
    loading,
    error,
    updateData,
    resetData,
    updateStepData,
    completeStep,
    goToStep,
    completeOnboarding,
    isStepCompleted,
    getCurrentStep,
    isOnboardingCompleted,
    getStepData
  } = useOnboarding();

  /**
   * Get business info data
   * @returns {Object} Business info data
   */
  const getBusinessInfo = useCallback(() => {
    return getStepData('businessInfo');
  }, [getStepData]);

  /**
   * Update business info data
   * @param {Object} data - Business info data
   * @param {boolean} completed - Whether the step is completed
   * @returns {Promise<Object>} Updated onboarding data
   */
  const updateBusinessInfo = useCallback((data, completed = true) => {
    return updateStepData('businessInfo', data, completed);
  }, [updateStepData]);

  /**
   * Get phone setup data
   * @returns {Object} Phone setup data
   */
  const getPhoneSetup = useCallback(() => {
    return getStepData('phoneSetup');
  }, [getStepData]);

  /**
   * Update phone setup data
   * @param {Object} data - Phone setup data
   * @param {boolean} completed - Whether the step is completed
   * @returns {Promise<Object>} Updated onboarding data
   */
  const updatePhoneSetup = useCallback((data, completed = true) => {
    return updateStepData('phoneSetup', data, completed);
  }, [updateStepData]);

  /**
   * Get preferences data
   * @returns {Object} Preferences data
   */
  const getPreferences = useCallback(() => {
    return getStepData('preferences');
  }, [getStepData]);

  /**
   * Update preferences data
   * @param {Object} data - Preferences data
   * @param {boolean} completed - Whether the step is completed
   * @returns {Promise<Object>} Updated onboarding data
   */
  const updatePreferences = useCallback((data, completed = true) => {
    return updateStepData('preferences', data, completed);
  }, [updateStepData]);

  /**
   * Check if business info step is completed
   * @returns {boolean} Whether the step is completed
   */
  const isBusinessInfoCompleted = useCallback(() => {
    return isStepCompleted('businessInfo');
  }, [isStepCompleted]);

  /**
   * Check if phone setup step is completed
   * @returns {boolean} Whether the step is completed
   */
  const isPhoneSetupCompleted = useCallback(() => {
    return isStepCompleted('phoneSetup');
  }, [isStepCompleted]);

  /**
   * Check if preferences step is completed
   * @returns {boolean} Whether the step is completed
   */
  const isPreferencesCompleted = useCallback(() => {
    return isStepCompleted('preferences');
  }, [isStepCompleted]);

  /**
   * Go to business info step
   * @returns {Promise<Object>} Updated onboarding data
   */
  const goToBusinessInfo = useCallback(() => {
    return goToStep('businessInfo');
  }, [goToStep]);

  /**
   * Go to phone setup step
   * @returns {Promise<Object>} Updated onboarding data
   */
  const goToPhoneSetup = useCallback(() => {
    return goToStep('phoneSetup');
  }, [goToStep]);

  /**
   * Go to preferences step
   * @returns {Promise<Object>} Updated onboarding data
   */
  const goToPreferences = useCallback(() => {
    return goToStep('preferences');
  }, [goToStep]);

  /**
   * Get the next step in the onboarding process
   * @returns {string|null} Next step or null if onboarding is completed
   */
  const getNextStep = useCallback(() => {
    if (isOnboardingCompleted()) {
      return null;
    }

    const currentStep = getCurrentStep();

    if (currentStep === 'businessInfo') {
      return 'phoneSetup';
    } else if (currentStep === 'phoneSetup') {
      return 'preferences';
    } else if (currentStep === 'preferences') {
      return null;
    }

    return null;
  }, [getCurrentStep, isOnboardingCompleted]);

  /**
   * Go to the next step in the onboarding process
   * @returns {Promise<Object>} Updated onboarding data
   */
  const goToNextStep = useCallback(async () => {
    const nextStep = getNextStep();

    if (!nextStep) {
      return completeOnboarding();
    }

    return goToStep(nextStep);
  }, [getNextStep, goToStep, completeOnboarding]);

  /**
   * Get the previous step in the onboarding process
   * @returns {string|null} Previous step or null if at the first step
   */
  const getPreviousStep = useCallback(() => {
    const currentStep = getCurrentStep();

    if (currentStep === 'businessInfo') {
      return null;
    } else if (currentStep === 'phoneSetup') {
      return 'businessInfo';
    } else if (currentStep === 'preferences') {
      return 'phoneSetup';
    }

    return null;
  }, [getCurrentStep]);

  /**
   * Go to the previous step in the onboarding process
   * @returns {Promise<Object>} Updated onboarding data
   */
  const goToPreviousStep = useCallback(async () => {
    const previousStep = getPreviousStep();

    if (!previousStep) {
      return null;
    }

    return goToStep(previousStep);
  }, [getPreviousStep, goToStep]);

  return {
    // Base onboarding data and methods
    onboardingData,
    loading,
    error,
    updateData,
    resetData,
    completeOnboarding,
    isOnboardingCompleted,
    getCurrentStep,

    // Step-specific data and methods
    getBusinessInfo,
    updateBusinessInfo,
    getPhoneSetup,
    updatePhoneSetup,
    getPreferences,
    updatePreferences,

    // Step completion status
    isBusinessInfoCompleted,
    isPhoneSetupCompleted,
    isPreferencesCompleted,

    // Navigation methods
    goToBusinessInfo,
    goToPhoneSetup,
    goToPreferences,
    getNextStep,
    goToNextStep,
    getPreviousStep,
    goToPreviousStep
  };
}

export default useOnboardingData;
