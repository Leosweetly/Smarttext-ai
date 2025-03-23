/**
 * Demo context provider for managing the state of the demo
 */

"use client";

import { createContext, useContext, useState, useCallback } from "react";

// Create the context
const DemoContext = createContext(null);

/**
 * Demo context provider component
 */
export function DemoProvider({ children }) {
  // Demo state
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedBusinessType, setSelectedBusinessType] = useState("restaurant");
  const [selectedTier, setSelectedTier] = useState("basic");
  const [selectedScenario, setSelectedScenario] = useState("availability");
  const [customMessage, setCustomMessage] = useState("");
  const [customPhoneNumber, setCustomPhoneNumber] = useState("");
  const [demoResults, setDemoResults] = useState(null);
  const [error, setError] = useState(null);
  const [tierComparison, setTierComparison] = useState(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);

  /**
   * Reset the demo state
   */
  const resetDemo = useCallback(() => {
    setCurrentStep(0);
    setIsRunning(false);
    setIsComplete(false);
    setDemoResults(null);
    setError(null);
    setTierComparison(null);
  }, []);

  /**
   * Start the demo with the current settings
   */
  const startDemo = useCallback(async () => {
    try {
      setIsRunning(true);
      setIsComplete(false);
      setError(null);
      setDemoResults(null);
      
      // Call the API to run the demo
      const response = await fetch("/demo/api/missed-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessType: selectedBusinessType,
          tier: selectedTier,
          scenarioId: selectedScenario,
          customMessage: customMessage,
          customPhoneNumber: customPhoneNumber,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to run demo");
      }
      
      setDemoResults(data);
      setIsComplete(true);
      return data; // Return the results for use in autoRunDemo
    } catch (err) {
      setError(err.message || "An error occurred while running the demo");
      console.error("Demo error:", err);
      return null;
    } finally {
      setIsRunning(false);
    }
  }, [selectedBusinessType, selectedTier, selectedScenario, customMessage, customPhoneNumber]);

  /**
   * Load tier comparison data
   */
  const loadTierComparison = useCallback(async () => {
    try {
      setIsLoadingComparison(true);
      setError(null);
      
      // Build the query string
      const queryParams = new URLSearchParams({
        businessType: selectedBusinessType,
        scenarioId: selectedScenario,
      });
      
      if (selectedScenario === "custom" && customMessage) {
        queryParams.append("customMessage", customMessage);
      }
      
      // Call the API to get tier comparison
      const response = await fetch(`/demo/api/missed-call?${queryParams.toString()}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to load tier comparison");
      }
      
      setTierComparison(data);
    } catch (err) {
      setError(err.message || "An error occurred while loading tier comparison");
      console.error("Tier comparison error:", err);
    } finally {
      setIsLoadingComparison(false);
    }
  }, [selectedBusinessType, selectedScenario, customMessage]);

  /**
   * Go to a specific step in the demo
   */
  const goToStep = useCallback((step) => {
    if (step >= 0 && step <= (demoResults?.steps?.length || 0)) {
      setCurrentStep(step);
    }
  }, [demoResults]);

  /**
   * Go to the next step in the demo
   */
  const nextStep = useCallback(() => {
    if (currentStep < (demoResults?.steps?.length || 0)) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, demoResults]);

  /**
   * Go to the previous step in the demo
   */
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  /**
   * Run the demo automatically
   */
  const autoRunDemo = useCallback(async () => {
    // Wait for the demo to start and get the results
    const results = await startDemo();
    
    if (results && results.steps) {
      // Auto-advance through steps with delays
      const stepDelay = 2000; // 2 seconds per step
      
      for (let i = 0; i < results.steps.length; i++) {
        setTimeout(() => {
          setCurrentStep(i);
        }, i * stepDelay);
      }
    }
  }, [startDemo]);

  // Context value
  const contextValue = {
    // State
    currentStep,
    isRunning,
    isComplete,
    selectedBusinessType,
    selectedTier,
    selectedScenario,
    customMessage,
    customPhoneNumber,
    demoResults,
    error,
    tierComparison,
    isLoadingComparison,
    
    // Actions
    setSelectedBusinessType,
    setSelectedTier,
    setSelectedScenario,
    setCustomMessage,
    setCustomPhoneNumber,
    resetDemo,
    startDemo,
    loadTierComparison,
    goToStep,
    nextStep,
    prevStep,
    autoRunDemo,
  };

  return (
    <DemoContext.Provider value={contextValue}>
      {children}
    </DemoContext.Provider>
  );
}

/**
 * Hook to use the demo context
 */
export function useDemo() {
  const context = useContext(DemoContext);
  
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  
  return context;
}
