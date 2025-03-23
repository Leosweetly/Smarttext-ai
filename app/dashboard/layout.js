"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import styles from "./dashboard.module.css";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?error=unauthorized');
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>Loading...</div>
      </div>
    );
  }
  
  // Don't render the dashboard if not authenticated
  if (!isAuthenticated) {
    return null;
  }
  
  // Get user's name or email
  const userName = user?.name || user?.email || 'User';
  
  // Get user's business name (in a real app, this would come from your database)
  const businessName = user?.businessName || 'Your Business';
  
  // Get user's subscription plan (in a real app, this would come from your database)
  const subscriptionPlan = 'Pro Plan'; // Placeholder
  const trialStatus = 'Trial ends in 5 days'; // Placeholder
  
  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.logo}>SmartText AI</h1>
        </div>
        <nav className={styles.navigation}>
          <Link href="/dashboard" className={styles.navItem}>
            Dashboard
          </Link>
          <Link href="/dashboard/settings" className={styles.navItem}>
            Business Settings
          </Link>
          <Link href="/dashboard/templates" className={styles.navItem}>
            Message Templates
          </Link>
          <Link href="/dashboard/appointment" className={styles.navItem}>
            Appointment Booking
          </Link>
          <Link href="/dashboard/crm" className={styles.navItem}>
            CRM Integration
            <span className={styles.proTag}>Pro</span>
          </Link>
          <Link href="/dashboard/ai-responses" className={styles.navItem}>
            Custom AI Responses
            <span className={styles.proTag}>Pro</span>
          </Link>
          <Link href="/dashboard/leads" className={styles.navItem}>
            Lead Qualification
            <span className={styles.proTag}>Pro</span>
          </Link>
          <Link href="/dashboard/marketing" className={styles.navItem}>
            Marketing Tool
            <span className={styles.proTag}>Pro</span>
          </Link>
          <Link href="/dashboard/locations" className={styles.navItem}>
            Multi-location
            <span className={styles.enterpriseTag}>Enterprise</span>
          </Link>
          <Link href="/dashboard/campaigns" className={styles.navItem}>
            SMS Campaigns
            <span className={styles.enterpriseTag}>Enterprise</span>
          </Link>
          <Link href="/dashboard/support" className={styles.navItem}>
            Priority Support
            <span className={styles.enterpriseTag}>Enterprise</span>
          </Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <Link href="/dashboard/account" className={styles.navItem}>
            Account
          </Link>
          <Link href="/dashboard/subscription" className={styles.navItem}>
            Subscription
          </Link>
          <button 
            className={styles.logoutButton}
            onClick={() => logout('/')}
          >
            Logout
          </button>
        </div>
      </aside>
      <main className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.userInfo}>
              <span className={styles.welcomeText}>Welcome back</span>
              <span className={styles.businessName}>{businessName}</span>
            </div>
            <div className={styles.subscription}>
              <span className={styles.plan}>{subscriptionPlan}</span>
              <span className={styles.trialStatus}>{trialStatus}</span>
            </div>
          </div>
        </header>
        <div className={styles.mainContent}>
          {children}
        </div>
      </main>
    </div>
  );
}
