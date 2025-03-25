"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useOnboarding } from "@/lib/onboarding/context";
import styles from "./onboarding.module.css";

export default function OnboardingIndexPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { 
    onboardingData, 
    loading: isOnboardingLoading, 
    error: onboardingError,
    getCurrentStep,
    isOnboardingCompleted
  } = useOnboarding();
  
  // Redirect to the appropriate step or dashboard
  useEffect(() => {
    if (!isAuthLoading && !isOnboardingLoading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/login?returnTo=/onboarding');
        return;
      }
      
      if (isOnboardingCompleted()) {
        // Redirect to dashboard if onboarding is completed
        router.push('/dashboard');
        return;
      }
      
      // Redirect to the current step
      const currentStep = getCurrentStep();
      router.push(`/onboarding/${currentStep}`);
    }
  }, [isAuthLoading, isOnboardingLoading, user, router, getCurrentStep, isOnboardingCompleted]);
  
  // Show loading state
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>Loading your onboarding progress...</p>
    </div>
  );
}
