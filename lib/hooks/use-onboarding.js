import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useOnboardingApi } from './use-onboarding-api';

// Local storage key for onboarding data
const STORAGE_KEY = 'onboardingState';

/**
 * Custom hook for managing onboarding state
 * Combines localStorage for offline/unauthenticated use with API for persistence
 */
export function useOnboarding() {
  const { isAuthenticated, user } = useAuth();
  const { fetchOnboardingData, saveOnboardingData, resetOnboardingData, loading: apiLoading, error: apiError } = useOnboardingApi();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initial onboarding state
  const [onboardingState, setOnboardingState] = useState({
    userId: '',
    steps: {
      businessInfo: {
        completed: false,
        data: {
          name: '',
          businessType: '',
          address: ''
        }
      },
      phoneSetup: {
        completed: false,
        data: {
          phoneNumber: '',
          configured: false
        }
      },
      preferences: {
        completed: false,
        data: {
          notifications: true,
          autoRespond: true,
          theme: 'light'
        }
      }
    },
    currentStep: 'businessInfo',
    completed: false,
    lastUpdated: new Date().toISOString()
  });

  // Load onboarding state on component mount
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to load from localStorage first
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          setOnboardingState(parsedState);
        }
        
        // If authenticated, try to fetch from API
        if (isAuthenticated) {
          try {
            const apiData = await fetchOnboardingData();
            if (apiData) {
              // Use API data if available, as it's the source of truth
              setOnboardingState(apiData);
            } else if (savedState) {
              // If API data not available but we have local data, sync it to API
              const parsedState = JSON.parse(savedState);
              // Ensure userId is set correctly
              parsedState.userId = user?.sub || '';
              await saveOnboardingData(parsedState);
            }
          } catch (apiError) {
            console.error('Error fetching onboarding data from API:', apiError);
            // Continue with localStorage data if API fails
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading onboarding state:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    loadOnboardingState();
  }, [isAuthenticated, user, fetchOnboardingData, saveOnboardingData]);

  // Save onboarding state to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(onboardingState));
    }
  }, [onboardingState, loading]);

  /**
   * Update step data
   * @param {string} stepName - The name of the step to update
   * @param {object} data - The data to update
   */
  const updateStepData = useCallback(async (stepName, data) => {
    try {
      setLoading(true);
      
      // Update local state
      const updatedState = {
        ...onboardingState,
        steps: {
          ...onboardingState.steps,
          [stepName]: {
            ...onboardingState.steps[stepName],
            data: {
              ...onboardingState.steps[stepName].data,
              ...data
            }
          }
        },
        lastUpdated: new Date().toISOString()
      };
      
      // Ensure userId is set if authenticated
      if (isAuthenticated && user) {
        updatedState.userId = user.sub;
      }
      
      setOnboardingState(updatedState);
      
      // Save to API if authenticated
      if (isAuthenticated) {
        try {
          await saveOnboardingData(updatedState);
        } catch (apiError) {
          console.error('Error saving onboarding data to API:', apiError);
          // Continue even if API save fails
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error updating step data:', error);
      setError(error.message);
      setLoading(false);
    }
  }, [onboardingState, isAuthenticated, user, saveOnboardingData]);

  /**
   * Complete a step
   * @param {string} stepName - The name of the step to complete
   */
  const completeStep = useCallback(async (stepName) => {
    try {
      setLoading(true);
      
      // Determine the next step
      const stepOrder = ['businessInfo', 'phoneSetup', 'preferences'];
      const currentIndex = stepOrder.indexOf(stepName);
      const nextStep = currentIndex < stepOrder.length - 1 
        ? stepOrder[currentIndex + 1] 
        : stepName;
      
      // Check if this was the last step
      const isLastStep = currentIndex === stepOrder.length - 1;
      
      // Update local state
      const updatedState = {
        ...onboardingState,
        steps: {
          ...onboardingState.steps,
          [stepName]: {
            ...onboardingState.steps[stepName],
            completed: true
          }
        },
        currentStep: nextStep,
        completed: isLastStep && 
                  onboardingState.steps.businessInfo.completed && 
                  onboardingState.steps.phoneSetup.completed,
        lastUpdated: new Date().toISOString()
      };
      
      // Ensure userId is set if authenticated
      if (isAuthenticated && user) {
        updatedState.userId = user.sub;
      }
      
      setOnboardingState(updatedState);
      
      // Save to API if authenticated
      if (isAuthenticated) {
        try {
          await saveOnboardingData(updatedState);
        } catch (apiError) {
          console.error('Error saving onboarding data to API:', apiError);
          // Continue even if API save fails
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error completing step:', error);
      setError(error.message);
      setLoading(false);
    }
  }, [onboardingState, isAuthenticated, user, saveOnboardingData]);

  /**
   * Go to a specific step
   * @param {string} stepName - The name of the step to go to
   */
  const goToStep = useCallback(async (stepName) => {
    try {
      setLoading(true);
      
      // Update local state
      const updatedState = {
        ...onboardingState,
        currentStep: stepName,
        lastUpdated: new Date().toISOString()
      };
      
      // Ensure userId is set if authenticated
      if (isAuthenticated && user) {
        updatedState.userId = user.sub;
      }
      
      setOnboardingState(updatedState);
      
      // Save to API if authenticated
      if (isAuthenticated) {
        try {
          await saveOnboardingData(updatedState);
        } catch (apiError) {
          console.error('Error saving onboarding data to API:', apiError);
          // Continue even if API save fails
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error going to step:', error);
      setError(error.message);
      setLoading(false);
    }
  }, [onboardingState, isAuthenticated, user, saveOnboardingData]);

  /**
   * Reset onboarding state
   */
  const reset = useCallback(async () => {
    try {
      setLoading(true);
      
      // Reset local state
      const resetState = {
        userId: isAuthenticated && user ? user.sub : '',
        steps: {
          businessInfo: {
            completed: false,
            data: {
              name: '',
              businessType: '',
              address: ''
            }
          },
          phoneSetup: {
            completed: false,
            data: {
              phoneNumber: '',
              configured: false
            }
          },
          preferences: {
            completed: false,
            data: {
              notifications: true,
              autoRespond: true,
              theme: 'light'
            }
          }
        },
        currentStep: 'businessInfo',
        completed: false,
        lastUpdated: new Date().toISOString()
      };
      
      setOnboardingState(resetState);
      
      // Reset on API if authenticated
      if (isAuthenticated) {
        try {
          await resetOnboardingData();
        } catch (apiError) {
          console.error('Error resetting onboarding data on API:', apiError);
          // Continue even if API reset fails
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      setError(error.message);
      setLoading(false);
    }
  }, [isAuthenticated, user, resetOnboardingData]);

  return {
    onboardingState,
    loading: loading || apiLoading,
    error: error || apiError,
    updateStepData,
    completeStep,
    goToStep,
    reset,
    isAuthenticated
  };
}
