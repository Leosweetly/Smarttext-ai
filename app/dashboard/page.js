import Link from "next/link";
import styles from "./page.module.css";

export default function DashboardPage() {
  return (
    <div className={styles.dashboardPage}>
      <h1 className={styles.pageTitle}>Dashboard</h1>
      <p className={styles.slogan}>Texting that works as hard as you do.</p>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Missed Calls</h3>
          <p className={styles.statValue}>24</p>
          <p className={styles.statPeriod}>Last 7 days</p>
        </div>
        
        <div className={styles.statCard}>
          <h3>Auto-Texts Sent</h3>
          <p className={styles.statValue}>24</p>
          <p className={styles.statPeriod}>Last 7 days</p>
        </div>
        
        <div className={styles.statCard}>
          <h3>Response Rate</h3>
          <p className={styles.statValue}>68%</p>
          <p className={styles.statPeriod}>Last 7 days</p>
        </div>
      </div>
      
      <div className={styles.sectionGrid}>
        <div className={styles.section}>
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
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>📱</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}>
                  <strong>Missed call</strong> from (555) 123-4567
                </p>
                <p className={styles.activityTime}>Today, 2:34 PM</p>
              </div>
            </div>
            
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>💬</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}>
                  <strong>Auto-text sent</strong> to (555) 123-4567
                </p>
                <p className={styles.activityTime}>Today, 2:34 PM</p>
              </div>
            </div>
            
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>📱</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}>
                  <strong>Missed call</strong> from (555) 987-6543
                </p>
                <p className={styles.activityTime}>Today, 11:15 AM</p>
              </div>
            </div>
            
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>💬</div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}>
                  <strong>Auto-text sent</strong> to (555) 987-6543
                </p>
                <p className={styles.activityTime}>Today, 11:15 AM</p>
              </div>
            </div>
          </div>
          <div className={styles.viewAll}>
            <Link href="/dashboard/activity">View all activity</Link>
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
