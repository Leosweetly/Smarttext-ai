/**
 * DemoStats component
 * Displays statistics about the demo
 */

"use client";

import { useEffect, useState } from "react";
import { getDemoStats } from "../lib/demo-controller";
import styles from "./DemoStats.module.css";

export default function DemoStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load demo statistics
    setLoading(true);
    const demoStats = getDemoStats();
    setStats(demoStats);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>SmartText AI Performance</h2>
        <p>Key metrics and statistics from our platform</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📱</div>
          <div className={styles.statValue}>{stats?.missedCallsHandled.toLocaleString()}</div>
          <div className={styles.statLabel}>Missed Calls Handled</div>
          <div className={styles.statDescription}>
            Total number of missed calls automatically responded to by SmartText AI
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏱️</div>
          <div className={styles.statValue}>{stats?.averageResponseTime}s</div>
          <div className={styles.statLabel}>Average Response Time</div>
          <div className={styles.statDescription}>
            Average time between a missed call and automated text response
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📈</div>
          <div className={styles.statValue}>{stats?.conversionRate}</div>
          <div className={styles.statLabel}>Conversion Rate</div>
          <div className={styles.statDescription}>
            Percentage of missed calls that resulted in customer engagement
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>⭐</div>
          <div className={styles.statValue}>{stats?.customerSatisfaction}</div>
          <div className={styles.statLabel}>Customer Satisfaction</div>
          <div className={styles.statDescription}>
            Average rating from customers who received automated responses
          </div>
        </div>
      </div>

      <div className={styles.businessTypesSection}>
        <h3>Top Business Types Using SmartText AI</h3>
        <div className={styles.businessTypes}>
          {stats?.topBusinessTypes.map((business, index) => (
            <div key={index} className={styles.businessTypeItem}>
              <div className={styles.businessTypeBar}>
                <div
                  className={styles.businessTypeProgress}
                  style={{
                    width: business.percentage,
                    backgroundColor: getBarColor(index),
                  }}
                ></div>
              </div>
              <div className={styles.businessTypeLabel}>
                <span>{business.type}</span>
                <span className={styles.businessTypePercentage}>
                  {business.percentage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.testimonials}>
        <h3>What Our Customers Say</h3>
        <div className={styles.testimonialCards}>
          <div className={styles.testimonialCard}>
            <div className={styles.testimonialContent}>
              "SmartText AI has been a game-changer for our restaurant. We've captured 30% more bookings from missed calls, and customers love the instant responses."
            </div>
            <div className={styles.testimonialAuthor}>
              <div className={styles.testimonialAvatar}>JD</div>
              <div className={styles.testimonialInfo}>
                <div className={styles.testimonialName}>John Doe</div>
                <div className={styles.testimonialBusiness}>Delicious Eats Restaurant</div>
              </div>
            </div>
          </div>

          <div className={styles.testimonialCard}>
            <div className={styles.testimonialContent}>
              "As an auto shop owner, I'm always busy with repairs. SmartText AI makes sure I never miss a potential customer. It's paid for itself many times over."
            </div>
            <div className={styles.testimonialAuthor}>
              <div className={styles.testimonialAvatar}>JS</div>
              <div className={styles.testimonialInfo}>
                <div className={styles.testimonialName}>Jane Smith</div>
                <div className={styles.testimonialBusiness}>Quick Fix Auto Shop</div>
              </div>
            </div>
          </div>

          <div className={styles.testimonialCard}>
            <div className={styles.testimonialContent}>
              "The personalized responses are impressive. Our clients think they're talking to a real person, and we've seen a significant increase in bookings."
            </div>
            <div className={styles.testimonialAuthor}>
              <div className={styles.testimonialAvatar}>RJ</div>
              <div className={styles.testimonialInfo}>
                <div className={styles.testimonialName}>Robert Johnson</div>
                <div className={styles.testimonialBusiness}>Glamour Styles Salon</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.callToAction}>
        <h3>Ready to Never Miss a Customer Again?</h3>
        <p>
          Join thousands of businesses using SmartText AI to capture missed
          opportunities and provide exceptional customer service.
        </p>
        <button className={styles.ctaButton}>Start Your Free Trial</button>
      </div>
    </div>
  );
}

// Helper function to get different colors for the business type bars
function getBarColor(index) {
  const colors = [
    "#0070f3", // Blue
    "#00c853", // Green
    "#ff9100", // Orange
    "#d500f9", // Purple
  ];
  return colors[index % colors.length];
}
