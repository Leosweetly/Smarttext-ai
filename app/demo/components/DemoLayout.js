/**
 * DemoLayout component
 * Organizes the different sections of the demo page
 */

"use client";

import { useState } from "react";
import MissedCallSimulator from "./MissedCallSimulator";
import TierComparisonView from "./TierComparisonView";
import DemoStats from "./DemoStats";
import styles from "./DemoLayout.module.css";

export default function DemoLayout() {
  const [activeTab, setActiveTab] = useState("simulator");

  // Tabs for the demo
  const tabs = [
    { id: "simulator", label: "Missed Call Simulator" },
    { id: "comparison", label: "Tier Comparison" },
    { id: "stats", label: "Demo Stats" },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>SmartText AI Demo</h1>
        <p className={styles.subtitle}>
          Interactive demonstration of our AI-powered missed call response system
        </p>
      </header>

      <div className={styles.intro}>
        <div className={styles.introContent}>
          <h2>Welcome to the SmartText AI Demo</h2>
          <p>
            This interactive demo showcases how SmartText AI helps businesses
            respond to missed calls automatically with intelligent, personalized
            text messages.
          </p>
          <p>
            <strong>Imagine it's a busy Monday</strong> and you miss 3 calls
            while helping other customers. SmartText AI automatically sends a
            text response to those missed calls, helping you capture business
            that would otherwise be lost.
          </p>
          <div className={styles.keyFeatures}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📱</div>
              <h3>Instant Response</h3>
              <p>
                Automatically respond to missed calls with personalized text
                messages
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🤖</div>
              <h3>AI-Powered</h3>
              <p>
                Generate intelligent responses based on your business type and
                customer inquiries
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📊</div>
              <h3>Business Integration</h3>
              <p>
                Seamlessly connect with your CRM, calendar, and booking systems
              </p>
            </div>
          </div>
        </div>
      </div>

      <nav className={styles.tabNav}>
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${
                activeTab === tab.id ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab(tab.id)}
              style={{ cursor: 'pointer', padding: '1rem 1.5rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className={styles.content}>
        {activeTab === "simulator" && <MissedCallSimulator />}
        {activeTab === "comparison" && <TierComparisonView />}
        {activeTab === "stats" && <DemoStats />}
      </main>

      <footer className={styles.footer}>
        <div className={styles.pricingSection}>
          <h2>Pricing Plans</h2>
          <div className={styles.pricingCards}>
            <div className={styles.pricingCard}>
              <h3>Core Plan</h3>
              <div className={styles.price}>$249<span>/month</span></div>
              <ul className={styles.features}>
                <li>Auto-text for missed calls</li>
                <li>Pre-built industry templates</li>
                <li>Two-way SMS Inbox</li>
                <li>Basic contact log + history</li>
              </ul>
              <button className={styles.pricingButton}>Get Started</button>
            </div>
            <div className={`${styles.pricingCard} ${styles.featured}`}>
              <div className={styles.popularBadge}>Most Popular</div>
              <h3>Pro Plan</h3>
              <div className={styles.price}>$399<span>/month</span></div>
              <ul className={styles.features}>
                <li>CRM integration</li>
                <li>AI-powered custom replies</li>
                <li>Lead qualification flows</li>
                <li>Shared inbox with team assignments</li>
                <li>Advanced tagging & notes</li>
              </ul>
              <button className={`${styles.pricingButton} ${styles.featuredButton}`}>
                Get Started
              </button>
            </div>
            <div className={styles.pricingCard}>
              <h3>Growth Plan</h3>
              <div className={styles.price}>$599+<span>/month</span></div>
              <ul className={styles.features}>
                <li>Multi-location support</li>
                <li>Priority onboarding & support</li>
                <li>AI training on documents & FAQs</li>
                <li>Bulk SMS campaigns</li>
                <li>Advanced analytics dashboard</li>
                <li>SLA response time guarantee</li>
              </ul>
              <button className={styles.pricingButton}>Contact Sales</button>
            </div>
          </div>
        </div>
        <div className={styles.copyright}>
          © {new Date().getFullYear()} SmartText AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
