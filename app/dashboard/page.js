"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { useMissedCalls, useConversations } from "@/lib/hooks/use-data";
import { useAuth } from "@/lib/auth/context";
import OnboardingBanner from "@/app/components/OnboardingBanner";
import SetupChecklist from "@/app/components/SetupChecklist";

// Check if this is a post-signup redirect and process accordingly
function usePostSignupCheck() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function processPostSignup() {
      if (!user) return;
      
      const checkPostSignup = searchParams.get('checkPostSignup');
      if (!checkPostSignup) return;
      
      // Check if we have signup data in localStorage
      const selectedPlan = localStorage.getItem('selectedPlan');
      const businessPhoneNumber = localStorage.getItem('businessPhoneNumber');
      
      if (!selectedPlan) return;
      
      try {
        setIsProcessing(true);
        
        // Call the post-signup endpoint
        const response = await fetch('/api/auth/post-signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user,
            phoneNumber: businessPhoneNumber || '',
            plan: selectedPlan,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process signup');
        }
        
        // Clear the localStorage data
        localStorage.removeItem('selectedPlan');
        localStorage.removeItem('businessPhoneNumber');
        
        // Initialize onboarding state in localStorage
        const userId = user.sub;
        const now = new Date().toISOString();
        const initialOnboardingState = {
          userId,
          steps: {
            businessInfo: {
              completed: false,
              data: {
                name: user.name || '',
                businessType: '',
                address: '',
              }
            },
            phoneSetup: {
              completed: false,
              data: {
                phoneNumber: businessPhoneNumber || '',
                configured: !!businessPhoneNumber
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
          lastUpdated: now
        };
        
        localStorage.setItem(`onboarding_${userId}`, JSON.stringify(initialOnboardingState));
        
        // Remove the query parameter
        router.replace('/dashboard');
      } catch (err) {
        console.error('Post-signup processing error:', err);
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    }
    
    processPostSignup();
  }, [user, searchParams, router]);
  
  return { isProcessing, error };
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return "Unknown";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Format time
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;
  
  // Format date based on how recent it is
  if (diffDays === 0) {
    return `Today, ${timeString}`;
  } else if (diffDays === 1) {
    return `Yesterday, ${timeString}`;
  } else if (diffDays < 7) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${days[date.getDay()]}, ${timeString}`;
  } else {
    return `${date.toLocaleDateString()}, ${timeString}`;
  }
}

// Helper function to format phone number
function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return "Unknown";
  
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Return original if not a standard format
  return phoneNumber;
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className={styles.loadingSkeleton}>
      <div className={styles.skeletonPulse}></div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [days, setDays] = useState(7);
  
  // Check for post-signup processing
  const { isProcessing: isProcessingSignup, error: signupError } = usePostSignupCheck();
  
  // Fetch missed calls and conversations
  const { missedCalls, isLoading: isLoadingMissedCalls, isError: missedCallsError } = useMissedCalls({ days });
  const { conversations, isLoading: isLoadingConversations, isError: conversationsError } = useConversations({ limit: 10 });
  
  // Calculate stats
  const missedCallsCount = missedCalls.length;
  const autoTextsSent = missedCalls.filter(call => call.autoTextSent).length;
  const responseRate = missedCallsCount > 0 
    ? Math.round((autoTextsSent / missedCallsCount) * 100) 
    : 0;
  
  // Combine missed calls and conversations for activity feed
  const recentActivity = [];
  
  // Add missed calls to activity
  missedCalls.slice(0, 5).forEach(call => {
    recentActivity.push({
      type: 'missed-call',
      id: call.id,
      phoneNumber: call.phoneNumber,
      timestamp: call.timestamp,
      autoTextSent: call.autoTextSent,
      autoTextTimestamp: call.autoTextTimestamp,
    });
    
    // Add auto-text sent activity if applicable
    if (call.autoTextSent) {
      recentActivity.push({
        type: 'auto-text',
        id: `${call.id}-text`,
        phoneNumber: call.phoneNumber,
        timestamp: call.autoTextTimestamp || call.timestamp,
      });
    }
  });
  
  // Add recent conversations to activity
  conversations.slice(0, 3).forEach(convo => {
    if (convo.lastMessageDirection === 'inbound') {
      recentActivity.push({
        type: 'message-received',
        id: convo.id,
        phoneNumber: convo.contactPhone,
        contactName: convo.contactName,
        timestamp: convo.lastMessageDate,
        message: convo.lastMessageText,
      });
    } else {
      recentActivity.push({
        type: 'message-sent',
        id: convo.id,
        phoneNumber: convo.contactPhone,
        contactName: convo.contactName,
        timestamp: convo.lastMessageDate,
        message: convo.lastMessageText,
      });
    }
  });
  
  // Sort activity by timestamp (most recent first)
  recentActivity.sort((a, b) => {
    const dateA = new Date(a.timestamp || 0);
    const dateB = new Date(b.timestamp || 0);
    return dateB - dateA;
  });
  
  // Limit to 4 most recent activities
  const limitedActivity = recentActivity.slice(0, 4);
  
  return (
    <div className={styles.dashboardPage}>
      <h1 className={styles.pageTitle}>Dashboard</h1>
      <p className={styles.slogan}>Texting that works as hard as you do.</p>
      
      <OnboardingBanner />
      
      {signupError && (
        <div className={styles.errorAlert}>
          <p>Error setting up your account: {signupError}</p>
          <p>Please contact support for assistance.</p>
        </div>
      )}
      
      {isProcessingSignup && (
        <div className={styles.loadingContainer}>
          <p>Setting up your account...</p>
          <div className={styles.loadingSkeleton}>
            <div className={styles.skeletonPulse}></div>
          </div>
        </div>
      )}
      
      <div className={styles.statsGrid}>
        <Link href="/dashboard/missed-calls" className={styles.statCardLink}>
          <div className={styles.statCard}>
            <h3>Missed Calls</h3>
            {isLoadingMissedCalls ? (
              <LoadingSkeleton />
            ) : missedCallsError ? (
              <p className={styles.statError}>Error loading data</p>
            ) : (
              <>
                <p className={styles.statValue}>{missedCallsCount}</p>
                <p className={styles.statPeriod}>Last {days} days</p>
              </>
            )}
          </div>
        </Link>
        
        <div className={styles.statCard}>
          <h3>Auto-Texts Sent</h3>
          {isLoadingMissedCalls ? (
            <LoadingSkeleton />
          ) : missedCallsError ? (
            <p className={styles.statError}>Error loading data</p>
          ) : (
            <>
              <p className={styles.statValue}>{autoTextsSent}</p>
              <p className={styles.statPeriod}>Last {days} days</p>
            </>
          )}
        </div>
        
        <div className={styles.statCard}>
          <h3>Response Rate</h3>
          {isLoadingMissedCalls ? (
            <LoadingSkeleton />
          ) : missedCallsError ? (
            <p className={styles.statError}>Error loading data</p>
          ) : (
            <>
              <p className={styles.statValue}>{responseRate}%</p>
              <p className={styles.statPeriod}>Last {days} days</p>
            </>
          )}
        </div>
      </div>
      
      <div className={styles.sectionGrid}>
        <div className={styles.section}>
          <SetupChecklist />
          <div className={styles.sectionHeader}>
            <h2>Quick Settings</h2>
          </div>
          <div className={styles.quickSettings}>
            <Link href="/dashboard/settings" className={styles.settingCard}>
              <h3>Business Hours</h3>
              <p>Update your business hours</p>
            </Link>
            
            <Link href="/dashboard/settings" className={styles.settingCard}>
              <h3>Phone Number</h3>
              <p>Update your phone number</p>
            </Link>
            
            <Link href="/dashboard/settings" className={styles.settingCard}>
              <h3>Address</h3>
              <p>Update your business address</p>
            </Link>
            
            <Link href="/dashboard/settings" className={styles.settingCard}>
              <h3>FAQs</h3>
              <p>Manage frequently asked questions</p>
            </Link>
          </div>
        </div>
        
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Recent Activity</h2>
          </div>
          <div className={styles.activityList}>
            {isLoadingMissedCalls || isLoadingConversations ? (
              <div className={styles.loadingContainer}>
                <LoadingSkeleton />
              </div>
            ) : missedCallsError || conversationsError ? (
              <div className={styles.errorContainer}>
                <p>Error loading activity data</p>
              </div>
            ) : limitedActivity.length === 0 ? (
              <div className={styles.emptyContainer}>
                <p>No recent activity</p>
              </div>
            ) : (
              limitedActivity.map(activity => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityIcon}>
                    {activity.type === 'missed-call' && '📱'}
                    {activity.type === 'auto-text' && '💬'}
                    {activity.type === 'message-received' && '📩'}
                    {activity.type === 'message-sent' && '📤'}
                  </div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>
                      {activity.type === 'missed-call' && (
                        <><strong>Missed call</strong> from {formatPhoneNumber(activity.phoneNumber)}</>
                      )}
                      {activity.type === 'auto-text' && (
                        <><strong>Auto-text sent</strong> to {formatPhoneNumber(activity.phoneNumber)}</>
                      )}
                      {activity.type === 'message-received' && (
                        <><strong>Message received</strong> from {activity.contactName || formatPhoneNumber(activity.phoneNumber)}</>
                      )}
                      {activity.type === 'message-sent' && (
                        <><strong>Message sent</strong> to {activity.contactName || formatPhoneNumber(activity.phoneNumber)}</>
                      )}
                    </p>
                    <p className={styles.activityTime}>{formatDate(activity.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className={styles.viewAll}>
            <Link href="/dashboard/conversations">View all conversations</Link>
          </div>
        </div>
      </div>
      
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Your Subscription</h2>
        </div>
        <div className={styles.subscriptionCard}>
          <div className={styles.subscriptionInfo}>
            <h3>Pro Plan</h3>
            <p className={styles.subscriptionStatus}>
              Trial Period: 5 days remaining
            </p>
            <ul className={styles.subscriptionFeatures}>
              <li>✅ Auto-text for missed calls</li>
              <li>✅ Pre-built industry templates</li>
              <li>✅ Two-way SMS Inbox</li>
              <li>✅ CRM integration</li>
              <li>✅ AI-powered custom replies</li>
              <li>✅ Lead qualification flows</li>
              <li>✅ Shared inbox with team assignments</li>
              <li>✅ SmartText Marketing Tool</li>
            </ul>
          </div>
          <div className={styles.subscriptionActions}>
            <Link href="/dashboard/subscription" className={styles.primaryButton}>
              Manage Subscription
            </Link>
            <Link href="/pricing" className={styles.secondaryButton}>
              View All Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
