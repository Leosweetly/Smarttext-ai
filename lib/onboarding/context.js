/**
 * Onboarding Context Provider
 * 
 * This file provides a React context for managing onboarding state.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useOnboardingApi } from '@/lib/hooks/use-onboarding-api';

// Create context
const OnboardingContext = createContext(null);

/**
 * Onboarding Provider component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Provider component
 */
export function OnboardingProvider({ children }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    loading: apiLoading,
    error: apiError,
    getOnboardingData,
    updateOnboardingData,
    resetOnboardingData,
    updateStep,
    markStepCompleted,
    setCurrentStep,
    markOnboardingCompleted
  } = useOnboardingApi();

  // State
  const [onboardingData, setOnboardingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch onboarding data when user changes
  useEffect(() => {
    async function fetchData() {
      if (isAuthLoading) {
        return;
      }

      if (!user) {
        setOnboardingData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getOnboardingData();
        setOnboardingData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchData();
  }, [user, isAuthLoading, getOnboardingData]);

  // Update onboarding data
  const updateData = useCallback(async (data) => {
    if (!user) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedData = await updateOnboardingData(data);
      setOnboardingData(updatedData);
      setLoading(false);
      return updatedData;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [user, updateOnboardingData]);

  // Reset onboarding data
  const resetData = useCallback(async () => {
    if (!user) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const resetData = await resetOnboardingData();
      setOnboardingData(resetData);
      setLoading(false);
      return resetData;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [user, resetOnboardingData]);

  // Update a specific step
  const updateStepData = useCallback(async (step, data, completed = true) => {
    if (!user) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedData = await updateStep(step, data, completed);
      setOnboardingData(updatedData);
      setLoading(false);
      return updatedData;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [user, updateStep]);

  // Mark a step as completed
  const completeStep = useCallback(async (step, completed = true) => {
    if (!user) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedData = await markStepCompleted(step, completed);
      setOnboardingData(updatedData);
      setLoading(false);
      return updatedData;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [user, markStepCompleted]);

  // Set the current step
  const goToStep = useCallback(async (step) => {
    if (!user) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedData = await setCurrentStep(step);
      setOnboardingData(updatedData);
      setLoading(false);
      return updatedData;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [user, setCurrentStep]);

  // Mark onboarding as completed
  const completeOnboarding = useCallback(async (completed = true) => {
    if (!user) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedData = await markOnboardingCompleted(completed);
      setOnboardingData(updatedData);
      setLoading(false);
      return updatedData;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [user, markOnboardingCompleted]);

  // Check if a step is completed
  const isStepCompleted = useCallback((step) => {
    if (!onboardingData || !onboardingData.steps || !onboardingData.steps[step]) {
      return false;
    }

    return onboardingData.steps[step].completed;
  }, [onboardingData]);

  // Get the current step
  const getCurrentStep = useCallback(() => {
    if (!onboardingData) {
      return 'businessInfo';
    }

    return onboardingData.currentStep;
  }, [onboardingData]);

  // Check if onboarding is completed
  const isOnboardingCompleted = useCallback(() => {
    if (!onboardingData) {
      return false;
    }

    return onboardingData.completed;
  }, [onboardingData]);

  // Get step data
  const getStepData = useCallback((step) => {
    if (!onboardingData || !onboardingData.steps || !onboardingData.steps[step]) {
      return {};
    }

    return onboardingData.steps[step].data || {};
  }, [onboardingData]);

  // Context value
  const value = {
    onboardingData,
    loading: loading || apiLoading,
    error: error || apiError,
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
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

/**
 * Hook for using the onboarding context
 * @returns {Object} Onboarding context
 */
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  
  return context;
}

export default { OnboardingProvider, useOnboarding };
