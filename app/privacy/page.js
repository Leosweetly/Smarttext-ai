import Link from "next/link";
import styles from "../terms/legal.module.css";

export default function PrivacyPage() {
  return (
    <div className={styles.legalPage}>
      <div className={styles.legalContainer}>
        <header className={styles.header}>
          <Link href="/" className={styles.logo}>
            SmartText AI
          </Link>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.lastUpdated}>Effective Date: January 1, 2025</p>
        </header>
        
        <div className={styles.content}>
          <p>
            This Privacy Policy explains how SmartText AI ("we", "our", or "us") collects, uses, and protects your personal information when you use our software and services.
          </p>
          
          <section className={styles.section}>
            <h2>1. Information We Collect</h2>
            <p>
              We collect the following types of information:
            </p>
            <ul>
              <li>Account Information: Your name, email address, business name, and contact details when you create an account.</li>
              <li>Communication Data: SMS message content, timestamps, phone numbers, and other metadata to facilitate and log communication.</li>
              <li>Technical Information: IP address, browser type, device info, and usage behavior to improve system performance.</li>
              <li>Payment Information: We use a third-party provider (e.g., Stripe) to process payments securely. We do not store your credit card information.</li>
            </ul>
          </section>
          
          <section className={styles.section}>
            <h2>2. How We Use Your Information</h2>
            <p>
              We use the data we collect to:
            </p>
            <ul>
              <li>Provide and operate the SmartText AI service</li>
              <li>Send administrative updates (e.g., service alerts, billing notices)</li>
              <li>Improve and personalize your experience</li>
              <li>Monitor system performance and prevent abuse</li>
              <li>Ensure compliance with legal obligations</li>
            </ul>
          </section>
          
          <section className={styles.section}>
            <h2>3. Data Sharing</h2>
            <p>
              We do not sell your personal data. We only share information with third parties under the following circumstances:
            </p>
            <ul>
              <li>With service providers under contract who help with business operations (e.g., hosting, SMS delivery, payment processing)</li>
              <li>If required by law or to protect legal rights</li>
              <li>During a merger, acquisition, or sale of assets, with notice provided</li>
            </ul>
          </section>
          
          <section className={styles.section}>
            <h2>4. Data Security</h2>
            <p>
              We take industry-standard measures to protect your data, including encryption, secure APIs, and strict access controls.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>5. Data Retention</h2>
            <p>
              We retain your information only for as long as needed to provide services, comply with legal obligations, resolve disputes, and enforce our agreements.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>6. Your Rights</h2>
            <p>
              You may request to:
            </p>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Correct or update your information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of non-essential communications</li>
            </ul>
            <p>
              To make a request, email us at kdavis72490@gmail.com
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we will notify you via email or through our service before the changes take effect.
            </p>
          </section>
          
          <section className={styles.section}>
            <h2>8. Contact Information</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p>
              SmartText AI<br />
              Email: kdavis72490@gmail.com
            </p>
          </section>
        </div>
        
        <footer className={styles.footer}>
          <p>© 2025 SmartText AI. All rights reserved.</p>
          <div className={styles.footerLinks}>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/about">About Us</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
