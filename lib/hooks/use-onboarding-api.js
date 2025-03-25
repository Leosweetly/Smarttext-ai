/**
 * React hook for interacting with the onboarding API
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';

/**
 * Hook for interacting with the onboarding API
 * @returns {Object} Onboarding API methods and state
 */
export function useOnboardingApi() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get onboarding data
   * @returns {Promise<Object>} Onboarding data
   */
  const getOnboardingData = useCallback(async () => {
    if (!user) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/onboarding?userId=${user.sub}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching onboarding data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [user]);

  /**
   * Update onboarding data
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated onboarding data
   */
  const updateOnboardingData = useCallback(async (data) => {
    if (!user) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.sub,
          ...data
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error updating onboarding data: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      setLoading(false);
      return responseData.data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [user]);

  /**
   * Reset onboarding data
   * @returns {Promise<Object>} Reset onboarding data
   */
  const resetOnboardingData = useCallback(async () => {
    if (!user) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.sub
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error resetting onboarding data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setLoading(false);
      return data.data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [user]);

  /**
   * Update a specific step in the onboarding process
   * @param {string} step - Step name (businessInfo, phoneSetup, preferences)
   * @param {Object} data - Step data
   * @param {boolean} completed - Whether the step is completed
   * @returns {Promise<Object>} Updated onboarding data
   */
  const updateStep = useCallback(async (step, data, completed = true) => {
    if (!user) {
      return null;
    }

    const updateData = {
      steps: {
        [step]: {
          data,
          completed
        }
      }
    };

    return updateOnboardingData(updateData);
  }, [user, updateOnboardingData]);

  /**
   * Mark a step as completed
   * @param {string} step - Step name (businessInfo, phoneSetup, preferences)
   * @param {boolean} completed - Whether the step is completed
   * @returns {Promise<Object>} Updated onboarding data
   */
  const markStepCompleted = useCallback(async (step, completed = true) => {
    if (!user) {
      return null;
    }

    const updateData = {
      steps: {
        [step]: {
          completed
        }
      }
    };

    return updateOnboardingData(updateData);
  }, [user, updateOnboardingData]);

  /**
   * Set the current step
   * @param {string} step - Step name (businessInfo, phoneSetup, preferences)
   * @returns {Promise<Object>} Updated onboarding data
   */
  const setCurrentStep = useCallback(async (step) => {
    if (!user) {
      return null;
    }

    const updateData = {
      currentStep: step
    };

    return updateOnboardingData(updateData);
  }, [user, updateOnboardingData]);

  /**
   * Mark the onboarding process as completed
   * @param {boolean} completed - Whether the onboarding process is completed
   * @returns {Promise<Object>} Updated onboarding data
   */
  const markOnboardingCompleted = useCallback(async (completed = true) => {
    if (!user) {
      return null;
    }

    const updateData = {
      completed
    };

    return updateOnboardingData(updateData);
  }, [user, updateOnboardingData]);

  return {
    loading,
    error,
    getOnboardingData,
    updateOnboardingData,
    resetOnboardingData,
    updateStep,
    markStepCompleted,
    setCurrentStep,
    markOnboardingCompleted
  };
}

export default useOnboardingApi;
